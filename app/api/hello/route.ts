// app/api/hello/route.ts

export async function GET() {
  return Response.json({
    message: "Hello from Next.js API!",
    timestamp: Date.now(),
  });
}
