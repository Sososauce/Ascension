import { describe, expect, it } from 'vitest'
import { DEFAULT_PROFILE } from '../src/domain/types'
import { validateStep } from '../src/features/Onboarding'
import { gameDayIndex } from '../src/features/Home'

describe('validation du questionnaire', () => {
  it('accepte le profil par défaut à chaque étape', () => {
    for (let s = 1; s <= 5; s++) expect(validateStep(s, DEFAULT_PROFILE)).toEqual([])
  })
  it('refuse un âge, une taille ou un poids hors limites ou vides', () => {
    expect(validateStep(1, { ...DEFAULT_PROFILE, age: 17 })).toHaveLength(1)
    expect(validateStep(1, { ...DEFAULT_PROFILE, heightCm: NaN })).toHaveLength(1)
    expect(validateStep(1, { ...DEFAULT_PROFILE, weightKg: 20, age: 120 })).toHaveLength(2)
  })
  it('refuse des horaires vides ou identiques', () => {
    expect(validateStep(5, { ...DEFAULT_PROFILE, bedtime: '' })).toHaveLength(1)
    expect(validateStep(5, { ...DEFAULT_PROFILE, workStart: '09:00', workEnd: '09:00' })).toHaveLength(1)
  })
  it('ignore les horaires de travail si aucun jour n\'est travaillé', () => {
    const p = { ...DEFAULT_PROFILE, workStart: '', days: DEFAULT_PROFILE.days.map(() => ({ worked: false, remote: false })) }
    expect(validateStep(5, p)).toEqual([])
  })
})

describe('jour de jeu et heure de clôture', () => {
  it('à 0 h 15 un samedi, avec clôture à 4 h, on est encore vendredi', () => {
    expect(gameDayIndex(new Date(2026, 10, 14, 0, 15), 4)).toBe(4)
  })
  it('à 4 h 00 pile, la nouvelle journée commence', () => {
    expect(gameDayIndex(new Date(2026, 10, 14, 4, 0), 4)).toBe(5)
  })
  it('avec clôture à minuit, le jour change à minuit', () => {
    expect(gameDayIndex(new Date(2026, 10, 14, 0, 15), 0)).toBe(5)
  })
})
