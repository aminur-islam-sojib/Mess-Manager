"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import AddExpense from "../ManagerComponents/Expense/AddExpense";
import { MessDataResponse } from "@/types/MealManagement";

type AddExpensesModalHomeProps = {
  messData: MessDataResponse;
};

const AddExpensesModalHome: React.FC<AddExpensesModalHomeProps> = ({
  messData,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Open Button */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="flex flex-col w-full items-center gap-2 p-4 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
      >
        <Plus className="w-6 h-6 text-primary" />
        <span className="text-sm font-medium text-foreground">Add Expense</span>
      </button>

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <AddExpense setIsAddModalOpen={setIsAddModalOpen} messData={messData} />
      )}
    </div>
  );
};

export default AddExpensesModalHome;
