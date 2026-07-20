export type LearningStyle = 'visual' | 'reading' | 'hands_on' | 'mixed'

export interface CareerGoalInput {
  degree: string
  branch: string
  graduationYear: number
  currentSkills: string[]
  preferredCareer: string
  weeklyStudyHours: number
  preferredLearningStyle: LearningStyle
}

export interface WeeklyPlanItem {
  week: number
  focus: string
  tasks: string[]
}

export interface RoadmapMilestone {
  title: string
  description: string
  weekNumber: number
}

export interface RoadmapProject {
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  techStack: string[]
}

export interface RoadmapCertification {
  name: string
  provider: string
  isFree: boolean
}

export interface RoadmapResource {
  title: string
  url: string
  type: 'documentation' | 'youtube' | 'github' | 'course' | 'practice'
}

export interface GeneratedRoadmap {
  title: string
  summary: string
  estimatedWeeks: number
  readinessScore: number
  missingSkills: string[]
  learningOrder: string[]
  weeklyPlan: WeeklyPlanItem[]
  milestones: RoadmapMilestone[]
  projects: RoadmapProject[]
  certifications: RoadmapCertification[]
  resources: RoadmapResource[]
}

export interface RoadmapRecord {
  id: string
  profile_id: string
  career_goal_id: string
  title: string
  summary: string | null
  estimated_weeks: number
  readiness_score: number
  ai_model: string
  cache_key: string
  raw_response: GeneratedRoadmap
  status: 'active' | 'completed' | 'archived'
  created_at: string
  updated_at: string
}

export interface GenerateRoadmapResponse {
  roadmap: RoadmapRecord
  cached: boolean
}
