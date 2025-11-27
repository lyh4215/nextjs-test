// src/lib/blocks/blocks.utils.ts
import type { Block } from "./blocks.types";

export function findBlock(
  roots: Block[],
  id: string
): { block: Block; parent: Block | null } | null {
  const stack: { node: Block; parent: Block | null }[] = roots.map((r) => ({
    node: r,
    parent: null,
  }));

  while (stack.length > 0) {
    const { node, parent } = stack.pop()!;
    if (node.id === id) return { block: node, parent };

    node.children.forEach((c) =>
      stack.push({ node: c, parent: node })
    );
  }

  return null;
}

export function removeBlock(roots: Block[], id: string): Block[] {
  function helper(nodes: Block[]): Block[] {
    return nodes
      .filter((node) => node.id !== id)
      .map((node) => ({
        ...node,
        children: helper(node.children),
      }));
  }

  return helper(roots);
}

export function insertBlock(
  roots: Block[],
  parentId: string | null,
  block: Block,
  index?: number
): Block[] {
  if (parentId === null) {
    const newRoots = [...roots];
    if (index === undefined) newRoots.push(block);
    else newRoots.splice(index, 0, block);
    return newRoots;
  }

  function helper(nodes: Block[]): Block[] {
    return nodes.map((node) => {
      if (node.id === parentId) {
        const newChildren = [...node.children];
        if (index === undefined) newChildren.push(block);
        else newChildren.splice(index, 0, block);

        return { ...node, children: newChildren };
      }

      return { ...node, children: helper(node.children) };
    });
  }

  return helper(roots);
}

export function moveBlock(
  roots: Block[],
  sourceId: string,
  newParentId: string | null,
  index?: number
): Block[] {
  const found = findBlock(roots, sourceId);
  if (!found) return roots;

  const { block: sourceBlock } = found;

  const without = removeBlock(roots, sourceId);

  const newBlock: Block = {
    ...sourceBlock,
    parentId: newParentId,
  };

  return insertBlock(without, newParentId, newBlock, index);
}
