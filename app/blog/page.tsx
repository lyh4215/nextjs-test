"use client";

import React, { useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  closestCenter,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* ============================================
   TYPE DEFINITIONS
   - 데이터 구조 정의 (Row / Column / Interior / Block 등)
============================================ */

type Block = {
  id: string;         // "r1-c1" 이런 식의 셀 고유 ID
  label: string;      // 셀에 보여줄 텍스트 (예: "Row 1-Col 1")
  rowBlockId: string; // 어떤 RowBlock(r1, r2, ...)에 속하는지
  columnBlockId: string; // 어떤 ColumnBlock(c1, c2, ...)에 속하는지
};

type RowBlock = {
  id: string;    // "r1", "r2" ...
  label: string; // "Row 1" 등 화면 표시용
  order: number; // 해당 RowInterior 안에서의 순서 (여기선 index 기반으로 다시 계산됨)
};

type RowInteriorMeta = {
  id: string;    // "ri1", "ri2" ...
  label: string; // "IntRow A" 등 화면 표시용
  order: number; // 전체 IntRow 순서 (실제 렌더에서는 index 기반으로 다시 계산됨)
};

type RowInteriorBlock = {
  id: string;
  label: string;
  order: number;   // 화면 상에서의 IntRow 순서 (index 기반)
  rowBlocks: RowBlock[]; // 이 IntRow 안에 포함된 RowBlock 리스트
};

type RootRow = {
  id: string;
  label: string;
  interiorBlocks: RowInteriorBlock[];
};

type ColumnBlock = {
  id: string;    // "c1", "c2" ...
  label: string; // "Col 1" 등 화면 표시용
  order: number; // IntCol 안에서의 순서 (index 기반으로 다시 계산됨)
};

type ColumnInteriorMeta = {
  id: string;    // "ci1", "ci2" ...
  label: string; // "IntCol A" 등 화면 표기
  order: number; // 전체 IntCol 순서 (실제 렌더에서는 index 기반)
};

type ColumnInteriorBlock = {
  id: string;
  label: string;
  order: number;      // 화면 상 순서 (index 기반)
  columnBlocks: ColumnBlock[]; // 이 IntCol 안에 포함된 ColumnBlock 리스트
};

type RootColumn = {
  id: string;
  label: string;
  interiorBlocks: ColumnInteriorBlock[];
};

/* ============================================
   INITIAL META (초기 데이터)
   - 여기 값들을 useState 초기값으로 사용
   - 드래그로 순서를 바꿔도 "state"만 바뀌게 설계
============================================ */

// Row 상위 그룹 (IntRow)
const initialRowInteriorMeta: RowInteriorMeta[] = [
  { id: "ri1", order: 1, label: "IntRow A" },
  { id: "ri2", order: 2, label: "IntRow B" },
];

// 실제 Row 단위 (각 행)
const initialRowBlockMeta: RowBlock[] = [
  { id: "r1", label: "Row 1", order: 1 },
  { id: "r2", label: "Row 2", order: 2 },
  { id: "r3", label: "Row 3", order: 1 },
];

// IntRow → RowBlock 연결 관계
// ri1 안에는 r1, r2
// ri2 안에는 r3
const initialRowInteriorMap: Record<string, string[]> = {
  ri1: ["r1", "r2"],
  ri2: ["r3"],
};

// Column 상위 그룹 (IntCol)
const initialColInteriorMeta: ColumnInteriorMeta[] = [
  { id: "ci1", order: 1, label: "IntCol A" },
  { id: "ci2", order: 2, label: "IntCol B" },
];

// 실제 Column 단위 (각 열)
const initialColBlockMeta: ColumnBlock[] = [
  { id: "c1", label: "Col 1", order: 1 },
  { id: "c2", label: "Col 2", order: 2 },
  { id: "c3", label: "Col 3", order: 1 },
  { id: "c4", label: "Col 4", order: 2 },
];

// IntCol → ColumnBlock 연결 관계
// ci1 안에는 c1, c2
// ci2 안에는 c3, c4
const initialColInteriorMap: Record<string, string[]> = {
  ci1: ["c1", "c2"],
  ci2: ["c3", "c4"],
};

/* ============================================
   BUILD STRUCTURES (from state)
   - state(rowInteriorMeta, rowInteriorMap 등)를 화면용 구조로 변환
   - order는 index 기반으로 다시 계산해줘서
     드래그 후 순서 변경이 반영되도록 함
============================================ */

function buildRow(
  rowInteriorMeta: RowInteriorMeta[],
  rowBlockMeta: RowBlock[],
  rowInteriorMap: Record<string, string[]>
): RootRow {
  const interiors: RowInteriorBlock[] = rowInteriorMeta.map((int, idx) => {
    // 이 IntRow 안에 들어갈 RowBlock들의 ID 리스트
    const rowBlocks = (rowInteriorMap[int.id] || []).map((id, rbIdx) => {
      const meta = rowBlockMeta.find((b) => b.id === id)!;
      // order는 이 IntRow 내부에서의 순서이므로 rbIdx 기반으로 새로 설정
      return {
        ...meta,
        order: rbIdx + 1,
      };
    });

    return {
      id: int.id,
      label: int.label,
      // IntRow 전체 순서도 배열 index 기반
      order: idx + 1,
      rowBlocks,
    };
  });

  return { id: "root-row", label: "Root Row", interiorBlocks: interiors };
}

function buildColumn(
  colInteriorMeta: ColumnInteriorMeta[],
  colBlockMeta: ColumnBlock[],
  colInteriorMap: Record<string, string[]>
): RootColumn {
  const interiors: ColumnInteriorBlock[] = colInteriorMeta.map((int, idx) => {
    // 이 IntCol 안에 들어갈 ColumnBlock들의 ID 리스트
    const columnBlocks = (colInteriorMap[int.id] || []).map((id, cbIdx) => {
      const meta = colBlockMeta.find((c) => c.id === id)!;
      // order는 이 IntCol 내부에서의 순서이므로 cbIdx 기반으로 새로 설정
      return {
        ...meta,
        order: cbIdx + 1,
      };
    });

    return {
      id: int.id,
      label: int.label,
      order: idx + 1,
      columnBlocks,
    };
  });

  return { id: "root-col", label: "Root Column", interiorBlocks: interiors };
}

/* ============================================
   DND SORTABLE WRAPPER
   - dnd-kit의 useSortable을 감싼 컴포넌트
   - 이 안에 들어가는 요소가 "드래그 가능한 단위"가 됨
============================================ */

type SortableItemProps = {
  id: string;            // dnd-kit에서 사용하는 고유 ID
  children: React.ReactNode; // 실제 렌더링할 JSX
};

const SortableItem: React.FC<SortableItemProps> = ({ id, children }) => {
  const {
    attributes,    // role, aria 등 drag용 attribute
    listeners,     // onPointerDown, onKeyDown 등 drag 이벤트 핸들러
    setNodeRef,    // drag 대상 DOM ref
    transform,     // 현재 drag 이동량 (x, y)
    transition,    // transition CSS (애니메이션)
    isDragging,    // 현재 드래그 중인지 여부
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined, // 드래그 중일 때 위로 올라오게
    cursor: "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

/* ============================================
   UI COMPONENTS (HeaderBox, Cell)
============================================ */

const HeaderBox = ({
  label,
  style,
}: {
  label: string;
  style?: React.CSSProperties;
}) => (
  <div
    style={{
      border: "1px solid #999",
      background: "#e5e7eb",
      boxSizing: "border-box",
      padding: "6px 8px",
      textAlign: "center",
      fontWeight: 600,
      fontSize: 12,
      ...style,
    }}
  >
    {label}
  </div>
);

const Cell = ({ label }: { label: string }) => (
  <div
    style={{
      border: "1px solid #ddd",
      width: "100%",
      height: "100%",
      boxSizing: "border-box",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "#fff",
      fontSize: 12,
    }}
  >
    {label}
  </div>
);

/* ============================================
   MAIN PAGE
============================================ */

export default function Page() {
  /* ---------- 상태 정의 ----------
   - Row / Column 관련 정렬 가능한 정보만 state로 둠
   - Block label 조합은 매 렌더링마다 계산해도 큰 비용 아님
  */

  // IntRow 순서 & 메타 정보 (IntRow A, IntRow B ...)
  const [rowInteriorMeta, setRowInteriorMeta] = useState(initialRowInteriorMeta);
  // IntRow → RowBlock ID 리스트 매핑
  const [rowInteriorMap, setRowInteriorMap] = useState(initialRowInteriorMap);

  // IntCol 순서 & 메타 정보 (IntCol A, IntCol B ...)
  const [colInteriorMeta, setColInteriorMeta] = useState(initialColInteriorMeta);
  // IntCol → ColumnBlock ID 리스트 매핑
  const [colInteriorMap, setColInteriorMap] = useState(initialColInteriorMap);

  /* ---------- Block matrix 사전 계산 ----------
     - 실제 중앙 셀은 RowBlock / ColumnBlock 조합으로 생성
     - 여기는 정렬과 무관해서 initial 메타로만 생성해도 됨
  */
  const allBlocks: Block[] = React.useMemo(() => {
    const arr: Block[] = [];
    initialRowBlockMeta.forEach((rb) => {
      initialColBlockMeta.forEach((cb) => {
        arr.push({
          id: `${rb.id}-${cb.id}`,
          label: `${rb.label}-${cb.label}`,
          rowBlockId: rb.id,
          columnBlockId: cb.id,
        });
      });
    });
    return arr;
  }, []);

  /* ---------- 화면용 구조 빌드 ----------
     - state를 기반으로 Row / Column 구조 생성
     - 여기서 정렬 순서가 반영된 flatRows / flatCols가 만들어짐
  */
  const rootRow = buildRow(rowInteriorMeta, initialRowBlockMeta, rowInteriorMap);
  const rootCol = buildColumn(
    colInteriorMeta,
    initialColBlockMeta,
    colInteriorMap
  );

  // 실제 렌더에 사용할 Row/Col 리스트 (flat한 배열)
  const flatRows = rootRow.interiorBlocks.flatMap((x) => x.rowBlocks);
  const flatCols = rootCol.interiorBlocks.flatMap((x) => x.columnBlocks);

  // IntRow / IntCol별로 몇 개의 RowBlock / ColumnBlock을 가지고 있는지
  // → Header span 계산용
  const rowInteriorSpans = rootRow.interiorBlocks.map(
    (i) => i.rowBlocks.length
  );
  const colInteriorSpans = rootCol.interiorBlocks.map(
    (i) => i.columnBlocks.length
  );

  // 셀 사이즈와 헤더 사이즈 관련 상수
  const cellW = 120;
  const cellH = 40;

  const columnHeaderHeight = 30 + 30; // (위) IntCol 라벨 30 + ColumnBlock 라벨 30
  const rowHeaderWidth = 140;
  const interiorColWidth = 70; // 왼쪽 IntRow 영역 폭
  const rowBlockColWidth = rowHeaderWidth - interiorColWidth;

  /* ---------- DnD sensors ----------
     - PointerSensor: 마우스/터치 기반 드래그
     - activationConstraint: 5px 이상 움직여야 drag 시작 (실수 드래그 방지)
  */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  /* ---------- DnD 핸들러 ----------
     - active: 드래그 시작한 아이템
     - over: 드래그가 끝난 위치에 있는 아이템
     - id 규칙으로 어떤 종류의 드래그인지 구분해서 처리
  */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    /* ----- 1) Column Interior (IntCol A/B) 수평 reorder ----- */
    // id 형식: "col-int:ci1"
    if (activeId.startsWith("col-int:") && overId.startsWith("col-int:")) {
      const a = activeId.split(":")[1]; // active interior id
      const b = overId.split(":")[1];   // over interior id

      setColInteriorMeta((items) => {
        const oldIndex = items.findIndex((i) => i.id === a);
        const newIndex = items.findIndex((i) => i.id === b);
        if (oldIndex === -1 || newIndex === -1) return items;
        // dnd-kit util: 배열에서 요소 위치만 변경
        return arrayMove(items, oldIndex, newIndex);
      });
      return;
    }

    /* ----- 2) Row Interior (IntRow A/B) 수직 reorder ----- */
    // id 형식: "row-int:ri1"
    if (activeId.startsWith("row-int:") && overId.startsWith("row-int:")) {
      const a = activeId.split(":")[1];
      const b = overId.split(":")[1];

      setRowInteriorMeta((items) => {
        const oldIndex = items.findIndex((i) => i.id === a);
        const newIndex = items.findIndex((i) => i.id === b);
        if (oldIndex === -1 || newIndex === -1) return items;
        return arrayMove(items, oldIndex, newIndex);
      });
      return;
    }

    /* ----- 3) ColumnBlock (Col1, Col2 ...) 내부 reorder ----- */
    // id 형식: "col-block:ci1:c1"
    if (activeId.startsWith("col-block:") && overId.startsWith("col-block:")) {
      const [, activeInteriorId, activeColId] = activeId.split(":");
      const [, overInteriorId, overColId] = overId.split(":");

      // 지금은 "같은 IntCol 안에서만" 위치 변경 허용
      // (cross-group 이동은 여기서 막고 있음)
      if (activeInteriorId !== overInteriorId) return;

      setColInteriorMap((prev) => {
        const list = prev[activeInteriorId];
        if (!list) return prev;

        const oldIndex = list.indexOf(activeColId);
        const newIndex = list.indexOf(overColId);
        if (oldIndex === -1 || newIndex === -1) return prev;

        const newList = arrayMove(list, oldIndex, newIndex);
        return {
          ...prev,
          [activeInteriorId]: newList,
        };
      });
      return;
    }

    /* ----- 4) RowBlock (Row1, Row2 ...) 내부 reorder ----- */
    // id 형식: "row-block:ri1:r1"
    if (activeId.startsWith("row-block:") && overId.startsWith("row-block:")) {
      const [, activeInteriorId, activeRowId] = activeId.split(":");
      const [, overInteriorId, overRowId] = overId.split(":");

      // 마찬가지로 "같은 IntRow 안에서만" 재정렬 허용
      if (activeInteriorId !== overInteriorId) return;

      setRowInteriorMap((prev) => {
        const list = prev[activeInteriorId];
        if (!list) return prev;

        const oldIndex = list.indexOf(activeRowId);
        const newIndex = list.indexOf(overRowId);
        if (oldIndex === -1 || newIndex === -1) return prev;

        const newList = arrayMove(list, oldIndex, newIndex);
        return {
          ...prev,
          [activeInteriorId]: newList,
        };
      });
      return;
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter} // 드래그 대상과 가장 가까운 중앙 기준으로 over 판정
      onDragEnd={handleDragEnd}
    >
      <div
        style={{
          position: "relative",
          margin: 40,
          width: flatCols.length * cellW + rowHeaderWidth + 40,
          height: flatRows.length * cellH + columnHeaderHeight + 40,
          background: "#fafafa",
        }}
      >
        {/* 왼쪽 위 코너 (필요하면 RootRow/RootColumn 이름 등 넣을 수 있음) */}
        <HeaderBox
          label=""
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: rowHeaderWidth,
            height: columnHeaderHeight,
          }}
        />

        {/* ================= COLUMN HEADER (위쪽) ================= */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: rowHeaderWidth,
            width: flatCols.length * cellW,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* ------- 1) ColumnInterior (IntCol A/B) 수평 드래그 영역 ------- */}
          <SortableContext
            // items: dnd-kit이 관리하는 "드래그 단위 ID 배열"
            items={rootCol.interiorBlocks.map(
              (int) => `col-int:${int.id}` as string
            )}
            strategy={horizontalListSortingStrategy} // 수평 리스트 정렬
          >
            <div style={{ display: "flex" }}>
              {rootCol.interiorBlocks.map((int, i) => (
                <SortableItem id={`col-int:${int.id}`} key={int.id}>
                  <HeaderBox
                    label={int.label}
                    style={{
                      width: colInteriorSpans[i] * cellW, // 해당 IntCol이 가진 Column 개수만큼 span
                      height: 30,
                    }}
                  />
                </SortableItem>
              ))}
            </div>
          </SortableContext>

          {/* ------- 2) ColumnBlock (Col 1, Col 2 ...) - IntCol별 수평 드래그 ------- */}
          <div style={{ display: "flex" }}>
            {rootCol.interiorBlocks.map((int) => (
              <SortableContext
                key={int.id}
                items={int.columnBlocks.map(
                  (col) => `col-block:${int.id}:${col.id}` as string
                )}
                strategy={horizontalListSortingStrategy}
              >
                <div style={{ display: "flex" }}>
                  {int.columnBlocks.map((col) => (
                    <SortableItem
                      id={`col-block:${int.id}:${col.id}`}
                      key={col.id}
                    >
                      <HeaderBox
                        label={col.label}
                        style={{ width: cellW, height: 30 }}
                      />
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            ))}
          </div>
        </div>

        {/* ================= ROW HEADER (왼쪽, IntRow + RowBlocks) ================= */}
        <div
          style={{
            position: "absolute",
            top: columnHeaderHeight,
            left: 0,
            width: rowHeaderWidth,
            height: flatRows.length * cellH,
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* ------- IntRow 전체를 세로로 드래그 가능한 영역 ------- */}
          <SortableContext
            items={rootRow.interiorBlocks.map(
              (int) => `row-int:${int.id}` as string
            )}
            strategy={verticalListSortingStrategy} // 세로 리스트 정렬
          >
            {rootRow.interiorBlocks.map((int, idx) => (
              <SortableItem id={`row-int:${int.id}`} key={int.id}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    height: rowInteriorSpans[idx] * cellH, // 이 IntRow가 차지하는 전체 높이
                  }}
                >
                  {/* 왼쪽 IntRow 라벨 (스팬 높이만큼 한 번에 표시) */}
                  <div
                    style={{
                      width: interiorColWidth,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <HeaderBox
                      label={int.label}
                      style={{ height: rowInteriorSpans[idx] * cellH }}
                    />
                  </div>

                  {/* 오른쪽 RowBlock 리스트 (해당 IntRow 안에서만 드래그) */}
                  <div
                    style={{
                      width: rowBlockColWidth,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <SortableContext
                      items={int.rowBlocks.map(
                        (rb) => `row-block:${int.id}:${rb.id}` as string
                      )}
                      strategy={verticalListSortingStrategy}
                    >
                      {int.rowBlocks.map((rb) => (
                        <SortableItem
                          id={`row-block:${int.id}:${rb.id}`}
                          key={rb.id}
                        >
                          <HeaderBox
                            label={rb.label}
                            style={{ height: cellH }}
                          />
                        </SortableItem>
                      ))}
                    </SortableContext>
                  </div>
                </div>
              </SortableItem>
            ))}
          </SortableContext>
        </div>

        {/* ================= MAIN GRID (Block-only) ================= */}
        <div
          style={{
            position: "absolute",
            top: columnHeaderHeight,
            left: rowHeaderWidth,
            display: "grid",
            gridTemplateColumns: `repeat(${flatCols.length}, ${cellW}px)`,
            gridAutoRows: `${cellH}px`,
          }}
        >
          {flatRows.map((rb) =>
            flatCols.map((cb) => {
              // 현재 Row/Column 조합에 해당하는 Block label 찾기
              const blk = allBlocks.find(
                (b) => b.rowBlockId === rb.id && b.columnBlockId === cb.id
              );
              return (
                <Cell key={rb.id + cb.id} label={blk?.label ?? "-"} />
              );
            })
          )}
        </div>
      </div>
    </DndContext>
  );
}
