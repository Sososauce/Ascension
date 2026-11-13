import { addDays, diffDays, weekStart } from './dates'
import type { Quest, StatKey } from './quests'

export type DayStatus = 'ouverte' | 'validee' | 'partielle' | 'ratee' | 'repos'
export type RestKind = 'repos' | 'vacances'

export interface DayRecord {
  date: string
  quests: Quest[]
  waterMl: number
  rest: RestKind | null
  status: DayStatus
  /** Vrai une fois la journée clôturée : elle ne bouge plus. */
  settled: boolean
}

export interface Progress {
  xp: number
  stats: Record<StatKey, number>
  streak: number
  bestStreak: number
  /** Premier jour du cycle de 66 jours en cours de comptage. */
  cycleStart: string
  /** Dernier jour clôturé. */
  lastSettled: string
  vacation: { from: string; to: string } | null
}

export const REST_DAYS_PER_WEEK = 2

export function initialProgress(today: string): Progress {
  return {
    xp: 0,
    stats: { force: 0, endurance: 0, discipline: 0, nutrition: 0 },
    streak: 0,
    bestStreak: 0,
    cycleStart: today,
    lastSettled: addDays(today, -1),
    vacation: null,
  }
}

// ——— XP et niveaux

/** XP nécessaire pour passer du niveau `level` au suivant. */
export function xpToNext(level: number): number {
  return 100 + (level - 1) * 40
}

export function levelInfo(xp: number): { level: number; into: number; need: number } {
  let level = 1
  let rest = Math.max(0, xp)
  while (rest >= xpToNext(level)) {
    rest -= xpToNext(level)
    level++
  }
  return { level, into: rest, need: xpToNext(level) }
}

/** Applique (direction +1) ou retire (direction −1) les gains d'une quête. L'XP ne descend jamais sous zéro. */
export function applyQuest(p: Progress, quest: Quest, direction: 1 | -1): Progress {
  return {
    ...p,
    xp: Math.max(0, p.xp + direction * quest.xp),
    stats: { ...p.stats, [quest.stat]: Math.max(0, p.stats[quest.stat] + direction * quest.statPoints) },
  }
}

// ——— Statut d'une journée

export function mainCounts(quests: Quest[]): { done: number; total: number } {
  const main = quests.filter((q) => !q.bonus)
  return { done: main.filter((q) => q.done).length, total: main.length }
}

/** Avec 5 quêtes : 4 ou 5 = validée, 2 ou 3 = partielle, 0 ou 1 = ratée. */
export function statusFor(done: number, total: number): 'validee' | 'partielle' | 'ratee' {
  if (total === 0) return 'ratee'
  if (done >= Math.ceil(total * 0.75)) return 'validee'
  if (done >= Math.ceil(total * 0.4)) return 'partielle'
  return 'ratee'
}

/** Combien de quêtes il manque pour valider la journée. */
export function missingToValidate(done: number, total: number): number {
  return Math.max(0, Math.ceil(total * 0.75) - done)
}

export function isVacation(p: Progress, date: string): boolean {
  return p.vacation !== null && diffDays(p.vacation.from, date) >= 0 && diffDays(date, p.vacation.to) >= 0
}

/** Clôture une journée : fixe son statut et met à jour streak et Discipline. Un jour de repos gèle tout. */
export function settleDay(p: Progress, record: DayRecord): { progress: Progress; record: DayRecord } {
  const rest: RestKind | null = record.rest ?? (isVacation(p, record.date) ? 'vacances' : null)
  if (rest) return { progress: { ...p, lastSettled: record.date }, record: { ...record, rest, status: 'repos', settled: true } }
  const { done, total } = mainCounts(record.quests)
  const status = statusFor(done, total)
  let { streak, bestStreak } = p
  let discipline = p.stats.discipline
  if (status === 'validee') {
    streak += 1
    bestStreak = Math.max(bestStreak, streak)
    discipline += 2 + (streak % 7 === 0 ? 3 : 0)
  } else if (status === 'partielle') {
    discipline += 1
  } else {
    streak = 0
  }
  return {
    progress: { ...p, streak, bestStreak, stats: { ...p.stats, discipline }, lastSettled: record.date },
    record: { ...record, status, settled: true },
  }
}

export interface SettleResult {
  progress: Progress
  /** Journées clôturées à enregistrer. */
  records: DayRecord[]
}

/**
 * Clôture toutes les journées passées non encore clôturées, jusqu'à la veille de `today`.
 * Une journée jamais ouverte est créée avec ses quêtes non faites (donc ratée, sauf repos ou vacances).
 */
export function settlePending(p: Progress, today: string, existing: (date: string) => DayRecord | undefined, makeQuests: (date: string) => Quest[]): SettleResult {
  let progress = p
  const records: DayRecord[] = []
  for (let date = addDays(p.lastSettled, 1); diffDays(date, today) > 0; date = addDays(date, 1)) {
    const base = existing(date) ?? { date, quests: makeQuests(date), waterMl: 0, rest: null, status: 'ouverte' as const, settled: false }
    if (base.settled) {
      progress = { ...progress, lastSettled: date }
      continue
    }
    const out = settleDay(progress, base)
    progress = out.progress
    records.push(out.record)
  }
  return { progress, records }
}

/** Jours de repos « simples » déjà posés dans la semaine de `date`. */
export function restUsedInWeek(records: DayRecord[], date: string): number {
  const start = weekStart(date)
  return records.filter((r) => r.rest === 'repos' && diffDays(start, r.date) >= 0 && diffDays(start, r.date) < 7).length
}
