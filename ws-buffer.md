1. 가장 먼저 적용할 것: startTransition
React에서는 모든 상태 변경을 동일한 우선순위로 처리할 필요가 없어.
- 사용자 입력, 드래그 → 높은 우선순위
- WebSocket으로 들어오는 데이터 표시 → 상대적으로 낮은 우선순위
"use client";

import { startTransition, useEffect, useState } from "react";

export function LiveData() {
  const [data, setData] = useState<Data[]>([]);

  useEffect(() => {
    const ws = new WebSocket("wss://example.com");

    ws.onmessage = (event) => {
      const nextData = JSON.parse(event.data);

      startTransition(() => {
        setData(nextData);
      });
    };

    return () => ws.close();
  }, []);

  return <DataView data={data} />;
}


핵심은 React가 렌더링을 중단하고 더 중요한 사용자 입력을 먼저 처리할 수 있다는 것. 
React+1


단, startTransition이 JSON 파싱이나 무거운 계산을 비동기로 처리해 주는 건 아니야. 또한 DOM 업데이트 단계까지 모두 중단 가능하게 만드는 것도 아니고.
2. WebSocket 수신과 React 렌더링 주기 분리
WebSocket 메시지가 올 때마다 반드시 setState할 필요는 없어.

예를 들어 0.2초마다 데이터가 도착한다고 해보자.
수신과 렌더링을 분리하는 구조
데이터 수신은 즉시 처리하고, 화면 갱신은 별도 주기로 진행
예시 코드:
const bufferRef = useRef<Map<string, Item>>(new Map());

useEffect(() => {
  const ws = new WebSocket(url);

  ws.onmessage = (event) => {
    const item: Item = JSON.parse(event.data);

    // 렌더링 없이 최신 데이터 저장
    bufferRef.current.set(item.id, item);
  };

  const timer = setInterval(() => {
    if (bufferRef.current.size === 0) return;

    const changes = [...bufferRef.current.values()];
    bufferRef.current.clear();

    startTransition(() => {
      setItems(prev => applyChanges(prev, changes));
    });
  }, 100);

  return () => {
    ws.close();
    clearInterval(timer);
  };
}, [url]);


이렇게 하면 0.2초마다 메시지 1개를 받든, 100개를 받든 일정 간격으로 묶어서 React에 전달할 수 있어.

단, 이벤트 로그처럼 모든 메시지가 중요한 경우에는 Map으로 덮어쓰면 안 되고 큐를 사용해야 해.
