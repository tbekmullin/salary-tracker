import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import { useRef, type PointerEvent } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'
import { GithubIcon } from '@/components/GithubIcon'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DashboardMock } from '@/components/mock/DashboardMock'
import { CreditCardMock } from '@/components/mock/CreditCardMock'
import { DonutMock } from '@/components/mock/DonutMock'
import { EASE, useScrollValue } from '@/lib/motion'
import { APP_URL, GITHUB_URL } from '@/lib/site'

const TITLE = ['Деньги', 'под', 'контролем.', 'Без', 'таблиц.']

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()

  // Параллакс при прокрутке первого экрана
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const textY = useScrollValue(scrollYProgress, [0, 1], [0, 180])
  const textOpacity = useScrollValue(scrollYProgress, [0, 0.6], [1, 0])
  const mockY = useScrollValue(scrollYProgress, [0, 1], [0, 90])
  const mockRotate = useScrollValue(scrollYProgress, [0, 1], [18, 0])
  const cardY = useScrollValue(scrollYProgress, [0, 1], [0, -220])
  const donutY = useScrollValue(scrollYProgress, [0, 1], [0, -340])
  const chipY = useScrollValue(scrollYProgress, [0, 1], [0, -140])

  // Лёгкий наклон макета вслед за курсором
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const tiltX = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), { stiffness: 120, damping: 20 })
  const tiltY = useSpring(useTransform(mx, [-0.5, 0.5], [-8, 8]), { stiffness: 120, damping: 20 })
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (reduce || e.pointerType !== 'mouse') return
    const rect = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - rect.left) / rect.width - 0.5)
    my.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  return (
    <section id="top" ref={ref} onPointerMove={onPointerMove} className="relative px-4 pt-32 pb-24 sm:pt-40">
      <motion.div style={{ y: textY, opacity: textOpacity }} className="mx-auto max-w-4xl text-center">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
          <Badge variant="secondary" className="glass h-7 gap-1.5 rounded-full px-3 text-xs">
            <Sparkles className="text-violet-300" /> Аналитика, кредитные карты и облако
          </Badge>
        </motion.div>

        <h1 className="mt-6 text-5xl font-bold tracking-tight text-balance sm:text-7xl">
          {TITLE.map((word, i) => (
            <motion.span
              key={word + i}
              className={i >= 3 ? 'text-gradient inline-block' : 'inline-block'}
              initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.8, delay: 0.15 + i * 0.08, ease: EASE }}
            >
              {word}&nbsp;
            </motion.span>
          ))}
        </h1>

        <motion.p
          className="mx-auto mt-6 max-w-2xl text-lg text-pretty text-muted-foreground"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6, ease: EASE }}
        >
          Трекер доходов и расходов: графики, персональные рекомендации, лимиты по кредитным картам
          и синхронизация между устройствами. Валюта по умолчанию — сум.
        </motion.p>

        <motion.div
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.75, ease: EASE }}
        >
          <Button asChild className="h-12 rounded-xl px-6 text-base shadow-xl shadow-indigo-500/40">
            <a href={APP_URL}>
              Начать бесплатно <ArrowRight data-icon="inline-end" />
            </a>
          </Button>
          <Button asChild variant="outline" className="glass h-12 rounded-xl px-6 text-base">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">
              <GithubIcon data-icon="inline-start" /> Исходный код
            </a>
          </Button>
        </motion.div>
      </motion.div>

      {/* Макет приложения с параллаксом слоёв */}
      <div className="relative mx-auto mt-20 max-w-5xl [perspective:1400px]">
        <motion.div
          style={{ y: mockY, rotateX: mockRotate }}
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: EASE }}
          className="origin-top"
        >
          <motion.div style={{ rotateX: tiltX, rotateY: tiltY }} className="[transform-style:preserve-3d]">
            <DashboardMock />
          </motion.div>
        </motion.div>

        <motion.div style={{ y: cardY }} className="absolute top-40 -left-16 hidden lg:block">
          <motion.div initial={{ opacity: 0, x: -40, rotate: -14 }} animate={{ opacity: 1, x: 0, rotate: -8 }} transition={{ duration: 0.9, delay: 1, ease: EASE }}>
            <CreditCardMock name="Visa Gold" bank="Kapitalbank" last4="4821" debt="2,54 млн" limit="20 млн" util={0.13} />
          </motion.div>
        </motion.div>

        <motion.div style={{ y: donutY }} className="absolute -right-14 bottom-0 hidden lg:block">
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9, delay: 1.15, ease: EASE }}>
            <DonutMock />
          </motion.div>
        </motion.div>

        <motion.div style={{ y: chipY }} className="absolute -top-6 right-10 hidden md:block">
          <motion.div
            className="glass flex items-center gap-2 rounded-2xl px-4 py-3 text-sm"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 1.3, ease: EASE }}
          >
            <span className="text-lg">✅</span>
            <span>
              Норма сбережений <b className="text-emerald-400">52%</b>
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
