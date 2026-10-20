import { motion, useScroll, type MotionValue } from 'motion/react'
import { useRef } from 'react'
import { Database, KeyRound, Lock, Rocket, ServerCog, ShieldCheck, Zap } from 'lucide-react'
import { useScrollValue } from '@/lib/motion'
import { SectionHeading } from './SectionHeading'

const ROW_1 = [
  { icon: Database, label: 'PostgreSQL в Neon' },
  { icon: Rocket, label: 'Хостинг на Vercel' },
  { icon: ServerCog, label: 'Серверные функции во Франкфурте' },
  { icon: Zap, label: 'Автосохранение за 0,7 с' },
]
const ROW_2 = [
  { icon: KeyRound, label: 'Хеширование паролей scrypt' },
  { icon: Lock, label: 'HttpOnly + Secure cookie' },
  { icon: ShieldCheck, label: 'Защита от подбора пароля' },
  { icon: ShieldCheck, label: 'Content Security Policy' },
]

function Row({ items, x }: { items: typeof ROW_1; x: MotionValue<string> }) {
  // Список повторён, чтобы лента не обрывалась при сдвиге
  const repeated = [...items, ...items, ...items]
  return (
    <motion.div style={{ x }} className="flex w-max gap-4">
      {repeated.map(({ icon: Icon, label }, i) => (
        <div key={label + i} className="glass flex items-center gap-2 rounded-full px-5 py-3 text-sm whitespace-nowrap">
          <Icon className="size-4 text-violet-300" />
          {label}
        </div>
      ))}
    </motion.div>
  )
}

/** Две ленты технологий, которые едут в разные стороны при прокрутке */
export function TechMarquee() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const x1 = useScrollValue<string>(scrollYProgress, [0, 1], ['0%', '-33%'])
  const x2 = useScrollValue<string>(scrollYProgress, [0, 1], ['-33%', '0%'])

  return (
    <section ref={ref} className="overflow-hidden py-24">
      <SectionHeading
        eyebrow="Надёжность"
        title="Ваши данные — только ваши"
        text="Современная облачная инфраструктура и проверенные практики безопасности."
      />
      <div className="mt-14 space-y-4 [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
        <Row items={ROW_1} x={x1} />
        <Row items={ROW_2} x={x2} />
      </div>
    </section>
  )
}
