import { Skeleton } from "@/components/ui/skeleton";

export default function UserDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background lg:flex">
      <div className="flex-1 ">
        <main className="pb-20 lg:pb-6">
          <div className="max-w-7xl mx-auto  space-y-6">
            <div className="hidden lg:flex items-center justify-between mb-6">
              <div className="space-y-3">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-4 w-72" />
              </div>
              <Skeleton className="h-12 w-12 rounded-xl" />
            </div>

            <div className="bg-card rounded-2xl p-4 border border-border shadow-sm flex items-start gap-3">
              <Skeleton className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-72" />
                <Skeleton className="h-9 w-24 rounded-lg" />
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-card rounded-2xl p-4 border border-border shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </div>

            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
              <Skeleton className="h-5 w-32 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-20 w-full rounded-xl" />
              </div>
            </div>

            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border"
                  >
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <div className="space-y-2 text-right">
                      <Skeleton className="h-4 w-14 ml-auto" />
                      <Skeleton className="h-3 w-16 ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-2xl p-5 border border-border shadow-sm">
              <Skeleton className="h-5 w-32 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border"
                  >
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                    <div className="space-y-2 text-right">
                      <Skeleton className="h-4 w-8 ml-auto" />
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
