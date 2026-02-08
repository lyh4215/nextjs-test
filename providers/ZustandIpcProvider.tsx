// providers/ZustandIpcProvider.tsx
"use client";

import { useEffect } from "react";
import { ipc } from "@/lib/ipc";
import { useCounterStore } from "@/store/useCounterStore";

export function ZustandIpcProvider() {
  const hydrate = useCounterStore((s) => s.hydrate);

  useEffect(() => {
    // 1️⃣ 새 탭 초기 상태 복구
    const raw = localStorage.getItem("counter-init");
    if (raw) {
      hydrate(JSON.parse(raw));
    }

    // 2️⃣ IPC 수신
    ipc.onmessage = (e) => {
      hydrate(e.data);
    };

    return () => {
      ipc.close();
    };
  }, [hydrate]);

  return null;
}
