'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { CreateOrganizationScreen } from '@/components/create-organization-screen'
import { getSupabaseClient } from '@/lib/supabase/client'

type AppRole = 'Owner' | 'Admin' | 'Accountant' | 'Viewer' | 'CFO'

export default function CreateOrganizationPage() {
  const router = useRouter()

  const [isCheckingRole, setIsCheckingRole] = useState(true)
  const [canAccess, setCanAccess] = useState(false)

  useEffect(() => {
    let isMounted = true

    const validateAccess = async () => {
      try {
        const supabase = getSupabaseClient()

        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        if (sessionError || !sessionData.session?.user) {
          router.replace('/signin')
          return
        }

        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('role')
          .eq('id', sessionData.session.user.id)
          .maybeSingle()

        if (profileError) {
          throw new Error(profileError.message)
        }

        const role = (profile?.role ?? 'Viewer') as AppRole
        if (role !== 'Admin') {
          router.replace('/dashboard')
          return
        }

        if (isMounted) {
          setCanAccess(true)
        }
      } catch {
        router.replace('/signin')
      } finally {
        if (isMounted) {
          setIsCheckingRole(false)
        }
      }
    }

    void validateAccess()

    return () => {
      isMounted = false
    }
  }, [router])

  if (isCheckingRole) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Validating access...
      </main>
    )
  }

  if (!canAccess) {
    return null
  }

  return <CreateOrganizationScreen onComplete={() => router.push('/dashboard')} />
}
