'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, CheckCircle2, Eye, EyeOff, ShieldCheck, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getSupabaseClient } from '@/lib/supabase/client'

const roles = ['Owner', 'Admin', 'Accountant', 'Viewer', 'CFO'] as const

type SignupForm = {
  organizationName: string
  fullName: string
  email: string
  role: (typeof roles)[number]
  gstNumber: string
  password: string
  confirmPassword: string
  acceptedTerms: boolean
}

const defaultForm: SignupForm = {
  organizationName: '',
  fullName: '',
  email: '',
  role: 'Owner',
  gstNumber: '',
  password: '',
  confirmPassword: '',
  acceptedTerms: false,
}

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState<SignupForm>(defaultForm)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const passwordsMatch = useMemo(() => {
    if (!form.confirmPassword) return true
    return form.password === form.confirmPassword
  }, [form.password, form.confirmPassword])

  const canSubmit =
    form.organizationName.trim().length > 1 &&
    form.fullName.trim().length > 1 &&
    form.email.trim().length > 3 &&
    form.password.length >= 8 &&
    passwordsMatch &&
    form.acceptedTerms

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!canSubmit) {
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const supabase = getSupabaseClient()
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
          },
        },
      })

      if (signupError) {
        throw new Error(signupError.message)
      }

      const userId = signupData.user?.id
      if (!userId) {
        throw new Error('Signup did not return a user. Check email confirmation settings.')
      }

      const { error: profileError } = await supabase.from('users').upsert(
        {
          id: userId,
          organization_id: null,
          email: form.email,
          full_name: form.fullName,
          role: form.role,
          is_active: true,
        },
        { onConflict: 'id' }
      )

      if (profileError) {
        throw new Error(profileError.message)
      }

      setSuccessMessage('Account created successfully. Redirecting to sign in...')

      setTimeout(() => {
        router.push('/signin')
      }, 900)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create account. Please try again.'
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 left-[-10%] h-72 w-72 rounded-full bg-emerald-300/40 blur-3xl" />
        <div className="absolute right-[-8%] top-10 h-80 w-80 rounded-full bg-cyan-300/35 blur-3xl" />
        <div className="absolute bottom-[-12%] left-[30%] h-72 w-72 rounded-full bg-amber-300/30 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_470px] lg:px-8 lg:py-10">
        <section className="hidden rounded-3xl border border-slate-200/70 bg-white/80 p-8 shadow-xl backdrop-blur lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <Sparkles className="size-3.5" />
              Warrior Finance Workspace
            </div>

            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-slate-900">
              Build your finance command center in minutes
            </h1>

            <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">
              Create your organization, invite your team, and start tracking cash flow,
              obligations, compliance, and approvals with one secure account.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 text-emerald-600" />
                <p className="text-sm text-slate-700">Role-based access for Owner, Admin, Accountant, Viewer, and CFO.</p>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="mt-0.5 size-5 text-cyan-600" />
                <p className="text-sm text-slate-700">Multi-organization setup built for tenant-safe data boundaries.</p>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-5 text-amber-600" />
                <p className="text-sm text-slate-700">Designed for secure workflows and compliance-first finance operations.</p>
              </div>
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-900 px-5 py-4 text-slate-100">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Quick Start</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              After signup, connect your first bank account and create default buckets to start cash allocation instantly.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center">
          <Card className="w-full max-w-xl border-slate-200/80 bg-white/90 shadow-2xl backdrop-blur animate-in fade-in zoom-in-95 duration-500">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">Create your account</CardTitle>
              <CardDescription className="text-slate-600">
                Start with signup. Sign in page can use the same identity once auth is connected.
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="organizationName">Organization name</Label>
                    <Input
                      id="organizationName"
                      placeholder="Acme Industries Pvt Ltd"
                      value={form.organizationName}
                      disabled={isSubmitting}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, organizationName: event.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full name</Label>
                    <Input
                      id="fullName"
                      placeholder="Ananya Sharma"
                      value={form.fullName}
                      disabled={isSubmitting}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, fullName: event.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={form.role}
                      disabled={isSubmitting}
                      onValueChange={(value) =>
                        setForm((prev) => ({ ...prev, role: value as SignupForm['role'] }))
                      }
                    >
                      <SelectTrigger id="role" className="w-full">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="email">Work email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      value={form.email}
                      disabled={isSubmitting}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, email: event.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="gstNumber">GST number (optional)</Label>
                    <Input
                      id="gstNumber"
                      placeholder="29ABCDE1234F2Z5"
                      value={form.gstNumber}
                      disabled={isSubmitting}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, gstNumber: event.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="At least 8 characters"
                        value={form.password}
                        disabled={isSubmitting}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, password: event.target.value }))
                        }
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

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Re-enter password"
                        value={form.confirmPassword}
                        disabled={isSubmitting}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                        }
                        aria-invalid={!passwordsMatch}
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        disabled={isSubmitting}
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                    {!passwordsMatch ? (
                      <p className="text-xs text-red-600">Passwords do not match.</p>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                  <Checkbox
                    id="acceptedTerms"
                    checked={form.acceptedTerms}
                    disabled={isSubmitting}
                    onCheckedChange={(checked) =>
                      setForm((prev) => ({ ...prev, acceptedTerms: Boolean(checked) }))
                    }
                  />
                  <Label htmlFor="acceptedTerms" className="text-xs leading-5 text-slate-700">
                    I agree to the Terms of Service and Privacy Policy, and confirm my organization
                    data will be handled under role-based access controls.
                  </Label>
                </div>

                <Button className="h-10 w-full" type="submit" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? 'Creating account...' : 'Create account'}
                </Button>

                <p className="text-center text-sm text-slate-600">
                  Already have an account?{' '}
                  <Link href="/signin" className="font-semibold text-slate-900 underline-offset-4 hover:underline">
                    Sign in
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
