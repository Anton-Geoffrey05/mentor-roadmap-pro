import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth, useUser } from '@/components/Auth'
import { generateRoadmap } from '../services/roadmapService'
import type { CareerGoalInput } from '../types'

export function useGenerateRoadmap() {
  const { getToken } = useAuth()
  const { user } = useUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CareerGoalInput) =>
      generateRoadmap(input, getToken, {
        email: user?.primaryEmailAddress?.emailAddress ?? undefined,
        fullName: user
          ? [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined
          : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmaps'] })
    },
  })
}
