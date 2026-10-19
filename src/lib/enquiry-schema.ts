import { z } from 'zod'

export const customEnquirySchema = z.object({
  name: z.string().trim().min(1, 'Add your name.').max(120, 'Keep your name under 120 characters.'),
  phone: z.string().trim().max(32, 'Check the WhatsApp number.').refine((value) => !value || /^[+\d\s().-]{8,32}$/.test(value), 'Enter a valid WhatsApp number or leave it blank.').optional().or(z.literal('')),
  message: z.string().trim().min(5, 'Tell us a little about what you would like made.').max(4000, 'Keep the description under 4,000 characters.'),
  quantity: z.union([z.literal(''), z.coerce.number().int('Use a whole number.').min(1, 'Quantity must be at least 1.').max(9999, 'Check the quantity.')]).optional(),
  occasion: z.string().trim().max(120).optional(),
  colour: z.string().trim().max(120).optional(),
  budget: z.string().trim().max(120).optional(),
  source: z.enum(['qr', 'nfc', 'wa', 'ig', 'other']).default('other'),
}).strict()

export type CustomEnquiryInput = z.infer<typeof customEnquirySchema>
