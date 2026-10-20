"use client";
// Layer-line field that a "nozzle" pushes around. Pointer/touch-reactive, drifts on its own
// when idle (so phones see motion), pauses offscreen, static under prefers-reduced-motion.
import { useEffect, useRef } from "react";

export function HeroNozzle() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current!;
    const host = c.parentElement!;
    const ctx = c.getContext("2d")!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, raf = 0, visible = true, active = false;
    const p = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    let accent = "#ff5a1f", line = "rgba(255,255,255,.16)";

    const readColours = () => {
      const cs = getComputedStyle(c);
      accent = cs.getPropertyValue("--accent").trim() || accent;
      line = cs.color || line;
    };
    const resize = () => {
      const r = c.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      c.width = w * dpr; c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduce) draw(0);
    };

    function draw(now: number) {
      if (!active) {
        p.tx = 0.5 + 0.3 * Math.sin(now * 0.0004);
        p.ty = 0.5 + 0.25 * Math.sin(now * 0.0007);
      }
      p.x += (p.tx - p.x) * 0.08;
      p.y += (p.ty - p.y) * 0.08;
      const px = p.x * w, py = p.y * h;
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      for (let y0 = 6; y0 < h; y0 += 10) {
        const near = Math.abs(y0 - py) < 70;
        ctx.strokeStyle = near ? accent : line;
        ctx.globalAlpha = near ? 0.9 - Math.abs(y0 - py) / 90 : 1;
        ctx.beginPath();
        for (let x = 0; x <= w + 10; x += 10) {
          const dx = x - px, dy = y0 - py;
          const push = (dy / (Math.abs(dy) + 40)) * 26 *
            Math.exp(-(dx * dx) / (2 * 110 * 110)) * Math.exp(-(dy * dy) / (2 * 140 * 140));
          const y = y0 + push + 3 * Math.sin(x * 0.012 + y0 * 0.02 + now * 0.001);
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      // nozzle
      ctx.fillStyle = accent;
      ctx.shadowColor = accent; ctx.shadowBlur = 16;
      ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }

    const loop = (now: number) => {
      if (visible) draw(now);
      raf = requestAnimationFrame(loop);
    };
    const move = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      p.tx = (e.clientX - r.left) / r.width;
      p.ty = (e.clientY - r.top) / r.height;
      active = true;
    };
    const leave = () => { active = false; };

    readColours();
    resize();
    const ro = new ResizeObserver(resize); ro.observe(c);
    window.addEventListener("cobraa:accent", readColours);
    if (!reduce) {
      host.addEventListener("pointermove", move);
      host.addEventListener("pointerleave", leave);
      host.addEventListener("pointerup", leave);
      const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
      io.observe(host);
      raf = requestAnimationFrame(loop);
      return () => {
        cancelAnimationFrame(raf); io.disconnect(); ro.disconnect();
        host.removeEventListener("pointermove", move);
        host.removeEventListener("pointerleave", leave);
        host.removeEventListener("pointerup", leave);
        window.removeEventListener("cobraa:accent", readColours);
      };
    }
    return () => { ro.disconnect(); window.removeEventListener("cobraa:accent", readColours); };
  }, []);

  return <canvas ref={ref} className="c3-hero__canvas" aria-hidden="true" />;
}
