const CardSkeleton = ({ className = "" }) => {
  return (
    <div className={`bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden ${className}`}>
      {/* Image skeleton */}
      <div className="w-full h-48 bg-sidebar-600/50 skeleton-gradient" />
      
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="h-6 bg-sidebar-500/50 rounded w-3/4 skeleton-gradient" />
        
        {/* Check-in/out info */}
        <div className="space-y-2">
          <div className="h-4 bg-sidebar-500/30 rounded w-full skeleton-gradient" />
          <div className="h-4 bg-sidebar-500/30 rounded w-full skeleton-gradient" />
        </div>
        
        {/* Status badges */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex space-x-2">
            <div className="h-6 bg-sidebar-500/40 rounded-full w-16 skeleton-gradient" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardSkeleton;