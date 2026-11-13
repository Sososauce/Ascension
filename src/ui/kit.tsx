import { useEffect, useState, type ReactNode } from 'react'

export function Steps({ current, total }: { current: number; total: number }) {
  return (
    <div className="steps" role="img" aria-label={`Étape ${current} sur ${total}`} style={{ gridTemplateColumns: `repeat(${total}, 1fr)` }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={i < current - 1 ? 'done' : i === current - 1 ? 'now' : ''} />
      ))}
    </div>
  )
}

export interface ChipItem<T> {
  value: T
  label: string
  disabled?: boolean
}

export function Chips<T extends string | number>(props: {
  label: string
  items: ChipItem<T>[]
  cols: number
  isOn: (v: T) => boolean
  onToggle: (v: T) => void
  note?: string
}) {
  return (
    <div className="stack">
      <span className="label">{props.label}</span>
      <div className="chips" role="group" aria-label={props.label} style={{ gridTemplateColumns: `repeat(${props.cols}, 1fr)` }}>
        {props.items.map((it, i) => (
          <button key={i} type="button" className="chip" aria-pressed={props.isOn(it.value)} disabled={it.disabled} onClick={() => props.onToggle(it.value)}>
            {it.label}
          </button>
        ))}
      </div>
      {props.note && <span className="tiny muted">{props.note}</span>}
    </div>
  )
}

export function Option(props: { title: string; sub: string; on: boolean; onClick: () => void; className?: string; icon?: ReactNode }) {
  return (
    <button type="button" className={`option ${props.className ?? ''}`} aria-pressed={props.on} onClick={props.onClick}>
      {props.icon}
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <b>{props.title}</b>
        <span>{props.sub}</span>
      </span>
    </button>
  )
}

export function TextField(props: { id: string; label: string; value: string; onChange: (v: string) => void; type?: 'text' | 'time'; placeholder?: string; bad?: boolean }) {
  return (
    <div className="field">
      <label className="label" htmlFor={props.id}>{props.label}</label>
      <input id={props.id} className={`input ${props.bad ? 'bad' : ''}`} type={props.type ?? 'text'} value={props.value} placeholder={props.placeholder} onChange={(e) => props.onChange(e.target.value)} />
    </div>
  )
}

/** Champ numérique : garde le texte tapé, remonte un nombre (NaN si vide ou invalide). */
export function NumberField(props: { id: string; label: string; value: number | null; onChange: (v: number) => void; bad?: boolean; decimal?: boolean; placeholder?: string }) {
  const [text, setText] = useState(props.value === null || Number.isNaN(props.value) ? '' : String(props.value).replace('.', ','))
  useEffect(() => {
    const current = Number(text.replace(',', '.'))
    if (props.value !== null && !Number.isNaN(props.value) && current !== props.value) setText(String(props.value).replace('.', ','))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.value])
  return (
    <div className="field">
      <label className="label" htmlFor={props.id}>{props.label}</label>
      <input
        id={props.id}
        className={`input ${props.bad ? 'bad' : ''}`}
        type="text"
        inputMode={props.decimal ? 'decimal' : 'numeric'}
        value={text}
        placeholder={props.placeholder}
        onChange={(e) => {
          const t = e.target.value.replace(/[^0-9.,]/g, '')
          setText(t)
          props.onChange(t.trim() === '' ? NaN : Number(t.replace(',', '.')))
        }}
      />
    </div>
  )
}

/** Emblème de rang original : écusson pointu, chevrons selon la division. `chevrons = 0` : rang inconnu (placement). */
export function Emblem({ size, chevrons, ring }: { size: number; chevrons: number; ring?: number }) {
  const C = 565.49
  const shield = (
    <g stroke="currentColor" strokeLinejoin="miter">
      <path d="M36 2 60 15v31L36 70 12 46V15z" fill="#07060B" strokeWidth="1.5" />
      <path d="M36 9 54 19v24L36 61 18 43V19z" fill="currentColor" fillOpacity="0.08" strokeWidth="0.7" strokeOpacity="0.4" />
      {chevrons >= 1 && <path d="M22 31 36 19l14 12v7L36 26 22 38z" fill="currentColor" stroke="none" />}
      {chevrons >= 2 && <path d="M22 44 36 32l14 12v7L36 39 22 51z" fill="currentColor" fillOpacity="0.55" stroke="none" />}
      {chevrons === 0 && <path d="M36 28v14M36 48v2" strokeWidth="3" strokeLinecap="square" />}
    </g>
  )
  if (ring === undefined) {
    return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 72 72" fill="none">{shield}</svg>
  }
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 208 208" fill="none">
      <circle cx="104" cy="104" r="101" stroke="#2C1A4F" strokeWidth="2" strokeDasharray="1 9.58" />
      <circle cx="104" cy="104" r="90" stroke="#1A1A1F" strokeWidth="5" />
      {ring > 0 && <circle cx="104" cy="104" r="90" stroke="currentColor" strokeWidth="5" strokeDasharray={`${(C * ring).toFixed(1)} ${C}`} transform="rotate(-90 104 104)" />}
      <g transform="translate(47 47) scale(1.583)">{shield}</g>
    </svg>
  )
}

export function Icon({ d, size = 22 }: { d: string; size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter">
      <path d={d} />
    </svg>
  )
}

export const ICONS = {
  home: 'M4 11l8-7 8 7v9h-5v-6H9v6H4z',
  quests: 'M5 6l2 2 3-3M5 13l2 2 3-3M13 7h7M13 14h7M5 20h15',
  meals: 'M7 3v8h4V3M9 3v18M17 3v18M14 3h3v9h-3z',
  profile: 'M8 4h8v8H8zM4 21v-5h16v5',
  loss: 'M4 6l7 7 3-3 6 8M20 13v5h-5',
  mass: 'M3 12h18M6 8v8M18 8v8M3 10v4M21 10v4',
  keep: 'M3 12h18M12 5v14M7 8l-4 4 4 4M17 8l4 4-4 4',
  energy: 'M13 3 5 13h6l-1 8 8-10h-6z',
  share: 'M12 15V3M7 8l5-5 5 5M5 12v8h14v-8',
}

export const MEDICAL_NOTE = 'Ces repères ne remplacent pas un avis médical.'
