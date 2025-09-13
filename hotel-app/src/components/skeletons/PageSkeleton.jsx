const PageSkeleton = ({ 
  showHeader = true, 
  showButton = true, 
  children,
  className = "" 
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Page Header Skeleton */}
      {showHeader && (
        <div className="flex items-center justify-between ">
          <div>
            <div className="h-8 bg-sidebar-500/50 rounded skeleton-gradient w-64 mb-2" />
            <div className="h-4 bg-sidebar-500/30 rounded skeleton-gradient w-48" />
          </div>
          
          {showButton && (
            <div className="h-10 bg-primary-500/50 rounded-lg skeleton-gradient w-32" />
          )}
        </div>
      )}

      {/* Content Area */}
      <div className="">
        {children}
      </div>
    </div>
  );
};

export default PageSkeleton;