"use client";
// Bottom sheet for the intercepted route /products/[slug]. Closing = animate out, then router.back().
// Drag starts only from the handle/header, so the gallery and body scroll freely.
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useDragControls, useReducedMotion } from "motion/react";
import { Share2 } from "lucide-react";
import "./product-sheet.css";

export type SheetProduct = {
  slug: string;
  name: string;
  shortDescription?: string | null;
  price?: string;
  images: { url: string; alt?: string }[];
};

const FOCUSABLE = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function ProductSheet({ product, href }: { product: SheetProduct; href: string }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const controls = useDragControls();
  const sheetRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [open, setOpen] = useState(true);
  const [slide, setSlide] = useState(0);
  const [notice, setNotice] = useState("");
  const close = useCallback(() => setOpen(false), []);
  const share = async () => {
    const url = `${window.location.origin}/products/${encodeURIComponent(product.slug)}`;
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try { await navigator.share({ title: product.name, text: product.shortDescription || product.name, url }); return; }
      catch { /* user cancelled */ }
    }
    try { await navigator.clipboard.writeText(url); setNotice("Link copied"); window.setTimeout(() => setNotice(""), 1200); }
    catch { setNotice(`Copy this link: ${url}`); window.setTimeout(() => setNotice(""), 1600); }
  };

  // scroll lock, focus in, focus restore, Escape, Tab trap
  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sheetRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close(); return; }
      if (e.key !== "Tab" || !sheetRef.current) return;
      const items = Array.from(sheetRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!items.length) { e.preventDefault(); return; }
      const first = items[0], last = items[items.length - 1];
      const inside = sheetRef.current.contains(document.activeElement);
      if (!inside || (e.shiftKey && document.activeElement === first)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      trigger?.focus?.();
    };
  }, [close]);

  const spring = reduce ? { duration: 0.01 } : { type: "spring" as const, damping: 32, stiffness: 380 };

  return (
    <AnimatePresence onExitComplete={() => router.back()}>
      {open && (
        <motion.div key="backdrop" className="ps-backdrop" onClick={close}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0.01 : 0.2 }} />
      )}
      {open && (
        <motion.div key="sheet" ref={sheetRef} className="ps-sheet" role="dialog" aria-modal="true"
          aria-labelledby={titleId} tabIndex={-1}
          drag="y" dragControls={controls} dragListener={false}
          dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }}
          onDragEnd={(_, i) => { if (i.offset.y > 120 || i.velocity.y > 600) close(); }}
          initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={spring}>
          <div className="ps-grab" onPointerDown={(e) => controls.start(e)}>
            <span className="ps-handle" />
            <button type="button" className="ps-close" onClick={close} aria-label="Close">×</button>
            <button type="button" className="ps-share" onClick={share} aria-label="Share"><Share2 size={18} aria-hidden="true" /></button>
          </div>

          <div className="ps-body">
            <div className="ps-gallery" onScroll={(e) => {
              const el = e.currentTarget; setSlide(Math.round(el.scrollLeft / el.clientWidth));
            }}>
              {product.images.map((img, i) => (
                <img key={img.url} src={img.url} alt={img.alt || product.name} className="ps-img"
                  loading={i === 0 ? "eager" : "lazy"} draggable={false} />
              ))}
            </div>
            {product.images.length > 1 && (
              <div className="ps-dots" aria-hidden="true">
                {product.images.map((_, i) => <span key={i} data-on={i === slide} />)}
              </div>
            )}

            <h2 id={titleId} className="ps-title">{product.name}</h2>
            {product.price && <p className="ps-price">{product.price}</p>}
            {product.shortDescription && <p className="ps-desc">{product.shortDescription}</p>}
            {notice && <p className="ps-notice" role="status">{notice}</p>}
          </div>

          <div className="ps-cta">
            <a className="ps-wa" href={href} target="_blank" rel="noopener noreferrer">Order on WhatsApp</a>
            <a className="ps-details" href={`/products/${encodeURIComponent(product.slug)}`}>View details →</a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
