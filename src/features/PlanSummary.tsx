import { formatMinutes, freeTimeSummary } from '../domain/freeTime'
import { nutritionPlan } from '../domain/nutrition'
import type { Profile } from '../domain/types'

export function freeTimeLabel(p: Profile): { value: string; sub: string } {
  const s = freeTimeSummary(p)
  const parts: string[] = []
  const subs: string[] = []
  if (s.workdayAverage !== null) { parts.push(formatMinutes(s.workdayAverage)); subs.push('jours travaillés') }
  if (s.restdayAverage !== null) { parts.push(formatMinutes(s.restdayAverage)); subs.push('jours libres') }
  return { value: parts.join(' · '), sub: subs.join(' · ') }
}

export function PlanSummary({ profile }: { profile: Profile }) {
  const n = nutritionPlan(profile)
  const ft = freeTimeLabel(profile)
  return (
    <>
      <section aria-label="Besoins quotidiens" className="stack lg" style={{ alignItems: 'center', gap: 20 }}>
        <span className="huge">
          {n.target.toLocaleString('fr-FR')} <span className="muted" style={{ fontSize: 16, fontWeight: 400 }}>kcal par jour</span>
        </span>
        <div className="trio" style={{ width: '100%' }}>
          <div className="stat"><span className="num">{n.proteinG} g</span><span className="label crimson">Protéines</span></div>
          <div className="sep" />
          <div className="stat"><span className="num">{n.carbsG} g</span><span className="label violet">Glucides</span></div>
          <div className="sep" />
          <div className="stat"><span className="num">{n.fatG} g</span><span className="label plum">Lipides</span></div>
        </div>
      </section>
      <section aria-label="Ton rythme" className="lines">
        <div><span className="label">Temps libre</span><span className="val"><b>{ft.value}</b><span className="tiny muted">{ft.sub}</span></span></div>
        <div><span className="label">Dépense estimée</span><span className="val"><b>{n.tdee.toLocaleString('fr-FR')} kcal</b><span className="tiny muted">métabolisme de base : {n.bmr.toLocaleString('fr-FR')} kcal</span></span></div>
        <div><span className="label">Quêtes</span><span className="val"><b>5 par jour</b><span className="tiny muted">calibrées sur ton temps libre</span></span></div>
      </section>
    </>
  )
}
