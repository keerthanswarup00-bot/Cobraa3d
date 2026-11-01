import { getPayload } from 'payload'
import config from '@payload-config'
import type { Metadata } from 'next'
import { LazyNameplateStudio } from '@/components/LazyNameplateStudio'
import { LazyEnquiryForm } from '@/components/LazyEnquiryForm'
import { pageSocial } from '@/lib/siteMeta'
export const dynamic = 'force-dynamic'
const CUSTOM_TITLE = 'Custom 3D Prints | Cobraa 3D, Hoskote'
const CUSTOM_DESCRIPTION = 'Have an idea for a custom 3D print? Tell Cobraa 3D, a studio in Hoskote, Bengaluru, on WhatsApp. Made to order and shipped across India.'
export const metadata: Metadata = { title: CUSTOM_TITLE, description: CUSTOM_DESCRIPTION, alternates: { canonical: '/custom' }, ...pageSocial({ title: CUSTOM_TITLE, description: CUSTOM_DESCRIPTION, path: '/custom' }) }
export default async function CustomPage() {
  const payload = await getPayload({ config })
  const settings = await payload.findGlobal({ slug: 'site-settings', depth: 2 })
  return <main className="store-page custom-page"><p className="section-eyebrow">MADE AROUND YOUR IDEA</p><h1>Custom orders</h1><p>{settings.connectCopy?.customPrompt || 'Tell us what you have in mind. We can discuss the details together.'}</p><section className="custom-route-studio"><h2>Nameplate Studio</h2><p>The preview is illustrative. Final options and price are confirmed with the studio.</p><LazyNameplateStudio fonts={settings.nameplate?.allowedFonts || []} colours={settings.nameplate?.colours || []} maxCharacters={settings.nameplate?.maxCharacters || 20} startingFromNote={settings.nameplate?.startingFromNote} whatsappNumber={settings.whatsappNumber} calmMode={Boolean(settings.experience?.calmMode)} /></section><section className="custom-route-form"><h2>Have another idea?</h2><LazyEnquiryForm whatsappNumber={settings.whatsappNumber} source="other" messageTemplate={settings.messageTemplates?.custom} /></section></main>
}
