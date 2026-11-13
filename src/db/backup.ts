import { SCHEMA_VERSION } from './db'

export interface BackupFile {
  app: 'ascension'
  schemaVersion: number
  exportedAt: string
  data: Record<string, unknown>
}

export function buildBackup(data: Record<string, unknown>, now = new Date()): BackupFile {
  return { app: 'ascension', schemaVersion: SCHEMA_VERSION, exportedAt: now.toISOString(), data }
}

/** Vérifie un fichier de sauvegarde et renvoie ses données, ou lève une erreur lisible. */
export function parseBackup(text: string): Record<string, unknown> {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error("Ce fichier n'est pas une sauvegarde valide.")
  }
  const b = parsed as Partial<BackupFile>
  if (!b || b.app !== 'ascension' || typeof b.data !== 'object' || b.data === null) {
    throw new Error("Ce fichier n'est pas une sauvegarde de l'appli.")
  }
  if (typeof b.schemaVersion !== 'number' || b.schemaVersion > SCHEMA_VERSION) {
    throw new Error("Cette sauvegarde vient d'une version plus récente de l'appli.")
  }
  if (!('profile' in b.data)) throw new Error('Cette sauvegarde ne contient pas de profil.')
  return b.data
}

export function backupFileName(now = new Date()): string {
  return `ascension-sauvegarde-${now.toISOString().slice(0, 10)}.json`
}

/** Nombre de jours entiers écoulés depuis une date ISO. */
export function daysSince(iso: string, now = new Date()): number {
  return Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000)
}
