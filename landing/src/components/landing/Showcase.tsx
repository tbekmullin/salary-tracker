import { motion, useScroll } from 'motion/react'
import { useRef, useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DashboardMock } from '@/components/mock/DashboardMock'
import { AnalyticsMock } from '@/components/mock/AnalyticsMock'
import { CreditCardMock } from '@/components/mock/CreditCardMock'
import { EASE, useScrollValue } from '@/lib/motion'
import { SectionHeading } from './SectionHeading'

const VIEWS = {
  dashboard: { label: 'Дэшборд', render: () => <DashboardMock /> },
  analytics: { label: 'Аналитика', render: () => <AnalyticsMock /> },
  cards: {
    label: 'Карты',
    render: () => (
      <div className="glass flex flex-wrap items-center justify-center gap-6 rounded-3xl p-8">
        <CreditCardMock name="Visa Gold" bank="Kapitalbank" last4="4821" debt="2,54 млн" limit="20 млн" util={0.13} />
        <CreditCardMock name="Humo Credit" bank="Hamkorbank" last4="0937" debt="3,54 млн" limit="8 млн" util={0.44} className="from-pink-500 to-rose-900" />
      </div>
    ),
  },
} as const

type View = keyof typeof VIEWS

export function Showcase() {
  const ref = useRef<HTMLDivElement>(null)
  const [view, setView] = useState<View>('dashboard')

  // Макет «выпрямляется» и увеличивается при въезде в экран
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] })
  const rotateX = useScrollValue(scrollYProgress, [0, 1], [28, 0])
  const scale = useScrollValue(scrollYProgress, [0, 1], [0.86, 1])
  const opacity = useScrollValue(scrollYProgress, [0, 0.5], [0.3, 1])

  return (
    <section className="px-4 py-24">
      <SectionHeading
        eyebrow="Интерфейс"
        title="Красиво. Понятно. На стекле."
        text="Glassmorphism, плавные анимации и графики, которые читаются с первого взгляда."
      />

      <div className="mt-10 flex justify-center">
        <Tabs value={view} onValueChange={(v) => setView(v as View)}>
          <TabsList className="glass h-11 rounded-xl p-1">
            {(Object.keys(VIEWS) as View[]).map((key) => (
              <TabsTrigger key={key} value={key} className="rounded-lg px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                {VIEWS[key].label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div ref={ref} className="mx-auto mt-10 max-w-5xl [perspective:1400px]">
        <motion.div style={{ rotateX, scale, opacity }} className="origin-bottom">
          {/* Все макеты лежат в одной ячейке сетки: высота блока не меняется при переключении,
              поэтому страница не «прыгает» */}
          <div className="grid items-center">
            {(Object.keys(VIEWS) as View[]).map((key) => {
              const active = key === view
              return (
                <motion.div
                  key={key}
                  aria-hidden={!active}
                  className={active ? 'col-start-1 row-start-1' : 'pointer-events-none col-start-1 row-start-1'}
                  initial={false}
                  animate={active
                    ? { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }
                    : { opacity: 0, y: 24, scale: 0.98, filter: 'blur(6px)' }}
                  transition={{ duration: 0.45, ease: EASE }}
                >
                  {VIEWS[key].render()}
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
