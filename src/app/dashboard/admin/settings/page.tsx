import { getAdminSettings } from "@/actions/server/AdminSettings";
import AdminSettingsClient from "@/components/Shared/Admin/AdminSettingsClient";

export default async function AdminSettingsPage() {
  const data = await getAdminSettings();

  if (!data.success || !data.settings) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        {data.message || "Failed to load admin settings"}
      </div>
    );
  }

  return <AdminSettingsClient initialSettings={data.settings} />;
}
