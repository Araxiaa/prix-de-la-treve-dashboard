import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { norm } from '../lib/format'

export interface ComboOption { value: string; label: string; hint?: string }

const MAX_SHOWN = 50

/** Liste déroulante avec recherche (clavier : ↑ ↓ Entrée Échap). Reste fluide avec des milliers d'options : seules les 50 premières correspondances sont dessinées.
 * `free` : accepte aussi un texte libre (ex. un nom de personnage) ; sinon la valeur doit être une option. */
export default function Combo({ options, value, onChange, placeholder, free = false, invalid = false }: {
  options: ComboOption[]; value: string; onChange: (v: string) => void; placeholder?: string; free?: boolean; invalid?: boolean
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [cursor, setCursor] = useState(0)
  const box = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.value === value)
  const shown = free ? value : (open ? text : selected?.label ?? '')

  const matches = useMemo(() => {
    const q = norm(free ? value : text)
    const list = q ? options.filter((o) => norm(o.label).includes(q) || (o.hint && norm(o.hint).includes(q))) : options
    return list.slice(0, MAX_SHOWN)
  }, [options, text, value, free])

  useEffect(() => setCursor(0), [text, value])
  useEffect(() => {
    if (!open) return
    const away = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', away)
    return () => document.removeEventListener('mousedown', away)
  }, [open])

  const pick = (o: ComboOption) => { onChange(o.value); setText(''); setOpen(false) }
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setCursor((c) => Math.min(c + 1, matches.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)) }
    else if (e.key === 'Enter' && open && matches[cursor]) { e.preventDefault(); pick(matches[cursor]) }
    else if (e.key === 'Escape' && open) { e.stopPropagation(); setOpen(false) }
  }

  return (
    <div className="combo" ref={box}>
      <input role="combobox" aria-expanded={open} aria-controls={id} aria-invalid={invalid || undefined} autoComplete="off" placeholder={placeholder}
        value={shown} onFocus={() => { setText(''); setOpen(true) }} onKeyDown={onKey}
        onChange={(e) => { if (free) onChange(e.target.value); else { setText(e.target.value); if (value) onChange('') } setOpen(true) }} />
      {value && !free && <button type="button" className="combo-clear" aria-label="Effacer" onClick={() => { onChange(''); setText('') }}>✕</button>}
      {open && (
        <ul className="combo-list" id={id} role="listbox">
          {matches.length === 0 && <li className="combo-empty">{free ? 'Aucune suggestion — le texte saisi sera utilisé tel quel.' : 'Aucun résultat.'}</li>}
          {matches.map((o, i) => (
            <li key={o.value} role="option" aria-selected={i === cursor} className={i === cursor ? 'active' : ''}
              onMouseDown={(e) => { e.preventDefault(); pick(o) }} onMouseEnter={() => setCursor(i)}>
              {o.label}{o.hint && <small className="muted"> · {o.hint}</small>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
