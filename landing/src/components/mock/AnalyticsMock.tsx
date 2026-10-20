import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { EASE } from '@/lib/motion'

const RECS = [
  { icon: '⚠️', title: 'Выросли траты: Развлечения', text: '770 тыс сум против 227 тыс в среднем — установите лимит', tone: 'border-amber-400 bg-amber-400/10' },
  { icon: '✅', title: 'Отличная норма сбережений', text: 'Вы сохранили 52% дохода — 8,09 млн сум', tone: 'border-emerald-400 bg-emerald-400/10' },
  { icon: '💡', title: 'Доход зависит от одного источника', text: '91% дохода — «Зарплата». Добавьте второй источник', tone: 'border-sky-400 bg-sky-400/10' },
]

const SPLIT = [
  { label: 'Необходимое', value: 44, target: '≤ 50%', color: 'bg-sky-400' },
  { label: 'Желания', value: 4, target: '≤ 30%', color: 'bg-amber-400' },
  { label: 'Сбережения', value: 52, target: '≥ 20%', color: 'bg-emerald-400' },
]

/** Вкладка «Аналитика»: рекомендации и правило 50/30/20 */
export function AnalyticsMock({ className }: { className?: string }) {
  return (
    <div className={cn('glass grid gap-4 rounded-3xl p-5 md:grid-cols-[1.3fr_1fr]', className)}>
      <div className="space-y-2.5">
        <div className="text-sm font-medium">Рекомендации</div>
        {RECS.map((r, i) => (
          <motion.div
            key={r.title}
            className={cn('flex gap-3 rounded-xl border-l-4 p-3', r.tone)}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.12, ease: EASE }}
          >
            <span className="text-lg leading-none">{r.icon}</span>
            <div>
              <div className="text-sm font-semibold">{r.title}</div>
              <div className="text-xs text-muted-foreground">{r.text}</div>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm font-medium">Правило 50/30/20</div>
        <div className="my-4 flex h-4 overflow-hidden rounded-full bg-white/10">
          {SPLIT.map((s, i) => (
            <motion.span
              key={s.label}
              className={cn('h-full', s.color)}
              initial={{ width: 0 }}
              whileInView={{ width: `${s.value}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 + i * 0.15, ease: EASE }}
            />
          ))}
        </div>
        <ul className="space-y-2.5">
          {SPLIT.map((s) => (
            <li key={s.label} className="flex items-center gap-2 text-sm">
              <span className={cn('size-2.5 rounded-full', s.color)} />
              <span className="flex-1">{s.label}</span>
              <span className="font-semibold">{s.value}%</span>
              <span className="w-14 text-right text-xs text-muted-foreground">{s.target}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
