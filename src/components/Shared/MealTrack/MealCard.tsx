import { MealCardProps } from "@/types/MealTrach.types";

const MealCard = ({ icon, color, label, count, pct }: MealCardProps) => (
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
    <p className="text-sm font-medium mb-3">{label}</p>
    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
      <div
        className={`h-full bg-${color}-500 transition-all duration-500`}
        style={{ width: `${pct}% `, backgroundColor: "red" }}
      />
    </div>
    <p className="text-[10px] mt-2 text-right font-bold text-muted-foreground">
      {pct.toFixed(1)}% of total
    </p>
  </div>
);

export default MealCard;
