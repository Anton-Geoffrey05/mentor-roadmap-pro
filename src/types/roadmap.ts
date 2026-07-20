export type LearningStyle = 'visual' | 'reading' | 'hands-on' | 'mixed'

export interface CareerAssessmentInput {
  degree: string
  branch: string
  graduationYear: number
  currentSkills: string[]
  preferredCareer: string
  weeklyStudyHours: number
  preferredLearningStyle: LearningStyle
}

export interface RoadmapResource {
  title: string
  type: 'documentation' | 'youtube' | 'github' | 'course' | 'practice'
  url: string
}

export interface RoadmapProject {
  title: string
  level: 'beginner' | 'intermediate' | 'advanced'
  description: string
  skillsUsed: string[]
}

export interface RoadmapMilestone {
  id: string
  title: string
  week: number
  month: number
  description: string
  skills: string[]
  resources: RoadmapResource[]
  estimatedHours: number
  completed: boolean
}

export interface SkillGap {
  skill: string
  currentLevel: 0 | 1 | 2 | 3 | 4 | 5
  requiredLevel: 0 | 1 | 2 | 3 | 4 | 5
  priority: 'high' | 'medium' | 'low'
}

export interface RoadmapResult {
  id: string
  careerGoal: string
  readinessScore: number
  estimatedCompletionWeeks: number
  skillGaps: SkillGap[]
  milestones: RoadmapMilestone[]
  projects: RoadmapProject[]
  certifications: string[]
  generatedAt: string
}
