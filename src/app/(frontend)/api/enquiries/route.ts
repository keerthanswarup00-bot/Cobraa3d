import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import { Buffer } from 'node:buffer'
import config from '@payload-config'
import { customEnquirySchema } from '@/lib/enquiry-schema'
import { env } from '@/lib/env'
import { consumeRateLimit, getClientIP } from '@/lib/rateLimit'

const WINDOW_MS = 60_000
const MAX_REQUESTS = 4
const MAX_FILE_SIZE = 2 * 1024 * 1024
const MAX_TOTAL_FILE_SIZE = 4 * 1024 * 1024

export async function POST(request: Request) {
  try {
    const ip = getClientIP(request)
    if (!ip) return NextResponse.json({ error: 'Please use WhatsApp to send your enquiry.' }, { status: 503 })
    const payload = await getPayload({ config })
    if (await consumeRateLimit(payload, { namespace: 'enquiry', ip, limit: MAX_REQUESTS, windowMs: WINDOW_MS })) {
      return NextResponse.json({ error: 'Please wait a moment before sending another enquiry.' }, { status: 429 })
    }

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
    if (files.reduce((total, file) => total + file.size, 0) > MAX_TOTAL_FILE_SIZE) {
      return NextResponse.json({ error: 'Attachments must total 4 MB or less.' }, { status: 400 })
    }
    if (process.env.NODE_ENV === 'production' && files.length && !(env.S3_BUCKET && env.S3_PRIVATE_BUCKET && env.S3_ENDPOINT && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY)) {
      return NextResponse.json({ error: 'File attachments are temporarily unavailable. Please use WhatsApp to share your reference.' }, { status: 503 })
    }
    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase()
      const accepted = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type) || ext === 'stl' || ext === '3mf'
      if (!accepted) return NextResponse.json({ error: 'Attach an image, STL or 3MF file.' }, { status: 400 })
      if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'Each attachment must be 2 MB or smaller.' }, { status: 400 })
    }
    const uploaded: number[] = []
    for (const file of files) {
      const media = await payload.create({ collection: 'enquiry-files', overrideAccess: true, data: { alt: file.name }, file: {
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
