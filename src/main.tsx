import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { StoreProvider } from './lib/store'
import { SettingsProvider } from './lib/settings'
import './styles/app.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <StoreProvider>
        <App />
      </StoreProvider>
    </SettingsProvider>
  </StrictMode>,
)
