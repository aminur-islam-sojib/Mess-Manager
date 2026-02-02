import { MemberMealStatProps } from "@/types/MealTrach.types";

const MemberMealStat = ({ icon, val, color }: MemberMealStatProps) => (
  <div
    className={`bg-${color}-500/5 border border-${color}-500/10 rounded-lg p-2 text-center`}
  >
    <div className={`text-${color}-500 flex justify-center scale-75`}>
      {icon}
    </div>
    <p className="text-xs font-bold">{val}</p>
  </div>
);

export default MemberMealStat;
