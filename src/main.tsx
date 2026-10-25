import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './lib/auth'
import { JobsProvider } from './lib/jobs'
import './styles.css'

// HashRouter : le site marche tel quel sur GitHub Pages (pas de serveur pour réécrire les adresses).
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <JobsProvider>
        <HashRouter><App /></HashRouter>
      </JobsProvider>
    </AuthProvider>
  </StrictMode>,
)
