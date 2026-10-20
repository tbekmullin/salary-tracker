import { animate, motion, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { fadeUp, stagger } from '@/lib/motion'

const STATS = [
  { value: 6, suffix: '', label: 'разделов: дэшборд, аналитика, карты и другие' },
  { value: 12, suffix: ' мес', label: 'истории на графиках доходов и расходов' },
  { value: 5, suffix: '', label: 'валют, по умолчанию — узбекский сум' },
  { value: 30, suffix: '%', label: 'безопасная загрузка лимита — подскажем, если выше' },
]

function Counter({ to, suffix }: { to: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const reduce = useReducedMotion()
  const [value, setValue] = useState(reduce ? to : 0)

  useEffect(() => {
    if (!inView || reduce) return
    const controls = animate(0, to, { duration: 1.4, ease: 'easeOut', onUpdate: (v) => setValue(Math.round(v)) })
    return () => controls.stop()
  }, [inView, reduce, to])

  return (
    <span ref={ref} className="tabular-nums">
      {value}
      {suffix}
    </span>
  )
}

export function Stats() {
  return (
    <section className="px-4 py-16">
      <motion.div
        className="glass mx-auto grid max-w-6xl grid-cols-2 gap-6 rounded-3xl p-8 md:grid-cols-4"
        variants={stagger(0.1)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
      >
        {STATS.map((s) => (
          <motion.div key={s.label} variants={fadeUp} className="text-center">
            <div className="text-gradient text-4xl font-bold sm:text-5xl">
              <Counter to={s.value} suffix={s.suffix} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
