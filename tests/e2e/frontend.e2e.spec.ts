import { test, expect } from '@playwright/test'
import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

test.describe('Frontend', () => {
  test('shows featured products, a product catalogue, and direct product routes', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.home-product-section').first().locator('.studio-product-card')).toHaveCount(4)
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

  test('product cards navigate directly on desktop and open the preview sheet on phones', async ({ page, browser }) => {
    const payload = await getPayload({ config })
    const slug = 'preview-sheet-regression-product'
    const title = 'Preview Sheet Regression Product'
    const href = `/products/${slug}`
    const imageBytes = Buffer.from(
      '/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCABAAEADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFgEBAQEAAAAAAAAAAAAAAAAAAAYH/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AkAJFpAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/9k=',
      'base64',
    )
    const mediaIds: number[] = []
    let productId: number | undefined

    await payload.delete({
      collection: 'products',
      where: { slug: { equals: slug } },
      overrideAccess: true,
      context: { disableRevalidate: true },
    })

    const createImage = (name: string) =>
      payload.create({
        collection: 'media',
        overrideAccess: true,
        context: { disableRevalidate: true },
        data: { alt: `${title} ${name}` },
        file: { data: imageBytes, mimetype: 'image/jpeg', name: `${slug}-${name}.jpg`, size: imageBytes.length },
      })

    try {
      const firstImage = await createImage('front')
      const secondImage = await createImage('back')
      mediaIds.push(firstImage.id, secondImage.id)

      const product = await payload.create({
        collection: 'products',
        overrideAccess: true,
        context: { disableRevalidate: true },
        data: {
          title,
          slug,
          shortDescription: 'A published product used by the preview-sheet browser regression.',
          status: 'published',
          _status: 'published',
          priceMode: 'show',
          price: 125,
          currency: 'INR',
          isDemo: false,
          images: [
            { image: firstImage.id, alt: `${title} front` },
            { image: secondImage.id, alt: `${title} back` },
          ],
        },
      })
      productId = product.id

      // Desktop clicks skip the intercepted sheet and load the product page directly.
      await page.goto('/products')
      const desktopCard = page.locator(`.pc-card a.pc-media[href="${href}"]`)
      await expect(desktopCard).toBeVisible()
      await desktopCard.click()
      await expect(page).toHaveURL(new RegExp(`${href}$`))
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
      await expect(page.getByRole('dialog')).toHaveCount(0)

      const baseURL = test.info().project.use.baseURL || 'http://127.0.0.1:3100'
      const mobileContext = await browser.newContext({
        baseURL,
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        hasTouch: true,
        isMobile: true,
      })
      await mobileContext.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: baseURL })
      await mobileContext.addInitScript(() => {
        const calls: Array<{ title?: string; text?: string; url?: string }> = []
        ;(window as unknown as { __shareCalls: typeof calls }).__shareCalls = calls
        Object.defineProperty(navigator, 'share', {
          configurable: true,
          value: async (data: { title?: string; text?: string; url?: string }) => {
            calls.push(data)
          },
        })
      })

      try {
        const mobilePage = await mobileContext.newPage()
        await mobilePage.goto('/products')

        // Put the product card near the top and remember the listing offset.
        const scrollBefore = await mobilePage.evaluate((target) => {
          const link = document.querySelector<HTMLAnchorElement>(`.pc-card a.pc-media[href="${target}"]`)
          if (!link) return -1
          link.scrollIntoView({ block: 'center', behavior: 'instant' })
          const top = link.getBoundingClientRect().top + window.scrollY
          window.scrollTo({ top: Math.max(0, top - 120), left: 0, behavior: 'instant' })
          return window.scrollY
        }, href)
        expect(scrollBefore).toBeGreaterThan(0)

        // Count every sheet insertion and any skeleton that tries to mount.
        await mobilePage.evaluate(() => {
          const counts = { sheets: 0, skeletons: 0 }
          ;(window as unknown as { __previewInsertions: typeof counts }).__previewInsertions = counts
          const observer = new MutationObserver((records) => {
            for (const record of records) {
              for (const node of Array.from(record.addedNodes)) {
                if (!(node instanceof Element)) continue
                if (node.matches('[data-component="ProductSheet"]') || node.querySelector('[data-component="ProductSheet"]')) counts.sheets += 1
                if (node.matches('.psm-sheet') || node.querySelector('.psm-sheet')) counts.skeletons += 1
              }
            }
          })
          observer.observe(document.body, { childList: true, subtree: true })
        })

        // Use a DOM click so Playwright cannot scroll the page before opening.
        await mobilePage.evaluate((target) => {
          document.querySelector<HTMLAnchorElement>(`.pc-card a.pc-media[href="${target}"]`)?.click()
        }, href)

        const dialog = mobilePage.getByRole('dialog')
        await expect(dialog).toBeVisible()
        await expect(mobilePage.locator('[data-component="ProductSheet"]')).toHaveCount(1)
        await expect(mobilePage.getByRole('dialog')).toHaveCount(1)
        await expect(mobilePage.locator('.psm-sheet, .psm-backdrop, [data-skeleton]')).toHaveCount(0)
        await expect
          .poll(() => mobilePage.evaluate(() => (window as unknown as { __previewInsertions: { sheets: number; skeletons: number } }).__previewInsertions))
          .toEqual({ sheets: 1, skeletons: 0 })

        await expect(dialog.getByRole('heading', { name: title })).toBeVisible()
        await expect.poll(() => dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true)
        await expect(dialog.getByRole('button', { name: 'Close' })).toBeVisible()
        await expect(dialog.getByRole('button', { name: 'Share' })).toBeVisible()

        // The description comes from the product record and is never an empty line.
        const description = dialog.locator('.ps-desc')
        await expect(description).toBeVisible()
        await expect(description).toHaveText('A published product used by the preview-sheet browser regression.')

        // Layout: 18px title, the same-size green price, 14px description.
        await expect(dialog.locator('.ps-title')).toHaveCSS('font-size', '18px')
        await expect(dialog.locator('.ps-price')).toHaveCSS('font-size', '18px')
        await expect(dialog.locator('.ps-price')).toHaveCSS('color', 'rgb(37, 211, 102)')
        await expect(description).toHaveCSS('font-size', '14px')

        // Every hero overlay lives inside the media block.
        const hero = dialog.locator('.ps-media')
        await expect(hero.locator('.ps-handle')).toHaveCount(1)
        await expect(hero.locator('.ps-actions')).toHaveCount(1)
        await expect(hero.locator('.ps-dots')).toHaveCount(1)
        const handleBox = await hero.locator('.ps-handle').boundingBox()
        expect(handleBox?.width).toBeCloseTo(40, 0)
        expect(handleBox?.height).toBeCloseTo(4, 0)

        await expect(dialog.locator('.ps-gallery')).toHaveCSS('scroll-snap-type', 'x mandatory')
        await expect(dialog.locator('.ps-dots span')).toHaveCount(2)

        const order = dialog.getByRole('link', { name: 'Place order' })
        await expect(order).toHaveAttribute('href', /^https:\/\/wa\.me\//)
        const enquiry = new URL((await order.getAttribute('href')) || '')
        expect(enquiry.searchParams.get('text') || '').toContain(`${href}?v=`)
        const know = dialog.getByRole('link', { name: 'Know more' })
        await expect(know).toHaveAttribute('href', href)

        // Both actions are the same width and exactly 48px tall.
        const [knowBox, orderBox] = await Promise.all([know.boundingBox(), order.boundingBox()])
        expect(knowBox).not.toBeNull()
        expect(orderBox).not.toBeNull()
        expect(Math.abs((knowBox?.width || 0) - (orderBox?.width || 0))).toBeLessThanOrEqual(1)
        expect(Math.abs((knowBox?.height || 0) - 48)).toBeLessThanOrEqual(1)
        expect(Math.abs((orderBox?.height || 0) - 48)).toBeLessThanOrEqual(1)

        // Native share receives the product details.
        await dialog.getByRole('button', { name: 'Share' }).click()
        await expect
          .poll(() =>
            mobilePage.evaluate(
              () => (window as unknown as { __shareCalls: Array<{ title?: string; url?: string }> }).__shareCalls,
            ),
          )
          .toEqual([{ title, text: 'A published product used by the preview-sheet browser regression.', url: `${baseURL}${href}` }])

        // Without Web Share the sheet copies the link and shows the toast.
        await mobilePage.evaluate(() => {
          Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
        })
        await dialog.getByRole('button', { name: 'Share' }).click()
        await expect(dialog.locator('.ps-notice')).toHaveText('Link copied')
        await expect.poll(() => mobilePage.evaluate(() => navigator.clipboard.readText())).toBe(`${baseURL}${href}`)

        // The gallery scroll position drives the active dot.
        await dialog.locator('.ps-gallery').evaluate((element) => {
          element.scrollLeft = element.clientWidth
        })
        await expect(dialog.locator('.ps-dots span').nth(1)).toHaveAttribute('data-on', 'true')

        // Escape closes and returns to the catalogue at the previous offset.
        await mobilePage.keyboard.press('Escape')
        await expect(mobilePage.getByRole('dialog')).toHaveCount(0)
        await expect(mobilePage).toHaveURL(/\/products$/)
        await expect.poll(() => mobilePage.evaluate(() => window.scrollY)).toBe(scrollBefore)

        // Reopen, then "Know more" loads the full product page without the sheet.
        await mobilePage.evaluate((target) => {
          document.querySelector<HTMLAnchorElement>(`.pc-card a.pc-media[href="${target}"]`)?.click()
        }, href)
        const reopened = mobilePage.getByRole('dialog')
        await expect(reopened).toBeVisible()
        await reopened.getByRole('link', { name: 'Know more' }).click()
        await expect(mobilePage).toHaveURL(new RegExp(`${href}$`))
        await expect(mobilePage.getByRole('heading', { level: 1, name: title })).toBeVisible()
        await expect(mobilePage.getByRole('dialog')).toHaveCount(0)

        // A direct mobile visit or refresh always renders the full product page.
        await mobilePage.goto(href)
        await expect(mobilePage.getByRole('heading', { level: 1, name: title })).toBeVisible()
        await expect(mobilePage.getByRole('dialog')).toHaveCount(0)
      } finally {
        await mobileContext.close()
      }
    } finally {
      if (productId !== undefined) {
        await payload.delete({
          collection: 'products',
          id: productId,
          overrideAccess: true,
          context: { disableRevalidate: true },
        })
      }
      for (const id of mediaIds) {
        await payload.delete({
          collection: 'media',
          id,
          overrideAccess: true,
          context: { disableRevalidate: true },
        })
      }
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
