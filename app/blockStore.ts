// blockStore.ts
import { create } from "zustand"
import { immer } from "zustand/middleware/immer"

/* =========================
   Types
========================= */
export type Block = {
  id: string
  label: string
  parentId: string | null
  children: string[]
}

type Axis = "row" | "column"

type BlockState = {
  rowBlocks: Block[]
  columnBlocks: Block[]

  /* ---------- getters ---------- */
  getRowMap: () => Map<string, Block>
  getColumnMap: () => Map<string, Block>

  /* ---------- actions ---------- */
  reorderBlock: (
    axis: Axis,
    parentId: string,
    activeId: string,
    overId: string
  ) => void

  updateLabel: (
    axis: Axis,
    id: string,
    label: string
  ) => void

  addBlock: (
    axis: Axis,
    parentId: string,
    block: Block
  ) => void

  removeBlock: (
    axis: Axis,
    id: string
  ) => void
}

/* =========================
   Store
========================= */
export const useBlockStore = create<BlockState>()(
  immer((set, get) => ({
    /* ---------- initial state ---------- */
    rowBlocks: [
      { id: "ROW_ROOT", label: "RowRoot", parentId: null, children: ["ROW_A", "ROW_B"] },
      { id: "ROW_A", label: "Row-A", parentId: "ROW_ROOT", children: ["ROW_A1", "ROW_A2"] },
      { id: "ROW_B", label: "Row-B", parentId: "ROW_ROOT", children: ["ROW_B1"] },
      { id: "ROW_A1", label: "row-a1", parentId: "ROW_A", children: [] },
      { id: "ROW_A2", label: "row-a2", parentId: "ROW_A", children: [] },
      { id: "ROW_B1", label: "row-b1", parentId: "ROW_B", children: [] },
    ],

    columnBlocks: [
      { id: "COL_ROOT", label: "ColRoot", parentId: null, children: ["COL_X", "COL_Y"] },
      { id: "COL_X", label: "Col-X", parentId: "COL_ROOT", children: ["X1", "X2"] },
      { id: "COL_Y", label: "Col-Y", parentId: "COL_ROOT", children: ["Y1"] },
      { id: "X1", label: "x1", parentId: "COL_X", children: [] },
      { id: "X2", label: "x2", parentId: "COL_X", children: [] },
      { id: "Y1", label: "y1", parentId: "COL_Y", children: [] },
    ],

    /* ---------- getters ---------- */
    getRowMap: () => new Map(get().rowBlocks.map(b => [b.id, b])),
    getColumnMap: () => new Map(get().columnBlocks.map(b => [b.id, b])),

    /* ---------- actions ---------- */
    reorderBlock: (axis, parentId, activeId, overId) =>
      set(state => {
        const blocks = axis === "row" ? state.rowBlocks : state.columnBlocks
        const parent = blocks.find(b => b.id === parentId)
        if (!parent) return

        const from = parent.children.indexOf(activeId)
        const to = parent.children.indexOf(overId)
        if (from === -1 || to === -1) return

        parent.children.splice(from, 1)
        parent.children.splice(to, 0, activeId)
      }),

    updateLabel: (axis, id, label) =>
      set(state => {
        const blocks = axis === "row" ? state.rowBlocks : state.columnBlocks
        const block = blocks.find(b => b.id === id)
        if (block) block.label = label
      }),

    addBlock: (axis, parentId, block) =>
      set(state => {
        const blocks = axis === "row" ? state.rowBlocks : state.columnBlocks
        const parent = blocks.find(b => b.id === parentId)
        if (!parent) return

        parent.children.push(block.id)
        blocks.push(block)
      }),

    removeBlock: (axis, id) =>
      set(state => {
        const blocks = axis === "row" ? state.rowBlocks : state.columnBlocks
        const idx = blocks.findIndex(b => b.id === id)
        if (idx === -1) return

        const block = blocks[idx]

        // 1. remove from parent
        if (block.parentId) {
          const parent = blocks.find(b => b.id === block.parentId)
          parent?.children.splice(parent.children.indexOf(id), 1)
        }

        // 2. remove subtree
        const removeIds = new Set<string>()
        const dfs = (bid: string) => {
          removeIds.add(bid)
          blocks
            .find(b => b.id === bid)
            ?.children.forEach(dfs)
        }
        dfs(id)

        for (let i = blocks.length - 1; i >= 0; i--) {
          if (removeIds.has(blocks[i].id)) {
            blocks.splice(i, 1)
          }
        }
      }),
  }))
)

const {a, b} = useBlockStore(s=>({a: s.addBlock, b: s.columnBlocks}))