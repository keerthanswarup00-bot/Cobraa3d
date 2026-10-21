import { test, expect, devices } from '@playwright/test'

/**
 * Mobile home checks for a phone-sized, touch-first visit.
 *
 * Every test here was written against the live site and failed before the
 * matching fix. They cover the four things a visitor on a mid-range Android
 * phone hits first: the builder preview, the form fields under the sticky
 * preview, the quantity field, and the loading screen.
 */

const { defaultBrowserType: _defaultBrowserType, ...PIXEL_5 } = devices['Pixel 5']
const PHONE = { ...PIXEL_5, hasTouch: true }

test.use(PHONE)

/** The shape each builder chip is expected to preview, and its layer count. */
const ITEMS = [
  { id: 'nameplate', label: 'Nameplate', shape: 'plate', layers: 24 },
  { id: 'keychain', label: 'Keychain', shape: 'key', layers: 24 },
  { id: 'lamp', label: 'Lamp', shape: 'lamp', layers: 36 },
  { id: 'stand', label: 'Phone stand', shape: 'stand', layers: 36 },
  { id: 'photo', label: 'Photo stand', shape: 'photo', layers: 36 },
  { id: 'gift', label: 'Personalised gift', shape: 'plate', layers: 24 },
  { id: 'other', label: 'Something else', shape: 'sphere', layers: 36 },
] as const

/** The splash is a one-off; tests that need a settled page can skip it. */
async function skipSplash(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cobraa-splash', '1')
    } catch {}
  })
}

