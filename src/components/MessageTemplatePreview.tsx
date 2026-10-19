'use client'

import { useFormFields } from '@payloadcms/ui'

const sampleValues: Record<string, string> = {
  title: 'Sample product', price: 'Ask for price', url: 'https://example.com/products/sample-product', imageUrl: 'https://example.com/sample.jpg',
  details: 'Nameplate text: Asha\nFont: Sans\nColour: Black', product: 'Sample product', quantity: '10', date: 'your preferred date', personalisation: 'your details',
}

function fill(template: unknown): string {
  if (typeof template !== 'string' || !template.trim()) return 'Add a template to preview the message.'
  return template.replace(/{{\s*(\w+)\s*}}/g, (token, key: string) => sampleValues[key] ?? token)
}

export function MessageTemplatePreview() {
  const product = useFormFields(([fields]) => fields['messageTemplates.product']?.value)
  const custom = useFormFields(([fields]) => fields['messageTemplates.custom']?.value)
  const bulk = useFormFields(([fields]) => fields['messageTemplates.bulk']?.value)
  const festive = useFormFields(([fields]) => fields['messageTemplates.festive']?.value)
  const nameplate = useFormFields(([fields]) => fields['messageTemplates.nameplate']?.value)
  const samples = [['Product', product], ['Custom', custom], ['Bulk', bulk], ['Festive', festive], ['Nameplate', nameplate]] as const
  return <section style={{ marginBlock: 16 }}><h3>Message preview and placeholders</h3><p>Available tokens: <code>{'{{title}} {{price}} {{url}} {{imageUrl}} {{details}} {{product}} {{quantity}} {{date}} {{personalisation}}'}</code></p>
    {samples.map(([label, value]) => <details key={label}><summary>{label} message preview</summary><pre style={{ whiteSpace: 'pre-wrap' }}>{fill(value)}</pre></details>)}
  </section>
}
