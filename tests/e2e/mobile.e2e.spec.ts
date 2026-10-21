import { test, expect } from '@playwright/test'

const viewports = [
  { width: 360, height: 740 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
]

test('captures the homepage at the agreed viewport sizes', async ({ page }) => {
  await page.goto('/')
  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    await expect(page.getByRole('heading', { name: /Made in Hoskote\./ })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    await page.screenshot({
      path: `test-results/visual/phase-7-home-${viewport.width}x${viewport.height}.png`,
      fullPage: true,
    })
  }
})

test('captures an offered product card and its sheet at the agreed viewport sizes', async ({ page }) => {
  await page.goto('/products')
  const offerCard = page.locator('.pc-card').filter({ has: page.locator('.pc-price del') }).first()
  if (!await offerCard.count()) {
    test.skip(true, 'Requires a published product with a configured offer price and regular price in Payload.')
  }

  for (const viewport of viewports) {
    await page.setViewportSize(viewport)
    await page.goto('/products')
    const card = page.locator('.pc-card').filter({ has: page.locator('.pc-price del') }).first()
    await expect(card).toBeVisible()
    await expect(card.locator('.pc-price')).toContainText('₹')
    await expect(card.locator('.pc-price del')).toBeVisible()
    await card.screenshot({
      path: `test-results/visual/phase-7-offer-card-${viewport.width}x${viewport.height}.png`,
    })
    await card.locator('a.pc-media').click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('.pc-sheet-price del')).toBeVisible()
    await page.screenshot({
      path: `test-results/visual/phase-7-offer-sheet-${viewport.width}x${viewport.height}.png`,
      fullPage: true,
    })
  }
})
