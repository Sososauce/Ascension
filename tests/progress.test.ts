import { describe, expect, it } from 'vitest'
import { applyQuest, initialProgress, isVacation, levelInfo, mainCounts, missingToValidate, restUsedInWeek, settleDay, settlePending, statusFor, xpToNext, type DayRecord } from '../src/domain/progress'
import type { Quest } from '../src/domain/quests'

const quest = (id: string, done: boolean, bonus = false): Quest => ({ id, kind: 'meal', title: id, detail: '', xp: 20, stat: 'nutrition', statPoints: 1, done, bonus })
const day = (date: string, doneCount: number, extra: Partial<DayRecord> = {}): DayRecord => ({
  date,
  quests: [...[0, 1, 2, 3, 4].map((i) => quest(`q${i}`, i < doneCount)), quest('bonus', false, true)],
  waterMl: 0,
  rest: null,
  status: 'ouverte',
  settled: false,
  ...extra,
})

describe('XP et niveaux', () => {
  it('demande 100 XP pour le niveau 2, puis 40 de plus à chaque niveau', () => {
    expect(xpToNext(1)).toBe(100)
    expect(xpToNext(2)).toBe(140)
    expect(levelInfo(0)).toEqual({ level: 1, into: 0, need: 100 })
    expect(levelInfo(99)).toEqual({ level: 1, into: 99, need: 100 })
    expect(levelInfo(100)).toEqual({ level: 2, into: 0, need: 140 })
    expect(levelInfo(250)).toEqual({ level: 3, into: 10, need: 180 })
  })
  it('ajoute puis retire exactement les gains d\'une quête', () => {
    const start = initialProgress('2026-11-13')
    const after = applyQuest(start, quest('a', true), 1)
    expect(after.xp).toBe(20)
    expect(after.stats.nutrition).toBe(1)
    expect(applyQuest(after, quest('a', true), -1)).toEqual(start)
  })
  it('ne passe jamais sous zéro', () => {
    const p = applyQuest(initialProgress('2026-11-13'), quest('a', true), -1)
    expect(p.xp).toBe(0)
    expect(p.stats.nutrition).toBe(0)
  })
})

describe('statut d\'une journée', () => {
  it('avec 5 quêtes : 4-5 validée, 2-3 partielle, 0-1 ratée', () => {
    expect([0, 1, 2, 3, 4, 5].map((n) => statusFor(n, 5))).toEqual(['ratee', 'ratee', 'partielle', 'partielle', 'validee', 'validee'])
  })
  it('ne compte pas les quêtes bonus', () => {
    const d = day('2026-11-13', 3)
    d.quests[5].done = true
    expect(mainCounts(d.quests)).toEqual({ done: 3, total: 5 })
  })
  it('dit combien de quêtes il manque', () => {
    expect(missingToValidate(2, 5)).toBe(2)
    expect(missingToValidate(4, 5)).toBe(0)
  })
})

