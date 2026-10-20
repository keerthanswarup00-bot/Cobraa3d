// Server component. Minimal listing: image, title, price. Tapping a card opens the bottom sheet
// (soft navigation to /products/[slug] is intercepted by the @modal route).
import Link from "next/link";
import "./product-grid.css";

export type GridProduct = {
  slug: string;
  name: string;
  priceLabel?: string;
  image?: { url: string; alt?: string };
};

export function ProductGrid({ products }: { products: GridProduct[] }) {
  if (!products.length) return <p className="pg-empty">Products are coming soon.</p>;
  return (
    <ul className="pg-grid">
      {products.map((p, i) => (
        <li key={p.slug}>
          <Link href={`/products/${p.slug}`} scroll={false} className="pg-card">
            <span className="pg-media">
              {p.image && (
                // swap for next/image once the media domain is configured
                <img src={p.image.url} alt={p.image.alt || p.name} loading={i < 4 ? "eager" : "lazy"} />
              )}
            </span>
            <span className="pg-name">{p.name}</span>
            <span className="pg-price">{p.priceLabel ?? "Ask for price"}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
