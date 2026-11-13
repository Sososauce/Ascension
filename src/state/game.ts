import { getAllDays, getProgress, putDays, saveProgress } from '../db/db'
import { addWater, toggleQuest, type ActionResult } from '../domain/actions'
import { gameDate } from '../domain/dates'
import { initialProgress, isVacation, REST_DAYS_PER_WEEK, restUsedInWeek, settlePending, type DayRecord, type Progress } from '../domain/progress'
import { generateQuests } from '../domain/quests'
import type { Profile } from '../domain/types'

export interface GameState {
  progress: Progress
  today: DayRecord
  /** Jours de repos simples déjà posés cette semaine (aujourd'hui compris). */
  restUsed: number
  /** Journées clôturées à l'ouverture (pour le récapitulatif). */
  justSettled: DayRecord[]
}

/** Charge la partie : clôture les journées passées, puis prépare la journée en cours. */
export async function loadGame(profile: Profile, now = new Date()): Promise<GameState> {
  const today = gameDate(now, profile.dayCloseHour)
  const stored = await getProgress()
  const days = new Map((await getAllDays()).map((d) => [d.date, d]))
  const makeQuests = (date: string) => generateQuests(profile, date, (stored ?? initialProgress(today)).cycleStart)
  const settled = settlePending(stored ?? initialProgress(today), today, (d) => days.get(d), makeQuests)
  for (const r of settled.records) days.set(r.date, r)
  const progress = settled.progress

  let record = days.get(today) ?? { date: today, quests: makeQuests(today), waterMl: 0, rest: null, status: 'ouverte' as const, settled: false }
  const vacation = isVacation(progress, today)
  if (vacation && record.rest === null) record = { ...record, rest: 'vacances' }
  if (!vacation && record.rest === 'vacances') record = { ...record, rest: null }
  days.set(today, record)

  await putDays([...settled.records, record])
  await saveProgress(progress)
  return { progress, today: record, restUsed: restUsedInWeek([...days.values()], today), justSettled: settled.records }
}

async function persist(state: GameState, result: ActionResult): Promise<GameState> {
  await putDays([result.record])
  await saveProgress(result.progress)
  return { ...state, progress: result.progress, today: result.record }
}

export async function doToggle(state: GameState, questId: string): Promise<{ state: GameState; completed: string | null }> {
  const result = toggleQuest(state.progress, state.today, questId)
  return { state: await persist(state, result), completed: result.completed }
}

export async function doWater(state: GameState, deltaMl: number): Promise<{ state: GameState; completed: string | null }> {
  const result = addWater(state.progress, state.today, deltaMl)
  return { state: await persist(state, result), completed: result.completed }
}

/** Pose ou annule un jour de repos pour aujourd'hui (2 par semaine au plus). */
export async function doRest(state: GameState, on: boolean): Promise<GameState> {
  const t = state.today
  if (t.settled || t.rest === 'vacances') return state
  if (on && (t.rest === 'repos' || state.restUsed >= REST_DAYS_PER_WEEK)) return state
  if (!on && t.rest !== 'repos') return state
  const record: DayRecord = { ...t, rest: on ? 'repos' : null }
  await putDays([record])
  return { ...state, today: record, restUsed: state.restUsed + (on ? 1 : -1) }
}

/** Active (ou termine, avec null) le mode vacances/malade. */
export async function doVacation(state: GameState, range: { from: string; to: string } | null): Promise<GameState> {
  const progress = { ...state.progress, vacation: range }
  const inRange = isVacation(progress, state.today.date)
  let record = state.today
  if (inRange && record.rest !== 'vacances') record = { ...record, rest: 'vacances' }
  if (!inRange && record.rest === 'vacances') record = { ...record, rest: null }
  await putDays([record])
  await saveProgress(progress)
  const freed = state.today.rest === 'repos' && record.rest !== 'repos' ? 1 : 0
  return { ...state, progress, today: record, restUsed: state.restUsed - freed }
}
