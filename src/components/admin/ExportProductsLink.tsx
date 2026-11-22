import type { BeforeListTableServerProps } from 'payload'

export function ExportProductsLink({ hasCreatePermission, payload }: BeforeListTableServerProps) {
  if (!hasCreatePermission) return null

  return (
    <p>
      <a href={`${payload.config.routes.api}/products/export-csv`} download>
        Export all products (CSV)
      </a>
    </p>
  )
}
