import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { DEMO } from '../lib/supabase'
import { Avatar, Toasts } from './ui'

const NAV: { group: string; items: { to: string; label: string; icon: string }[] }[] = [
  { group: 'Général', items: [{ to: '/', label: "Vue d'ensemble", icon: '🏠' }, { to: '/bots', label: 'Bots & journal', icon: '🤖' }] },
  { group: 'Bubulle · gestion', items: [
    { to: '/personnages', label: 'Personnages (OC)', icon: '🐾' }, { to: '/pnj', label: 'PNJ', icon: '🎭' },
    { to: '/moderation', label: 'Modération', icon: '🛡️' }, { to: '/niveaux', label: 'Niveaux', icon: '⭐' }, { to: '/commandes', label: 'Commandes', icon: '⌨️' }] },
  { group: 'Ricochet · rôle-play', items: [{ to: '/fils', label: 'Fils RP', icon: '🧵' }, { to: '/herbier', label: 'Herbier', icon: '🌿' }, { to: '/ressources', label: 'Gibier & infirmerie', icon: '🍖' }] },
  { group: 'Vigie · fiches', items: [{ to: '/repertoire', label: 'Répertoire Fiche', icon: '📂' }] },
]

export default function Layout() {
  const { access, guild, setGuild, userName, userAvatar, level, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  return (
    <div className="shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand"><span className="brand-moon">☾</span><div><strong>Prix de la Trêve</strong><small>Tableau de bord staff</small></div></div>
        <nav onClick={() => setOpen(false)}>
          {NAV.map((g) => (
            <div key={g.group} className="nav-group">
              <div className="nav-title">{g.group}</div>
              {g.items.map((i) => (
                <NavLink key={i.to} to={i.to} end={i.to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                  <span aria-hidden>{i.icon}</span>{i.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-foot">
          <Avatar name={userName} url={userAvatar} />
          <div className="who"><strong>{userName}</strong><small>{level === 'admin' ? 'Admin' : level === 'apprenti' ? 'Apprenti staff' : 'Staff'}</small></div>
          {!DEMO && <button className="btn btn-small" onClick={signOut}>Quitter</button>}
        </div>
      </aside>
      <div className="main">
        <div className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen((o) => !o)} aria-label="Menu">☰</button>
          {DEMO && <span className="badge badge-warn">MODE DÉMO · données fictives</span>}
          <div className="spacer" />
          {access.length > 1 ? (
            <label className="guild-pick">Serveur
              <select value={guild ?? ''} onChange={(e) => setGuild(e.target.value)}>
                {access.map((a) => <option key={a.guild_id} value={a.guild_id}>{a.guild_name ?? a.guild_id}</option>)}
              </select>
            </label>
          ) : <span className="muted">{access[0]?.guild_name}</span>}
        </div>
        <main className="content"><Outlet /></main>
      </div>
      <Toasts />
    </div>
  )
}
