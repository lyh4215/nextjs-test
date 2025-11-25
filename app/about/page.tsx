import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function Home() {
  return (
    <main className="p-10 flex gap-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>

        <Card
        title="Next.js 배우기"
        description="Next.js App Router와 Tailwind CSS로 컴포넌트 만들기"
        image="https://source.unsplash.com/random/300x200?code"
      />
      <Card
        title="Tailwind 연습"
        description="Tailwind로 빠르게 UI 구성하기"
      />
      <Card
        title="React + Next"
        description="클라이언트/서버 컴포넌트 배우기"
        image="https://source.unsplash.com/random/300x200?react"
      />
    </main>
  );
}