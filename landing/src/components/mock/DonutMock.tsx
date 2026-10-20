import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

const SEGMENTS = [
  { label: 'Жильё', value: 42, color: '#ef4444' },
  { label: 'Продукты', value: 26, color: '#f97316' },
  { label: 'Транспорт', value: 14, color: '#eab308' },
  { label: 'Развлечения', value: 11, color: '#ec4899' },
  { label: 'Прочее', value: 7, color: '#64748b' },
]

const R = 42
const C = 2 * Math.PI * R
// Сегменты кольца: длина дуги и смещение от начала окружности
const ARCS = SEGMENTS.map((s, i) => ({
  ...s,
  length: (s.value / 100) * C,
  offset: (SEGMENTS.slice(0, i).reduce((sum, x) => sum + x.value, 0) / 100) * C,
}))

/** Кольцевая диаграмма расходов по категориям */
export function DonutMock({ className }: { className?: string }) {
  return (
    <div className={cn('glass w-64 rounded-2xl p-4', className)}>
      <div className="mb-3 text-sm font-medium">Расходы по категориям</div>
      <div className="flex items-center gap-4">
        {/* pathLength в motion переопределяет dasharray, поэтому анимируем всю диаграмму целиком */}
        <motion.svg
          viewBox="0 0 100 100"
          className="size-24 drop-shadow-[0_6px_10px_rgba(0,0,0,.4)]"
          initial={{ rotate: -200, scale: 0.6, opacity: 0 }}
          whileInView={{ rotate: -90, scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {ARCS.map((s) => (
            <circle
              key={s.label}
              cx="50"
              cy="50"
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth="14"
              strokeDasharray={`${s.length} ${C - s.length}`}
              strokeDashoffset={-s.offset}
            />
          ))}
        </motion.svg>
        <ul className="space-y-1 text-xs text-muted-foreground">
          {SEGMENTS.map((s) => (
            <li key={s.label} className="flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ background: s.color }} />
              {s.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
