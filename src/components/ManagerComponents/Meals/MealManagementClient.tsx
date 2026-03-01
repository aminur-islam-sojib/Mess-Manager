"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, User } from "lucide-react";
import type { MessDataResponse } from "@/types/MealManagement";

import IndividualMealEntry from "./IndividualMealEntry";
import AllMealEntry from "./AllMealEntry";

interface MealManagementClientProps {
  messData: MessDataResponse;
}

const TABS = [
  { id: "all", label: "All Members", icon: Users },
  { id: "individual", label: "Individual", icon: User },
];

export default function MealManagementClient({
  messData,
}: MealManagementClientProps) {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className=" py-4 max-w-4xl mx-auto">
      {/* High-End Framer Motion Tabs */}
      <div className="flex justify-center mb-5">
        <div className="flex p-1.5 bg-muted/40 backdrop-blur-md border border-border/50 rounded-2xl relative w-full">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex w-full text-center items-center gap-2 px-6 py-2.5 text-sm font-semibold transition-colors duration-300 z-10 ${
                  isActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className=" flex justify-center items-center w-full">
                  <tab.icon
                    className={`w-4 h-4 transition-transform ${isActive ? "scale-110" : "scale-100"}`}
                  />
                  {tab.label}

                  {/* The Animated Slider Background */}
                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 bg-primary rounded-xl -z-10 shadow-lg shadow-primary/20"
                      transition={{
                        type: "spring",
                        bounce: 0.2,
                        duration: 0.6,
                      }}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Animation: Slide + Fade */}
      <div className="relative min-h-100">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ y: 10, opacity: 0, filter: "blur(4px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: -10, opacity: 0, filter: "blur(4px)" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {activeTab === "all" ? (
              <div className="bg-card/50 backdrop-blur-sm border border-border rounded-[2.5rem] p-8 shadow-2xl shadow-black/5">
                <AllMealEntry messData={messData} />
              </div>
            ) : (
              <div className="bg-card/50 backdrop-blur-sm border border-border rounded-[2.5rem] p-8 shadow-2xl shadow-black/5">
                <IndividualMealEntry messData={messData} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
