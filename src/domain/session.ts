import { EXERCISES, EXERCISE_BY_ID, type Exercise, type ExerciseGroup, type ExerciseKind } from '../data/exercises'
import type { Equipment, Level } from './types'

export interface SessionItem {
  exerciseId: string
  sets: number
  /** Répétitions par série (exercices comptés). */
  reps?: number
  /** Durée par série en secondes (exercices chronométrés). */
  seconds?: number
  /** Repos après chaque série, en secondes. */
  rest: number
}

export interface SessionPlan {
  kind: ExerciseKind
  minutes: number
  items: SessionItem[]
}

const GEAR_RANK: Record<Equipment, number> = { aucun: 0, halteres: 1, salle: 2 }
const LEVEL_RANK: Record<Level, 1 | 2 | 3> = { debutant: 1, intermediaire: 2, avance: 3 }
/** Durée estimée d'une série comptée, en secondes. */
const REP_SET_SECONDS = 45
const WARMUP_SECONDS = 180

export interface SessionInput {
  kind: ExerciseKind
  minutes: number
  equipment: Equipment
  level: Level
  /** Semaine du cycle (1 à 10) et numéro de cycle : pilotent la difficulté. */
  week: number
  cycle: number
  /** Nombre qui fait tourner le choix des exercices d'un jour à l'autre. */
  seed: number
}

function allowed(e: Exercise, input: SessionInput): boolean {
  return GEAR_RANK[e.gear] <= GEAR_RANK[input.equipment] && e.level <= LEVEL_RANK[input.level]
}

/** Séries supplémentaires gagnées au fil du cycle (0 à 2). */
export function progressionBonus(week: number, cycle: number): number {
  return Math.min(2, Math.floor((week - 1) / 4) + (cycle > 1 ? 1 : 0))
}

/** Choisit un exercice d'un groupe, en préférant le matériel le plus complet dont on dispose. */
function pick(group: ExerciseGroup, input: SessionInput, used: Set<string>, offset: number): Exercise | null {
  const pool = EXERCISES.filter((e) => e.group === group && allowed(e, input) && !used.has(e.id))
  if (pool.length === 0) return null
  const best = Math.max(...pool.map((e) => GEAR_RANK[e.gear]))
  const preferred = pool.filter((e) => GEAR_RANK[e.gear] === best)
  return preferred[(input.seed + offset) % preferred.length]
}

function buildForce(input: SessionInput): SessionItem[] {
  const level = LEVEL_RANK[input.level]
  let sets = Math.min(5, level + 1 + progressionBonus(input.week, input.cycle))
  const budget = input.minutes * 60 - WARMUP_SECONDS
  const perSet = REP_SET_SECONDS + 60
  let count = Math.floor(budget / (sets * perSet))
  while (count < 3 && sets > 2) {
    sets--
    count = Math.floor(budget / (sets * perSet))
  }
  count = Math.max(3, Math.min(8, count))
  const order: ExerciseGroup[] = ['jambes', 'pousser', 'tirer', 'gainage']
  const used = new Set<string>()
  const items: SessionItem[] = []
  let slot = 0
  let guard = 0
  while (items.length < count && guard < 40) {
    const e = pick(order[slot % order.length], input, used, slot)
    slot++
    guard++
    if (!e) continue
    used.add(e.id)
    const hold = Math.min(60, 30 + 5 * (input.week - 1))
    items.push(e.mode === 'time' ? { exerciseId: e.id, sets, seconds: hold, rest: 60 } : { exerciseId: e.id, sets, reps: level === 1 ? 10 : 12, rest: 60 })
  }
  return items
}

function buildEndurance(input: SessionInput): SessionItem[] {
  const used = new Set<string>()
  const long = pick('cardio_long', input, used, 0)
  const longSeconds = Math.round(input.minutes * 0.6) * 60
  const items: SessionItem[] = []
  if (long) items.push({ exerciseId: long.id, sets: 1, seconds: longSeconds, rest: 60 })
  const moves = EXERCISES.filter((e) => e.group === 'cardio' && allowed(e, input))
  const work = Math.min(50, 30 + 5 * progressionBonus(input.week, input.cycle) + 5 * (LEVEL_RANK[input.level] - 1))
  const rest = 20
  const circuitBudget = input.minutes * 60 - longSeconds - 60
  const rounds = Math.max(1, Math.min(6, Math.floor(circuitBudget / (moves.length * (work + rest)))))
  for (const m of moves) items.push({ exerciseId: m.id, sets: rounds, seconds: work, rest })
  return items
}

function buildMobility(input: SessionInput): SessionItem[] {
  const pool = EXERCISES.filter((e) => e.group === 'souplesse' && allowed(e, input))
  const hold = Math.min(45, 30 + 5 * progressionBonus(input.week, input.cycle))
  const rest = 10
  const timeOf = (e: Exercise, sets: number) => sets * (hold * (e.perSide ? 2 : 1) + rest)
  const budget = input.minutes * 60
  // On fait tourner la liste pour varier l'ordre, puis on remplit le temps disponible.
  const start = input.seed % pool.length
  const rotated = [...pool.slice(start), ...pool.slice(0, start)]
  let sets = 2
  while (sets < 4 && rotated.reduce((s, e) => s + timeOf(e, sets + 1), 0) <= budget) sets++
  const items: SessionItem[] = []
  let total = 0
  for (const e of rotated) {
    if (items.length >= 4 && total + timeOf(e, sets) > budget) break
    items.push({ exerciseId: e.id, sets, seconds: hold, rest })
    total += timeOf(e, sets)
  }
  return items
}

export function buildSession(input: SessionInput): SessionPlan {
  const items = input.kind === 'force' ? buildForce(input) : input.kind === 'endurance' ? buildEndurance(input) : buildMobility(input)
  return { kind: input.kind, minutes: input.minutes, items }
}

/** Durée estimée d'une séance, en secondes. */
export function estimateSeconds(plan: SessionPlan): number {
  return plan.items.reduce((sum, it) => {
    const e = EXERCISE_BY_ID[it.exerciseId]
    const work = it.seconds !== undefined ? it.seconds * (e?.perSide ? 2 : 1) : REP_SET_SECONDS
    return sum + it.sets * (work + it.rest)
  }, 0)
}
