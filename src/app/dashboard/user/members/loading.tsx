import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function MembersLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-pulse">
      <div className="border-b border-border pb-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-4 w-96 mt-3" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, idx) => (
          <Card key={idx} className="rounded-2xl p-5 space-y-3">
            <Skeleton className="h-8 w-8 rounded-xl" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-36" />
          </Card>
        ))}
      </div>

      <Card className="rounded-3xl p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-11 w-72" />
          <Skeleton className="h-10 w-44" />
        </div>

        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className="grid grid-cols-12 gap-2 items-center py-2">
            <Skeleton className="col-span-5 h-10" />
            <Skeleton className="col-span-2 h-8" />
            <Skeleton className="col-span-1 h-8" />
            <Skeleton className="col-span-2 h-8" />
            <Skeleton className="col-span-2 h-8" />
          </div>
        ))}
      </Card>
    </div>
  );
}
