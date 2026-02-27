"use client"

import { MessageSquare } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { Post, Comment } from "@/lib/data"

function timeAgo(dateStr: string) {
  const now = new Date("2026-02-27T12:00:00Z")
  const d = new Date(dateStr)
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

interface CommentPanelProps {
  post: Post | null
  comments: Comment[]
  visible: boolean
}

export function CommentPanel({ post, comments, visible }: CommentPanelProps) {
  return (
    <div
      className={cn(
        "h-full bg-surface-active text-surface-active-foreground transition-all duration-300 ease-out flex flex-col",
        visible ? "opacity-100" : "opacity-0"
      )}
    >
      {post && (
        <>
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-surface-active-foreground/10">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="size-4 text-surface-active-muted" />
              <span className="text-xs font-medium text-surface-active-muted uppercase tracking-wider">
                Comments
              </span>
              <span className="text-xs font-medium text-surface-active-muted bg-surface-active-foreground/10 px-2 py-0.5 rounded-md tabular-nums">
                {comments.length}
              </span>
            </div>
            <h2 className="text-sm font-semibold text-surface-active-foreground leading-snug">
              {post.title}
            </h2>
          </div>

          {/* Comments list */}
          <ScrollArea className="flex-1">
            <div className="px-6 py-4 flex flex-col gap-4">
              {comments.map((comment, index) => (
                <div
                  key={comment.id}
                  className="animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
                >
                  <div className="flex gap-3">
                    <Avatar className="size-7 shrink-0 mt-0.5">
                      <AvatarFallback className="bg-surface-active-foreground/10 text-surface-active-foreground text-[10px] font-medium">
                        {getInitials(comment.author)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-surface-active-foreground">
                          {comment.author}
                        </span>
                        <span className="text-[11px] text-surface-active-muted">
                          {timeAgo(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-surface-active-muted leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  )
}
