import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { env } from '@/lib/env'
import * as Sentry from '@sentry/react'
import posthog from 'posthog-js'

if (env.isSentryEnabled) {
  Sentry.init({
    dsn: env.sentryDsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })
}

if (env.isPostHogEnabled) {
  posthog.init(env.posthogKey!, {
    api_host: env.posthogHost,
    loaded: (ph) => {
      if (import.meta.env.DEV) ph.opt_out_capturing()
    },
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
