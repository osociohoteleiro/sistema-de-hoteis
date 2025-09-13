const ReportSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between ">
        <div>
          <div className="h-8 bg-sidebar-500/50 rounded skeleton-gradient w-80 mb-2" />
          <div className="h-4 bg-sidebar-500/30 rounded skeleton-gradient w-64" />
        </div>
      </div>

      {/* KPIs Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-sidebar-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-6 ">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-sidebar-500/30 rounded skeleton-gradient w-2/3 mb-2" />
                <div className="h-8 bg-sidebar-500/50 rounded skeleton-gradient w-1/2 mb-2" />
                <div className="h-4 bg-sidebar-500/30 rounded skeleton-gradient w-3/4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, index) => (
          <div key={index} className="bg-sidebar-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-6 ">
            <div className="h-6 bg-sidebar-500/50 rounded skeleton-gradient w-1/3 mb-4" />
            <div className="h-64 bg-white/5 rounded-lg flex items-center justify-center">
              <div className="w-16 h-16 bg-sidebar-500/30 rounded skeleton-gradient" />
            </div>
          </div>
        ))}
      </div>

      {/* Detail Section Skeleton */}
      <div className="bg-sidebar-800/50 backdrop-blur-sm rounded-lg border border-white/10 p-6 ">
        <div className="h-6 bg-sidebar-500/50 rounded skeleton-gradient w-1/4 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="text-center">
              <div className="h-4 bg-sidebar-500/30 rounded skeleton-gradient w-3/4 mx-auto mb-2" />
              <div className="h-8 bg-sidebar-500/50 rounded skeleton-gradient w-full mb-1" />
              <div className="h-4 bg-sidebar-500/30 rounded skeleton-gradient w-1/2 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportSkeleton;