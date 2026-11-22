import { test, expect } from '@playwright/test'
import { cleanupTestUser, seedTestUser, testUser } from '../helpers/seedUser'
import { login } from '../helpers/login'
import { readFile } from 'node:fs/promises'
import { getPayload } from 'payload'
import config from '../../src/payload.config'

test.describe('Admin workflows', () => {
  test.beforeAll(async () => { await seedTestUser() })
  test.afterAll(async () => { await cleanupTestUser() })

  test('downloads a product CSV containing draft data and nested fields', async ({ page, request }) => {
    test.slow()
    const endpoint = '/api/products/export-csv'
    expect((await request.get(endpoint)).status()).toBe(401)

    const payload = await getPayload({ config })
    const product = await payload.create({
      collection: 'products',
      data: {
        title: '=CSV export, "draft"',
        faq: [{ question: 'CSV test question', answer: 'First line\nSecond line' }],
      },
      draft: true,
      context: { disableRevalidate: true },
    })

    try {
      await login({ page, user: testUser })
      await page.goto('/admin/collections/products')
      const exportLink = page.getByRole('link', { name: 'Export all products (CSV)' })
      const [download] = await Promise.all([page.waitForEvent('download'), exportLink.click()])
      expect(download.suggestedFilename()).toMatch(/^products-\d{4}-\d{2}-\d{2}\.csv$/)

      const csv = await readFile(await download.path(), 'utf8')
      expect(csv.split('\r\n')[0]).toContain('"faq"')
      expect(csv).toContain(`"'=CSV export, ""draft"""`)
      expect(csv).toContain('""question"":""CSV test question""')
      expect(csv).toContain('First line\\nSecond line')
    } finally {
      await payload.delete({ collection: 'products', id: product.id, context: { disableRevalidate: true } })
    }
  })

  test('dashboard provides QR downloads and an honest publish checklist at mobile width', async ({ page }) => {
    await login({ page, user: testUser })
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(page.getByRole('heading', { name: 'Operational summary' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Publish checklist' })).toBeVisible()
    await expect(page.getByLabel('QR destination')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Download PNG' })).toHaveAttribute('download', /\.png$/)
    await expect(page.getByRole('link', { name: 'Download SVG' })).toHaveAttribute('download', /\.svg$/)
    await page.getByRole('button', { name: 'Start festive mode' }).click()
    await expect(page.getByRole('button', { name: 'End festive mode' })).toBeVisible()
    await page.getByRole('button', { name: 'End festive mode' }).click()
    await expect(page.getByRole('button', { name: 'Start festive mode' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  })

  test('settings are grouped and enquiry list exposes official CSV export', async ({ page }) => {
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
    await expect(page.getByRole('heading', { name: 'Enquiries' })).toBeVisible()
    await page.getByRole('button', { name: 'More options' }).click()
    await expect(page.getByRole('button', { name: 'Add new Export' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add new Import' })).toBeVisible()
  })
})
