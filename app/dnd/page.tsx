"use client";

import React, { useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/* =====================================================
   SortableItem — dnd-kit으로 드래그 가능한 단위
===================================================== */
function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: "10px",
    marginBottom: "6px",
    background: "#e5e7eb",
    border: "1px solid #bbb",
    cursor: "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

/* =====================================================
   예제 데이터 구조
   - groupMeta: 그룹 순서 저장 (Group A, Group B ...)
   - groupMap: 그룹별 아이템 리스트
===================================================== */
export default function MinimalDndExample() {
  const [groupMeta, setGroupMeta] = useState([
    { id: "g1", label: "Group A" },
    { id: "g2", label: "Group B" },
  ]);

  const [groupMap, setGroupMap] = useState<Record<string, string[]>>({
    g1: ["A-1", "A-2"],
    g2: ["B-1", "B-2"],
  });

  /* =====================================================
     DND Sensor
===================================================== */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  /* =====================================================
     dragEnd handler
     - 그룹 끼리 reorder
     - 같은 그룹 내부 아이템 reorder
===================================================== */
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    if (active.id === over.id) return;

    const a = String(active.id);
    const b = String(over.id);

    /* ---------- 1) 그룹 드래그 ---------- */
    // id: group:g1
    if (a.startsWith("group:") && b.startsWith("group:")) {
      const gA = a.split(":")[1];
      const gB = b.split(":")[1];

      setGroupMeta((prev) => {
        const oldIdx = prev.findIndex((x) => x.id === gA);
        const newIdx = prev.findIndex((x) => x.id === gB);
        return arrayMove(prev, oldIdx, newIdx);
      });
      return;
    }

    /* ---------- 2) 그룹 내부 아이템 드래그 ---------- */
    // id: item:g1:A-1 (groupId:ItemName)
    if (a.startsWith("item:") && b.startsWith("item:")) {
      const [, gA, itemA] = a.split(":"); // item:g1:A-1
      const [, gB, itemB] = b.split(":");

      // 다른 그룹 간 이동 금지
      if (gA !== gB) return;

      setGroupMap((prev) => {
        const list = prev[gA];
        const oldIdx = list.indexOf(itemA);
        const newIdx = list.indexOf(itemB);

        const newList = arrayMove(list, oldIdx, newIdx);
        return { ...prev, [gA]: newList };
      });
    }
  };

  /* =====================================================
     렌더링
===================================================== */
  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <h1 style={{ fontSize: 18, marginBottom: 20 }}>🔹 Minimal DND Group + Item</h1>

      {/* 그룹 정렬 영역 */}
      <SortableContext
        items={groupMeta.map((g) => "group:" + g.id)}
        strategy={verticalListSortingStrategy}
      >
        {groupMeta.map((g) => (
          <div key={g.id} style={{ marginBottom: 20 }}>
            {/* 상위 그룹 박스 */}
            <SortableItem id={`group:${g.id}`}>
              <b>{g.label}</b>
            </SortableItem>

            {/* 각 그룹 내부 아이템 정렬 영역 */}
            <div style={{ marginLeft: 20 }}>
              <SortableContext
                items={groupMap[g.id].map((item) => `item:${g.id}:${item}`)}
                strategy={verticalListSortingStrategy}
              >
                {groupMap[g.id].map((item) => (
                  <SortableItem id={`item:${g.id}:${item}`} key={item}>
                    {item}
                  </SortableItem>
                ))}
              </SortableContext>
            </div>
          </div>
        ))}
      </SortableContext>
    </DndContext>
  );
}
