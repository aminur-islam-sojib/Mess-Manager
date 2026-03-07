import { getUserSettingsData } from "@/actions/server/UserSettings";
import UserSettingsClient from "@/components/UserComponents/Settings/UserSettingsClient";

export default async function UserSettingsPage() {
  const result = await getUserSettingsData()
    .then((data) => ({
      success: true as const,
      data,
    }))
    .catch((error: unknown) => ({
      success: false as const,
      message:
        error instanceof Error
          ? error.message
          : "Unable to load your settings right now.",
    }));

  if (!result.success) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-border bg-card/70 p-6 shadow-sm">
            <p className="text-sm font-medium text-primary">Settings</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
              Settings unavailable
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {result.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-6">
        <UserSettingsClient data={result.data} />
      </div>
    </div>
  );
}
