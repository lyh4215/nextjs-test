import PostsClient from "./PostsClient";

export default async function PostsPage() {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts");
  const posts = await res.json();

  const res2 = await fetch("http://localhost:3000/api/hello");
  const posts2 = await res2.json();
  console.log(posts2);

  return (
    <div>
      <h1 className="text-3xl font-bold p-4">Posts</h1>
      <PostsClient posts={posts} />
    </div>
  );
}
