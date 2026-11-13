import type { ExerciseKind } from '../data/exercises'
import { cyclePosition, dayIndex, diffDays } from './dates'
import { durationBetween, freeMinutesForDay, sessionMinutes } from './freeTime'
import { nutritionPlan } from './nutrition'
import { buildSession, type SessionPlan } from './session'
import type { Level, Profile, Specialization } from './types'

export type QuestKind = 'session' | 'movement' | 'meal' | 'water' | 'protein' | 'bonus'
export type StatKey = 'force' | 'endurance' | 'discipline' | 'nutrition'

export interface Quest {
  id: string
  kind: QuestKind
  title: string
  detail: string
  xp: number
  stat: StatKey
  statPoints: number
  done: boolean
  /** Les quêtes bonus rapportent de l'XP mais ne comptent pas pour valider la journée. */
  bonus: boolean
  session?: SessionPlan
}

export const WATER_TARGET_ML = 2000
export const WATER_STEP_ML = 250

/** Type de séance selon la spécialisation et le jour (0 = lundi) : la spécialité domine, avec de la récupération. */
const WEEK_PATTERN: Record<Specialization, ExerciseKind[]> = {
  force: ['force', 'mobilite', 'force', 'endurance', 'force', 'force', 'mobilite'],
  endurance: ['endurance', 'mobilite', 'endurance', 'force', 'endurance', 'endurance', 'mobilite'],
  mobilite: ['mobilite', 'force', 'mobilite', 'endurance', 'mobilite', 'mobilite', 'force'],
}

export function sessionKindFor(spec: Specialization, dayIdx: number): ExerciseKind {
  return WEEK_PATTERN[spec][dayIdx]
}

const SESSION_XP: Record<number, number> = { 20: 20, 30: 30, 45: 40, 60: 50 }
const BASE_STEPS: Record<Level, number> = { debutant: 6000, intermediaire: 8000, avance: 10000 }

/** Objectif de pas : dépend du niveau, monte de 500 toutes les 2 semaines (+2 000 au plus), baisse les jours très chargés. */
export function stepsTarget(level: Level, week: number, freeMinutes: number): number {
  const progress = Math.min(2000, 500 * Math.floor((week - 1) / 2))
  const busy = freeMinutes < 60 ? 2000 : 0
  return Math.max(4000, BASE_STEPS[level] + progress - busy)
}

/** Moment conseillé pour la séance : le soir si elle y tient, sinon le matin, sinon en fractionné. */
export function sessionSlot(p: Profile, dayIdx: number, minutes: number): string {
  const day = p.days[dayIdx]
  if (!day.worked) return 'dans la journée'
  const commuteHalf = day.remote ? 0 : p.commuteMinutes / 2
  const evening = durationBetween(p.workEnd, p.bedtime) - commuteHalf - 60
  const morning = durationBetween(p.wake, p.workStart) - commuteHalf - 45
  if (evening >= minutes + 30) return 'ce soir'
  if (morning >= minutes + 15) return 'ce matin'
  return 'en plusieurs fois'
}

const KIND_LABEL: Record<ExerciseKind, string> = { force: 'force', endurance: 'endurance', mobilite: 'mobilité' }
const GEAR_LABEL = { aucun: 'poids du corps', halteres: 'haltères', salle: 'salle' }

function bonusQuest(p: Profile, dayIdx: number): { title: string; detail: string } {
  const day = p.days[dayIdx]
  if (!day.worked) return { title: 'Défi du jour libre', detail: "30 min d'activité en plein air" }
  if (day.remote) return { title: 'Marcher 15 min à la pause', detail: 'Jour de télétravail' }
  switch (p.commuteMode) {
    case 'transports': return { title: 'Descendre un arrêt plus tôt', detail: 'Et finir à pied' }
    case 'voiture': return { title: 'Se garer plus loin', detail: 'Et marcher 10 min' }
    case 'velo': return { title: 'Faire le trajet à vélo', detail: 'Aller ou retour' }
    case 'pied': return { title: 'Allonger le trajet de 10 min', detail: 'À pied, par un détour' }
  }
}

/** Les quêtes d'un jour : 5 principales (séance, pas, repas, eau, protéines) et 1 bonus. Calcul pur et reproductible. */
export function generateQuests(p: Profile, date: string, cycleStart: string): Quest[] {
  const idx = dayIndex(date)
  const free = freeMinutesForDay(p, idx)
  const minutes = sessionMinutes(free)
  const { week, cycle } = cyclePosition(cycleStart, date)
  const kind = sessionKindFor(p.specialization, idx)
  const session = buildSession({ kind, minutes, equipment: p.equipment, level: p.level, week, cycle, seed: Math.max(0, diffDays(cycleStart, date)) })
  const steps = stepsTarget(p.level, week, free)
  const protein = nutritionPlan(p).proteinG
  const bonus = bonusQuest(p, idx)
  const q = (partial: Omit<Quest, 'done' | 'bonus' | 'statPoints'> & { bonus?: boolean; statPoints?: number }): Quest => ({ done: false, bonus: false, statPoints: 1, ...partial })
  return [
    q({ id: 'session', kind: 'session', title: `Séance ${KIND_LABEL[kind]}`, detail: `${minutes} min · ${GEAR_LABEL[p.equipment]} · ${sessionSlot(p, idx, minutes)}`, xp: SESSION_XP[minutes] ?? 30, stat: kind === 'force' ? 'force' : 'endurance', statPoints: 2, session }),
    q({ id: 'movement', kind: 'movement', title: `Marcher ${steps.toLocaleString('fr-FR')} pas`, detail: 'À valider toi-même en fin de journée', xp: 25, stat: 'endurance' }),
    q({ id: 'meal', kind: 'meal', title: 'Cuisiner un repas maison', detail: `${p.cookMinutes} min de cuisine au plus`, xp: 25, stat: 'nutrition' }),
    q({ id: 'water', kind: 'water', title: "Boire 2 L d'eau", detail: 'Un verre à la fois', xp: 15, stat: 'nutrition' }),
    q({ id: 'protein', kind: 'protein', title: `Atteindre ${protein} g de protéines`, detail: 'Ton objectif du jour', xp: 20, stat: 'nutrition' }),
    q({ id: 'bonus', kind: 'bonus', title: bonus.title, detail: bonus.detail, xp: 15, stat: 'endurance', bonus: true }),
  ]
}
