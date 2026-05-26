export default function FlashcardSessionLoading() {
  return (
    <div className="flex h-full items-center justify-center px-8 py-6">
      <div className="w-full max-w-xl">
        <div className="mb-4 h-2 w-full animate-pulse rounded-full bg-muted" />
        <div className="rounded-xl border border-[#E3E8ED] bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
          <div className="mb-4 h-4 w-1/4 animate-pulse rounded bg-muted" />
          <div className="mb-6 space-y-2">
            <div className="h-5 w-full animate-pulse rounded bg-muted" />
            <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
          </div>
          <div className="mt-8 flex justify-center gap-3">
            <div className="h-10 w-28 animate-pulse rounded-lg bg-muted" />
            <div className="h-10 w-28 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
      </div>
    </div>
  )
}