describe('clôture d\'une journée', () => {
  const p0 = initialProgress('2026-11-13')
  it('validée : streak +1 et Discipline +2', () => {
    const { progress, record } = settleDay(p0, day('2026-11-13', 4))
    expect(record.status).toBe('validee')
    expect(record.settled).toBe(true)
    expect(progress.streak).toBe(1)
    expect(progress.bestStreak).toBe(1)
    expect(progress.stats.discipline).toBe(2)
    expect(progress.lastSettled).toBe('2026-11-13')
  })
  it('partielle : streak inchangée, Discipline +1', () => {
    const { progress, record } = settleDay({ ...p0, streak: 5, bestStreak: 5 }, day('2026-11-13', 3))
    expect(record.status).toBe('partielle')
    expect(progress.streak).toBe(5)
    expect(progress.stats.discipline).toBe(1)
  })
  it('ratée : streak remise à zéro, record conservé', () => {
    const { progress, record } = settleDay({ ...p0, streak: 9, bestStreak: 9 }, day('2026-11-13', 1))
    expect(record.status).toBe('ratee')
    expect(progress.streak).toBe(0)
    expect(progress.bestStreak).toBe(9)
  })
  it('repos déclaré : tout est gelé', () => {
    const before = { ...p0, streak: 9, bestStreak: 9 }
    const { progress, record } = settleDay(before, day('2026-11-13', 0, { rest: 'repos' }))
    expect(record.status).toBe('repos')
    expect(progress).toEqual({ ...before, lastSettled: '2026-11-13' })
  })
  it('vacances : gelé sans consommer de jour de repos', () => {
    const before = { ...p0, streak: 4, vacation: { from: '2026-11-12', to: '2026-11-20' } }
    const { progress, record } = settleDay(before, day('2026-11-13', 0))
    expect(record.rest).toBe('vacances')
    expect(progress.streak).toBe(4)
    expect(isVacation(before, '2026-11-21')).toBe(false)
    expect(isVacation(before, '2026-11-12')).toBe(true)
  })
  it('donne 3 points de Discipline en plus tous les 7 jours de streak', () => {
    const { progress } = settleDay({ ...p0, streak: 6 }, day('2026-11-13', 5))
    expect(progress.streak).toBe(7)
    expect(progress.stats.discipline).toBe(5)
  })
})

describe('rattrapage des journées manquées', () => {
  const make = (date: string) => day(date, 0).quests
  it('ne clôture rien le jour même', () => {
    const p0 = initialProgress('2026-11-13')
    const out = settlePending(p0, '2026-11-13', () => undefined, make)
    expect(out.records).toEqual([])
    expect(out.progress).toEqual(p0)
  })
  it('clôture la veille avec ce qui a été fait', () => {
    const p0 = initialProgress('2026-11-13')
    const out = settlePending(p0, '2026-11-14', (d) => (d === '2026-11-13' ? day(d, 5) : undefined), make)
    expect(out.records.map((r) => [r.date, r.status])).toEqual([['2026-11-13', 'validee']])
    expect(out.progress.streak).toBe(1)
    expect(out.progress.lastSettled).toBe('2026-11-13')
  })
  it('compte comme ratées les journées où l\'appli n\'a pas été ouverte', () => {
    const p0 = { ...initialProgress('2026-11-13'), streak: 3, bestStreak: 3 }
    const out = settlePending(p0, '2026-11-17', (d) => (d === '2026-11-13' ? day(d, 4) : undefined), make)
    expect(out.records.map((r) => r.status)).toEqual(['validee', 'ratee', 'ratee', 'ratee'])
    expect(out.progress.streak).toBe(0)
    expect(out.progress.bestStreak).toBe(4)
    expect(out.progress.lastSettled).toBe('2026-11-16')
  })
  it('gèle les journées d\'une période de vacances', () => {
    const p0 = { ...initialProgress('2026-11-13'), streak: 3, bestStreak: 3, vacation: { from: '2026-11-13', to: '2026-11-15' } }
    const out = settlePending(p0, '2026-11-17', () => undefined, make)
    expect(out.records.map((r) => r.status)).toEqual(['repos', 'repos', 'repos', 'ratee'])
  })
  it('ne clôture pas deux fois : un second passage ne change rien', () => {
    const p0 = initialProgress('2026-11-13')
    const first = settlePending(p0, '2026-11-15', (d) => day(d, 5), make)
    const second = settlePending(first.progress, '2026-11-15', (d) => first.records.find((r) => r.date === d), make)
    expect(second.records).toEqual([])
    expect(second.progress).toEqual(first.progress)
  })
})

describe('jours de repos', () => {
  it('compte les repos de la semaine en cours, pas les vacances ni les autres semaines', () => {
    const records = [
      day('2026-11-09', 0, { rest: 'repos' }),
      day('2026-11-11', 0, { rest: 'vacances' }),
      day('2026-11-08', 0, { rest: 'repos' }),
      day('2026-11-15', 0, { rest: 'repos' }),
    ]
    expect(restUsedInWeek(records, '2026-11-13')).toBe(2)
  })
})
