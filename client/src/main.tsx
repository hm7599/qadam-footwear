import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './utils/pwa' // capture the install prompt as early as possible
import App from './App.tsx'
import { prefetchBootstrap } from './utils/bootstrap'

prefetchBootstrap() // settings + promo + shipping in one request, started before React renders

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
