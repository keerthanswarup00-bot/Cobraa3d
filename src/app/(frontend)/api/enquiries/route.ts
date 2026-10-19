import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { Buffer } from 'node:buffer'
import config from '@payload-config'
import { customEnquirySchema } from '@/lib/enquiry-schema'

const WINDOW_MS = 60_000
const MAX_REQUESTS = 4
const requests = new Map<string, number[]>()
const MAX_FILE_SIZE = 10 * 1024 * 1024

function rateLimited(ip: string, now = Date.now()) {
  const recent = (requests.get(ip) || []).filter((time) => now - time < WINDOW_MS)
  if (recent.length >= MAX_REQUESTS) return true
  recent.push(now)
  requests.set(ip, recent)
  return false
}

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (rateLimited(ip)) return NextResponse.json({ error: 'Please wait a moment before sending another enquiry.' }, { status: 429 })
  try {
    const form = await request.formData()
    if (String(form.get('website') || '').trim()) return NextResponse.json({ error: 'This enquiry could not be accepted.' }, { status: 400 })
    const sourceValue = String(form.get('source') || 'other')
    const parsed = customEnquirySchema.safeParse({
      name: form.get('name'), phone: form.get('phone') || '', message: form.get('message'), quantity: form.get('quantity') || '',
      occasion: form.get('occasion') || '', colour: form.get('colour') || '', budget: form.get('budget') || '', source: sourceValue,
    })
    if (!parsed.success) return NextResponse.json({ error: 'Please check the highlighted fields.', fields: parsed.error.flatten().fieldErrors }, { status: 400 })
    const files = form.getAll('files').filter((file): file is File => file instanceof File && file.size > 0)
    if (files.length > 2) return NextResponse.json({ error: 'Please attach no more than two files.' }, { status: 400 })
    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase()
      const accepted = file.type.startsWith('image/') || ext === 'stl' || ext === '3mf'
      if (!accepted) return NextResponse.json({ error: 'Attach an image, STL or 3MF file.' }, { status: 400 })
      if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'Each attachment must be 10 MB or smaller.' }, { status: 400 })
    }
    const payload = await getPayload({ config })
    const uploaded: number[] = []
    for (const file of files) {
      const media = await payload.create({ collection: 'media', overrideAccess: true, data: { alt: file.name }, file: {
        data: Buffer.from(await file.arrayBuffer()), name: file.name.replace(/[\\/]/g, '_'), mimetype: file.type || (file.name.toLowerCase().endsWith('.stl') ? 'model/stl' : 'application/vnd.ms-3mfdocument'), size: file.size,
      } })
      uploaded.push(media.id)
    }
    const input = parsed.data
    const created = await payload.create({ collection: 'enquiries', overrideAccess: true, data: {
      type: 'custom', name: input.name, phone: input.phone || undefined, message: input.message,
      quantity: input.quantity === '' ? undefined : input.quantity, occasion: input.occasion || undefined,
      colour: input.colour || undefined, budget: input.budget || undefined, files: uploaded,
      source: input.source, status: 'new',
    } })
    return NextResponse.json({ id: created.id, confirmed: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'We could not save this enquiry. Please use the WhatsApp option below.' }, { status: 503 })
  }
}
