'use client'

import QRCode from 'qrcode'
import Image from 'next/image'
import { useEffect, useState } from 'react'

export function QRCodeDownloads({ url }: { url: string }) {
  const [png, setPng] = useState('')
  const [svg, setSvg] = useState('')
  const [variant, setVariant] = useState<'plain' | 'qr' | 'nfc'>('plain')
  const target = variant === 'plain' ? url : `${url}?src=${variant}`

  useEffect(() => {
    let active = true
    Promise.all([
      QRCode.toDataURL(target, { width: 512, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#080808', light: '#FFFFFF' } }),
      QRCode.toString(target, { type: 'svg', width: 512, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#080808', light: '#FFFFFF' } }),
    ]).then(([pngData, svgData]) => { if (active) { setPng(pngData); setSvg(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}`) } })
      .catch(() => { if (active) { setPng(''); setSvg('') } })
    return () => { active = false }
  }, [target])

  return <div className="cobraa-qr-tool">
    <label htmlFor="qr-variant">QR destination</label>
    <select id="qr-variant" value={variant} onChange={(event) => setVariant(event.target.value as typeof variant)}>
      <option value="plain">Standard site link</option><option value="qr">Track as QR (?src=qr)</option><option value="nfc">Track as NFC (?src=nfc)</option>
    </select>
    {png && <Image className="cobraa-qr-image" src={png} width={192} height={192} alt="QR code preview" unoptimized />}
    <div className="cobraa-actions">
      {png && <a href={png} download={`cobraa3d-${variant}.png`}>Download PNG</a>}
      {svg && <a href={svg} download={`cobraa3d-${variant}.svg`}>Download SVG</a>}
    </div>
  </div>
}
