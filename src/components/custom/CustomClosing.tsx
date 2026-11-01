import { MessageCircle } from 'lucide-react'
import { buildWhatsAppUrl } from '@/lib/shared'
import { customMessage } from './customMessages'
import styles from './custom.module.css'

type Props = {
  whatsappNumber?: string | null
  brandName?: string | null
}

export function CustomClosing({ whatsappNumber, brandName }: Props) {
  const whatsappURL = buildWhatsAppUrl({
    number: whatsappNumber,
    message: customMessage('general', brandName),
  })

  return (
    <section className={styles.closing} aria-labelledby="custom-closing">
      <h2 id="custom-closing" className={styles.h2}>
        Have an idea? Send it over.
      </h2>
      <p className={styles.closingText}>
        A rough sketch or a photo is enough to start. We will tell you what is possible and what it costs.
      </p>
      {whatsappURL ? (
        <a className={styles.whatsapp} href={whatsappURL} target="_blank" rel="noopener noreferrer">
          <MessageCircle size={17} aria-hidden="true" />
          Message us on WhatsApp
        </a>
      ) : (
        <span className={styles.ctaDisabled}>WhatsApp contact is not set up yet</span>
      )}
    </section>
  )
}
