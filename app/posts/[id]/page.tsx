import Link from "next/link"
import { ArrowLeft, User, Clock, MessageSquare } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { posts, getPostComments } from "@/lib/data"
import { notFound } from "next/navigation"

function formatFullDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const post = posts.find((p) => p.id === id)

  if (!post) notFound()

  const comments = getPostComments(post.id)

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-8 md:py-12">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="size-4" />
          <span>Back to posts</span>
        </Link>

        {/* Post header */}
        <div className="mb-8">
          <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-secondary text-muted-foreground">
            {post.category}
          </span>
          <h1 className="text-2xl font-bold text-foreground mt-3 text-balance">
            {post.title}
          </h1>
          <p className="text-base text-muted-foreground mt-2 leading-relaxed">
            {post.excerpt}
          </p>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1.5">
              <User className="size-4 text-muted-foreground" />
              <span className="text-sm text-foreground font-medium">
                {post.author}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="size-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {formatFullDate(post.updatedAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Post content */}
        <div className="border-t border-border pt-8 mb-12">
          <p className="text-sm text-foreground leading-relaxed">
            {post.content}
          </p>
        </div>

        {/* Comments section */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <MessageSquare className="size-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-foreground">
              Comments
            </span>
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-md tabular-nums">
              {comments.length}
            </span>
          </div>
          <div className="divide-y divide-border">
            {comments.map((comment) => (
              <div key={comment.id} className="px-6 py-4 flex gap-3">
                <Avatar className="size-8 shrink-0">
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-medium">
                    {getInitials(comment.author)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">
                      {comment.author}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatFullDate(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
