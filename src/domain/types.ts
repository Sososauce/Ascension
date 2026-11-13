export type Sex = 'homme' | 'femme'
export type Activity = 'sedentaire' | 'leger' | 'actif' | 'tres_actif'
export type Goal = 'perte' | 'masse' | 'maintien' | 'energie'
export type Diet = 'aucun' | 'vegetarien' | 'vegan' | 'halal' | 'sans_porc' | 'pescetarien'
export type Equipment = 'aucun' | 'halteres' | 'salle'
export type Level = 'debutant' | 'intermediaire' | 'avance'
export type Specialization = 'force' | 'endurance' | 'mobilite'
export type CommuteMode = 'transports' | 'voiture' | 'velo' | 'pied'

/** Un jour de la semaine. L'index 0 est le lundi, 6 le dimanche. */
export interface DayPattern {
  worked: boolean
  remote: boolean
}

export interface Profile {
  // Qui es-tu ?
  sex: Sex
  age: number
  heightCm: number
  weightKg: number
  activity: Activity
  // Objectif
  goal: Goal
  // Alimentation
  diet: Diet
  dislikes: string
  kitchen: string[]
  cookMinutes: number
  /** Facultatifs : serviront à la liste de courses (V2). */
  weeklyBudget: number | null
  household: number | null
  // Sport
  equipment: Equipment
  level: Level
  specialization: Specialization
  currentSport: string
  // Rythme de vie (heures au format "HH:MM")
  bedtime: string
  wake: string
  workStart: string
  workEnd: string
  days: DayPattern[]
  commuteMinutes: number
  commuteMode: CommuteMode
  /** Obligations fixes (enfants, études…) en minutes par jour. */
  obligationsWorkday: number
  obligationsWeekend: number
  /** Heure de clôture de la journée (0 à 6). 4 = 4 h du matin. */
  dayCloseHour: number
}

export const DEFAULT_PROFILE: Profile = {
  sex: 'homme',
  age: 30,
  heightCm: 175,
  weightKg: 75,
  activity: 'leger',
  goal: 'maintien',
  diet: 'aucun',
  dislikes: '',
  kitchen: ['plaques', 'four', 'micro-ondes'],
  cookMinutes: 30,
  weeklyBudget: null,
  household: null,
  equipment: 'aucun',
  level: 'debutant',
  specialization: 'force',
  currentSport: '',
  bedtime: '23:30',
  wake: '07:00',
  workStart: '09:00',
  workEnd: '18:00',
  days: [
    { worked: true, remote: false },
    { worked: true, remote: false },
    { worked: true, remote: false },
    { worked: true, remote: false },
    { worked: true, remote: false },
    { worked: false, remote: false },
    { worked: false, remote: false },
  ],
  commuteMinutes: 60,
  commuteMode: 'transports',
  obligationsWorkday: 0,
  obligationsWeekend: 0,
  dayCloseHour: 4,
}
