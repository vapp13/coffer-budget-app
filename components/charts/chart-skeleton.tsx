import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ChartSkeleton() {
  return (
    <Card>
      <Skeleton className="mb-3 h-4 w-40" />
      <Skeleton className="h-64 w-full" />
    </Card>
  );
}
