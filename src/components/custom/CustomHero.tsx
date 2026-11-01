import { MessageCircle } from 'lucide-react'
import { buildWhatsAppUrl } from '@/lib/shared'
import { customMessage } from './customMessages'
import styles from './custom.module.css'

type Props = {
  whatsappNumber?: string | null
  brandName?: string | null
}

export function CustomHero({ whatsappNumber, brandName }: Props) {
  const whatsappURL = buildWhatsAppUrl({
    number: whatsappNumber,
    message: customMessage('general', brandName),
  })

  return (
    <section className={styles.hero} aria-labelledby="custom-title">
      <p className={styles.eyebrow}>Made to order · Hoskote, Bengaluru</p>
      <h1 id="custom-title" className={styles.title}>
        Custom 3D prints, made for you
      </h1>
      <p className={styles.lede}>
        Name keychains, NFC tags, QR codes and one-off objects, printed to order in our Hoskote studio.
      </p>
      <div className={styles.heroActions}>
        {whatsappURL ? (
          <a
            className={styles.whatsapp}
            href={whatsappURL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={17} aria-hidden="true" />
            Contact for custom 3D printed objects
          </a>
        ) : (
          <span className={styles.ctaDisabled}>WhatsApp contact is not set up yet</span>
        )}
      </div>
      <p className={styles.heroNote}>Send your idea or a reference image. We reply with what is possible, the price and the timing.</p>
    </section>
  )
}
