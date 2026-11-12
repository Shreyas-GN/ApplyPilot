export function Skeleton({ className = "h-6 w-full" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-ui-linen ${className}`} aria-hidden="true" />;
}

