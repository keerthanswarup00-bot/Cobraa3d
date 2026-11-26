'use client'

import { Download, Minus, Plus, Share2 } from 'lucide-react'
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import type { PDFPageProxy, RenderTask } from 'pdfjs-dist'
import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { copyGuideLink } from '@/lib/guides'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

const ZOOMS = [1, 1.25, 1.5, 2, 3]

type Props = {
  url: string
  downloadURL: string
  title: string
  whatsappURL: string | null
}

type Page = { page: PDFPageProxy; width: number; height: number }

export default function PdfViewer({ url, downloadURL, title, whatsappURL }: Props) {
  const [pages, setPages] = useState<Page[]>([])
  const [failed, setFailed] = useState(false)
  const [progress, setProgress] = useState<number>()
  const [current, setCurrent] = useState(1)
  const [zoom, setZoom] = useState(0)
  const [width, setWidth] = useState(0)
  const [shareStatus, setShareStatus] = useState('')
  const [manualLink, setManualLink] = useState('')
  const scroll = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const zoomAnchor = useRef<{ page: number; offset: number; center: number } | null>(null)

  useEffect(() => {
    const task = pdfjs.getDocument({ url, isEvalSupported: false })
    let active = true
    task.onProgress = ({ loaded, total }: { loaded: number; total: number }) => {
      if (active && total > 0) setProgress(Math.min(1, loaded / total))
    }
    async function load() {
      try {
        const doc = await task.promise
        const dimensions = await Promise.all(
          Array.from({ length: doc.numPages }, async (_, index) => {
            const page = await doc.getPage(index + 1)
            const { width, height } = page.getViewport({ scale: 1 })
            return { page, width, height }
          }),
        )
        if (active) setPages(dimensions)
      } catch {
        if (active) setFailed(true)
      }
    }
    void load()
    return () => {
      active = false
      void task.destroy().catch(() => {})
    }
  }, [url])

  useEffect(() => {
    const viewport = scroll.current!
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [])

  function updatePage() {
    const viewport = scroll.current
    const pageList = list.current
    if (!viewport || !pageList?.childElementCount) return
    const readingLine = viewport.scrollTop + viewport.clientHeight * 0.3
    let first = 0
    let last = pageList.childElementCount - 1
    while (first < last) {
      const middle = Math.floor((first + last) / 2)
      const page = pageList.children[middle] as HTMLElement
      if (pageList.offsetTop + page.offsetTop + page.offsetHeight < readingLine) first = middle + 1
      else last = middle
    }
    setCurrent(first + 1)
  }

  function changeZoom(delta: number) {
    const next = Math.max(0, Math.min(ZOOMS.length - 1, zoom + delta))
    const viewport = scroll.current
    const pageList = list.current
    const page = pageList?.children[current - 1] as HTMLElement | undefined
    if (next === zoom || !viewport || !pageList || !page) return

    zoomAnchor.current = {
      page: current - 1,
      offset:
        (viewport.scrollTop + viewport.clientHeight * 0.3 - pageList.offsetTop - page.offsetTop) /
        page.offsetHeight,
      center:
        zoom === 0 ? 0.5 : (viewport.scrollLeft + viewport.clientWidth / 2) / viewport.scrollWidth,
    }
    setZoom(next)
  }

  useLayoutEffect(() => {
    const viewport = scroll.current
    const pageList = list.current
    const anchor = zoomAnchor.current
    if (!viewport || !pageList || !anchor) return
    const page = pageList.children[anchor.page] as HTMLElement
    zoomAnchor.current = null
    viewport.scrollTop =
      pageList.offsetTop +
      page.offsetTop +
      page.offsetHeight * anchor.offset -
      viewport.clientHeight * 0.3
    viewport.scrollLeft = viewport.scrollWidth * anchor.center - viewport.clientWidth / 2
  }, [zoom])

  const handleKey = useEffectEvent((event: KeyboardEvent) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return
    if (
      event.target instanceof HTMLElement &&
      event.target.closest('input, textarea, select, [contenteditable]')
    )
      return
    if (['+', '=', '-'].includes(event.key)) {
      event.preventDefault()
      changeZoom(event.key === '-' ? -1 : 1)
      return
    }
    const step = { ArrowUp: -40, ArrowDown: 40, PageUp: -0.9, PageDown: 0.9 }[event.key]
    const horizontal = { ArrowLeft: -40, ArrowRight: 40 }[event.key]
    const viewport = scroll.current
    if (!viewport || (!step && !horizontal)) return
    event.preventDefault()
    viewport.scrollBy({
      left: horizontal,
      top: step && (Math.abs(step) < 1 ? viewport.clientHeight * step : step),
    })
  })
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => handleKey(event)
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  async function share() {
    const link = window.location.href
    setShareStatus('')
    if (navigator.share) {
      try {
        await navigator.share({ title, url: link })
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
      }
    }
    try {
      await copyGuideLink(link)
      setShareStatus('Link copied.')
    } catch {
      setManualLink(link)
      setShareStatus('Select and copy the guide link.')
    }
  }

  const pageWidth = Math.floor(Math.min(width, 920) * ZOOMS[zoom])
  return (
    <main className="guide-viewer">
      <header className="guide-bar">
        <span className="guide-mark" aria-label="Cobraa 3D">
          C3D
        </span>
        <h1 title={title}>{title}</h1>
        <div className="guide-tools">
          {pages.length > 0 && !failed && (
            <span className="guide-count" aria-label={`Page ${current} of ${pages.length}`}>
              {current} / {pages.length}
            </span>
          )}
          <button
            aria-label="Zoom out"
            title="Zoom out"
            disabled={failed || zoom === 0}
            onClick={() => changeZoom(-1)}
          >
            <Minus />
          </button>
          <button
            aria-label="Zoom in"
            title="Zoom in"
            disabled={failed || !pages.length || zoom === ZOOMS.length - 1}
            onClick={() => changeZoom(1)}
          >
            <Plus />
          </button>
          <a aria-label="Download PDF" title="Download PDF" href={downloadURL}>
            <Download />
          </a>
          <button aria-label="Share guide" title="Share guide" onClick={share}>
            <Share2 />
          </button>
        </div>
      </header>
      {!failed && !pages.length && (
        <progress className="guide-progress" aria-label="Loading PDF" value={progress} max={1} />
      )}
      <span className="guide-sr-only" role="status">
        {shareStatus}
      </span>
      {manualLink && (
        <input
          className="guide-share-link"
          aria-label="Guide share link"
          readOnly
          value={manualLink}
          onFocus={(event) => event.target.select()}
        />
      )}
      <div
        className="guide-scroll"
        ref={scroll}
        onScroll={updatePage}
        tabIndex={0}
        aria-label="Guide pages"
      >
        {failed ? (
          <div className="guide-message" role="alert">
            <p>We couldn’t display this guide here.</p>
            <a href={url} target="_blank" rel="noreferrer">
              Open PDF
            </a>
            <a href={downloadURL}>Download</a>
          </div>
        ) : (
          <div className="guide-pages" ref={list} style={{ width: pageWidth || '100%' }}>
            {pageWidth > 0 &&
              pages.map((page) => (
                <PdfPage
                  key={page.page.pageNumber}
                  {...page}
                  displayWidth={pageWidth}
                  scroll={scroll}
                  onError={setFailed}
                />
              ))}
          </div>
        )}
      </div>
      {whatsappURL && (
        <footer className="guide-footer">
          Need help?{' '}
          <a href={whatsappURL} target="_blank" rel="noreferrer">
            Message us on WhatsApp
          </a>
        </footer>
      )}
    </main>
  )
}

