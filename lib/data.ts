// Types mirroring Prisma models
export interface Post {
  id: string
  title: string
  excerpt: string
  content: string
  author: string
  category: string
  createdAt: string
  updatedAt: string
  commentCount: number
}

export interface Comment {
  id: string
  postId: string
  author: string
  content: string
  createdAt: string
}

// Mock data — swap with Prisma queries when ready
export const posts: Post[] = [
  {
    id: "1",
    title: "Building Relational UI Patterns",
    excerpt: "Exploring how master-detail views can evolve beyond simple navigation patterns.",
    content: "In modern web applications, the traditional list-to-detail navigation pattern often breaks the user's mental model of data relationships. By keeping context visible while revealing connections, we create interfaces that feel more natural and informative.",
    author: "Minjun Kim",
    category: "Design",
    createdAt: "2026-02-20T09:00:00Z",
    updatedAt: "2026-02-25T14:30:00Z",
    commentCount: 3,
  },
  {
    id: "2",
    title: "Next.js 16 Cache Components",
    excerpt: "A deep dive into the new 'use cache' directive and how it changes data fetching.",
    content: "The introduction of Cache Components in Next.js 16 represents a fundamental shift in how we think about caching. The 'use cache' directive allows developers to be more explicit about what gets cached and for how long.",
    author: "Soyeon Park",
    category: "Engineering",
    createdAt: "2026-02-18T11:00:00Z",
    updatedAt: "2026-02-24T09:15:00Z",
    commentCount: 5,
  },
  {
    id: "3",
    title: "Prisma vs Drizzle in 2026",
    excerpt: "Comparing two popular ORMs for TypeScript projects with real benchmarks.",
    content: "Both Prisma and Drizzle have matured significantly. While Prisma offers a more declarative schema-first approach with excellent tooling, Drizzle provides a SQL-like query builder that appeals to developers who prefer staying closer to raw SQL.",
    author: "Jihoon Lee",
    category: "Engineering",
    createdAt: "2026-02-15T08:00:00Z",
    updatedAt: "2026-02-22T16:45:00Z",
    commentCount: 4,
  },
  {
    id: "4",
    title: "The Art of Micro-Interactions",
    excerpt: "Small details that make interfaces feel alive and responsive to user actions.",
    content: "Micro-interactions are the subtle animations and transitions that provide feedback to users. From button hover states to loading indicators, these details transform a static interface into a living, breathing experience.",
    author: "Eunji Choi",
    category: "Design",
    createdAt: "2026-02-12T10:00:00Z",
    updatedAt: "2026-02-20T11:20:00Z",
    commentCount: 2,
  },
  {
    id: "5",
    title: "Server Components Are Not Magic",
    excerpt: "Understanding the mental model behind React Server Components.",
    content: "There's a common misconception that RSCs are a silver bullet for performance. In reality, they're a tool for managing the boundary between server and client rendering. Understanding when and why to use them is crucial.",
    author: "Donghyun Yoo",
    category: "Engineering",
    createdAt: "2026-02-10T14:00:00Z",
    updatedAt: "2026-02-18T08:00:00Z",
    commentCount: 6,
  },
  {
    id: "6",
    title: "Designing for Data Density",
    excerpt: "How to present complex information without overwhelming users.",
    content: "Data-dense interfaces are essential for professional tools. The key is progressive disclosure — showing the minimum viable information upfront and revealing details on demand through thoughtful interaction patterns.",
    author: "Hayoung Jang",
    category: "Design",
    createdAt: "2026-02-08T09:30:00Z",
    updatedAt: "2026-02-16T13:10:00Z",
    commentCount: 3,
  },
]

