"use client";

import React from "react";

/* ============================================
   TYPE DEFINITIONS
============================================ */

type Block = {
  id: string;
  label: string;
  rowBlockId: string;
  columnBlockId: string;
};

type RowBlock = {
  id: string;
  label: string;
  order: number;
};

type RowInteriorBlock = {
  id: string;
  label: string;
  order: number;
  rowBlocks: RowBlock[];
};

type RootRow = {
  id: string;
  label: string;
  interiorBlocks: RowInteriorBlock[];
};

type ColumnBlock = {
  id: string;
  label: string;
  order: number;
};

type ColumnInteriorBlock = {
  id: string;
  label: string;
  order: number;
  columnBlocks: ColumnBlock[];
};

type RootColumn = {
  id: string;
  label: string;
  interiorBlocks: ColumnInteriorBlock[];
};

/* ============================================
   MOCK DATA
============================================ */

const rowInteriorMeta = [
  { id: "ri1", order: 1, label: "IntRow A" },
  { id: "ri2", order: 2, label: "IntRow B" },
];

const rowBlockMeta: RowBlock[] = [
  { id: "r1", label: "Row 1", order: 1 },
  { id: "r2", label: "Row 2", order: 2 },
  { id: "r3", label: "Row 3", order: 1 },
];

const rowInteriorMap: Record<string, string[]> = {
  ri1: ["r1", "r2"],
  ri2: ["r3"],
};

const colInteriorMeta = [
  { id: "ci1", order: 1, label: "IntCol A" },
  { id: "ci2", order: 2, label: "IntCol B" },
];

const colBlockMeta: ColumnBlock[] = [
  { id: "c1", label: "Col 1", order: 1 },
  { id: "c2", label: "Col 2", order: 2 },
  { id: "c3", label: "Col 3", order: 1 },
  { id: "c4", label: "Col 4", order: 2 },
];

const colInteriorMap: Record<string, string[]> = {
  ci1: ["c1", "c2"],
  ci2: ["c3", "c4"],
};

/* block matrix 생성 */
const allBlocks: Block[] = [];
rowBlockMeta.forEach((rb) => {
  colBlockMeta.forEach((cb) => {
    allBlocks.push({
      id: `${rb.id}-${cb.id}`,
      label: `${rb.label}-${cb.label}`,
      rowBlockId: rb.id,
      columnBlockId: cb.id,
    });
  });
});

/* ============================================
   BUILD STRUCTURES
============================================ */

function buildRow(): RootRow {
  const interiors: RowInteriorBlock[] = rowInteriorMeta
    .sort((a, b) => a.order - b.order)
    .map((int) => {
      const rowBlocks = rowInteriorMap[int.id]
        .map((id) => rowBlockMeta.find((x) => x.id === id)!)
        .sort((a, b) => a.order - b.order);

      return {
        id: int.id,
        label: int.label,
        order: int.order,
        rowBlocks,
      };
    });

  return { id: "root-row", label: "Root Row", interiorBlocks: interiors };
}

function buildColumn(): RootColumn {
  const interiors: ColumnInteriorBlock[] = colInteriorMeta
    .sort((a, b) => a.order - b.order)
    .map((int) => {
      const columnBlocks = colInteriorMap[int.id]
        .map((id) => colBlockMeta.find((x) => x.id === id)!)
        .sort((a, b) => a.order - b.order);

      return {
        id: int.id,
        label: int.label,
        order: int.order,
        columnBlocks,
      };
    });

  return { id: "root-col", label: "Root Column", interiorBlocks: interiors };
}

/* ============================================
   UI COMPONENTS
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
  const rootRow = buildRow();
  const rootCol = buildColumn();

  const flatRows = rootRow.interiorBlocks.flatMap((x) => x.rowBlocks);
  const flatCols = rootCol.interiorBlocks.flatMap((x) => x.columnBlocks);

  const rowInteriorSpans = rootRow.interiorBlocks.map(
    (i) => i.rowBlocks.length
  );
  const colInteriorSpans = rootCol.interiorBlocks.map(
    (i) => i.columnBlocks.length
  );

  const cellW = 120;
  const cellH = 40;

  const columnHeaderHeight = 30 + 30; // interior row + block row
  const rowHeaderWidth = 140;
  const interiorColWidth = 70; // 왼쪽 IntRow 폭
  const rowBlockColWidth = rowHeaderWidth - interiorColWidth;

  return (
    <div
      style={{
        position: "relative",
        margin: 40,
        width: flatCols.length * cellW + rowHeaderWidth + 40,
        height: flatRows.length * cellH + columnHeaderHeight + 40,
        background: "#fafafa",
      }}
    >
      {/* 왼쪽 위 코너 (원하면 RootRow/RootColumn label 넣어도 됨) */}
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
        {/* ColumnInterior */}
        <div style={{ display: "flex" }}>
          {rootCol.interiorBlocks.map((int, i) => (
            <HeaderBox
              key={int.id}
              label={int.label}
              style={{ width: colInteriorSpans[i] * cellW, height: 30 }}
            />
          ))}
        </div>
        {/* ColumnBlock */}
        <div style={{ display: "flex" }}>
          {flatCols.map((col) => (
            <HeaderBox
              key={col.id}
              label={col.label}
              style={{ width: cellW, height: 30 }}
            />
          ))}
        </div>
      </div>

      {/* ================= ROW HEADER (왼쪽, IntRow가 좌측) ================= */}
      <div
        style={{
          position: "absolute",
          top: columnHeaderHeight,
          left: 0,
          width: rowHeaderWidth,
          display: "grid",
          gridTemplateColumns: `${interiorColWidth}px ${rowBlockColWidth}px`,
          gridAutoRows: `${cellH}px`,
          boxSizing: "border-box",
        }}
      >
        {(() => {
          const elements: React.ReactNode[] = [];

          // 1) IntRow (RowInteriorBlock)들을 첫 번째 컬럼에 span으로 배치
          let currentRowStart = 1;
          rootRow.interiorBlocks.forEach((int, idx) => {
            const span = rowInteriorSpans[idx];

            elements.push(
              <div
                key={`int-${int.id}`}
                style={{
                  gridColumn: "1 / 2",
                  gridRow: `${currentRowStart} / span ${span}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <HeaderBox label={int.label} />
              </div>
            );

            currentRowStart += span;
          });

          // 2) 각 RowBlock 라벨을 두 번째 컬럼에 한 줄씩 배치
          flatRows.forEach((rb, index) => {
            const rowIndex = index + 1;
            elements.push(
              <div
                key={`rb-${rb.id}`}
                style={{
                  gridColumn: "2 / 3",
                  gridRow: `${rowIndex} / span 1`,
                }}
              >
                <HeaderBox label={rb.label} />
              </div>
            );
          });

          return elements;
        })()}
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
            const blk = allBlocks.find(
              (b) => b.rowBlockId === rb.id && b.columnBlockId === cb.id
            );
            return <Cell key={rb.id + cb.id} label={blk?.label ?? "-"} />;
          })
        )}
      </div>
    </div>
  );
}
