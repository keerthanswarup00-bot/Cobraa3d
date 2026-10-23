import { test, expect, devices, type Page } from '@playwright/test'

const { defaultBrowserType: _defaultBrowserType, ...PIXEL_5 } = devices['Pixel 5']
const PHONE = { ...PIXEL_5, viewport: { width: 390, height: 844 }, hasTouch: true }

test.use(PHONE)

async function skipSplash(page: Page) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cobraa-splash', '1')
    } catch {}
  })
}

async function openFilters(page: Page) {
  await page.goto('/products')
  const trigger = page.getByRole('button', { name: /Filters/ }).first()
  await trigger.click()
  const sheet = page.locator('.pc-filter-sheet')
  await expect(sheet).toBeVisible()
  return sheet
}

test.describe('Mobile catalogue', () => {
  test('the filter toolbar stays in document flow above the product grid', async ({ page }) => {
    await skipSplash(page)
    await page.goto('/products')

    const toolbar = page.locator('.pc-toolbar')
    const grid = page.locator('.pc-grid')
    const layout = await page.evaluate(() => {
      const toolbarNode = document.querySelector('.pc-toolbar')!
      const gridNode = document.querySelector('.pc-grid')!
      const toolbarBox = toolbarNode.getBoundingClientRect()
      const gridBox = gridNode.getBoundingClientRect()
      return {
        position: getComputedStyle(toolbarNode).position,
        toolbarBottom: toolbarBox.bottom + window.scrollY,
        gridTop: gridBox.top + window.scrollY,
      }
    })

    await expect(toolbar).toBeVisible()
    await expect(grid.locator('.pc-card').first()).toBeVisible()
    expect(layout.position).toBe('static')
    expect(layout.gridTop).toBeGreaterThanOrEqual(layout.toolbarBottom)

    await page.evaluate(() => window.scrollTo(0, 400))
    await expect.poll(() => toolbar.evaluate((node) => node.getBoundingClientRect().bottom)).toBeLessThan(0)
  })

  test('the filter sheet is a portaled 85dvh bottom sheet with every facet and a clear CTA', async ({ page }) => {
    await skipSplash(page)
    const sheet = await openFilters(page)

    const metrics = await sheet.evaluate((node) => {
      const box = node.getBoundingClientRect()
      const style = getComputedStyle(node)
      const cta = [...node.querySelectorAll('button')].find((button) => /^Show \d+ products?$/.test(button.textContent?.trim() || ''))
      const ctaStyle = cta ? getComputedStyle(cta) : null
      return {
        position: style.position,
        height: box.height,
        bottom: box.bottom,
        viewport: window.innerHeight,
        portaled: node.closest('.pc-page') === null,
        inBody: node.closest('body') !== null,
        grab: Boolean(node.querySelector('.pc-filter-grab')),
        sections: [...node.querySelectorAll('h3')].map((heading) => heading.textContent?.trim()),
        backdrop: Boolean(document.querySelector('.pc-filter-layer .pc-filter-scrim')),
        cta: cta?.textContent?.trim() ?? null,
        ctaBackground: ctaStyle?.backgroundColor ?? null,
        ctaColor: ctaStyle?.color ?? null,
        reset: Boolean([...node.querySelectorAll('button')].find((button) => /reset all/i.test(button.textContent || ''))),
      }
    })

    expect(metrics.position, 'the sheet should be fixed to the viewport').toBe('fixed')
    expect(metrics.portaled, 'the sheet should be portaled out of the page tree').toBe(true)
    expect(metrics.inBody).toBe(true)
    expect(metrics.height, 'the sheet should be 85dvh tall').toBeGreaterThanOrEqual(metrics.viewport * 0.85 - 2)
    expect(metrics.height, 'the sheet should be 85dvh tall').toBeLessThanOrEqual(metrics.viewport * 0.85 + 2)
    expect(metrics.bottom, 'the sheet should sit on the bottom edge').toBeGreaterThanOrEqual(metrics.viewport - 2)
    expect(metrics.grab, 'the sheet needs a drag handle').toBe(true)
    expect(metrics.backdrop, 'the sheet needs a backdrop').toBe(true)
    expect(metrics.reset, 'the sheet needs a reset control').toBe(true)
    expect(metrics.sections, 'all facet groups should be present').toEqual(
      expect.arrayContaining(['Category', 'Material', 'Colour', 'Price']),
    )
    expect(metrics.cta).toMatch(/^Show \d+ products?$/)
    expect(metrics.ctaBackground, 'the CTA should be white').toBe('rgb(255, 255, 255)')
    expect(metrics.ctaColor, 'the CTA label should be black').toBe('rgb(0, 0, 0)')

    await page.screenshot({ path: 'test-results/mobile-catalog/filter-sheet.png' })
  })

  test('category filters update results, survive a reload, and drive the sheet count', async ({ page }) => {
    await skipSplash(page)
    await page.goto('/products')

    const total = Number((await page.locator('.pc-meta').innerText()).match(/\d+/)?.[0] ?? 0)
    expect(total, 'the catalogue should have products').toBeGreaterThan(0)

    const category = page.getByRole('combobox', { name: 'Choose a product category' })
    await expect(category.locator('option', { hasText: 'Lamps & Lighting' })).toBeAttached()
    await category.selectOption('lamps-lighting')

    await expect.poll(() => new URL(page.url()).searchParams.get('category')).toBe('lamps-lighting')
    const filtered = Number((await page.locator('.pc-meta').innerText()).match(/\d+/)?.[0] ?? 0)
    expect(filtered).toBeGreaterThan(0)
    expect(filtered).toBeLessThan(total)
    await expect(page.locator('.pc-card')).toHaveCount(filtered)

    await page.reload()
    await expect.poll(() => new URL(page.url()).searchParams.get('category')).toBe('lamps-lighting')
    await expect(page.locator('.pc-card')).toHaveCount(filtered)

    const sheet = page.locator('.pc-filter-sheet')
    await page.getByRole('button', { name: /Filters/ }).first().click()
    await expect(sheet).toBeVisible()
    await expect(sheet.locator('.pc-filter-foot button')).toHaveText(`Show ${filtered} products`)
    await expect(sheet.locator('input:checked')).toHaveCount(1)

    await page.screenshot({ path: 'test-results/mobile-catalog/category-filter.png' })
  })

  test('pagination moves to the next page and keeps the URL in sync', async ({ page }) => {
    await skipSplash(page)
    await page.goto('/products')

    const pager = page.locator('.pc-pager')
    await expect(pager).toBeVisible()
    await pager.getByRole('button', { name: '2', exact: true }).click()

    await expect.poll(() => new URL(page.url()).searchParams.get('page')).toBe('2')
    await expect(page.locator('.pc-meta')).toContainText('Page 2 of')
    await expect(page.locator('.pc-pg[aria-current="page"]')).toHaveText('2')

    await page.reload()
    await expect(page.locator('.pc-pg[aria-current="page"]')).toHaveText('2')

    await page.screenshot({ path: 'test-results/mobile-catalog/pagination.png' })
  })

  test('the mobile header is one short row and the menu is a full-screen scroll-locked overlay', async ({ page }) => {
    await skipSplash(page)
    await page.goto('/')

    const header = page.locator('.site-nav')
    const headerHeight = await header.evaluate((node) => Math.round(node.getBoundingClientRect().height))
    expect(headerHeight, 'the mobile header should be a single 56px row').toBeLessThanOrEqual(58)

    await page.getByRole('button', { name: 'Open menu' }).click()
    const menu = page.locator('.site-menu')
    await expect(menu).toBeVisible()
    await page.waitForTimeout(350)

    const overlay = await menu.evaluate((node) => {
      const box = node.getBoundingClientRect()
      return {
        x: Math.round(box.x),
        y: Math.round(box.y),
        width: Math.round(box.width),
        height: Math.round(box.height),
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        bodyOverflow: getComputedStyle(document.body).overflow,
        bodyPosition: getComputedStyle(document.body).position,
        inBody: node.parentElement === document.body,
      }
    })

    expect(overlay).toMatchObject({ x: 0, y: 0, width: 390, height: 844, inBody: true })
    expect(overlay.bodyOverflow, 'the page behind the menu should not scroll').toBe('hidden')
    expect(overlay.bodyPosition, 'the page should be locked while the menu is open').toBe('fixed')

    for (let index = 0; index < 6; index += 1) {
      await page.keyboard.press('Tab')
      const trapped = await page.evaluate(() => Boolean(document.activeElement?.closest('.site-menu')))
      expect(trapped, 'focus should stay inside the open menu').toBe(true)
    }

    await page.keyboard.press('Escape')
    await expect(menu).toBeHidden()
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused()
    const restored = await page.evaluate(() => ({ overflow: getComputedStyle(document.body).overflow, position: getComputedStyle(document.body).position }))
    expect(restored).toEqual({ overflow: 'visible', position: 'static' })

    await page.screenshot({ path: 'test-results/mobile-catalog/menu.png' })
  })
})
