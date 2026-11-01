export function shouldOptimizeImage(src: string, mediaBaseURL = process.env.NEXT_PUBLIC_MEDIA_BASE_URL || ''): boolean {
  if (src.startsWith('/')) return true
  if (!mediaBaseURL) return false

  try {
    const imageURL = new URL(src)
    const mediaURL = new URL(mediaBaseURL)
    const basePath = mediaURL.pathname.replace(/\/+$/, '')
    return imageURL.origin === mediaURL.origin && (!basePath || imageURL.pathname === basePath || imageURL.pathname.startsWith(`${basePath}/`))
  } catch {
    return false
  }
}
