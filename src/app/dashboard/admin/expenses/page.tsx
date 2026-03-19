import {
  getAdminExpenseInsights,
  type AdminGroupExpenseSortBy,
  type AdminGroupExpenseSortOrder,
} from "@/actions/server/Admin";

type AdminExpensesPageProps = {
  searchParams: Promise<{
    q?: string;
    minCost?: string;
    sortBy?: string;
    order?: string;
  }>;
};

const moneyFormatter = new Intl.NumberFormat("en-BD", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatMoney(value: number) {
  return `BDT ${moneyFormatter.format(value)}`;
}

const ALLOWED_SORT_BY: readonly AdminGroupExpenseSortBy[] = [
  "totalExpenseAmount",
  "totalDepositAmount",
  "netCost",
  "pendingExpenseAmount",
];

const ALLOWED_SORT_ORDER: readonly AdminGroupExpenseSortOrder[] = [
  "asc",
  "desc",
];

export default async function AdminExpensesPage({
  searchParams,
}: AdminExpensesPageProps) {
  const params = await searchParams;

  const sortBy = ALLOWED_SORT_BY.includes(
    params.sortBy as AdminGroupExpenseSortBy,
  )
    ? (params.sortBy as AdminGroupExpenseSortBy)
    : "totalExpenseAmount";

  const sortOrder = ALLOWED_SORT_ORDER.includes(
    params.order as AdminGroupExpenseSortOrder,
  )
    ? (params.order as AdminGroupExpenseSortOrder)
    : "desc";

  const minCostRaw = Number(params.minCost);
  const minCost =
    Number.isFinite(minCostRaw) && minCostRaw > 0 ? minCostRaw : 0;

  const data = await getAdminExpenseInsights({
    search: params.q,
    minCost,
    sortBy,
    sortOrder,
  });

  if (!data.success) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        {data.message}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Expenses</h1>
        <p className="text-sm text-muted-foreground">
          Global app financial snapshot across all groups with money totals.
        </p>
      </div>

      <form
        className="rounded-2xl border border-border bg-card p-4 shadow-sm"
        method="get"
      >
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          <div className="space-y-1">
            <label
              htmlFor="q"
              className="text-xs font-medium text-muted-foreground"
            >
              Search Group
            </label>
            <input
              id="q"
              name="q"
              defaultValue={data.filters.search}
              placeholder="Search by group name"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="minCost"
              className="text-xs font-medium text-muted-foreground"
            >
              Min Group Cost (BDT)
            </label>
            <input
              id="minCost"
              name="minCost"
              type="number"
              min={0}
              step="0.01"
              defaultValue={data.filters.minCost || ""}
              placeholder="0"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

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
              <option value="totalExpenseAmount">Total expense amount</option>
              <option value="totalDepositAmount">Total deposit amount</option>
              <option value="netCost">Net cost</option>
              <option value="pendingExpenseAmount">
                Pending expense amount
              </option>
            </select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="order"
              className="text-xs font-medium text-muted-foreground"
            >
              Order
            </label>
            <div className="flex gap-2">
              <select
                id="order"
                name="order"
                defaultValue={data.filters.sortOrder}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="desc">High to low</option>
                <option value="asc">Low to high</option>
              </select>
              <button
                type="submit"
                className="rounded-lg border border-border bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </form>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Total expense money</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {formatMoney(data.summary.totalExpenseAmount)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {data.summary.totalExpensesCount} entries
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Total deposit money</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {formatMoney(data.summary.totalDepositAmount)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {data.summary.totalDepositsCount} entries
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Pending expense money</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {formatMoney(data.summary.pendingExpenseAmount)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {data.summary.pendingExpenseCount} pending expenses
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">All expenses</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {data.summary.totalExpensesCount}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">All deposits</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {data.summary.totalDepositsCount}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">Pending expenses</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {data.summary.pendingExpenseCount}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Total pending operations
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {data.summary.totalPendingOperations}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">
          Pending Breakdown
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border p-3">
            <p className="text-xs text-muted-foreground">Expense approvals</p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {data.summary.pendingExpenseCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatMoney(data.summary.pendingExpenseAmount)}
            </p>
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="text-xs text-muted-foreground">Deposit requests</p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {data.summary.pendingDepositRequestCount}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatMoney(data.summary.pendingDepositRequestAmount)}
            </p>
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="text-xs text-muted-foreground">Pending invitations</p>
            <p className="mt-1 text-xl font-semibold text-foreground">
              {data.summary.pendingInvitationCount}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Group Costing List
          </h2>
          <p className="text-xs text-muted-foreground">
            {data.summary.totalGroups} groups in filtered result
          </p>
        </div>

        {data.groups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No groups matched your search/filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-245 text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3">Group</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Expense amount</th>
                  <th className="py-2 pr-3">Deposit amount</th>
                  <th className="py-2 pr-3">Net cost</th>
                  <th className="py-2 pr-3">Expense count</th>
                  <th className="py-2 pr-3">Pending expense</th>
                  <th className="py-2 pr-3">Pending deposit req</th>
                </tr>
              </thead>
              <tbody>
                {data.groups.map((group) => (
                  <tr key={group.messId} className="border-b border-border/70">
                    <td className="py-3 pr-3 font-medium text-foreground">
                      {group.messName}
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {group.status}
                    </td>
                    <td className="py-3 pr-3 text-foreground">
                      {formatMoney(group.totalExpenseAmount)}
                    </td>
                    <td className="py-3 pr-3 text-foreground">
                      {formatMoney(group.totalDepositAmount)}
                    </td>
                    <td className="py-3 pr-3 font-medium text-foreground">
                      {formatMoney(group.netCost)}
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {group.expenseCount}
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {group.pendingExpenseCount} (
                      {formatMoney(group.pendingExpenseAmount)})
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {group.pendingDepositRequestCount} (
                      {formatMoney(group.pendingDepositRequestAmount)})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
