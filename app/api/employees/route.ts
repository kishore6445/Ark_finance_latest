import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

type EmployeeRequest = {
  id?: string
  employeeCode?: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  dob?: string
  gender?: 'M' | 'F' | 'Other'
  joiningDate?: string
  departmentId?: string
  designationId?: string
  reportingManager?: string
  bankAccount?: {
    accountNumber?: string
    ifscCode?: string
    bankName?: string
    accountType?: 'Savings' | 'Current'
  }
  status?: 'Active' | 'Inactive' | 'On Leave' | 'Separated'
  baseCtc?: number
  accessToken?: string
  userId?: string
  organizationId?: string
}

type UserProfileRow = {
  id: string
  organization_id: string | null
  is_active: boolean | null
}

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient<any>(supabaseUrl, serviceRoleKey)
}

async function getAuthorizedProfile(request: Request) {
  const authHeader = request.headers.get('authorization')
  const headerToken = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : null
  const fallbackHeaderToken = request.headers.get('x-access-token')
  const fallbackUserIdHeader = request.headers.get('x-user-id')
  const fallbackOrganizationIdHeader = request.headers.get('x-organization-id')
  const requestUrl = new URL(request.url)

  let bodyToken: string | null = null
  let bodyUserId: string | null = null
  let bodyOrganizationId: string | null = null

  if (request.method !== 'GET') {
    const clonedRequest = request.clone()
    try {
      const body = (await clonedRequest.json()) as EmployeeRequest
      bodyToken = body.accessToken ?? null
      bodyUserId = body.userId ?? null
      bodyOrganizationId = body.organizationId ?? null
    } catch {
      bodyToken = null
      bodyUserId = null
      bodyOrganizationId = null
    }
  }

  const accessToken = headerToken ?? fallbackHeaderToken ?? bodyToken
  const admin = getAdminClient()

  if (!accessToken) {
    const fallbackUserId = fallbackUserIdHeader ?? requestUrl.searchParams.get('userId') ?? bodyUserId
    const fallbackOrganizationId =
      fallbackOrganizationIdHeader ?? requestUrl.searchParams.get('organizationId') ?? bodyOrganizationId

    if (!fallbackUserId || !fallbackOrganizationId) {
      return { error: NextResponse.json({ error: 'Missing authorization token' }, { status: 401 }) }
    }

    const { data: profile, error: profileError } = await admin
      .from('users')
      .select('id, organization_id, is_active')
      .eq('id', fallbackUserId)
      .maybeSingle<UserProfileRow>()

    if (profileError) {
      return { error: NextResponse.json({ error: profileError.message }, { status: 400 }) }
    }

    if (!profile?.is_active) {
      return { error: NextResponse.json({ error: 'User is inactive' }, { status: 403 }) }
    }

    if (profile.organization_id !== fallbackOrganizationId) {
      return { error: NextResponse.json({ error: 'Organization mismatch for this user' }, { status: 403 }) }
    }

    return { admin, profile }
  }

  const { data: authData, error: authError } = await admin.auth.getUser(accessToken)
  if (authError || !authData.user) {
    return { error: NextResponse.json({ error: authError?.message ?? 'Unauthorized' }, { status: 401 }) }
  }

  const { data: profile, error: profileError } = await admin
    .from('users')
    .select('id, organization_id, is_active')
    .eq('id', authData.user.id)
    .maybeSingle<UserProfileRow>()

  if (profileError) {
    return { error: NextResponse.json({ error: profileError.message }, { status: 400 }) }
  }

  if (!profile?.is_active) {
    return { error: NextResponse.json({ error: 'User is inactive' }, { status: 403 }) }
  }

  if (!profile.organization_id) {
    return { error: NextResponse.json({ error: 'No organization linked to this user' }, { status: 400 }) }
  }

  return { admin, profile }
}

function generateEmployeeCode(currentCount: number) {
  return `EMP${String(currentCount + 1).padStart(3, '0')}`
}

export async function GET(request: Request) {
  try {
    const authorized = await getAuthorizedProfile(request)
    if ('error' in authorized) return authorized.error

    const { admin, profile } = authorized
    const organizationId = profile.organization_id
    if (!organizationId) {
      return NextResponse.json({ error: 'No organization linked to this user' }, { status: 400 })
    }

    const { data, error } = await admin
      .from('employees')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ employees: data ?? [] }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authorized = await getAuthorizedProfile(request)
    if ('error' in authorized) return authorized.error

    const { admin, profile } = authorized
    const organizationId = profile.organization_id
    if (!organizationId) {
      return NextResponse.json({ error: 'No organization linked to this user' }, { status: 400 })
    }

    const body = (await request.json()) as EmployeeRequest
    if (!body.firstName?.trim() || !body.lastName?.trim() || !body.email?.trim()) {
      return NextResponse.json({ error: 'firstName, lastName and email are required' }, { status: 400 })
    }

    const { count } = await admin
      .from('employees')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)

    const now = new Date().toISOString()
    const payload = {
      id: crypto.randomUUID(),
      organization_id: organizationId,
      employee_code: body.employeeCode ?? generateEmployeeCode(count ?? 0),
      first_name: body.firstName.trim(),
      last_name: body.lastName.trim(),
      email: body.email.trim(),
      phone: body.phone ?? null,
      dob: body.dob ?? null,
      gender: body.gender ?? 'M',
      joining_date: body.joiningDate ?? new Date().toISOString().slice(0, 10),
      department_id: body.departmentId ?? null,
      designation_id: body.designationId ?? null,
      reporting_manager: body.reportingManager ?? null,
      bank_account: body.bankAccount ?? null,
      status: body.status ?? 'Active',
      base_ctc: body.baseCtc ?? 0,
      created_at: now,
      updated_at: now,
    }

    const { data, error } = await admin
      .from('employees')
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ employee: data }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const authorized = await getAuthorizedProfile(request)
    if ('error' in authorized) return authorized.error

    const { admin, profile } = authorized
    const organizationId = profile.organization_id
    if (!organizationId) {
      return NextResponse.json({ error: 'No organization linked to this user' }, { status: 400 })
    }

    const requestUrl = new URL(request.url)
    const employeeId = requestUrl.searchParams.get('id')
    if (!employeeId) {
      return NextResponse.json({ error: 'Employee id is required' }, { status: 400 })
    }

    const { data: existing, error: fetchError } = await admin
      .from('employees')
      .select('id, organization_id')
      .eq('id', employeeId)
      .maybeSingle()

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 400 })
    }

    if (!existing || existing.organization_id !== organizationId) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const { error: deleteError } = await admin
      .from('employees')
      .delete()
      .eq('id', employeeId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
