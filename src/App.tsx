import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { Spinner } from './components/ui'
import { useAuth } from './lib/auth'
import Bots from './pages/Bots'
import Characters from './pages/Characters'
import Levels from './pages/Levels'
import Login from './pages/Login'
import Moderation from './pages/Moderation'
import Npcs from './pages/Npcs'
import Overview from './pages/Overview'
import Repertoire from './pages/Repertoire'
import Resources from './pages/Resources'
import Threads from './pages/Threads'

export default function App() {
  const { session, loading, access, error, signOut } = useAuth()
  if (loading) return <div className="center-screen"><Spinner label="Connexion…" /></div>
  if (!session) return <Login />
  if (error || access.length === 0) {
    return (
      <div className="center-screen">
        <div className="login-card">
          <h1>Accès réservé au staff</h1>
          <p className="muted">
            {error ? `Erreur : ${error}` : "Ton compte Discord est bien connecté, mais tu n'es pas reconnu·e comme staff d'un serveur où Bubulle est présent."}
          </p>
          <p className="muted">La liste des accès est mise à jour par Bubulle toutes les 15 minutes d'après tes rôles Discord. Si tu viens de recevoir un rôle staff, patiente un peu puis reconnecte-toi.</p>
          <button className="btn" onClick={signOut}>Se déconnecter</button>
        </div>
      </div>
    )
  }
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Overview />} />
        <Route path="personnages" element={<Characters />} />
        <Route path="pnj" element={<Npcs />} />
        <Route path="moderation" element={<Moderation />} />
        <Route path="niveaux" element={<Levels />} />
        <Route path="fils" element={<Threads />} />
        <Route path="ressources" element={<Resources />} />
        <Route path="repertoire" element={<Repertoire />} />
        <Route path="bots" element={<Bots />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
