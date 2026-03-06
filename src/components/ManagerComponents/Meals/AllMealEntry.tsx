"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarIcon,
  Utensils,
  ChevronRight,
  TrendingUp,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import type { MealEntry, MessDataResponse } from "@/types/MealManagement";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { addMealEntry } from "@/actions/server/Meals";
import { MealCounter } from "@/components/ManagerComponents/Meals/MealContainer";
import ConfirmModal from "@/components/ui/confirmation-modal";

export default function AllMealEntry({}: { messData: MessDataResponse }) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [allMembersMeals, setAllMembersMeals] = useState<MealEntry>({
    breakfast: 0,
    lunch: 0,
    dinner: 0,
  });

  const totalMeals =
    allMembersMeals.breakfast + allMembersMeals.lunch + allMembersMeals.dinner;

  const handleMealChange = (mealType: string, increment: boolean) => {
    setAllMembersMeals((prev) => ({
      ...prev,
      [mealType]: Math.max(
        0,
        prev[mealType as keyof typeof prev] + (increment ? 0.5 : -0.5),
      ),
    }));
  };

  const handleSubmit = async () => {
    if (totalMeals === 0) {
      toast.error("Please add at least one meal");
      return;
    }

    setConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    setConfirmOpen(false);
    setIsSubmitting(true);
    try {
      const res = await addMealEntry({
        date: format(selectedDate, "yyyy-MM-dd"),
        meals: allMembersMeals,
        mode: "all",
      });
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full  mx-auto space-y-8 p-1">
      {/* Header & Date Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/30 p-4 rounded-2xl border border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Feeding Date
            </p>
            <p className="text-sm font-bold text-foreground">
              {format(selectedDate, "EEEE, MMMM do")}
            </p>
          </div>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="rounded-xl border-dashed border-2 hover:border-primary/50 transition-all h-12 px-6"
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
              Change Date
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 rounded-2xl shadow-2xl border-border"
            align="end"
          >
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Main Meal Controls */}
      <div className="grid gap-4">
        <h3 className="text-sm font-bold text-muted-foreground flex items-center gap-2 px-1">
          <Utensils className="w-4 h-4" /> MEAL QUANTITIES (HALF/FULL)
        </h3>

        <div className="space-y-3">
          {[
            {
              id: "breakfast",
              label: "Breakfast",
              color: "text-orange-500",
              bg: "bg-orange-500/5",
            },
            {
              id: "lunch",
              label: "Lunch",
              color: "text-emerald-500",
              bg: "bg-emerald-500/5",
            },
            {
              id: "dinner",
              label: "Dinner",
              color: "text-blue-500",
              bg: "bg-blue-500/5",
            },
          ].map((meal) => (
            <motion.div
              key={meal.id}
              whileHover={{ x: 4 }}
              className={`p-1 rounded-2xl border border-border/50 ${meal.bg} transition-colors`}
            >
              <MealCounter
                label={meal.label}
                value={allMembersMeals[meal.id as keyof MealEntry]}
                onChange={(inc) => handleMealChange(meal.id, inc)}
                colorClass={meal.color}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modern Live Summary Card */}
      <div className="relative overflow-hidden group">
        <div className="absolute inset-0 bg-linear-to-r from-primary to-primary/80" />
        <div className="relative p-6 text-primary-foreground flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium opacity-80 uppercase tracking-widest">
              Total Daily Consumption
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black tracking-tighter">
                {totalMeals}
              </span>
              <span className="text-sm font-medium opacity-80">Meals</span>
            </div>
          </div>
          <div className="h-16 w-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      {/* High-Impact Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || totalMeals === 0}
        className="group relative w-full h-16 rounded-2xl overflow-hidden bg-foreground text-background hover:bg-foreground/90 transition-all shadow-xl hover:shadow-primary/20 active:scale-[0.98]"
      >
        <AnimatePresence mode="wait">
          {isSubmitting ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <div className="h-5 w-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
              Processing...
            </motion.div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-lg font-bold">
              Confirm & Sync Entries
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          )}
        </AnimatePresence>
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Entries are synced instantly with the central mess database.
      </p>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
        title="Submit meal entries for all members?"
        description={`Register ${totalMeals} meals for ${format(selectedDate, "PPP")} across the mess.`}
        confirmText="Confirm & Submit"
        cancelText="Cancel"
        variant="default"
      />
    </div>
  );
}
