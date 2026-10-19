'use client'

import { useFormFields } from '@payloadcms/ui'
import { buildCustomerReplyUrl } from '@/lib/shared'

export function EnquiryReplyLink() {
  const phone = useFormFields(([fields]) => fields.phone?.value)
  const name = useFormFields(([fields]) => fields.name?.value)
  const url = buildCustomerReplyUrl({ phone: typeof phone === 'string' ? phone : '', name: typeof name === 'string' ? name : '' })
  return <div style={{ marginBlock: 16 }}>
    {url ? <a href={url} target="_blank" rel="noopener noreferrer" className="btn">Reply to customer on WhatsApp</a> : <p>Add a customer phone number to enable a WhatsApp reply link.</p>}
    <p>Review the prefilled message before sending. Enquiry status can be changed in the form below.</p>
  </div>
}
