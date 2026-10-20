"use client";
// Mobile-only bar. Slides in once the hero's own action buttons (#hero-actions) scroll out of view.
import { useEffect, useState } from "react";

export function StickyWhatsAppBar({ href, label = "Chat on WhatsApp" }: { href: string; label?: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = document.getElementById("hero-actions");
    if (!el) { setShow(true); return; }
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div className="c3-bar" data-show={show} aria-hidden={!show}>
      <a className="c3-btn c3-btn--block" href={href} target="_blank" rel="noopener noreferrer" tabIndex={show ? 0 : -1}>
        {label}
      </a>
    </div>
  );
}
