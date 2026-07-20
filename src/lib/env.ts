const isPlaceholder = (val: string | undefined): boolean => {
  return !val || val.includes('xxxxxx') || val === '';
}

const rawClerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const isClerkEnabled = !isPlaceholder(rawClerkKey);

function required(name: string, value: string | undefined): string {
  if (!value) {
    console.warn(`[env] Missing environment variable: ${name}. Add it to your .env file.`)
    return ''
  }
  return value
}

export const env = {
  clerkPublishableKey: isClerkEnabled ? rawClerkKey! : '',
  isClerkEnabled,
  supabaseUrl: required('VITE_SUPABASE_URL', import.meta.env.VITE_SUPABASE_URL),
  supabaseAnonKey: required('VITE_SUPABASE_ANON_KEY', import.meta.env.VITE_SUPABASE_ANON_KEY),
  posthogKey: import.meta.env.VITE_POSTHOG_KEY as string | undefined,
  isPostHogEnabled: !isPlaceholder(import.meta.env.VITE_POSTHOG_KEY),
  posthogHost: (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://app.posthog.com',
  sentryDsn: import.meta.env.VITE_SENTRY_DSN as string | undefined,
  isSentryEnabled: !isPlaceholder(import.meta.env.VITE_SENTRY_DSN),
}
