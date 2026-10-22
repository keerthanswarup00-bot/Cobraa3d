import { expect, test } from '@playwright/test'

/**
 * Phase 3: the 3D preview must not leak memory when the visitor cycles
 * through pieces many times. We track Three.js' own memory counters.
 */
test('three preview does not grow geometry or texture memory when cycling 40 times', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' })
  const stage = page.locator('[data-hero-stage]')
  await expect(stage).toBeVisible()
  await page.waitForTimeout(4000)

  const samples = await page.evaluate(`(async () => {
    const results = []
    const getInfo = () => {
      const piece = document.querySelector('[data-piece3d-memory]')
      const value = piece?.getAttribute('data-piece3d-memory') || ''
      if (value.includes(':')) {
        const [g, t] = value.split(':').map(Number)
        return { g, t }
      }
      return { g: Number.NaN, t: Number.NaN }
    }
    const clicks = document.querySelectorAll('.studio-chip-row .studio-chip input[type=radio]')
    for (let i = 0; i < 40; i += 1) {
      const input = clicks[i % clicks.length]
      input.click()
      await new Promise((r) => setTimeout(r, 250))
      if (i % 8 === 7) results.push(getInfo())
    }
    // Give the scene a moment to dispose old builds
    await new Promise((r) => setTimeout(r, 800))
    results.push(getInfo())
    return results
  })()`) as { g: number; t: number }[]

  const numbers = samples.filter((s) => !Number.isNaN(s.g) && !Number.isNaN(s.t))
  expect(numbers.length).toBeGreaterThan(0)
  const first = numbers[0]!
  const last = numbers[numbers.length - 1]!
  // Allow a small fixed overhead, but do not let it grow linearly with 40 switches
  expect(last.g).toBeLessThanOrEqual(first.g + 12)
  expect(last.t).toBeLessThanOrEqual(first.t + 12)
})
