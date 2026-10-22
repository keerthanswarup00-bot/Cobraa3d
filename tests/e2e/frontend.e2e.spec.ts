import { test, expect } from '@playwright/test'

test.describe('Frontend', () => {
  test('shows three featured demos, a product catalogue, and direct product routes', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.studio-product-card')).toHaveCount(3)
    await expect(page.locator('.studio-view-all')).toHaveAttribute('href', '/products')
    await page.goto('/products')
    await expect(page.getByRole('heading', { level: 1, name: /Thoughtful design\./ })).toBeVisible()
    const cards = page.locator('.pc-card')
    if (!await cards.count()) {
      await expect(page.locator('.pc-empty')).toBeVisible()
      return
    }
    const detailLinks = page.locator('.pc-card a.pc-media')
    for (let index = 0; index < Math.min(3, await detailLinks.count()); index += 1) {
      const href = await detailLinks.nth(index).getAttribute('href')
      expect(href).toMatch(/^\/products\//)
      await page.goto(href || '/')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.locator('.detail-main-image img').or(page.locator('.detail-image-empty'))).toBeVisible()
      const enquiry = page.getByRole('link', { name: /Enquire on WhatsApp|Ask on WhatsApp/ }).first()
      await expect(enquiry).toHaveAttribute('href', /^https:\/\/wa\.me\//)
      const slug = (href || '').split('/').pop() || ''
      expect(new URL(await enquiry.getAttribute('href') || '').searchParams.get('text') || '').toContain(slug)
    }
  })

  test('can load homepage', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /Made in Hoskote\. Made to be yours\./ })).toBeVisible()
    await expect(page.locator('.studio-view-all')).toHaveAttribute('href', '/products')
    await page.getByRole('link', { name: 'Browse products' }).click()
    await expect(page).toHaveURL(/\/#products$/)
  })

  test('renders the branded layer-shift 404', async ({ page }) => {
    await page.goto('/this-page-does-not-exist')
    await expect(page.getByRole('heading', { name: /Layer shift\. This page didn’t print right/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Back to Cobraa 3D/i })).toHaveAttribute('href', '/')
  })

  test('renders without horizontal overflow at phone, tablet, and desktop widths', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1').first()).toBeVisible()
    await expect(page.locator('.studio-view-all')).toBeVisible()
    await expect.poll(() => page.locator('html').evaluate((element) => getComputedStyle(element).opacity)).toBe('1')
    for (const viewport of [{ width: 360, height: 740 }, { width: 390, height: 844 }, { width: 430, height: 932 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(viewport)
      const doesNotOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)
      expect(doesNotOverflow, `horizontal overflow at ${viewport.width}px`).toBe(true)
      await page.evaluate(() => document.fonts.ready)
      await page.screenshot({ path: `test-results/visual/home-${viewport.width}x${viewport.height}.png`, fullPage: true })
    }
  })

  test('/custom permanently redirects to the homepage custom brief', async ({ page }) => {
    await page.goto('/custom')
    await expect(page).toHaveURL(/\/#custom$/)
    await expect(page.getByRole('heading', { name: /Tell us the idea\./ })).toBeVisible()
  })

  test('product listing filters stay shareable and fit common screens', async ({ page }) => {
    await page.goto('/products')
    await expect(page.getByRole('heading', { level: 1, name: /Thoughtful design\./ })).toBeVisible()
    await page.getByRole('searchbox', { name: 'Search products' }).fill('stand')
    await expect(page).toHaveURL(/q=stand/)
    for (const viewport of [{ width: 360, height: 740 }, { width: 390, height: 844 }, { width: 430, height: 932 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(viewport)
      const doesNotOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)
      expect(doesNotOverflow, `product listing horizontal overflow at ${viewport.width}px`).toBe(true)
      await page.screenshot({ path: `test-results/visual/products-${viewport.width}x${viewport.height}.png`, fullPage: true })
    }
  })

  test('product sheet opens from a product card', async ({ page }) => {
    await page.goto('/products')
    const firstCard = page.locator('.pc-card').first()
    if (!await firstCard.count()) {
      test.skip(true, 'Requires at least one published product in Payload.')
    }
    const productTitle = await firstCard.locator('.pc-card-title').textContent()
    await firstCard.locator('a.pc-media').click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('heading', { name: productTitle || '' })).toBeVisible()
    await dialog.getByRole('button', { name: 'Close' }).click()
    await expect(dialog).not.toBeVisible()
  })


  test('minimal navigation and dedicated routes remain available', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Location' })).toHaveCount(0)
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Products' }).click()
    await expect(page).toHaveURL(/\/#products$/)
    await page.goto('/products')
    await expect(page.getByRole('heading', { level: 1, name: /Thoughtful design\./ })).toBeVisible()
    await page.goto('/painting-kits')
    await expect(page.getByRole('heading', { level: 1, name: /Thoughtful design\./ })).toBeVisible()
    await page.goto('/custom')
    await expect(page).toHaveURL(/\/#custom$/)
    await page.goto('/location')
    await expect(page.getByRole('heading', { name: 'Cobraa 3D' })).toBeVisible()
    await page.goto('/products')
    await expect(page.getByRole('heading', { level: 1, name: /Thoughtful design\./ })).toBeVisible()
    const cards = page.locator('.pc-card')
    if (await cards.count()) {
      const detailLink = cards.first().locator('a').first()
      const href = await detailLink.getAttribute('href')
      await page.goto(href || '/products')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    }
  })

  test('connect page showcase works with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/?src=qr')
    await expect(page.locator('h1').first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Browse products' })).toBeVisible()
    await expect(page.getByRole('heading', { name: /A little idea\. Layer by layer\./ })).toBeVisible()
    await expect(page.locator('.layer-showcase-control')).toBeVisible()
    const initialTransform = await page.locator('.layer-object').getAttribute('style')
    await page.locator('.layer-showcase-control').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('.layer-object')).not.toHaveAttribute('style', initialTransform || '')
    for (const viewport of [{ width: 360, height: 740 }, { width: 390, height: 844 }, { width: 430, height: 932 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
      await page.setViewportSize(viewport)
      const overflow = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth, elements: [...document.querySelectorAll<HTMLElement>('body *')].filter((node) => { const rect = node.getBoundingClientRect(); return rect.width > 0 && (rect.right > document.documentElement.clientWidth + 1 || rect.left < -1) }).slice(0, 8).map((node) => ({ tag: node.tagName, class: node.className, text: node.innerText?.slice(0, 40), right: Math.round(node.getBoundingClientRect().right) })) }))
      expect(overflow.width <= overflow.viewport, `connect page overflow at ${viewport.width}px: ${JSON.stringify(overflow)}`).toBe(true)
      await page.screenshot({ path: `test-results/visual/connect-${viewport.width}x${viewport.height}.png`, fullPage: true })
    }
  })
})
