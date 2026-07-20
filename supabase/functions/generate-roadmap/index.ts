// Supabase Edge Function: generate-roadmap
// Deploy with: supabase functions deploy generate-roadmap
// Secrets required: GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// This function:
// 1. Verifies the caller's Clerk JWT (passed as Authorization: Bearer <token>)
// 2. Builds a cache key from the career goal input
// 3. Returns a cached roadmap if one exists (never re-calls Gemini for identical input)
// 4. Otherwise calls Gemini with a strict JSON schema prompt, validates the shape,
//    persists it, and returns it

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { createHash } from 'node:crypto'
import { createRemoteJWKSet, jwtVerify, decodeJwt } from 'npm:jose@5'

interface CareerGoalInput {
  degree: string
  branch: string
  graduationYear: number
  currentSkills: string[]
  preferredCareer: string
  weeklyStudyHours: number
  preferredLearningStyle: 'visual' | 'reading' | 'hands_on' | 'mixed'
  // Sent by the client so we can auto-create the caller's profile on first use
  email?: string
  fullName?: string
}

// gemini-2.0-flash no longer has a free tier (quota limit: 0).
// Override with the GEMINI_MODEL secret if needed.
const GEMINI_MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash'

const ROADMAP_JSON_SCHEMA = `{
  "title": string,
  "summary": string,
  "estimatedWeeks": number,
  "readinessScore": number (0-100),
  "missingSkills": string[],
  "learningOrder": string[],
  "weeklyPlan": [{ "week": number, "focus": string, "tasks": string[] }],
  "milestones": [{ "title": string, "description": string, "weekNumber": number }],
  "projects": [{ "title": string, "description": string, "difficulty": "beginner"|"intermediate"|"advanced", "techStack": string[] }],
  "certifications": [{ "name": string, "provider": string, "isFree": boolean }],
  "resources": [{ "title": string, "url": string, "type": "documentation"|"youtube"|"github"|"course"|"practice" }]
}`

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders() })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Missing Authorization header' }, 401)
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Clerk issues the JWT on the client. If CLERK_JWKS_URL is set we verify the
    // signature against Clerk's JWKS (recommended for production); otherwise we
    // fall back to decoding the `sub` claim only (dev convenience).
    const clerkUserId = await getClerkUserId(authHeader.replace('Bearer ', ''))
    if (!clerkUserId) return json({ error: 'Invalid token' }, 401)

    // GET = list the caller's roadmaps (the client can't query the table
    // directly because it holds a Clerk token, not a Supabase one)
    if (req.method === 'GET') {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('clerk_user_id', clerkUserId)
        .maybeSingle()
      if (!profile) return json({ roadmaps: [] }, 200)

      const { data: roadmaps, error } = await supabaseAdmin
        .from('roadmaps')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return json({ roadmaps: roadmaps ?? [] }, 200)
    }

    const input = (await req.json()) as CareerGoalInput
    validateInput(input)

    const cacheKey = buildCacheKey(clerkUserId, input)

    // 1. Check cache — avoid duplicate Gemini calls for identical requests
    const { data: existing } = await supabaseAdmin
      .from('roadmaps')
      .select('*')
      .eq('cache_key', cacheKey)
      .maybeSingle()

    if (existing) {
      return json({ roadmap: existing, cached: true }, 200)
    }

    // 2. Resolve profile (auto-create on first use) + career goal
    let { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .maybeSingle()

    if (!profile) {
      const { data: created, error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          clerk_user_id: clerkUserId,
          email: input.email ?? `${clerkUserId}@placeholder.invalid`,
          full_name: input.fullName ?? null,
          onboarding_completed: true,
        })
        .select('id')
        .single()
      if (profileError) throw profileError
      profile = created
    }

    const { data: careerGoal, error: cgError } = await supabaseAdmin
      .from('career_goals')
      .insert({
        profile_id: profile.id,
        degree: input.degree,
        branch: input.branch,
        graduation_year: input.graduationYear,
        current_skills: input.currentSkills,
        preferred_career: input.preferredCareer,
        weekly_study_hours: input.weeklyStudyHours,
        preferred_learning_style: input.preferredLearningStyle,
      })
      .select()
      .single()

    if (cgError) throw cgError

    // 3. Call Gemini
    const geminiResult = await callGemini(input)

    // 4. Persist roadmap
    const { data: roadmap, error: roadmapError } = await supabaseAdmin
      .from('roadmaps')
      .insert({
        profile_id: profile.id,
        career_goal_id: careerGoal.id,
        title: geminiResult.title,
        summary: geminiResult.summary,
        estimated_weeks: geminiResult.estimatedWeeks,
        readiness_score: geminiResult.readinessScore,
        ai_model: GEMINI_MODEL,
        cache_key: cacheKey,
        raw_response: geminiResult,
      })
      .select()
      .single()

    if (roadmapError) throw roadmapError

    // 5. Persist milestones
    if (geminiResult.milestones?.length) {
      await supabaseAdmin.from('milestones').insert(
        geminiResult.milestones.map((m, idx: number) => ({
          roadmap_id: roadmap.id,
          title: m.title,
          description: m.description,
          week_number: m.weekNumber,
          order_index: idx,
        })),
      )
    }

    // 6. Persist projects
    if (geminiResult.projects?.length) {
      await supabaseAdmin.from('projects').insert(
        geminiResult.projects.map((p) => ({
          roadmap_id: roadmap.id,
          title: p.title,
          description: p.description,
          difficulty: p.difficulty,
          tech_stack: p.techStack,
        })),
      )
    }

    return json({ roadmap, cached: false }, 201)
  } catch (err) {
    console.error('generate-roadmap error:', err)
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500)
  }
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  })
}

