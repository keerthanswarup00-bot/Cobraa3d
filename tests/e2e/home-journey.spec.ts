import { test, expect, devices } from '@playwright/test'

const { defaultBrowserType: _defaultBrowserType, ...PIXEL_5 } = devices['Pixel 5']
test.use({ ...PIXEL_5, hasTouch: true })

async function skipSplash(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    try { sessionStorage.setItem('cobraa-splash', '1') } catch {}
  })
}

test.describe('Homepage product journey', () => {
  test('shows the requested sections in order and a 70/30 product gallery peek', async ({ page }) => {
    await skipSplash(page)
    await page.goto('/')

    const sequence = await page.evaluate(() => {
      const main = document.querySelector('main.home-rework')!
      const nodes = [...main.querySelectorAll(':scope > section, :scope > footer')]
      return nodes.map((node) => {
        if (node.matches('.home-hero')) return 'hero'
        if (node.matches('.home-product-section')) return node.querySelector('h2')?.textContent?.trim() || 'products'
        if (node.matches('.home-custom-teaser')) return 'custom idea'
        if (node.matches('.home-info')) return 'information'
        if (node.matches('.home-reviews')) return 'reviews'
        if (node.matches('.home-about')) return 'about'
        if (node.matches('.home-footer')) return 'footer'
        return 'other'
      })
    })
    expect(sequence[0]).toBe('hero')
    expect(sequence.indexOf('custom idea')).toBeGreaterThan(sequence.indexOf('Featured products'))
    expect(sequence.indexOf('information')).toBeGreaterThan(sequence.indexOf('custom idea'))
    expect(sequence.indexOf('reviews')).toBeGreaterThan(sequence.indexOf('information'))
    expect(sequence.indexOf('about')).toBeGreaterThan(sequence.indexOf('reviews'))
    expect(sequence.at(-1)).toBe('footer')

    const cardCounts = await page.locator('.home-product-section .studio-product-grid').evaluateAll((grids) => grids.map((grid) => grid.querySelectorAll('.studio-product-card').length))
    expect(cardCounts[0]).toBe(4)
    for (const count of cardCounts) expect(count).toBeLessThanOrEqual(4)
    const featured = page.locator('.home-product-section').first()
    await expect(featured.getByRole('heading', { name: 'Warm Ghost Lamp' })).toBeAttached()
    await expect(featured.getByRole('heading', { name: 'Autumn Jack-o’-Lantern Lamp' })).toBeAttached()

    const gallery = page.locator('.home-product-section').first().locator('.studio-product-grid')
    const peek = await gallery.evaluate((node) => {
      const card = node.querySelector('.studio-product-card')!
      return { card: card.getBoundingClientRect().width, viewport: node.getBoundingClientRect().width, scrollable: node.scrollWidth > node.clientWidth }
    })
    expect(peek.card / peek.viewport).toBeGreaterThanOrEqual(.69)
    expect(peek.card / peek.viewport).toBeLessThanOrEqual(.75)
    expect(peek.scrollable).toBe(true)
  })

  test('uses the provided About copy and keeps all ten reviews controllable', async ({ page }) => {
    await skipSplash(page)
    await page.goto('/')

    const about = page.locator('.home-about')
    await expect(about.getByRole('heading', { name: 'About Cobraa 3D' })).toBeVisible()
    await expect(about.getByText('At Cobraa 3D, we turn creativity into something you can touch!', { exact: false })).toBeVisible()
    await expect(about.locator('a, button')).toHaveCount(0)

    const reviews = page.locator('.home-reviews')
    await expect(reviews.locator('.home-review-card')).toHaveCount(10)
    await expect(reviews.getByText('Priya', { exact: true })).toBeVisible()
    const pause = reviews.getByRole('button', { name: 'Pause reviews' })
    await pause.click()
    await expect(reviews.getByRole('button', { name: 'Play reviews' })).toHaveAttribute('aria-pressed', 'true')
    const track = reviews.locator('.home-reviews-track')
    const before = await track.evaluate((node) => node.scrollLeft)
    await reviews.getByRole('button', { name: 'Next review' }).click()
    await expect.poll(() => track.evaluate((node) => node.scrollLeft)).toBeGreaterThan(before)
  })

  test('product enquiry links open clean product-specific WhatsApp messages', async ({ page }) => {
    await skipSplash(page)
    await page.goto('/')

    const askLink = page.locator('.home-product-section .studio-product-ask').first()
    await expect(askLink).toBeVisible()
    const href = await askLink.getAttribute('href')
    expect(href).toMatch(/^https:\/\/wa\.me\//)
    const parsed = new URL(href!)
    const message = parsed.searchParams.get('text') || ''
    const title = await askLink.locator('xpath=ancestor::article').locator('h3').textContent()
    expect(message).toContain(title?.trim())
    expect(message).toContain('/products/')
    await expect(askLink).toHaveAttribute('target', '_blank')
    await expect(askLink).toHaveAttribute('rel', /noopener/)
  })

  test('category view-more links preserve the selected category in the catalogue URL', async ({ page }) => {
    await skipSplash(page)
    await page.goto('/')

    const categorySections = page.locator('.home-product-section').filter({ has: page.locator('.home-eyebrow', { hasText: /Explore by category|More to explore/ }) })
    const count = await categorySections.count()
    for (let index = 0; index < count; index += 1) {
      const section = categorySections.nth(index)
      const viewMore = section.locator('.studio-view-all')
      const categorySlug = await section.getAttribute('data-category-slug')
      await expect(viewMore).toHaveAttribute('href', `/products?category=${encodeURIComponent(categorySlug || '')}`)
    }
  })

  test('the NFC keychain remains a future concept and is not presented as orderable', async ({ page }) => {
    await skipSplash(page)
    await page.goto('/')

    const teaser = page.locator('#custom')
    await expect(teaser.getByRole('heading', { name: 'NFC keychain' })).toBeVisible()
    await expect(teaser.getByText('Coming later')).toBeVisible()
    await expect(teaser.locator('a, button')).toHaveCount(0)
  })
})
