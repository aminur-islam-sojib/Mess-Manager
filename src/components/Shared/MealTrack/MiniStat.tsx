import { MiniStatProps } from "@/types/MealTrach.types";

const MiniStat = ({ icon, count, label, color }: MiniStatProps) => (
  <div
    className={`text-center p-3 rounded-xl bg-${color}-500/10 border border-${color}-500/20`}
  >
    <div className={`text-${color}-500 flex justify-center mb-1`}>{icon}</div>
    <p className="text-lg font-bold">{count}</p>
    <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
  </div>
);
export default MiniStat;
