export default function Loading() {
  return (
    <div className="p-8 w-full max-w-7xl mx-auto space-y-8 animate-fade-in-up">
      {/* Header Skeleton */}
      <div className="flex flex-col items-center justify-center space-y-6 pt-16">
        <div className="h-8 w-64 bg-surface-container-high rounded animate-pulse" />
        <div className="h-4 w-96 bg-surface-container rounded animate-pulse" />
      </div>
      
      {/* Form Skeleton */}
      <div className="max-w-2xl mx-auto mt-12 base-card p-8 space-y-6">
        <div className="h-10 w-full bg-surface-container rounded animate-pulse" />
        <div className="h-10 w-full bg-surface-container rounded animate-pulse" />
        <div className="h-32 w-full bg-surface-container rounded animate-pulse" />
        <div className="h-12 w-32 bg-brand-primary/30 rounded animate-pulse" />
      </div>
    </div>
  );
}
