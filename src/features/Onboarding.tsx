import { useState } from 'react'
import { durationBetween, formatMinutes, freeTimeSummary, parseTime } from '../domain/freeTime'
import { calorieTarget } from '../domain/nutrition'
import type { Activity, CommuteMode, Diet, Equipment, Goal, Level, Profile, Specialization } from '../domain/types'
import { Chips, Icon, ICONS, MEDICAL_NOTE, NumberField, Option, Steps, TextField } from '../ui/kit'
import { PlanSummary } from './PlanSummary'

const TOTAL = 5
const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const DAY_NAMES = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche']

const inRange = (v: number, min: number, max: number) => Number.isFinite(v) && v >= min && v <= max

/** Renvoie la liste des erreurs de l'étape (vide si tout est valide). */
export function validateStep(step: number, p: Profile): string[] {
  const errors: string[] = []
  if (step === 1) {
    if (!inRange(p.age, 18, 99)) errors.push("L'âge doit être compris entre 18 et 99 ans.")
    if (!inRange(p.heightCm, 120, 230)) errors.push('La taille doit être comprise entre 120 et 230 cm.')
    if (!inRange(p.weightKg, 35, 250)) errors.push('Le poids doit être compris entre 35 et 250 kg.')
  }
  if (step === 5) {
    if (Number.isNaN(parseTime(p.bedtime)) || Number.isNaN(parseTime(p.wake))) errors.push('Indique tes heures de coucher et de lever.')
    else if (durationBetween(p.bedtime, p.wake) === 0) errors.push('Le coucher et le lever ne peuvent pas être à la même heure.')
    if (p.days.some((d) => d.worked)) {
      if (Number.isNaN(parseTime(p.workStart)) || Number.isNaN(parseTime(p.workEnd))) errors.push('Indique tes horaires de travail.')
      else if (durationBetween(p.workStart, p.workEnd) === 0) errors.push('Le début et la fin du travail ne peuvent pas être à la même heure.')
      if (!inRange(p.commuteMinutes, 0, 360)) errors.push('Le trajet doit être compris entre 0 et 360 minutes par jour.')
    }
    if (!inRange(p.obligationsWorkday, 0, 720) || !inRange(p.obligationsWeekend, 0, 720)) errors.push('Les obligations doivent être comprises entre 0 et 720 minutes.')
  }
  return errors
}

