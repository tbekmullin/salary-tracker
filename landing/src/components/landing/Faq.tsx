import { motion } from 'motion/react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { fadeUp } from '@/lib/motion'
import { SectionHeading } from './SectionHeading'

const FAQ = [
  { q: 'Это бесплатно?', a: 'Да. Трекер бесплатный и без рекламы. Исходный код открыт на GitHub.' },
  { q: 'Где хранятся мои данные?', a: 'В облачной базе PostgreSQL (Neon) во Франкфурте, привязанной к вашему аккаунту. Пароли хранятся только в виде хеша — их не может прочитать даже владелец сервера.' },
  { q: 'Можно пользоваться с телефона и компьютера одновременно?', a: 'Да. Войдите в один аккаунт на обоих устройствах — изменения сохраняются автоматически, а если данные поменялись на другом устройстве, трекер покажет актуальную версию.' },
  { q: 'Нужно ли вводить номер кредитной карты?', a: 'Нет. Достаточно названия, лимита и дня платежа. Последние 4 цифры — по желанию, полный номер трекер не хранит.' },
  { q: 'Какие валюты поддерживаются?', a: 'Узбекский сум по умолчанию, а также доллар, евро, российский рубль и казахстанский тенге. Валюту можно сменить в настройках.' },
  { q: 'Можно выгрузить данные?', a: 'Да, в настройках есть экспорт и импорт в JSON. Аккаунт можно удалить вместе со всеми данными.' },
]

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 px-4 py-24">
      <SectionHeading eyebrow="Вопросы" title="Частые вопросы" />
      <motion.div
        className="glass mx-auto mt-12 max-w-3xl rounded-3xl px-6 py-2"
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
      >
        <Accordion type="single" collapsible defaultValue="item-0">
          {FAQ.map((item, i) => (
            <AccordionItem key={item.q} value={`item-${i}`} className="border-white/10">
              <AccordionTrigger className="py-5 text-base">{item.q}</AccordionTrigger>
              <AccordionContent className="text-base text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </section>
  )
}
