// src/lib/blocks/blocks.types.ts

export type BlockType = "group" | "column" | "row" | "cell";

export interface Block {
  id: string;
  type: BlockType;
  parentId: string | null;
  children: Block[];
  data?: any;
}
