import { SignUp } from '@/components/Auth'

export function SignUpPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12">
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" afterSignUpUrl="/onboarding" />
    </div>
  )
}
