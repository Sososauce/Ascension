import { Emblem, Icon, ICONS } from '../ui/kit'

/** Vrai si l'appli est lancée depuis l'écran d'accueil (et non dans un onglet du navigateur). */
export function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean }
  return nav.standalone === true || window.matchMedia('(display-mode: standalone)').matches
}

export function InstallGate({ onSkip }: { onSkip: () => void }) {
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
  return (
    <div className="screen spread">
      <header className="stack" style={{ alignItems: 'center', color: 'var(--amber)', gap: 20, paddingTop: 24 }}>
        <Emblem size={96} chevrons={2} />
        <h1 className="title center" style={{ color: 'var(--text)' }}>Installe l'appli d'abord</h1>
        <p className="small muted center">Une fois installée, l'appli garde tes données à part de Safari. Si tu remplis ton profil ici, il ne suivra pas.</p>
      </header>
      <section className="lines" aria-label="Étapes d'installation">
        <div><span className="label">1</span><span className="val"><b style={{ display: 'flex', gap: 8, alignItems: 'center' }}>Touche Partager <Icon d={ICONS.share} size={18} /></b><span className="tiny muted">{isIos ? 'en bas de Safari' : 'dans le menu du navigateur'}</span></span></div>
        <div><span className="label">2</span><span className="val"><b>Sur l'écran d'accueil</b><span className="tiny muted">fais défiler la liste si besoin</span></span></div>
        <div><span className="label">3</span><span className="val"><b>Ajouter</b><span className="tiny muted">puis ouvre l'appli depuis son icône</span></span></div>
      </section>
      <button type="button" className="link" onClick={onSkip}>Continuer dans le navigateur (pour tester)</button>
    </div>
  )
}
