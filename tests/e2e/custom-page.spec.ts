import { test, expect } from '@playwright/test'

test.describe('Custom order landing page', () => {
  test('loads with one h1, a configured WhatsApp hero link and three option cards', async ({ page }) => {
    // The header WhatsApp button reads the same Site Settings number. Use it as
    // the source of truth so the test does not hardcode a phone number.
    await page.goto('/')
    const headerWhatsApp = page.locator('header .nav-whatsapp').first()
    await expect(headerWhatsApp).toBeVisible()
    const headerHref = await headerWhatsApp.getAttribute('href')
    expect(headerHref).toMatch(/^https:\/\/wa\.me\/\d{8,15}\?text=/)
    const digits = new URL(headerHref!).pathname.replace(/^\//, '')

    await page.goto('/custom')

    await expect(page.getByRole('heading', { level: 1, name: 'Custom 3D prints, made for you' })).toBeVisible()
    await expect(page.locator('h1')).toHaveCount(1)

    const hero = page.getByRole('link', { name: 'Contact for custom 3D printed objects' })
    await expect(hero).toBeVisible()
    const heroHref = await hero.getAttribute('href')
    expect(heroHref).toBeTruthy()
    const heroUrl = new URL(heroHref!)
    expect(`${heroUrl.origin}${heroUrl.pathname}`).toBe(`https://wa.me/${digits}`)
    expect(heroUrl.searchParams.get('text') || '').toContain('custom 3D printed object')
    await expect(hero).toHaveAttribute('target', '_blank')
    await expect(hero).toHaveAttribute('rel', /noopener/)

    const options = page.locator('[data-custom-option]')
    await expect(options).toHaveCount(3)
    await expect(options.nth(0).getByRole('heading', { level: 3, name: 'Name keychain' })).toBeVisible()
    await expect(options.nth(1).getByRole('heading', { level: 3, name: 'NFC tag keychain' })).toBeVisible()
    await expect(options.nth(2).getByRole('heading', { level: 3, name: 'QR code keychain' })).toBeVisible()

    for (let index = 0; index < 3; index += 1) {
      const cta = options.nth(index).getByRole('link', { name: /Order on WhatsApp/ })
      await expect(cta).toHaveAttribute('href', new RegExp(`^https://wa\\.me/${digits}\\?text=`))
    }

    await expect(page.getByRole('heading', { level: 2, name: 'How it works' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Message us on WhatsApp' })).toBeVisible()
  })

  test('both custom routes share the same default share image and their own title', async ({ page }) => {
    // metadataBase is the configured site URL, which differs from the dev port.
    // Compare the image path only, so this stays about the pageSocial wiring.
    for (const { path, title } of [
      { path: '/custom', title: 'Custom 3D Prints | Cobraa 3D, Hoskote' },
      { path: '/custom/nameplate', title: 'Nameplate studio | Cobraa 3D, Hoskote' },
    ]) {
      await page.goto(path)

      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', new RegExp(`${path}$`))
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', title)
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', new RegExp(`${path}$`))
      const image = await page.locator('meta[property="og:image"]').first().getAttribute('content')
      expect(new URL(image!).pathname).toBe('/share-home.jpg')
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image')
      await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute('content', /\/share-home\.jpg$/)
    }
  })

  test('the main nav and the home teaser link to /custom', async ({ page }) => {
    await page.goto('/')

    const navigation = page.getByRole('navigation', { name: 'Main navigation' }).first()
    await expect(navigation.getByRole('link', { name: 'Custom' })).toHaveAttribute('href', '/custom')
    await expect(page.locator('#custom').getByRole('link', { name: /Start a custom order/ })).toHaveAttribute('href', '/custom')
  })

  test('nothing overflows at 375px and the main actions meet the tap target size', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/custom')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const overflow = await page.evaluate(() => {
      const doc = document.documentElement
      const offenders = [...document.querySelectorAll<HTMLElement>('body *')]
        .filter((node) => {
          const rect = node.getBoundingClientRect()
          return rect.width > 0 && (rect.right > doc.clientWidth + 1 || rect.left < -1)
        })
        .slice(0, 8)
        .map((node) => ({ tag: node.tagName, className: node.className, right: Math.round(node.getBoundingClientRect().right) }))
      return { scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth, offenders }
    })

    expect(overflow.scrollWidth, JSON.stringify(overflow.offenders)).toBeLessThanOrEqual(overflow.clientWidth + 1)

    const actions = [
      page.getByRole('link', { name: 'Contact for custom 3D printed objects' }),
      page.locator('[data-custom-option]').first().getByRole('link', { name: /Order on WhatsApp/ }),
      page.getByRole('link', { name: 'Message us on WhatsApp' }),
    ]
    for (const action of actions) {
      const box = await action.boundingBox()
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)
    }
  })
})
