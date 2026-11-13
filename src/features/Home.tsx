import { formatMinutes, freeMinutesForDay, sessionMinutes } from '../domain/freeTime'
import { nutritionPlan } from '../domain/nutrition'
import type { Profile } from '../domain/types'
import { Emblem } from '../ui/kit'

/** Index du jour (0 = lundi) en tenant compte de l'heure de clôture : avant 4 h, on est encore « hier ». */
export function gameDayIndex(now: Date, closeHour: number): number {
  const shifted = new Date(now.getTime() - closeHour * 3_600_000)
  return (shifted.getDay() + 6) % 7
}

export function Home(props: { profile: Profile; backupDue: boolean; onBackup: () => void }) {
  const now = new Date()
  const dayIndex = gameDayIndex(now, props.profile.dayCloseHour)
  const free = freeMinutesForDay(props.profile, dayIndex)
  const n = nutritionPlan(props.profile)
  const rawDate = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(now)
  const date = rawDate.charAt(0).toUpperCase() + rawDate.slice(1)
  return (
    <div className="screen spread">
      <header className="row">
        <span className="heading">PLACEMENT</span>
        <span className="small muted">{date}</span>
      </header>
      {props.backupDue && (
        <div className="banner" role="status">
          <span className="small">Ta dernière sauvegarde a plus d'une semaine.</span>
          <button type="button" className="btn ghost" style={{ minHeight: 44 }} onClick={props.onBackup}>Exporter une sauvegarde</button>
        </div>
      )}
      <section aria-label="Rang" className="hero">
        <Emblem size={208} chevrons={0} ring={0} />
        <div className="stack" style={{ alignItems: 'center', gap: 6 }}>
          <span className="rankname">NON CLASSÉ</span>
          <span className="small muted">0 / 5 jours de placement</span>
        </div>
      </section>
      <section aria-label="Aujourd'hui" className="trio">
        <div className="stat"><span className="num">{formatMinutes(free)}</span><span className="label crimson">Temps libre</span></div>
        <div className="sep" />
        <div className="stat"><span className="num">{sessionMinutes(free)} min</span><span className="label violet">Séance</span></div>
        <div className="sep" />
        <div className="stat"><span className="num">{n.target.toLocaleString('fr-FR')}</span><span className="label plum">kcal</span></div>
      </section>
      <section aria-label="Prochaine étape" className="panel">
        <span className="label violet">Prochaine étape</span>
        <span className="heading" style={{ fontSize: 20 }}>Les quêtes arrivent</span>
        <span className="small muted">Ton profil est enregistré. Les quêtes quotidiennes, l'XP et les placements seront ajoutés à la prochaine mise à jour.</span>
      </section>
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
