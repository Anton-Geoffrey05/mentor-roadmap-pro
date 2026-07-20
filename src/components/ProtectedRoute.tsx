import { SignedIn, SignedOut, RedirectToSignIn } from '@/components/Auth'
import { Outlet } from 'react-router-dom'

export function ProtectedRoute() {
  return (
    <>
      <SignedIn>
        <Outlet />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}
