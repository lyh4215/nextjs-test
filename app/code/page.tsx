"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type ParseError = {
  line?: number
  message: string
}

type PositionedToken = {
  text: string
  start: number
  end: number
  center: number
}

type SlotMapping = {
  order: number
  question: string
  answer: string | null
  questionStart: number
  questionEnd: number
  questionCenter: number
  matchedAnswerStart: number | null
  matchedAnswerEnd: number | null
  matched: boolean
}

type Pair = {
  questionLine: string
  answerLine: string | null
  questionLineNumber: number
  answerLineNumber: number | null
  mappings: SlotMapping[]
}

type ParsedResult = {
  title: string | null
  start: string | null
  end: string | null
  startLine: number | null
  endLine: number | null
  pairs: Pair[]
  errors: ParseError[]
  isValid: boolean
}

type LineInfo = {
  raw: string
  trimmed: string
  line: number
}

const MONO_KO_STYLE: React.CSSProperties = {
  fontFamily:
    "'굴림체','GulimChe','D2Coding','NanumGothicCoding','IBM Plex Mono','JetBrains Mono','Consolas',monospace",
  fontVariantLigatures: "none",
  fontVariantNumeric: "tabular-nums lining-nums",
  fontFeatureSettings: '"tnum" 1, "lnum" 1, "liga" 0, "calt" 0',
  letterSpacing: "0",
  wordSpacing: "0",
  textRendering: "optimizeSpeed",
}

function normalizeLine(line: string) {
  return line.replace(/\t/g, "    ")
}

function extractPositionedTokens(line: string): PositionedToken[] {
  const normalized = normalizeLine(line)
  const tokens: PositionedToken[] = []
  const regex = /\S+/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(normalized)) !== null) {
    const text = match[0]
    const start = match.index
    const end = start + text.length
    tokens.push({
      text,
      start,
      end,
      center: (start + end) / 2,
    })
  }

  return tokens
}

function mapByVisualColumns(questionLine: string, answerLine: string | null): SlotMapping[] {
  const questionTokens = extractPositionedTokens(questionLine)
  const answerTokens = answerLine ? extractPositionedTokens(answerLine) : []
  const usedAnswerIndexes = new Set<number>()

  return questionTokens.map((questionToken, index) => {
    let chosenIndex: number | null = null
    let bestDistance = Number.POSITIVE_INFINITY

    for (let i = 0; i < answerTokens.length; i++) {
      if (usedAnswerIndexes.has(i)) continue

      const answerToken = answerTokens[i]
      const distance = Math.abs(answerToken.center - questionToken.center)
      const tolerance = Math.max(2, Math.ceil(questionToken.text.length / 2) + 1)

      if (distance <= tolerance && distance < bestDistance) {
        chosenIndex = i
        bestDistance = distance
      }
    }

    if (chosenIndex !== null) {
      usedAnswerIndexes.add(chosenIndex)
      const matchedAnswer = answerTokens[chosenIndex]

      return {
        order: index + 1,
        question: questionToken.text,
        answer: matchedAnswer.text,
        questionStart: questionToken.start,
        questionEnd: questionToken.end,
        questionCenter: questionToken.center,
        matchedAnswerStart: matchedAnswer.start,
        matchedAnswerEnd: matchedAnswer.end,
        matched: true,
      }
    }

    return {
      order: index + 1,
      question: questionToken.text,
      answer: null,
      questionStart: questionToken.start,
      questionEnd: questionToken.end,
      questionCenter: questionToken.center,
      matchedAnswerStart: null,
      matchedAnswerEnd: null,
      matched: false,
    }
  })
}

function findUnmatchedAnswerTokens(questionLine: string, answerLine: string | null) {
  if (!answerLine) return []

  const questionTokens = extractPositionedTokens(questionLine)
  const answerTokens = extractPositionedTokens(answerLine)
  const usedAnswerIndexes = new Set<number>()

  for (const questionToken of questionTokens) {
    let chosenIndex: number | null = null
    let bestDistance = Number.POSITIVE_INFINITY

    for (let i = 0; i < answerTokens.length; i++) {
      if (usedAnswerIndexes.has(i)) continue

      const answerToken = answerTokens[i]
      const distance = Math.abs(answerToken.center - questionToken.center)
      const tolerance = Math.max(2, Math.ceil(questionToken.text.length / 2) + 1)

      if (distance <= tolerance && distance < bestDistance) {
        chosenIndex = i
        bestDistance = distance
      }
    }

    if (chosenIndex !== null) {
      usedAnswerIndexes.add(chosenIndex)
    }
  }

  return answerTokens.filter((_, index) => !usedAnswerIndexes.has(index))
}

function parseQuizInput(raw: string): ParsedResult {
  const normalized = raw.replace(/\r\n/g, "\n")
  const originalLines = normalized.split("\n")

  const lines: LineInfo[] = originalLines.map((line, index) => ({
    raw: normalizeLine(line),
    trimmed: line.trim(),
    line: index + 1,
  }))

  const nonEmpty = lines.filter((line) => line.trimmed.length > 0)
  const errors: ParseError[] = []

  if (nonEmpty.length === 0) {
    return {
      title: null,
      start: null,
      end: null,
      startLine: null,
      endLine: null,
      pairs: [],
      errors: [],
      isValid: false,
    }
  }

  let title: string | null = null

  const first = nonEmpty[0]
  if (first.trimmed.endsWith(">") && first.trimmed !== "시작>" && first.trimmed !== "끝>") {
    title = first.trimmed.slice(0, -1).trim() || first.trimmed
  }

  const startLineIndex = lines.findIndex((line) => line.trimmed === "시작>")
  const endLineIndex = lines.findIndex((line) => line.trimmed === "끝>")

  if (startLineIndex === -1) {
    errors.push({ message: "`시작>` 줄이 없습니다." })
  }
  if (endLineIndex === -1) {
    errors.push({ message: "`끝>` 줄이 없습니다." })
  }

  if (startLineIndex !== -1 && endLineIndex !== -1 && endLineIndex < startLineIndex) {
    errors.push({
      line: lines[endLineIndex].line,
      message: "`끝>`가 `시작>`보다 먼저 나왔습니다.",
    })
  }

  const startLine = startLineIndex !== -1 ? lines[startLineIndex].line : null
  const endLine = endLineIndex !== -1 ? lines[endLineIndex].line : null
  const pairs: Pair[] = []

  if (startLineIndex !== -1 && endLineIndex !== -1 && startLineIndex < endLineIndex) {
    const between = lines.slice(startLineIndex + 1, endLineIndex)

    if (between.length === 0) {
      errors.push({
        line: lines[startLineIndex].line,
        message: "`시작>`와 `끝>` 사이에 내용이 없습니다.",
      })
    }

    for (let i = 0; i < between.length; i += 2) {
      const questionLine = between[i]
      const answerLine = between[i + 1]

      if (!questionLine) break

      const mappings = mapByVisualColumns(questionLine.raw, answerLine?.raw ?? null)

      pairs.push({
        questionLine: questionLine.raw,
        answerLine: answerLine?.raw ?? null,
        questionLineNumber: questionLine.line,
        answerLineNumber: answerLine?.line ?? null,
        mappings,
      })

      if (!answerLine) {
        errors.push({
          line: questionLine.line,
          message: "퀴즈 줄 아래에 대응되는 답안 줄이 없습니다.",
        })
        continue
      }

      const questionTokens = extractPositionedTokens(questionLine.raw)
      if (questionTokens.length === 0) {
        errors.push({
          line: questionLine.line,
          message: "퀴즈 줄에 토큰이 없습니다.",
        })
      }

      const unmatchedAnswerTokens = findUnmatchedAnswerTokens(questionLine.raw, answerLine.raw)
      if (unmatchedAnswerTokens.length > 0) {
        for (const token of unmatchedAnswerTokens) {
          errors.push({
            line: answerLine.line,
            message: `답안 토큰 "${token.text}"가 위 퀴즈 컬럼과 대응되지 않습니다.`,
          })
        }
      }
    }

    const before = lines.slice(0, startLineIndex).filter((line) => line.trimmed.length > 0)
    const after = lines.slice(endLineIndex + 1).filter((line) => line.trimmed.length > 0)

    for (const item of before) {
      if (title !== null && item.line === first.line) continue
      errors.push({
        line: item.line,
        message: "`시작>` 앞에 해석되지 않은 줄이 있습니다.",
      })
    }

    for (const item of after) {
      errors.push({
        line: item.line,
        message: "`끝>` 뒤에 해석되지 않은 줄이 있습니다.",
      })
    }
  }

  return {
    title,
    start: startLine !== null ? "시작>" : null,
    end: endLine !== null ? "끝>" : null,
    startLine,
    endLine,
    pairs,
    errors,
    isValid: errors.length === 0 && pairs.length > 0,
  }
}

