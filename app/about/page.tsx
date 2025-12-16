import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type BlockProps = {
  id : string,
  child? : number,
  isCol? : boolean,
}
const BlockWidth = 60;
const BlockHeight = 40;
const Block = ({id, child=1, isCol= true} : BlockProps) => {
  return <div
      className="border-3 flex items-center justify-center"
      style = {{
        width: isCol ? BlockWidth * child : BlockWidth,
        height: isCol ? BlockHeight : BlockHeight * child
      }}
      >
    {id} Block
  </div>
};

type BlockElem = {
  id : string,
  children : BlockElem[],
};

// 4x4 Blocks
const Blocks: BlockElem[] = Array.from({ length: 16 }, (_, i) => ({
  id: `B${i + 1}`,
  children: [],
}));
const Col3: BlockElem = { id: "Col-3", children: [] };
const Col4: BlockElem = { id: "Col-4", children: [] };
const Col5: BlockElem = { id: "Col-5", children: [] };
const Col6: BlockElem = { id: "Col-6", children: [] };

const Col1: BlockElem = { id: "Col-1", children: [Col3, Col4] };
const Col2: BlockElem = { id: "Col-2", children: [Col5, Col6] };

const ColRoot: BlockElem = {
  id: "Col-Root",
  children: [Col1, Col2],
};

const Row3: BlockElem = { id: "Row-3", children: [] };
const Row4: BlockElem = { id: "Row-4", children: [] };
const Row5: BlockElem = { id: "Row-5", children: [] };
const Row6: BlockElem = { id: "Row-6", children: [] };

const Row1: BlockElem = { id: "Row-1", children: [Row3, Row4] };
const Row2: BlockElem = { id: "Row-2", children: [Row5, Row6] };

const RowRoot: BlockElem = {
  id: "Row-Root",
  children: [Row1, Row2],
};

for (let i = 0; i < 16; i++) {
  const block = Blocks[i];
  const row = Math.floor(i / 4);      // 0~3
  const col = i % 4;                  // 0~3

  // Col 매핑
  const colMap = [Col3, Col4, Col5, Col6];
  colMap[col].children.push(block);

  // Row 매핑
  const rowMap = [Row3, Row4, Row5, Row6];
  rowMap[row].children.push(block);
}

const ColMap = [Col3, Col4, Col5, Col6];

const RowMap = [Row3, Row4, Row5, Row6];

type MainProps = {
  col : BlockElem,
  row : BlockElem,
};

type Props = {
  block : BlockElem,
};

function RecurMain(props : MainProps) {
  
  
}
function RecurRow(props: Props) {
  // 종료 조건
  if (countLeaves(props.block) == 0) {
    return null;
  }

  return (
    <div className = "flex">
      {/* 현재 레벨에서 Block 렌더 */}
      <div>
        <Block id={props.block.id} child={countLeaves(props.block)} isCol={false} />
      </div>

      {/* children 재귀 렌더 */}
      <div className="flex flex-col">
        {props.block.children.map((child) => (
          <RecurRow 
            key={child.id}
            block={child} 
          />
        ))}
      </div>
    </div>
  );
}

function RecurCol(props : Props) {
  if (countLeaves(props.block) == 0) {
    return;
  }
  return (
    <div>
      <div>
        <Block id= {props.block.id} child={countLeaves(props.block)}/>
      </div>
      <div className = "flex">
        {props.block.children.map((child) => {
          return <RecurCol block={child}/>}
          )}
      </div>
    </div>
  );
}


function countLeaves(node: BlockElem): number {
  // leaf node
  if (node.children.length != 0 && (!node.children[0].children || node.children[0].children.length === 0)) {
    return 1;
  }

  // non-leaf → children DFS 합산
  let total = 0;
  for (const child of node.children) {
    total += countLeaves(child);
  }
  return total;
}

function countDepth(node: BlockElem): number {
  // leaf node
  if (node.children.length != 0 && (!node.children[0].children || node.children[0].children.length === 0)) {
    return 1;
  }

  return countDepth(node.children[0]) +1;
}


export default function Home() {
  return (
    <div className = "flex justify-center items-center w-full h-full">
      <div className = "flex justify-center items-center relative w-min h-min">
        <div className = "border-2 absolute w-full"
          style = {{
            top : -BlockHeight * countDepth(ColRoot),
          }}>
          <RecurCol block = {ColRoot}/>
        </div>
        <div className = "border-2 absolute h-full"
          style = {{
            left : -BlockWidth * countDepth(RowRoot),
          }}>
          <RecurRow block = {RowRoot}/>
        </div>
        <div className = "w-full"
          style = {{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gridTemplateRows: "repeat(4, 1fr)",
          width: BlockWidth*4,
          height: BlockHeight*4,
        }}>
          {Array.from({ length: 4 }).map((_, row) =>
        Array.from({ length: 4 }).map((_, col) => {
          // Row와 Col에 모두 속하는 Block 찾기
          const rowChildren = RowMap[row].children;
          const colChildren = ColMap[col].children;

          // 교집합에서 Block 하나 찾기
          const block = rowChildren.find((b) =>
            colChildren.some((c) => c.id === b.id)
          );

          if (!block) return null;

          return (
            <Block 
              key={`${row}-${col}`} 
              id={block.id} 
              child={1}          // 기본값
            />
          );
        })
      )}
        
        </div>
        
      </div>
    </div>
  );
}