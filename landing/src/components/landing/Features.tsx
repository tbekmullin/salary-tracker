import { motion } from 'motion/react'
import { Cloud, CreditCard, LayoutDashboard, ShieldCheck, Smartphone, Sparkles, type LucideIcon } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { fadeUp, stagger } from '@/lib/motion'
import { SectionHeading } from './SectionHeading'

const FEATURES: { icon: LucideIcon; title: string; text: string; color: string }[] = [
  { icon: LayoutDashboard, title: 'Дэшборд и графики', text: 'Доходы, расходы и баланс за любой период. Графики по месяцам, объёмная диаграмма категорий и динамика баланса.', color: 'from-indigo-500 to-violet-500' },
  { icon: Sparkles, title: 'Аналитика с советами', text: 'Норма сбережений, прогноз на месяц, правило 50/30/20 и рекомендации с конкретными суммами.', color: 'from-violet-500 to-fuchsia-500' },
  { icon: CreditCard, title: 'Кредитные карты', text: 'Лимиты, задолженность, доступный остаток и напоминание о дне платежа по каждой карте.', color: 'from-fuchsia-500 to-rose-500' },
  { icon: Cloud, title: 'Облако и синхронизация', text: 'Данные хранятся в аккаунте и доступны на любом устройстве. Сохраняются автоматически.', color: 'from-sky-500 to-cyan-400' },
  { icon: ShieldCheck, title: 'Безопасность', text: 'Пароли хранятся только в виде хеша, сессия — в защищённой cookie, защита от подбора пароля.', color: 'from-emerald-500 to-teal-400' },
  { icon: Smartphone, title: 'Удобно на телефоне', text: 'Адаптивный интерфейс в стиле стекла, светлая и тёмная тема, плавные переходы.', color: 'from-amber-500 to-orange-400' },
]

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 px-4 py-24">
      <SectionHeading
        eyebrow="Возможности"
        title="Всё, что нужно для личного бюджета"
        text="Без сложных таблиц: добавляйте операции, а трекер сам посчитает итоги и подскажет, где можно сэкономить."
      />
      <motion.div
        className="mx-auto mt-14 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3"
        variants={stagger(0.08)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
      >
        {FEATURES.map(({ icon: Icon, title, text, color }) => (
          <motion.div key={title} variants={fadeUp} whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
            <Card className="glass h-full gap-4 rounded-2xl border-0 py-6 ring-0">
              <CardHeader className="gap-3">
                <div className={`flex size-11 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
                  <Icon className="size-5 text-white" />
                </div>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed">{text}</CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
