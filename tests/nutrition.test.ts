import { describe, expect, it } from 'vitest'
import { bmr, calorieTarget, macros, tdee } from '../src/domain/nutrition'

const man = { sex: 'homme' as const, age: 30, heightCm: 180, weightKg: 86 }
const woman = { sex: 'femme' as const, age: 30, heightCm: 165, weightKg: 60 }

describe('Mifflin-St Jeor', () => {
  it('homme : 10 × poids + 6,25 × taille − 5 × âge + 5', () => {
    expect(bmr(man)).toBe(1840)
  })
  it('femme : même formule, − 161', () => {
    expect(bmr(woman)).toBeCloseTo(1320.25, 5)
  })
  it('multiplie par le niveau d\'activité', () => {
    expect(tdee(man, 'leger')).toBeCloseTo(2530, 5)
    expect(tdee(man, 'sedentaire')).toBeCloseTo(2208, 5)
  })
})

describe('cible calorique et garde-fous', () => {
  it('perte : déficit de 20 % plafonné à 500 kcal', () => {
    const c = calorieTarget(man, 'leger', 'perte')
    expect(c.target).toBe(2030)
    expect(c.delta).toBe(-500)
    expect(c.flooredBySafety).toBe(false)
  })
  it('perte : 20 % quand c\'est moins que 500 kcal', () => {
    // dépense 2208 → −441,6 = 1766,4, mais le métabolisme de base (1840) est plus haut
    const c = calorieTarget(man, 'sedentaire', 'perte')
    expect(c.target).toBe(1840)
    expect(c.flooredBySafety).toBe(true)
  })
  it('ne descend jamais sous le métabolisme de base', () => {
    const c = calorieTarget(woman, 'sedentaire', 'perte')
    expect(c.target).toBeGreaterThanOrEqual(1320)
    expect(c.flooredBySafety).toBe(true)
  })
  it('ne descend jamais sous le plancher (1200 femme, 1500 homme)', () => {
    const small = { sex: 'femme' as const, age: 70, heightCm: 150, weightKg: 42 }
    expect(bmr(small)).toBeLessThan(1200)
    expect(calorieTarget(small, 'sedentaire', 'perte').target).toBe(1200)
    const smallMan = { sex: 'homme' as const, age: 75, heightCm: 160, weightKg: 50 }
    expect(calorieTarget(smallMan, 'sedentaire', 'perte').target).toBe(1500)
  })
  it('masse : +10 %', () => {
    expect(calorieTarget(man, 'leger', 'masse').target).toBe(2790)
  })
  it('maintien et énergie : la dépense', () => {
    expect(calorieTarget(man, 'leger', 'maintien').target).toBe(2530)
    expect(calorieTarget(man, 'leger', 'energie').target).toBe(2530)
  })
})

describe('macros', () => {
  it('perte : 1,8 g/kg de protéines, 0,8 g/kg de lipides, glucides = le reste', () => {
    const m = macros(2030, 86, 'perte')
    expect(m.proteinG).toBe(155)
    expect(m.fatG).toBe(69)
    expect(m.carbsG).toBe(198)
  })
  it('maintien : 1,4 g/kg de protéines', () => {
    expect(macros(2530, 86, 'maintien').proteinG).toBe(120)
  })
  it('garantit 130 g de glucides en baissant les protéines jusqu\'à 1,6 g/kg', () => {
    // 100 kg, 1900 kcal : 180 g prot + 80 g lip → 115 g de glucides, trop bas
    const m = macros(1900, 100, 'perte')
    expect(m.carbsG).toBe(130)
    expect(m.proteinG).toBe(165)
    expect(m.proteinG).toBeGreaterThanOrEqual(160)
  })
  it('ne baisse pas les protéines sous 1,6 g/kg même si les glucides restent bas', () => {
    const m = macros(1700, 100, 'perte')
    expect(m.proteinG).toBe(160)
    expect(m.carbsG).toBeLessThan(130)
  })
  it('les calories des macros retombent sur la cible', () => {
    const m = macros(2030, 86, 'perte')
    expect(Math.abs(m.proteinG * 4 + m.carbsG * 4 + m.fatG * 9 - 2030)).toBeLessThan(15)
  })
})
