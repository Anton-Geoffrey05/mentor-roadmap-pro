import { Outlet, NavLink } from 'react-router-dom'
import { UserButton } from '@/components/Auth'
import { LayoutDashboard, Map, Sparkles, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/ThemeContext'

// Resume Analyzer, Mock Interview, and Industry Insights are hidden until
// implemented — re-add their entries here when their features ship.
const navItems = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/roadmap', label: 'Roadmap', icon: Map },
]

export function DashboardLayout() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 shrink-0 border-r border-[hsl(var(--border))] flex flex-col p-4 hidden md:flex">
        <div className="flex items-center gap-2 font-semibold text-lg px-2 py-3">
          <Sparkles className="h-5 w-5 text-[hsl(var(--primary))]" />
          Mentor Roadmap Pro
        </div>
        <nav className="flex flex-col gap-1 mt-4">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                    : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex items-center justify-between px-2 py-3">
          <UserButton afterSignOutUrl="/" />
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-[hsl(var(--muted))]"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  )
}
