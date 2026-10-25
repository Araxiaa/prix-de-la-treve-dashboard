import { useAuth } from '../lib/auth'

export default function Login() {
  const { signIn, error } = useAuth()
  return (
    <div className="center-screen">
      <div className="login-card">
        <div className="brand-moon big">☾</div>
        <h1>Le Prix de la Trêve</h1>
        <p className="muted">Tableau de bord du staff pour <strong>Bubulle</strong>, <strong>Ricochet</strong> et <strong>Vigie</strong>.</p>
        <button className="btn btn-discord" onClick={signIn}>
          Se connecter avec Discord
        </button>
        {error && <p className="alert alert-error">{error}</p>}
        <p className="fine">Seules les personnes ayant un rôle staff sur le serveur Discord ont accès. Aucune donnée n'est modifiée sans passer par les bots.</p>
      </div>
    </div>
  )
}
