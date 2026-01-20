"use client";
import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MealCounter } from "@/components/ManagerComponents/Meals/MealContainer";

import { format } from "date-fns";
import type { MealEntry, MessDataResponse } from "@/types/MealManagement";
import Swal from "sweetalert2";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { addMealEntry } from "@/actions/server/Meals";

interface MealManagementClientProps {
  messData: MessDataResponse;
}

export default function AllMealEntry({ messData }: MealManagementClientProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // All members meals
  const [allMembersMeals, setAllMembersMeals] = useState<MealEntry>({
    breakfast: 0,
    lunch: 0,
    dinner: 0,
  });

  const handleMealChange = (mealType: string, increment: boolean) => {
    setAllMembersMeals((prev) => ({
      ...prev,
      [mealType]: Math.max(
        0,
        prev[mealType as keyof typeof prev] + (increment ? 0.5 : -0.5)
      ),
    }));
  };

  const mealEntry = async () => {
    console.log("Submitting for all members:", {
      date: format(selectedDate, "yyyy-MM-dd"),
      meals: allMembersMeals,
      messId: messData.messId,
    });

    const payload = {
      date: format(selectedDate, "yyyy-MM-dd"),
      meals: allMembersMeals,
      mode: "all" as const,
    };

    const res = await addMealEntry(payload);
    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  };

  const handleSubmit = async () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You wanna Add meal!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Add!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        await mealEntry();
      }
    });
  };

  return (
    <div className=" space-y-6">
      {/* Date Selector */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Select Date
        </label>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between px-4 py-3 font-normal"
            >
              {selectedDate ? (
                format(selectedDate, "PPP")
              ) : (
                <span className="text-muted-foreground">Pick a date</span>
              )}
              <CalendarIcon className="ml-2 h-5 w-5 text-muted-foreground" />
            </Button>
          </PopoverTrigger>

          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      {/* Meal Counters */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Add Meals</h2>

        <MealCounter
          label="Breakfast"
          value={allMembersMeals.breakfast}
          onChange={(increment) => handleMealChange("breakfast", increment)}
          colorClass="text-orange-600"
        />

        <MealCounter
          label="Lunch"
          value={allMembersMeals.lunch}
          onChange={(increment) => handleMealChange("lunch", increment)}
          colorClass="text-green-600"
        />

        <MealCounter
          label="Dinner"
          value={allMembersMeals.dinner}
          onChange={(increment) => handleMealChange("dinner", increment)}
          colorClass="text-blue-600"
        />
      </div>
      {/* Summary Card */}
      <Card className="bg-primary text-primary-foreground">
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="opacity-90">Date:</span>
            <span className="font-medium">
              {selectedDate.toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="opacity-90">Total Meals:</span>
            <span className="font-medium">
              {allMembersMeals.breakfast +
                allMembersMeals.lunch +
                allMembersMeals.dinner}
            </span>
          </div>
        </CardContent>
      </Card>
      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        className="w-full py-6 text-base font-semibold"
        size="lg"
      >
        Submit Meal Entry
      </Button>
    </div>
  );
}
