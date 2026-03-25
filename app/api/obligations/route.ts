import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

type ObligationRequest = {
  id?: string
  type: 'Salary' | 'Vendor Invoice' | 'Loan EMI' | 'Advance' | 'Partner Payout'
  party: string
  category: 'Employee' | 'Vendor' | 'Loan' | 'Owner'
  amountDue: number
  dueDate: string
  status?: 'Planned' | 'Due Soon' | 'Overdue'
  source?: 'Manual'
  sourceRef?: string
  daysOverdue?: number
  priority?: string
  notes?: string
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
      const body = (await clonedRequest.json()) as ObligationRequest
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

async function insertObligation(
  admin: ReturnType<typeof getAdminClient>,
  organizationId: string,
  body: ObligationRequest
) {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  const payload = {
    id,
    organization_id: organizationId,
    type: body.type,
    party: body.party,
    category: body.category,
    amount_due: body.amountDue,
    due_date: body.dueDate,
    status: body.status ?? 'Planned',
    source: 'Manual',
    source_ref: body.sourceRef ?? null,
    days_overdue: body.daysOverdue ?? null,
    priority: body.priority ?? null,
    notes: body.notes ?? null,
    created_at: now,
    updated_at: now,
  }

  const { data, error } = await admin
    .from('obligations')
    .insert(payload)
    .select('*')
    .single()

  return { data, error }
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
      .from('obligations')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ obligations: data ?? [] }, { status: 200 })
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

    const body = (await request.json()) as ObligationRequest

    if (!body.party?.trim() || !body.amountDue || !body.dueDate || !body.type || !body.category) {
      return NextResponse.json(
        { error: 'party, amountDue, dueDate, type, and category are required' },
        { status: 400 }
      )
    }

    const { data, error } = await insertObligation(admin, organizationId, body)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ obligation: data }, { status: 201 })
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
    const obligationId = requestUrl.searchParams.get('id')
    if (!obligationId) {
      return NextResponse.json({ error: 'Obligation id is required' }, { status: 400 })
    }

    // Verify the obligation belongs to this organization before deleting
    const { data: existing, error: fetchError } = await admin
      .from('obligations')
      .select('id, organization_id, source')
      .eq('id', obligationId)
      .maybeSingle()

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 400 })
    }

    if (!existing || existing.organization_id !== organizationId) {
      return NextResponse.json({ error: 'Obligation not found' }, { status: 404 })
    }

    if (existing.source !== 'Manual') {
      return NextResponse.json(
        { error: 'Only manual obligations can be deleted' },
        { status: 403 }
      )
    }

    const { error: deleteError } = await admin
      .from('obligations')
      .delete()
      .eq('id', obligationId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
