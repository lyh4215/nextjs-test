그러면 네 경우에는 Dependency 기반 Derived Cache Middleware를 만드는 게 꽤 적합해.

예를 들어 다음 구조인 거지.
interface EditorStore {
  // Source State
  cells: Cell[];
  rows: Row[];
  columns: Column[];

  // Derived Cache
  layoutCache: LayoutCache;
}


그리고 의존성은 다음과 같아.
cells, rows, columns 중 하나라도 변경되면 layoutCache를 갱신
핵심은 모든 Action에서 캐시를 직접 갱신하지 않고, State 변경을 가로채서 의존하는 값이 바뀌었는지 검사한 다음 자동으로 계산하는 것이야.

그리고 이때 캐시를 별도 set()으로 갱신하지 않고, 원본 State와 함께 한 번에 갱신하면 돼.
구현 예시: Dependency를 선언하는 Middleware
캐시 계산 로직과 Middleware를 분리해 보자.
1. 캐시 계산 함수
// cache/layout.ts
export function computeLayout(
  cells: Cell[],
  rows: Row[],
  columns: Column[]
): LayoutCache {
  // 실제 레이아웃 계산
  return buildLayout(cells, rows, columns);
}


2. 범용 Derived Cache Middleware
// middleware/withDerived.ts
import type { StateCreator } from "zustand";

type DerivedRule<T> = {
  deps: (state: T) => readonly unknown[];
  compute: (state: T) => Partial<T>;
};

export function withDerived<T extends object>(
  initializer: StateCreator<T, [], [], T>,
  rules: DerivedRule<T>[]
): StateCreator<T, [], [], T> {
  return (set, get, api) => {
    const derivedSet: typeof set = (partial, replace) => {
      if (replace) {
        throw new Error("Full state replacement is not supported");
      }

      set((prev) => {
        const patch =
          typeof partial === "function"
            ? partial(prev)
            : partial;

        if (patch === prev) return prev;

        let next = { ...prev, ...patch };

        for (const rule of rules) {
          const before = rule.deps(prev);
          const after = rule.deps(next);

          const changed = before.some(
            (value, i) => !Object.is(value, after[i])
          );

          if (changed) {
            next = { ...next, ...rule.compute(next) };
          }
        }

        return next;
      });
    };

    return initializer(derivedSet, get, api);
  };
}


위 구현은 set의 기본 병합 방식을 전제로 하며, replace: true는 지원하지 않아. 또한 초기 캐시 값은 별도로 올바르게 생성해야 해.
3. Store에 적용
// store/editorStore.ts
export const useEditorStore = create<EditorStore>()(
  withDerived(
    (set, get) => ({
      cells: initialCells,
      rows: initialRows,
      columns: initialColumns,

      layoutCache: computeLayout(
        initialCells,
        initialRows,
        initialColumns
      ),

      updateCell: (id, patch) =>
        set((state) => ({
          cells: state.cells.map((cell) =>
            cell.id === id ? { ...cell, ...patch } : cell
          ),
        })),

      updateRow: (id, patch) =>
        set((state) => ({
          rows: state.rows.map((row) =>
            row.id === id ? { ...row, ...patch } : row
          ),
        })),
    }),

    [
      {
        deps: (s) => [s.cells, s.rows, s.columns],
        compute: (s) => ({
          layoutCache: computeLayout(
            s.cells,
            s.rows,
            s.columns
          ),
        }),
      },
    ]
  )
);


이렇게 하면 updateCell, updateRow 등의 Action은 캐시 존재 자체를 몰라도 돼.

또한 Object.is로 의존성의 참조를 비교하므로, 관련 없는 State가 변경되면 computeLayout()을 호출하지 않아.
4. 확장하면 여러 캐시도 관리할 수 있어
[
  {
    deps: (s) => [s.cells, s.rows, s.columns],
    compute: (s) => ({
      layoutCache: computeLayout(s.cells, s.rows, s.columns),
    }),
  },
  {
    deps: (s) => [s.cells],
    compute: (s) => ({
      searchIndex: buildSearchIndex(s.cells),
    }),
  },
  {
    deps: (s) => [s.layoutCache, s.viewport],
    compute: (s) => ({
      visibleCells: computeVisibleCells(
        s.layoutCache,
        s.viewport
      ),
    }),
  },
]


여기서는 선언 순서가 중요해. visibleCells가 layoutCache에 의존하므로 layoutCache 계산이 먼저 실행되어야 해.
5. 실제 사용 시 주의할 점
- 참조 불변성: cells.push(...)처럼 원본을 직접 변경하면 의존성 변경을 놓칠 수 있어.
- 외부 업데이트: useEditorStore.setState()를 직접 호출하면 이 예제의 derivedSet을 거치지 않아. 
  GitHub+1
- 캐시 소유권: layoutCache는 일반 Action에서 수정하지 않고 Middleware만 관리하도록 규칙을 정하는 게 좋아.
- 연산량: Dependency 검사는 저렴하지만 computeLayout()이 무거우면 State 업데이트 자체가 느려질 수 있어.
- Next.js: Store를 서버 요청 간 공유하지 않도록 주의하고, 사용자별 초기 데이터가 다르면 Store 인스턴스를 요청 또는 Provider 단위로 관리하는 게 안전해.
