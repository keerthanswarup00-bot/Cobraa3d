import { describe, expect, it } from 'vitest'
import { customEnquirySchema } from '@/lib/enquiry-schema'

describe('customEnquirySchema', () => {
  it('accepts a valid custom request without optional fields', () => {
    expect(customEnquirySchema.safeParse({ name: 'Riya', phone: '', message: 'A small desk nameplate', quantity: '', source: 'qr' }).success).toBe(true)
  })
  it('requires a name and a useful description', () => {
    const result = customEnquirySchema.safeParse({ name: '', message: 'hi', source: 'other' })
    expect(result.success).toBe(false)
  })
  it('rejects invalid source and invalid numbers', () => {
    expect(customEnquirySchema.safeParse({ name: 'Riya', message: 'A useful request', quantity: '0', source: 'facebook' }).success).toBe(false)
  })
})
