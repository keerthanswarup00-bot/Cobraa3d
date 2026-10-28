import "./loading.css";

export default function Loading() {
  return (
    <div className="psm-backdrop" aria-hidden="true">
      <div className="psm-sheet" role="dialog" aria-modal="true">
        <div className="psm-grab"><span className="psm-handle" /></div>
        <div className="psm-actions">
          <div className="psm-btn" />
          <div className="psm-btn" />
        </div>
        <div className="psm-body">
          <div className="psm-gallery" />
          <div className="psm-line psm-title" />
          <div className="psm-line psm-price" />
          <div className="psm-block" />
        </div>
        <div className="psm-cta">
          <div className="psm-row">
            <div className="psm-wa" />
            <div className="psm-know" />
          </div>
        </div>
      </div>
    </div>
  );
}
