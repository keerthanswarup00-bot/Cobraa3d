'use client'

import dynamic from 'next/dynamic'
import { preload } from 'react-dom'
import GuideLoading from './GuideLoading'
import type { PdfViewerProps } from './PdfViewer'

const PdfViewer = dynamic(() => import('./PdfViewer'), {
  ssr: false,
  loading: () => <GuideLoading />,
})

export default function PdfViewerLoader(props: PdfViewerProps) {
  preload(props.url, { as: 'fetch', crossOrigin: 'anonymous' })
  return <PdfViewer {...props} />
}
