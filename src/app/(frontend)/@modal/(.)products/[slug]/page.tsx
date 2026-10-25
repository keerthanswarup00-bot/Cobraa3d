// src/app/(frontend)/@modal/(.)products/[slug]/page.tsx
// Intercepts soft navigations to /products/[slug]. Hard loads still hit the real page (SEO, WhatsApp previews).
import { notFound } from "next/navigation";
import { ProductSheet, type SheetProduct } from "@/components/product/ProductSheet";
import { getPayload } from "payload"
import config from "@payload-config"
import { getSiteSettings } from "@/utilities/getSiteSettings";
import { buildProductMessage, buildWhatsAppUrl } from "@/lib/shared";
import { getDisplayPrice } from "@/lib/pricing";
import { getServerSideURL } from "@/utilities/getURL";
import type { Product } from "@/payload-types";

async function getProductBySlug(slug: string) {
  const payload = await getPayload({ config })
  const res = await payload.find({ collection: "products", where: { and: [{ slug: { equals: slug } }, { status: { equals: "published" } }, { _status: { equals: "published" } }] }, depth: 1, limit: 1 })
  return res.docs[0] as Product | undefined
}

export default async function ProductSheetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) notFound();
  const settings = await getSiteSettings();
  const displayPrice = getDisplayPrice({ id: p.id, price: p.price, salePrice: p.salePrice, priceMode: p.priceMode, currency: p.currency });
  const photos = (p.images ?? [])
    .flatMap((image) => {
      const media = image.image;
      return typeof media === "object" && media?.url ? [{ url: media.url, alt: image.alt || p.title }] : [];
    });
  const productSlug = p.slug || slug;
  const product: SheetProduct = {
    slug: productSlug,
    name: p.title,
    shortDescription: p.shortDescription,
    price: !p.isDemo && p.priceMode === "show" && displayPrice.regularPrice != null ? displayPrice.priceLabel : undefined,
    images: photos,
  };
  const message = buildProductMessage({
    ...p,
    title: p.title,
    slug: productSlug,
    updatedAt: p.updatedAt,
    images: photos.map((image) => ({ alt: image.alt, image: { url: image.url } })),
    price: displayPrice.showOffer ? displayPrice.offerPrice ?? p.price : p.price,
    priceMode: p.priceMode,
  }, { baseURL: getServerSideURL() }, {
    whatsappNumber: settings.whatsappNumber,
    productMessageTemplate: settings.messageTemplates?.product,
  });
  const baseUrl = buildWhatsAppUrl({ number: settings.whatsappNumber, message });
  if (!baseUrl) notFound();
  return <ProductSheet product={product} href={baseUrl} />;
}
