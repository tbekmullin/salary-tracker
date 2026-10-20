import { cn } from '@/lib/utils'

type Props = {
  name: string
  bank: string
  last4: string
  debt: string
  limit: string
  util: number
  className?: string
}

/** Банковская карта в стиле вкладки «Карты» трекера */
export function CreditCardMock({ name, bank, last4, debt, limit, util, className }: Props) {
  const level = util >= 0.7 ? 'bg-rose-300' : util >= 0.3 ? 'bg-amber-300' : 'bg-emerald-300'
  return (
    <div
      className={cn(
        'relative w-72 overflow-hidden rounded-2xl border border-white/30 p-5 text-white shadow-2xl shadow-indigo-950/60',
        'bg-gradient-to-br from-indigo-500 to-indigo-900',
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-16 -bottom-24 size-56 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_100%_0%,rgba(255,255,255,.28),transparent_55%)]" />
      <div className="relative">
        <div className="font-semibold">{name}</div>
        <div className="text-xs text-white/75">{bank}</div>
        <div className="mt-4 flex items-center gap-3 font-mono text-sm tracking-[0.2em]">
          <span className="h-6 w-8 rounded-md bg-gradient-to-br from-amber-200 to-amber-500" />
          •••• {last4}
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-xs text-white/75">Долг</span>
          <span className="text-xl font-bold">{debt}</span>
          <span className="text-xs text-white/75">из {limit}</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/25">
          <div className={cn('h-full rounded-full', level)} style={{ width: `${Math.round(util * 100)}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-xs text-white/80">
          <span>Загрузка лимита</span>
          <span className="font-semibold">{Math.round(util * 100)}%</span>
        </div>
      </div>
    </div>
  )
}
