import { test, expect } from '@playwright/test'
import { cleanupTestUser, seedTestUser, testUser } from '../helpers/seedUser'
import { login } from '../helpers/login'

test.describe('Admin workflows', () => {
  test.beforeAll(async () => { await seedTestUser() })
  test.afterAll(async () => { await cleanupTestUser() })

  test('dashboard provides QR downloads and an honest publish checklist at mobile width', async ({ page }) => {
    await login({ page, user: testUser })
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(page.getByRole('heading', { name: 'Operational summary' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Publish checklist' })).toBeVisible()
    const pngDownload = page.getByRole('link', { name: 'Download PNG' })
    if (await pngDownload.count()) {
      await expect(page.getByLabel('QR destination')).toBeVisible()
      await expect(pngDownload).toHaveAttribute('download', /\.png$/)
      await expect(page.getByRole('link', { name: 'Download SVG' })).toHaveAttribute('download', /\.svg$/)
    } else {
      await expect(page.getByText(/Configure the production storefront URL/)).toBeVisible()
    }
    await expect(page.getByRole('button', { name: /festive mode/ })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  })

  test('settings are grouped and enquiry list opens the export drawer', async ({ page }) => {
    await login({ page, user: testUser })
    await page.goto('/admin/globals/site-settings')
    await expect(page.getByRole('button', { name: 'Brand and Hero' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Contact and Social' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Experience' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    await page.goto('/admin/collections/products/create')
    await expect(page.getByRole('button', { name: 'Overview' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Details', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'WhatsApp and SEO' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    await page.goto('/admin/collections/enquiries')
    await page.getByRole('button', { name: 'More options' }).click()
    await page.getByRole('button', { name: 'Add new Export' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })

  test('captures the product editor at the agreed viewport sizes', async ({ page }) => {
    await login({ page, user: testUser })
    const viewports = [
      { width: 360, height: 740 },
      { width: 390, height: 844 },
      { width: 430, height: 932 },
      { width: 768, height: 1024 },
      { width: 1440, height: 900 },
    ]
    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await page.goto('/admin/collections/products/create')
      await expect(page.getByRole('textbox', { name: 'Title *' })).toBeVisible()
      await page.screenshot({
        path: `test-results/visual/phase-7-admin-product-editor-${viewport.width}x${viewport.height}.png`,
        fullPage: true,
      })
    }
  })
})
