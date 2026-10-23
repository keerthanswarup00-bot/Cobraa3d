import { expect, test } from '@playwright/test'

/** The simpler homepage should not boot the interactive Three.js customiser. */
test('homepage avoids mounting the interactive 3D builder', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/', { waitUntil: 'networkidle' })
  await expect(page.locator('#home-title')).toBeVisible()

  await page.locator('.home-product-section').first().scrollIntoViewIfNeeded()
  await expect(page.locator('.home-product-section').first()).toBeVisible()
  expect(await page.locator('.studio-piece3d-canvas, [data-hero-stage], #connect-builder').count()).toBe(0)
  expect(errors).toEqual([])
})
