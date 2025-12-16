// app/example/page.tsx 또는 아무 컴포넌트
"use clients";

import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@/components/ui/context-menu";

export default function ContextMenuExample() {
  return (
    <div className="flex h-screen items-center justify-center">
      <ContextMenu>
        {/* 우클릭 대상 */}
        <ContextMenuTrigger asChild>
          <div className="w-64 h-32 rounded-md border flex items-center justify-center cursor-context-menu">
            이 div를 우클릭
          </div>
        </ContextMenuTrigger>

        {/* 뜨는 메뉴 */}
        <ContextMenuContent>
          <ContextMenuItem onSelect={() => alert("Rename")}>
            이름 변경
          </ContextMenuItem>
          <ContextMenuItem onSelect={() => alert("Delete")}>
            삭제
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
}
