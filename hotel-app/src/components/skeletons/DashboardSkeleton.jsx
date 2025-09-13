const DashboardSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Welcome Section Skeleton */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 ">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="h-8 bg-sidebar-500/50 rounded skeleton-gradient w-1/3 mb-2" />
            <div className="h-4 bg-sidebar-500/30 rounded skeleton-gradient w-2/3" />
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 bg-sidebar-500/50 rounded skeleton-gradient-full" />
            <div className="h-8 bg-sidebar-500/50 rounded skeleton-gradient w-20" />
          </div>
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 ">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-sidebar-500/30 rounded skeleton-gradient w-2/3 mb-2" />
                <div className="h-8 bg-sidebar-500/50 rounded skeleton-gradient w-1/2 mb-1" />
                <div className="h-3 bg-sidebar-500/30 rounded skeleton-gradient w-3/4" />
              </div>
              <div className="p-3 bg-sidebar-500/50 rounded skeleton-gradient-lg">
                <div className="w-8 h-8 bg-sidebar-400/50 rounded skeleton-gradient" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Skeleton */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 ">
        <div className="h-6 bg-sidebar-500/50 rounded skeleton-gradient w-1/4 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-sidebar-500/50 rounded skeleton-gradient-lg">
                  <div className="w-6 h-6 bg-sidebar-400/50 rounded skeleton-gradient" />
                </div>
                <div className="h-5 bg-sidebar-500/50 rounded skeleton-gradient w-2/3" />
              </div>
              <div className="h-4 bg-sidebar-500/30 rounded skeleton-gradient w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* System Info Skeleton */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 p-6 ">
        <div className="h-6 bg-sidebar-500/50 rounded skeleton-gradient w-1/3 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="h-5 bg-sidebar-500/50 rounded skeleton-gradient w-1/2 mb-2" />
            <div className="space-y-2">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="h-4 bg-sidebar-500/30 rounded skeleton-gradient w-1/3" />
                  <div className="h-5 bg-sidebar-500/40 rounded-full w-20" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="h-5 bg-sidebar-500/50 rounded skeleton-gradient w-1/3 mb-2" />
            <div className="space-y-2">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="h-4 bg-sidebar-500/30 rounded skeleton-gradient w-1/2" />
                  <div className="h-4 bg-sidebar-500/30 rounded skeleton-gradient w-1/3" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;