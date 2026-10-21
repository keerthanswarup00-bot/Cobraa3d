import { test, expect, devices } from '@playwright/test'

/**
 * Home page journey checks for the rebuilt phone-first home.
 *
 * These cover the promises the page makes: the section order a visitor
 * follows, the hero that has to fit on one phone screen, the showcase that
 * stops the moment somebody picks a piece, the brief shared between the hero
 * and the builder, and the enquiry buttons that have to say where they came
 * from.
 */

const { defaultBrowserType: _defaultBrowserType, ...PIXEL_5 } = devices['Pixel 5']
const PHONE = { ...PIXEL_5, hasTouch: true }

test.use(PHONE)

async function skipSplash(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('cobraa-splash', '1')
    } catch {}
  })
}

test.describe('Home journey', () => {
  test('the page follows the phone-first order', async ({ page }) => {
    await skipSplash(page)
    await page.goto('/')

    const order = await page.evaluate(() =>
      [...document.querySelectorAll('main.studio-home > section, main.studio-home > footer')].map((node) =>
        node.className.split(' ')[0],
      ),
    )

    expect(order).toEqual(['studio-hero', 'studio-trust', 'studio-products', 'studio-how', 'studio-custom', 'studio-footer'])
  })

  test('the hero fits one phone screen with a reachable stage', async ({ page }) => {
    await skipSplash(page)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    const layout = await page.evaluate(() => {
      const hero = document.querySelector('.studio-hero')!
      const stage = document.querySelector('.studio-hero-stage')!
      const chip = document.querySelector('.studio-chip-row .studio-chip')!
      const action = document.querySelector('.studio-hero-actions .studio-button')!
      return {
        heroHeight: Math.round(hero.getBoundingClientRect().height),
        stageHeight: Math.round(stage.getBoundingClientRect().height),
        chipHeight: Math.round(chip.getBoundingClientRect().height),
        actionHeight: Math.round(action.getBoundingClientRect().height),
      }
    })

    expect(layout.stageHeight, 'the hero stage is taller than 300px').toBeLessThanOrEqual(300)
    expect(layout.chipHeight, 'the item chips are shorter than a thumb').toBeGreaterThanOrEqual(44)
    expect(layout.actionHeight, 'the WhatsApp action is shorter than a thumb').toBeGreaterThanOrEqual(44)
    expect(layout.heroHeight, 'the hero needs more than one phone screen').toBeLessThanOrEqual(940)
  })

  test('the showcase cycles, then stops for good once a piece is picked', async ({ page }) => {
    await skipSplash(page)
    await page.goto('/')

    const piece = page.locator('.studio-hero-piece')
    const first = (await piece.textContent())?.trim()
    await page.waitForTimeout(4200)
    const second = (await piece.textContent())?.trim()
    expect(second, 'the showcase never moved on').not.toBe(first)

    await page.locator('.studio-chip-row .studio-chip').nth(2).click()
    const chosen = (await piece.textContent())?.trim()
    await page.waitForTimeout(4200)
    expect((await piece.textContent())?.trim(), 'the showcase kept cycling after a choice').toBe(chosen)
  })

  test('the showcase stays still when the visitor asked for less motion', async ({ browser }) => {
    const context = await browser.newContext({ ...PHONE, reducedMotion: 'reduce' })
    const page = await context.newPage()
    await skipSplash(page)
    await page.goto('/')

    const piece = page.locator('.studio-hero-piece')
    const first = (await piece.textContent())?.trim()
    await page.waitForTimeout(4200)
    expect((await piece.textContent())?.trim(), 'the showcase moved despite reduced motion').toBe(first)

    await context.close()
  })

  test('the hero and the builder work on one brief', async ({ page }) => {
    await skipSplash(page)
    await page.goto('/')

    await page.locator('.studio-hero-controls input.studio-text-input').fill('Maya Rao')
    await expect(page.locator('#connect-text')).toHaveValue('Maya Rao')

    await page.locator('#connect-builder').scrollIntoViewIfNeeded()
    await page.locator('#connect-builder .studio-chips .studio-chip').nth(1).click()
    const heroPiece = (await page.locator('.studio-hero-piece').textContent())?.trim()
    const builderChecked = await page.locator('#connect-builder .studio-chips').first().locator('input:checked').getAttribute('value')
    expect(heroPiece?.toLowerCase()).toContain(builderChecked?.toLowerCase())
  })

  test('the message carries the brief and the needed-by date', async ({ page }) => {
    await skipSplash(page)
    await page.goto('/')

    await page.locator('#connect-builder').scrollIntoViewIfNeeded()
    await page.locator('#connect-text').fill('Maya Rao')
    await page.locator('#connect-needed-by').fill('2026-12-24')
    await page.locator('#connect-quantity').fill('2')

    const message = (await page.locator('.studio-message').textContent()) || ''
    expect(message).toContain('Maya Rao')
    expect(message).toContain('Needed by')
    expect(message).toContain('24 Dec 2026')
    expect(message).toContain('Quantity: 2')
  })

  test('every enquiry button says where it came from', async ({ page }) => {
    await skipSplash(page)
    await page.goto('/')

    const sources = await page.evaluate(() =>
      [...new Set([...document.querySelectorAll('[data-wa-source]')].map((node) => node.getAttribute('data-wa-source')))].sort(),
    )

    expect(sources).toContain('nav')
    expect(sources).toContain('hero')
    expect(sources).toContain('builder')
  })

  test('a campaign link keeps its source when the visitor enquires', async ({ page }) => {
    await skipSplash(page)
    const tracked: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('/api/track')) tracked.push(request.postData() || '')
    })

    await page.goto('/?src=stall')
    await page.locator('a[data-wa-source="hero"]').click()
    await page.waitForTimeout(800)

    expect(tracked.join(' ')).toContain('hero|stall')
  })

  test('the trust strip states the delivery promise and the fine print', async ({ page }) => {
    await skipSplash(page)
    await page.goto('/')

    const facts = await page.locator('.studio-trust-list li').allTextContents()
    expect(facts.length).toBeGreaterThanOrEqual(3)
    expect(facts.join(' ')).toContain('Made to order')
    expect(facts.join(' ')).toContain('Hoskote')
    await expect(page.locator('.studio-trust-fine')).toBeVisible()
  })
})
