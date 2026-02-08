// store/useCounterStore.ts
import { create } from "zustand";
import { ipc } from "@/lib/ipc";

type CounterState = {
  count: number;
  inc: () => void;
  hydrate: (state: Partial<CounterState>) => void;
};

export const useCounterStore = create<CounterState>((set, get) => ({
  count: 0,

  inc: () => {
    const next = get().count + 1;
    set({ count: next });

    // 🔹 다른 탭으로 전파
    ipc.postMessage({ count: next });

    // 🔹 초기 복구용 (선택)
    localStorage.setItem("counter-init", JSON.stringify({ count: next }));
  },

  hydrate: (state) => {
    set(state);
  },
}));