export const comments: Comment[] = [
  // Post 1 comments
  { id: "c1", postId: "1", author: "Alex Chen", content: "This is exactly the pattern I've been looking for. The visual connection between selected item and detail panel is brilliant.", createdAt: "2026-02-21T10:00:00Z" },
  { id: "c2", postId: "1", author: "Yuna Shin", content: "Would love to see how this performs with hundreds of items in the list. Any virtualization strategies?", createdAt: "2026-02-22T15:30:00Z" },
  { id: "c3", postId: "1", author: "Marco Rivera", content: "Implemented something similar using react-resizable-panels. The key is getting the animation timing right.", createdAt: "2026-02-23T08:45:00Z" },
  // Post 2 comments
  { id: "c4", postId: "2", author: "Sarah Johnson", content: "The 'use cache' directive feels much more intuitive than the old revalidate patterns.", createdAt: "2026-02-19T09:00:00Z" },
  { id: "c5", postId: "2", author: "Taehyung Kang", content: "How does this interact with server actions? Any gotchas?", createdAt: "2026-02-20T11:00:00Z" },
  { id: "c6", postId: "2", author: "Emma Wilson", content: "Been using this in production for a week. The DX improvement is significant.", createdAt: "2026-02-21T14:00:00Z" },
  { id: "c7", postId: "2", author: "Chris Park", content: "Great explanation. Finally understanding when to use cacheLife vs plain revalidation.", createdAt: "2026-02-22T16:00:00Z" },
  { id: "c8", postId: "2", author: "Lia Martinez", content: "Would be nice to have a comparison chart with the old ISR approach.", createdAt: "2026-02-23T09:30:00Z" },
  // Post 3 comments
  { id: "c9", postId: "3", author: "David Kim", content: "Drizzle's type inference from the schema is genuinely amazing.", createdAt: "2026-02-16T10:00:00Z" },
  { id: "c10", postId: "3", author: "Nina Patel", content: "Prisma Studio alone is worth it for prototyping. Hard to beat that DX.", createdAt: "2026-02-17T13:00:00Z" },
  { id: "c11", postId: "3", author: "Tommy Lee", content: "The benchmark results are surprising. Thanks for doing actual measurements.", createdAt: "2026-02-18T09:00:00Z" },
  { id: "c12", postId: "3", author: "Sophia Wang", content: "What about edge runtime support? That's the deciding factor for me.", createdAt: "2026-02-19T15:00:00Z" },
  // Post 4 comments
  { id: "c13", postId: "4", author: "Ryan O'Brien", content: "The button ripple effect example was so clean. Implementing it right now.", createdAt: "2026-02-13T10:00:00Z" },
  { id: "c14", postId: "4", author: "Jisoo Han", content: "Accessibility considerations for animations are often overlooked. Good to see prefers-reduced-motion mentioned.", createdAt: "2026-02-14T12:00:00Z" },
  // Post 5 comments
  { id: "c15", postId: "5", author: "Mike Thompson", content: "Finally someone explains this clearly without the hype.", createdAt: "2026-02-11T10:00:00Z" },
  { id: "c16", postId: "5", author: "Hana Yoshida", content: "The mental model diagram really helped. Can I share this?", createdAt: "2026-02-12T11:00:00Z" },
  { id: "c17", postId: "5", author: "Andre Silva", content: "This should be required reading before anyone uses the App Router.", createdAt: "2026-02-13T14:00:00Z" },
  { id: "c18", postId: "5", author: "Julie Kwon", content: "Disagree slightly on the 'not magic' part — the DX does feel magical when it clicks.", createdAt: "2026-02-14T09:00:00Z" },
  { id: "c19", postId: "5", author: "Ben Clarke", content: "Great companion piece to the official docs. More practical examples needed like this.", createdAt: "2026-02-15T16:00:00Z" },
  { id: "c20", postId: "5", author: "Sumi Nakamura", content: "The serialization boundary explanation was the 'aha' moment for me.", createdAt: "2026-02-16T10:00:00Z" },
  // Post 6 comments
  { id: "c21", postId: "6", author: "Oliver Saunders", content: "Progressive disclosure is the key. This post nails the implementation details.", createdAt: "2026-02-09T10:00:00Z" },
  { id: "c22", postId: "6", author: "Minji Ryu", content: "The information hierarchy examples are super practical. Bookmarked!", createdAt: "2026-02-10T14:00:00Z" },
  { id: "c23", postId: "6", author: "Leo Tanaka", content: "Wish more enterprise tools followed these principles. Most dashboards are overwhelming.", createdAt: "2026-02-11T09:00:00Z" },
]

export function getPostComments(postId: string): Comment[] {
  return comments.filter((c) => c.postId === postId)
}
