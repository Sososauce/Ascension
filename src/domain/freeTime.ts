import type { Profile } from './types'

/** Temps incompressible pour les repas et l'hygiène, en minutes par jour. */
export const BASE_MINUTES = 120
const DAY = 24 * 60

/** "HH:MM" -> minutes depuis minuit. Renvoie NaN si le format est invalide. */
export function parseTime(hhmm: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim())
  if (!m) return NaN
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return NaN
  return h * 60 + min
}

/** Durée entre deux heures, en passant minuit si besoin (23:30 -> 07:00 = 450 min). */
export function durationBetween(start: string, end: string): number {
  const a = parseTime(start)
  const b = parseTime(end)
  if (Number.isNaN(a) || Number.isNaN(b)) return 0
  return (((b - a) % DAY) + DAY) % DAY
}

export function sleepMinutes(p: Profile): number {
  return durationBetween(p.bedtime, p.wake)
}

/** Temps libre d'un jour de la semaine (0 = lundi), en minutes, jamais négatif. */
export function freeMinutesForDay(p: Profile, dayIndex: number): number {
  const day = p.days[dayIndex]
  const work = day.worked ? durationBetween(p.workStart, p.workEnd) : 0
  const commute = day.worked && !day.remote ? p.commuteMinutes : 0
  const obligations = day.worked ? p.obligationsWorkday : p.obligationsWeekend
  const free = DAY - sleepMinutes(p) - work - commute - BASE_MINUTES - obligations
  return Math.max(0, free)
}

export interface FreeTimeSummary {
  /** 7 valeurs en minutes, lundi en premier. */
  perDay: number[]
  /** Moyenne des jours travaillés, ou null s'il n'y en a aucun. */
  workdayAverage: number | null
  /** Moyenne des jours non travaillés, ou null s'il n'y en a aucun. */
  restdayAverage: number | null
}

export function freeTimeSummary(p: Profile): FreeTimeSummary {
  const perDay = p.days.map((_, i) => freeMinutesForDay(p, i))
  const avg = (worked: boolean) => {
    const values = perDay.filter((_, i) => p.days[i].worked === worked)
    if (values.length === 0) return null
    return Math.round(values.reduce((s, v) => s + v, 0) / values.length)
  }
  return { perDay, workdayAverage: avg(true), restdayAverage: avg(false) }
}

/** Durée de séance conseillée selon le temps libre du jour (en minutes). */
export function sessionMinutes(freeMinutes: number): number {
  if (freeMinutes < 60) return 20
  if (freeMinutes < 120) return 30
  if (freeMinutes <= 180) return 45
  return 60
}

/** 260 -> "4 h 20" ; 45 -> "45 min". */
export function formatMinutes(total: number): string {
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return `${m} min`
  return `${h} h ${String(m).padStart(2, '0')}`
}
