import * as React from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { env } from '@/lib/env'
import * as ClerkReact from '@clerk/clerk-react'

// Mock authentication types
interface MockAuthContextType {
  isSignedIn: boolean
  setSignedIn: (val: boolean) => void
  user: {
    id: string
    firstName: string
    lastName: string
    primaryEmailAddress: { emailAddress: string }
  } | null
}

const MockAuthContext = React.createContext<MockAuthContextType | undefined>(undefined)

export function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const [isSignedIn, setSignedIn] = React.useState<boolean>(() => {
    const saved = localStorage.getItem('mock_is_signed_in')
    return saved === null ? true : saved === 'true'
  })

  React.useEffect(() => {
    localStorage.setItem('mock_is_signed_in', String(isSignedIn))
  }, [isSignedIn])

  const user = isSignedIn
    ? {
        id: 'user_mock_123',
        firstName: 'Guest',
        lastName: 'User',
        primaryEmailAddress: { emailAddress: 'guest@example.com' },
      }
    : null

  const value = React.useMemo(
    () => ({
      isSignedIn,
      setSignedIn,
      user,
    }),
    [isSignedIn, user],
  )

  return <MockAuthContext.Provider value={value}>{children}</MockAuthContext.Provider>
}

export function useMockAuthContext() {
  const context = React.useContext(MockAuthContext)
  if (!context) {
    throw new Error('useMockAuthContext must be used within a MockAuthProvider')
  }
  return context
}

// ClerkProvider conditional wrapper
export function ClerkProvider({
  children,
  publishableKey,
}: {
  children: React.ReactNode
  publishableKey?: string
}) {
  if (env.isClerkEnabled) {
    return (
      <ClerkReact.ClerkProvider publishableKey={publishableKey || env.clerkPublishableKey}>
        {children}
      </ClerkReact.ClerkProvider>
    )
  }
  return <MockAuthProvider>{children}</MockAuthProvider>
}

