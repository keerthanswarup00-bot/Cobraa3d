self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { body: event.data ? event.data.text() : '' }
  }
  const title = typeof payload.title === 'string' && payload.title ? payload.title : 'Cobraa 3D'
  const options = {
    body: typeof payload.body === 'string' ? payload.body : '',
    icon: typeof payload.icon === 'string' ? payload.icon : '/icons/icon-192.png',
    data: { url: typeof payload.data?.url === 'string' ? payload.data.url : '/' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const raw = event.notification.data?.url
  let target = new URL('/', self.location.origin)
  try {
    const candidate = new URL(typeof raw === 'string' ? raw : '/', self.location.origin)
    if (candidate.origin === self.location.origin) target = candidate
  } catch {
    target = new URL('/', self.location.origin)
  }
  target.searchParams.set('src', 'push')
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    for (const client of clients) {
      if (client.url.startsWith(self.location.origin) && 'focus' in client) {
        return client.navigate(target.href).then(() => client.focus())
      }
    }
    return self.clients.openWindow(target.href)
  }))
})
