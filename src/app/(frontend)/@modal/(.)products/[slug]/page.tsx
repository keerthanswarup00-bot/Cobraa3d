// src/app/(frontend)/@modal/(.)products/[slug]/page.tsx
// Intercepts soft navigations to /products/[slug]. Hard loads still hit the real page (SEO, WhatsApp previews).
import { notFound } from "next/navigation";
import { ProductSheet, type SheetProduct } from "@/components/product/ProductSheet";
import { getPayload } from "payload"
import config from "@payload-config"
import { getSiteSettings } from "@/utilities/getSiteSettings";
import { buildProductMessage, buildWhatsAppUrl } from "@/lib/shared";
import { env } from "@/lib/env";

async function getProductBySlug(slug: string) {
  const payload = await getPayload({ config })
  const res = await payload.find({ collection: "products", where: { and: [{ slug: { equals: slug } }, { status: { equals: "published" } }, { _status: { equals: "published" } }] }, depth: 1, limit: 1 })
  return res.docs[0] as any
}

export default async function ProductSheetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) notFound();
  const settings = await getSiteSettings();
  const product: SheetProduct = {
    name: p.title,
    shortDescription: p.shortDescription,
    shortIncludes: p.shortIncludes || undefined,
    dimensions: [p.heightMm ? `${p.heightMm} mm H` : '', p.widthMm ? `${p.widthMm} mm W` : '', p.depthMm ? `${p.depthMm} mm D` : ''].filter(Boolean).join(' × ') || p.dimensions || undefined,
    price: p.priceMode === "show" && p.price != null ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: p.currency || 'INR', maximumFractionDigits: 0 }).format(p.price) : undefined,
    productId: p.id,
    slug: p.slug,
    images: (p.images ?? [])
      .map((i: any) => ({ url: typeof i.image === "object" && i.image ? i.image.url : i.url, alt: i.alt }))
      .filter((i: any) => i.url),
    colors: p.colors?.map((c: any) => ({ name: c.name, hex: c.hex })),
  };
  const url = (color?: string) =>
    buildWhatsAppUrl({ number: settings.whatsappNumber, message: buildProductMessage({ ...p, title: p.title, slug: p.slug, images: p.images }, { colour: color }, settings) });
  const baseUrl = url();
  const byColor = Object.fromEntries((product.colors ?? []).map((c) => [c.name, url(c.name)]).filter(([, v]) => v != null)) as Record<string, string>;
  if (!baseUrl) notFound();
  return <ProductSheet product={product} hrefs={{ base: baseUrl, byColor }} pushPublicKey={env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || env.VAPID_PUBLIC_KEY} />;
}
