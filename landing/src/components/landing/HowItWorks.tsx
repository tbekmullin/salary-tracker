import { motion, useScroll } from 'motion/react'
import { useRef } from 'react'
import { BarChart3, UserPlus, Wallet } from 'lucide-react'
import { EASE, useScrollValue } from '@/lib/motion'
import { SectionHeading } from './SectionHeading'

const STEPS = [
  { icon: UserPlus, title: 'Создайте аккаунт', text: 'Email и пароль — и всё. Если вы уже вели учёт в браузере, трекер предложит перенести данные.' },
  { icon: Wallet, title: 'Добавляйте операции', text: 'Доход или расход, категория, сумма и способ оплаты — наличные или кредитная карта.' },
  { icon: BarChart3, title: 'Смотрите итоги и советы', text: 'Графики обновятся сразу, а аналитика подскажет, где траты выросли и сколько стоит отложить.' },
]

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null)
  // Линия между шагами заполняется по мере прокрутки
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 75%', 'end 55%'] })
  const fill = useScrollValue(scrollYProgress, [0, 1], [0, 1])

  return (
    <section id="how" className="scroll-mt-20 px-4 py-24">
      <SectionHeading eyebrow="Как это работает" title="Три шага до полной картины" />
      <div ref={ref} className="relative mx-auto mt-16 max-w-3xl">
        <div className="absolute top-0 bottom-0 left-6 w-0.5 rounded-full bg-white/10 sm:left-1/2 sm:-translate-x-1/2" />
        <motion.div
          style={{ scaleY: fill }}
          className="absolute top-0 bottom-0 left-6 w-0.5 origin-top rounded-full bg-gradient-to-b from-indigo-400 via-violet-400 to-cyan-300 sm:left-1/2 sm:-translate-x-1/2"
        />
        <ol className="space-y-14">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className={`relative flex items-start gap-6 sm:w-1/2 ${i % 2 ? 'sm:ml-auto sm:pl-12' : 'sm:pr-12 sm:text-right sm:flex-row-reverse'}`}>
              <motion.div
                className={`relative z-10 flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-indigo-500/40 sm:absolute sm:top-0 ${i % 2 ? 'sm:-left-6' : 'sm:-right-6'}`}
                initial={{ scale: 0.4, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true, margin: '-120px' }}
                transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              >
                <Icon className="size-5 text-white" />
              </motion.div>
              <motion.div
                className="glass flex-1 rounded-2xl p-5"
                initial={{ opacity: 0, x: i % 2 ? 40 : -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-120px' }}
                transition={{ duration: 0.7, ease: EASE }}
              >
                <div className="text-xs font-semibold tracking-wider text-violet-300 uppercase">Шаг {i + 1}</div>
                <h3 className="mt-1 text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-muted-foreground">{text}</p>
              </motion.div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
