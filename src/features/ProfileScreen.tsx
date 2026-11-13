import { useRef, useState } from 'react'
import type { Meta } from '../db/db'
import { daysSince } from '../db/backup'
import { addDays } from '../domain/dates'
import { levelInfo, type Progress } from '../domain/progress'
import type { Profile } from '../domain/types'
import { Chips, MEDICAL_NOTE } from '../ui/kit'
import { PlanSummary } from './PlanSummary'

const GOAL_LABEL = { perte: 'Perte de poids', masse: 'Prise de masse', maintien: 'Maintien', energie: 'Énergie' }

export function ProfileScreen(props: {
  profile: Profile
  progress: Progress
  today: string
  onVacation: (range: { from: string; to: string } | null) => void
  meta: Meta | null
  onEdit: () => void
  onExport: () => Promise<void>
  onImport: (text: string) => Promise<void>
  onCloseHour: (h: number) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const lvl = levelInfo(props.progress.xp)
  const [vacTo, setVacTo] = useState(addDays(props.today, 7))
  const vac = props.progress.vacation
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null)
  const last = props.meta?.lastExportAt
  const lastLabel = !last ? 'Jamais exportée' : daysSince(last) === 0 ? "Exportée aujourd'hui" : `Exportée il y a ${daysSince(last)} j`

  const pickFile = async (file: File | undefined) => {
    if (!file) return
    if (!window.confirm('Importer cette sauvegarde remplacera toutes les données actuelles. Continuer ?')) return
    try {
      await props.onImport(await file.text())
      setMessage({ text: 'Sauvegarde importée.', ok: true })
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : "L'import a échoué.", ok: false })
    }
    if (fileRef.current) fileRef.current.value = ''
  }
  const doExport = async () => {
    try {
      await props.onExport()
      setMessage({ text: 'Sauvegarde exportée.', ok: true })
    } catch {
      setMessage({ text: "L'export a été annulé ou a échoué.", ok: false })
    }
  }

  return (
    <div className="screen">
      <header className="row">
        <h1 className="heading">PROFIL</h1>
        <span className="small muted">{GOAL_LABEL[props.profile.goal]}</span>
      </header>
      <section aria-label="Niveau" className="stack">
        <div className="row"><span className="label plum">Niveau {lvl.level}</span><span className="tiny muted">{lvl.into} / {lvl.need} XP · record de streak : {props.progress.bestStreak} j</span></div>
        <div className="bar"><div style={{ width: `${(lvl.into / lvl.need) * 100}%` }} /></div>
      </section>
      <StatsRadar stats={props.progress.stats} />
      <PlanSummary profile={props.profile} />
      <section aria-label="Vacances ou maladie" className="panel plain">
        <span className="label">Vacances ou maladie</span>
        {vac ? (
          <>
            <span className="small">Actif jusqu'au {new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${vac.to}T12:00:00Z`))} inclus. Tout est gelé sur la période.</span>
            <button type="button" className="btn ghost" style={{ minHeight: 44 }} onClick={() => props.onVacation(null)}>Terminer maintenant</button>
          </>
        ) : (
          <>
            <span className="small muted">Gèle la streak à partir d'aujourd'hui, sans consommer tes jours de repos.</span>
            <div className="field"><label className="label" htmlFor="vacto">Jusqu'au (inclus)</label><input id="vacto" className="input" type="date" min={props.today} value={vacTo} onChange={(e) => setVacTo(e.target.value)} /></div>
            <button type="button" className="btn ghost" style={{ minHeight: 44 }} disabled={!vacTo || vacTo < props.today} onClick={() => props.onVacation({ from: props.today, to: vacTo })}>Activer</button>
          </>
        )}
      </section>
      <Chips label="Clôture de la journée" cols={5} items={[0, 2, 3, 4, 5].map((h) => ({ value: h, label: h === 0 ? 'Minuit' : `${h} h` }))} isOn={(h) => props.profile.dayCloseHour === h} onToggle={props.onCloseHour} note="Avant cette heure, ce que tu valides compte pour la veille." />
      <section aria-label="Réglages">
        <button type="button" className="rowbtn" onClick={props.onEdit}><span>Modifier mon profil</span><span className="small muted">Objectif, rythme de vie</span></button>
        <button type="button" className="rowbtn" onClick={doExport}><span>Exporter une sauvegarde</span><span className="small muted">{lastLabel}</span></button>
        <button type="button" className="rowbtn" onClick={() => fileRef.current?.click()}><span>Importer une sauvegarde</span><span className="small muted">Fichier .json</span></button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="sr" aria-label="Fichier de sauvegarde" onChange={(e) => pickFile(e.target.files?.[0])} />
      </section>
      {message && <p className={message.ok ? 'small' : 'error'} role="status" style={message.ok ? { color: 'var(--green)' } : undefined}>{message.text}</p>}
      <p className="tiny muted center">{MEDICAL_NOTE} Tes données restent sur ce téléphone. Exercices et images : free-exercise-db.</p>
    </div>
  )
}