function validateInput(input: CareerGoalInput) {
  if (!input?.preferredCareer || !input?.degree || !Array.isArray(input.currentSkills)) {
    throw new Error('Invalid career goal input')
  }
}

function buildCacheKey(clerkUserId: string, input: CareerGoalInput): string {
  const normalized = JSON.stringify({
    u: clerkUserId,
    d: input.degree,
    b: input.branch,
    c: input.preferredCareer,
    s: [...input.currentSkills].sort(),
    h: input.weeklyStudyHours,
    l: input.preferredLearningStyle,
  })
  return createHash('sha256').update(normalized).digest('hex')
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null

async function getClerkUserId(token: string): Promise<string | null> {
  const jwksUrl = Deno.env.get('CLERK_JWKS_URL')
  if (jwksUrl) {
    try {
      jwks ??= createRemoteJWKSet(new URL(jwksUrl))
      const { payload } = await jwtVerify(token, jwks)
      return typeof payload.sub === 'string' ? payload.sub : null
    } catch {
      return null
    }
  }
  // Dev fallback: decode without signature verification.
  // Set the CLERK_JWKS_URL secret in production!
  try {
    const sub = decodeJwt(token).sub
    return typeof sub === 'string' ? sub : null
  } catch {
    return null
  }
}

async function callGemini(input: CareerGoalInput) {
  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const prompt = `You are a career mentor AI for freshers. Given this candidate profile, generate a complete personalized learning roadmap.

Profile:
- Degree: ${input.degree}
- Branch: ${input.branch}
- Graduation Year: ${input.graduationYear}
- Current Skills: ${input.currentSkills.join(', ') || 'none listed'}
- Target Career: ${input.preferredCareer}
- Weekly Study Hours Available: ${input.weeklyStudyHours}
- Preferred Learning Style: ${input.preferredLearningStyle}

Return ONLY valid JSON matching exactly this shape, no markdown fences, no commentary:
${ROADMAP_JSON_SCHEMA}

Rules:
- weeklyPlan should span the full estimatedWeeks
- readinessScore reflects how close current skills are to the target career today
- Only include free or clearly-labeled resources
- Be specific and realistic for an entry-level candidate in India's tech job market`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: 'application/json',
        },
      }),
    },
  )

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Gemini API error (${response.status}): ${errText}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini returned no content')

  const parsed = JSON.parse(text)
  if (!parsed.title || !parsed.weeklyPlan) {
    throw new Error('Gemini response failed shape validation')
  }
  return parsed
}
