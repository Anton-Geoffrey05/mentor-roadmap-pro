import { Outlet, Link } from 'react-router-dom'
import { SignedIn, SignedOut, UserButton } from '@/components/Auth'
import { Moon, Sun, Sparkles } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { Button } from '@/components/ui/button'

export function PublicLayout() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 glass">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold text-lg">
            <Sparkles className="h-5 w-5 text-[hsl(var(--primary))]" />
            Mentor Roadmap Pro
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-[hsl(var(--muted))]"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <SignedOut>
              <Link to="/sign-in">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link to="/sign-up">
                <Button size="sm">Get Started</Button>
              </Link>
            </SignedOut>
            <SignedIn>
              <Link to="/dashboard">
                <Button size="sm">Dashboard</Button>
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-[hsl(var(--border))] py-10 mt-20">
        <div className="mx-auto max-w-7xl px-6 text-sm text-[hsl(var(--muted-foreground))] flex justify-between flex-wrap gap-4">
          <p>&copy; {new Date().getFullYear()} Mentor Roadmap Pro. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/">Privacy</Link>
            <Link to="/">Terms</Link>
            <Link to="/">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
