'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getSupabaseClient } from '@/lib/supabase/client'

type AppRole = 'Owner' | 'Admin' | 'Accountant' | 'Viewer' | 'CFO'

export default function SigninPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    return email.trim().length > 3 && password.length >= 8
  }, [email, password])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!canSubmit) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const supabase = getSupabaseClient()
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        throw new Error(authError.message)
      }

      const user = authData.user
      if (!user) {
        throw new Error('Sign-in succeeded but no user was returned.')
      }

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) {
        throw new Error(profileError.message)
      }

      const role = (profile?.role ?? 'Viewer') as AppRole

      if (role === 'Admin') {
        router.push('/create-organization')
        return
      }

      router.push('/dashboard')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to sign in. Please try again.'
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-14 top-0 h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl" />
        <div className="absolute bottom-[-8%] right-[-6%] h-96 w-96 rounded-full bg-emerald-300/30 blur-3xl" />
        <div className="absolute left-[35%] top-[25%] h-56 w-56 rounded-full bg-amber-200/40 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_470px] lg:px-8 lg:py-10">
        <section className="hidden rounded-3xl border border-slate-200/70 bg-white/80 p-8 shadow-xl backdrop-blur lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
              <Sparkles className="size-3.5" />
              Warrior Finance Secure Access
            </div>

            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-slate-900">
              Welcome back to your finance command center
            </h1>

            <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">
              Sign in to monitor cash flow, approvals, compliance deadlines, and client insights
              across your organization.
            </p>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-900 px-5 py-4 text-slate-100">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-4 text-emerald-300" />
              <p className="text-sm text-slate-200">Role-based access with organization-level separation.</p>
            </div>
            <div className="flex items-start gap-3">
              <LockKeyhole className="mt-0.5 size-4 text-cyan-300" />
              <p className="text-sm text-slate-200">Built for secure accounting and audit-friendly workflows.</p>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center">
          <Card className="w-full max-w-xl border-slate-200/80 bg-white/90 shadow-2xl backdrop-blur animate-in fade-in zoom-in-95 duration-500">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">Sign in</CardTitle>
              <CardDescription className="text-slate-600">
                Use your work email and password to continue.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form className="space-y-4" onSubmit={handleSubmit}>
                {errorMessage ? (
                  <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {errorMessage}
                  </p>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="email">Work email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    disabled={isSubmitting}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      disabled={isSubmitting}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                      onClick={() => setShowPassword((prev) => !prev)}
                      disabled={isSubmitting}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="rememberMe"
                      checked={rememberMe}
                      disabled={isSubmitting}
                      onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
                    />
                    <Label htmlFor="rememberMe" className="text-sm text-slate-700">
                      Remember me
                    </Label>
                  </div>

                  <Link href="#" className="text-sm font-medium text-slate-700 underline-offset-4 hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <Button className="h-10 w-full" type="submit" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? 'Signing in...' : 'Sign in'}
                </Button>

                <p className="text-center text-sm text-slate-600">
                  New to Warrior Finance?{' '}
                  <Link href="/signup" className="font-semibold text-slate-900 underline-offset-4 hover:underline">
                    Create an account
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}
