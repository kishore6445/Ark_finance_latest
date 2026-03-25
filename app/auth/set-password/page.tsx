'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getSupabaseClient } from '@/lib/supabase/client'

function parseHashParams(hash: string) {
  const clean = hash.startsWith('#') ? hash.slice(1) : hash
  return new URLSearchParams(clean)
}

export default function SetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoadingSession, setIsLoadingSession] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const passwordsMatch = useMemo(() => {
    if (!confirmPassword) return true
    return password === confirmPassword
  }, [password, confirmPassword])

  const canSubmit = password.length >= 8 && passwordsMatch

  useEffect(() => {
    let isMounted = true

    const initializeSession = async () => {
      try {
        setErrorMessage(null)
        const supabase = getSupabaseClient()

        const hashParams = parseHashParams(window.location.hash)
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const searchParams = new URLSearchParams(window.location.search)
        const tokenHash = searchParams.get('token_hash')
        const otpType = searchParams.get('type')

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (error) {
            throw new Error(error.message)
          }
        } else if (tokenHash && otpType) {
          const otpTypeValue = otpType === 'invite' ? 'invite' : 'recovery'
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: otpTypeValue,
          })

          if (error) {
            throw new Error(error.message)
          }
        }

        const { data, error } = await supabase.auth.getSession()
        if (error) {
          throw new Error(error.message)
        }

        if (!data.session) {
          throw new Error('Invite link is invalid or expired. Request a new invite.')
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to initialize password setup.'
        if (isMounted) {
          setErrorMessage(message)
        }
      } finally {
        if (isMounted) {
          setIsLoadingSession(false)
        }
      }
    }

    initializeSession()

    return () => {
      isMounted = false
    }
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!canSubmit) {
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMessage(null)
      setSuccessMessage(null)

      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        throw new Error(error.message)
      }

      setSuccessMessage('Password set successfully. Redirecting to sign in...')
      setTimeout(() => {
        router.push('/signin')
      }, 900)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to set password.'
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md border-slate-200/80 bg-white/95 shadow-xl">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-700">
            <ShieldCheck className="size-5" />
            <span className="text-xs font-semibold uppercase tracking-wide">Secure setup</span>
          </div>
          <CardTitle className="text-2xl text-slate-900">Set your password</CardTitle>
          <CardDescription className="text-slate-600">
            Complete your account setup to access your organization workspace.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {errorMessage ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </p>
            ) : null}
            {successMessage ? (
              <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {successMessage}
              </p>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={password}
                  disabled={isLoadingSession || isSubmitting}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  disabled={isLoadingSession || isSubmitting}
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  disabled={isLoadingSession || isSubmitting}
                  aria-invalid={!passwordsMatch}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                  disabled={isLoadingSession || isSubmitting}
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {!passwordsMatch ? <p className="text-xs text-red-600">Passwords do not match.</p> : null}
            </div>

            <Button className="h-10 w-full" type="submit" disabled={!canSubmit || isLoadingSession || isSubmitting}>
              {isSubmitting ? 'Saving password...' : 'Set password'}
            </Button>

            <p className="text-center text-sm text-slate-600">
              Already set your password?{' '}
              <Link href="/signin" className="font-semibold text-slate-900 underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
