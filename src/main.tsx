import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { StoreProvider } from './lib/store'
import { SettingsProvider } from './lib/settings'
import { AuthProvider } from './lib/auth'
import { CloudSync } from './lib/cloud'
import './styles/app.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <SettingsProvider>
        <StoreProvider>
          <CloudSync>
            <App />
          </CloudSync>
        </StoreProvider>
      </SettingsProvider>
    </AuthProvider>
  </StrictMode>,
)
