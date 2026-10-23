import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access/roles'
import { revalidateSiteGlobal } from '../hooks/revalidateSite'

const toggle = (name: string, description: string, defaultValue = true) => ({ name, type: 'checkbox' as const, defaultValue, admin: { description } })

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings', access: { read: () => true, update: isAdmin }, hooks: { afterChange: [revalidateSiteGlobal] },
  fields: [{ type: 'tabs', tabs: [
    { label: 'Brand and Hero', fields: [
      { name: 'brandName', type: 'text', defaultValue: 'Cobraa 3D', required: true }, { name: 'tagline', type: 'text' },
      { name: 'deliveryLine', type: 'text', defaultValue: 'Most small pieces ready in 1-2 days', admin: { description: 'Delivery promise shown in the home page trust strip.' } },
      { name: 'hero', type: 'group', fields: [
        { name: 'headline', type: 'text' }, { name: 'description', type: 'textarea' }, { name: 'primaryCtaLabel', type: 'text' },
        { name: 'secondaryCtaLabel', type: 'text' }, { name: 'featuredProducts', type: 'relationship', relationTo: 'products', hasMany: true },
      ] },
      { name: 'brandStory', type: 'richText' }, { name: 'studioPhotos', type: 'upload', relationTo: 'media', hasMany: true },
      { name: 'connectCopy', type: 'group', label: 'Connect page copy', fields: [
        { name: 'heroLede', type: 'textarea', defaultValue: "Type a name in any language, pick your colours and watch it take shape. Send us the brief on WhatsApp and we'll confirm price and timing." },
        { name: 'heroHint', type: 'text', defaultValue: 'Drag the piece sideways to turn it.' },
        { name: 'productsEyebrow', type: 'text', defaultValue: 'Made to order' },
        { name: 'productsSubline', type: 'textarea', defaultValue: 'Every piece is printed to order. Ask on WhatsApp and we’ll confirm colour and timing.' },
        { name: 'namePromise', type: 'text', defaultValue: 'Any name, any language. We check it prints well and confirm on WhatsApp.' },
        { name: 'catalogueHeading', type: 'text', defaultValue: 'Find your next favourite.' },
        { name: 'catalogueDescription', type: 'textarea', defaultValue: 'Something playful, something thoughtful, or something made just for you.' },
        { name: 'deliveryNote', type: 'text', defaultValue: 'Most small pieces ready in 1-2 days', admin: { description: 'Optional delivery note shown in the home page trust strip.' } },
        { name: 'paintingHeading', type: 'text', defaultValue: 'A little room for colour.', admin: { hidden: true } },
        { name: 'kidsKitDescription', type: 'text', defaultValue: 'Made to be coloured. Ready for imagination.' },
        { name: 'adultsKitDescription', type: 'text', defaultValue: 'Unplug. Create. Make it yours.' },
        { name: 'customHeading', type: 'text', defaultValue: 'Have an idea? Let’s print it.' },
        { name: 'customPrompt', type: 'text', defaultValue: 'Tell us your wild idea.' },
        { name: 'customNote', type: 'textarea', defaultValue: 'We’ll review the idea and confirm feasibility, material and cost with you.' },
        { name: 'bulkHeading', type: 'text', defaultValue: 'Something special for a group?', admin: { hidden: true } },
        { name: 'bulkDescription', type: 'textarea', defaultValue: 'Share the product, quantity, date and any personalisation you have in mind.', admin: { hidden: true } },
        { name: 'howHeading', type: 'text', defaultValue: 'From first thought to finished print.' },
        { name: 'howStepOneTitle', type: 'text', defaultValue: 'Shape your brief' }, { name: 'howStepOneDescription', type: 'text', defaultValue: 'Pick the piece, add your name or idea, choose your colours.' },
        { name: 'howStepTwoTitle', type: 'text', defaultValue: 'Confirm on WhatsApp' }, { name: 'howStepTwoDescription', type: 'text', defaultValue: 'Send it to us. We reply with feasibility, price and timing.' },
        { name: 'howStepThreeTitle', type: 'text', defaultValue: 'We print it' }, { name: 'howStepThreeDescription', type: 'text', defaultValue: 'Made to order in Hoskote, Bengaluru. Most small pieces ready in 1-2 days.' },
        { name: 'printBedHeading', type: 'text', defaultValue: 'On the print bed this week', admin: { hidden: true } }, { name: 'locationHeading', type: 'text', defaultValue: 'Meet the studio.' },
        { name: 'closingHeading', type: 'text', defaultValue: 'Your idea could be our next favourite print.' }, { name: 'closingCtaLabel', type: 'text', defaultValue: 'Let’s Create Something' },
      ] },
    ] },
    { label: 'Products page', fields: [
      { name: 'productsPage', type: 'group', label: 'Catalogue copy', admin: { description: 'Headline, filters and product sheet copy shown on the /products catalogue.' }, fields: [
        { name: 'eyebrow', type: 'text', defaultValue: 'Objects, made differently' },
        { name: 'heading', type: 'text', defaultValue: 'Thoughtful design.' },
        { name: 'headingAccent', type: 'text', defaultValue: 'Made in 3D.' },
        { name: 'searchPlaceholder', type: 'text', defaultValue: 'Search products…' },
        { name: 'filtersLabel', type: 'text', defaultValue: 'Filters', admin: { description: 'Button that opens the filters drawer on phones.' } },
        { name: 'maxPriceLabel', type: 'text', defaultValue: 'Max price' },
        { name: 'goodForLabel', type: 'text', defaultValue: 'Good for', admin: { description: 'Heading above the product tag checkboxes. Tags come from each product’s seasonal tags.' } },
        { name: 'resetLabel', type: 'text', defaultValue: 'Reset all' },
        { name: 'emptyTitle', type: 'text', defaultValue: 'Nothing matches that.' },
        { name: 'emptyBody', type: 'text', defaultValue: 'Try a different word or' },
        { name: 'emptyAction', type: 'text', defaultValue: 'reset the filters' },
        { name: 'noteLabel', type: 'text', defaultValue: 'Customisation or notes (optional)' },
        { name: 'notePlaceholder', type: 'text', defaultValue: 'Colour, name to print, size…' },
        { name: 'orderLabel', type: 'text', defaultValue: 'Order on WhatsApp' },
        { name: 'orderFooter', type: 'textarea', defaultValue: 'Please confirm availability and delivery time.', admin: { description: 'Closing line added to the WhatsApp order message.' } },
        { name: 'finePrint', type: 'textarea', defaultValue: "You'll confirm size, colour and delivery with us on WhatsApp. No payment is taken here." },
        { name: 'perPage', type: 'number', defaultValue: 15, min: 1, max: 48, admin: { description: 'Products shown per page in the catalogue grid.' } },
      ] },
    ] },
    { label: 'Contact and Social', fields: [
    { name: 'whatsappNumber', type: 'text', defaultValue: '916364224230', validate: (value: unknown) => value == null || value === '' || /^\d{8,15}$/.test(String(value)) || 'Enter digits only, including country code.' },
      { name: 'phone', type: 'text' }, { name: 'email', type: 'email' }, { name: 'instagram', type: 'text' },
      { name: 'socialLinks', type: 'array', fields: [{ name: 'label', type: 'text', required: true }, { name: 'url', type: 'text', required: true }, { name: 'icon', type: 'text' }] },
      { name: 'linkTests', type: 'ui', admin: { components: { Field: '@/components/SettingsLinkTests#SettingsLinkTests' } } },
    ] },
    { label: 'Location', fields: [
      { name: 'mapsUrl', type: 'text', label: 'Maps share link' }, { name: 'mapsEmbedUrl', type: 'text' }, { name: 'address', type: 'textarea' },
      { name: 'showFullAddress', type: 'checkbox', defaultValue: false }, { name: 'openingHours', type: 'textarea' },
    ] },
    { label: 'Messages', fields: [
    // Keep the original column during local SQLite schema sync; the value is
    // copied into messageTemplates.product after the additive sync completes.
    { name: 'productMessageTemplate', type: 'textarea', admin: { hidden: true } },
    { name: 'messageTemplates', type: 'group', fields: [
      { name: 'product', type: 'textarea', defaultValue: 'Hi, I would like to enquire about {{title}}. Price: {{price}}. {{url}}' },
      { name: 'custom', type: 'textarea', defaultValue: 'Hi, I have an idea for a custom 3D print. {{details}}' },
      { name: 'bulk', type: 'textarea', defaultValue: 'Hi, I would like to discuss a bulk order. Product: {{product}}. Quantity: {{quantity}}. Date: {{date}}. Personalisation: {{personalisation}}.' },
      { name: 'festive', type: 'textarea' },
      { name: 'nameplate', type: 'textarea', defaultValue: 'Hi, I would like to enquire about a custom nameplate.\n{{details}}' },
    ] }, { name: 'messagePreview', type: 'ui', admin: { components: { Field: '@/components/MessageTemplatePreview#MessageTemplatePreview' } } }] },
    { label: 'SEO and Sharing', fields: [
      { name: 'seoDefaults', type: 'group', fields: [{ name: 'title', type: 'text' }, { name: 'description', type: 'textarea' }] },
      { name: 'ogImage', type: 'upload', relationTo: 'media' },
    ] },
    { label: 'Experience', fields: [
      { name: 'experience', type: 'group', fields: [
      { ...toggle('heroPrintReveal', 'Reveal the hero as if a print is in progress.'), admin: { hidden: true } }, { ...toggle('contourField', 'Show subtle contour line art.'), admin: { hidden: true } },
      { ...toggle('scrollGauge', 'Show a small scroll progress indicator.'), admin: { hidden: true } }, toggle('filamentAccentPicker', 'Allow visitors to preview accent colours.'),
      toggle('nameplateStudio', 'Enable the nameplate designer.'), { ...toggle('printBedFeed', 'Show recent print bed posts.'), admin: { hidden: true } },
      { ...toggle('modelViewer', 'Enable product GLB previews.'), admin: { hidden: true } }, { ...toggle('surpriseMe', 'Show a random product discovery link.'), admin: { hidden: true } },
      { ...toggle('saveContactButton', 'Offer a downloadable contact card.'), admin: { hidden: true } }, { ...toggle('tiltEffect', 'Enable gentle pointer tilt.', false), admin: { hidden: true } },
      toggle('calmMode', 'Turn off all non-essential motion.', false),
      ] },
      { name: 'vcard', type: 'group', fields: [
      { name: 'displayName', type: 'text' }, { name: 'organisation', type: 'text' }, { name: 'phone', type: 'text' },
      { name: 'email', type: 'email' }, { name: 'website', type: 'text' }, { name: 'photo', type: 'upload', relationTo: 'media' }, { name: 'note', type: 'textarea' },
      ] },
      { name: 'nameplate', type: 'group', fields: [
      { name: 'allowedFonts', type: 'array', defaultValue: [{ font: 'Sans' }, { font: 'Serif' }], fields: [{ name: 'font', type: 'text', required: true }] },
      { name: 'colours', type: 'array', defaultValue: [{ name: 'Black', hex: '#080808' }, { name: 'White', hex: '#FFFFFF' }], fields: [{ name: 'name', type: 'text', required: true }, { name: 'hex', type: 'text', required: true }] },
      { name: 'maxCharacters', type: 'number', defaultValue: 20, min: 1 }, { name: 'startingFromNote', type: 'text' },
      ] },
    ] },
    { label: 'Advanced', fields: [
      { name: 'parentUrl', type: 'text' }, { name: 'firstInHoskoteClaimEnabled', type: 'checkbox', defaultValue: false },
      { name: 'analyticsId', type: 'text' }, { name: 'productEnquiryCtaLabel', type: 'text', defaultValue: 'Ask on WhatsApp' },
    ] },
  ] }],
}
