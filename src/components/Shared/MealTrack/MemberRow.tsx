import { Coffee, Moon, Sun } from "lucide-react";
import MemberMealStat from "./MemberMealStat";
import { MemberRowProps } from "@/types/MealTrach.types";

const MemberRow = ({ member, rank, costPerMeal }: MemberRowProps) => (
  <div className="p-5 hover:bg-accent/50 transition-colors group">
    <div className="flex items-start gap-4">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold ${rank === 0 ? "bg-yellow-500/20 text-yellow-600 border-2 border-yellow-500/30" : rank === 1 ? "bg-gray-400/20 text-gray-600 border-2 border-gray-400/30" : rank === 2 ? "bg-orange-600/20 text-orange-700 border-2 border-orange-600/30" : "bg-muted text-muted-foreground"}`}
      >
        {rank === 0
          ? "🥇"
          : rank === 1
            ? "🥈"
            : rank === 2
              ? "🥉"
              : `#${rank + 1}`}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="font-semibold">{member.name}</p>
            <p className="text-xs text-muted-foreground">{member.email}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-primary">
              {member.totalMeals}
            </p>
            <p className="text-[10px] uppercase text-muted-foreground font-bold">
              Total Meals
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <MemberMealStat
            icon={<Coffee />}
            val={member.breakfast}
            label="B"
            color="orange"
          />
          <MemberMealStat
            icon={<Sun />}
            val={member.lunch}
            label="L"
            color="yellow"
          />
          <MemberMealStat
            icon={<Moon />}
            val={member.dinner}
            label="D"
            color="blue"
          />
        </div>
        <div className="mt-3 flex justify-between p-2 rounded-lg bg-muted/30 text-sm">
          <span className="text-muted-foreground">Daily Bill</span>
          <span className="font-bold">
            ${(member.totalMeals * costPerMeal).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  </div>
);

export default MemberRow;
