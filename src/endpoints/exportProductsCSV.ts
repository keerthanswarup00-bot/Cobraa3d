import type { PayloadHandler } from 'payload'
import { editorAccess } from '../access/roles'

function csvCell(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)

  let text = typeof value === 'string' ? value : JSON.stringify(value)
  // Prevent spreadsheet apps from evaluating text entered in product fields.
  if (/^(?:\s*[=+\-@＝＋－＠]|[\t\r\n])/.test(text)) text = "'" + text
  return '"' + text.replaceAll('"', '""') + '"'
}

export const exportProductsCSV: PayloadHandler = async (req) => {
  const headers = { 'Cache-Control': 'private, no-store' }
  if (!req.user) return new Response(null, { status: 401, headers })
  if (!(await editorAccess({ req }))) return new Response(null, { status: 403, headers })

  const fields = req.payload.collections.products.config.flattenedFields
  const fieldNames = fields.filter((field) => !field.hidden).map((field) => field.name)
  const columns = [...new Set(['id', ...fieldNames, 'createdAt', 'updatedAt', '_status'])]
  const rows = [columns.map(csvCell).join(',')]
  let page = 1

  while (true) {
    const result = await req.payload.find({
      collection: 'products',
      depth: 1,
      draft: true,
      limit: 100,
      overrideAccess: false,
      page,
      populate: {
        categories: { name: true, slug: true },
        products: { title: true, slug: true },
      },
      req,
      sort: 'id',
    })

    for (const doc of result.docs) {
      const product: Record<string, unknown> = { ...doc }
      rows.push(columns.map((column) => csvCell(product[column])).join(','))
    }

    if (!result.nextPage) break
    page = result.nextPage
  }

  const date = new Date().toISOString().slice(0, 10)
  return new Response(rows.join('\r\n') + '\r\n', {
    headers: {
      ...headers,
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="products-${date}.csv"`,
    },
  })
}
