// app/page.tsx
"use client";

import { useCounterStore } from "@/store/useCounterStore";

export default function Page() {
  const count = useCounterStore((s) => s.count);
  const inc = useCounterStore((s) => s.inc);

  return (
    <main style={{ padding: 40 }}>
      <h1>Zustand + IPC Demo</h1>
      <p>Count: {count}</p>
      <button onClick={inc}>+</button>
    </main>
  );
}
