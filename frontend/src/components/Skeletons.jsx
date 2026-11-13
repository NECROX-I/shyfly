export const CardSkeleton = () => (
  <div>
    <div className="skeleton aspect-[4/5] rounded-2xl" />
    <div className="skeleton mt-3 h-3 w-1/3 rounded" />
    <div className="skeleton mt-2 h-4 w-4/5 rounded" />
    <div className="skeleton mt-2 h-4 w-1/3 rounded" />
  </div>
)

export const GridSkeleton = ({ n = 8, cols = 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4' }) => (
  <div className={`grid gap-x-4 gap-y-8 ${cols}`}>{Array.from({ length: n }).map((_, i) => <CardSkeleton key={i} />)}</div>
)

export const Spinner = ({ className = '' }) => <div className={`h-8 w-8 animate-spin rounded-full border-2 border-rose-400 border-t-transparent ${className}`} />

export const PageLoader = () => (
  <div className="flex min-h-[60vh] items-center justify-center"><Spinner /></div>
)