function buildConfirmedData(parsed: ParsedResult) {
  return {
    title: parsed.title,
    start: parsed.start,
    question: parsed.pairs.flatMap((pair) => pair.mappings.map((mapping) => mapping.question)),
    answer: parsed.pairs.flatMap((pair) => pair.mappings.map((mapping) => mapping.answer)),
    end: parsed.end,
  }
}

function MappingGridRow({ mappings }: { mappings: SlotMapping[] }) {
  return (
    <div className="overflow-x-auto">
      <div className="inline-grid auto-cols-[minmax(42px,max-content)] grid-flow-col gap-1">
        {mappings.map((mapping) => (
          <div
            key={`grid-${mapping.order}`}
            className={cn(
              "flex min-h-[46px] flex-col items-center justify-center rounded-md border px-2 py-1 text-center",
              mapping.matched
                ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950/40"
                : "border-dashed border-red-300 bg-background dark:border-red-800",
            )}
          >
            <span className="font-mono text-xs text-blue-700 dark:text-blue-200">{mapping.question}</span>
            <span className="my-0.5 h-px w-4 bg-border" />
            <div
              className={cn(
                "font-mono text-[11px]",
                mapping.matched ? "text-red-700 dark:text-red-200" : "text-red-400 dark:text-red-500",
              )}
            >
              {mapping.answer ?? "·"}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DraftOverview({ parsed }: { parsed: ParsedResult }) {
  const hasPreviewLines =
    Boolean(parsed.title) || Boolean(parsed.start) || parsed.pairs.length > 0 || Boolean(parsed.end)

  if (!hasPreviewLines) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        아직 파싱할 슬롯이 없습니다.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold">실시간 파싱 프리뷰</div>
      <div
        className="space-y-2 rounded-md border bg-background px-3 py-3 font-mono text-sm"
        style={MONO_KO_STYLE}
      >
        {parsed.title && (
          <div className="rounded-md bg-slate-100 px-3 py-2 text-slate-700 dark:bg-slate-900 dark:text-slate-200">
            {parsed.title}&gt;
          </div>
        )}

        {parsed.start && (
          <div className="rounded-md bg-gray-100 px-3 py-2 text-gray-700 dark:bg-gray-900 dark:text-gray-200">
            {parsed.start}
          </div>
        )}

        {parsed.pairs.map((pair) => (
          <div key={`pair-${pair.questionLineNumber}`} className="py-0.5">
            <MappingGridRow mappings={pair.mappings} />
          </div>
        ))}

        {parsed.end && (
          <div className="rounded-md bg-gray-100 px-3 py-2 text-gray-700 dark:bg-gray-900 dark:text-gray-200">
            {parsed.end}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Page() {
  const [rawInput, setRawInput] = React.useState(`퀴즈1번>
시작>
A   B   C   D   E   A   B
1   2       4   5       2
K   L   M   N   O
    x       y
끝>`)

  const parsedDraft = React.useMemo(() => parseQuizInput(rawInput), [rawInput])
  const [confirmedData, setConfirmedData] = React.useState<ReturnType<typeof buildConfirmedData> | null>(null)
  const [appliedAt, setAppliedAt] = React.useState<string | null>(null)

  const handleConfirm = () => {
    if (!parsedDraft.isValid) return
    setConfirmedData(buildConfirmedData(parsedDraft))
    setAppliedAt(new Date().toLocaleString("ko-KR"))
  }

  const handleReset = () => {
    setConfirmedData(null)
    setAppliedAt(null)
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 p-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">퀴즈 입력 파서</h1>
        <p className="text-sm text-muted-foreground">
          공백 정렬을 기준으로 퀴즈와 답안의 1:1 대응을 검사합니다. 답안이 비어 있어도 해당 칸은
          유지된 것으로 간주합니다.
        </p>
      </div>

      <div className="mx-auto w-full max-w-[720px]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>원문 입력</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              className="min-h-[520px] font-mono text-sm leading-7"
              style={MONO_KO_STYLE}
              placeholder={`퀴즈1번>
시작>
A   B   C   D
1   2       4
끝>`}
            />

            <DraftOverview parsed={parsedDraft} />

            <div className="rounded-lg border bg-muted/40 p-4 text-sm">
              <div className="mb-2 font-semibold">규칙</div>
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                <li>제목 줄은 예: <code className="rounded bg-muted px-1 py-0.5">퀴즈1번&gt;</code></li>
                <li><code className="rounded bg-muted px-1 py-0.5">시작&gt;</code> 과 <code className="rounded bg-muted px-1 py-0.5">끝&gt;</code> 사이만 본문입니다.</li>
                <li>본문은 2줄씩 읽습니다. 위 줄은 퀴즈, 바로 아래 줄은 답안입니다.</li>
                <li>split으로 끊지 않고, 공백 정렬 위치를 기준으로 아래 답안이 어느 퀴즈 컬럼에 놓였는지 판단합니다.</li>
                <li>폰트는 반드시 <strong>모노스페이스</strong> 기준으로 쓰는 게 좋습니다.</li>
              </ul>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleConfirm} disabled={!parsedDraft.isValid}>
                이대로 적용
              </Button>
              <Button variant="outline" onClick={handleReset}>
                적용 결과 초기화
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
            <CardHeader>
              <CardTitle>확정된 결과</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {parsedDraft.isValid ? (
                  <Badge className="bg-green-600 hover:bg-green-600">유효함</Badge>
                ) : (
                  <Badge variant="destructive">수정 필요</Badge>
                )}
                {parsedDraft.title && (
                  <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-900 dark:text-gray-200">
                    제목: {parsedDraft.title}
                  </span>
                )}
                {parsedDraft.startLine !== null && (
                  <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-900 dark:text-gray-200">
                    시작&gt; line {parsedDraft.startLine}
                  </span>
                )}
                {parsedDraft.endLine !== null && (
                  <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700 dark:bg-gray-900 dark:text-gray-200">
                    끝&gt; line {parsedDraft.endLine}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-sm font-semibold">파싱 상태</div>
                {parsedDraft.errors.length === 0 ? (
                  <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-200">
                    현재 입력은 공백 정렬 기준으로 정상 파싱될 예정입니다.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {parsedDraft.errors.map((error, index) => (
                      <div
                        key={`${error.message}-${index}`}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
                      >
                        {error.line ? `line ${error.line}: ` : ""}
                        {error.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {!confirmedData ? (
                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                  아직 적용된 결과가 없습니다.
                </div>
              ) : (
                <>
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <div className="mb-1 text-sm font-semibold">적용 완료</div>
                    <div className="text-sm text-muted-foreground">
                      {appliedAt ? `적용 시각: ${appliedAt}` : "적용됨"}
                    </div>
                  </div>

                  <pre
                    className="overflow-x-auto rounded-xl border bg-black p-4 text-sm text-green-200"
                    style={MONO_KO_STYLE}
                  >
{JSON.stringify(confirmedData, null, 2)}
                  </pre>
                </>
              )}
            </CardContent>
        </Card>
      </div>
    </main>
  )
}
