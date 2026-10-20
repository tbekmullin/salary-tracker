import { motion, useScroll, type MotionValue } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { BellRing, Gauge, HandCoins } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CreditCardMock } from '@/components/mock/CreditCardMock'
import { useMediaQuery, useScrollValue } from '@/lib/motion'
import { cn } from '@/lib/utils'

const CARDS = [
  { name: 'Humo Credit', bank: 'Hamkorbank', last4: '0937', debt: '3,54 млн', limit: '8 млн', util: 0.44, className: 'from-pink-500 to-rose-900' },
  { name: 'Visa Gold', bank: 'Kapitalbank', last4: '4821', debt: '2,54 млн', limit: '20 млн', util: 0.13, className: '' },
  { name: 'Mastercard', bank: 'Ipoteka Bank', last4: '7702', debt: '6,1 млн', limit: '8 млн', util: 0.76, className: 'from-teal-500 to-cyan-900' },
]

const POINTS = [
  { icon: Gauge, title: 'Загрузка лимита', text: 'Зелёный, жёлтый, красный — сразу видно, какая карта перегружена.' },
  { icon: BellRing, title: 'День платежа', text: 'Трекер напомнит за 5 дней и покажет, сколько внести.' },
  { icon: HandCoins, title: 'Погашения', text: 'Погашение уменьшает долг, но не считается расходом — без двойного учёта.' },
]

function FanCard({ progress, index, spread }: { progress: MotionValue<number>; index: number; spread: number }) {
  const offset = index - 1 // -1, 0, 1
  const x = useScrollValue(progress, [0.05, 0.45], [0, offset * spread])
  const y = useScrollValue(progress, [0.05, 0.45], [offset * 14, Math.abs(offset) * 34])
  const rotate = useScrollValue(progress, [0.05, 0.45], [offset * 4, offset * 12])
  const card = CARDS[index]
  return (
    <motion.div style={{ x, y, rotate, zIndex: 10 - Math.abs(offset) }} className="absolute">
      <CreditCardMock {...card} />
    </motion.div>
  )
}

export function CardsParallax() {
  const ref = useRef<HTMLElement>(null)
  const isWide = useMediaQuery('(min-width: 768px)')
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const [active, setActive] = useState(0)
  // Пункт списка подсвечивается по мере прокрутки: пока раскрывается веер — первый, дальше по очереди.
  // Прогресс считаем по положению секции: событие motion value при аппаратной анимации прокрутки
  // срабатывает не всегда.
  useEffect(() => {
    const update = () => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const v = Math.min(1, Math.max(0, -rect.top / (rect.height - window.innerHeight)))
      setActive(v < 0.45 ? 0 : v < 0.72 ? 1 : 2)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    // Высокая секция: содержимое «прилипает» к экрану, а прокрутка управляет анимацией
    <section id="cards" ref={ref} className="relative h-[260vh] scroll-mt-0">
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center gap-10 overflow-hidden px-4 pt-20 md:flex-row md:gap-16">
        <div className="max-w-md">
          <Badge variant="outline" className="rounded-full border-white/15 px-3 text-xs text-violet-200">
            Кредитные карты
          </Badge>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
            Все карты — <span className="text-gradient">в одном месте</span>
          </h2>
          <ul className="mt-8 space-y-3">
            {POINTS.map(({ icon: Icon, title, text }, i) => (
              <li
                key={title}
                className={cn(
                  'flex gap-3 rounded-2xl border p-4 transition-all duration-500',
                  i === active ? 'glass border-white/15 opacity-100' : 'border-transparent opacity-45',
                )}
              >
                <Icon className={cn('mt-0.5 size-5 shrink-0 transition-colors', i === active ? 'text-violet-300' : 'text-muted-foreground')} />
                <div>
                  <div className="font-semibold">{title}</div>
                  <div className="text-sm text-muted-foreground">{text}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex h-72 w-full max-w-xl items-center justify-center md:h-96">
          {CARDS.map((card, i) => (
            <FanCard key={card.last4} progress={scrollYProgress} index={i} spread={isWide ? 170 : 60} />
          ))}
        </div>
      </div>
    </section>
  )
}
