/** Dates de jeu au format "AAAA-MM-JJ". Tous les calculs se font en UTC pour éviter les décalages horaires. */

const MS_DAY = 86_400_000

function toUtc(date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

function fromUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

/** Jour de jeu en cours : avant l'heure de clôture, on est encore la veille. */
export function gameDate(now: Date, closeHour: number): string {
  const shifted = new Date(now.getTime() - closeHour * 3_600_000)
  const y = shifted.getFullYear()
  const m = String(shifted.getMonth() + 1).padStart(2, '0')
  const d = String(shifted.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(date: string, n: number): string {
  return fromUtc(toUtc(date) + n * MS_DAY)
}

/** Nombre de jours de `from` à `to` (positif si `to` est après). */
export function diffDays(from: string, to: string): number {
  return Math.round((toUtc(to) - toUtc(from)) / MS_DAY)
}

/** 0 = lundi … 6 = dimanche. */
export function dayIndex(date: string): number {
  return (new Date(toUtc(date)).getUTCDay() + 6) % 7
}

/** Lundi de la semaine de `date`. */
export function weekStart(date: string): string {
  return addDays(date, -dayIndex(date))
}

export const CYCLE_DAYS = 66

/** Position dans le cycle de 66 jours : jour (1 à 66), semaine (1 à 10), numéro de cycle (1, 2…). */
export function cyclePosition(cycleStart: string, date: string): { day: number; week: number; cycle: number } {
  const elapsed = Math.max(0, diffDays(cycleStart, date))
  const day = (elapsed % CYCLE_DAYS) + 1
  return { day, week: Math.ceil(day / 7), cycle: Math.floor(elapsed / CYCLE_DAYS) + 1 }
}
