export const mockSession = {
  user: {
    name: "John Manager",
    email: "john@example.com",
    role: "manager",
    image: null,
  },
};

// Mock data for dashboard
export const mockData = {
  messName: "Sunrise Hostel Mess",
  totalMembers: 12,
  activeMembers: 10,
  monthlyExpense: 45230,
  pendingApprovals: 3,
  recentExpenses: [
    {
      id: 1,
      title: "Grocery Shopping",
      amount: 3500,
      date: "2024-12-26",
      status: "pending",
      submittedBy: "Alice Kumar",
    },
    {
      id: 2,
      title: "Vegetables & Fruits",
      amount: 1200,
      date: "2024-12-25",
      status: "approved",
      submittedBy: "Bob Singh",
    },
    {
      id: 3,
      title: "Monthly Gas Bill",
      amount: 850,
      date: "2024-12-24",
      status: "pending",
      submittedBy: "Charlie Patel",
    },
  ],
  memberStats: [
    { name: "Alice Kumar", meals: 28, balance: -450 },
    { name: "Bob Singh", meals: 30, balance: 120 },
    { name: "Charlie Patel", meals: 25, balance: -200 },
  ],
};
