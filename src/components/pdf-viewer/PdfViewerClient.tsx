"use client"

import dynamic from "next/dynamic"

// ssr: false must live inside a Client Component in Next.js 16+
const PdfViewerDynamic = dynamic(
  () => import("./PdfViewer").then((m) => m.PdfViewer),
  { ssr: false },
)

export function PdfViewerClient({
  url,
  initialPage,
  className,
}: {
  url: string
  initialPage?: number
  className?: string
}) {
  return <PdfViewerDynamic url={url} initialPage={initialPage} className={className} />
}
