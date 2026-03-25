import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type InvoiceRequest = {
  invoiceNo: string
  partyName: string
  type: 'Revenue' | 'Expense'
  invoiceAmount: number
  paidAmount?: number
  balanceDue?: number
  dueDate: string
  status?: 'Paid' | 'Partial' | 'Unpaid' | 'Overdue'
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
      const body = (await clonedRequest.json()) as {
        accessToken?: string
        userId?: string
        organizationId?: string
      }
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

async function insertInvoiceWithFallbacks(
  admin: ReturnType<typeof getAdminClient>,
  organizationId: string,
  body: InvoiceRequest
) {
  const paidAmount = body.paidAmount ?? 0
  const status = body.status ?? 'Unpaid'
  const invoiceDate = new Date().toISOString().slice(0, 10)

  // PostgreSQL lowercases unquoted identifiers in DDL, so camelCase columns like
  // "organizationId" are stored as "organizationid" in pg_attribute / PostgREST schema cache.
  const payloadVariants: Array<Record<string, unknown>> = [
    // Variant 1: snake_case with required invoice_date and due_date
    {
      organization_id: organizationId,
      invoice_no: body.invoiceNo.trim(),
      party_name: body.partyName.trim(),
      type: body.type,
      invoice_amount: body.invoiceAmount,
      paid_amount: paidAmount,
      invoice_date: invoiceDate,
      due_date: body.dueDate,
      status,
    },
    // Variant 2: snake_case using dueDate (quoted camelCase column)
    {
      organization_id: organizationId,
      invoice_no: body.invoiceNo.trim(),
      party_name: body.partyName.trim(),
      type: body.type,
      invoice_amount: body.invoiceAmount,
      paid_amount: paidAmount,
      invoice_date: invoiceDate,
      dueDate: body.dueDate,
      status,
    },
    // Variant 3: all-lowercase for schemas created from unquoted camelCase DDL
    {
      organizationid: organizationId,
      invoiceno: body.invoiceNo.trim(),
      partyname: body.partyName.trim(),
      type: body.type,
      invoiceamount: body.invoiceAmount,
      paidamount: paidAmount,
      invoicedate: invoiceDate,
      due_date: body.dueDate,
      status,
    },
    // Variant 4: all-lowercase with dueDate (quoted camelCase column)
    {
      organizationid: organizationId,
      invoiceno: body.invoiceNo.trim(),
      partyname: body.partyName.trim(),
      type: body.type,
      invoiceamount: body.invoiceAmount,
      paidamount: paidAmount,
      invoicedate: invoiceDate,
      dueDate: body.dueDate,
      status,
    },
    // Variant 5: minimal shape for strict schemas (no paid/status)
    {
      organization_id: organizationId,
      invoice_no: body.invoiceNo.trim(),
      party_name: body.partyName.trim(),
      type: body.type,
      invoice_amount: body.invoiceAmount,
      invoice_date: invoiceDate,
      due_date: body.dueDate,
      status,
    },
  ]

  const errors: string[] = []
  for (const payload of payloadVariants) {
    const { data, error } = await admin.from('invoices').insert(payload).select('*').single()
    if (!error) {
      return { data, error: null }
    }
    errors.push(error.message)
  }

  return { data: null, error: { message: `Unable to create invoice. Errors: ${errors.join(' | ')}` } }
}

export async function GET(request: Request) {
  try {
    const authorized = await getAuthorizedProfile(request)
    if ('error' in authorized) {
      return authorized.error
    }

    const { admin, profile } = authorized
    const organizationId = profile.organization_id
    if (!organizationId) {
      return NextResponse.json({ error: 'No organization linked to this user' }, { status: 400 })
    }

    // Try fetching with all-lowercase column name first (PostgreSQL lowercases unquoted DDL identifiers)
    const { data, error } = await admin
      .from('invoices')
      .select('*')
      .eq('organizationid', organizationId)
      .order('createdat', { ascending: false })

    if (error) {
      // Fallback: try snake_case
      const { data: fallbackData, error: fallbackError } = await admin
        .from('invoices')
        .select('*')
        .eq('organization_id', organizationId)

      if (fallbackError) {
        return NextResponse.json({ error: fallbackError.message }, { status: 400 })
      }

      return NextResponse.json({ invoices: fallbackData ?? [] }, { status: 200 })
    }

    return NextResponse.json({ invoices: data ?? [] }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const authorized = await getAuthorizedProfile(request)
    if ('error' in authorized) {
      return authorized.error
    }

    const { admin, profile } = authorized
    const body = (await request.json()) as InvoiceRequest

    if (!body.invoiceNo?.trim() || !body.partyName?.trim() || !Number.isFinite(body.invoiceAmount) || !body.dueDate) {
      return NextResponse.json({ error: 'Invoice number, party name, amount, and due date are required' }, { status: 400 })
    }

    const organizationId = profile.organization_id
    if (!organizationId) {
      return NextResponse.json({ error: 'No organization linked to this user' }, { status: 400 })
    }

    const { data, error } = await insertInvoiceWithFallbacks(admin, organizationId, body)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ invoice: data }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
