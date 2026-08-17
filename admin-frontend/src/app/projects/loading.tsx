export default function Loading() {
  return (
    <div className="p-8 h-full flex flex-col space-y-8 animate-fade-in-up">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-8">
        <div className="space-y-4">
          <div className="h-4 w-32 bg-surface-container-high rounded animate-pulse" />
          <div className="h-12 w-80 bg-surface-container-high rounded animate-pulse" />
        </div>
        <div className="h-10 w-40 bg-surface-container-high rounded animate-pulse" />
      </div>
      
      {/* Kanban Board Skeleton */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {[1, 2, 3, 4].map(col => (
          <div key={col} className="w-[300px] shrink-0 bg-surface-container-low rounded-xl p-4 flex flex-col space-y-4">
            <div className="h-6 w-32 bg-surface-container-high rounded animate-pulse" />
            
            <div className="flex-1 space-y-3">
              {[1, 2].map(card => (
                <div key={card} className="h-24 w-full bg-surface-container rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
