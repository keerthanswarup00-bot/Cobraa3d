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

export function ProductGrid({ products, pagination }: { products: GridProduct[]; pagination?: { currentPage: number; totalPages: number } }) {
  if (!products.length) return <><p className="pg-empty">Products are coming soon.</p>{pagination?.currentPage && pagination.currentPage > 1 && <nav className="pg-pagination" aria-label="Product pages"><Link href={`/products?page=${pagination.currentPage - 1}`}>Previous page</Link></nav>}</>;
  return (
    <>
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
    {pagination && pagination.totalPages > 1 && <nav className="pg-pagination" aria-label="Product pages">
      {pagination.currentPage > 1 && <Link href={`/products?page=${pagination.currentPage - 1}`}>Previous</Link>}
      <span>Page {pagination.currentPage} of {pagination.totalPages}</span>
      {pagination.currentPage < pagination.totalPages && <Link href={`/products?page=${pagination.currentPage + 1}`}>Next</Link>}
    </nav>}
    </>
  );
}
