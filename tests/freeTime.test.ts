import { describe, expect, it } from 'vitest'
import { DEFAULT_PROFILE, type Profile } from '../src/domain/types'
import { durationBetween, formatMinutes, freeMinutesForDay, freeTimeSummary, parseTime, sessionMinutes } from '../src/domain/freeTime'

const base: Profile = { ...DEFAULT_PROFILE, bedtime: '23:30', wake: '07:00', workStart: '09:00', workEnd: '18:00', commuteMinutes: 70 }

describe('heures', () => {
  it('lit une heure', () => {
    expect(parseTime('07:05')).toBe(425)
    expect(parseTime('25:00')).toBeNaN()
    expect(parseTime('abc')).toBeNaN()
  })
  it('calcule une durée en passant minuit', () => {
    expect(durationBetween('23:30', '07:00')).toBe(450)
    expect(durationBetween('09:00', '18:00')).toBe(540)
    expect(durationBetween('01:00', '08:30')).toBe(450)
  })
  it('formate les minutes', () => {
    expect(formatMinutes(260)).toBe('4 h 20')
    expect(formatMinutes(45)).toBe('45 min')
    expect(formatMinutes(870)).toBe('14 h 30')
  })
})

describe('temps libre', () => {
  it('jour travaillé en présentiel : 24 h − sommeil − travail − trajet − 2 h', () => {
    // 1440 − 450 − 540 − 70 − 120 = 260
    expect(freeMinutesForDay(base, 0)).toBe(260)
  })
  it('week-end : ni travail ni trajet', () => {
    // 1440 − 450 − 120 = 870
    expect(freeMinutesForDay(base, 5)).toBe(870)
  })
  it('télétravail : pas de trajet', () => {
    const p = { ...base, days: base.days.map((d, i) => (i === 2 ? { ...d, remote: true } : d)) }
    expect(freeMinutesForDay(p, 2)).toBe(330)
  })
  it('retire les obligations fixes selon le type de jour', () => {
    const p = { ...base, obligationsWorkday: 60, obligationsWeekend: 120 }
    expect(freeMinutesForDay(p, 0)).toBe(200)
    expect(freeMinutesForDay(p, 6)).toBe(750)
  })
  it('ne descend jamais sous zéro', () => {
    const p = { ...base, workStart: '06:00', workEnd: '22:00', commuteMinutes: 180 }
    expect(freeMinutesForDay(p, 0)).toBe(0)
  })
  it('donne des moyennes séparées jours travaillés / week-end', () => {
    const s = freeTimeSummary(base)
    expect(s.perDay).toEqual([260, 260, 260, 260, 260, 870, 870])
    expect(s.workdayAverage).toBe(260)
    expect(s.restdayAverage).toBe(870)
  })
  it('moyenne les jours de télétravail avec les autres jours travaillés', () => {
    const p = { ...base, days: base.days.map((d, i) => (i === 4 ? { ...d, remote: true } : d)) }
    // (4 × 260 + 330) / 5 = 274
    expect(freeTimeSummary(p).workdayAverage).toBe(274)
  })
  it('renvoie null quand un type de jour est absent', () => {
    const p = { ...base, days: base.days.map(() => ({ worked: true, remote: false })) }
    expect(freeTimeSummary(p).restdayAverage).toBeNull()
  })
})

describe('durée de séance', () => {
  it('suit les paliers de temps libre', () => {
    expect(sessionMinutes(45)).toBe(20)
    expect(sessionMinutes(60)).toBe(30)
    expect(sessionMinutes(119)).toBe(30)
    expect(sessionMinutes(120)).toBe(45)
    expect(sessionMinutes(180)).toBe(45)
    expect(sessionMinutes(181)).toBe(60)
  })
})
