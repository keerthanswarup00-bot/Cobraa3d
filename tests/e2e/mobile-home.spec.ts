import { test, expect, devices } from '@playwright/test'

const { defaultBrowserType: _defaultBrowserType, ...PIXEL_5 } = devices['Pixel 5']
const PHONE = { ...PIXEL_5, hasTouch: true }

test.use(PHONE)

async function skipSplash(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    try { sessionStorage.setItem('cobraa-splash', '1') } catch {}
  })
}

test.describe('Mobile home layout', () => {
  test('renders without uncaught browser errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await skipSplash(page)
    await page.goto('/')
    await expect(page.locator('#home-title')).toBeVisible()
    expect(errors).toEqual([])
  })

  test('fits narrow and common phone widths without horizontal page scrolling', async ({ page }) => {
    await skipSplash(page)
    await page.goto('/')

    for (const width of [320, 360, 375, 390, 414, 430]) {
      await page.setViewportSize({ width, height: 844 })
      await expect(page.locator('#home-title')).toBeVisible()
      const layout = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        page: document.documentElement.scrollWidth,
        main: document.querySelector('main')?.getBoundingClientRect().width || 0,
      }))
      expect(layout.page, `page overflows at ${width}px`).toBeLessThanOrEqual(layout.viewport)
      expect(layout.main, `homepage main exceeds ${width}px`).toBeLessThanOrEqual(layout.viewport)
    }
  })

  test('keeps the mobile header and primary hero actions reachable', async ({ page }) => {
    await skipSplash(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    const navWhatsApp = page.locator('.nav-whatsapp')
    await expect(navWhatsApp).toBeVisible()
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible()
    const targets = await page.locator('.home-hero-actions a, .nav-whatsapp, .site-nav-menu').evaluateAll((nodes) => nodes.map((node) => {
      const box = node.getBoundingClientRect()
      return { label: node.textContent?.trim() || node.getAttribute('aria-label'), height: Math.round(box.height), width: Math.round(box.width) }
    }))
    for (const target of targets) {
      expect(target.height, `${target.label} target is shorter than 44px`).toBeGreaterThanOrEqual(44)
    }

    await page.getByRole('button', { name: 'Open menu' }).click()
    await expect(page.getByRole('dialog', { name: 'Main menu' })).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: 'Main menu' })).toBeHidden()
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused()
  })

  test('stacks content cleanly on a short phone viewport', async ({ page }) => {
    await skipSplash(page)
    await page.setViewportSize({ width: 375, height: 568 })
    await page.goto('/')

    const hero = page.locator('.home-hero')
    await expect(hero).toBeVisible()
    await expect(page.getByRole('link', { name: /Browse products/ })).toBeVisible()
    const heroBounds = await hero.evaluate((node) => ({ top: node.getBoundingClientRect().top, bottom: node.getBoundingClientRect().bottom }))
    expect(heroBounds.top).toBeGreaterThanOrEqual(0)
    expect(heroBounds.bottom).toBeGreaterThan(heroBounds.top)
    await page.locator('.home-product-section').first().scrollIntoViewIfNeeded()
    await expect(page.locator('.home-product-section').first()).toBeVisible()
  })
})
