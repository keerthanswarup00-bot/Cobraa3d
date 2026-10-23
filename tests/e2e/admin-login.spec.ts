import { test, expect } from '@playwright/test'

test.describe('Admin login', () => {
  test('loads /admin/login and shows login form with no console errors', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })
    page.on('pageerror', (err) => {
      consoleErrors.push(err.message)
    })

    const response = await page.goto('/admin/login', { waitUntil: 'networkidle' })
    expect(response?.ok()).toBeTruthy()

    await expect(page.getByLabel(/email/i).first()).toBeVisible()
    await expect(page.getByLabel(/password/i).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /login/i }).first()).toBeVisible()

    expect(consoleErrors).toEqual([])
  })
})
