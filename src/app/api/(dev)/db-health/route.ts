import { checkMongoConnection } from "@/lib/dbConnect";

export async function GET() {
  const connected = await checkMongoConnection();

  return Response.json(
    {
      connected,
      message: connected ? "MongoDB is connected" : "MongoDB is not connected",
      timestamp: new Date().toISOString(),
    },
    {
      status: connected ? 200 : 503,
    },
  );
}
