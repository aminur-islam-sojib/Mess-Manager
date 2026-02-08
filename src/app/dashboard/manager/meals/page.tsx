import { getMessMembers } from "@/actions/server/Mess";
import MealManagementClient from "@/components/ManagerComponents/Meals/MealManagementClient";

const MealManagement = async () => {
  const messData = await getMessMembers();
  if (!messData.success || !messData.messId) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <p className="text-foreground">Failed to load mess data</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card ">
        <div className=" ">
          <h1 className="text-xl font-bold text-foreground">
            {messData.messName}
          </h1>
          <p className="text-sm text-muted-foreground">Meal Management</p>
        </div>
      </div>

      {/* Input */}
      <MealManagementClient messData={messData} />
    </div>
  );
};

export default MealManagement;
