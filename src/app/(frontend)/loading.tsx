export default function Loading() {
  return (
    <main className="frontend-route-loading" aria-label="Loading page">
      <div className="frontend-route-loading-head" aria-hidden="true">
        <div className="frontend-route-loading-line" />
        <div className="frontend-route-loading-line" />
      </div>
      <div className="frontend-route-loading-grid" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="frontend-route-loading-card" key={index}>
            <div className="frontend-route-loading-image" />
            <div className="frontend-route-loading-line" />
            <div className="frontend-route-loading-line" />
          </div>
        ))}
      </div>
    </main>
  )
}
