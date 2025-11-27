// src/lib/blocks/blocks.initial.ts
import type { Block } from "./blocks.types";

export const initialBlocks: Block[] = [
  {
    id: "group-1",
    type: "group",
    parentId: null,
    children: [
      {
        id: "col-1",
        type: "column",
        parentId: "group-1",
        children: [
          {
            id: "cell-1",
            type: "cell",
            parentId: "col-1",
            data: { value: "A1", x: 0, y: 0, z: 0 },
            children: [],
          },
          {
            id: "cell-2",
            type: "cell",
            parentId: "col-1",
            data: { value: "A2", x: 0, y: 1, z: 0 },
            children: [],
          },
        ],
      },
      {
        id: "col-2",
        type: "column",
        parentId: "group-1",
        children: [],
      },
      {
        id: "col-3",
        type: "column",
        parentId: "group-1",
        children: [],
      },
    ],
  },
  {
    id: "group-2",
    type: "group",
    parentId: null,
    children: [
      {
        id: "col-4",
        type: "column",
        parentId: "group-2",
        children: [],
      },
      {
        id: "col-5",
        type: "column",
        parentId: "group-2",
        children: [],
      },
    ],
  },
];
