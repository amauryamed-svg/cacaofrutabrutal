import { useState, useEffect } from 'react'

export function useCountdown(seconds: number): string {
  const [time, setTime] = useState(seconds)

  useEffect(() => {
    if (time <= 0) return
    const t = setTimeout(() => setTime(t => t - 1), 1000)
    return () => clearTimeout(t)
  }, [time])

  const d = Math.floor(time / 86400)
  const h = Math.floor((time % 86400) / 3600)
  const m = Math.floor((time % 3600) / 60)
  const s = time % 60
  return `${d}d ${h}h ${m}m ${s}s`
}
