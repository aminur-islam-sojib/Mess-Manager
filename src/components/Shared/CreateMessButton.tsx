import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function NoMess() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 text-center lg:ml-72">
      <AlertCircle className="w-16 h-16 text-destructive mb-4" />
      <h2 className="text-2xl font-bold text-foreground mb-2">No Mess Found</h2>
      <p className="text-muted-foreground mb-6">
        You don’t have any mess yet. Start by creating one to manage your
        members and expenses.
      </p>
      <Link
        href="/dashboard/manager/create-mess"
        className="flex items-center justify-center gap-2 w-64 md:w-72 py-4 px-6 rounded-2xl bg-primary text-primary-foreground text-lg font-semibold shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
      >
        ➕ Create Mess
      </Link>
    </div>
  );
}
