import { useRef, useState } from 'react'
import type { Meta } from '../db/db'
import { daysSince } from '../db/backup'
import type { Profile } from '../domain/types'
import { Chips, MEDICAL_NOTE } from '../ui/kit'
import { PlanSummary } from './PlanSummary'

const GOAL_LABEL = { perte: 'Perte de poids', masse: 'Prise de masse', maintien: 'Maintien', energie: 'Énergie' }

export function ProfileScreen(props: {
  profile: Profile
  meta: Meta | null
  onEdit: () => void
  onExport: () => Promise<void>
  onImport: (text: string) => Promise<void>
  onCloseHour: (h: number) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
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
      <PlanSummary profile={props.profile} />
      <Chips label="Clôture de la journée" cols={5} items={[0, 2, 3, 4, 5].map((h) => ({ value: h, label: h === 0 ? 'Minuit' : `${h} h` }))} isOn={(h) => props.profile.dayCloseHour === h} onToggle={props.onCloseHour} note="Avant cette heure, ce que tu valides compte pour la veille." />
      <section aria-label="Réglages">
        <button type="button" className="rowbtn" onClick={props.onEdit}><span>Modifier mon profil</span><span className="small muted">Objectif, rythme de vie</span></button>
        <button type="button" className="rowbtn" onClick={doExport}><span>Exporter une sauvegarde</span><span className="small muted">{lastLabel}</span></button>
        <button type="button" className="rowbtn" onClick={() => fileRef.current?.click()}><span>Importer une sauvegarde</span><span className="small muted">Fichier .json</span></button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="sr" aria-label="Fichier de sauvegarde" onChange={(e) => pickFile(e.target.files?.[0])} />
      </section>
      {message && <p className={message.ok ? 'small' : 'error'} role="status" style={message.ok ? { color: 'var(--green)' } : undefined}>{message.text}</p>}
      <p className="tiny muted center">{MEDICAL_NOTE} Tes données restent sur ce téléphone.</p>
    </div>
  )
}
