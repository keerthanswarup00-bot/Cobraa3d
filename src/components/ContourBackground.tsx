type ContourBackgroundProps = {
  variant?: 'dark' | 'light'
  density?: 'quiet' | 'standard' | 'dense'
  className?: string
  asset?: number
}

export function ContourBackground({ variant = 'light', density = 'standard', className = '', asset = 1 }: ContourBackgroundProps) {
  const index = Math.max(1, Math.min(8, Math.floor(asset)))
  const colour = variant === 'dark' ? 'var(--cobraa-contour-dark)' : 'var(--cobraa-contour-light)'
  return <div
    aria-hidden="true"
    className={`pointer-events-none absolute inset-0 -z-0 ${className}`}
    data-density={density}
    style={{
      backgroundColor: colour,
      maskImage: `url(/contours/contour-${String(index).padStart(2, '0')}.svg)`,
      WebkitMaskImage: `url(/contours/contour-${String(index).padStart(2, '0')}.svg)`,
      maskSize: 'cover',
      WebkitMaskSize: 'cover',
      opacity: density === 'quiet' ? 0.18 : density === 'dense' ? 0.5 : 0.32,
    }}
  />
}
