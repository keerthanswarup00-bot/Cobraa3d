import { test, expect, Page } from '@playwright/test'
import { login } from '../helpers/login'
import { seedTestUser, cleanupTestUser, testUser, sampleProductTitle } from '../helpers/seedUser'

test.describe('Admin Panel', () => {
  let page: Page

  test.beforeAll(async ({ browser }) => {
    await seedTestUser()

    const context = await browser.newContext()
    page = await context.newPage()

    await login({ page, user: testUser })
  })

  test.afterAll(async () => {
    await cleanupTestUser()
  })

  test('can navigate to dashboard', async () => {
    await page.goto('/admin')
    await expect(page).toHaveURL('http://127.0.0.1:3100/admin')
    const dashboardArtifact = page.locator('span[title="Dashboard"]').first()
    await expect(dashboardArtifact).toBeVisible()
  })

  test('can navigate to list view', async () => {
    await page.goto('/admin/collections/users')
    await expect(page).toHaveURL(/\/admin\/collections\/users(?:\?|$)/)
    const listViewArtifact = page.locator('h1', { hasText: 'Users' }).first()
    await expect(listViewArtifact).toBeVisible()
  })

  test('can navigate to the product editor', async () => {
    await page.goto('/admin/collections/products/create')
    await expect(page).toHaveURL(/\/admin\/collections\/products\/[a-zA-Z0-9-_]+/)
    const editViewArtifact = page.locator('input[name="title"]')
    await expect(editViewArtifact).toBeVisible()
  })

  test('creates a sample product and opens a prefilled WhatsApp enquiry', async () => {
    await page.goto('/admin/collections/products/create')
    await page.locator('input[name="title"]').fill(sampleProductTitle)
    await page.locator('textarea[name="shortDescription"]').fill('Temporary sample used to verify the product enquiry flow.')
    await page.locator('#field-status').getByRole('combobox').click()
    await page.getByRole('option', { name: 'Published' }).click()
    await page.getByRole('button', { name: /publish/i }).click()
    await expect(page).toHaveURL(/\/admin\/collections\/products\/[a-zA-Z0-9-_]+/)

    await page.goto('/products')
    const productLink = page.getByRole('link', { name: /SAMPLE Walking Skeleton Product/ })
    const productHref = await productLink.getAttribute('href')
    expect(productHref).toBe('/products/sample-walking-skeleton-product')
    await page.goto(productHref!)
    await expect(page).toHaveURL(/\/products\/sample-walking-skeleton-product/)
    const enquiryLink = page.getByRole('link', { name: 'Ask on WhatsApp' })
    await expect(enquiryLink).toBeVisible()
    await expect(enquiryLink).toHaveAttribute('href', /wa\.me\/919999999999\?text=/)
  })
})
