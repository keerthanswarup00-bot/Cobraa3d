// src/app/(frontend)/@modal/(.)products/[slug]/page.tsx
// Intercepts soft navigations to /products/[slug]. Hard loads still hit the real page (SEO, WhatsApp previews).
import { notFound } from "next/navigation";
import { ProductSheet, type SheetProduct } from "@/components/product/ProductSheet";
import { getPayload } from "payload"
import config from "@payload-config"
async function getProductBySlug(slug: string) {
  const payload = await getPayload({ config })
  const res = await payload.find({ collection: "products", where: { and: [{ slug: { equals: slug } }, { status: { equals: "published" } }, { _status: { equals: "published" } }] }, depth: 1, limit: 1 })
  return res.docs[0] as any
}
import { getSiteSettings } from "@/utilities/getSiteSettings";
import { buildProductMessage, buildWhatsAppUrl } from "@/lib/shared";

export default async function ProductSheetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) notFound();
  const settings = await getSiteSettings();

  const product: SheetProduct = {
    name: p.title,
    shortDescription: p.shortDescription,
    price: p.priceMode === "show" && p.price != null ? p.price : null,
    images: (p.images ?? []).map((i: any) => ({ url: i.url, alt: i.alt })),
    colors: p.colors?.map((c: any) => ({ name: c.name, hex: c.hex })),
  };
  const url = (color?: string) =>
    buildWhatsAppUrl({ number: settings.whatsappNumber, message: buildProductMessage({ ...p, title: p.title, slug: p.slug, images: p.images }, { colour: color }, settings) });
  const baseUrl = url()
  const byColor = Object.fromEntries((product.colors ?? []).map((c) => [c.name, url(c.name)]).filter(([, v]) => v != null)) as Record<string, string>
  if (!baseUrl) notFound()
  const hrefs = {
    base: baseUrl,
    byColor,
  }
  return <ProductSheet product={product} hrefs={hrefs} />;
}
