const TableSkeleton = ({ 
  rows = 5, 
  columns = 4, 
  showHeader = true, 
  className = "" 
}) => {
  return (
    <div className={`bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden  ${className}`}>
      {/* Table Header */}
      {showHeader && (
        <div className="border-b border-white/10 p-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {[...Array(columns)].map((_, index) => (
              <div key={index} className="h-5 bg-sidebar-500/50 rounded skeleton-gradient w-3/4" />
            ))}
          </div>
        </div>
      )}
      
      {/* Table Rows */}
      <div className="divide-y divide-white/5">
        {[...Array(rows)].map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {[...Array(columns)].map((_, colIndex) => (
                <div 
                  key={colIndex} 
                  className={`h-4 bg-sidebar-500/30 rounded skeleton-gradient ${
                    colIndex === 0 ? 'w-full' : colIndex === columns - 1 ? 'w-1/2' : 'w-3/4'
                  }`} 
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableSkeleton;