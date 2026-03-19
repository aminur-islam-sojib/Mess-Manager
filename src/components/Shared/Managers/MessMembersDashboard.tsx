"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Mail,
  MoreVertical,
  Search,
  UserCircle,
  Users,
  Utensils,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  MessMember as Member,
  MessMemberFilterRole,
  MessMembersCurrentMonthSummary,
  MessMembersPagination,
  MessMemberSortBy,
  MessMemberSortDir,
} from "@/types/MessMember";

interface MessDashboardProps {
  members: Member[];
  messName?: string;
  currentMonth?: MessMembersCurrentMonthSummary;
  pagination?: MessMembersPagination;
  mode?: "user" | "manager";
}

const SORTABLE_KEYS: MessMemberSortBy[] = [
  "name",
  "email",
  "role",
  "joinDate",
  "monthlyMeals",
  "monthlyMealCost",
  "currentBalance",
];

const LIMIT_OPTIONS = [10, 20, 50];

const normalizeRole = (value: string | undefined): MessMemberFilterRole => {
  if (value === "manager" || value === "member") {
    return value;
  }
  return "all";
};

const getInitials = (name: string) => {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const formatMoney = (value: number) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatJoinDate = (dateIso: string) => {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const SortIndicator = ({
  active,
  dir,
}: {
  active: boolean;
  dir?: MessMemberSortDir;
}) => {
  if (!active || !dir) {
    return <ArrowUpDown className="h-3.5 w-3.5" />;
  }

  return dir === "asc" ? (
    <ArrowUp className="h-3.5 w-3.5" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5" />
  );
};

export default function MessMembersDashboard({
  members,
  messName,
  currentMonth,
  pagination,
  mode = "manager",
}: MessDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const isServerControlled = Boolean(pagination);

  const [searchTerm, setSearchTerm] = useState(pagination?.q ?? "");
  const [localSortBy, setLocalSortBy] = useState<MessMemberSortBy>("name");
  const [localSortDir, setLocalSortDir] = useState<MessMemberSortDir>("asc");
  const [localRole, setLocalRole] = useState<MessMemberFilterRole>("all");

  const querySortBy = (pagination?.sortBy ?? "name") as MessMemberSortBy;
  const querySortDir = (pagination?.sortDir ?? "asc") as MessMemberSortDir;
  const queryRole = normalizeRole(pagination?.role ?? "all");

  const updateQuery = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (!value || value === "all") {
          next.delete(key);
          return;
        }

        next.set(key, value);
      });

      const query = next.toString();
      const target = query ? `${pathname}?${query}` : pathname;

      startTransition(() => {
        router.replace(target);
      });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (!isServerControlled) return;

    const delay = setTimeout(() => {
      const currentQ = searchParams.get("q") ?? "";
      if (currentQ === searchTerm.trim()) {
        return;
      }

      updateQuery({
        q: searchTerm.trim() || null,
        page: "1",
      });
    }, 300);

    return () => clearTimeout(delay);
  }, [isServerControlled, searchTerm, searchParams, updateQuery]);

  const requestSort = (key: MessMemberSortBy) => {
    if (!SORTABLE_KEYS.includes(key)) return;

    if (!isServerControlled) {
      const nextDir: MessMemberSortDir =
        localSortBy === key && localSortDir === "asc" ? "desc" : "asc";
      setLocalSortBy(key);
      setLocalSortDir(nextDir);
      return;
    }

    const nextDir: MessMemberSortDir =
      querySortBy === key && querySortDir === "asc" ? "desc" : "asc";

    updateQuery({
      sortBy: key,
      sortDir: nextDir,
      page: "1",
    });
  };

  const changeRoleFilter = (role: MessMemberFilterRole) => {
    if (!isServerControlled) {
      setLocalRole(role);
      return;
    }

    updateQuery({
      role: role === "all" ? null : role,
      page: "1",
    });
  };

  const changePage = (page: number) => {
    updateQuery({ page: String(page) });
  };

  const changeLimit = (limit: number) => {
    updateQuery({
      limit: String(limit),
      page: "1",
    });
  };

  const summary = useMemo(() => {
    const totalMeals = currentMonth?.totalMessMealCount ?? 0;
    const totalExpenses = currentMonth?.totalMessExpense ?? 0;
    const mealRate = totalMeals > 0 ? totalExpenses / totalMeals : 0;
    return { totalMeals, totalExpenses, mealRate };
  }, [currentMonth]);

  const visibleMembers = useMemo(() => {
    if (isServerControlled) {
      return members;
    }

    const q = searchTerm.trim().toLowerCase();
    const roleFiltered =
      localRole === "all"
        ? members
        : members.filter((member) => member.role === localRole);

    const searched =
      q.length === 0
        ? roleFiltered
        : roleFiltered.filter(
            (member) =>
              member.name.toLowerCase().includes(q) ||
              member.email.toLowerCase().includes(q),
          );

    return [...searched].sort((a, b) => {
      const dir = localSortDir === "asc" ? 1 : -1;

      if (
        localSortBy === "monthlyMeals" ||
        localSortBy === "monthlyMealCost" ||
        localSortBy === "currentBalance"
      ) {
        const av = a[localSortBy];
        const bv = b[localSortBy];
        if (av === bv) return 0;
        return av > bv ? dir : -dir;
      }

      if (localSortBy === "joinDate") {
        const av = new Date(a.joinDate).getTime();
        const bv = new Date(b.joinDate).getTime();
        if (av === bv) return 0;
        return av > bv ? dir : -dir;
      }

      const aText = String(
        localSortBy === "name"
          ? a.name
          : localSortBy === "email"
            ? a.email
            : a.role,
      ).toLowerCase();
      const bText = String(
        localSortBy === "name"
          ? b.name
          : localSortBy === "email"
            ? b.email
            : b.role,
      ).toLowerCase();

      if (aText === bText) return 0;
      return aText > bText ? dir : -dir;
    });
  }, [
    isServerControlled,
    localRole,
    localSortBy,
    localSortDir,
    members,
    searchTerm,
  ]);

  const emptyTitle = searchTerm.trim()
    ? "No members match your search"
    : "No members found";
  const emptyDescription = searchTerm.trim()
    ? "Try a different name, email, or clear the current filters."
    : "Members will appear here once people join your mess.";

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
            {messName || "Organization"}
          </h2>
          <p className="text-muted-foreground text-sm font-medium mt-1">
            Directory and financial context for all active mess members.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs font-bold px-4 py-2 bg-primary/10 text-primary rounded-xl border border-primary/20 uppercase tracking-wide">
            {pagination?.total ?? visibleMembers.length} Members
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard
          title="Total Mess Meals"
          value={summary.totalMeals}
          icon={<Utensils className="text-primary" size={20} />}
          description="Total consumption this month"
        />
        <SummaryCard
          title="Total Expenses"
          value={`$${formatMoney(summary.totalExpenses)}`}
          icon={<DollarSign className="text-emerald-500" size={20} />}
          description="Aggregate monthly cost"
        />
        <SummaryCard
          title="Cost Per Meal"
          value={`$${formatMoney(summary.mealRate)}`}
          icon={<Users className="text-indigo-500" size={20} />}
          description="Current calculated rate"
        />
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 sticky top-2 z-10 bg-background/90 backdrop-blur-sm py-2">
        <div className="relative w-full md:w-96 group">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"
            size={18}
          />
          <Input
            placeholder="Search by name or email..."
            className="pl-10 h-12 rounded-2xl border-border bg-card/50 shadow-sm focus-visible:ring-primary/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant={
              (isServerControlled ? queryRole : localRole) === "all"
                ? "default"
                : "outline"
            }
            className="h-10 rounded-xl"
            onClick={() => changeRoleFilter("all")}
          >
            All
          </Button>
          <Button
            type="button"
            variant={
              (isServerControlled ? queryRole : localRole) === "manager"
                ? "default"
                : "outline"
            }
            className="h-10 rounded-xl"
            onClick={() => changeRoleFilter("manager")}
          >
            Managers
          </Button>
          <Button
            type="button"
            variant={
              (isServerControlled ? queryRole : localRole) === "member"
                ? "default"
                : "outline"
            }
            className="h-10 rounded-xl"
            onClick={() => changeRoleFilter("member")}
          >
            Members
          </Button>

          <select
            value={String(pagination?.limit ?? 20)}
            onChange={(e) => changeLimit(Number(e.target.value))}
            className="h-10 rounded-xl border border-input bg-card px-3 text-sm"
            disabled={!isServerControlled}
          >
            {LIMIT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}/page
              </option>
            ))}
          </select>
        </div>
      </div>

      {visibleMembers.length === 0 ? (
        <Card className="rounded-3xl border border-border p-8 text-center">
          <h3 className="text-lg font-semibold text-foreground">
            {emptyTitle}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {emptyDescription}
          </p>
          {searchTerm.trim() ? (
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  updateQuery({ q: null, page: "1" });
                }}
              >
                Clear filters
              </Button>
            </div>
          ) : null}
        </Card>
      ) : null}

      <Card className="hidden md:block border border-border/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] bg-card/70 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="py-5 px-6">
                  <Button
                    variant="ghost"
                    className="p-0 hover:bg-transparent font-bold uppercase text-[10px] tracking-widest"
                    onClick={() => requestSort("name")}
                  >
                    Member
                    <span className="ml-2">
                      <SortIndicator
                        active={
                          (isServerControlled ? querySortBy : localSortBy) ===
                          "name"
                        }
                        dir={isServerControlled ? querySortDir : localSortDir}
                      />
                    </span>
                  </Button>
                </TableHead>
                <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-center">
                  Status
                </TableHead>
                <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-right">
                  <Button
                    variant="ghost"
                    className="p-0 hover:bg-transparent font-black uppercase text-[10px] tracking-widest"
                    onClick={() => requestSort("monthlyMeals")}
                  >
                    Meals
                    <span className="ml-2">
                      <SortIndicator
                        active={
                          (isServerControlled ? querySortBy : localSortBy) ===
                          "monthlyMeals"
                        }
                        dir={isServerControlled ? querySortDir : localSortDir}
                      />
                    </span>
                  </Button>
                </TableHead>
                <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-right">
                  <Button
                    variant="ghost"
                    className="p-0 hover:bg-transparent font-black uppercase text-[10px] tracking-widest"
                    onClick={() => requestSort("monthlyMealCost")}
                  >
                    Monthly Cost
                    <span className="ml-2">
                      <SortIndicator
                        active={
                          (isServerControlled ? querySortBy : localSortBy) ===
                          "monthlyMealCost"
                        }
                        dir={isServerControlled ? querySortDir : localSortDir}
                      />
                    </span>
                  </Button>
                </TableHead>
                <TableHead className="py-5 font-black uppercase text-[10px] tracking-widest text-right">
                  <Button
                    variant="ghost"
                    className="p-0 hover:bg-transparent font-black uppercase text-[10px] tracking-widest"
                    onClick={() => requestSort("currentBalance")}
                  >
                    Balance
                    <span className="ml-2">
                      <SortIndicator
                        active={
                          (isServerControlled ? querySortBy : localSortBy) ===
                          "currentBalance"
                        }
                        dir={isServerControlled ? querySortDir : localSortDir}
                      />
                    </span>
                  </Button>
                </TableHead>
                <TableHead className="py-5 px-6 text-right font-black uppercase text-[10px] tracking-widest">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {visibleMembers.map((member) => (
                <TableRow
                  key={member.userId}
                  className="group border-border/50 hover:bg-muted/20"
                >
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 rounded-xl">
                        <AvatarFallback>
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          {member.name}
                          <Badge
                            variant="outline"
                            className={
                              member.role === "manager"
                                ? "text-amber-700 border-amber-300 bg-amber-50"
                                : "text-blue-700 border-blue-300 bg-blue-50"
                            }
                          >
                            {member.role}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className="uppercase text-[10px] tracking-wide"
                    >
                      {member.status || "active"}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right tabular-nums font-medium">
                    {member.monthlyMeals}
                  </TableCell>

                  <TableCell className="text-right tabular-nums font-medium">
                    ${formatMoney(member.monthlyMealCost)}
                  </TableCell>

                  <TableCell className="text-right">
                    <p
                      className={`tabular-nums font-semibold ${
                        member.currentBalance < 0
                          ? "text-rose-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {member.currentBalance < 0 ? "-" : "+"}$
                      {formatMoney(Math.abs(member.currentBalance))}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Total deposit ${formatMoney(member.totalDeposit)}
                    </p>
                  </TableCell>

                  <TableCell className="px-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuLabel>Member Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/profile/${member.userId}`}>
                            <UserCircle className="mr-2 h-4 w-4" />
                            View Profile
                          </Link>
                        </DropdownMenuItem>
                        {mode === "manager" ? (
                          <>
                            <DropdownMenuItem disabled>
                              Manage Permissions
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled>
                              Remove Member
                            </DropdownMenuItem>
                          </>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:hidden">
        {visibleMembers.map((member) => (
          <Card
            key={member.userId}
            className="rounded-2xl border border-border p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-10 w-10 rounded-xl">
                  <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">
                    {member.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {member.email}
                  </p>
                </div>
              </div>
              <Badge variant="outline">{member.role}</Badge>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <InfoStat label="Meals" value={String(member.monthlyMeals)} />
              <InfoStat
                label="Monthly Cost"
                value={`$${formatMoney(member.monthlyMealCost)}`}
              />
              <InfoStat
                label="Balance"
                value={`${member.currentBalance < 0 ? "-" : "+"}$${formatMoney(
                  Math.abs(member.currentBalance),
                )}`}
                valueClassName={
                  member.currentBalance < 0
                    ? "text-rose-600"
                    : "text-emerald-600"
                }
              />
              <InfoStat
                label="Joined"
                value={formatJoinDate(member.joinDate)}
              />
            </div>

            <div className="mt-4">
              <Button asChild className="w-full rounded-xl">
                <Link href={`/dashboard/profile/${member.userId}`}>
                  View Profile
                </Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {pagination ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Showing page {pagination.page} of {pagination.totalPages} (
            {pagination.total} total members)
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={!pagination.hasPrev || isPending}
              onClick={() => changePage(Math.max(1, pagination.page - 1))}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              disabled={!pagination.hasNext || isPending}
              onClick={() => changePage(pagination.page + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  description,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <Card className="shadow-[0_4px_20px_rgb(0,0,0,0.02)] bg-card rounded-[1.5rem] p-6 border border-border/70">
      <div className="flex justify-between items-start mb-5">
        <div className="p-3 rounded-2xl bg-muted">{icon}</div>
      </div>
      <div className="space-y-1.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
          {title}
        </p>
        <h3 className="text-3xl font-black tracking-tight text-foreground tabular-nums">
          {value}
        </h3>
        <p className="text-[10px] font-medium text-muted-foreground opacity-75">
          {description}
        </p>
      </div>
    </Card>
  );
}

function InfoStat({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={`text-sm font-semibold mt-1 ${valueClassName ?? "text-foreground"}`}
      >
        {value}
      </p>
    </div>
  );
}
