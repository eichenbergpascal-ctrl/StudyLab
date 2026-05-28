export default function ExamDetailLoading() {
  return (
    <div className="px-4 py-4 md:px-8 md:py-6">
      <div className="max-w-[960px]">
        <div className="mb-6 h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="mb-1.5 h-8 w-64 animate-pulse rounded bg-muted" />
            <div className="h-4 w-48 animate-pulse rounded bg-muted" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-24 animate-pulse rounded bg-muted" />
            <div className="h-8 w-20 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="flex flex-col gap-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-4"
            >
              <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
