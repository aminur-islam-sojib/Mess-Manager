import { Skeleton } from "@/components/ui/skeleton";

export default function ManagerDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background lg:flex">
      <div className="flex-1">
        <main className="pb-20 lg:pb-6">
          <div className="max-w-7xl mx-auto   space-y-6">
            {/* Header Skeleton */}
            <div className="bg-card rounded-2xl p-5 border border-border space-y-3">
              <Skeleton className="h-6 w-52" />
              <Skeleton className="h-4 w-72" />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-card rounded-2xl p-4 border border-border space-y-3"
                >
                  <Skeleton className="h-5 w-5" />
                  <Skeleton className="h-7 w-20" />
                  <Skeleton className="h-3 w-28" />
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="bg-card rounded-2xl p-5 border border-border">
              <Skeleton className="h-5 w-40 mb-4" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
              </div>
            </div>

            {/* Recent Expenses */}
            <div className="bg-card rounded-2xl p-5 border border-border">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-16" />
              </div>

              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border"
                  >
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <div className="space-y-2 text-right">
                      <Skeleton className="h-4 w-14 ml-auto" />
                      <Skeleton className="h-3 w-16 ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Member Activity */}
            <div className="bg-card rounded-2xl p-5 border border-border">
              <Skeleton className="h-5 w-40 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border"
                  >
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <div className="space-y-2 text-right">
                      <Skeleton className="h-4 w-14 ml-auto" />
                      <Skeleton className="h-3 w-10 ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
