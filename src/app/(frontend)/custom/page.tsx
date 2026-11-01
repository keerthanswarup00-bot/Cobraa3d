import type { Metadata } from 'next'
import { getSiteSettings } from '@/utilities/getSiteSettings'
import { pageSocial } from '@/lib/siteMeta'
import { CustomHero } from '@/components/custom/CustomHero'
import { CustomOptions } from '@/components/custom/CustomOptions'
import { CustomSteps } from '@/components/custom/CustomSteps'
import { CustomClosing } from '@/components/custom/CustomClosing'
import styles from '@/components/custom/custom.module.css'

export const dynamic = 'force-dynamic'

const CUSTOM_TITLE = 'Custom 3D Prints | Cobraa 3D, Hoskote'
const CUSTOM_DESCRIPTION = 'Have an idea for a custom 3D print? Tell Cobraa 3D, a studio in Hoskote, Bengaluru, on WhatsApp. Made to order and shipped across India.'

export const metadata: Metadata = { title: CUSTOM_TITLE, description: CUSTOM_DESCRIPTION, alternates: { canonical: '/custom' }, ...pageSocial({ title: CUSTOM_TITLE, description: CUSTOM_DESCRIPTION, path: '/custom' }) }

export default async function CustomPage() {
  const settings = await getSiteSettings(0)

  return (
    <main className={`${styles.page} custom-page`}>
      <CustomHero whatsappNumber={settings.whatsappNumber} brandName={settings.brandName} />
      <CustomOptions whatsappNumber={settings.whatsappNumber} brandName={settings.brandName} />
      <CustomSteps />
      <CustomClosing whatsappNumber={settings.whatsappNumber} brandName={settings.brandName} />
    </main>
  )
}