function PdfPage({
  page,
  width,
  height,
  displayWidth,
  scroll,
  onError,
}: Page & {
  displayWidth: number
  scroll: RefObject<HTMLDivElement | null>
  onError: (failed: boolean) => void
}) {
  const wrapper = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [near, setNear] = useState(false)
  const [renderedWidth, setRenderedWidth] = useState(0)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), {
      root: scroll.current,
      rootMargin: '650px',
    })
    observer.observe(wrapper.current!)
    return () => observer.disconnect()
  }, [scroll])

  useEffect(() => {
    const element = canvas.current
    if (!near || !element) return
    // Cap canvas area and dimensions for mobile Safari and oversized PDF sheets.
    const density = window.devicePixelRatio || 1
    const scale = Math.min(
      (displayWidth / width) * density,
      4096 / Math.max(width, height),
      Math.sqrt(8_000_000 / (width * height)),
    )
    const viewport = page.getViewport({ scale })
    element.width = Math.max(1, Math.floor(viewport.width))
    element.height = Math.max(1, Math.floor(viewport.height))
    let active = true
    let task: RenderTask | undefined
    try {
      task = page.render({ canvas: element, viewport })
      void task.promise
        .then(() => {
          if (active) setRenderedWidth(displayWidth)
        })
        .catch(() => {
          if (active) onError(true)
        })
    } catch {
      onError(true)
    }
    return () => {
      active = false
      task?.cancel()
      element.width = 0
      element.height = 0
    }
  }, [near, displayWidth, width, height, page, onError])

  return (
    <div className="guide-page" ref={wrapper} style={{ aspectRatio: `${width} / ${height}` }}>
      {near && (
        <canvas
          ref={canvas}
          role="img"
          aria-label={`Page ${page.pageNumber}`}
          style={{ visibility: renderedWidth === displayWidth ? 'visible' : 'hidden' }}
        />
      )}
    </div>
  )
}
