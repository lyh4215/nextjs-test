# Next.js + Prisma Cheat Sheet

## 구조

```text
features/
  post/
    post.actions.ts
    post.service.ts
    post.queries.ts
    post.schema.ts
```

```text
UI
 ↓
Action
 ↓
Service
 ↓
Queries
 ↓
Prisma
```

## 역할

### `actions.ts`

Next.js 진입점.

```text
- input
- Zod validation
- auth
- service 호출
- revalidate / redirect
```

### `service.ts`

비즈니스 로직.

```text
- $transaction
- 여러 DB 작업 조합
- 비즈니스 규칙
- authorization
```

### `queries.ts`

DB 접근.

```text
- Prisma CRUD
- 복잡한 select/include
- aggregate/groupBy
- $queryRaw
- $executeRaw
```

---

## Transaction

Transaction은 Service에서 연다.

```ts
await prisma.$transaction(async (tx) => {
  await commentQueries.create(tx, input)
  await postQueries.incrementCommentCount(tx, postId)
})
```

Query는 가능하면 `db`를 첫 번째 인자로 받는다.

```ts
postQueries.findById(tx, id)
postQueries.findById(prisma, id)
```

---

## 파일 소속 기준

Action / Service:

> 사용자가 무엇을 하는가?

```text
댓글 생성 → comment
게시글 수정 → post
```

Query:

> 어떤 모델을 읽거나 변경하는가?

```ts
commentQueries.findByPostId()
postQueries.incrementCommentCount()
```

---

## Cross-feature

여러 모델을 건드리면 Service에서 조합한다.

```ts
// comment.service.ts

await prisma.$transaction(async (tx) => {
  const comment = await commentQueries.create(tx, input)

  await postQueries.incrementCommentCount(tx, input.postId)

  return comment
})
```

`post/comment.ts`, `comment/post.ts`처럼 관계별 파일을 만들지 않는다.

---

## 언제 분리할까?

단순하면 Action에서 Prisma를 바로 써도 됨.

`queries.ts`로 뺄 때:

```text
- 반복됨
- query가 길어짐
- raw SQL 사용
- include/select 복잡
```

`service.ts`로 뺄 때:

```text
- transaction
- 여러 DB 작업
- business rule
- 여러 model 변경
```

---

## 핵심

```text
Action  = Next.js
Service = What / Why
Queries = How DB
```

```text
$transaction → Service
$executeRaw  → Queries
revalidate   → Action
redirect     → Action
```
