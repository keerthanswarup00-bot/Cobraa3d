'use client'

import dynamic from 'next/dynamic'

const PdfViewer = dynamic(() => import('./PdfViewer'), {
  ssr: false,
  loading: () => <progress className="guide-progress" aria-label="Loading PDF viewer" />,
})

export default PdfViewer
