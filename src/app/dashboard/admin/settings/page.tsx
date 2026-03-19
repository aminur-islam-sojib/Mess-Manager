export default function AdminSettingsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Settings</h1>
        <p className="text-sm text-muted-foreground">
          Global policy and operational configuration for the platform.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">
          Planned Controls
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Global defaults for expense and deposit policies</li>
          <li>Security controls and admin session policies</li>
          <li>Audit retention and export settings</li>
        </ul>
      </div>
    </div>
  );
}
