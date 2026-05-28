export default function FortschrittDetailLoading() {
  return (
    <div className="px-4 py-4 md:px-8 md:py-6">
      <div className="max-w-[960px]">
        <div className="mb-6 h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="mb-8">
          <div className="mb-1.5 h-8 w-64 animate-pulse rounded bg-muted" />
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex flex-col gap-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="mb-4 h-5 w-1/3 animate-pulse rounded bg-muted" />
              <div className="space-y-3">
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
