'use client'

import { useEffect, useState } from 'react'

const accents = [
  { name: 'Marigold', value: '#9A742E' },
  { name: 'Ocean', value: '#245D8F' },
  { name: 'Forest', value: '#26734D' },
  { name: 'Clay', value: '#A53B32' },
  { name: 'Iris', value: '#695093' },
  { name: 'Teal', value: '#146D73' },
]

export function AccentPicker() {
  const [selected, setSelected] = useState(accents[0]!.value)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('cobraa-accent')
    const initial = accents.find((accent) => accent.value === saved)?.value || accents[0]!.value
    document.documentElement.style.setProperty('--accent', initial)
    const frame = requestAnimationFrame(() => setSelected(initial))
    return () => cancelAnimationFrame(frame)
  }, [])

  const pick = (value: string) => {
    setSelected(value)
    document.documentElement.style.setProperty('--accent', value)
    localStorage.setItem('cobraa-accent', value)
    setOpen(false)
    if (navigator.vibrate) navigator.vibrate(8)
  }

  return (
    <div className="accent-picker">
      <button
        type="button"
        className="accent-trigger"
        aria-label="Filament accent colours"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span style={{ '--swatch': selected } as React.CSSProperties} />
      </button>
      {open && (
        <div className="accent-options" role="group" aria-label="Choose an accent colour">
          {accents.map((accent) => (
            <button
              key={accent.value}
              type="button"
              className="accent-option"
              aria-label={`${accent.name} accent`}
              aria-pressed={selected === accent.value}
              onClick={() => pick(accent.value)}
            >
              <span style={{ '--swatch': accent.value } as React.CSSProperties} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
