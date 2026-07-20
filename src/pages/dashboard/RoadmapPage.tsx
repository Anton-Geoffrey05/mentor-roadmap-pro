import { Link } from 'react-router-dom'
import { Map, Calendar, Gauge, ExternalLink, Award, Code2 } from 'lucide-react'
import { useRoadmaps } from '@/features/roadmap/hooks/useRoadmaps'
import type { GeneratedRoadmap } from '@/features/roadmap/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'

export function RoadmapPage() {
  const { data: roadmaps, isLoading, isError } = useRoadmaps()
  const roadmap = roadmaps?.[0]

  if (isLoading) return <RoadmapSkeleton />

  if (isError) {
    return (
      <EmptyState
        title="Couldn't load your roadmap"
        description="Something went wrong talking to the database. Try refreshing."
      />
    )
  }

  if (!roadmap) {
    return (
      <EmptyState
        title="No roadmap yet"
        description="Complete the career assessment and we'll generate a personalized plan."
        cta
      />
    )
  }

  const plan: GeneratedRoadmap = roadmap.raw_response

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-[hsl(var(--primary))] mb-2">
          <Map className="h-5 w-5" />
          <span className="text-sm font-medium">Your Roadmap</span>
        </div>
        <h1 className="text-3xl font-bold">{roadmap.title}</h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-2">{roadmap.summary}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <Gauge className="h-8 w-8 text-[hsl(var(--primary))]" />
            <div className="flex-1">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Readiness Score</p>
              <p className="text-2xl font-bold">{roadmap.readiness_score}%</p>
              <Progress value={roadmap.readiness_score} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <Calendar className="h-8 w-8 text-[hsl(var(--primary))]" />
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Estimated Duration</p>
              <p className="text-2xl font-bold">{roadmap.estimated_weeks} weeks</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">Missing Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {plan.missingSkills?.slice(0, 6).map((s) => (
                <Badge key={s}>{s}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Plan</CardTitle>
          <CardDescription>Your learning order, broken into focused weekly sprints.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {plan.weeklyPlan?.map((w) => (
            <div key={w.week} className="border-l-2 border-[hsl(var(--primary))]/40 pl-4 py-1">
              <p className="text-sm font-semibold">Week {w.week} — {w.focus}</p>
              <ul className="mt-1 space-y-0.5">
                {w.tasks.map((t) => (
                  <li key={t} className="text-sm text-[hsl(var(--muted-foreground))]">• {t}</li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Code2 className="h-4 w-4" /> Projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {plan.projects?.map((p) => (
              <div key={p.title}>
                <p className="text-sm font-semibold flex items-center gap-2">
                  {p.title} <Badge>{p.difficulty}</Badge>
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{p.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Award className="h-4 w-4" /> Certifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {plan.certifications?.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-sm">
                <span>{c.name} <span className="text-[hsl(var(--muted-foreground))]">— {c.provider}</span></span>
                {c.isFree && <Badge>Free</Badge>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resources</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-2">
          {plan.resources?.map((r) => (
            <a
              key={r.url}
              href={r.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between text-sm rounded-md border border-[hsl(var(--border))] px-3 py-2 hover:bg-[hsl(var(--muted))]"
            >
              <span>{r.title}</span>
              <ExternalLink className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
            </a>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function RoadmapSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-9 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <div className="grid md:grid-cols-3 gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-64" />
    </div>
  )
}

function EmptyState({ title, description, cta }: { title: string; description: string; cta?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24">
      <Map className="h-10 w-10 text-[hsl(var(--muted-foreground))] mb-4" />
      <h2 className="text-xl font-semibold mb-1">{title}</h2>
      <p className="text-sm text-[hsl(var(--muted-foreground))] max-w-sm mb-6">{description}</p>
      {cta && (
        <Link to="/onboarding">
          <Button>Start assessment</Button>
        </Link>
      )}
    </div>
  )
}
