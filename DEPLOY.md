# Deploying Mentor Roadmap Pro

The app is a static Vite SPA (deploys to Vercel or Netlify) plus a Supabase backend
(Postgres + Edge Function). Deploy the backend first, then the frontend.

## 0. Secrets hygiene

`.env` is gitignored and `.env.example` contains placeholders only. Server-side keys
(Gemini, service role) live exclusively in Supabase Edge Function secrets. If any key
is ever exposed, rotate it immediately in its provider's dashboard.

## 1. Supabase backend

```bash
# once: npm i -g supabase
supabase login
supabase link --project-ref <your-project-ref>

# apply the schema (11 tables, RLS policies)
supabase db push

# deploy the AI edge function and set its secrets
# --no-verify-jwt is REQUIRED: the app authenticates with Clerk tokens, which
# Supabase's default gateway JWT check would reject with a 401.
supabase functions deploy generate-roadmap --no-verify-jwt
supabase secrets set GEMINI_API_KEY=<new key> SUPABASE_SERVICE_ROLE_KEY=<new key>

# production hardening: make the function verify Clerk token signatures.
# Find your JWKS URL in Clerk dashboard → API Keys → "JWKS URL"
# (looks like https://<your-app>.clerk.accounts.dev/.well-known/jwks.json)
supabase secrets set CLERK_JWKS_URL=<your JWKS url>
```

Without `CLERK_JWKS_URL` the function only decodes tokens (fine for local dev,
not safe in production since `--no-verify-jwt` makes the endpoint publicly callable).

## 2. Clerk ↔ Supabase JWT bridge

In the Clerk dashboard, create a JWT template named `supabase` (Clerk has a built-in
Supabase preset). This lets Supabase RLS policies read the user id via
`auth.jwt() ->> 'sub'`. Without it, authenticated DB queries will fail RLS.

## 3. Verify the production build locally

```bash
npm install
npm run build     # tsc -b && vite build
npm run preview   # sanity-check at http://localhost:4173
```

## 4A. Deploy to Vercel (recommended)

SPA rewrites are already configured in `vercel.json`.

**Via dashboard:** push the repo to GitHub → vercel.com → Add New Project → import the
repo. Framework preset: Vite (auto-detected).

**Via CLI:**
```bash
npm i -g vercel
vercel          # first deploy (preview)
vercel --prod   # production
```

**Environment variables** (Project → Settings → Environment Variables):

| Name | Value |
|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | from Clerk dashboard |
| `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/publishable key |
| `VITE_POSTHOG_KEY` (optional) | PostHog project key |
| `VITE_SENTRY_DSN` (optional) | Sentry DSN |

Redeploy after adding env vars (Vite inlines them at build time).

## 4B. Deploy to Netlify (alternative)

SPA redirects are already configured in `public/_redirects`.

Build command: `npm run build` · Publish directory: `dist` · Set the same env vars.

## 5. Post-deploy checklist

- [ ] Clerk dashboard → add your production domain (e.g. `https://your-app.vercel.app`)
      to allowed origins / paths, or create a production Clerk instance
- [ ] Sign up → onboarding → generate a roadmap end-to-end on the live site
- [ ] Check edge function logs: Supabase dashboard → Edge Functions →
      generate-roadmap → Logs tab (the CLI has no `functions logs` command)
- [ ] Confirm `/dashboard/roadmap` deep-link works after a hard refresh (SPA rewrite)
