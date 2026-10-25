import { useEffect, type ReactNode } from 'react'
import { useJobs } from '../lib/jobs'
import type { AsyncState } from '../lib/hooks'

export function Spinner({ label = 'Chargement…' }: { label?: string }) {
  return <div className="spinner" role="status"><span className="dot" />{label}</div>
}

export function ErrorBox({ message }: { message: string }) {
  return <div className="alert alert-error"><strong>Impossible de charger ces données.</strong><br /><span>{message}</span></div>
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>
}

/** Affiche le chargement, l'erreur ou le contenu d'un `useAsync`. */
export function Loaded<T>({ state, children }: { state: AsyncState<T>; children: (data: T) => ReactNode }) {
  if (state.error) return <ErrorBox message={state.error} />
  if (state.data === null) return <Spinner />
  return <>{children(state.data)}</>
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="page-header">
      <div><h1>{title}</h1>{subtitle && <p className="muted">{subtitle}</p>}</div>
      {actions && <div className="row gap">{actions}</div>}
    </header>
  )
}

type Tone = 'neutral' | 'ok' | 'warn' | 'bad' | 'info' | 'accent'
export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

export function Stat({ label, value, hint, tone = 'neutral' }: { label: string; value: ReactNode; hint?: ReactNode; tone?: Tone }) {
  return <div className={`stat stat-${tone}`}><div className="stat-value">{value}</div><div className="stat-label">{label}</div>{hint && <div className="stat-hint">{hint}</div>}</div>
}

export function Card({ title, actions, children, className = '' }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && <div className="card-head"><h2>{title}</h2>{actions && <div className="row gap">{actions}</div>}</div>}
      {children}
    </section>
  )
}

export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head"><h2>{title}</h2><button className="icon-btn" onClick={onClose} aria-label="Fermer">✕</button></div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="field"><span className="field-label">{label}</span>{children}{hint && <span className="field-hint">{hint}</span>}</label>
}

export function Toasts() {
  const { toasts, dismiss } = useJobs()
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.key} className={`toast toast-${t.kind}`}>
          <div className="toast-icon">{t.kind === 'ok' ? '✅' : t.kind === 'error' ? '❌' : t.kind === 'warn' ? '⚠️' : '⏳'}</div>
          <div className="toast-body"><strong>{t.title}</strong>{t.text && <span>{t.text}</span>}</div>
          <button className="icon-btn" onClick={() => dismiss(t.key)} aria-label="Fermer">✕</button>
        </div>
      ))}
    </div>
  )
}

export function Avatar({ name, url }: { name: string; url?: string | null }) {
  return url ? <img className="avatar" src={url} alt="" referrerPolicy="no-referrer" /> : <span className="avatar avatar-fallback">{name.trim().slice(0, 2).toUpperCase()}</span>
}
