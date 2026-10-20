import { useEffect, useState } from 'react'
import { useReducedMotion, useTransform, type MotionValue, type Variants } from 'motion/react'

export const EASE = [0.2, 0.8, 0.2, 1] as const

/**
 * Параллакс: сдвиг по оси от -distance до +distance по мере прокрутки.
 * При включённом «уменьшении движения» в системе элемент стоит на месте.
 */
export function useParallax(progress: MotionValue<number>, distance: number, range: [number, number] = [0, 1]) {
  const reduce = useReducedMotion()
  return useTransform(progress, range, reduce ? [0, 0] : [-distance, distance])
}

/** Значение, которое при «уменьшении движения» остаётся конечным */
export function useScrollValue<T extends number | string>(
  progress: MotionValue<number>,
  input: number[],
  output: T[],
) {
  const reduce = useReducedMotion()
  const last = output[output.length - 1]
  return useTransform(progress, input, reduce ? output.map(() => last) : output)
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const media = window.matchMedia(query)
    const onChange = () => setMatches(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [query])
  return matches
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
}

export const stagger = (delay = 0.08): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: delay } },
})
