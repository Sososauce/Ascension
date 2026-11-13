import { openDB, type IDBPDatabase } from 'idb'
import type { Profile } from '../domain/types'

export const DB_NAME = 'ascension'
export const SCHEMA_VERSION = 1

export interface Meta {
  schemaVersion: number
  createdAt: string
  /** Date ISO du dernier export de sauvegarde, ou null. */
  lastExportAt: string | null
}

let dbPromise: Promise<IDBPDatabase> | null = null

function db(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, SCHEMA_VERSION, {
      upgrade(database) {
        // Phase 1 : un magasin clé-valeur (profil, méta). Les phases suivantes
        // ajouteront leurs magasins (jours, progression, plans repas) ici.
        if (!database.objectStoreNames.contains('kv')) database.createObjectStore('kv')
      },
    })
  }
  return dbPromise
}

export async function getProfile(): Promise<Profile | null> {
  return ((await (await db()).get('kv', 'profile')) as Profile | undefined) ?? null
}

export async function saveProfile(profile: Profile): Promise<void> {
  const d = await db()
  await d.put('kv', profile, 'profile')
  if (!(await d.get('kv', 'meta'))) {
    const meta: Meta = { schemaVersion: SCHEMA_VERSION, createdAt: new Date().toISOString(), lastExportAt: null }
    await d.put('kv', meta, 'meta')
  }
}

export async function getMeta(): Promise<Meta | null> {
  return ((await (await db()).get('kv', 'meta')) as Meta | undefined) ?? null
}

export async function saveMeta(meta: Meta): Promise<void> {
  await (await db()).put('kv', meta, 'meta')
}

/** Lit tout le magasin clé-valeur (pour la sauvegarde). */
export async function readAll(): Promise<Record<string, unknown>> {
  const d = await db()
  const keys = await d.getAllKeys('kv')
  const out: Record<string, unknown> = {}
  for (const k of keys) out[String(k)] = await d.get('kv', k)
  return out
}

/** Remplace tout le contenu (restauration d'une sauvegarde). */
export async function replaceAll(data: Record<string, unknown>): Promise<void> {
  const d = await db()
  const tx = d.transaction('kv', 'readwrite')
  await tx.store.clear()
  for (const [k, v] of Object.entries(data)) await tx.store.put(v, k)
  await tx.done
}

/** Demande au navigateur de ne pas effacer les données en cas de manque de place. */
export async function requestPersistence(): Promise<void> {
  try {
    await navigator.storage?.persist?.()
  } catch {
    /* sans effet si non pris en charge */
  }
}
