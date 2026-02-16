import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ColumnsProvider } from './contexts/ColumnsContext'
import { PerformanceProvider } from './contexts/PerformanceContext'
import { SyncProvider } from './contexts/SyncContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SyncProvider>
      <ColumnsProvider>
        <PerformanceProvider>
          <App />
        </PerformanceProvider>
      </ColumnsProvider>
    </SyncProvider>
  </StrictMode>,
)
