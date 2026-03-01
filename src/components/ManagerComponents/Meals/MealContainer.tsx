"use client";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface MealCounterProps {
  label: string;
  value: number;
  onChange: (increment: boolean) => void;
  colorClass: string;
}

export const MealCounter = ({
  label,
  value,
  onChange,
  colorClass,
}: MealCounterProps) => {
  // Subtle glow and border colors based on the role
  const accentColor = colorClass.includes("orange")
    ? "hover:border-orange-500/50"
    : colorClass.includes("green")
      ? "hover:border-emerald-500/50"
      : "hover:border-blue-500/50";

  return (
    <div className="w-full group">
      <div
        className={`relative flex items-center justify-between bg-card border border-border rounded-2xl p-3 transition-all duration-200 ${accentColor} hover:shadow-sm`}
      >
        {/* Left Section: Info */}
        <div className="flex flex-col pl-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">
            {label}
          </span>
          <div className="flex items-baseline gap-1">
            <AnimatePresence mode="wait">
              <motion.span
                key={value}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="text-2xl font-semibold tabular-nums tracking-tight text-foreground"
              >
                {value % 1 === 0 ? value : value.toFixed(1)}
              </motion.span>
            </AnimatePresence>
            <span className="text-[10px] font-medium text-muted-foreground/50">
              qty
            </span>
          </div>
        </div>

        {/* Right Section: Controls */}
        <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-xl border border-border/50">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onChange(false)}
            disabled={value <= 0}
            className="h-10 w-10 rounded-lg hover:bg-background hover:text-destructive transition-all active:scale-95 disabled:opacity-30"
          >
            <Minus className="w-4 h-4" />
          </Button>

          <div className="w-px h-4 bg-border/60 mx-1" />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onChange(true)}
            className={`h-10 w-10 rounded-lg hover:bg-background transition-all active:scale-95 ${colorClass}`}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Refined Indicator: A subtle side-bar instead of a full fill */}
        <motion.div
          className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-8 rounded-r-full ${colorClass.replace("text-", "bg-")}`}
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: value > 0 ? 1 : 0, scaleY: value > 0 ? 1 : 0 }}
        />
      </div>
    </div>
  );
};
