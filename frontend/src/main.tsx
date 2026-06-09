import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import DataCenterGuardian from './DataCenterGuardian.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DataCenterGuardian />
  </StrictMode>,
)
