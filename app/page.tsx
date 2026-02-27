import { RelationalListView } from "@/components/relational-list-view"

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-lg font-bold text-foreground text-balance">
            Relational List View
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Click a post to reveal its comments. Click again to open detail view.
          </p>
        </div>
        <RelationalListView />
      </div>
    </main>
  )
}
