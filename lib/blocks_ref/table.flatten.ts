import { Block } from "./blocks.types";

export interface ColumnGroupView {
  group: Block;         // group 블록
  columns: Block[];     // 해당 그룹의 column들 (children)
}

export function flattenGroups(blocks: Block[]): ColumnGroupView[] {
  return blocks
    .filter(b => b.type === "group")
    .map(group => ({
      group,
      columns: group.children.filter(c => c.type === "column")
    }));
}
