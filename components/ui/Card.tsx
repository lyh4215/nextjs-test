export function Card({
  title,
  description,
  image,
}: {
  title: string;
  description: string;
  image?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition p-5 max-w-sm">
      {image && (
        <img
          src={image}
          alt={title}
          className="rounded-lg mb-4 w-full h-40 object-cover"
        />
      )}
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
