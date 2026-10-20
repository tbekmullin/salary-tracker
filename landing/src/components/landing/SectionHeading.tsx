import { motion } from 'motion/react'
import { Badge } from '@/components/ui/badge'
import { fadeUp, stagger } from '@/lib/motion'

type Props = { eyebrow: string; title: string; text?: string }

export function SectionHeading({ eyebrow, title, text }: Props) {
  return (
    <motion.div
      className="mx-auto max-w-2xl text-center"
      variants={stagger(0.1)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-100px' }}
    >
      <motion.div variants={fadeUp}>
        <Badge variant="outline" className="rounded-full border-white/15 px-3 text-xs text-violet-200">
          {eyebrow}
        </Badge>
      </motion.div>
      <motion.h2 variants={fadeUp} className="mt-4 text-3xl font-bold tracking-tight text-balance sm:text-5xl">
        {title}
      </motion.h2>
      {text && (
        <motion.p variants={fadeUp} className="mt-4 text-lg text-pretty text-muted-foreground">
          {text}
        </motion.p>
      )}
    </motion.div>
  )
}
