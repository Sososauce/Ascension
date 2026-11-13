import { useCallback, useEffect, useRef, useState } from 'react'
import { backupFileName, buildBackup, daysSince, parseBackup } from './db/backup'
import { getMeta, getProfile, readAll, replaceAll, requestPersistence, saveMeta, saveProfile, type Meta } from './db/db'
import { gameDate } from './domain/dates'
import { levelInfo } from './domain/progress'
import { DEFAULT_PROFILE, type Profile } from './domain/types'
import { ComingSoon, Home } from './features/Home'
import { InstallGate, isStandalone } from './features/InstallGate'
import { Onboarding } from './features/Onboarding'
import { ProfileScreen } from './features/ProfileScreen'
import { Quests, type QuestHandlers } from './features/Quests'
import { SessionPlayer } from './features/SessionPlayer'
import { doRest, doToggle, doVacation, doWater, loadGame, type GameState } from './state/game'
import { Icon, ICONS } from './ui/kit'

type Tab = 'home' | 'quests' | 'meals' | 'profile'
const TABS: [Tab, string, string][] = [
  ['home', 'Accueil', ICONS.home],
  ['quests', 'Quêtes', ICONS.quests],
  ['meals', 'Repas', ICONS.meals],
  ['profile', 'Profil', ICONS.profile],
]
const STAT_LABEL = { force: 'Force', endurance: 'Endurance', discipline: 'Discipline', nutrition: 'Nutrition' }
const STATUS_LABEL = { validee: 'validée', partielle: 'partielle', ratee: 'ratée', repos: 'repos', ouverte: 'ouverte' }

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
  const [game, setGame] = useState<GameState | null>(null)
  const [tab, setTab] = useState<Tab>('home')
  const [editing, setEditing] = useState(false)
  const [inSession, setInSession] = useState(false)
  const [toast, setToast] = useState<{ id: number; xp: number; stat: string } | null>(null)
  const [levelUp, setLevelUp] = useState<number | null>(null)
  const [recap, setRecap] = useState<GameState['justSettled']>([])
  const [browserOk, setBrowserOk] = useState(() => isStandalone() || sessionStorage.getItem('browserOk') === '1')
  const gameRef = useRef<GameState | null>(null)
  gameRef.current = game

  const reload = useCallback(async () => {
    const p = await getProfile()
    setProfile(p)
    setMeta(await getMeta())
    if (p) {
      const g = await loadGame(p)
      setGame(g)
      if (g.justSettled.length > 0) setRecap(g.justSettled)
    } else setGame(null)
  }, [])

  useEffect(() => {
    reload().finally(() => setLoading(false))
  }, [reload])

  // Au retour dans l'appli, on recharge si le jour de jeu a changé (passage de l'heure de clôture).
  useEffect(() => {
    const onVisible = () => {
      const g = gameRef.current
      if (document.visibilityState === 'visible' && profile && g && gameDate(new Date(), profile.dayCloseHour) !== g.today.date) void reload()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [profile, reload])

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

  if (!profile || editing || !game) {
    return (
      <div className="app">
        <Onboarding initial={profile ?? DEFAULT_PROFILE} editing={editing} onDone={save} onCancel={editing ? () => setEditing(false) : undefined} />
      </div>
    )
  }

  /** Applique une action de jeu et déclenche les retours visuels (XP gagnée, niveau supérieur). */
  const act = async (run: (g: GameState) => Promise<{ state: GameState; completed: string | null }>) => {
    const before = levelInfo(game.progress.xp).level
    const { state, completed } = await run(game)
    setGame(state)
    if (completed) {
      const quest = state.today.quests.find((q) => q.id === completed)
      if (quest) setToast({ id: Date.now(), xp: quest.xp, stat: STAT_LABEL[quest.stat] })
      const after = levelInfo(state.progress.xp).level
      if (after > before) setLevelUp(after)
    }
  }
  const handlers: QuestHandlers = {
    onToggle: (id) => void act((g) => doToggle(g, id)),
    onWater: (ml) => void act((g) => doWater(g, ml)),
    onStartSession: () => setInSession(true),
  }
  const sessionQuest = game.today.quests.find((q) => q.kind === 'session')

  if (inSession && sessionQuest?.session) {
    return (
      <div className="app">
        <SessionPlayer
          plan={sessionQuest.session}
          xp={sessionQuest.xp}
          onQuit={() => setInSession(false)}
          onFinish={() => {
            setInSession(false)
            if (!sessionQuest.done) void act((g) => doToggle(g, sessionQuest.id))
          }}
        />
      </div>
    )
  }

  const doExport = async () => {
    const now = new Date()
    await shareOrDownload(JSON.stringify(buildBackup(await readAll(), now), null, 2), backupFileName(now))
    const current = (await getMeta())!
    await saveMeta({ ...current, lastExportAt: now.toISOString() })
    setMeta(await getMeta())
  }
  const doImport = async (text: string) => {
    await replaceAll(parseBackup(text))
    await reload()
  }
  const backupDue = meta !== null && daysSince(meta.lastExportAt ?? meta.createdAt) >= 7

  return (
    <div className="app">
      {tab === 'home' && <Home game={game} backupDue={backupDue} onBackup={() => doExport().catch(() => undefined)} h={handlers} onSeeQuests={() => setTab('quests')} />}
      {tab === 'quests' && <Quests game={game} closeHour={profile.dayCloseHour} h={handlers} onRest={(on) => void doRest(game, on).then(setGame)} />}
      {tab === 'meals' && <ComingSoon title="PLAN REPAS" text="Le plan repas de la semaine et le remplacement d'un repas arrivent à la prochaine mise à jour. Tes besoins sont déjà calculés dans l'onglet Profil." />}
      {tab === 'profile' && (
        <ProfileScreen
          profile={profile}
          progress={game.progress}
          today={game.today.date}
          onVacation={(range) => void doVacation(game, range).then(setGame)}
          meta={meta}
          onEdit={() => setEditing(true)}
          onExport={doExport}
          onImport={doImport}
          onCloseHour={(h) => save({ ...profile, dayCloseHour: h })}
        />
      )}
      <nav className="nav" aria-label="Navigation principale">
        {TABS.map(([id, label, icon]) => (
          <button key={id} type="button" aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}>
            <Icon d={icon} />
            {label}
          </button>
        ))}
      </nav>

      {toast && <div key={toast.id} className="toast" role="status"><b>+{toast.xp} XP</b> · {toast.stat}</div>}
      {levelUp !== null && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="Niveau supérieur">
          <span className="label plum">Niveau supérieur</span>
          <span className="lvl">{levelUp}</span>
          <span className="small muted">Tu passes au niveau {levelUp}. Continue comme ça.</span>
          <button type="button" className="btn" style={{ maxWidth: 240 }} onClick={() => setLevelUp(null)}>Continuer</button>
        </div>
      )}
      {recap.length > 0 && levelUp === null && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="Journées clôturées">
          <span className="label violet">Pendant ton absence</span>
          <h2 className="title">{recap.length === 1 ? 'Journée clôturée' : `${recap.length} journées clôturées`}</h2>
          <div className="lines" style={{ width: '100%', maxWidth: 320 }}>
            {recap.slice(-5).map((r) => (
              <div key={r.date}>
                <span className="label">{new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${r.date}T12:00:00Z`))}</span>
                <b style={{ color: r.status === 'validee' ? 'var(--green)' : r.status === 'ratee' ? 'var(--crimson)' : 'var(--text)' }}>{STATUS_LABEL[r.status]}</b>
              </div>
            ))}
          </div>
          <span className="small muted">Streak actuelle : {game.progress.streak} jour{game.progress.streak > 1 ? 's' : ''}</span>
          <button type="button" className="btn" style={{ maxWidth: 240 }} onClick={() => setRecap([])}>Continuer</button>
        </div>
      )}
    </div>
  )
}
