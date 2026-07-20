import { env } from '@/lib/env'
import type { CareerGoalInput, GenerateRoadmapResponse, RoadmapRecord, GeneratedRoadmap } from '../types'

function generateMockRoadmap(input: CareerGoalInput): RoadmapRecord {
  const title = `AI Personalized Roadmap: ${input.preferredCareer}`
  const summary = `A tailored learning path for a ${input.degree} graduate in ${input.branch || 'Engineering'} to become a ${input.preferredCareer}. Focused on bridging the gap from your current skills (${input.currentSkills.join(', ') || 'none'}) using a ${input.preferredLearningStyle} style.`
  
  const missingSkills = ['Advanced Algorithms', 'System Architecture', 'Production Deployment', 'Cloud Infrastructure', 'CI/CD Pipelines']
  const learningOrder = ['Foundations & Basic Syntax', 'Advanced Core Concepts', 'Project Building & Tools', 'System Design & Deployment', 'Interview Prep & Portfolio']
  
  const weeklyPlan = [
    {
      week: 1,
      focus: 'Foundations & Basic Syntax',
      tasks: [
        'Review core programming language syntax and basic structures.',
        'Solve 5 basic algorithmic problems to build familiarity.',
        'Set up local development environment and Git control.'
      ]
    },
    {
      week: 2,
      focus: 'Advanced Core Concepts',
      tasks: [
        'Understand data structures (stacks, queues, linked lists).',
        'Learn about basic API integration and asynchronous programming.',
        'Build a mini-application showcasing these core principles.'
      ]
    },
    {
      week: 3,
      focus: 'Project Building & Tools',
      tasks: [
        'Start working on a personal portfolio project.',
        'Incorporate styling frameworks and responsive designs.',
        'Write basic unit tests and organize package dependencies.'
      ]
    },
    {
      week: 4,
      focus: 'System Design & Deployment',
      tasks: [
        'Learn how database schemas and indexing work.',
        'Deploy your application to a hosting platform.',
        'Integrate basic user authentication and environment keys.'
      ]
    }
  ]

  const milestones = [
    {
      title: 'Syntactic Mastery',
      description: 'Comfortably write and debug code using the core language features.',
      weekNumber: 1
    },
    {
      title: 'First Working App',
      description: 'Deploy a functional mini-project to a live URL.',
      weekNumber: 3
    }
  ]

  const projects = [
    {
      title: `Personalized ${input.preferredCareer} Portfolio`,
      description: 'A comprehensive, responsive developer portfolio showing off your projects and resume.',
      difficulty: 'beginner' as const,
      techStack: ['HTML', 'CSS', 'JavaScript']
    },
    {
      title: 'AI Smart Assistant Integration',
      description: 'Build an interactive app connected to a mock AI endpoint for intelligent responses.',
      difficulty: 'intermediate' as const,
      techStack: ['React', 'TypeScript', 'Tailwind CSS']
    }
  ]

  const certifications = [
    {
      name: 'FreeCodeCamp Responsive Web Design',
      provider: 'freeCodeCamp',
      isFree: true
    },
    {
      name: `Meta ${input.preferredCareer} Professional Certificate`,
      provider: 'Coursera',
      isFree: false
    }
  ]

  const resources = [
    {
      title: 'MDN Web Docs',
      url: 'https://developer.mozilla.org',
      type: 'documentation' as const
    },
    {
      title: 'Learn by Doing Playlist',
      url: 'https://youtube.com',
      type: 'youtube' as const
    }
  ]

  const raw_response: GeneratedRoadmap = {
    title,
    summary,
    estimatedWeeks: weeklyPlan.length,
    readinessScore: 65,
    missingSkills,
    learningOrder,
    weeklyPlan,
    milestones,
    projects,
    certifications,
    resources
  }

  return {
    id: `rm_${Math.random().toString(36).substring(2, 11)}`,
    profile_id: 'mock_profile_id',
    career_goal_id: 'mock_career_goal_id',
    title,
    summary,
    estimated_weeks: weeklyPlan.length,
    readiness_score: 65,
    ai_model: 'mock-gemini-model',
    cache_key: 'mock_cache_key',
    raw_response,
    status: 'active' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
}

/**
 * Calls the `generate-roadmap` Supabase Edge Function.
 * The Gemini API key never touches the client — it lives only in the
 * edge function's environment. This service just forwards the Clerk
 * session token so the function can identify the caller and apply RLS.
 */
export async function generateRoadmap(
  input: CareerGoalInput,
  getToken: () => Promise<string | null>,
  user?: { email?: string; fullName?: string },
): Promise<GenerateRoadmapResponse> {
  if (!env.isClerkEnabled) {
    // Generate locally and save to localStorage
    const mockRoadmap = generateMockRoadmap(input)
    const stored = localStorage.getItem('mock_roadmaps')
    const roadmaps: RoadmapRecord[] = stored ? JSON.parse(stored) : []
    roadmaps.unshift(mockRoadmap)
    localStorage.setItem('mock_roadmaps', JSON.stringify(roadmaps))

    // Simulate network latency for realistic feel
    await new Promise((resolve) => setTimeout(resolve, 1500))

    return {
      roadmap: mockRoadmap,
      cached: false,
    }
  }

  const token = await getToken()
  if (!token) throw new Error('You must be signed in to generate a roadmap.')

  const response = await fetch(`${env.supabaseUrl}/functions/v1/generate-roadmap`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      apikey: env.supabaseAnonKey,
    },
    body: JSON.stringify({ ...input, email: user?.email, fullName: user?.fullName }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(body.error ?? `Roadmap generation failed (${response.status})`)
  }

  return response.json()
}
