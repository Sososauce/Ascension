import { openDB, type IDBPDatabase } from 'idb'
import type { DayRecord, Progress } from '../domain/progress'
import type { Profile } from '../domain/types'

export const DB_NAME = 'ascension'
export const SCHEMA_VERSION = 2

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
        // v1 : magasin clé-valeur (profil, méta, progression). v2 : une fiche par jour de jeu.
        if (!database.objectStoreNames.contains('kv')) database.createObjectStore('kv')
        if (!database.objectStoreNames.contains('days')) database.createObjectStore('days', { keyPath: 'date' })
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

export async function getProgress(): Promise<Progress | null> {
  return ((await (await db()).get('kv', 'progress')) as Progress | undefined) ?? null
}

export async function saveProgress(progress: Progress): Promise<void> {
  await (await db()).put('kv', progress, 'progress')
}

export async function getAllDays(): Promise<DayRecord[]> {
  return (await (await db()).getAll('days')) as DayRecord[]
}

export async function putDays(records: DayRecord[]): Promise<void> {
  if (records.length === 0) return
  const tx = (await db()).transaction('days', 'readwrite')
  for (const r of records) await tx.store.put(r)
  await tx.done
}

export interface AllData {
  kv: Record<string, unknown>
  days: unknown[]
}

/** Lit toutes les données (pour la sauvegarde). */
export async function readAll(): Promise<AllData> {
  const d = await db()
  const kv: Record<string, unknown> = {}
  for (const k of await d.getAllKeys('kv')) kv[String(k)] = await d.get('kv', k)
  return { kv, days: await d.getAll('days') }
}

/** Remplace tout le contenu (restauration d'une sauvegarde). */
export async function replaceAll(data: AllData): Promise<void> {
  const d = await db()
  const tx = d.transaction(['kv', 'days'], 'readwrite')
  await tx.objectStore('kv').clear()
  await tx.objectStore('days').clear()
  for (const [k, v] of Object.entries(data.kv)) await tx.objectStore('kv').put(v, k)
  for (const day of data.days) await tx.objectStore('days').put(day)
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
