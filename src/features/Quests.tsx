import { mainCounts, missingToValidate, REST_DAYS_PER_WEEK } from '../domain/progress'
import { WATER_STEP_ML, WATER_TARGET_ML, type Quest } from '../domain/quests'
import type { GameState } from '../state/game'
import { Icon } from '../ui/kit'

const QUEST_ICON: Record<Quest['kind'], string> = {
  session: 'M3 12h18M6 8v8M18 8v8M3 10v4M21 10v4',
  movement: 'M4 20l5-8 4 3 3-9M16 6h4v4',
  meal: 'M7 3v8h4V3M9 3v18M17 3v18M14 3h3v9h-3z',
  water: 'M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z',
  protein: 'M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 12v9M12 12l8-4.5M12 12L4 7.5',
  bonus: 'M12 3l2.6 6 6.4.6-4.9 4.2 1.5 6.2L12 16.8 6.4 20l1.5-6.2L3 9.6 9.4 9z',
}
export const CHECK_PATH = 'M5 12l5 5 9-10'

export interface QuestHandlers {
  onToggle: (id: string) => void
  onWater: (deltaMl: number) => void
  onStartSession: () => void
}

const litres = (ml: number) => (ml / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })

export function QuestRow({ quest, waterMl, locked, h }: { quest: Quest; waterMl: number; locked: boolean; h: QuestHandlers }) {
  const sport = quest.kind === 'session' || quest.kind === 'movement' || quest.kind === 'bonus'
  const detail = quest.kind === 'water' && !quest.done ? `${litres(waterMl)} L sur ${litres(WATER_TARGET_ML)} L` : quest.detail
  return (
    <div className={`quest ${quest.done ? 'done' : ''}`}>
      <div className={`qicon ${sport ? 'sport' : 'food'}`}><Icon d={QUEST_ICON[quest.kind]} size={20} /></div>
      <div className="body">
        <span className="name">{quest.title}</span>
        {quest.done ? <span className="small" style={{ color: 'var(--green)' }}>Validée · +{quest.xp} XP</span> : <span className="small muted">{detail} · +{quest.xp} XP</span>}
      </div>
      {quest.kind === 'session' && !quest.done && !locked ? (
        <button type="button" className="btn sm" onClick={h.onStartSession}>Lancer</button>
      ) : quest.kind === 'water' && !quest.done && !locked ? (
        <button type="button" className="btn sm ghost" aria-label={`Ajouter ${WATER_STEP_ML} millilitres d'eau`} onClick={() => h.onWater(WATER_STEP_ML)}>+ 25 cl</button>
      ) : (
        <button type="button" className={`check ${quest.done ? 'on' : ''}`} disabled={locked} aria-pressed={quest.done} aria-label={`${quest.done ? 'Annuler' : 'Valider'} la quête : ${quest.title}`} onClick={() => h.onToggle(quest.id)}>
          {quest.done && <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square"><path d={CHECK_PATH} /></svg>}
        </button>
      )}
    </div>
  )
}

/** Anneau en segments : un segment par quête principale. */
function SegmentRing({ done, total }: { done: number; total: number }) {
  const C = 2 * Math.PI * 62
  const gap = 6
  const seg = C / total - gap
  const filled = Array.from({ length: done }, () => `${seg} ${gap}`).join(' ')
  return (
    <div className="ringwrap" style={{ width: 136, height: 136 }}>
      <svg role="img" aria-label={`${done} quêtes validées sur ${total}`} width="136" height="136" viewBox="0 0 136 136" fill="none">
        <circle cx="68" cy="68" r="62" stroke="#1A1A1F" strokeWidth="5" strokeDasharray={`${seg} ${gap}`} transform="rotate(-90 68 68)" />
        {done > 0 && <circle cx="68" cy="68" r="62" stroke="#5FBF78" strokeWidth="5" strokeDasharray={done >= total ? `${seg} ${gap}` : `${filled.slice(0, filled.lastIndexOf(' '))} ${C}`} transform="rotate(-90 68 68)" />}
      </svg>
      <div className="inner">
        <span style={{ fontSize: 34, fontWeight: 600, lineHeight: 1 }}>{done}<span className="muted" style={{ fontWeight: 400 }}> / {total}</span></span>
        <span className="label violet">Validées</span>
      </div>
    </div>
  )
}

export function Quests(props: { game: GameState; closeHour: number; h: QuestHandlers; onRest: (on: boolean) => void }) {
  const { today, restUsed } = props.game
  const { done, total } = mainCounts(today.quests)
  const missing = missingToValidate(done, total)
  const main = today.quests.filter((q) => !q.bonus)
  const bonus = today.quests.filter((q) => q.bonus)
  const restLeft = REST_DAYS_PER_WEEK - restUsed
  const closeLabel = props.closeHour === 0 ? 'minuit' : `${props.closeHour} h 00`

  if (today.rest) {
    return (
      <div className="screen">
        <header className="row"><h1 className="heading">QUÊTES DU JOUR</h1><span className="small muted">Clôture à {closeLabel}</span></header>
        <div className="grow" style={{ display: 'flex', alignItems: 'center' }}>
          <section className="panel" style={{ width: '100%' }}>
            <span className="label violet">{today.rest === 'vacances' ? 'Vacances ou maladie' : 'Jour de repos'}</span>
            <span className="heading" style={{ fontSize: 20 }}>Tout est gelé aujourd'hui</span>
            <span className="small muted">Ta streak ne bouge pas et la journée ne compte ni comme validée ni comme ratée. {today.rest === 'vacances' ? 'Le mode vacances se termine depuis ton profil.' : 'Repose-toi bien.'}</span>
            {today.rest === 'repos' && <button type="button" className="btn ghost" style={{ minHeight: 44 }} onClick={() => props.onRest(false)}>Annuler le jour de repos</button>}
          </section>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <header className="row"><h1 className="heading">QUÊTES DU JOUR</h1><span className="small muted">Clôture à {closeLabel}</span></header>
      <section aria-label="Progression du jour" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <SegmentRing done={done} total={total} />
        <div className="stack" style={{ flex: 1 }}>
          <span className="heading">{missing === 0 ? 'Journée validée' : `Encore ${missing} quête${missing > 1 ? 's' : ''}`}</span>
          <span className="small muted">{missing === 0 ? (done < total ? 'Tu peux encore finir les quêtes restantes pour plus d\'XP.' : 'Toutes les quêtes sont faites. Bien joué.') : `pour valider la journée et prolonger ta streak. En dessous de 2 quêtes, la journée est ratée.`}</span>
        </div>
      </section>
      <section aria-label="Quêtes principales">
        {main.map((q) => <QuestRow key={q.id} quest={q} waterMl={today.waterMl} locked={false} h={props.h} />)}
      </section>
      {bonus.length > 0 && (
        <section aria-label="Quête bonus" className="panel" style={{ padding: '4px 16px' }}>
          {bonus.map((q) => <QuestRow key={q.id} quest={{ ...q, detail: `Bonus · ${q.detail}` }} waterMl={0} locked={false} h={props.h} />)}
        </section>
      )}
      <div className="center">
        <button type="button" className="link" disabled={restLeft <= 0} onClick={() => { if (window.confirm('Déclarer un jour de repos ? La streak sera gelée et les quêtes du jour ne compteront pas.')) props.onRest(true) }}>
          {restLeft > 0 ? `Déclarer un jour de repos (${restLeft} restant${restLeft > 1 ? 's' : ''} cette semaine)` : 'Plus de jour de repos cette semaine'}
        </button>
      </div>
    </div>
  )
}