test.describe('Mobile home', () => {
  test('the builder preview always matches the selected item chip', async ({ page }) => {
    await skipSplash(page)
    await page.goto('/')
    const builder = page.locator('#connect-builder')
    await builder.scrollIntoViewIfNeeded()

    const problems: string[] = []

    for (const item of ITEMS) {
      const chip = builder.getByRole('radio', { name: item.label, exact: true })
      await chip.click()
      await expect(chip).toBeChecked()
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve(null)))))

      const state = await page.evaluate(() => {
        const stage = document.querySelector('.studio-stage')!
        const stageBox = stage.getBoundingClientRect()
        const models = [...stage.querySelectorAll('.studio-stage-model')]
        const model = models[0]
        const layerTag = stage.querySelector('.studio-stage-tag.bottom-left')
        const tags = [...stage.querySelectorAll('.studio-stage-tag')].map((node) => {
          const box = node.getBoundingClientRect()
          const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
          return { covered: !node.contains(top) && top !== node }
        })
        return {
          modelCount: models.length,
          previewItem: model?.getAttribute('data-preview-item') ?? null,
          previewType: model?.getAttribute('data-preview-type') ?? null,
          hasPlate: Boolean(model?.querySelector('.studio-preview-plate')),
          isKeychain: Boolean(model?.querySelector('.studio-preview-plate.is-keychain')),
          hasLayerRender: Boolean(model?.querySelector('svg.studio-layer-render')),
          layerLabel: layerTag?.textContent?.trim() ?? '',
          contained: models.every((node) => {
            const box = node.getBoundingClientRect()
            return box.top >= stageBox.top - 1 && box.bottom <= stageBox.bottom + 1 && box.left >= stageBox.left - 1 && box.right <= stageBox.right + 1
          }),
          tagsCovered: tags.filter((tag) => tag.covered).length,
        }
      })

      if (state.modelCount !== 1) problems.push(`${item.label}: ${state.modelCount} preview models in the stage`)
      if (state.previewItem !== item.id) problems.push(`${item.label}: preview reports "${state.previewItem}"`)
      if (state.previewType !== item.shape) problems.push(`${item.label}: preview shape is "${state.previewType}"`)
      if (item.shape === 'plate' || item.shape === 'key') {
        if (!state.hasPlate) problems.push(`${item.label}: expected a plate preview`)
        if (item.shape === 'key' && !state.isKeychain) problems.push(`${item.label}: expected a keychain preview`)
      } else if (!state.hasLayerRender) {
        problems.push(`${item.label}: expected a layered preview`)
      }
      if (!new RegExp(`^\\d+ / ${item.layers} layers$`).test(state.layerLabel)) problems.push(`${item.label}: layer label reads "${state.layerLabel}"`)
      if (!state.contained) problems.push(`${item.label}: preview spills outside the stage`)
      if (state.tagsCovered > 0) problems.push(`${item.label}: ${state.tagsCovered} corner labels are covered`)
    }

    await page.screenshot({ path: 'test-results/mobile-home/phase0-builder-preview.png' })

    expect(problems, 'the builder preview did not follow the selected chips').toEqual([])
  })

  test('the name field stays fully visible and uncovered on a short screen', async ({ page }) => {
    await skipSplash(page)
    await page.setViewportSize({ width: 390, height: 420 })
    await page.goto('/')
    const input = page.locator('#connect-text')
    await input.scrollIntoViewIfNeeded()
    await input.focus()
    await page.waitForTimeout(400)

    const state = await page.evaluate(() => {
      const field = document.querySelector('#connect-text') as HTMLInputElement
      const box = field.getBoundingClientRect()
      const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
      const coveredBy: string[] = []
      if (top && top !== field && !field.contains(top)) {
        if (top.closest('.studio-stage')) coveredBy.push('sticky-preview')
        if (top.closest('.site-nav')) coveredBy.push('navigation')
        if (!coveredBy.length) coveredBy.push(top.tagName.toLowerCase())
      }
      return {
        coveredBy,
        withinViewport: box.top >= 0 && box.bottom <= window.innerHeight && box.left >= 0 && box.right <= window.innerWidth,
        box: { top: Math.round(box.top), bottom: Math.round(box.bottom) },
      }
    })

    await page.screenshot({ path: 'test-results/mobile-home/phase0-name-field.png' })

    expect(state.coveredBy, `name field is covered by ${state.coveredBy.join(', ')}`).toEqual([])
    expect(state.withinViewport, `name field is outside the viewport: ${JSON.stringify(state.box)}`).toBe(true)
  })

  test('typing a quantity in a cleared field gives exactly that number', async ({ page }) => {
    await skipSplash(page)
    await page.goto('/')
    const quantity = page.locator('#connect-quantity')
    await quantity.scrollIntoViewIfNeeded()
    await quantity.fill('')
    await quantity.pressSequentially('5')

    await page.screenshot({ path: 'test-results/mobile-home/phase0-quantity.png' })

    await expect(quantity).toHaveValue('5')
  })

  test('the loading screen never blocks scrolling or taps', async ({ browser }) => {
    const context = await browser.newContext(PHONE)
    const page = await context.newPage()
    await page.goto('/', { waitUntil: 'commit' })
    await page.waitForTimeout(500)

    const before = await page.evaluate(() => window.scrollY)
    await page.mouse.wheel(0, 600)
    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 10000 })
      .toBeGreaterThan(before)

    const tapTarget = await page.evaluate(() => {
      const top = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2)
      if (!top) return 'none'
      if (top.closest('.splash')) return 'splash'
      return 'page'
    })

    await page.screenshot({ path: 'test-results/mobile-home/phase0-loader.png' })
    await context.close()

    expect(tapTarget, 'the loading screen is swallowing taps').toBe('page')
  })

  test('the sticky preview stays small and the layer counter runs on its own', async ({ page }) => {
    await skipSplash(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    const builder = page.locator('#connect-builder')
    await builder.scrollIntoViewIfNeeded()

    const stage = page.locator('.studio-stage')
    const tall = await stage.evaluate((node) => Math.round(node.getBoundingClientRect().height))
    expect(tall, 'the sticky preview eats the form on a tall phone').toBeLessThanOrEqual(168)

    const counter = builder.locator('.studio-stage-tag.bottom-left')
    await builder.getByRole('radio', { name: 'Lamp', exact: true }).click()
    const seen = await counter.evaluate(async (node) => {
      const values = new Set<string>()
      const startedAt = performance.now()
      while (performance.now() - startedAt < 1500) {
        values.add(node.textContent || '')
        await new Promise((resolve) => requestAnimationFrame(resolve))
      }
      return [...values]
    })
    expect(seen.length, 'the layer counter never moved').toBeGreaterThan(1)
    await expect(counter).toHaveText(/^\d+ \/ 36 layers$/)

    await page.setViewportSize({ width: 390, height: 420 })
    await page.waitForTimeout(300)
    const short = await stage.evaluate((node) => Math.round(node.getBoundingClientRect().height))
    expect(short, 'the sticky preview is too tall for a short screen').toBeLessThanOrEqual(120)
  })

  test('the mobile header keeps a reachable WhatsApp action and a closeable menu', async ({ page }) => {
    await skipSplash(page)
    await page.goto('/')

    const whatsapp = page.locator('.nav-whatsapp')
    await expect(whatsapp).toBeVisible()
    await expect(whatsapp).toHaveText(/WhatsApp/)
    const size = await whatsapp.evaluate((node) => {
      const box = node.getBoundingClientRect()
      return { height: Math.round(box.height) }
    })
    expect(size.height, 'the WhatsApp action is shorter than a thumb').toBeGreaterThanOrEqual(44)

    const menu = page.getByRole('button', { name: 'Open menu' })
    await menu.click()
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused()
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeHidden()

    await menu.click()
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible()
    const viewport = page.viewportSize()!
    await page.mouse.click(viewport.width / 2, viewport.height - 20)
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeHidden()
  })
})
