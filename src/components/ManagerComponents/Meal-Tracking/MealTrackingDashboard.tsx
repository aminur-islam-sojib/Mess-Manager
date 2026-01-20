/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, ReactNode } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DailyMealAttendance from "./TodaysMealTracking";

// Animation variants for professional, subtle transitions
const contentVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.3,
    },
  },
};

// Wrapper component for animated tab content
function AnimatedTabContent({
  value,
  children,
  className = "",
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <TabsContent value={value} className={className} forceMount>
      {children}
    </TabsContent>
  );
}

export default function MyTabs({ todayData }: { todayData?: any }) {
  const [activeTab, setActiveTab] = useState("today");
  const [isInitialRender, setIsInitialRender] = useState(true);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (isInitialRender) {
      setIsInitialRender(false);
    }
  };

  return (
    <Tabs
      defaultValue="today"
      className="w-full"
      onValueChange={handleTabChange}
    >
      <TabsList className="grid w-full grid-cols-3 bg-transparent">
        <TabsTrigger value="today">Today</TabsTrigger>
        <TabsTrigger value="month">This Month</TabsTrigger>
        <TabsTrigger value="custom">Custom</TabsTrigger>
      </TabsList>

      <div className="relative">
        <AnimatePresence mode="wait" initial={false}>
          {activeTab === "today" && (
            <motion.div
              key="account"
              variants={contentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <AnimatedTabContent value="today">
                <DailyMealAttendance attendanceData={todayData} />
              </AnimatedTabContent>
            </motion.div>
          )}

          {activeTab === "month" && (
            <motion.div
              key="month"
              variants={contentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <AnimatedTabContent value="month">
                <div>Month</div>
              </AnimatedTabContent>
            </motion.div>
          )}

          {activeTab === "custom" && (
            <motion.div
              key="custom"
              variants={contentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <AnimatedTabContent value="custom">
                <div>Custom</div>
              </AnimatedTabContent>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Tabs>
  );
}
