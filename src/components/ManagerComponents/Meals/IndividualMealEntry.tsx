"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MealCounter } from "@/components/ManagerComponents/Meals/MealContainer";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import type { MealEntry, MessDataResponse } from "@/types/MealManagement";
import Swal from "sweetalert2";
import { toast } from "sonner";
import { addMealEntry } from "@/actions/server/Meals";

interface MealManagementClientProps {
  messData: MessDataResponse;
}
export default function IndividualMealEntry({
  messData,
}: MealManagementClientProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMember, setSelectedMember] = useState("");
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  // Individual member meals
  const [individualMeals, setIndividualMeals] = useState<MealEntry>({
    breakfast: 0,
    lunch: 0,
    dinner: 0,
  });

  const handleMealChange = (mealType: string, increment: boolean) => {
    setIndividualMeals((prev) => ({
      ...prev,
      [mealType]: Math.max(
        0,
        prev[mealType as keyof typeof prev] + (increment ? 0.5 : -0.5)
      ),
    }));
  };

  const mealEntry = async () => {
    if (!selectedMember) {
      alert("Please select a member");
      return;
    }
    console.log("Submitting for individual member:", {
      date: format(selectedDate, "yyyy-MM-dd"),
      userId: selectedMember,
      meals: individualMeals,
    });

    const payload = {
      date: format(selectedDate, "yyyy-MM-dd"),
      meals: individualMeals,
      mode: "individual" as const,
      memberId: selectedMember,
    };

    const res = await addMealEntry(payload);
    console.log("Meal entry submitted successfully", res);
  };

  const handleSubmit = async () => {
    Swal.fire({
      title: "Are you sure?",
      text: `Meal added for ${
        messData.members?.find((m) => m.userId === selectedMember)?.name
      } on ${format(selectedDate, "PPP")}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, Add!",
    }).then((result) => {
      if (result.isConfirmed) {
        mealEntry();
        toast.success("Meal Added Successfully!");
      }
    });
  };

  const selectedMemberData = messData.members?.find(
    (m) => m.userId === selectedMember
  );
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
      {/* Member Selector */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Select Member
        </label>
        <div className="relative">
          <button
            onClick={() => setShowMemberDropdown(!showMemberDropdown)}
            className="w-full px-4 py-3 pr-10 border border-input rounded-md bg-background text-foreground hover:bg-accent hover:text-accent-foreground focus:ring-2 focus:ring-primary focus:border-transparent text-left flex items-center justify-between"
          >
            <span
              className={
                selectedMember ? "text-foreground" : "text-muted-foreground"
              }
            >
              {selectedMember
                ? messData.members?.find((m) => m.userId === selectedMember)
                    ?.name
                : "Choose a member"}
            </span>
            <ChevronDown
              className={`w-5 h-5 text-muted-foreground transition-transform ${
                showMemberDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          {showMemberDropdown && (
            <Card className="absolute z-20 w-full mt-2 max-h-60 overflow-auto">
              <CardContent className="p-0">
                {messData.members?.map((member) => (
                  <button
                    key={member.userId}
                    onClick={() => {
                      setSelectedMember(member.userId);
                      setShowMemberDropdown(false);
                    }}
                    className={`w-full px-4 py-3 text-left hover:bg-accent hover:text-accent-foreground transition-colors ${
                      selectedMember === member.userId
                        ? "bg-accent text-accent-foreground"
                        : ""
                    }`}
                  >
                    <div className="font-medium">{member.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {member.email}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      {/* Meal Counters */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Add Meals</h2>

        <MealCounter
          label="Breakfast"
          value={individualMeals.breakfast}
          onChange={(increment) => handleMealChange("breakfast", increment)}
          colorClass="text-orange-600"
        />

        <MealCounter
          label="Lunch"
          value={individualMeals.lunch}
          onChange={(increment) => handleMealChange("lunch", increment)}
          colorClass="text-green-600"
        />

        <MealCounter
          label="Dinner"
          value={individualMeals.dinner}
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
          {selectedMember && (
            <div className="flex justify-between text-sm">
              <span className="opacity-90">Member:</span>
              <span className="font-medium">{selectedMemberData?.name}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="opacity-90">Total Meals:</span>
            <span className="font-medium">
              {individualMeals.breakfast +
                individualMeals.lunch +
                individualMeals.dinner}
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
