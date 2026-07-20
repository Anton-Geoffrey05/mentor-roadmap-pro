import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { Loader2, Sparkles } from 'lucide-react'
import {
  careerGoalFormSchema,
  toCareerGoalInput,
  type CareerGoalFormValues,
  type CareerGoalFormParsed,
} from '@/features/roadmap/schema'
import { useGenerateRoadmap } from '@/features/roadmap/hooks/useGenerateRoadmap'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useToast } from '@/context/ToastContext'

const learningStyles = [
  { value: 'visual', label: 'Visual (videos, diagrams)' },
  { value: 'reading', label: 'Reading (docs, articles)' },
  { value: 'hands_on', label: 'Hands-on (projects)' },
  { value: 'mixed', label: 'Mixed' },
] as const

export function OnboardingPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const generateRoadmap = useGenerateRoadmap()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CareerGoalFormValues, unknown, CareerGoalFormParsed>({
    resolver: zodResolver(careerGoalFormSchema),
    defaultValues: { preferredLearningStyle: 'mixed' },
  })

  const onSubmit = handleSubmit(async (values) => {
    try {
      const parsed = toCareerGoalInput(values)
      const result = await generateRoadmap.mutateAsync(parsed)
      toast({
        title: result.cached ? 'Found your existing roadmap' : 'Roadmap generated!',
        description: result.roadmap.title,
        variant: 'success',
      })
      navigate('/dashboard/roadmap')
    } catch (err) {
      toast({
        title: 'Could not generate roadmap',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'error',
      })
    }
  })

  return (
    <div className="min-h-screen py-16 px-6 flex items-center justify-center">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <div className="flex items-center gap-2 text-[hsl(var(--primary))] mb-1">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-medium">Career Assessment</span>
          </div>
          <CardTitle className="text-2xl">Let's build your roadmap</CardTitle>
          <CardDescription>Two minutes of questions, a lifetime of clarity.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Degree" error={errors.degree?.message}>
                <Input placeholder="B.Tech" {...register('degree')} />
              </Field>
              <Field label="Branch" error={errors.branch?.message}>
                <Input placeholder="Computer Science" {...register('branch')} />
              </Field>
            </div>

            <Field label="Graduation Year" error={errors.graduationYear?.message}>
              <Input type="number" placeholder="2026" {...register('graduationYear')} />
            </Field>

            <Field label="Current Skills (comma separated)" error={errors.currentSkills?.message as string}>
              <Input placeholder="HTML, CSS, Python basics" {...register('currentSkills')} />
            </Field>

            <Field label="Target Career" error={errors.preferredCareer?.message}>
              <Input placeholder="Frontend Developer" {...register('preferredCareer')} />
            </Field>

            <Field label="Weekly Study Hours" error={errors.weeklyStudyHours?.message}>
              <Input type="number" placeholder="15" {...register('weeklyStudyHours')} />
            </Field>

            <Field label="Preferred Learning Style" error={errors.preferredLearningStyle?.message}>
              <select
                className="flex h-10 w-full rounded-[var(--radius)] border border-[hsl(var(--border))] bg-transparent px-3 text-sm"
                {...register('preferredLearningStyle')}
              >
                {learningStyles.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </Field>

            <Button type="submit" className="w-full" size="lg" disabled={generateRoadmap.isPending}>
              {generateRoadmap.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating your roadmap...
                </>
              ) : (
                'Generate my roadmap'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="text-sm font-medium mb-1.5 block">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
