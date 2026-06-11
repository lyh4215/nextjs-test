"use client";

import React, {useMemo, useState} from "react";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";
import {restrictToVerticalAxis} from "@dnd-kit/modifiers";

type Item = {
  id: string;
  title: string;
  description: string;
};

const initialItems: Item[] = [
  {
    id: "item-1",
    title: "짧은 카드",
    description: "높이가 낮은 카드입니다.",
  },
  {
    id: "item-2",
    title: "조금 긴 카드",
    description:
      "이 카드는 설명이 조금 더 깁니다. 드래그할 때 높이가 다른 아이템 사이에서도 안정적으로 정렬되는지 확인하기 위한 카드입니다.",
  },
  {
    id: "item-3",
    title: "매우 긴 카드",
    description:
      "이 카드는 일부러 아주 길게 만들었습니다. 실제 서비스에서는 카드마다 텍스트 길이, 이미지 유무, 버튼 개수 등이 달라서 높이가 서로 달라지는 경우가 많습니다. 그런 상황에서도 dnd-kit의 verticalListSortingStrategy, restrictToVerticalAxis, MeasuringStrategy.Always, DragOverlay 조합이 어느 정도 안정적으로 동작하는지 테스트할 수 있습니다.",
  },
  {
    id: "item-4",
    title: "중간 카드",
    description:
      "중간 정도 높이의 카드입니다. 위아래로 옮겨보면서 흔들림이 있는지 확인해보세요.",
  },
  {
    id: "item-5",
    title: "짧은 카드 2",
    description: "다시 짧은 카드입니다.",
  },
  {
    id: "item-6",
    title: "긴 카드 2",
    description:
      "스크롤이 생기는 상황도 테스트하려고 아래쪽에도 긴 카드를 넣었습니다. 리스트를 위아래로 많이 움직여보세요.",
  },
];

export default function DndTestPage() {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [activeId, setActiveId] = useState<string | null>(null);

  const itemIds = useMemo(() => items.map((item) => item.id), [items]);

  const activeItem = useMemo(
    () => items.find((item) => item.id === activeId) ?? null,
    [activeId, items]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 120,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;

    setActiveId(null);

    if (!over) return;

    const activeItemId = String(active.id);
    const overItemId = String(over.id);

    if (activeItemId === overItemId) return;

    setItems((currentItems) => {
      const oldIndex = currentItems.findIndex((item) => item.id === activeItemId);
      const newIndex = currentItems.findIndex((item) => item.id === overItemId);

      if (oldIndex === -1 || newIndex === -1) {
        return currentItems;
      }

      return arrayMove(currentItems, oldIndex, newIndex);
    });
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  return (
    <main style={styles.page}>
      <section style={styles.panel}>
        <h1 style={styles.title}>dnd-kit variable height sortable test</h1>

        <p style={styles.description}>
          카드 높이가 서로 다른 세로 리스트입니다. 드래그 중 좌우 이동은 막고,
          세로 방향으로만 움직이게 했습니다.
        </p>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          measuring={{
            droppable: {
              strategy: MeasuringStrategy.Always,
            },
          }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={itemIds}
            strategy={verticalListSortingStrategy}
          >
            <div style={styles.list}>
              {items.map((item) => (
                <SortableItem key={item.id} item={item} />
              ))}
            </div>
          </SortableContext>

          <DragOverlay modifiers={[restrictToVerticalAxis]}>
            {activeItem ? <Card item={activeItem} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      </section>
    </main>
  );
}

function SortableItem({item}: {item: Item}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 1 : 0,
    position: "relative",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card item={item} />
    </div>
  );
}

function Card({
  item,
  isOverlay = false,
}: {
  item: Item;
  isOverlay?: boolean;
}) {
  return (
    <article
      style={{
        ...styles.card,
        ...(isOverlay ? styles.overlayCard : null),
      }}
    >
      <div style={styles.cardHeader}>
        <strong style={styles.cardTitle}>{item.title}</strong>
        <span style={styles.badge}>{item.id}</span>
      </div>

      <p style={styles.cardText}>{item.description}</p>

      <div style={styles.handleHint}>Drag anywhere on this card</div>
    </article>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: 32,
    background: "#f6f7f9",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  panel: {
    maxWidth: 720,
    margin: "0 auto",
  },
  title: {
    margin: "0 0 8px",
    fontSize: 28,
    fontWeight: 800,
  },
  description: {
    margin: "0 0 24px",
    color: "#555",
    lineHeight: 1.6,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  card: {
    padding: 18,
    borderRadius: 16,
    background: "white",
    border: "1px solid #ddd",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
    cursor: "grab",
    touchAction: "none",
    userSelect: "none",
  },
  overlayCard: {
    cursor: "grabbing",
    boxShadow: "0 18px 40px rgba(0, 0, 0, 0.18)",
    transform: "scale(1.02)",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 17,
  },
  badge: {
    padding: "4px 8px",
    borderRadius: 999,
    background: "#f0f0f0",
    color: "#555",
    fontSize: 12,
  },
  cardText: {
    margin: 0,
    color: "#333",
    lineHeight: 1.65,
  },
  handleHint: {
    marginTop: 12,
    fontSize: 12,
    color: "#888",
  },
};