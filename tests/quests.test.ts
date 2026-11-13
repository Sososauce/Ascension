import { describe, expect, it } from 'vitest'
import { EXERCISE_BY_ID, EXERCISES } from '../src/data/exercises'
import { generateQuests, sessionKindFor, sessionSlot, stepsTarget } from '../src/domain/quests'
import { buildSession, estimateSeconds, progressionBonus } from '../src/domain/session'
import { DEFAULT_PROFILE, type Equipment, type Level, type Profile } from '../src/domain/types'
import { existsSync } from 'node:fs'

const p: Profile = { ...DEFAULT_PROFILE, weightKg: 86, heightCm: 180, goal: 'perte', equipment: 'halteres', commuteMinutes: 70 }
const MONDAY = '2026-11-09'
const SATURDAY = '2026-11-14'

describe('bibliothèque d\'exercices', () => {
  it('a des identifiants uniques, des consignes et deux images par exercice', () => {
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(EXERCISES.length)
    for (const e of EXERCISES) {
      expect(e.steps.length, e.id).toBeGreaterThanOrEqual(3)
      expect(existsSync(`public/exercises/${e.id}-0.jpg`), e.id).toBe(true)
      expect(existsSync(`public/exercises/${e.id}-1.jpg`), e.id).toBe(true)
    }
  })
})

describe('quêtes du jour', () => {
  it('donne toujours 5 quêtes principales et 1 bonus', () => {
    for (const date of [MONDAY, SATURDAY]) {
      const quests = generateQuests(p, date, MONDAY)
      expect(quests.filter((q) => !q.bonus)).toHaveLength(5)
      expect(quests.filter((q) => q.bonus)).toHaveLength(1)
      expect(new Set(quests.map((q) => q.id)).size).toBe(6)
    }
  })
  it('est reproductible : même jour, mêmes quêtes', () => {
    expect(generateQuests(p, MONDAY, MONDAY)).toEqual(generateQuests(p, MONDAY, MONDAY))
  })
  it('garde l\'XP entre 10 et 50 par quête', () => {
    for (const q of generateQuests(p, SATURDAY, MONDAY)) {
      expect(q.xp).toBeGreaterThanOrEqual(10)
      expect(q.xp).toBeLessThanOrEqual(50)
    }
  })
  it('ne récompense jamais le fait de sauter un repas ou de moins manger', () => {
    const text = [MONDAY, SATURDAY].flatMap((d) => generateQuests(p, d, MONDAY)).map((q) => `${q.title} ${q.detail}`.toLowerCase()).join(' ')
    for (const word of ['sauter', 'jeûn', 'jeun', 'sans manger', 'ne pas manger']) expect(text).not.toContain(word)
  })
  it('calibre la séance sur le temps libre : plus longue le week-end', () => {
    const busy: Profile = { ...p, workStart: '08:00', workEnd: '19:30', commuteMinutes: 120 }
    // 1440 − 450 − 690 − 120 − 120 = 60 min libres → 30 min ; samedi → 60 min
    expect(generateQuests(busy, MONDAY, MONDAY)[0].session!.minutes).toBe(30)
    expect(generateQuests(busy, SATURDAY, MONDAY)[0].session!.minutes).toBe(60)
  })
  it('reprend l\'objectif de protéines du plan nutrition', () => {
    expect(generateQuests(p, MONDAY, MONDAY).find((q) => q.id === 'protein')!.title).toContain('155 g')
  })
  it('adapte la quête bonus au trajet, au télétravail et au jour libre', () => {
    const bonus = (prof: Profile, date: string) => generateQuests(prof, date, MONDAY).find((q) => q.bonus)!.title
    expect(bonus(p, MONDAY)).toBe('Descendre un arrêt plus tôt')
    expect(bonus({ ...p, commuteMode: 'velo' }, MONDAY)).toBe('Faire le trajet à vélo')
    expect(bonus({ ...p, days: p.days.map((d, i) => (i === 0 ? { ...d, remote: true } : d)) }, MONDAY)).toBe('Marcher 15 min à la pause')
    expect(bonus(p, SATURDAY)).toBe('Défi du jour libre')
  })
})

