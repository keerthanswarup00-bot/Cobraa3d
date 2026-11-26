export const GUIDE_BUCKET = 'guides'
export const MAX_GUIDE_BYTES = 25 * 1024 * 1024

export type Guide = {
  id: string
  slug: string
  title: string
  file_path: string
  size_bytes: number | null
  created_at: string
}

export async function copyGuideLink(url: string) {
  await navigator.clipboard.writeText(url)
}
