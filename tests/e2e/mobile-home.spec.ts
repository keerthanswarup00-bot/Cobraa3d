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

/** Skip the print loader so a test can start on a settled page. */
async function skipLoader(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cobraa-loader', 'done')
    } catch {}
  })
}

test.describe('Mobile home', () => {
  test('the builder preview always matches the selected item chip', async ({ page }) => {
    await skipLoader(page)
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
    await skipLoader(page)
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
    await skipLoader(page)
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
    await page.waitForTimeout(250)
    const after = await page.evaluate(() => window.scrollY)

    const tapTarget = await page.evaluate(() => {
      const top = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2)
      if (!top) return 'none'
      if (top.closest('.print-loader')) return 'print-loader'
      if (top.closest('.splash')) return 'splash'
      return 'page'
    })

    await page.screenshot({ path: 'test-results/mobile-home/phase0-loader.png' })
    await context.close()

    expect(after, 'the page is still scrollable one second after load').toBeGreaterThan(before)
    expect(tapTarget, 'the loading screen is swallowing taps').toBe('page')
  })
})
