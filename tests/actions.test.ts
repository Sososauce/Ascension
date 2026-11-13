import { describe, expect, it } from 'vitest'
import { addWater, toggleQuest } from '../src/domain/actions'
import { initialProgress, type DayRecord } from '../src/domain/progress'
import { generateQuests } from '../src/domain/quests'
import { DEFAULT_PROFILE } from '../src/domain/types'

const fresh = (): DayRecord => ({ date: '2026-11-13', quests: generateQuests(DEFAULT_PROFILE, '2026-11-13', '2026-11-13'), waterMl: 0, rest: null, status: 'ouverte', settled: false })
const p0 = initialProgress('2026-11-13')

describe('valider une quête', () => {
  it('donne l\'XP et le point de stat, et les reprend si on décoche', () => {
    const a = toggleQuest(p0, fresh(), 'meal')
    expect(a.completed).toBe('meal')
    expect(a.progress.xp).toBe(25)
    expect(a.progress.stats.nutrition).toBe(1)
    const b = toggleQuest(a.progress, a.record, 'meal')
    expect(b.completed).toBeNull()
    expect(b.progress).toEqual(p0)
  })
  it('la séance rapporte 2 points de stat', () => {
    const a = toggleQuest(p0, fresh(), 'session')
    expect(a.progress.stats.force + a.progress.stats.endurance).toBe(2)
  })
  it('est sans effet un jour de repos ou une journée clôturée', () => {
    expect(toggleQuest(p0, { ...fresh(), rest: 'repos' }, 'meal').progress).toEqual(p0)
    expect(toggleQuest(p0, { ...fresh(), settled: true }, 'meal').progress).toEqual(p0)
  })
  it('ignore une quête inconnue', () => {
    expect(toggleQuest(p0, fresh(), 'inconnue').progress).toEqual(p0)
  })
})

describe('eau', () => {
  it('valide la quête à 2 L, une seule fois', () => {
    let state = { progress: p0, record: fresh(), completed: null as string | null }
    for (let i = 0; i < 7; i++) state = addWater(state.progress, state.record, 250)
    expect(state.record.waterMl).toBe(1750)
    expect(state.progress.xp).toBe(0)
    state = addWater(state.progress, state.record, 250)
    expect(state.completed).toBe('water')
    expect(state.progress.xp).toBe(15)
    state = addWater(state.progress, state.record, 250)
    expect(state.completed).toBeNull()
    expect(state.progress.xp).toBe(15)
  })
  it('reprend l\'XP si on repasse sous 2 L', () => {
    let state = addWater(p0, fresh(), 2000)
    state = addWater(state.progress, state.record, -250)
    expect(state.progress.xp).toBe(0)
    expect(state.record.quests.find((q) => q.id === 'water')!.done).toBe(false)
  })
  it('cocher la quête à la main met le compteur à 2 L', () => {
    expect(toggleQuest(p0, fresh(), 'water').record.waterMl).toBe(2000)
  })
  it('ne descend pas sous zéro', () => {
    expect(addWater(p0, fresh(), -500).record.waterMl).toBe(0)
  })
})
