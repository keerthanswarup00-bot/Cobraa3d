import { test, expect } from '@playwright/test'

test.describe('Frontend', () => {
  test('can load homepage', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1').first()).toHaveText('Cobraa 3D')
    await expect(page.getByRole('link', { name: 'Browse products' })).toHaveAttribute('href', '/products')
  })

  test('renders without horizontal overflow at phone, tablet, and desktop widths', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1').first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Browse products' })).toBeVisible()
    await expect.poll(() => page.locator('html').evaluate((element) => getComputedStyle(element).opacity)).toBe('1')
    for (const width of [360, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 })
      const doesNotOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)
      expect(doesNotOverflow, `horizontal overflow at ${width}px`).toBe(true)
      await page.evaluate(() => document.fonts.ready)
      await page.screenshot({ path: `test-results/visual/home-${width}.png`, fullPage: true })
    }
  })
})
