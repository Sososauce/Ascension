import { SCHEMA_VERSION, type AllData } from './db'

export interface BackupFile {
  app: 'ascension'
  schemaVersion: number
  exportedAt: string
  data: AllData
}

export function buildBackup(data: AllData, now = new Date()): BackupFile {
  return { app: 'ascension', schemaVersion: SCHEMA_VERSION, exportedAt: now.toISOString(), data }
}

/** Vérifie un fichier de sauvegarde et renvoie ses données, ou lève une erreur lisible. */
export function parseBackup(text: string): AllData {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error("Ce fichier n'est pas une sauvegarde valide.")
  }
  const b = parsed as { app?: unknown; schemaVersion?: unknown; data?: unknown }
  if (!b || b.app !== 'ascension' || typeof b.data !== 'object' || b.data === null) {
    throw new Error("Ce fichier n'est pas une sauvegarde de l'appli.")
  }
  if (typeof b.schemaVersion !== 'number' || b.schemaVersion > SCHEMA_VERSION) {
    throw new Error("Cette sauvegarde vient d'une version plus récente de l'appli.")
  }
  // Les sauvegardes de la version 1 ne contenaient que le magasin clé-valeur.
  const raw = b.data as Record<string, unknown>
  const data: AllData = b.schemaVersion === 1 ? { kv: raw, days: [] } : { kv: (raw.kv ?? {}) as Record<string, unknown>, days: Array.isArray(raw.days) ? raw.days : [] }
  if (typeof data.kv !== 'object' || data.kv === null || !('profile' in data.kv)) throw new Error('Cette sauvegarde ne contient pas de profil.')
  return data
}

export function backupFileName(now = new Date()): string {
  return `ascension-sauvegarde-${now.toISOString().slice(0, 10)}.json`
}

/** Nombre de jours entiers écoulés depuis une date ISO. */
export function daysSince(iso: string, now = new Date()): number {
  return Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000)
}
