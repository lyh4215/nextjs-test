"use client";

const fetch_test = async () => {
    const res = await fetch("/api/hello");
    const data = await res.json();
    console.log(data);
}

export default function PostsClient({ posts }: { posts: any[] }) {
  return (
    <div>
        <ul className="space-y-4 p-4">
        {posts.map((post) => (
            <li key={post.id} className="border p-4 rounded">
            <h2 className="font-semibold">{post.title}</h2>
            <p className="text-gray-600">{post.body}</p>
            </li>
        ))}
        </ul>
        <button onClick={()=>fetch_test()}>button</button>
    </div>
  );
}
