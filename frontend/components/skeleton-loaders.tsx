'use client';

export function ChatSkeleton() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      {/* Header skeleton */}
      <div className="h-14 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
      
      {/* Messages skeleton */}
      <div className="flex-1 space-y-4 p-4">
        <div className="flex gap-3">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <div className="flex-1 space-y-2 max-w-[70%]">
            <div className="h-4 bg-blue-100 dark:bg-blue-900/30 rounded w-full" />
            <div className="h-4 bg-blue-100 dark:bg-blue-900/30 rounded w-2/3" />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        </div>
      </div>
      
      {/* Input skeleton */}
      <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded mx-4 mb-4" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="p-6 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-6" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        ))}
      </div>
      
      <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="p-6 animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-6" />
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
    </div>
  );
}
