import { getMessMembers } from "@/actions/server/Mess";
import MessMembersDashboard from "@/components/Shared/Managers/MessMembersDashboard";
import NoMess from "@/components/Shared/NoMess";

type UserMembersPageProps = {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    q?: string;
    sortBy?: string;
    sortDir?: string;
    role?: string;
  }>;
};

const parsePositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

export default async function page({ searchParams }: UserMembersPageProps) {
  const params = await searchParams;
  const page = parsePositiveInt(params.page, 1);
  const limit = parsePositiveInt(params.limit, 20);

  const messMembers = await getMessMembers({
    page,
    limit,
    q: params.q,
    sortBy: params.sortBy as
      | "name"
      | "email"
      | "role"
      | "joinDate"
      | "monthlyMeals"
      | "monthlyMealCost"
      | "currentBalance"
      | undefined,
    sortDir: params.sortDir as "asc" | "desc" | undefined,
    role: params.role as "all" | "manager" | "member" | undefined,
  });

  if (!messMembers.success && messMembers.state === "no-mess") {
    return <NoMess />;
  }

  if (!messMembers.success) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        {messMembers.message}
      </div>
    );
  }

  const members = messMembers.success ? (messMembers.members ?? []) : [];
  const messName = messMembers.success
    ? (messMembers.messName ?? "Mess Members")
    : "Mess Members";

  return (
    <div>
      <MessMembersDashboard
        members={members}
        messName={messName}
        currentMonth={messMembers.currentMonth}
        pagination={messMembers.pagination}
        mode="user"
      />
    </div>
  );
}
