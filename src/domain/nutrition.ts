import type { Activity, Goal, Profile, Sex } from './types'

export const ACTIVITY_FACTOR: Record<Activity, number> = {
  sedentaire: 1.2,
  leger: 1.375,
  actif: 1.55,
  tres_actif: 1.725,
}

/** Plancher calorique absolu (kcal par jour). */
export const CALORIE_FLOOR: Record<Sex, number> = { homme: 1500, femme: 1200 }
/** Déficit maximal : 20 % de la dépense, plafonné à 500 kcal. */
export const MAX_DEFICIT_RATIO = 0.2
export const MAX_DEFICIT_KCAL = 500
export const SURPLUS_RATIO = 0.1
export const MIN_CARBS_G = 130
export const FAT_G_PER_KG = 0.8
export const PROTEIN_HIGH_G_PER_KG = 1.8
export const PROTEIN_BASE_G_PER_KG = 1.4
export const PROTEIN_MIN_G_PER_KG = 1.6

type Body = Pick<Profile, 'sex' | 'age' | 'heightCm' | 'weightKg'>

/** Métabolisme de base, formule de Mifflin-St Jeor (kcal par jour). */
export function bmr(b: Body): number {
  const base = 10 * b.weightKg + 6.25 * b.heightCm - 5 * b.age
  return base + (b.sex === 'homme' ? 5 : -161)
}

/** Dépense énergétique quotidienne estimée. */
export function tdee(b: Body, activity: Activity): number {
  return bmr(b) * ACTIVITY_FACTOR[activity]
}

export interface CalorieTarget {
  bmr: number
  tdee: number
  /** Cible journalière, arrondie à 10 kcal. */
  target: number
  /** Écart appliqué par rapport à la dépense (négatif = déficit). */
  delta: number
  /** Vrai si un garde-fou (métabolisme de base ou plancher) a relevé la cible. */
  flooredBySafety: boolean
}

export function calorieTarget(b: Body, activity: Activity, goal: Goal): CalorieTarget {
  const base = bmr(b)
  const spend = base * ACTIVITY_FACTOR[activity]
  let raw = spend
  if (goal === 'perte') raw = spend - Math.min(spend * MAX_DEFICIT_RATIO, MAX_DEFICIT_KCAL)
  if (goal === 'masse') raw = spend * (1 + SURPLUS_RATIO)
  // Garde-fous : jamais sous le métabolisme de base ni sous le plancher.
  const safe = Math.max(raw, base, CALORIE_FLOOR[b.sex])
  const target = Math.ceil(safe / 10 - 1e-9) * 10
  return {
    bmr: Math.round(base),
    tdee: Math.round(spend),
    target,
    delta: Math.round(target - spend),
    flooredBySafety: safe > raw + 1e-9,
  }
}

export interface Macros {
  proteinG: number
  carbsG: number
  fatG: number
}

/**
 * Répartition des macros : lipides à 0,8 g/kg, protéines à 1,8 g/kg (perte, masse)
 * ou 1,4 g/kg, glucides = le reste. Si les glucides passent sous 130 g, on baisse
 * les protéines, sans descendre sous 1,6 g/kg (ou leur valeur de départ si elle est plus basse).
 */
export function macros(targetKcal: number, weightKg: number, goal: Goal): Macros {
  const fatG = FAT_G_PER_KG * weightKg
  const startPerKg = goal === 'perte' || goal === 'masse' ? PROTEIN_HIGH_G_PER_KG : PROTEIN_BASE_G_PER_KG
  let proteinG = startPerKg * weightKg
  const carbsFor = (p: number) => (targetKcal - p * 4 - fatG * 9) / 4
  let carbsG = carbsFor(proteinG)
  if (carbsG < MIN_CARBS_G) {
    const minProtein = Math.min(startPerKg, PROTEIN_MIN_G_PER_KG) * weightKg
    const needed = (targetKcal - fatG * 9 - MIN_CARBS_G * 4) / 4
    proteinG = Math.max(minProtein, Math.min(proteinG, needed))
    carbsG = carbsFor(proteinG)
  }
  return {
    proteinG: Math.round(proteinG),
    carbsG: Math.max(0, Math.round(carbsG)),
    fatG: Math.round(fatG),
  }
}

export function nutritionPlan(p: Profile) {
  const cal = calorieTarget(p, p.activity, p.goal)
  return { ...cal, ...macros(cal.target, p.weightKg, p.goal) }
}
