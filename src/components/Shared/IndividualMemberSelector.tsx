"use client";
import { ChevronDown } from "lucide-react";
import React, { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { MessDataResponse } from "@/types/MealManagement";

export default function IndividualMemberSelector({
  messData,
  setSelectedId,
  label,
}: {
  messData: MessDataResponse;
  setSelectedId: (value: string) => void;
  label?: string;
}) {
  const [selectedMember, setSelectedMember] = useState("");
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  console.log(selectedMember);
  if (selectedMember) {
    setSelectedId(selectedMember);
  }
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        {label || ""}
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
              ? messData.members?.find((m) => m.userId === selectedMember)?.name
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
  );
}
