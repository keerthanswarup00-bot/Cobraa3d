// Server components for the three-block home. Copy below is placeholder: pull from Site Settings.
import type { ReactNode } from "react";
import Link from "next/link";
import { HeroNozzle } from "./HeroNozzle";
import { AccentPicker } from "./accent";
import "./home-c3.css";

type Action = { label: string; href: string; primary?: boolean };

export function Hero({ title, subtitle, actions }: { title: string; subtitle: string; actions: Action[] }) {
  return (
    <section className="c3-hero">
      <HeroNozzle />
      <div className="c3-hero__inner">
        <p className="c3-eyebrow">3D printing studio · Hoskote, Bengaluru</p>
        <h1 className="c3-hero__title">{title}</h1>
        <p className="c3-hero__sub">{subtitle}</p>
        <div id="hero-actions" className="c3-actions">
          {actions.map((a) => (
            <a key={a.href} className={a.primary ? "c3-btn" : "c3-btn c3-btn--ghost"} href={a.href}
               {...(a.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
              {a.label}
            </a>
          ))}
        </div>
        <AccentPicker />
      </div>
    </section>
  );
}

export function ProductsBlock({ children }: { children: ReactNode }) {
  return (
    <section id="products" className="c3-products">
      <div className="c3-products__head">
        <h2>Made here</h2>
        <Link href="/products">All products</Link>
      </div>
      {children}
    </section>
  );
}

export function FooterCta({ customHref, address }: { customHref: string; address?: string }) {
  return (
    <footer className="c3-footer">
      <h2>Got something to print?</h2>
      <p>Send a photo, a sketch or a file. We will tell you what it takes.</p>
      <a className="c3-btn" href={customHref} target="_blank" rel="noopener noreferrer">Start a custom order on WhatsApp</a>
      {address && <p className="c3-footer__small">{address}</p>}
      <div className="c3-bar-spacer" />
    </footer>
  );
}
