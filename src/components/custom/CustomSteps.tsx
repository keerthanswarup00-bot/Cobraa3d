import styles from './custom.module.css'

const STEPS = [
  {
    title: 'Tell us what you want',
    text: 'Pick a type above or message us with your idea, name, link or a reference image.',
  },
  {
    title: 'Confirm design and price',
    text: 'We send a preview and the price. Nothing is printed until you approve it.',
  },
  {
    title: 'We print and deliver',
    text: 'Printed in Hoskote, then handed over or shipped to you.',
  },
]

export function CustomSteps() {
  return (
    <section className={styles.section} aria-labelledby="custom-steps">
      <header className={styles.sectionHeader}>
        <h2 id="custom-steps" className={styles.h2}>
          How it works
        </h2>
      </header>
      <ol className={styles.steps}>
        {STEPS.map((step, index) => (
          <li key={step.title} className={styles.step}>
            <span className={styles.stepNo} aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div>
              <h3 className={styles.h3}>{step.title}</h3>
              <p className={styles.stepText}>{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
