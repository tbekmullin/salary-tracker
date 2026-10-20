import { motion, useScroll } from 'motion/react'
import { useParallax } from '@/lib/motion'

/**
 * Фон страницы: сетка и цветные размытые пятна.
 * Пятна движутся с разной скоростью при прокрутке — так появляется глубина.
 */
export function Background() {
  const { scrollYProgress } = useScroll()
  const y1 = useParallax(scrollYProgress, 260)
  const y2 = useParallax(scrollYProgress, -380)
  const y3 = useParallax(scrollYProgress, 520)
  const y4 = useParallax(scrollYProgress, -200)

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-grid" />
      <motion.div style={{ y: y1 }} className="absolute -top-40 -left-40 size-[38rem] rounded-full bg-violet-600/30 blur-[120px]" />
      <motion.div style={{ y: y2 }} className="absolute top-1/4 -right-48 size-[34rem] rounded-full bg-cyan-500/20 blur-[120px]" />
      <motion.div style={{ y: y3 }} className="absolute top-[60%] left-1/4 size-[30rem] rounded-full bg-fuchsia-600/20 blur-[130px]" />
      <motion.div style={{ y: y4 }} className="absolute -bottom-40 -right-20 size-[36rem] rounded-full bg-indigo-600/25 blur-[120px]" />
    </div>
  )
}
