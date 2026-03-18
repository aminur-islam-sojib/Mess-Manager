"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarIcon,
  User,
  Search,
  Check,
  ChevronDown,
  ChevronRight,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MealCounter } from "@/components/ManagerComponents/Meals/MealContainer";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import type { MealEntry, MessDataResponse } from "@/types/MealManagement";
import { toast } from "sonner";
import { addMealEntry } from "@/actions/server/Meals";
import { Input } from "@/components/ui/input";
import ConfirmModal from "@/components/ui/confirmation-modal";

interface MealManagementClientProps {
  messData: MessDataResponse;
}

export default function IndividualMealEntry({
  messData,
}: MealManagementClientProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMember, setSelectedMember] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [individualMeals, setIndividualMeals] = useState<MealEntry>({
    breakfast: 0,
    lunch: 0,
    dinner: 0,
  });

  const selectedMemberData = messData.members?.find(
    (m) => m.userId === selectedMember,
  );
  const totalMeals =
    individualMeals.breakfast + individualMeals.lunch + individualMeals.dinner;

  const filteredMembers = messData.members?.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleMealChange = (mealType: string, increment: boolean) => {
    setIndividualMeals((prev) => ({
      ...prev,
      [mealType]: Math.max(
        0,
        prev[mealType as keyof typeof prev] + (increment ? 0.5 : -0.5),
      ),
    }));
  };

  const handleSubmit = async () => {
    if (!selectedMember) {
      toast.error("Please select a member first");
      return;
    }
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
        meals: individualMeals,
        mode: "individual",
        memberId: selectedMember,
      });
      console.log(res);
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full  mx-auto space-y-8 animate-in fade-in duration-500">
      {/* 1. Configuration Section (Date & Member) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Date Picker */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
            Feeding Date
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full h-14 justify-between rounded-2xl border-2 hover:border-primary/40 transition-all bg-card shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-sm">
                    {format(selectedDate, "MMM dd, yyyy")}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 opacity-40" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-2xl border-border shadow-2xl">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Member Searchable Dropdown */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
            Assign To Member
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`w-full h-14 justify-between rounded-2xl border-2 transition-all bg-card shadow-sm ${selectedMember ? "border-primary/20" : ""}`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <User
                    className={`w-4 h-4 ${selectedMember ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <span className="truncate font-semibold text-sm">
                    {selectedMemberData
                      ? selectedMemberData.name
                      : "Select Member"}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 opacity-40" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-75 p-0 rounded-2xl border-border shadow-2xl"
              align="end"
            >
              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10 rounded-xl border-none bg-muted/50 focus-visible:ring-1 focus-visible:ring-primary/30"
                  />
                </div>
              </div>
              <div className="max-h-62.5 overflow-y-auto p-2 space-y-1">
                {filteredMembers?.map((member) => (
                  <button
                    key={member.userId}
                    onClick={() => setSelectedMember(member.userId)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                      selectedMember === member.userId
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="text-left">
                      <p className="text-sm font-bold leading-none mb-1">
                        {member.name}
                      </p>
                      <p
                        className={`text-[10px] ${selectedMember === member.userId ? "opacity-80" : "text-muted-foreground"}`}
                      >
                        {member.email}
                      </p>
                    </div>
                    {selectedMember === member.userId && (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* 2. Meal Controls Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1 mb-4">
          <div className="h-1 w-8 rounded-full bg-primary/30" />
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Entry Details
          </span>
        </div>

        <div className="grid gap-3">
          <MealCounter
            label="Breakfast"
            value={individualMeals.breakfast}
            colorClass="text-orange-500"
            onChange={(inc) => handleMealChange("breakfast", inc)}
          />
          <MealCounter
            label="Lunch"
            value={individualMeals.lunch}
            colorClass="text-emerald-500"
            onChange={(inc) => handleMealChange("lunch", inc)}
          />
          <MealCounter
            label="Dinner"
            value={individualMeals.dinner}
            colorClass="text-blue-500"
            onChange={(inc) => handleMealChange("dinner", inc)}
          />
        </div>
      </div>

      {/* 3. Live Context Summary Card */}
      <div className="relative group overflow-hidden bg-foreground rounded-[2rem] p-6 text-background shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <UserCheck size={120} />
        </div>
        <div className="relative flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
              Selected Member
            </p>
            <h4 className="text-xl font-bold tracking-tight">
              {selectedMemberData
                ? selectedMemberData.name
                : "No Member Chosen"}
            </h4>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
              Total Meals
            </p>
            <p className="text-3xl font-black tracking-tighter">{totalMeals}</p>
          </div>
        </div>
      </div>

      {/* 4. Action Button */}
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || !selectedMember || totalMeals === 0}
        className="group relative w-full h-16 rounded-2xl bg-primary text-primary-foreground hover:shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all active:scale-[0.98] disabled:opacity-40"
      >
        <AnimatePresence mode="wait">
          {isSubmitting ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Processing...
            </motion.div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-lg font-bold">
              Submit Record
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          )}
        </AnimatePresence>
      </Button>

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
        title="Confirm meal entry"
        description={`Assign ${totalMeals} meals to ${selectedMemberData?.name ?? "this member"} for ${format(selectedDate, "PPP")}.`}
        confirmText="Confirm Entry"
        cancelText="Review Again"
        variant="default"
      />
    </div>
  );
}
