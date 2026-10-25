import { test, expect } from '@playwright/test'
import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

test.describe('Frontend', () => {
  test('shows featured products, a product catalogue, and direct product routes', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.home-product-section').first().locator('.studio-product-card')).toHaveCount(3)
    await expect(page.locator('.home-product-section').first().locator('.studio-view-all')).toHaveAttribute('href', '/products')
    await page.goto('/products')
    await expect(page.locator('.pc-card')).toHaveCount(15)
    const detailLinks = page.locator('.pc-card a.pc-media')
    const hrefs: string[] = []
    for (let index = 0; index < 3; index += 1) {
      const href = await detailLinks.nth(index).getAttribute('href')
      expect(href).toMatch(/^\/products\//)
      hrefs.push(href || '/')
    }
    for (const href of hrefs) {
      await page.goto(href)
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
    await expect(page.locator('#home-title')).toBeVisible()
    await expect(page.locator('.home-product-section').first().locator('.studio-view-all')).toHaveAttribute('href', '/products')
    await page.getByRole('link', { name: /Browse products/ }).click()
    await expect(page).toHaveURL(/\/products$/)
  })

  test('renders the branded layer-shift 404', async ({ page }) => {
    await page.goto('/this-page-does-not-exist')
    await expect(page.getByRole('heading', { name: /Layer shift\. This page didn’t print right/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /Back to Cobraa 3D/i })).toHaveAttribute('href', '/')
  })

  test('renders without horizontal overflow at phone, tablet, and desktop widths', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1').first()).toBeVisible()
    await expect(page.locator('.home-product-section').first().locator('.studio-view-all')).toBeVisible()
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
    const whatsapp = page.getByRole('link', { name: 'Ask about this order' })
    if (await whatsapp.isVisible()) {
      const url = new URL(await whatsapp.getAttribute('href') || '')
      expect(url.searchParams.get('text')).toContain('Text: A & B')
      expect(url.searchParams.get('text')).toContain(`Font: ${font}`)
      expect(url.searchParams.get('text')).toContain(`Colour: ${colour}`)
    } else {
      await expect(page.getByRole('button', { name: 'WhatsApp contact not set' })).toBeDisabled()
    }
    await page.getByRole('button', { name: 'Add to my custom request' }).click()
    await expect(page.locator('#custom-enquiry-form textarea')).toHaveValue(`Nameplate: A & B\nFont: ${font}\nColour: ${colour}`)
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

  test('product-card navigation opens the preview sheet and full details bypasses interception', async ({ page }) => {
    const payload = await getPayload({ config })
    const slug = 'preview-sheet-regression-product'
    await payload.delete({
      collection: 'products',
      where: { slug: { equals: slug } },
      overrideAccess: true,
      context: { disableRevalidate: true },
    })
    const product = await payload.create({
      collection: 'products',
      overrideAccess: true,
      context: { disableRevalidate: true },
      data: {
        title: 'Preview Sheet Regression Product',
        slug,
        shortDescription: 'A published product used by the preview-sheet browser regression.',
        status: 'published',
        _status: 'published',
        priceMode: 'show',
        price: 125,
        currency: 'INR',
        isDemo: false,
      },
    })
    const href = `/products/${slug}`
    const title = 'Preview Sheet Regression Product'

    try {
      await page.goto('/products')
      const detailLink = page.locator(`.pc-card a.pc-media[href="${href}"]`)
      await expect(detailLink).toBeVisible()
      await detailLink.click()

      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible()
      await expect(dialog.getByRole('heading', { name: title })).toBeVisible()
      await expect.poll(() => dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true)
      await expect(dialog.getByRole('link', { name: 'Order on WhatsApp' })).toHaveAttribute('href', /^https:\/\/wa\.me\//)
      await expect(dialog.getByRole('link', { name: 'View details' })).toHaveAttribute('href', href)

      const enquiry = new URL(await dialog.getByRole('link', { name: 'Order on WhatsApp' }).getAttribute('href') || '')
      const message = enquiry.searchParams.get('text') || ''
      expect(message).toContain(`${href}?v=`)

      await dialog.getByRole('link', { name: 'View details' }).click()
      await expect(page).toHaveURL(new RegExp(`${href}$`))
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
      await expect(page.getByRole('dialog')).toHaveCount(0)

      await page.goto('/products')
      await page.locator(`.pc-card a.pc-media[href="${href}"]`).click()
      await expect(page.getByRole('dialog')).toBeVisible()
      await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click()
      await expect(page.getByRole('dialog')).toHaveCount(0)
    } finally {
      await payload.delete({
        collection: 'products',
        id: product.id,
        overrideAccess: true,
        context: { disableRevalidate: true },
      })
    }
  })


  test('minimal navigation and dedicated routes remain available', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Location' })).toHaveCount(0)
    await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Products' }).click()
    await expect(page).toHaveURL(/\/products$/)
    await expect(page.getByRole('heading', { level: 1, name: /Thoughtful design\./ })).toBeVisible()
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

  test('the simplified homepage honours reduced motion and the custom route still works', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/?src=qr')
    await expect(page.locator('#home-title')).toBeVisible()
    await expect(page.getByRole('link', { name: /Browse products/ })).toBeVisible()
    const motion = await page.locator('.home-hero').evaluate((node) => ({ animation: getComputedStyle(node).animationDuration, transition: getComputedStyle(node).transitionDuration }))
    expect(motion.animation).toBe('1e-05s')
    expect(motion.transition).toBe('1e-05s')
    await page.goto('/custom')
    await expect(page.getByRole('heading', { name: 'Custom orders' })).toBeVisible()
    for (const width of [375, 430, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 })
      const overflow = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth, elements: [...document.querySelectorAll<HTMLElement>('body *')].filter((node) => { const rect = node.getBoundingClientRect(); return rect.width > 0 && (rect.right > document.documentElement.clientWidth + 1 || rect.left < -1) }).slice(0, 8).map((node) => ({ tag: node.tagName, class: node.className, text: node.innerText?.slice(0, 40), right: Math.round(node.getBoundingClientRect().right) })) }))
      expect(overflow.width <= overflow.viewport, `custom page overflow at ${width}px: ${JSON.stringify(overflow)}`).toBe(true)
      await page.screenshot({ path: `test-results/visual/custom-${width}.png`, fullPage: true })
    }
  })
})
