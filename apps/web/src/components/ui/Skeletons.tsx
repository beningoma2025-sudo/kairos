import { cn } from "@/lib/utils";

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-kairo-dark-muted", className)} />
  );
}

export function ContentRowSkeleton({ title }: { title: string }) {
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-7 w-48" />
      </div>
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-52">
            <Skeleton className="aspect-video w-full rounded-xl mb-2" />
            <Skeleton className="h-4 w-3/4 mb-1" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function ContentCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-52">
      <Skeleton className="aspect-video w-full rounded-xl mb-2" />
      <Skeleton className="h-4 w-3/4 mb-1" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function HeroSkeleton() {
  return <Skeleton className="h-[70vh] w-full rounded-none" />;
}
