"use client";
// Bottom sheet for the intercepted route /products/[slug]. Closing = animate out, then router.back().
// Drag starts only from the handle/header, so the gallery and body scroll freely.
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion, useDragControls, useReducedMotion } from "motion/react";
import { ArrowRight, Share2 } from "lucide-react";
import { PushAlerts } from "@/components/PushAlerts";
import "./product-sheet.css";

export type SheetProduct = {
  name: string;
  shortDescription?: string;
  shortIncludes?: string;
  dimensions?: string;
  price?: string;
  productId: number | string;
  slug: string;
  images: { url: string; alt?: string }[];
  colors?: { name: string; hex?: string }[];
};
// Hrefs are built on the server with your existing buildProductMessage, so no server code is imported here.
export type SheetHrefs = { base: string; byColor: Record<string, string> };

const FOCUSABLE = 'a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function ProductSheet({ product, hrefs, pushPublicKey }: { product: SheetProduct; hrefs: SheetHrefs; pushPublicKey?: string }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const controls = useDragControls();
  const sheetRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [open, setOpen] = useState(true);
  const [slide, setSlide] = useState(0);
  const [color, setColor] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const close = useCallback(() => setOpen(false), []);
  const share = async () => {
    const url = typeof window !== "undefined" ? `${window.location.origin}/products/${encodeURIComponent(product.slug)}` : `/products/${encodeURIComponent(product.slug)}`;
    const shareData = { title: product.name, text: product.shortDescription || product.name, url };
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: any) {
        if (err?.name === "AbortError") return;
      }
    }
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setNotice("Link copied");
        window.setTimeout(() => setNotice(""), 1600);
        return;
      }
    } catch {}
    try {
      setNotice("Link copied");
      window.setTimeout(() => setNotice(""), 1600);
      return;
    } catch {}
    setNotice(`Copy this link: ${url}`);
    window.setTimeout(() => setNotice(""), 2000);
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

  const href = (color && hrefs.byColor[color]) || hrefs.base;
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
          </div>
          <div className="ps-actions">
            <button type="button" className="ps-close" onClick={close} aria-label="Close">×</button>
            <button type="button" className="ps-share" onClick={share} aria-label="Share this product" data-testid="preview-sheet-share">
              <Share2 size={18} aria-hidden="true" />
            </button>
          </div>
          {notice && <div className="ps-share-notice" role="status">{notice}</div>}

          <div className="ps-body">
            <div className="ps-gallery" onScroll={(e) => {
              const el = e.currentTarget; setSlide(Math.round(el.scrollLeft / el.clientWidth));
            }}>
              {product.images.map((img, i) => (
                <Image key={img.url} src={img.url} alt={img.alt || product.name} className="ps-img" width={800} height={800}
                  sizes="(max-width: 520px) 100vw, 480px" loading={i === 0 ? "eager" : "lazy"} decoding="async" fetchPriority={i === 0 ? "high" : "auto"} draggable={false} unoptimized={!img.url.startsWith('/')} />
              ))}
            </div>
            {product.images.length > 1 && (
              <div className="ps-dots" aria-hidden="true">
                {product.images.map((_, i) => <span key={i} data-on={i === slide} />)}
              </div>
            )}

            <h2 id={titleId} className="ps-title">{product.name}</h2>
            {product.price && <p className="ps-price">{product.price}</p>}
            {product.shortIncludes && <p className="ps-desc">{product.shortIncludes}</p>}
            {product.dimensions && <p className="ps-size">Size: {product.dimensions}</p>}

            {!!product.colors?.length && (
              <div className="ps-colors" role="group" aria-label="Colour">
                {product.colors.map((c) => (
                  <button key={c.name} type="button" className="ps-chip" aria-pressed={color === c.name}
                    onClick={() => setColor(color === c.name ? null : c.name)}>
                    {c.hex && <i style={{ background: c.hex }} />}{c.name}
                  </button>
                ))}
              </div>
            )}
            <PushAlerts publicKey={pushPublicKey} source="product-sheet" />
          </div>

          <div className="ps-cta">
            <div className="ps-cta-row" data-testid="preview-sheet-footer">
              <a className="ps-wa" href={href} target="_blank" rel="noopener noreferrer">
                <svg className="ps-wa-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
                <span>Order on WhatsApp</span>
              </a>
              <Link className="ps-details" href={`/products/${product.slug}`}>
                <span>Know more</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
