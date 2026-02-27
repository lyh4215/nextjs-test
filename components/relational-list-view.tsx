"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { FileText } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PostItem } from "@/components/post-item"
import { CommentPanel } from "@/components/comment-panel"
import { cn } from "@/lib/utils"
import { posts, getPostComments } from "@/lib/data"

export function RelationalListView() {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const router = useRouter()

  const selectedPost = selectedPostId
    ? posts.find((p) => p.id === selectedPostId) ?? null
    : null
  const selectedComments = selectedPostId
    ? getPostComments(selectedPostId)
    : []

  const handleSelect = useCallback(
    (postId: string) => {
      if (selectedPostId === postId) {
        // Second click → navigate to detail
        router.push(`/posts/${postId}`)
      } else {
        setSelectedPostId(postId)
      }
    },
    [selectedPostId, router]
  )

  const hasSelection = selectedPostId !== null

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {/* Post list panel */}
      <div
        className={cn(
          "transition-all duration-300 ease-out flex flex-col shrink-0",
          hasSelection ? "w-[55%]" : "w-full"
        )}
      >
        {/* List header */}
        <div className="px-5 py-4 border-b border-border flex items-center gap-2">
          <FileText className="size-4 text-muted-foreground" />
          <h1 className="text-sm font-semibold text-foreground">Posts</h1>
          <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-md tabular-nums">
            {posts.length}
          </span>
        </div>

        {/* Post list */}
        <ScrollArea className="flex-1">
          <div className="flex flex-col">
            {posts.map((post) => (
              <PostItem
                key={post.id}
                post={post}
                isSelected={selectedPostId === post.id}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Comment panel */}
      <div
        className={cn(
          "transition-all duration-300 ease-out overflow-hidden border-l",
          hasSelection
            ? "w-[45%] border-surface-active-foreground/10"
            : "w-0 border-transparent"
        )}
      >
        <CommentPanel
          post={selectedPost}
          comments={selectedComments}
          visible={hasSelection}
        />
      </div>
    </div>
  )
}
