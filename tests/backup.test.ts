import { describe, expect, it } from 'vitest'
import { backupFileName, buildBackup, daysSince, parseBackup } from '../src/db/backup'

describe('sauvegarde JSON', () => {
  it('fait un aller-retour sans perte', () => {
    const data = { kv: { profile: { age: 30 }, progress: { xp: 40 } }, days: [{ date: '2026-11-13' }] }
    expect(parseBackup(JSON.stringify(buildBackup(data)))).toEqual(data)
  })
  it('relit une sauvegarde de la version 1 (profil seul)', () => {
    const v1 = { app: 'ascension', schemaVersion: 1, exportedAt: '2026-11-13T10:00:00Z', data: { profile: { age: 30 }, meta: {} } }
    expect(parseBackup(JSON.stringify(v1))).toEqual({ kv: { profile: { age: 30 }, meta: {} }, days: [] })
  })
  it('refuse un fichier qui n\'est pas du JSON', () => {
    expect(() => parseBackup('pas du json')).toThrow()
  })
  it('refuse un JSON qui ne vient pas de l\'appli', () => {
    expect(() => parseBackup(JSON.stringify({ app: 'autre', data: {} }))).toThrow()
  })
  it('refuse une sauvegarde sans profil', () => {
    expect(() => parseBackup(JSON.stringify(buildBackup({ kv: { meta: {} }, days: [] })))).toThrow()
  })
  it('refuse une sauvegarde d\'une version plus récente', () => {
    const b = { ...buildBackup({ kv: { profile: {} }, days: [] }), schemaVersion: 999 }
    expect(() => parseBackup(JSON.stringify(b))).toThrow()
  })
  it('nomme le fichier avec la date', () => {
    expect(backupFileName(new Date('2026-11-13T10:00:00Z'))).toBe('ascension-sauvegarde-2026-11-13.json')
  })
  it('compte les jours depuis le dernier export', () => {
    expect(daysSince('2026-11-06T10:00:00Z', new Date('2026-11-13T10:00:00Z'))).toBe(7)
    expect(daysSince('2026-11-13T09:00:00Z', new Date('2026-11-13T10:00:00Z'))).toBe(0)
  })
})
