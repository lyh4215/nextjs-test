"use client";

// App.tsx
import React, { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* =========================
   Types
========================= */
type Block = {
  id: string;
  label: string;
  parentId: string | null;
  children: string[];
};

type DataItem = {
  rowLeafId: string;
  colLeafId: string;
  value: string;
};

/* =========================
   Row / Column Trees
========================= */
const initialRowBlocks: Block[] = [
  { id: "ROW_ROOT", label: "RowRoot", parentId: null, children: ["ROW_A", "ROW_B"] },

  { id: "ROW_A", label: "Row-A", parentId: "ROW_ROOT", children: ["ROW_A1", "ROW_A2"] },
  { id: "ROW_B", label: "Row-B", parentId: "ROW_ROOT", children: ["ROW_B1", "ROW_B2"] },

  { id: "ROW_A1", label: "row-a1", parentId: "ROW_A", children: [] },
  { id: "ROW_A2", label: "row-a2", parentId: "ROW_A", children: [] },
  { id: "ROW_B1", label: "row-b1", parentId: "ROW_B", children: [] },
  { id: "ROW_B2", label: "row-b2", parentId: "ROW_B", children: [] },
];

const initialColBlocks: Block[] = [
  { id: "COL_ROOT", label: "ColRoot", parentId: null, children: ["COL_X", "COL_Y"] },

  { id: "COL_X", label: "Col-X", parentId: "COL_ROOT", children: ["X1", "X2"] },
  { id: "COL_Y", label: "Col-Y", parentId: "COL_ROOT", children: ["Y1", "Y2"] },

  { id: "X1", label: "x1", parentId: "COL_X", children: [] },
  { id: "X2", label: "x2", parentId: "COL_X", children: [] },
  { id: "Y1", label: "y1", parentId: "COL_Y", children: [] },
  { id: "Y2", label: "y2", parentId: "COL_Y", children: [] },
];

/* =========================
   Mock Data
========================= */
const data: DataItem[] = ["ROW_A1","ROW_A2","ROW_B1","ROW_B2"].flatMap(r =>
  ["X1","X2","Y1","Y2"].map(c => ({
    rowLeafId: r,
    colLeafId: c,
    value: `${r}:${c}`,
  }))
);

/* =========================
   Helpers
========================= */
const buildMap = (blocks: Block[]) =>
  new Map(blocks.map(b => [b.id, b]));

const leafCount = (id: string, map: Map<string, Block>): number => {
  const b = map.get(id)!;
  if (b.children.length === 0) return 1;
  return b.children.reduce((s, c) => s + leafCount(c, map), 0);
};

const flattenLeaves = (id: string, map: Map<string, Block>): string[] => {
  const b = map.get(id)!;
  if (b.children.length === 0) return [id];
  return b.children.flatMap(c => flattenLeaves(c, map));
};

/* =========================
   Sortable TH
========================= */
function SortableTH({
  id,
  rowSpan,
  colSpan,
  children,
}: {
  id: string;
  rowSpan?: number;
  colSpan?: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, attributes, listeners, transform, transition } =
    useSortable({ id });

  return (
    <th
      ref={setNodeRef}
      rowSpan={rowSpan}
      colSpan={colSpan}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        cursor: "grab",
        padding: 8,
        background: "#f3f3f3",
        border: "1px solid #ccc",
        whiteSpace: "nowrap",
      }}
    >
      ⠿ {children}
    </th>
  );
}

/* =========================
   App
========================= */
export default function App() {
  const [rowBlocks, setRowBlocks] = useState(initialRowBlocks);
  const [colBlocks, setColBlocks] = useState(initialColBlocks);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const rowMap = useMemo(() => buildMap(rowBlocks), [rowBlocks]);
  const colMap = useMemo(() => buildMap(colBlocks), [colBlocks]);

  const rowGroups = rowMap.get("ROW_ROOT")!.children;
  const colGroups = colMap.get("COL_ROOT")!.children;

  const colLeaves = flattenLeaves("COL_ROOT", colMap);

  const dataMap = useMemo(
    () => new Map(data.map(d => [`${d.rowLeafId}:${d.colLeafId}`, d.value])),
    []
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    const id = String(active.id);
    const target = String(over.id);

    // ---------- Row ----------
    if (id.startsWith("ROW")) {
      setRowBlocks(prev => reorder(prev, id, target));
    }

    // ---------- Column ----------
    if (id.startsWith("COL") || id.startsWith("X") || id.startsWith("Y")) {
      setColBlocks(prev => reorder(prev, id, target));
    }
  }

  function reorder(blocks: Block[], aId: string, bId: string) {
    const map = buildMap(blocks);
    const a = map.get(aId);
    const b = map.get(bId);
    if (!a || !b || a.parentId !== b.parentId) return blocks;

    const parent = map.get(a.parentId!)!;
    const next = arrayMove(
      parent.children,
      parent.children.indexOf(a.id),
      parent.children.indexOf(b.id)
    );

    return blocks.map(bl =>
      bl.id === parent.id ? { ...bl, children: next } : bl
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        {/* ================= THEAD (Column DnD) ================= */}
        <thead>
          <SortableContext items={colGroups} strategy={horizontalListSortingStrategy}>
            <tr>
              <th rowSpan={2}>Row</th>
              {colGroups.map(cid => {
                const g = colMap.get(cid)!;
                return (
                  <SortableTH
                    key={g.id}
                    id={g.id}
                    colSpan={leafCount(g.id, colMap)}
                  >
                    {g.label}
                  </SortableTH>
                );
              })}
            </tr>
          </SortableContext>

          <SortableContext items={colLeaves} strategy={horizontalListSortingStrategy}>
            <tr>
              {colLeaves.map(cid => (
                <SortableTH key={cid} id={cid}>
                  {colMap.get(cid)!.label}
                </SortableTH>
              ))}
            </tr>
          </SortableContext>
        </thead>

        {/* ================= TBODY (Row DnD) ================= */}
        <tbody>
          <SortableContext items={rowGroups} strategy={verticalListSortingStrategy}>
            {rowGroups.map((gid, gi) => {
              const group = rowMap.get(gid)!;
              const leaves = group.children;

              return (
                <SortableContext
                  key={gid}
                  items={leaves}
                  strategy={verticalListSortingStrategy}
                >
                  {leaves.map((leafId, li) => (
                    <tr key={leafId}>
                      {gi === 0 && li === 0 && (
                        <th rowSpan={leafCount("ROW_ROOT", rowMap)}>RowRoot</th>
                      )}

                      {li === 0 && (
                        <SortableTH
                          id={group.id}
                          rowSpan={leafCount(group.id, rowMap)}
                        >
                          {group.label}
                        </SortableTH>
                      )}

                      <SortableTH id={leafId}>
                        {rowMap.get(leafId)!.label}
                      </SortableTH>

                      {colLeaves.map(cid => (
                        <td key={cid} style={{ border: "1px solid #ddd", padding: 6 }}>
                          {dataMap.get(`${leafId}:${cid}`)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </SortableContext>
              );
            })}
          </SortableContext>
        </tbody>
      </table>
    </DndContext>
  );
}
