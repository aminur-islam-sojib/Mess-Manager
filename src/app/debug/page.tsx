import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export default async function DebugPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold">🔍 Debug Information</h1>

        <div className="bg-muted p-4 rounded-lg">
          <h2 className="font-bold mb-2">Session Data:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <h2 className="font-bold mb-2">User Info:</h2>
          {session?.user ? (
            <div className="space-y-2 text-sm">
              <p>
                <strong>Email:</strong> {session.user.email}
              </p>
              <p>
                <strong>Name:</strong> {session.user.name}
              </p>
              <p>
                <strong>Role:</strong> {session.user.role}
              </p>
              <p>
                <strong>ID:</strong> {session.user.id}
              </p>
            </div>
          ) : (
            <p className="text-destructive">No session found</p>
          )}
        </div>

        <a
          href="/dashboard"
          className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
