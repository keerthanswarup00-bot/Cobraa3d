import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access/roles'
import { revalidateSiteGlobal } from '../hooks/revalidateSite'

const toggle = (name: string, description: string, defaultValue = true) => ({ name, type: 'checkbox' as const, defaultValue, admin: { description } })

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings', access: { read: () => true, update: isAdmin }, hooks: { afterChange: [revalidateSiteGlobal] },
  fields: [{ type: 'tabs', tabs: [
    { label: 'Brand and Hero', fields: [
      { name: 'brandName', type: 'text', defaultValue: 'Cobraa 3D', required: true }, { name: 'tagline', type: 'text' },
      { name: 'hero', type: 'group', fields: [
        { name: 'headline', type: 'text' }, { name: 'description', type: 'textarea' }, { name: 'primaryCtaLabel', type: 'text' },
        { name: 'secondaryCtaLabel', type: 'text' }, { name: 'featuredProducts', type: 'relationship', relationTo: 'products', hasMany: true },
      ] },
      { name: 'brandStory', type: 'richText' }, { name: 'studioPhotos', type: 'upload', relationTo: 'media', hasMany: true },
      { name: 'connectCopy', type: 'group', label: 'Connect page copy', fields: [
        { name: 'catalogueHeading', type: 'text', defaultValue: 'Find your next favourite.' },
        { name: 'catalogueDescription', type: 'textarea', defaultValue: 'Something playful, something thoughtful, or something made just for you.' },
        { name: 'paintingHeading', type: 'text', defaultValue: 'A little room for colour.' },
        { name: 'kidsKitDescription', type: 'text', defaultValue: 'Made to be coloured. Ready for imagination.' },
        { name: 'adultsKitDescription', type: 'text', defaultValue: 'Unplug. Create. Make it yours.' },
        { name: 'customHeading', type: 'text', defaultValue: 'Have an idea? Let’s print it.' },
        { name: 'customPrompt', type: 'text', defaultValue: 'Tell us your wild idea.' },
        { name: 'customNote', type: 'textarea', defaultValue: 'We’ll review the idea and confirm feasibility, material and cost with you.' },
        { name: 'bulkHeading', type: 'text', defaultValue: 'Something special for a group?' },
        { name: 'bulkDescription', type: 'textarea', defaultValue: 'Share the product, quantity, date and any personalisation you have in mind.' },
        { name: 'howHeading', type: 'text', defaultValue: 'From first thought to finished print.' },
        { name: 'howStepOneTitle', type: 'text', defaultValue: 'Discover' }, { name: 'howStepOneDescription', type: 'text', defaultValue: 'Find something you like or tell us your idea.' },
        { name: 'howStepTwoTitle', type: 'text', defaultValue: 'Ask us on WhatsApp' }, { name: 'howStepTwoDescription', type: 'text', defaultValue: 'Share details and any preferences.' },
        { name: 'howStepThreeTitle', type: 'text', defaultValue: 'Confirm the details' }, { name: 'howStepThreeDescription', type: 'text', defaultValue: 'We’ll confirm options, price and delivery or collection.' },
        { name: 'printBedHeading', type: 'text', defaultValue: 'On the print bed this week' }, { name: 'locationHeading', type: 'text', defaultValue: 'Meet the studio.' },
        { name: 'closingHeading', type: 'text', defaultValue: 'Your idea could be our next favourite print.' }, { name: 'closingCtaLabel', type: 'text', defaultValue: 'Let’s Create Something' },
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
    { label: 'Messages', fields: [{ name: 'messageTemplates', type: 'group', fields: [
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
      toggle('heroPrintReveal', 'Reveal the hero as if a print is in progress.'), toggle('contourField', 'Show subtle contour line art.'),
      toggle('scrollGauge', 'Show a small scroll progress indicator.'), toggle('filamentAccentPicker', 'Allow visitors to preview accent colours.'),
      toggle('nameplateStudio', 'Enable the nameplate designer.'), toggle('printBedFeed', 'Show recent print bed posts.'),
      toggle('modelViewer', 'Enable product GLB previews.'), toggle('surpriseMe', 'Show a random product discovery link.'),
      toggle('saveContactButton', 'Offer a downloadable contact card.'), toggle('tiltEffect', 'Enable gentle pointer tilt.', false),
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
