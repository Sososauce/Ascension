import { describe, expect, it } from 'vitest'
import { DEFAULT_PROFILE } from '../src/domain/types'
import { validateStep } from '../src/features/Onboarding'

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

