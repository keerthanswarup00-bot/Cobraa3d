'use client'

import { useEffect, useMemo, useState } from 'react'
import { customEnquirySchema } from '@/lib/enquiry-schema'
import { buildWhatsAppUrl } from '@/lib/shared'

type FormValues = { name: string; phone: string; message: string; quantity: string; occasion: string; colour: string; budget: string }
const initial: FormValues = { name: '', phone: '', message: '', quantity: '', occasion: '', colour: '', budget: '' }

export function CustomEnquiryForm({ whatsappNumber, source, note, messageTemplate }: { whatsappNumber?: string | null; source: string; note?: string; messageTemplate?: string | null }) {
  const [values, setValues] = useState(initial)
  const [files, setFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<'idle' | 'sending' | 'saved' | 'failed'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const allowedSource = ['qr', 'nfc', 'wa', 'ig'].includes(source) ? source : 'other'
  const details = useMemo(() => [
    values.message && `What to make: ${values.message}`,
    values.quantity && `Quantity: ${values.quantity}`, values.occasion && `Occasion: ${values.occasion}`,
    values.colour && `Colour: ${values.colour}`, values.budget && `Budget: ${values.budget}`,
  ].filter(Boolean).join('\n'), [values])
  const message = (messageTemplate || 'Hi, I have an idea for a custom 3D print. {{details}}').replaceAll('{{details}}', details)
  const whatsAppURL = buildWhatsAppUrl({ message, number: whatsappNumber })
  const update = (field: keyof FormValues, value: string) => setValues((v) => ({ ...v, [field]: value }))

  useEffect(() => {
    const applyNameplate = (detail: { text: string; font: string; colour: string }) => setValues((current) => ({ ...current, message: `Nameplate: ${detail.text}\nFont: ${detail.font}\nColour: ${detail.colour}` }))
    try {
      const saved = sessionStorage.getItem('cobraa-nameplate-request')
      if (saved) { applyNameplate(JSON.parse(saved) as { text: string; font: string; colour: string }); sessionStorage.removeItem('cobraa-nameplate-request') }
    } catch { sessionStorage.removeItem('cobraa-nameplate-request') }
    const onNameplate = (event: Event) => { applyNameplate((event as CustomEvent<{ text: string; font: string; colour: string }>).detail); sessionStorage.removeItem('cobraa-nameplate-request') }
    window.addEventListener('cobraa:nameplate', onNameplate)
    return () => window.removeEventListener('cobraa:nameplate', onNameplate)
  }, [])

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('idle'); setErrorMessage('')
    const parsed = customEnquirySchema.safeParse({ ...values, quantity: values.quantity, source: allowedSource })
    const nextErrors: Record<string, string> = {}
    if (!parsed.success) for (const [key, messages] of Object.entries(parsed.error.flatten().fieldErrors)) if (messages?.[0]) nextErrors[key] = messages[0]
    if (files.length > 2) nextErrors.files = 'Attach no more than two files.'
    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase()
      if (!(file.type.startsWith('image/') || ext === 'stl' || ext === '3mf')) nextErrors.files = 'Attach an image, STL or 3MF file.'
      if (file.size > 10 * 1024 * 1024) nextErrors.files = 'Each file must be 10 MB or smaller.'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setStatus('sending')
    const body = new FormData()
    Object.entries(values).forEach(([key, value]) => body.set(key, value))
    body.set('source', allowedSource)
    body.set('website', '')
    files.forEach((file) => body.append('files', file))
    try {
      const response = await fetch('/api/enquiries', { method: 'POST', body })
      const result = await response.json() as { confirmed?: boolean; error?: string }
      if (!response.ok || !result.confirmed) throw new Error(result.error || 'The enquiry was not confirmed.')
      setStatus('saved')
    } catch (error) {
      setStatus('failed')
      setErrorMessage(error instanceof Error ? error.message : 'We could not save this enquiry.')
    }
  }

  return <div className="custom-form-wrap" id="custom-enquiry-form">
    <form className="custom-form" onSubmit={submit} noValidate>
      <input className="form-honeypot" tabIndex={-1} autoComplete="off" name="website" aria-hidden="true" />
      <div className="form-grid">
        <label>Name <span aria-hidden="true">*</span><input required autoComplete="name" value={values.name} onChange={(e) => update('name', e.target.value)} aria-invalid={!!errors.name} />{errors.name && <small>{errors.name}</small>}</label>
        <label>WhatsApp number (optional)<input autoComplete="tel" inputMode="tel" value={values.phone} onChange={(e) => update('phone', e.target.value)} aria-invalid={!!errors.phone} />{errors.phone && <small>{errors.phone}</small>}</label>
        <label className="form-wide">What would you like us to make? <span aria-hidden="true">*</span><textarea required rows={4} value={values.message} onChange={(e) => update('message', e.target.value)} aria-invalid={!!errors.message} placeholder="Tell us your wild idea" />{errors.message && <small>{errors.message}</small>}</label>
        <label>Quantity<input type="number" min="1" max="9999" step="1" value={values.quantity} onChange={(e) => update('quantity', e.target.value)} aria-invalid={!!errors.quantity} />{errors.quantity && <small>{errors.quantity}</small>}</label>
        <label>Occasion (optional)<input value={values.occasion} onChange={(e) => update('occasion', e.target.value)} /></label>
        <label>Colour (optional)<input value={values.colour} onChange={(e) => update('colour', e.target.value)} /></label>
        <label>Budget (optional)<input value={values.budget} onChange={(e) => update('budget', e.target.value)} /></label>
        <label className="form-wide">Reference image or STL / 3MF (optional)<input type="file" accept="image/*,.stl,.3mf" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} /><small>Up to 2 files, 10 MB each.</small>{errors.files && <small>{errors.files}</small>}</label>
      </div>
      <p className="form-note">{note || 'We’ll review the idea and confirm feasibility, material and cost with you.'}</p>
      <button className="form-submit" disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : 'Send enquiry'}</button>
      {status === 'saved' && <div className="form-status success" role="status"><span className="drawn-check" aria-hidden="true">✓</span><span>Your enquiry was saved. We’ll take a look and follow up.</span>{whatsAppURL && <a href={whatsAppURL} target="_blank" rel="noopener noreferrer">Send this on WhatsApp too</a>}</div>}
      {status === 'failed' && <div className="form-status failure" role="alert"><span>{errorMessage} You can contact us directly instead.</span>{whatsAppURL && <a href={whatsAppURL} target="_blank" rel="noopener noreferrer">Chat on WhatsApp instead</a>}</div>}
    </form>
    {whatsAppURL && <a className="direct-whatsapp" href={whatsAppURL} target="_blank" rel="noopener noreferrer">Chat on WhatsApp instead</a>}
  </div>
}
