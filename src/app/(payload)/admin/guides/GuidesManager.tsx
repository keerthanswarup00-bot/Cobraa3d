'use client'

import { createClient } from '@supabase/supabase-js'
import { useRef, useState, type FormEvent } from 'react'
import { copyGuideLink, GUIDE_BUCKET, MAX_GUIDE_BYTES, type Guide } from '@/lib/guides'
import { createUploadUrl, deleteGuide, saveGuide } from './actions'
import './guides.css'

type Props = {
  guides: Guide[]
  credentials: { url: string; key: string }
  siteURL: string
}

export default function GuidesManager({ guides, credentials, siteURL }: Props) {
  const [storage] = useState(() =>
    createClient(credentials.url, credentials.key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    }).storage.from(GUIDE_BUCKET),
  )
  const [replacement, setReplacement] = useState<Guide | null>(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [saved, setSaved] = useState('')
  const form = useRef<HTMLFormElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const pending = useRef<{
    file: File
    title: string
    id?: string
    input: Parameters<typeof saveGuide>[0]
  } | null>(null)
  const urlFor = (slug: string) => new URL(`/guides/${slug}`, siteURL).href

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setError('')
    setStatus('')
    const title = String(new FormData(event.currentTarget).get('title')).trim()
    const file = fileInput.current?.files?.[0]
    if (!title) {
      setError('Enter a guide title.')
      return
    }
    if (!file?.size || file.size > MAX_GUIDE_BYTES) {
      setError('Choose a PDF file of up to 25 MB.')
      return
    }
    setBusy('Uploading…')
    try {
      const signature = await file.slice(0, 5).text()
      if (signature !== '%PDF-' || (file.type && file.type !== 'application/pdf')) {
        setError('Choose a valid PDF file.')
        return
      }
      const previous = pending.current
      if (
        !previous ||
        previous.file !== file ||
        previous.title !== title ||
        previous.id !== replacement?.id
      ) {
        const signed = await createUploadUrl(title, replacement?.id)
        if (!signed.data?.upload) {
          setError(signed.data?.issue || signed.error || 'Could not start the upload.')
          return
        }
        const { path } = signed.data.upload
        const { error: uploadError } = await storage.uploadToSignedUrl(
          path,
          signed.data.token,
          file.slice(0, file.size, 'application/pdf'),
          { cacheControl: '0' },
        )
        if (uploadError) {
          setError('Could not upload the PDF to storage. Check your connection and try again.')
          return
        }
        pending.current = {
          file,
          title,
          id: replacement?.id,
          input: { ...signed.data.upload, title },
        }
      }
      setBusy('Saving…')
      const result = await saveGuide(pending.current!.input)
      if (!result.data?.slug) {
        if (result.data?.issue?.includes('changed while')) pending.current = null
        setError(result.data?.issue || result.error || 'Could not save the guide. Try again.')
        return
      }
      setSaved(urlFor(result.data.slug))
      setStatus(result.data.warning || (replacement ? 'PDF replaced.' : 'Guide published.'))
      pending.current = null
      form.current?.reset()
      setReplacement(null)
    } catch {
      setError('Could not finish the upload. Try again.')
    } finally {
      setBusy('')
    }
  }

  async function copy(url: string) {
    try {
      await copyGuideLink(url)
      setStatus('Link copied.')
    } catch {
      setSaved(url)
      setStatus('Select and copy the link below.')
    }
  }

  async function remove(guide: Guide) {
    if (busy || !window.confirm(`Delete “${guide.title}” and disable its share link?`)) return
    setBusy('Deleting…')
    setError('')
    setStatus('')
    try {
      const result = await deleteGuide(guide)
      const issue = result.error || result.data?.issue
      if (issue) {
        setError(issue)
        return
      }
      setStatus(result.data?.warning || 'Guide deleted.')
      if (saved === urlFor(guide.slug)) setSaved('')
      if (replacement?.id === guide.id) setReplacement(null)
    } catch {
      setError('Could not delete the guide. Try again.')
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="guides-manager">
      <form ref={form} onSubmit={upload} key={replacement?.id ?? 'new'}>
        <fieldset disabled={Boolean(busy)}>
          <legend>{replacement ? 'Replace PDF' : 'Upload a guide'}</legend>
          <label>
            Guide title
            <input name="title" required maxLength={160} defaultValue={replacement?.title} />
          </label>
          <label>
            PDF file
            <input ref={fileInput} type="file" accept="application/pdf,.pdf" required />
          </label>
          <div className="guides-manager__actions">
            <button type="submit">{busy || (replacement ? 'Replace PDF' : 'Upload PDF')}</button>
            {replacement && (
              <button type="button" onClick={() => setReplacement(null)}>
                Cancel
              </button>
            )}
          </div>
        </fieldset>
      </form>
      {error && <p role="alert">{error}</p>}
      <p role="status">{status || busy}</p>
      {saved && (
        <section aria-label="Guide share link">
          <input
            aria-label="Guide share link"
            readOnly
            value={saved}
            onFocus={(event) => event.target.select()}
          />
          <div className="guides-manager__actions">
            <button type="button" onClick={() => copy(saved)}>
              Copy link
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(saved)}`}
              target="_blank"
              rel="noreferrer"
            >
              Share on WhatsApp
            </a>
          </div>
        </section>
      )}
      <h2>Guides</h2>
      {guides.length === 0 && <p>No guides yet.</p>}
      <ul>
        {guides.map((guide) => (
          <li key={guide.id}>
            <div>
              <strong>{guide.title}</strong>
              <div className="guides-manager__details">
                <time dateTime={guide.created_at}>
                  {new Intl.DateTimeFormat('en-IN', {
                    dateStyle: 'medium',
                    timeZone: 'Asia/Kolkata',
                  }).format(new Date(guide.created_at))}
                </time>
                {guide.size_bytes !== null &&
                  ` · ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(guide.size_bytes / 1024)} KB`}
              </div>
            </div>
            <div className="guides-manager__actions">
              <button type="button" onClick={() => copy(urlFor(guide.slug))}>
                Copy link
              </button>
              <a href={urlFor(guide.slug)} target="_blank" rel="noreferrer">
                Open
              </a>
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => {
                  setReplacement(guide)
                  requestAnimationFrame(() => fileInput.current?.focus())
                }}
              >
                Replace PDF
              </button>
              <button type="button" disabled={Boolean(busy)} onClick={() => remove(guide)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
