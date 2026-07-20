import { SignIn } from '@/components/Auth'

export function SignInPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12">
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" afterSignInUrl="/dashboard" />
    </div>
  )
}
