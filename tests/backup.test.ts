import { describe, expect, it } from 'vitest'
import { backupFileName, buildBackup, daysSince, parseBackup } from '../src/db/backup'

describe('sauvegarde JSON', () => {
  it('fait un aller-retour sans perte', () => {
    const data = { profile: { age: 30 }, meta: { schemaVersion: 1 } }
    expect(parseBackup(JSON.stringify(buildBackup(data)))).toEqual(data)
  })
  it('refuse un fichier qui n\'est pas du JSON', () => {
    expect(() => parseBackup('pas du json')).toThrow()
  })
  it('refuse un JSON qui ne vient pas de l\'appli', () => {
    expect(() => parseBackup(JSON.stringify({ app: 'autre', data: {} }))).toThrow()
  })
  it('refuse une sauvegarde sans profil', () => {
    expect(() => parseBackup(JSON.stringify(buildBackup({ meta: {} })))).toThrow()
  })
  it('refuse une sauvegarde d\'une version plus récente', () => {
    const b = { ...buildBackup({ profile: {} }), schemaVersion: 999 }
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
