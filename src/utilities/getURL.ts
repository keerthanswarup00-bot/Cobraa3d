import canUseDOM from './canUseDOM'

const fallbackSiteURL = () => {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '')
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  if (process.env.NEXT_PUBLIC_SERVER_URL) return process.env.NEXT_PUBLIC_SERVER_URL.replace(/\/$/, '')
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`.replace(/\/$/, '')
  if (process.env.VERCEL_URL) return (`https://${process.env.VERCEL_URL}`).replace(/\/$/, '')
  return 'http://localhost:3000'
}

export const getSiteURL = () => {
  try {
    const value = fallbackSiteURL().trim()
    return value ? new URL(value).origin : 'http://localhost:3000'
  } catch {
    return 'http://localhost:3000'
  }
}

export const getServerSideURL = () => getSiteURL()

export const getClientSideURL = () => {
  if (canUseDOM) {
    const protocol = window.location.protocol
    const domain = window.location.hostname
    const port = window.location.port

    return `${protocol}//${domain}${port ? `:${port}` : ''}`
  }

  return getSiteURL()
}
