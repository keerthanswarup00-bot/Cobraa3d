export default function GuideLoading({
  progress,
  downloadURL,
  overlay,
}: {
  progress?: number
  downloadURL?: string
  overlay?: boolean
}) {
  return (
    <div className={overlay ? 'guide-loading guide-loading--overlay' : 'guide-loading'}>
      <div className="guide-loading__card">
        <p role="status">Opening guide…</p>
        <progress
          className="guide-progress"
          aria-label="Opening guide"
          value={progress !== undefined && progress < 1 ? progress : undefined}
          max={1}
        />
        {downloadURL && <a href={downloadURL}>Download PDF</a>}
      </div>
    </div>
  )
}
