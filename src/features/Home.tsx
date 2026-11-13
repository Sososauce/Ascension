import { cyclePosition } from '../domain/dates'
import { levelInfo, mainCounts } from '../domain/progress'
import { WATER_STEP_ML } from '../domain/quests'
import type { GameState } from '../state/game'
import { Emblem } from '../ui/kit'
import type { QuestHandlers } from './Quests'

export function Home(props: { game: GameState; backupDue: boolean; onBackup: () => void; h: QuestHandlers; onSeeQuests: () => void }) {
  const { progress, today } = props.game
  const { done, total } = mainCounts(today.quests)
  const cycle = cyclePosition(progress.cycleStart, today.date)
  const lvl = levelInfo(progress.xp)
  const next = today.quests.find((q) => !q.bonus && !q.done)
  const raw = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${today.date}T12:00:00Z`))
  const date = raw.charAt(0).toUpperCase() + raw.slice(1)

  return (
    <div className="screen spread">
      <header className="row">
        <span className="heading">JOUR {cycle.day} / 66</span>
        <span className="small muted">{date}</span>
      </header>
      {props.backupDue && (
        <div className="banner" role="status">
          <span className="small">Ta dernière sauvegarde a plus d'une semaine.</span>
          <button type="button" className="btn ghost" style={{ minHeight: 44 }} onClick={props.onBackup}>Exporter une sauvegarde</button>
        </div>
      )}
      <section aria-label="Rang" className="hero">
        <div role="img" aria-label={`${done} quêtes validées sur ${total}`}><Emblem size={208} chevrons={0} ring={today.rest ? 0 : done / total} /></div>
        <div className="stack" style={{ alignItems: 'center', gap: 6 }}>
          <span className="rankname">NON CLASSÉ</span>
          <span className="small muted center">L'anneau suit tes quêtes du jour. Les rangs arrivent bientôt.</span>
        </div>
      </section>
      <section aria-label="Résumé" className="trio">
        <div className="stat"><span className="num">{progress.streak}</span><span className="label crimson">Streak</span></div>
        <div className="sep" />
        <div className="stat"><span className="num">{done}<span className="muted" style={{ fontWeight: 400 }}> / {total}</span></span><span className="label violet">Quêtes</span></div>
        <div className="sep" />
        <div className="stat"><span className="num">{lvl.level}</span><span className="label plum">Niveau</span></div>
      </section>
      {today.rest ? (
        <section className="panel">
          <span className="label violet">{today.rest === 'vacances' ? 'Vacances ou maladie' : 'Jour de repos'}</span>
          <span className="heading" style={{ fontSize: 20 }}>Tout est gelé aujourd'hui</span>
          <span className="small muted">Ta streak ne bouge pas.</span>
        </section>
      ) : next ? (
        <section aria-label="Prochaine quête" className="panel" style={{ gap: 16 }}>
          <div className="stack" style={{ gap: 6 }}>
            <span className="label violet">Prochaine quête</span>
            <span className="heading" style={{ fontSize: 20 }}>{next.title}</span>
            <span className="small muted">{next.detail} · +{next.xp} XP</span>
          </div>
          {next.kind === 'session' ? (
            <button type="button" className="btn" onClick={props.h.onStartSession}>Lancer la séance</button>
          ) : next.kind === 'water' ? (
            <button type="button" className="btn" onClick={() => props.h.onWater(WATER_STEP_ML)}>+ 25 cl ({(today.waterMl / 1000).toLocaleString('fr-FR')} L bus)</button>
          ) : (
            <button type="button" className="btn" onClick={() => props.h.onToggle(next.id)}>Valider</button>
          )}
          <button type="button" className="link" style={{ minHeight: 32 }} onClick={props.onSeeQuests}>Voir toutes les quêtes</button>
        </section>
      ) : (
        <section className="panel">
          <span className="label green">Journée complète</span>
          <span className="heading" style={{ fontSize: 20 }}>Toutes les quêtes sont faites</span>
          <span className="small muted">Reviens demain pour la suite du cycle.</span>
        </section>
      )}
    </div>
  )
}

export function ComingSoon({ title, text }: { title: string; text: string }) {
  return (
    <div className="screen">
      <header><h1 className="heading">{title}</h1></header>
      <div className="grow" style={{ display: 'flex', alignItems: 'center' }}>
        <section className="panel plain" style={{ width: '100%' }}>
          <span className="label">Bientôt</span>
          <span className="small muted">{text}</span>
        </section>
      </div>
    </div>
  )
}
