import { Minus, Plus } from "lucide-react";
import { Button } from "../../ui/button";
import { Card, CardContent } from "../../ui/card";

export const MealCounter = ({
  label,
  value,
  onChange,
  colorClass,
}: {
  label: string;
  value: number;
  onChange: (increment: boolean) => void;
  colorClass: string;
}) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className={`text-2xl font-bold ${colorClass}`}>{value}</span>
      </div>
      <div className="flex items-center justify-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onChange(false)}
          className="w-10 h-10 rounded-full"
        >
          <Minus className="w-5 h-5" />
        </Button>
        <Button
          size="icon"
          onClick={() => onChange(true)}
          className="w-10 h-10 rounded-full"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>
    </CardContent>
  </Card>
);
