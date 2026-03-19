import Link from "next/link";
import {
  getAdminUsersList,
  type AdminUserSortBy,
  type AdminUserSortOrder,
  type AdminUserRoleFilter,
  type AdminUserStatusFilter,
} from "@/actions/server/Users";
import UserStatusControl from "@/components/Shared/Admin/UserStatusControl";

type AdminUsersPageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    pageSize?: string;
    role?: string;
    status?: string;
    provider?: string;
    sortBy?: string;
    order?: string;
  }>;
};

const ALLOWED_SORT_BY: readonly AdminUserSortBy[] = [
  "createdAt",
  "name",
  "email",
  "role",
];
const ALLOWED_ORDER: readonly AdminUserSortOrder[] = ["asc", "desc"];
const ALLOWED_ROLE: readonly AdminUserRoleFilter[] = [
  "all",
  "user",
  "manager",
  "admin",
];
const ALLOWED_STATUS: readonly AdminUserStatusFilter[] = [
  "all",
  "active",
  "suspended",
];

const ALLOWED_PAGE_SIZE = new Set([10, 20, 50, 100]);

function buildUsersQueryString(
  base: {
    q: string;
    role: string;
    status: string;
    provider: string;
    sortBy: string;
    order: string;
    pageSize: number;
  },
  page: number,
) {
  const query = new URLSearchParams();

  if (base.q) query.set("q", base.q);
  if (base.role && base.role !== "all") query.set("role", base.role);
  if (base.status && base.status !== "all") query.set("status", base.status);
  if (base.provider) query.set("provider", base.provider);
  if (base.sortBy && base.sortBy !== "createdAt")
    query.set("sortBy", base.sortBy);
  if (base.order && base.order !== "desc") query.set("order", base.order);
  if (base.pageSize !== 20) query.set("pageSize", String(base.pageSize));
  if (page > 1) query.set("page", String(page));

  const qs = query.toString();
  return qs ? `/dashboard/admin/users?${qs}` : "/dashboard/admin/users";
}

export default async function AdminUsersPage({
  searchParams,
}: AdminUsersPageProps) {
  const params = await searchParams;

  const sortBy = ALLOWED_SORT_BY.includes(params.sortBy as AdminUserSortBy)
    ? (params.sortBy as AdminUserSortBy)
    : "createdAt";

  const order = ALLOWED_ORDER.includes(params.order as AdminUserSortOrder)
    ? (params.order as AdminUserSortOrder)
    : "desc";

  const role = ALLOWED_ROLE.includes(params.role as AdminUserRoleFilter)
    ? (params.role as AdminUserRoleFilter)
    : "all";

  const status = ALLOWED_STATUS.includes(params.status as AdminUserStatusFilter)
    ? (params.status as AdminUserStatusFilter)
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

  const provider = (params.provider ?? "").trim().slice(0, 32);
  const q = (params.q ?? "").trim().slice(0, 80);

  const data = await getAdminUsersList({
    page,
    pageSize,
    q,
    role,
    status,
    provider,
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
    role: data.filters.role,
    status: data.filters.status,
    provider: data.filters.provider,
    sortBy: data.filters.sortBy,
    order: data.filters.order,
    pageSize: data.pagination.pageSize,
  };

  const prevPageHref = buildUsersQueryString(
    baseQuery,
    data.pagination.page - 1,
  );
  const nextPageHref = buildUsersQueryString(
    baseQuery,
    data.pagination.page + 1,
  );

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Users</h1>
        <p className="text-sm text-muted-foreground">
          Global user directory with pagination, filters, and account insights.
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
              Search User
            </label>
            <input
              id="q"
              name="q"
              defaultValue={data.filters.q}
              placeholder="Search by name or email"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="role"
              className="text-xs font-medium text-muted-foreground"
            >
              Role
            </label>
            <select
              id="role"
              name="role"
              defaultValue={data.filters.role}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All roles</option>
              <option value="user">User</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
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
            </select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="provider"
              className="text-xs font-medium text-muted-foreground"
            >
              Provider
            </label>
            <input
              id="provider"
              name="provider"
              defaultValue={data.filters.provider}
              placeholder="google / credentials"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
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
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="role">Role</option>
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
              href="/dashboard/admin/users"
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
            {data.pagination.totalItems} users total
          </p>
        </div>

        {data.items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No users found with this filter combination.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-245 text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 pr-3">Role</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Provider</th>
                  <th className="py-2 pr-3">Active Groups</th>
                  <th className="py-2 pr-3">Created</th>
                  <th className="py-2 pr-3">Access Controls</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((user) => (
                  <tr key={user.id} className="border-b border-border/70">
                    <td className="py-3 pr-3 font-medium text-foreground">
                      {user.name}
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {user.email}
                    </td>
                    <td className="py-3 pr-3">
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium uppercase text-primary">
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {user.status}
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {user.provider}
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {user.messCount}
                    </td>
                    <td className="py-3 pr-3 text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <UserStatusControl
                        userId={user.id}
                        userName={user.name}
                        status={user.status}
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
                className="rounded-lg cursor-pointer border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                Previous
              </Link>
            ) : (
              <span className="rounded-lg border cursor-pointer border-border px-4 py-2 text-sm font-medium text-muted-foreground">
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
              <span className="rounded-lg border cursor-pointer border-border px-4 py-2 text-sm font-medium text-muted-foreground">
                Next
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
