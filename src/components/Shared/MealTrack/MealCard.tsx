import { MealCardProps } from "@/types/MealTrach.types";

const MealCard = ({ icon, color, label, count }: MealCardProps) => (
  <div className="bg-card border border-border rounded-2xl p-6">
    <div className="flex justify-between items-start mb-4">
      <div
        className={`w-12 h-12 rounded-xl bg-${color}-500/10 flex items-center justify-center text-${color}-500`}
      >
        {icon}
      </div>
      <div className="text-right">
        <p className="text-2xl font-bold">{count}</p>
        <p className="text-xs text-muted-foreground">meals</p>
      </div>
    </div>
    <p className="text-sm font-medium ">{label}</p>
  </div>
);

export default MealCard;
