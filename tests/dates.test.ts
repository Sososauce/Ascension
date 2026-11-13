import { describe, expect, it } from 'vitest'
import { addDays, cyclePosition, dayIndex, diffDays, gameDate, weekStart } from '../src/domain/dates'

describe('dates de jeu', () => {
  it('avant l\'heure de clôture, on est encore la veille', () => {
    expect(gameDate(new Date(2026, 10, 14, 0, 15), 4)).toBe('2026-11-13')
    expect(gameDate(new Date(2026, 10, 14, 4, 0), 4)).toBe('2026-11-14')
    expect(gameDate(new Date(2026, 10, 14, 0, 15), 0)).toBe('2026-11-14')
  })
  it('passe les mois et les années', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(diffDays('2026-11-13', '2026-11-20')).toBe(7)
    expect(diffDays('2026-11-20', '2026-11-13')).toBe(-7)
  })
  it('ne se décale pas au changement d\'heure', () => {
    expect(addDays('2026-10-24', 1)).toBe('2026-10-25')
    expect(addDays('2026-10-25', 1)).toBe('2026-10-26')
    expect(diffDays('2026-10-24', '2026-10-26')).toBe(2)
  })
  it('connaît le jour de la semaine et le lundi', () => {
    expect(dayIndex('2026-11-13')).toBe(4) // vendredi
    expect(dayIndex('2026-11-15')).toBe(6) // dimanche
    expect(weekStart('2026-11-15')).toBe('2026-11-09')
    expect(weekStart('2026-11-09')).toBe('2026-11-09')
  })
  it('situe un jour dans le cycle de 66 jours', () => {
    expect(cyclePosition('2026-11-13', '2026-11-13')).toEqual({ day: 1, week: 1, cycle: 1 })
    expect(cyclePosition('2026-11-13', '2026-11-20')).toEqual({ day: 8, week: 2, cycle: 1 })
    expect(cyclePosition('2026-11-13', addDays('2026-11-13', 65))).toEqual({ day: 66, week: 10, cycle: 1 })
    expect(cyclePosition('2026-11-13', addDays('2026-11-13', 66))).toEqual({ day: 1, week: 1, cycle: 2 })
  })
})
