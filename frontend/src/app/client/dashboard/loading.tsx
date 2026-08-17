export default function Loading() {
  return (
    <div className="p-8 w-full max-w-7xl mx-auto space-y-8 animate-fade-in-up">
      {/* Header Skeleton */}
      <div className="flex justify-between items-end mb-8">
        <div className="space-y-4">
          <div className="h-4 w-24 bg-surface-container-high rounded animate-pulse" />
          <div className="h-12 w-64 bg-surface-container-high rounded animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-surface-container-high rounded animate-pulse" />
      </div>
      
      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="base-card p-6 h-32 bg-surface-container animate-pulse" />
        ))}
      </div>
      
      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 base-card p-6 h-96 bg-surface-container animate-pulse" />
        <div className="base-card p-6 h-96 bg-surface-container animate-pulse" />
      </div>
    </div>
  );
}
