import Link from "next/link";
import {
  getAdminMessManagementList,
  type AdminMessSortBy,
  type AdminMessSortOrder,
  type AdminMessStatusFilter,
} from "@/actions/server/Admin";
import MessStatusActionModal from "@/components/Shared/Admin/MessStatusActionModal";

type AdminMessManagementPageProps = {
  searchParams: Promise<{
    q?: string;
    status?: string;
    minMembers?: string;
    minMonthlyExpense?: string;
    sortBy?: string;
    order?: string;
    page?: string;
    pageSize?: string;
  }>;
};

const ALLOWED_SORT_BY: readonly AdminMessSortBy[] = [
  "createdAt",
  "messName",
  "memberCount",
  "monthlyExpense",
  "pendingOperations",
  "status",
];

const ALLOWED_ORDER: readonly AdminMessSortOrder[] = ["asc", "desc"];
const ALLOWED_STATUS: readonly AdminMessStatusFilter[] = [
  "all",
  "active",
  "suspended",
  "archived",
];
const ALLOWED_PAGE_SIZE = new Set([10, 20, 50, 100]);

const moneyFormatter = new Intl.NumberFormat("en-BD", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatMoney(value: number) {
  return `BDT ${moneyFormatter.format(value)}`;
}

function buildQueryString(
  base: {
    q: string;
    status: string;
    minMembers: number;
    minMonthlyExpense: number;
    sortBy: string;
    order: string;
    pageSize: number;
  },
  page: number,
) {
  const query = new URLSearchParams();
  if (base.q) query.set("q", base.q);
  if (base.status && base.status !== "all") query.set("status", base.status);
  if (base.minMembers > 0) query.set("minMembers", String(base.minMembers));
  if (base.minMonthlyExpense > 0)
    query.set("minMonthlyExpense", String(base.minMonthlyExpense));
  if (base.sortBy !== "createdAt") query.set("sortBy", base.sortBy);
  if (base.order !== "desc") query.set("order", base.order);
  if (base.pageSize !== 20) query.set("pageSize", String(base.pageSize));
  if (page > 1) query.set("page", String(page));

  const qs = query.toString();
  return qs
    ? `/dashboard/admin/mess-management?${qs}`
    : "/dashboard/admin/mess-management";
}

export default async function AdminMessManagementPage({
  searchParams,
}: AdminMessManagementPageProps) {
  const params = await searchParams;

  const sortBy = ALLOWED_SORT_BY.includes(params.sortBy as AdminMessSortBy)
    ? (params.sortBy as AdminMessSortBy)
    : "createdAt";

  const order = ALLOWED_ORDER.includes(params.order as AdminMessSortOrder)
    ? (params.order as AdminMessSortOrder)
    : "desc";

  const status = ALLOWED_STATUS.includes(params.status as AdminMessStatusFilter)
    ? (params.status as AdminMessStatusFilter)
    : "all";

  const pageRaw = Number(params.page);
  const page =
    Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;

  const pageSizeRaw = Number(params.pageSize);
  const pageSize =
    Number.isFinite(pageSizeRaw) &&
    ALLOWED_PAGE_SIZE.has(Math.floor(pageSizeRaw))
      ? Math.floor(pageSizeRaw)
      : 20;

  const minMembersRaw = Number(params.minMembers);
  const minMembers =
    Number.isFinite(minMembersRaw) && minMembersRaw > 0
      ? Math.floor(minMembersRaw)
      : 0;

  const minMonthlyExpenseRaw = Number(params.minMonthlyExpense);
  const minMonthlyExpense =
    Number.isFinite(minMonthlyExpenseRaw) && minMonthlyExpenseRaw > 0
      ? minMonthlyExpenseRaw
      : 0;

  const q = (params.q ?? "").trim().slice(0, 80);

  const data = await getAdminMessManagementList({
    page,
    pageSize,
    q,
    status,
    minMembers,
    minMonthlyExpense,
    sortBy,
    order,
  });

  if (!data.success) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        {data.message}
      </div>
    );
  }

  const baseQuery = {
    q: data.filters.q,
    status: data.filters.status,
    minMembers: data.filters.minMembers,
    minMonthlyExpense: data.filters.minMonthlyExpense,
    sortBy: data.filters.sortBy,
    order: data.filters.order,
    pageSize: data.pagination.pageSize,
  };

  const prevPageHref = buildQueryString(baseQuery, data.pagination.page - 1);
  const nextPageHref = buildQueryString(baseQuery, data.pagination.page + 1);

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mess Management</h1>
        <p className="text-sm text-muted-foreground">
          Global governance panel for all mess groups, managers, and operations.
        </p>
      </div>

      <form
        method="get"
        className="rounded-2xl border border-border bg-card p-4 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
          <div className="space-y-1 lg:col-span-2">
            <label
              htmlFor="q"
              className="text-xs font-medium text-muted-foreground"
            >
              Search Mess
            </label>
            <input
              id="q"
              name="q"
              defaultValue={data.filters.q}
              placeholder="Search by mess name"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="status"
              className="text-xs font-medium text-muted-foreground"
            >
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={data.filters.status}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="minMembers"
              className="text-xs font-medium text-muted-foreground"
            >
              Min Members
            </label>
            <input
              id="minMembers"
              name="minMembers"
              type="number"
              min={0}
              defaultValue={data.filters.minMembers || ""}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="minMonthlyExpense"
              className="text-xs font-medium text-muted-foreground"
            >
              Min Monthly Expense
            </label>
            <input
              id="minMonthlyExpense"
              name="minMonthlyExpense"
              type="number"
              min={0}
              step="0.01"
              defaultValue={data.filters.minMonthlyExpense || ""}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="space-y-1">
            <label
              htmlFor="sortBy"
              className="text-xs font-medium text-muted-foreground"
            >
              Sort By
            </label>
            <select
              id="sortBy"
              name="sortBy"
              defaultValue={data.filters.sortBy}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="createdAt">Created time</option>
              <option value="messName">Mess name</option>
              <option value="memberCount">Member count</option>
              <option value="monthlyExpense">Monthly expense</option>
              <option value="pendingOperations">Pending operations</option>
              <option value="status">Status</option>
            </select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="order"
              className="text-xs font-medium text-muted-foreground"
            >
              Order
            </label>
            <select
              id="order"
              name="order"
              defaultValue={data.filters.order}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="pageSize"
              className="text-xs font-medium text-muted-foreground"
            >
              Page Size
            </label>
            <select
              id="pageSize"
              name="pageSize"
              defaultValue={String(data.pagination.pageSize)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="w-full rounded-lg border border-border bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Apply Filters
            </button>
            <Link
              href="/dashboard/admin/mess-management"
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
            >
              Reset
            </Link>
          </div>
        </div>
      </form>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            Showing page {data.pagination.page} of {data.pagination.totalPages}
          </p>
          <p className="text-sm text-muted-foreground">
            {data.pagination.totalItems} mess groups total
          </p>
        </div>

        {data.items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No mess groups found with this filter combination.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-245 text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3">Mess</th>
                  <th className="py-2 pr-3">Manager</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Members</th>
                  <th className="py-2 pr-3">Monthly Expense</th>
                  <th className="py-2 pr-3">Monthly Deposit</th>
                  <th className="py-2 pr-3">Pending Ops</th>
                  <th className="py-2 pr-3">Created</th>
                  <th className="py-2 pr-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((mess) => (
                  <tr key={mess.id} className="border-b border-border/70">
                    <td className="py-3 pr-3 font-medium text-foreground">
                      {mess.messName}
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      <p>{mess.manager.name}</p>
                      <p className="text-xs">{mess.manager.email}</p>
                    </td>
                    <td className="py-3 pr-3">
                      <span
                        className={
                          mess.status === "active"
                            ? "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium uppercase text-emerald-700"
                            : mess.status === "suspended"
                              ? "rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium uppercase text-amber-700"
                              : "rounded-full bg-muted px-2.5 py-1 text-xs font-medium uppercase text-muted-foreground"
                        }
                      >
                        {mess.status}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {mess.activeMemberCount}/{mess.memberCount}
                    </td>
                    <td className="py-3 pr-3 text-foreground">
                      {formatMoney(mess.monthlyExpense)}
                    </td>
                    <td className="py-3 pr-3 text-foreground">
                      {formatMoney(mess.monthlyDeposit)}
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {mess.pendingOperations}
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {new Date(mess.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <MessStatusActionModal
                        messId={mess.id}
                        messName={mess.messName}
                        status={mess.status}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <div>
            {data.pagination.hasPrev ? (
              <Link
                href={prevPageHref}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                Previous
              </Link>
            ) : (
              <span className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground">
                Previous
              </span>
            )}
          </div>

          <div>
            {data.pagination.hasNext ? (
              <Link
                href={nextPageHref}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                Next
              </Link>
            ) : (
              <span className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground">
                Next
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
