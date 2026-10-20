import { MotionConfig } from 'motion/react'
import { Background } from '@/components/landing/Background'
import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { Stats } from '@/components/landing/Stats'
import { Features } from '@/components/landing/Features'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { Showcase } from '@/components/landing/Showcase'
import { CardsParallax } from '@/components/landing/CardsParallax'
import { TechMarquee } from '@/components/landing/TechMarquee'
import { Faq } from '@/components/landing/Faq'
import { CallToAction } from '@/components/landing/CallToAction'

export default function App() {
  return (
    // reducedMotion="user": при «уменьшении движения» в системе анимации трансформаций отключаются
    <MotionConfig reducedMotion="user">
      <Background />
      <Navbar />
      <main className="overflow-x-clip">
        <Hero />
        <Stats />
        <Features />
        <HowItWorks />
        <Showcase />
        <CardsParallax />
        <TechMarquee />
        <Faq />
        <CallToAction />
      </main>
    </MotionConfig>
  )
}
