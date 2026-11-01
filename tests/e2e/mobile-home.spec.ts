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

  test('keeps the footer contact row aligned and within a 390px viewport', async ({ page }) => {
    await skipSplash(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    const footer = page.locator('.home-footer')
    const phone = footer.getByRole('link', { name: '+91 70194 33035' })
    await expect(footer.locator('.home-footer-top nav')).toBeVisible()
    await expect(footer.locator('.home-footer-whatsapp')).toBeVisible()
    await expect(phone).toHaveAttribute('href', 'tel:+917019433035')
    await expect(footer.getByRole('link', { name: 'Back to top ↑' })).toBeVisible()

    const layout = await page.evaluate(() => {
      const top = document.querySelector<HTMLElement>('.home-footer-top')
      const row = document.querySelector<HTMLElement>('.home-footer-bottom')
      const bounds = (element: HTMLElement | null) => {
        const { left, right } = element?.getBoundingClientRect() || { left: 0, right: 0 }
        return { left, right }
      }
      const cells = row ? Array.from(row.children, (element) => {
        const { left, right, top } = element.getBoundingClientRect()
        return { left, right, top }
      }) : []
      return {
        viewport: document.documentElement.clientWidth,
        page: document.documentElement.scrollWidth,
        footer: footerWidth(),
        top: bounds(top),
        divider: bounds(row),
        cells,
      }

      function footerWidth() {
        return document.querySelector<HTMLElement>('.home-footer')?.scrollWidth || 0
      }
    })
    expect(layout.page).toBeLessThanOrEqual(layout.viewport)
    expect(layout.footer).toBeLessThanOrEqual(layout.viewport)
    expect(Math.abs(layout.top.left - layout.divider.left)).toBeLessThan(1)
    expect(Math.abs(layout.top.right - layout.divider.right)).toBeLessThan(1)
    expect(layout.cells).toHaveLength(4)
    expect(Math.abs(layout.cells[0].left - layout.cells[2].left)).toBeLessThan(1)
    expect(Math.abs(layout.cells[1].right - layout.cells[3].right)).toBeLessThan(1)
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
