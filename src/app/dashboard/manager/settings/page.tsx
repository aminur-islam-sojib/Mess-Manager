import { getManagerSettingsData } from "@/actions/server/ManagerSettings";
import ManagerSettingsClient from "@/components/ManagerComponents/Settings/ManagerSettingsClient";

export default async function ManagerSettingsPage() {
  const data = await getManagerSettingsData();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-6">
        <ManagerSettingsClient data={data} />
      </div>
    </div>
  );
}
