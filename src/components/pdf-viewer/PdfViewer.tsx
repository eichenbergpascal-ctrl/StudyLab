"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Minimize2,
  PanelLeft,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// react-pdf v9 recommended worker setup for Next.js / Turbopack
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString()

const ZOOM_STEPS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0]
const PAGE_PADDING_X = 32 // horizontal padding inside scroll area (each side)

export function PdfViewer({
  url,
  initialPage = 1,
  className,
}: {
  url: string
  initialPage?: number
  className?: string
}) {
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [zoom, setZoom] = useState(1.0)
  const [isFitWidth, setIsFitWidth] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [pageInput, setPageInput] = useState(String(initialPage))
  const [containerWidth, setContainerWidth] = useState(0)

  const scrollRef = useRef<HTMLDivElement>(null)
  const pageRefs = useRef(new Map<number, Element>())
  const observerRef = useRef<IntersectionObserver | null>(null)
  const didScrollRef = useRef(false)

  // Track scroll container width
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Computed render width for each page
  const renderWidth = useMemo(() => {
    if (!containerWidth) return undefined
    const base = containerWidth - PAGE_PADDING_X * 2
    return isFitWidth ? base : base * zoom
  }, [containerWidth, zoom, isFitWidth])

  // IntersectionObserver for current-page tracking
  const rebuildObserver = useCallback(() => {
    const container = scrollRef.current
    if (!container) return
    observerRef.current?.disconnect()
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting && e.intersectionRatio >= 0.25)
          .map((e) => ({
            page: parseInt(e.target.getAttribute("data-page") ?? "0", 10),
            top: e.boundingClientRect.top,
          }))
          .filter((e) => e.page > 0)
          .sort((a, b) => a.top - b.top)
        if (visible.length > 0) {
          const page = visible[0].page
          setCurrentPage(page)
          setPageInput(String(page))
        }
      },
      { root: container, threshold: [0, 0.25, 0.5, 1] },
    )
    pageRefs.current.forEach((el) => observerRef.current!.observe(el))
  }, [])

  useEffect(() => {
    if (numPages > 0) rebuildObserver()
    return () => observerRef.current?.disconnect()
  }, [numPages, rebuildObserver])

  // Scroll to initialPage once after document loads
  useEffect(() => {
    if (numPages < 1 || didScrollRef.current) return
    didScrollRef.current = true
    if (initialPage <= 1) return
    const el = pageRefs.current.get(initialPage)
    if (el) {
      el.scrollIntoView({ block: "start", behavior: "instant" })
    } else {
      const t = setTimeout(() => {
        pageRefs.current.get(initialPage)?.scrollIntoView({ block: "start", behavior: "instant" })
      }, 200)
      return () => clearTimeout(t)
    }
  }, [numPages, initialPage])

  // Register page div with observer
  function registerRef(page: number, el: Element | null) {
    if (el) {
      pageRefs.current.set(page, el)
      observerRef.current?.observe(el)
    } else {
      const prev = pageRefs.current.get(page)
      if (prev) observerRef.current?.unobserve(prev)
      pageRefs.current.delete(page)
    }
  }

  function scrollToPage(page: number) {
    pageRefs.current.get(page)?.scrollIntoView({ behavior: "smooth", block: "start" })
    setCurrentPage(page)
    setPageInput(String(page))
  }

  function handleDocumentLoad({ numPages: n }: { numPages: number }) {
    setNumPages(n)
  }

  function handlePageInputBlur() {
    const n = parseInt(pageInput, 10)
    if (Number.isFinite(n) && n >= 1 && n <= numPages) {
      scrollToPage(n)
    } else {
      setPageInput(String(currentPage))
    }
  }

  function zoomIn() {
    setIsFitWidth(false)
    setZoom((z) => ZOOM_STEPS.find((s) => s > z) ?? z)
  }

  function zoomOut() {
    setIsFitWidth(false)
    setZoom((z) => [...ZOOM_STEPS].reverse().find((s) => s < z) ?? z)
  }

  const canZoomIn = isFitWidth || zoom < ZOOM_STEPS[ZOOM_STEPS.length - 1]
  const canZoomOut = isFitWidth || zoom > ZOOM_STEPS[0]
  const zoomLabel = isFitWidth ? "Breite" : `${Math.round(zoom * 100)}%`

  const pages = useMemo(
    () => (numPages > 0 ? Array.from({ length: numPages }, (_, i) => i + 1) : []),
    [numPages],
  )

  return (
    <div
      className={cn(
        "flex h-full overflow-hidden rounded-lg border border-border bg-card",
        className,
      )}
    >
      {/* Thumbnail Sidebar */}
      {isSidebarOpen && (
        <div className="flex w-[180px] shrink-0 flex-col border-r border-border bg-card">
          <div className="flex-1 overflow-y-auto px-2 py-2">
            <Document file={url}>
              {pages.map((page) => (
                <button
                  key={page}
                  onClick={() => scrollToPage(page)}
                  className={cn(
                    "mb-2 w-full overflow-hidden rounded-md border-2 transition-colors",
                    page === currentPage
                      ? "border-primary"
                      : "border-transparent hover:border-border",
                  )}
                  aria-label={`Zu Seite ${page} springen`}
                >
                  <Page
                    pageNumber={page}
                    width={148}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                  />
                  <p className="py-0.5 text-center text-xs text-muted-foreground">
                    {page}
                  </p>
                </button>
              ))}
            </Document>
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Toolbar */}
        <div className="flex shrink-0 items-center gap-1 border-b border-border bg-card px-2 py-2">
          {/* Sidebar toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen((v) => !v)}
            aria-label="Seitenvorschauen umschalten"
            className={cn("size-8", isSidebarOpen && "bg-accent text-accent-foreground")}
          >
            <PanelLeft className="size-4" strokeWidth={2} />
          </Button>

          <div className="mx-1 h-4 w-px shrink-0 bg-border" />

          {/* Page navigation */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => currentPage > 1 && scrollToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Vorherige Seite"
            className="size-8"
          >
            <ChevronLeft className="size-4" strokeWidth={2} />
          </Button>

          <div className="flex items-center gap-1.5">
            <Input
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={handlePageInputBlur}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
              className="h-7 w-12 px-1 text-center text-sm"
              aria-label="Seitennummer"
            />
            <span className="text-sm text-muted-foreground">
              / {numPages || "–"}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => currentPage < numPages && scrollToPage(currentPage + 1)}
            disabled={currentPage >= numPages}
            aria-label="Nächste Seite"
            className="size-8"
          >
            <ChevronRight className="size-4" strokeWidth={2} />
          </Button>

          <div className="mx-1 h-4 w-px shrink-0 bg-border" />

          {/* Zoom controls */}
          <Button
            variant="ghost"
            size="icon"
            onClick={zoomOut}
            disabled={!canZoomOut}
            aria-label="Verkleinern"
            className="size-8"
          >
            <Minus className="size-4" strokeWidth={2} />
          </Button>

          <span className="min-w-14 select-none text-center text-sm text-muted-foreground">
            {zoomLabel}
          </span>

          <Button
            variant="ghost"
            size="icon"
            onClick={zoomIn}
            disabled={!canZoomIn}
            aria-label="Vergrößern"
            className="size-8"
          >
            <Plus className="size-4" strokeWidth={2} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => { setIsFitWidth(true); setZoom(1.0) }}
            aria-label="An Breite anpassen"
            className={cn("size-8", isFitWidth && "bg-accent text-accent-foreground")}
          >
            <Minimize2 className="size-4" strokeWidth={2} />
          </Button>
        </div>

        {/* PDF scroll area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto bg-slate-100">
          <Document
            file={url}
            onLoadSuccess={handleDocumentLoad}
            loading={
              <div className="flex h-32 items-center justify-center">
                <p className="text-sm text-muted-foreground">Lade PDF…</p>
              </div>
            }
            error={
              <div className="flex h-32 items-center justify-center">
                <p className="text-sm text-destructive">PDF konnte nicht geladen werden.</p>
              </div>
            }
          >
            <div className="flex flex-col items-center gap-4 py-4">
              {pages.map((page) => (
                <div
                  key={page}
                  ref={(el) => registerRef(page, el)}
                  data-page={page}
                  className="shadow-sm"
                >
                  <Page
                    pageNumber={page}
                    width={renderWidth}
                    renderAnnotationLayer={true}
                    renderTextLayer={true}
                  />
                </div>
              ))}
            </div>
          </Document>
        </div>
      </div>
    </div>
  )
}
