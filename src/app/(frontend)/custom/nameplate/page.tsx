import type { Metadata } from 'next'
import Link from 'next/link'
import { getSiteSettings } from '@/utilities/getSiteSettings'
import { pageSocial } from '@/lib/siteMeta'
import { LazyNameplateStudio } from '@/components/LazyNameplateStudio'
import { LazyEnquiryForm } from '@/components/LazyEnquiryForm'

export const dynamic = 'force-dynamic'

const NAMEPLATE_TITLE = 'Nameplate studio | Cobraa 3D, Hoskote'
const NAMEPLATE_DESCRIPTION = 'Preview a custom 3D printed nameplate, then send the details to Cobraa 3D on WhatsApp. Made to order in Hoskote, Bengaluru.'

export const metadata: Metadata = { title: NAMEPLATE_TITLE, description: NAMEPLATE_DESCRIPTION, alternates: { canonical: '/custom/nameplate' }, ...pageSocial({ title: NAMEPLATE_TITLE, description: NAMEPLATE_DESCRIPTION, path: '/custom/nameplate' }) }

export default async function NameplateStudioPage() {
  const settings = await getSiteSettings(2)

  return (
    <main className="store-page custom-page">
      <p className="section-eyebrow">MADE AROUND YOUR IDEA</p>
      <h1>Nameplate studio</h1>
      <p>{settings.connectCopy?.customPrompt || 'Tell us what you have in mind. We can discuss the details together.'}</p>
      <p>
        <Link className="bodyLink" href="/custom">
          ← Back to custom orders
        </Link>
      </p>
      <section className="custom-route-studio">
        <h2>Nameplate Studio</h2>
        <p>The preview is illustrative. Final options and price are confirmed with the studio.</p>
        <LazyNameplateStudio
          fonts={settings.nameplate?.allowedFonts || []}
          colours={settings.nameplate?.colours || []}
          maxCharacters={settings.nameplate?.maxCharacters || 20}
          startingFromNote={settings.nameplate?.startingFromNote}
          whatsappNumber={settings.whatsappNumber}
          calmMode={Boolean(settings.experience?.calmMode)}
        />
      </section>
      <section className="custom-route-form">
        <h2>Have another idea?</h2>
        <LazyEnquiryForm
          whatsappNumber={settings.whatsappNumber}
          source="other"
          messageTemplate={settings.messageTemplates?.custom}
        />
      </section>
    </main>
  )
}
