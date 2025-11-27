// blocks.types.ts

/** 블록의 최상위 종류 */
export type BlockType = "column" | "row" | "cell";

/* -------------------------------------------------------------------------- */
/*  CellBlock                                                                 */
/* -------------------------------------------------------------------------- */

export interface CellBlock {
  id: string;
  type: "cell";
  parent: {
    /** 어떤 column 아래에 있는지 */
    columnParentId: string;
    /** 어떤 row 아래에 있는지 */
    rowParentId: string;
  };
  /** 셀 아래에는 자식이 없음 */
  children: [];
  /** 실제 값, 메타데이터 등 */
  data?: any;
}

/* -------------------------------------------------------------------------- */
/*  ColumnBlock (group / leaf variant)                                       */
/* -------------------------------------------------------------------------- */

interface BaseColumnParent {
  /** 상위 column(group)이 없으면 null (최상위 column 그룹) */
  columnParentId: string | null;
}

/** Column 공통 베이스 타입 (제네릭으로 children 타입만 바꿈) */
interface ColumnBlockBase<TChildren> {
  id: string;
  type: "column";
  parent: BaseColumnParent;
  children: TChildren[];
  data?: any;
}

/** 자식이 전부 ColumnBlock 인 column (column group / 상위 헤더) */
export type GroupColumnBlock = ColumnBlockBase<ColumnBlock> & {
  variant: "group";
};

/** 자식이 전부 CellBlock 인 column (실제 데이터 열) */
export type LeafColumnBlock = ColumnBlockBase<CellBlock> & {
  variant: "leaf";
};

/** ColumnBlock = group / leaf 두 가지 변형 */
export type ColumnBlock = GroupColumnBlock | LeafColumnBlock;

/* -------------------------------------------------------------------------- */
/*  RowBlock (group / leaf variant)                                          */
/* -------------------------------------------------------------------------- */

interface BaseRowParent {
  /** 상위 row(group)가 없으면 null (최상위 row 그룹) */
  rowParentId: string | null;
}

/** Row 공통 베이스 타입 (제네릭으로 children 타입만 바꿈) */
interface RowBlockBase<TChildren> {
  id: string;
  type: "row";
  parent: BaseRowParent;
  children: TChildren[];
  data?: any;
}

/** 자식이 전부 RowBlock 인 row (row group / 섹션 헤더) */
export type GroupRowBlock = RowBlockBase<RowBlock> & {
  variant: "group";
};

/** 자식이 전부 CellBlock 인 row (실제 데이터 행) */
export type LeafRowBlock = RowBlockBase<CellBlock> & {
  variant: "leaf";
};

/** RowBlock = group / leaf 두 가지 변형 */
export type RowBlock = GroupRowBlock | LeafRowBlock;

/* -------------------------------------------------------------------------- */
/*  최종 Block 유니온                                                        */
/* -------------------------------------------------------------------------- */

export type Block = ColumnBlock | RowBlock | CellBlock;
