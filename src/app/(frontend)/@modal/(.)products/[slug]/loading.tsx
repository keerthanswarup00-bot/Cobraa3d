"use client";

import { useRouter } from "next/navigation";

export default function ProductSheetLoading() {
  const router = useRouter();

  return (
    <>
      <button type="button" className="ps-loading-backdrop" aria-label="Close product preview" onClick={() => router.back()} />
      <section className="ps-sheet ps-loading-sheet" role="dialog" aria-modal="true" aria-label="Loading product preview" aria-busy="true">
        <div className="ps-grab">
          <span className="ps-handle" />
          <button type="button" className="ps-close" onClick={() => router.back()} aria-label="Close">×</button>
          <span className="ps-share ps-loading-share" aria-hidden="true" />
        </div>
        <div className="ps-body">
          <div className="ps-loading-image" />
          <div className="ps-loading-title" />
          <div className="ps-loading-price" />
          <div className="ps-loading-description" />
        </div>
        <div className="ps-cta">
          <div className="ps-cta-actions">
            <span className="ps-loading-wa" />
            <span className="ps-loading-details" />
          </div>
        </div>
      </section>
    </>
  );
}
