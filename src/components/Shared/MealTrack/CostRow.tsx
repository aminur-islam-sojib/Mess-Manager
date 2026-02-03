import { CostRowProps } from "@/types/MealTrach.types";

const CostRow = ({ label, amount, icon }: CostRowProps) => (
  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
    <div className="flex items-center gap-3">
      {icon}
      <span className="text-sm font-medium">{label} Cost</span>
    </div>
    <span className="font-bold">${amount.toLocaleString()}</span>
  </div>
);

export default CostRow;
