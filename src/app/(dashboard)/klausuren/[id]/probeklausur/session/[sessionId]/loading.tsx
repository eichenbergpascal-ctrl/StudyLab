export default function ExamSessionLoading() {
  return (
    <div className="flex h-full flex-col px-8 py-6">
      <div className="mb-4 h-2 w-full animate-pulse rounded-full bg-muted" />
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6 h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="rounded-xl border border-[#E3E8ED] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="mb-4 space-y-2">
            <div className="h-5 w-full animate-pulse rounded bg-muted" />
            <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
          </div>
          <div className="mt-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-10 w-full animate-pulse rounded-lg border border-border bg-muted"
              />
            ))}
          </div>
        </div>
        <div className="mt-4 flex justify-between">
          <div className="h-9 w-24 animate-pulse rounded bg-muted" />
          <div className="h-9 w-24 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}