export function Onboarding(props: { initial: Profile; editing: boolean; onDone: (p: Profile) => void; onCancel?: () => void }) {
  const [p, setP] = useState<Profile>(props.initial)
  const [step, setStep] = useState(1)
  const [showErrors, setShowErrors] = useState(false)
  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => setP((prev) => ({ ...prev, [key]: value }))
  const errors = step <= TOTAL ? validateStep(step, p) : []

  const next = () => {
    if (errors.length > 0) return setShowErrors(true)
    setShowErrors(false)
    setStep(step + 1)
    document.querySelector('.screen')?.scrollTo(0, 0)
  }
  const back = () => {
    setShowErrors(false)
    if (step === 1) props.onCancel?.()
    else setStep(step - 1)
  }

  const header = (title: string) => (
    <header className="stack lg">
      <Steps current={step} total={TOTAL} />
      <div className="row">
        <span className="label violet">Étape {step} sur {TOTAL}</span>
        {(step > 1 || props.onCancel) && (
          <button type="button" className="link" style={{ minHeight: 24, padding: 0 }} onClick={back}>
            {step === 1 ? 'Annuler' : 'Retour'}
          </button>
        )}
      </div>
      <h1 className="title">{title}</h1>
    </header>
  )
  const footer = (label: string) => (
    <div className="stack">
      {showErrors && errors.map((e) => <p key={e} className="error" role="alert">{e}</p>)}
      <button type="button" className="btn" onClick={next}>{label}</button>
    </div>
  )

  if (step === 1) {
    const activities: [Activity, string, string][] = [
      ['sedentaire', 'Sédentaire', 'Travail assis, peu de marche'],
      ['leger', 'Légèrement actif', 'Un peu de marche, 1 à 2 séances par semaine'],
      ['actif', 'Actif', 'Travail debout ou 3 à 5 séances par semaine'],
      ['tres_actif', 'Très actif', 'Travail physique ou sport quotidien'],
    ]
    return (
      <div className="screen">
        {header('Qui es-tu ?')}
        <Chips label="Sexe" cols={2} items={[{ value: 'homme', label: 'Homme' }, { value: 'femme', label: 'Femme' }]} isOn={(v) => p.sex === v} onToggle={(v) => set('sex', v)} note="Sert uniquement au calcul du métabolisme de base." />
        <div className="grid3">
          <NumberField id="age" label="Âge (ans)" value={p.age} onChange={(v) => set('age', v)} bad={showErrors && !inRange(p.age, 18, 99)} />
          <NumberField id="taille" label="Taille (cm)" value={p.heightCm} onChange={(v) => set('heightCm', v)} bad={showErrors && !inRange(p.heightCm, 120, 230)} />
          <NumberField id="poids" label="Poids (kg)" value={p.weightKg} decimal onChange={(v) => set('weightKg', v)} bad={showErrors && !inRange(p.weightKg, 35, 250)} />
        </div>
        <div className="stack">
          <span className="label">Niveau d'activité</span>
          <div className="stack" role="group" aria-label="Niveau d'activité">
            {activities.map(([v, t, s]) => <Option key={v} title={t} sub={s} on={p.activity === v} onClick={() => set('activity', v)} />)}
          </div>
        </div>
        {footer('Continuer')}
      </div>
    )
  }

  if (step === 2) {
    const goals: [Goal, string, string, string][] = [
      ['perte', 'Perte de poids', 'Progressive, sans privation', ICONS.loss],
      ['masse', 'Prise de masse', 'Léger surplus et force', ICONS.mass],
      ['maintien', 'Maintien', 'Garder la forme', ICONS.keep],
      ['energie', 'Énergie', 'Mieux manger, mieux bouger', ICONS.energy],
    ]
    const c = calorieTarget(p, p.activity, p.goal)
    const explain =
      p.goal === 'perte'
        ? c.flooredBySafety
          ? `Ta dépense estimée est de ${c.tdee.toLocaleString('fr-FR')} kcal. Le déficit a été réduit pour ne pas descendre sous ton métabolisme de base.`
          : `Ta dépense estimée est de ${c.tdee.toLocaleString('fr-FR')} kcal. Le déficit est plafonné à 500 kcal et ne descend jamais sous ton métabolisme de base.`
        : p.goal === 'masse'
          ? `Ta dépense estimée est de ${c.tdee.toLocaleString('fr-FR')} kcal. Le surplus est limité à 10 % pour une prise progressive.`
          : `C'est ta dépense estimée : tu manges autant que tu dépenses.`
    return (
      <div className="screen">
        {header('Ton objectif')}
        <div className="grid2" role="group" aria-label="Objectif">
          {goals.map(([v, t, s, ic]) => <Option key={v} className="goal" title={t} sub={s} on={p.goal === v} onClick={() => set('goal', v)} icon={<Icon d={ic} size={28} />} />)}
        </div>
        <section aria-label="Ce que ça donne" className="panel crimson">
          <span className="label crimson">Ce que ça donne</span>
          <span className="big">{c.target.toLocaleString('fr-FR')} <span className="muted" style={{ fontSize: 15, fontWeight: 400 }}>kcal par jour</span></span>
          <span className="small muted">{explain}</span>
        </section>
        <p className="tiny muted center">{MEDICAL_NOTE}</p>
        {footer('Continuer')}
      </div>
    )
  }

  if (step === 3) {
    const diets: [Diet, string][] = [['aucun', 'Aucun'], ['vegetarien', 'Végétarien'], ['vegan', 'Végan'], ['halal', 'Halal'], ['sans_porc', 'Sans porc'], ['pescetarien', 'Pescétarien']]
    const kitchen: [string, string][] = [['plaques', 'Plaques'], ['four', 'Four'], ['micro-ondes', 'Micro-ondes'], ['airfryer', 'Airfryer'], ['mixeur', 'Mixeur'], ['cuiseur-riz', 'Cuiseur riz']]
    return (
      <div className="screen">
        {header('Ton alimentation')}
        <Chips label="Régime" cols={3} items={diets.map(([value, label]) => ({ value, label }))} isOn={(v) => p.diet === v} onToggle={(v) => set('diet', v)} />
        <TextField id="deteste" label="Aliments que tu n'aimes pas" value={p.dislikes} onChange={(v) => set('dislikes', v)} placeholder="champignons, betterave…" />
        <Chips label="Matériel de cuisine" cols={3} items={kitchen.map(([value, label]) => ({ value, label }))} isOn={(v) => p.kitchen.includes(v)} onToggle={(v) => set('kitchen', p.kitchen.includes(v) ? p.kitchen.filter((k) => k !== v) : [...p.kitchen, v])} />
        <Chips label="Temps de cuisine par jour" cols={4} items={[{ value: 15, label: '15 min' }, { value: 30, label: '30 min' }, { value: 45, label: '45 min' }, { value: 60, label: '1 h' }]} isOn={(v) => p.cookMinutes === v} onToggle={(v) => set('cookMinutes', v)} />
        <div className="grow" />
        {footer('Continuer')}
      </div>
    )
  }

  if (step === 4) {
    const equipment: [Equipment, string, string][] = [['aucun', 'Aucun', 'Exercices au poids du corps'], ['halteres', 'Haltères', 'Séances à la maison avec charges'], ['salle', 'Salle de sport', 'Machines, barres et poids libres']]
    const levels: [Level, string][] = [['debutant', 'Débutant'], ['intermediaire', 'Intermédiaire'], ['avance', 'Avancé']]
    const specs: [Specialization, string][] = [['force', 'Force'], ['endurance', 'Endurance'], ['mobilite', 'Mobilité']]
    return (
      <div className="screen">
        {header('Ton sport')}
        <div className="stack">
          <span className="label">Matériel disponible</span>
          <div className="stack" role="group" aria-label="Matériel disponible">
            {equipment.map(([v, t, s]) => <Option key={v} title={t} sub={s} on={p.equipment === v} onClick={() => set('equipment', v)} />)}
          </div>
        </div>
        <Chips label="Niveau" cols={3} items={levels.map(([value, label]) => ({ value, label }))} isOn={(v) => p.level === v} onToggle={(v) => set('level', v)} />
        <Chips label="Spécialisation" cols={3} items={specs.map(([value, label]) => ({ value, label }))} isOn={(v) => p.specialization === v} onToggle={(v) => set('specialization', v)} note="Tu pourras en changer à tout moment." />
        <TextField id="sport" label="Sport déjà pratiqué" value={p.currentSport} onChange={(v) => set('currentSport', v)} placeholder="Course à pied, 1 fois par semaine…" />
        <div className="grow" />
        {footer('Continuer')}
      </div>
    )
  }

  if (step === 5) {
    const anyWork = p.days.some((d) => d.worked)
    const modes: [CommuteMode, string][] = [['transports', 'Transports'], ['voiture', 'Voiture'], ['velo', 'Vélo'], ['pied', 'À pied']]
    const s = freeTimeSummary(p)
    const toggleDay = (i: number, key: 'worked' | 'remote') =>
      set('days', p.days.map((d, j) => (j !== i ? d : key === 'worked' ? { worked: !d.worked, remote: false } : { ...d, remote: !d.remote })))
    return (
      <div className="screen">
        {header('Ton rythme de vie')}
        <div className="grid2">
          <TextField id="coucher" label="Coucher" type="time" value={p.bedtime} onChange={(v) => set('bedtime', v)} />
          <TextField id="lever" label="Lever" type="time" value={p.wake} onChange={(v) => set('wake', v)} />
        </div>
        <Chips label="Jours travaillés" cols={7} items={DAY_LABELS.map((label, i) => ({ value: i, label }))} isOn={(i) => p.days[i].worked} onToggle={(i) => toggleDay(i, 'worked')} />
        {anyWork && (
          <>
            <div className="grid2">
              <TextField id="debut" label="Début du travail" type="time" value={p.workStart} onChange={(v) => set('workStart', v)} />
              <TextField id="fin" label="Fin du travail" type="time" value={p.workEnd} onChange={(v) => set('workEnd', v)} />
            </div>
            <Chips label="Dont télétravail" cols={7} items={DAY_LABELS.map((label, i) => ({ value: i, label, disabled: !p.days[i].worked }))} isOn={(i) => p.days[i].remote} onToggle={(i) => toggleDay(i, 'remote')} note="Pas de trajet compté ces jours-là." />
            <div className="grid2">
              <NumberField id="trajet" label="Trajet par jour (min)" value={p.commuteMinutes} onChange={(v) => set('commuteMinutes', v)} bad={showErrors && !inRange(p.commuteMinutes, 0, 360)} />
              <div className="field">
                <label className="label" htmlFor="mode">Mode</label>
                <select id="mode" className="input" value={p.commuteMode} onChange={(e) => set('commuteMode', e.target.value as CommuteMode)}>
                  {modes.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
          </>
        )}
        <div className="stack">
          <span className="label">Obligations fixes par jour</span>
          <div className="grid2">
            <NumberField id="obl1" label="Travaillés (min)" value={p.obligationsWorkday} onChange={(v) => set('obligationsWorkday', v)} />
            <NumberField id="obl2" label="Libres (min)" value={p.obligationsWeekend} onChange={(v) => set('obligationsWeekend', v)} />
          </div>
        </div>
        <section aria-label="Temps libre estimé" className="panel">
          <span className="label violet">Temps libre estimé</span>
          <div className="duo">
            <div className="stack" style={{ gap: 4 }}><span className="num">{s.workdayAverage === null ? '—' : formatMinutes(s.workdayAverage)}</span><span className="tiny muted">jours travaillés</span></div>
            <div className="sep" style={{ background: 'var(--violet-line)' }} />
            <div className="stack" style={{ gap: 4, paddingLeft: 20 }}><span className="num">{s.restdayAverage === null ? '—' : formatMinutes(s.restdayAverage)}</span><span className="tiny muted">jours libres</span></div>
          </div>
          <span className="tiny muted">24 h moins le sommeil, le travail, les trajets, 2 h de repas et d'hygiène, et tes obligations.</span>
          <span className="sr">{DAY_NAMES.map((n, i) => `${n} : ${formatMinutes(s.perDay[i])}`).join(', ')}</span>
        </section>
        {footer('Voir mon plan')}
      </div>
    )
  }

  // Écran final : récapitulatif
  return (
    <div className="screen">
      <header className="stack">
        <div className="row">
          <span className="label green">{props.editing ? 'Profil mis à jour' : 'Profil terminé'}</span>
          <button type="button" className="link" style={{ minHeight: 24, padding: 0 }} onClick={() => setStep(TOTAL)}>Retour</button>
        </div>
        <h1 className="title">Ton plan est prêt</h1>
      </header>
      <PlanSummary profile={p} />
      {!props.editing && (
        <section aria-label="Placements" className="panel">
          <span className="label violet">5 jours de placement</span>
          <span className="small">Tes 5 premiers jours fixent ton rang de départ, entre Fer IV et Argent IV.</span>
        </section>
      )}
      <div className="stack">
        <button type="button" className="btn" onClick={() => props.onDone(p)}>{props.editing ? 'Enregistrer' : 'Commencer'}</button>
        <p className="tiny muted center">Tout reste modifiable dans ton profil. {MEDICAL_NOTE}</p>
      </div>
    </div>
  )
}
