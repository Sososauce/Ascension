import { useEffect, useRef, useState } from 'react'
import { EXERCISE_BY_ID } from '../data/exercises'
import type { SessionPlan } from '../domain/session'

const KIND_TITLE = { force: 'SÉANCE FORCE', endurance: 'SÉANCE ENDURANCE', mobilite: 'SÉANCE MOBILITÉ' }

function clock(total: number): string {
  const s = Math.max(0, Math.ceil(total))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** Compte à rebours basé sur l'heure réelle : il reste juste même si l'écran s'est éteint. */
function useCountdown(seconds: number, running: boolean, key: string, onEnd: () => void): number {
  const [left, setLeft] = useState(seconds)
  const endRef = useRef(onEnd)
  endRef.current = onEnd
  useEffect(() => {
    setLeft(seconds)
    if (!running) return
    const end = Date.now() + seconds * 1000
    const id = window.setInterval(() => {
      const remaining = (end - Date.now()) / 1000
      setLeft(Math.max(0, remaining))
      if (remaining <= 0) {
        window.clearInterval(id)
        endRef.current()
      }
    }, 200)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, running, seconds])
  return left
}

function Ring({ fraction, color, children }: { fraction: number; color: string; children: React.ReactNode }) {
  const C = 2 * Math.PI * 90
  return (
    <div className="ringwrap" style={{ width: 208, height: 208 }}>
      <svg aria-hidden="true" width="208" height="208" viewBox="0 0 208 208" fill="none">
        <circle cx="104" cy="104" r="101" stroke="#45101A" strokeWidth="2" strokeDasharray="1 9.58" />
        <circle cx="104" cy="104" r="90" stroke="#1A1A1F" strokeWidth="5" />
        <circle cx="104" cy="104" r="90" stroke={color} strokeWidth="5" strokeDasharray={`${C * Math.max(0, Math.min(1, fraction))} ${C}`} transform="rotate(-90 104 104)" />
      </svg>
      <div className="inner" style={{ gap: 8 }}>{children}</div>
    </div>
  )
}

export function SessionPlayer(props: { plan: SessionPlan; xp: number; onFinish: () => void; onQuit: () => void }) {
  const { items } = props.plan
  const [index, setIndex] = useState(0)
  const [set, setSet] = useState(1)
  const [phase, setPhase] = useState<'work' | 'rest' | 'done'>('work')
  const [running, setRunning] = useState(false)
  const [frame, setFrame] = useState(0)
  const [showSteps, setShowSteps] = useState(false)

  const item = items[Math.min(index, items.length - 1)]
  const exercise = EXERCISE_BY_ID[item.exerciseId]
  const timed = item.seconds !== undefined
  const workSeconds = (item.seconds ?? 0) * (exercise.perSide ? 2 : 1)
  const isLastSet = set >= item.sets
  const isLastItem = index >= items.length - 1
  const next = isLastSet ? (isLastItem ? null : items[index + 1]) : item

  // Les deux images de l'exercice alternent pour montrer le mouvement.
  useEffect(() => {
    const id = window.setInterval(() => setFrame((f) => 1 - f), 1200)
    return () => window.clearInterval(id)
  }, [])
  // Garde l'écran allumé pendant la séance, quand le téléphone le permet.
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }
    nav.wakeLock?.request('screen').then((l) => { lock = l }).catch(() => undefined)
    return () => { lock?.release().catch(() => undefined) }
  }, [])

  const afterRest = () => {
    setRunning(false)
    setShowSteps(false)
    if (!isLastSet) setSet(set + 1)
    else { setIndex(index + 1); setSet(1) }
    setPhase('work')
  }
  const endSet = () => {
    setRunning(false)
    if (isLastSet && isLastItem) setPhase('done')
    else setPhase('rest')
  }

  const key = `${index}-${set}-${phase}`
  const workLeft = useCountdown(workSeconds, phase === 'work' && timed && running, `w${key}`, endSet)
  const restLeft = useCountdown(item.rest, phase === 'rest', `r${key}`, afterRest)

  if (phase === 'done') {
    return (
      <div className="screen spread">
        <div />
        <section className="stack lg center" style={{ alignItems: 'center', gap: 20 }}>
          <span className="label green">Séance terminée</span>
          <h1 className="title">Bien joué</h1>
          <span className="huge" style={{ color: 'var(--amber)' }}>+{props.xp} XP</span>
          <span className="small muted">{items.length} exercices · environ {props.plan.minutes} min</span>
        </section>
        <button type="button" className="btn" onClick={props.onFinish}>Valider la quête</button>
      </div>
    )
  }

  const sideHint = timed && exercise.perSide && phase === 'work' && running ? (workLeft > workSeconds / 2 ? 'Premier côté' : 'Change de côté') : null
  return (
    <div className="screen spread" style={{ gap: 20 }}>
      <header className="stack lg">
        <div className="row" style={{ alignItems: 'center' }}>
          <button type="button" className="link" style={{ padding: 0, textDecoration: 'none' }} onClick={() => { if (window.confirm('Quitter la séance ? Elle ne sera pas validée.')) props.onQuit() }}>Quitter</button>
          <h1 className="heading">{KIND_TITLE[props.plan.kind]}</h1>
          <span className="small muted">{index + 1} / {items.length}</span>
        </div>
        <div className="segs" role="img" aria-label={`Exercice ${index + 1} sur ${items.length}`} style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
          {items.map((_, i) => <div key={i} className={i < index ? 'done' : i === index ? 'now' : ''} />)}
        </div>
      </header>

      {phase === 'rest' ? (
        <section className="stack lg" style={{ alignItems: 'center', gap: 20 }} aria-live="polite">
          <Ring fraction={restLeft / item.rest} color="#B5283B">
            <span className="label crimson">Repos</span>
            <span className="timer">{clock(restLeft)}</span>
          </Ring>
          {next && <span className="small muted center">Ensuite : <b style={{ color: 'var(--text)' }}>{EXERCISE_BY_ID[next.exerciseId].name}</b>{next === item ? ` · série ${set + 1} sur ${item.sets}` : ''}</span>}
        </section>
      ) : (
        <section className="stack lg" style={{ gap: 16 }}>
          <img className="eximg" src={`exercises/${exercise.id}-${frame}.jpg`} alt={`Démonstration : ${exercise.name}`} />
          <div className="stack" style={{ alignItems: 'center', gap: 6 }}>
            <span className="title center" style={{ fontSize: 24 }}>{exercise.name}</span>
            <span>Série {set} sur {item.sets} <span className="muted">· {timed ? `${item.seconds! >= 120 ? `${Math.round(item.seconds! / 60)} min` : `${item.seconds} s`}${exercise.perSide ? ' par côté' : ''}` : `${item.reps} répétitions${exercise.perSide ? ' par côté' : ''}`}</span></span>
            {timed && <span className="timer" aria-live="off">{clock(running ? workLeft : workSeconds)}</span>}
            {sideHint && <span className="label crimson" aria-live="polite">{sideHint}</span>}
          </div>
          <button type="button" className="link" style={{ minHeight: 32 }} aria-expanded={showSteps} onClick={() => setShowSteps(!showSteps)}>{showSteps ? 'Masquer les consignes' : 'Voir les consignes'}</button>
          {showSteps && <ol className="steps-list">{exercise.steps.map((s) => <li key={s}>{s}</li>)}</ol>}
        </section>
      )}

      <div className="stack">
        {phase === 'rest' ? (
          <button type="button" className="btn ghost" onClick={afterRest}>Passer le repos</button>
        ) : timed && !running ? (
          <button type="button" className="btn" onClick={() => setRunning(true)}>Démarrer</button>
        ) : (
          <button type="button" className="btn" onClick={endSet}>{timed ? 'Terminer maintenant' : 'Série terminée'}</button>
        )}
        {phase === 'work' && <button type="button" className="link" onClick={() => { setRunning(false); if (isLastItem) setPhase('done'); else { setIndex(index + 1); setSet(1); setShowSteps(false) } }}>Passer cet exercice</button>}
      </div>
    </div>
  )
}