// SignedIn conditional component
export function SignedIn({ children }: { children: React.ReactNode }) {
  if (env.isClerkEnabled) {
    return <ClerkReact.SignedIn>{children}</ClerkReact.SignedIn>
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { isSignedIn } = useMockAuthContext()
  return isSignedIn ? <>{children}</> : null
}

// SignedOut conditional component
export function SignedOut({ children }: { children: React.ReactNode }) {
  if (env.isClerkEnabled) {
    return <ClerkReact.SignedOut>{children}</ClerkReact.SignedOut>
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { isSignedIn } = useMockAuthContext()
  return !isSignedIn ? <>{children}</> : null
}

// RedirectToSignIn conditional component
export function RedirectToSignIn() {
  if (env.isClerkEnabled) {
    return <ClerkReact.RedirectToSignIn />
  }
  return <Navigate to="/sign-in" replace />
}

// useUser conditional hook
export function useUser() {
  if (env.isClerkEnabled) {
    return ClerkReact.useUser()
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { isSignedIn, user } = useMockAuthContext()
  return {
    isSignedIn,
    isLoaded: true,
    user: user
      ? {
          ...user,
          emailAddresses: [user.primaryEmailAddress],
        }
      : null,
  }
}

// useAuth conditional hook
export function useAuth() {
  if (env.isClerkEnabled) {
    return ClerkReact.useAuth()
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { isSignedIn, setSignedIn } = useMockAuthContext()
  return {
    isSignedIn,
    isLoaded: true,
    userId: isSignedIn ? 'user_mock_123' : null,
    getToken: async () => 'mock_session_token',
    signOut: async () => setSignedIn(false),
  }
}

// UserButton conditional component
export function UserButton({ afterSignOutUrl }: { afterSignOutUrl?: string }) {
  if (env.isClerkEnabled) {
    return <ClerkReact.UserButton afterSignOutUrl={afterSignOutUrl} />
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { user, setSignedIn } = useMockAuthContext()
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [isOpen, setIsOpen] = React.useState(false)
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const navigate = useNavigate()

  if (!user) return null

  const handleSignOut = () => {
    setSignedIn(false)
    setIsOpen(false)
    if (afterSignOutUrl) {
      navigate(afterSignOutUrl)
    } else {
      navigate('/')
    }
  }

  const initials = (user.firstName?.[0] || '') + (user.lastName?.[0] || '')

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center h-8 w-8 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-medium text-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] cursor-pointer transition-all"
      >
        {initials || 'U'}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 bottom-10 md:bottom-auto md:top-10 z-20 mt-2 w-56 origin-top-right rounded-md bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-lg ring-1 ring-black/5 focus:outline-none">
            <div className="py-2 px-4 border-b border-[hsl(var(--border))]">
              <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                {user.primaryEmailAddress.emailAddress}
              </p>
            </div>
            <div className="py-1">
              <button
                onClick={handleSignOut}
                className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-[hsl(var(--muted))] transition-colors cursor-pointer"
              >
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// SignIn conditional component
export function SignIn({ afterSignInUrl }: { routing?: string; path?: string; signUpUrl?: string; afterSignInUrl?: string }) {
  if (env.isClerkEnabled) {
    return (
      <ClerkReact.SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        afterSignInUrl={afterSignInUrl}
      />
    )
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { setSignedIn } = useMockAuthContext()
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const navigate = useNavigate()

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    setSignedIn(true)
    navigate(afterSignInUrl || '/dashboard')
  }

  return (
    <div className="w-full max-w-md p-8 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Sign in to your account</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Mock Authentication Mode</p>
      </div>
      <form onSubmit={handleSignIn} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">Email address</label>
          <input
            type="email"
            defaultValue="guest@example.com"
            disabled
            className="flex h-10 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2 text-sm opacity-70 cursor-not-allowed text-[hsl(var(--foreground))]"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">Password</label>
          <input
            type="password"
            defaultValue="••••••••"
            disabled
            className="flex h-10 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2 text-sm opacity-70 cursor-not-allowed text-[hsl(var(--foreground))]"
          />
        </div>
        <button
          type="submit"
          className="w-full h-10 px-4 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 rounded-md font-medium text-sm transition-colors cursor-pointer"
        >
          Sign In as Guest
        </button>
      </form>
    </div>
  )
}

// SignUp conditional component
export function SignUp({ afterSignUpUrl }: { routing?: string; path?: string; signInUrl?: string; afterSignUpUrl?: string }) {
  if (env.isClerkEnabled) {
    return (
      <ClerkReact.SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        afterSignUpUrl={afterSignUpUrl}
      />
    )
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { setSignedIn } = useMockAuthContext()
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const navigate = useNavigate()

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault()
    setSignedIn(true)
    navigate(afterSignUpUrl || '/onboarding')
  }

  return (
    <div className="w-full max-w-md p-8 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Create your account</h2>
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Mock Authentication Mode</p>
      </div>
      <form onSubmit={handleSignUp} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">First name</label>
            <input
              type="text"
              defaultValue="Guest"
              disabled
              className="flex h-10 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2 text-sm opacity-70 cursor-not-allowed text-[hsl(var(--foreground))]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">Last name</label>
            <input
              type="text"
              defaultValue="User"
              disabled
              className="flex h-10 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2 text-sm opacity-70 cursor-not-allowed text-[hsl(var(--foreground))]"
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none">Email address</label>
          <input
            type="email"
            defaultValue="guest@example.com"
            disabled
            className="flex h-10 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--muted))] px-3 py-2 text-sm opacity-70 cursor-not-allowed text-[hsl(var(--foreground))]"
          />
        </div>
        <button
          type="submit"
          className="w-full h-10 px-4 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 rounded-md font-medium text-sm transition-colors cursor-pointer"
        >
          Sign Up as Guest
        </button>
      </form>
    </div>
  )
}
