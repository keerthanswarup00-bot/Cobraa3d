"use client";
// Filament-colour picker. Persists in localStorage and recolours the site via --accent / --accent-ink.
import { useEffect, useState } from "react";

export const FILAMENTS = [
  { name: "Signal Orange", hex: "#ff5a1f" },
  { name: "Cyan", hex: "#19b5d1" },
  { name: "Lime", hex: "#9be15d" },
  { name: "Magenta", hex: "#e0468f" },
  { name: "Bone", hex: "#ece8dc" },
] as const;

const KEY = "cobraa-accent";

function inkFor(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const lum = (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  return lum > 0.55 ? "#0b0b0c" : "#ffffff";
}

function apply(hex: string) {
  const s = document.documentElement.style;
  s.setProperty("--accent", hex);
  s.setProperty("--accent-ink", inkFor(hex));
  window.dispatchEvent(new Event("cobraa:accent")); // lets the hero canvas refresh its colour
}

export function AccentPicker() {
  const [active, setActive] = useState<string>(FILAMENTS[0].hex);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved && FILAMENTS.some((f) => f.hex === saved)) setActive(saved);
    } catch {}
  }, []);

  function pick(hex: string) {
    setActive(hex);
    apply(hex);
    try { localStorage.setItem(KEY, hex); } catch {}
  }

  return (
    <div className="c3-picker" role="group" aria-label="Filament colour">
      <span className="c3-picker__label">Filament</span>
      {FILAMENTS.map((f) => (
        <button
          key={f.hex}
          type="button"
          className="c3-picker__swatch"
          style={{ background: f.hex }}
          aria-label={f.name}
          aria-pressed={active === f.hex}
          onClick={() => pick(f.hex)}
        />
      ))}
    </div>
  );
}
