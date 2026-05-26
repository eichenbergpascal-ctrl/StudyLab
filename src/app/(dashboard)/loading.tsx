export default function DashboardLoading() {
  return (
    <div className="px-8 py-6">
      <div className="max-w-[960px]">
        <div className="mb-1 h-8 w-52 animate-pulse rounded bg-muted" />
        <div className="mb-8 h-4 w-72 animate-pulse rounded bg-muted" />
        <div className="mb-3 h-4 w-28 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-lg border border-[#E3E8ED] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
            >
              <div className="mb-3 h-5 w-3/4 animate-pulse rounded bg-muted" />
              <div className="mb-2 h-3 w-1/3 animate-pulse rounded bg-muted" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
              <div className="mt-4 border-t border-[#E3E8ED] pt-2.5">
                <div className="flex gap-2">
                  <div className="h-6 w-20 animate-pulse rounded bg-muted" />
                  <div className="h-6 w-20 animate-pulse rounded bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
