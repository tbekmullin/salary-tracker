import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { EASE } from '@/lib/motion'

const MONTHS = ['ноя', 'дек', 'янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт']
const INCOME = [62, 76, 64, 65, 88, 66, 67, 84, 69, 70, 78, 54]
const EXPENSE = [41, 37, 37, 38, 38, 39, 34, 38, 42, 43, 37, 32]

const KPI = [
  { label: 'Доходы', value: '10,65 млн сум', color: 'text-emerald-400', bar: 'bg-emerald-400' },
  { label: 'Расходы', value: '6,26 млн сум', color: 'text-rose-400', bar: 'bg-rose-400' },
  { label: 'Баланс', value: '+4,39 млн сум', color: 'text-sky-400', bar: 'bg-sky-400' },
]

const TABS = ['Дэшборд', 'Аналитика', 'Карты', 'Операции']

/** Упрощённая копия дэшборда трекера: шапка, KPI и график по месяцам */
export function DashboardMock({ className }: { className?: string }) {
  return (
    <div className={cn('glass overflow-hidden rounded-3xl', className)}>
      {/* шапка приложения */}
      <div className="flex items-center gap-3 border-b border-white/10 px-5 py-3">
        <div className="flex gap-1.5">
          <span className="size-3 rounded-full bg-rose-400/80" />
          <span className="size-3 rounded-full bg-amber-400/80" />
          <span className="size-3 rounded-full bg-emerald-400/80" />
        </div>
        <span className="ml-2 text-sm font-semibold">💰 Финансы</span>
        <div className="ml-4 hidden gap-1 sm:flex">
          {TABS.map((tab, i) => (
            <span
              key={tab}
              className={cn(
                'rounded-lg px-3 py-1 text-xs',
                i === 0 ? 'bg-primary text-primary-foreground shadow-lg shadow-indigo-500/30' : 'text-muted-foreground',
              )}
            >
              {tab}
            </span>
          ))}
        </div>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-2 rounded-full bg-emerald-400" />
          Сохранено
        </span>
      </div>

      <div className="space-y-4 p-5">
        {/* KPI */}
        <div className="grid grid-cols-3 gap-3">
          {KPI.map((k) => (
            <div key={k.label} className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-3">
              <span className={cn('absolute inset-y-0 left-0 w-1', k.bar)} />
              <div className="text-[10px] tracking-wider text-muted-foreground uppercase">{k.label}</div>
              <div className={cn('mt-1 truncate text-sm font-bold sm:text-lg', k.color)}>{k.value}</div>
            </div>
          ))}
        </div>

        {/* График по месяцам */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium">Доходы и расходы по месяцам</span>
            <span className="flex gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-emerald-400" />Доходы</span>
              <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-rose-400" />Расходы</span>
            </span>
          </div>
          <div className="flex h-36 items-end gap-1.5 sm:gap-2.5">
            {MONTHS.map((m, i) => (
              <div key={m} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-32 w-full items-end justify-center gap-0.5">
                  <motion.span
                    className="w-1/2 max-w-3 origin-bottom rounded-t-sm bg-emerald-400"
                    style={{ height: `${INCOME[i]}%` }}
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: 0.3 + i * 0.04, ease: EASE }}
                  />
                  <motion.span
                    className="w-1/2 max-w-3 origin-bottom rounded-t-sm bg-rose-400"
                    style={{ height: `${EXPENSE[i]}%` }}
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: 0.35 + i * 0.04, ease: EASE }}
                  />
                </div>
                <span className="text-[9px] text-muted-foreground">{m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Динамика баланса */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-2 text-sm font-medium">Динамика баланса</div>
          <svg viewBox="0 0 300 70" className="h-16 w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#38bdf8" stopOpacity="0.35" />
                <stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0 62 L40 60 L60 14 L120 14 L160 22 L200 26 L240 46 L300 46 L300 70 L0 70 Z" fill="url(#balanceFill)" />
            <motion.path
              d="M0 62 L40 60 L60 14 L120 14 L160 22 L200 26 L240 46 L300 46"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.6, delay: 0.5, ease: 'easeInOut' }}
            />
          </svg>
        </div>
      </div>
    </div>
  )
}
