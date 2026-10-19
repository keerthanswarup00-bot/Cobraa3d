import type { GlobalConfig } from 'payload'
import { isAdmin } from '../access/roles'
import { revalidateSiteGlobal } from '../hooks/revalidateSite'

const toggle = (name: string, description: string, defaultValue = true) => ({ name, type: 'checkbox' as const, defaultValue, admin: { description } })

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings', access: { read: () => true, update: isAdmin }, hooks: { afterChange: [revalidateSiteGlobal] },
  fields: [
    { name: 'brandName', type: 'text', defaultValue: 'Cobraa 3D', required: true }, { name: 'tagline', type: 'text' },
    { name: 'hero', type: 'group', fields: [
      { name: 'headline', type: 'text' }, { name: 'description', type: 'textarea' }, { name: 'primaryCtaLabel', type: 'text' },
      { name: 'secondaryCtaLabel', type: 'text' }, { name: 'featuredProducts', type: 'relationship', relationTo: 'products', hasMany: true },
    ] },
    { name: 'whatsappNumber', type: 'text', validate: (value: unknown) => value == null || value === '' || /^\d{8,15}$/.test(String(value)) || 'Enter digits only, including country code.' },
    { name: 'phone', type: 'text' }, { name: 'email', type: 'email' }, { name: 'instagram', type: 'text' },
    { name: 'socialLinks', type: 'array', fields: [{ name: 'label', type: 'text', required: true }, { name: 'url', type: 'text', required: true }, { name: 'icon', type: 'text' }] },
    { name: 'mapsUrl', type: 'text', label: 'Maps share link' }, { name: 'mapsEmbedUrl', type: 'text' }, { name: 'address', type: 'textarea' },
    { name: 'showFullAddress', type: 'checkbox', defaultValue: false }, { name: 'openingHours', type: 'textarea' }, { name: 'parentUrl', type: 'text' },
    { name: 'firstInHoskoteClaimEnabled', type: 'checkbox', defaultValue: false }, { name: 'brandStory', type: 'richText' },
    { name: 'studioPhotos', type: 'upload', relationTo: 'media', hasMany: true },
    { name: 'messageTemplates', type: 'group', fields: [
      { name: 'product', type: 'textarea', defaultValue: 'Hi, I would like to enquire about {{title}}. Price: {{price}}. {{url}}' },
      { name: 'custom', type: 'textarea' }, { name: 'bulk', type: 'textarea' }, { name: 'festive', type: 'textarea' },
      { name: 'nameplate', type: 'textarea', defaultValue: 'Hi, I would like to enquire about a custom nameplate.\n{{details}}' },
    ] },
    { name: 'seoDefaults', type: 'group', fields: [{ name: 'title', type: 'text' }, { name: 'description', type: 'textarea' }] },
    { name: 'ogImage', type: 'upload', relationTo: 'media' }, { name: 'analyticsId', type: 'text' },
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
    { name: 'productEnquiryCtaLabel', type: 'text', defaultValue: 'Ask on WhatsApp' },
  ],
}
