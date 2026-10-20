import { motion, useScroll } from 'motion/react'
import { useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { GithubIcon } from '@/components/GithubIcon'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useParallax, useScrollValue } from '@/lib/motion'
import { APP_URL, GITHUB_URL } from '@/lib/site'

const YEAR = new Date().getFullYear()

export function CallToAction() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const glowY = useParallax(scrollYProgress, 80)
  const scale = useScrollValue(scrollYProgress, [0, 0.45], [0.92, 1])

  return (
    <section ref={ref} className="px-4 pt-12 pb-16">
      <motion.div style={{ scale }} className="glass relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] px-6 py-16 text-center sm:px-12">
        <motion.div style={{ y: glowY }} aria-hidden className="pointer-events-none absolute -top-24 left-1/2 size-[30rem] -translate-x-1/2 rounded-full bg-indigo-500/40 blur-[110px]" />
        <div className="relative">
          <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-5xl">
            Начните вести бюджет <span className="text-gradient">сегодня</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Регистрация занимает полминуты. Данные из браузера перенесутся в аккаунт автоматически.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild className="h-12 rounded-xl px-6 text-base shadow-xl shadow-indigo-500/40">
              <a href={APP_URL}>
                Открыть трекер <ArrowRight data-icon="inline-end" />
              </a>
            </Button>
          </div>
        </div>
      </motion.div>

      <footer className="mx-auto mt-16 max-w-6xl">
        <Separator className="bg-white/10" />
        <div className="flex flex-wrap items-center justify-between gap-4 py-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <img src="/favicon.svg" alt="" className="size-5" /> Финансы · {YEAR}
          </span>
          <div className="flex gap-5">
            <a href={APP_URL} className="hover:text-foreground">Трекер</a>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-foreground">
              <GithubIcon className="size-4" /> GitHub
            </a>
          </div>
        </div>
      </footer>
    </section>
  )
}
