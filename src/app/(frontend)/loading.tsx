export default function Loading() {
  return (
    <main style={{ padding: '2rem', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ height: 24, width: 160, background: '#eee', borderRadius: 4, marginBottom: 16 }} />
      <div style={{ height: 40, width: 240, background: '#eee', borderRadius: 4, marginBottom: 24 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ border: '1px solid #eee', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ aspectRatio: '1/1', background: '#f5f5f5' }} />
            <div style={{ padding: 12 }}>
              <div style={{ height: 16, width: '70%', background: '#eee', borderRadius: 4 }} />
              <div style={{ height: 14, width: '40%', background: '#eee', borderRadius: 4, marginTop: 8 }} />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
