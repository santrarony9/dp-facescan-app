import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import App from './App.jsx'

// Initialize Sentry for production error tracking
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || '',
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
  tracesSampleRate: 0.1,
  enabled: import.meta.env.PROD,
});

const SentryErrorBoundary = Sentry.ErrorBoundary;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SentryErrorBoundary
      fallback={({ error, resetError }) => (
        <div style={{ padding: '40px', color: '#ef4444', backgroundColor: '#0f172a', height: '100vh', fontFamily: 'Inter, system-ui, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Something went wrong</h1>
          <pre style={{ whiteSpace: 'pre-wrap', maxWidth: '600px', fontSize: '0.875rem', color: '#94a3b8' }}>{error?.toString()}</pre>
          <button
            onClick={resetError}
            style={{ marginTop: '2rem', padding: '0.75rem 2rem', backgroundColor: '#D4AF37', color: '#000', border: 'none', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}
          >
            Reload App
          </button>
        </div>
      )}
    >
      <App />
    </SentryErrorBoundary>
  </StrictMode>,
)