const AXES: { key: 'force' | 'endurance' | 'discipline' | 'nutrition'; label: string; color: string }[] = [
  { key: 'force', label: 'FORCE', color: '#E07A86' },
  { key: 'endurance', label: 'ENDURANCE', color: '#E07A86' },
  { key: 'discipline', label: 'DISCIPLINE', color: '#C98BD6' },
  { key: 'nutrition', label: 'NUTRITION', color: '#A990E8' },
]

/** Les quatre stats en losange : Force en haut, Endurance à droite, Discipline en bas, Nutrition à gauche. */
function StatsRadar({ stats }: { stats: Progress['stats'] }) {
  const max = Math.max(10, Math.ceil(Math.max(...Object.values(stats)) / 10) * 10)
  const r = (v: number) => 12 + (v / max) * 68
  const cx = 171
  const cy = 118
  const pts = [[cx, cy - r(stats.force)], [cx + r(stats.endurance), cy], [cx, cy + r(stats.discipline)], [cx - r(stats.nutrition), cy]]
  return (
    <section aria-label="Stats du personnage" style={{ display: 'flex', justifyContent: 'center' }}>
      <svg role="img" aria-label={AXES.map((a) => `${a.label.toLowerCase()} ${stats[a.key]}`).join(', ')} width="100%" viewBox="0 0 342 236" fill="none" style={{ maxWidth: 342, fontFamily: 'Inter, sans-serif' }}>
        <path d={`M${cx} ${cy - 80} ${cx + 80} ${cy} ${cx} ${cy + 80} ${cx - 80} ${cy}z`} stroke="#1A1A1F" />
        <path d={`M${cx} ${cy - 40} ${cx + 40} ${cy} ${cx} ${cy + 40} ${cx - 40} ${cy}z`} stroke="#1A1A1F" />
        <path d={`M${cx} ${cy - 80}v160M${cx - 80} ${cy}h160`} stroke="#1A1A1F" />
        <path d={`M${pts.map((p) => p.join(' ')).join(' ')}z`} fill="#5A3BAA" fillOpacity="0.25" stroke="#A990E8" strokeWidth="1.5" />
        <text x={cx} y="14" textAnchor="middle" fontSize="11" letterSpacing="1.5" fill={AXES[0].color}>{AXES[0].label}</text>
        <text x={cx} y="30" textAnchor="middle" fontSize="15" fontWeight="600" fill="#E6E2D8">{stats.force}</text>
        <text x={cx} y="216" textAnchor="middle" fontSize="15" fontWeight="600" fill="#E6E2D8">{stats.discipline}</text>
        <text x={cx} y="232" textAnchor="middle" fontSize="11" letterSpacing="1.5" fill={AXES[2].color}>{AXES[2].label}</text>
        <text x={cx + 92} y={cy - 4} textAnchor="start" fontSize="11" letterSpacing="1.5" fill={AXES[1].color}>{AXES[1].label}</text>
        <text x={cx + 92} y={cy + 14} textAnchor="start" fontSize="15" fontWeight="600" fill="#E6E2D8">{stats.endurance}</text>
        <text x={cx - 92} y={cy - 4} textAnchor="end" fontSize="11" letterSpacing="1.5" fill={AXES[3].color}>{AXES[3].label}</text>
        <text x={cx - 92} y={cy + 14} textAnchor="end" fontSize="15" fontWeight="600" fill="#E6E2D8">{stats.nutrition}</text>
      </svg>
    </section>
  )
}
