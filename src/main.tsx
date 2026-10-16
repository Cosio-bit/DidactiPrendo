import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { pedirAlmacenamientoPersistente } from './storage/db.ts'

void pedirAlmacenamientoPersistente()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
