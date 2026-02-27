"use client"

import { MessageSquare, Clock, User, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Post } from "@/lib/data"

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

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

interface PostItemProps {
  post: Post
  isSelected: boolean
  onSelect: (postId: string) => void
}

export function PostItem({ post, isSelected, onSelect }: PostItemProps) {
  return (
    <button
      onClick={() => onSelect(post.id)}
      className={cn(
        "w-full text-left transition-all duration-300 ease-out border-b border-border",
        "group relative",
        isSelected
          ? "bg-surface-active text-surface-active-foreground"
          : "bg-card text-card-foreground hover:bg-secondary"
      )}
    >
      {/* Connector strip for selected item - visually bridges to the comment panel */}
      {isSelected && (
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-surface-active" />
      )}

      <div className="px-5 py-4">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-md",
                  isSelected
                    ? "bg-surface-active-foreground/10 text-surface-active-foreground"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                {post.category}
              </span>
              <span
                className={cn(
                  "text-xs",
                  isSelected ? "text-surface-active-muted" : "text-muted-foreground"
                )}
              >
                {formatDate(post.createdAt)}
              </span>
            </div>
            <h3 className="font-semibold text-sm leading-snug">{post.title}</h3>
            <p
              className={cn(
                "text-xs mt-1 leading-relaxed",
                isSelected ? "text-surface-active-muted" : "text-muted-foreground"
              )}
            >
              {post.excerpt}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0 mt-1">
            <MessageSquare
              className={cn(
                "size-3.5",
                isSelected ? "text-surface-active-muted" : "text-muted-foreground"
              )}
            />
            <span
              className={cn(
                "text-xs tabular-nums",
                isSelected ? "text-surface-active-muted" : "text-muted-foreground"
              )}
            >
              {post.commentCount}
            </span>
          </div>
        </div>

        {/* Expanded details - only when selected */}
        <div
          className={cn(
            "grid transition-all duration-300 ease-out",
            isSelected
              ? "grid-rows-[1fr] opacity-100 mt-3"
              : "grid-rows-[0fr] opacity-0 mt-0"
          )}
        >
          <div className="overflow-hidden">
            <div className="flex items-center justify-between pt-3 border-t border-surface-active-foreground/10">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <User className="size-3.5 text-surface-active-muted" />
                  <span className="text-xs text-surface-active-foreground">
                    {post.author}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5 text-surface-active-muted" />
                  <span className="text-xs text-surface-active-muted">
                    Updated {timeAgo(post.updatedAt)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-surface-active-muted">
                <span>View detail</span>
                <ChevronRight className="size-3.5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}
