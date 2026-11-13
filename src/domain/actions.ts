import { applyQuest, type DayRecord, type Progress } from './progress'
import { WATER_TARGET_ML } from './quests'

export interface ActionResult {
  progress: Progress
  record: DayRecord
  /** Quête qui vient d'être validée par cette action (pour le retour visuel), sinon null. */
  completed: string | null
}

const locked = (record: DayRecord) => record.settled || record.rest !== null

/** Coche ou décoche une quête du jour. Sans effet si la journée est clôturée ou en repos. */
export function toggleQuest(progress: Progress, record: DayRecord, questId: string): ActionResult {
  const quest = record.quests.find((q) => q.id === questId)
  if (!quest || locked(record)) return { progress, record, completed: null }
  const done = !quest.done
  const quests = record.quests.map((q) => (q.id === questId ? { ...q, done } : q))
  const waterMl = quest.kind === 'water' ? (done ? Math.max(record.waterMl, WATER_TARGET_ML) : 0) : record.waterMl
  return { progress: applyQuest(progress, quest, done ? 1 : -1), record: { ...record, quests, waterMl }, completed: done ? questId : null }
}

/** Ajoute (ou retire) de l'eau. La quête se valide toute seule à 2 L, et se dévalide si on repasse en dessous. */
export function addWater(progress: Progress, record: DayRecord, deltaMl: number): ActionResult {
  if (locked(record)) return { progress, record, completed: null }
  const waterMl = Math.max(0, Math.min(5000, record.waterMl + deltaMl))
  const quest = record.quests.find((q) => q.kind === 'water')
  const next = { ...record, waterMl }
  if (!quest) return { progress, record: next, completed: null }
  const done = waterMl >= WATER_TARGET_ML
  if (done === quest.done) return { progress, record: next, completed: null }
  return {
    progress: applyQuest(progress, quest, done ? 1 : -1),
    record: { ...next, quests: record.quests.map((q) => (q.id === quest.id ? { ...q, done } : q)) },
    completed: done ? quest.id : null,
  }
}
