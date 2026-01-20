"use client";
import { useState } from "react";
import { Users, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import type { MessDataResponse } from "@/types/MealManagement";

import IndividualMealEntry from "./IndividualMealEntry";
import AllMealEntry from "./AllMealEntry";

interface MealManagementClientProps {
  messData: MessDataResponse;
}

export default function MealManagementClient({
  messData,
}: MealManagementClientProps) {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>All Members</span>
          </TabsTrigger>
          <TabsTrigger value="individual" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>Individual</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          <AllMealEntry messData={messData} />
        </TabsContent>

        <TabsContent value="individual" className="space-y-6">
          <IndividualMealEntry messData={messData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
