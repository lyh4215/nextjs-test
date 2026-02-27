"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/* -------------------- MOCK DATA -------------------- */

type Comment = {
  id: string
  content: string
}

type Post = {
  id: string
  title: string
  content: string
  author: string
  updatedAt: string
  comments: Comment[]
}

const mockPosts: Post[] = [
  {
    id: "1",
    title: "Understanding Event Sourcing",
    content: "Full detailed content about event sourcing...",
    author: "Wonho",
    updatedAt: "2026-02-25T10:00:00Z",
    comments: [
      { id: "c1", content: "This is powerful!" },
      { id: "c2", content: "Can you explain snapshotting?" },
    ],
  },
  {
    id: "2",
    title: "Kafka vs WAL",
    content: "Discussing trade-offs between kafka and WAL...",
    author: "BackendDev",
    updatedAt: "2026-02-24T09:00:00Z",
    comments: [
      { id: "c3", content: "Outbox pattern fits here." },
      { id: "c4", content: "Nice architectural thinking." },
    ],
  },
  {
    id: "3",
    title: "Designing Relational UI",
    content: "Relational UI is not just master-detail...",
    author: "UIArchitect",
    updatedAt: "2026-02-20T12:00:00Z",
    comments: [{ id: "c5", content: "Love this pattern!" }],
  },
]

/* -------------------- PAGE -------------------- */

export default function Page() {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [detailMode, setDetailMode] = useState(false)

  const selectedPost = mockPosts.find(p => p.id === selectedPostId)

  const handleClick = (post: Post) => {
    if (selectedPostId === post.id) {
      // 두 번째 클릭 → detail 모드
      setDetailMode(true)
    } else {
      setSelectedPostId(post.id)
      setDetailMode(false)
    }
  }

  /* -------------------- DETAIL VIEW -------------------- */

  if (detailMode && selectedPost) {
    return (
      <div className="h-screen p-10 bg-background transition-all">
        <button
          onClick={() => setDetailMode(false)}
          className="mb-6 text-sm underline"
        >
          ← Back
        </button>

        <h1 className="text-3xl font-bold mb-4">{selectedPost.title}</h1>
        <p className="text-muted-foreground mb-2">
          Author: {selectedPost.author}
        </p>
        <p className="text-muted-foreground mb-6">
          Updated: {new Date(selectedPost.updatedAt).toLocaleString()}
        </p>

        <div className="text-lg">{selectedPost.content}</div>
      </div>
    )
  }

  /* -------------------- RELATIONAL VIEW -------------------- */

  return (
    <div className="h-screen flex transition-all duration-300">
      {/* LEFT LIST */}
      <div
        className={cn(
          "flex-1 p-6 transition-colors duration-300",
          selectedPost && "bg-muted/30"
        )}
      >
        <h1 className="text-2xl font-bold mb-6">Posts</h1>

        {mockPosts.map(post => {
          const isSelected = post.id === selectedPostId

          return (
            <Card
              key={post.id}
              onClick={() => handleClick(post)}
              className={cn(
                "cursor-pointer mb-4 transition-all duration-300",
                isSelected && "bg-muted shadow-md scale-[1.02]"
              )}
            >
              <CardContent className="p-4">
                <div className="font-semibold text-lg">
                  {post.title}
                </div>

                {/* 확장 영역 */}
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300",
                    isSelected ? "max-h-40 mt-3" : "max-h-0"
                  )}
                >
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Author: {post.author}</div>
                    <div>
                      Updated:{" "}
                      {new Date(post.updatedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* RIGHT COMMENT PANEL */}
      {selectedPost && (
        <div className="w-1/3 border-l p-6 bg-muted/30 transition-all duration-300">
          <h2 className="text-xl font-semibold mb-4">
            {selectedPost.title} - Comments
          </h2>

          <div className="space-y-3">
            {selectedPost.comments.map(comment => (
              <div
                key={comment.id}
                className="p-3 rounded-md bg-background border"
              >
                {comment.content}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}