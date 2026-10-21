import { test, expect } from '@playwright/test'

test.describe('Frontend', () => {
  test('shows three featured demos, a product catalogue, and direct product routes', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.connect-product-card')).toHaveCount(3)
    await expect(page.getByRole('link', { name: 'View all products' })).toHaveAttribute('href', '/products')
    await page.goto('/products')
    await expect(page.locator('.pc-card')).toHaveCount(15)
    const detailLinks = page.locator('.pc-card a.pc-media')
    for (let index = 0; index < 3; index += 1) {
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
    await expect(page.getByRole('link', { name: 'View all products' })).toHaveAttribute('href', '/products')
    await page.getByRole('link', { name: 'Explore products' }).click()
    await expect(page).toHaveURL(/#products$/)
  })

  test('renders the branded layer-shift 404', async ({ page }) => {
    await page.goto('/this-page-does-not-exist')
    await expect(page.getByRole('heading', { name: /Layer shift\. This page didn’t print right/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Back to Cobraa 3D/i })).toHaveAttribute('href', '/')
  })

  test('renders without horizontal overflow at phone, tablet, and desktop widths', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1').first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'View all products' })).toBeVisible()
    await expect.poll(() => page.locator('html').evaluate((element) => getComputedStyle(element).opacity)).toBe('1')
    for (const width of [375, 430, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      const doesNotOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)
      expect(doesNotOverflow, `horizontal overflow at ${width}px`).toBe(true)
      await page.evaluate(() => document.fonts.ready)
      await page.screenshot({ path: `test-results/visual/home-${width}.png`, fullPage: true })
    }
  })

  test('nameplate enquiry keeps the selected details in the custom request', async ({ page }) => {
    await page.goto('/custom')
    await page.locator('.custom-route-studio').scrollIntoViewIfNeeded()
    const textInput = page.getByLabel('Your text')
    await expect(textInput).toBeVisible()
    await textInput.fill('A & B')
    await page.getByLabel('Font').selectOption({ index: 0 })
    const font = await page.getByLabel('Font').inputValue()
    const colourButton = page.locator('.nameplate-swatches button').first()
    const colour = await colourButton.getAttribute('aria-label') || ''
    await colourButton.click()
    const whatsapp = page.getByRole('link', { name: 'Ask about this nameplate' })
    if (await whatsapp.isVisible()) {
      const url = new URL(await whatsapp.getAttribute('href') || '')
      expect(url.searchParams.get('text')).toContain('Nameplate text: A & B')
      expect(url.searchParams.get('text')).toContain(`Font: ${font}`)
      expect(url.searchParams.get('text')).toContain(`Colour: ${colour}`)
    } else {
      await expect(page.getByRole('button', { name: 'WhatsApp contact not set' })).toBeDisabled()
    }
    await page.getByRole('button', { name: 'Add to my custom request' }).click()
    await expect(page.locator('textarea')).toHaveValue(`Nameplate: A & B\nFont: ${font}\nColour: ${colour}`)
  })

  test('product listing filters stay shareable and fit common screens', async ({ page }) => {
    await page.goto('/products')
    await expect(page.getByRole('heading', { level: 1, name: /Thoughtful design\./ })).toBeVisible()
    await page.getByRole('searchbox', { name: 'Search products' }).fill('stand')
    await expect(page).toHaveURL(/q=stand/)
    for (const width of [375, 430, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      const doesNotOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)
      expect(doesNotOverflow, `product listing horizontal overflow at ${width}px`).toBe(true)
      await page.screenshot({ path: `test-results/visual/products-${width}.png`, fullPage: true })
    }
  })

  test('product sheet opens from a deep link hash', async ({ page }) => {
    await page.goto('/products#/p/minimalist-maroon-jewellery-stand')
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('heading', { name: 'Minimalist Maroon Jewellery Stand' })).toBeVisible()
    await dialog.getByRole('button', { name: 'Close' }).click()
    await expect(dialog).not.toBeVisible()
  })


  test('minimal navigation and dedicated routes remain available', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Location' })).toHaveCount(0)
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Products' }).click()
    await expect(page).toHaveURL(/\/products$/)
    await expect(page.getByRole('heading', { level: 1, name: /Thoughtful design\./ })).toBeVisible()
    await page.goto('/painting-kits')
    await expect(page.getByRole('heading', { name: 'Painting kits', exact: true })).toBeVisible()
    await page.goto('/custom')
    await expect(page.getByRole('heading', { name: 'Custom orders' })).toBeVisible()
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

  test('connect page showcase and custom route work with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/?src=qr')
    await expect(page.locator('h1').first()).toBeVisible()
    await expect(page.getByRole('link', { name: /explore products/i })).toBeVisible()
    await expect(page.getByRole('heading', { name: /A little idea\. Layer by layer\./ })).toBeVisible()
    await expect(page.locator('.layer-showcase-control')).toBeVisible()
    const initialTransform = await page.locator('.layer-object').getAttribute('style')
    await page.locator('.layer-showcase-control').focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('.layer-object')).not.toHaveAttribute('style', initialTransform || '')
    await page.goto('/custom')
    await expect(page.getByRole('heading', { name: 'Custom orders' })).toBeVisible()
    for (const width of [375, 430, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      const overflow = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth, elements: [...document.querySelectorAll<HTMLElement>('body *')].filter((node) => { const rect = node.getBoundingClientRect(); return rect.width > 0 && (rect.right > document.documentElement.clientWidth + 1 || rect.left < -1) }).slice(0, 8).map((node) => ({ tag: node.tagName, class: node.className, text: node.innerText?.slice(0, 40), right: Math.round(node.getBoundingClientRect().right) })) }))
      expect(overflow.width <= overflow.viewport, `connect page overflow at ${width}px: ${JSON.stringify(overflow)}`).toBe(true)
      await page.screenshot({ path: `test-results/visual/connect-${width}.png`, fullPage: true })
    }
  })
})
