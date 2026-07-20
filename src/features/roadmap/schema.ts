import { z } from 'zod'

// Raw form shape (what RHF actually manages — all plain strings/numbers,
// no transforms) validated separately from the transform into the API shape.
export const careerGoalFormSchema = z.object({
  degree: z.string().min(2, 'Degree is required'),
  branch: z.string().min(2, 'Branch is required'),
  graduationYear: z.coerce
    .number()
    .int()
    .min(1990, 'Enter a valid year')
    .max(2100, 'Enter a valid year'),
  currentSkills: z.string().min(1, 'List at least one skill (comma separated), or "none"'),
  preferredCareer: z.string().min(2, 'Target career is required'),
  weeklyStudyHours: z.coerce
    .number()
    .int()
    .min(1, 'Must be at least 1 hour')
    .max(168, 'That is more hours than a week has'),
  preferredLearningStyle: z.enum(['visual', 'reading', 'hands_on', 'mixed']),
})

export type CareerGoalFormValues = z.input<typeof careerGoalFormSchema>
export type CareerGoalFormParsed = z.output<typeof careerGoalFormSchema>

/** Converts a validated form value into the shape the API expects. */
export function toCareerGoalInput(values: CareerGoalFormParsed) {
  return {
    ...values,
    currentSkills: values.currentSkills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  }
}
