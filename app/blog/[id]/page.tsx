interface PageProps {
  params: {
    id: string;
  };
}

export default async function BlogPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="p-10 text-3xl font-bold">
      Blog Post ID: 
      <button className = "px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition">{id}</button>
    </div>
  );
}
