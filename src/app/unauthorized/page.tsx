export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">❌ Unauthorized Access</h1>
        <p className="text-muted-foreground text-lg">
          Your role is not allowed to access this page.
        </p>
        <p className="text-sm text-gray-500">
          If you believe this is an error, please contact support.
        </p>
        <a
          href="/auth/login"
          className="inline-block mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
        >
          Go to Login
        </a>
      </div>
    </div>
  );
}
