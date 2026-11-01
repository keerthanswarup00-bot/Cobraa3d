import Link from 'next/link'
import { ArrowRight, Nfc, QrCode, Type, type LucideIcon } from 'lucide-react'
import { buildWhatsAppUrl } from '@/lib/shared'
import { customMessage, type CustomMessageKind } from './customMessages'
import styles from './custom.module.css'

type Props = {
  whatsappNumber?: string | null
  brandName?: string | null
}

type CustomOption = {
  key: 'name' | 'nfc' | 'qr'
  title: string
  text: string
  message: CustomMessageKind
  icon: LucideIcon
  /** Phase 2 points this at the customiser. Null keeps the WhatsApp order link. */
  href: string | null
}

const OPTIONS: CustomOption[] = [
  {
    key: 'name',
    title: 'Name keychain',
    text: 'Your name or a short word, in the font and filament colour you choose.',
    message: 'name',
    icon: Type,
    href: null,
  },
  {
    key: 'nfc',
    title: 'NFC tag keychain',
    text: 'Tap a phone to open your link, WhatsApp, Instagram or review page.',
    message: 'nfc',
    icon: Nfc,
    href: null,
  },
  {
    key: 'qr',
    title: 'QR code keychain',
    text: 'A scannable code for a link, UPI ID or Wi-Fi, printed into the keychain.',
    message: 'qr',
    icon: QrCode,
    href: null,
  },
]

export function CustomOptions({ whatsappNumber, brandName }: Props) {
  const otherURL = buildWhatsAppUrl({
    number: whatsappNumber,
    message: customMessage('general', brandName),
  })

  return (
    <section className={styles.section} aria-labelledby="custom-options">
      <header className={styles.sectionHeader}>
        <h2 id="custom-options" className={styles.h2}>
          What do you want made?
        </h2>
        <p className={styles.sectionLede}>Pick a starting point, or tell us something else you have in mind.</p>
      </header>

      <ul className={styles.options}>
        {OPTIONS.map((option) => {
          const Icon = option.icon
          const whatsappURL = buildWhatsAppUrl({
            number: whatsappNumber,
            message: customMessage(option.message, brandName),
          })
          const target = option.href ?? whatsappURL

          return (
            <li key={option.key} className={styles.option} data-custom-option={option.key}>
              <span className={styles.optionIcon} aria-hidden="true">
                <Icon size={19} strokeWidth={1.7} />
              </span>
              <h3 className={styles.h3}>{option.title}</h3>
              <p className={styles.optionText}>{option.text}</p>
              {option.href ? (
                <Link className={styles.optionCta} href={option.href}>
                  Customise <ArrowRight size={15} aria-hidden="true" />
                </Link>
              ) : target ? (
                <a
                  className={styles.optionCta}
                  href={target}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Order on WhatsApp <ArrowRight size={15} aria-hidden="true" />
                </a>
              ) : (
                <span className={styles.ctaDisabled}>WhatsApp contact is not set up yet</span>
              )}
            </li>
          )
        })}
      </ul>

      <p className={styles.other}>
        Something else in mind? Logos, signs, holders, spare parts.{' '}
        {otherURL ? (
          <a href={otherURL} target="_blank" rel="noopener noreferrer">
            Tell us what you have in mind.
          </a>
        ) : (
          <span>Tell us what you have in mind.</span>
        )}
      </p>
      <p className={styles.studioLink}>
        Already know the name?{' '}
        <Link href="/custom/nameplate">Try the nameplate studio</Link> for a quick preview.
      </p>
    </section>
  )
}
