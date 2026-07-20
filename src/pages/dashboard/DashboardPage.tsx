import { Link } from 'react-router-dom'
import { useUser } from '@/components/Auth'
import { Map, Calendar, Gauge, ArrowRight } from 'lucide-react'
import { useRoadmaps } from '@/features/roadmap/hooks/useRoadmaps'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export function DashboardPage() {
  const { user } = useUser()
  const { data: roadmaps, isLoading } = useRoadmaps()
  const roadmap = roadmaps?.[0]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user?.firstName ?? 'there'} 👋</h1>
        <p className="text-[hsl(var(--muted-foreground))]">Here's where you stand today.</p>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : roadmap ? (
        <div className="grid md:grid-cols-3 gap-4">
          <StatCard icon={Gauge} label="Readiness" value={`${roadmap.readiness_score}%`} />
          <StatCard icon={Map} label="Roadmap Duration" value={`${roadmap.estimated_weeks} wks`} />
          <StatCard
            icon={Calendar}
            label="Created"
            value={new Date(roadmap.created_at).toLocaleDateString()}
          />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Build your first roadmap</CardTitle>
            <CardDescription>Answer a quick assessment and get a personalized, AI-generated career plan.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/onboarding">
              <Button>Start assessment <ArrowRight className="h-4 w-4" /></Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {roadmap && (
        <Card>
          <CardHeader>
            <CardTitle>Current Roadmap</CardTitle>
            <CardDescription>{roadmap.title}</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={roadmap.readiness_score} />
            <Link to="/dashboard/roadmap" className="inline-block mt-4">
              <Button variant="outline" size="sm">View full plan <ArrowRight className="h-3.5 w-3.5" /></Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ElementType
  label: string
  value: string
  hint?: string
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <Icon className="h-6 w-6 text-[hsl(var(--primary))] mb-2" />
        <p className="text-sm text-[hsl(var(--muted-foreground))]">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        {hint && <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{hint}</p>}
      </CardContent>
    </Card>
  )
}
