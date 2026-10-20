import { motion, useMotionValueEvent, useScroll, useSpring } from 'motion/react'
import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { APP_URL } from '@/lib/site'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '#features', label: 'Возможности' },
  { href: '#how', label: 'Как это работает' },
  { href: '#cards', label: 'Кредитные карты' },
  { href: '#faq', label: 'Вопросы' },
]

export function Navbar() {
  const { scrollY, scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 })
  const [scrolled, setScrolled] = useState(false)
  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 24))

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* Полоса прогресса прокрутки */}
      <motion.div style={{ scaleX: progress }} className="h-0.5 origin-left bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-300" />
      <div className="mx-auto max-w-6xl px-4 pt-3">
        <nav
          className={cn(
            'flex items-center gap-6 rounded-2xl px-4 py-2.5 transition-all duration-300',
            scrolled ? 'glass' : 'border border-transparent',
          )}
        >
          <a href="#top" className="flex items-center gap-2 font-semibold">
            <img src="/favicon.svg" alt="" className="size-7" />
            Финансы
          </a>
          <div className="hidden flex-1 items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} className="rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground">
                {l.label}
              </a>
            ))}
          </div>
          <Button asChild size="lg" className="ml-auto rounded-xl px-4 shadow-lg shadow-indigo-500/30">
            <a href={APP_URL}>
              Открыть трекер <ArrowRight data-icon="inline-end" />
            </a>
          </Button>
        </nav>
      </div>
    </header>
  )
}
