import { useQuery } from '@tanstack/react-query'
import { useAuth, useUser } from '@/components/Auth'
import { env } from '@/lib/env'
import type { RoadmapRecord } from '../types'

export function useRoadmaps() {
  const { user } = useUser()
  const { getToken } = useAuth()

  return useQuery({
    queryKey: ['roadmaps', user?.id],
    enabled: !!user,
    queryFn: async (): Promise<RoadmapRecord[]> => {
      if (!env.isClerkEnabled) {
        const stored = localStorage.getItem('mock_roadmaps')
        return stored ? JSON.parse(stored) : []
      }

      // Reads go through the edge function too: the app holds a Clerk token,
      // which Supabase's REST API (PostgREST) can't authenticate, so direct
      // table queries would silently return nothing under RLS.
      const token = await getToken()
      if (!token) return []

      const response = await fetch(`${env.supabaseUrl}/functions/v1/generate-roadmap`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: env.supabaseAnonKey,
        },
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(body.error ?? `Failed to load roadmaps (${response.status})`)
      }

      const { roadmaps } = await response.json()
      return (roadmaps ?? []) as RoadmapRecord[]
    },
  })
}