describe('planning de la semaine', () => {
  it('fait dominer la spécialisation', () => {
    for (const spec of ['force', 'endurance', 'mobilite'] as const) {
      const kinds = [0, 1, 2, 3, 4, 5, 6].map((i) => sessionKindFor(spec, i))
      expect(kinds.filter((k) => k === spec).length).toBeGreaterThanOrEqual(4)
    }
  })
  it('place la séance le soir si elle y tient, sinon le matin', () => {
    expect(sessionSlot(p, 0, 45)).toBe('ce soir')
    const lateWork: Profile = { ...p, workStart: '11:00', workEnd: '22:00', bedtime: '23:30', wake: '07:00' }
    expect(sessionSlot(lateWork, 0, 45)).toBe('ce matin')
    expect(sessionSlot(p, 5, 45)).toBe('dans la journée')
  })
})

describe('objectif de pas', () => {
  it('dépend du niveau et monte au fil du cycle, sans dépasser +2 000', () => {
    expect(stepsTarget('debutant', 1, 300)).toBe(6000)
    expect(stepsTarget('intermediaire', 1, 300)).toBe(8000)
    expect(stepsTarget('debutant', 3, 300)).toBe(6500)
    expect(stepsTarget('debutant', 10, 300)).toBe(8000)
  })
  it('baisse les jours très chargés, sans descendre sous 4 000', () => {
    expect(stepsTarget('debutant', 1, 45)).toBe(4000)
    expect(stepsTarget('avance', 1, 45)).toBe(8000)
  })
})

describe('construction des séances', () => {
  const gears: Equipment[] = ['aucun', 'halteres', 'salle']
  const levels: Level[] = ['debutant', 'intermediaire', 'avance']
  const kinds = ['force', 'endurance', 'mobilite'] as const
  it('respecte le matériel et le niveau, sans doublon, pour toutes les combinaisons', () => {
    const rank = { aucun: 0, halteres: 1, salle: 2 }
    const lv = { debutant: 1, intermediaire: 2, avance: 3 }
    for (const equipment of gears) for (const level of levels) for (const kind of kinds) for (const minutes of [20, 30, 45, 60]) for (const seed of [0, 1, 2, 7]) {
      const plan = buildSession({ kind, minutes, equipment, level, week: 1, cycle: 1, seed })
      const label = `${kind} ${minutes} ${equipment} ${level} ${seed}`
      expect(plan.items.length, label).toBeGreaterThanOrEqual(2)
      expect(new Set(plan.items.map((i) => i.exerciseId)).size, label).toBe(plan.items.length)
      for (const it of plan.items) {
        const e = EXERCISE_BY_ID[it.exerciseId]
        expect(e, label).toBeDefined()
        expect(rank[e.gear], label).toBeLessThanOrEqual(rank[equipment])
        expect(e.level, label).toBeLessThanOrEqual(lv[level])
        expect(it.reps !== undefined || it.seconds !== undefined, label).toBe(true)
        expect(it.sets, label).toBeGreaterThanOrEqual(1)
      }
    }
  })
  it('tient à peu près dans la durée demandée', () => {
    for (const equipment of gears) for (const level of levels) for (const kind of kinds) for (const minutes of [20, 30, 45, 60]) {
      const plan = buildSession({ kind, minutes, equipment, level, week: 1, cycle: 1, seed: 3 })
      expect(estimateSeconds(plan), `${kind} ${minutes} ${equipment} ${level}`).toBeLessThanOrEqual(minutes * 60 * 1.2)
    }
  })
  it('utilise les haltères quand on en a', () => {
    const plan = buildSession({ kind: 'force', minutes: 45, equipment: 'halteres', level: 'debutant', week: 1, cycle: 1, seed: 0 })
    expect(plan.items.some((i) => EXERCISE_BY_ID[i.exerciseId].gear === 'halteres')).toBe(true)
  })
  it('varie d\'un jour à l\'autre', () => {
    const ids = (seed: number) => buildSession({ kind: 'force', minutes: 45, equipment: 'halteres', level: 'debutant', week: 1, cycle: 1, seed }).items.map((i) => i.exerciseId).join()
    expect(ids(0)).not.toBe(ids(1))
  })
  it('durcit au fil des semaines et des cycles (0 à 2 séries de plus)', () => {
    expect(progressionBonus(1, 1)).toBe(0)
    expect(progressionBonus(5, 1)).toBe(1)
    expect(progressionBonus(9, 1)).toBe(2)
    expect(progressionBonus(1, 2)).toBe(1)
    expect(progressionBonus(10, 3)).toBe(2)
    const sets = (week: number) => buildSession({ kind: 'force', minutes: 60, equipment: 'aucun', level: 'debutant', week, cycle: 1, seed: 0 }).items[0].sets
    expect(sets(9)).toBeGreaterThan(sets(1))
  })
})
