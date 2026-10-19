import { test, expect } from '@playwright/test'
import { cleanupTestUser, seedTestUser, testUser } from '../helpers/seedUser'
import { login } from '../helpers/login'

test.describe('Admin workflows', () => {
  test.beforeAll(async () => { await seedTestUser() })
  test.afterAll(async () => { await cleanupTestUser() })

  test('dashboard provides QR downloads and an honest publish checklist at mobile width', async ({ page }) => {
    await login({ page, user: testUser })
    await page.setViewportSize({ width: 390, height: 844 })
    await expect(page.getByRole('heading', { name: 'Things that need attention' })).toBeVisible()
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
    await expect(page.getByRole('button', { name: 'Basics' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Details' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'WhatsApp and SEO' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
    await page.goto('/admin/collections/enquiries')
    await page.getByRole('button', { name: 'More options' }).click()
    await page.getByRole('button', { name: 'Add new Export' }).click()
    await expect(page.getByText('Export Options')).toBeVisible()
  })
})
