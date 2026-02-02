import { StatCardProps } from "@/types/MealTrach.types";

const StatCard = ({ icon, label, value }: StatCardProps) => (
  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
    <div className="text-primary-foreground/80 mb-2">{icon}</div>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-xs opacity-80 uppercase tracking-wider font-medium">
      {label}
    </p>
  </div>
);
export default StatCard;
