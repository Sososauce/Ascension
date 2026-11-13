import { useEffect, useState } from 'react'
import { backupFileName, buildBackup, daysSince, parseBackup } from './db/backup'
import { getMeta, getProfile, readAll, replaceAll, requestPersistence, saveMeta, saveProfile, type Meta } from './db/db'
import { DEFAULT_PROFILE, type Profile } from './domain/types'
import { ComingSoon, Home } from './features/Home'
import { InstallGate, isStandalone } from './features/InstallGate'
import { Onboarding } from './features/Onboarding'
import { ProfileScreen } from './features/ProfileScreen'
import { Icon, ICONS } from './ui/kit'

type Tab = 'home' | 'quests' | 'meals' | 'profile'
const TABS: [Tab, string, string][] = [
  ['home', 'Accueil', ICONS.home],
  ['quests', 'Quêtes', ICONS.quests],
  ['meals', 'Repas', ICONS.meals],
  ['profile', 'Profil', ICONS.profile],
]

async function shareOrDownload(text: string, name: string): Promise<void> {
  const file = new File([text], name, { type: 'application/json' })
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'Sauvegarde Ascension' })
    return
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function App() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [meta, setMeta] = useState<Meta | null>(null)
  const [tab, setTab] = useState<Tab>('home')
  const [editing, setEditing] = useState(false)
  const [browserOk, setBrowserOk] = useState(() => isStandalone() || sessionStorage.getItem('browserOk') === '1')

  const reload = async () => {
    setProfile(await getProfile())
    setMeta(await getMeta())
  }
  useEffect(() => {
    reload().finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="app" />

  if (!profile && !browserOk) {
    return (
      <div className="app">
        <InstallGate onSkip={() => { sessionStorage.setItem('browserOk', '1'); setBrowserOk(true) }} />
      </div>
    )
  }

  const save = async (p: Profile) => {
    await saveProfile(p)
    await requestPersistence()
    await reload()
    setEditing(false)
  }

  if (!profile || editing) {
    return (
      <div className="app">
        <Onboarding initial={profile ?? DEFAULT_PROFILE} editing={editing} onDone={save} onCancel={editing ? () => setEditing(false) : undefined} />
      </div>
    )
  }

  const doExport = async () => {
    const now = new Date()
    await shareOrDownload(JSON.stringify(buildBackup(await readAll(), now), null, 2), backupFileName(now))
    const current = (await getMeta())!
    await saveMeta({ ...current, lastExportAt: now.toISOString() })
    await reload()
  }
  const doImport = async (text: string) => {
    await replaceAll(parseBackup(text))
    await reload()
  }
  const backupDue = meta !== null && daysSince(meta.lastExportAt ?? meta.createdAt) >= 7

  return (
    <div className="app">
      {tab === 'home' && <Home profile={profile} backupDue={backupDue} onBackup={() => doExport().catch(() => undefined)} />}
      {tab === 'quests' && <ComingSoon title="QUÊTES DU JOUR" text="Les 5 quêtes quotidiennes, l'XP, la streak et les stats arrivent à la prochaine mise à jour." />}
      {tab === 'meals' && <ComingSoon title="PLAN REPAS" text="Le plan repas de la semaine et le remplacement d'un repas arriveront ensuite. Tes besoins sont déjà calculés dans l'onglet Profil." />}
      {tab === 'profile' && (
        <ProfileScreen profile={profile} meta={meta} onEdit={() => setEditing(true)} onExport={doExport} onImport={doImport} onCloseHour={(h) => save({ ...profile, dayCloseHour: h })} />
      )}
      <nav className="nav" aria-label="Navigation principale">
        {TABS.map(([id, label, icon]) => (
          <button key={id} type="button" aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}>
            <Icon d={icon} />
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
