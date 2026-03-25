import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

type BankAccountRequest = {
  accountName: string
  accountNumber: string
  accountType: 'Savings' | 'Current' | 'Overdraft' | 'Other'
  bankName?: string
  ifscCode?: string
  balance?: number
  isPrimary?: boolean
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
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ error: 'Missing authorization token' }, { status: 401 }) }
  }

  const accessToken = authHeader.replace('Bearer ', '')
  const admin = getAdminClient()

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

export async function GET(request: Request) {
  try {
    const authorized = await getAuthorizedProfile(request)
    if ('error' in authorized) {
      return authorized.error
    }

    const { admin, profile } = authorized
    const { data, error } = await admin
      .from('bank_accounts')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ accounts: data ?? [] }, { status: 200 })
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
    const body = (await request.json()) as BankAccountRequest

    if (!body.accountName?.trim() || !body.accountNumber?.trim()) {
      return NextResponse.json({ error: 'Account name and account number are required' }, { status: 400 })
    }

    const { data, error } = await admin
      .from('bank_accounts')
      .insert({
        organization_id: profile.organization_id,
        account_name: body.accountName.trim(),
        account_number: body.accountNumber.trim(),
        account_type: body.accountType,
        bank_name: body.bankName?.trim() || null,
        ifsc_code: body.ifscCode?.trim() || null,
        balance: body.balance ?? 0,
        is_primary: Boolean(body.isPrimary),
        status: 'Active',
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ account: data }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const authorized = await getAuthorizedProfile(request)
    if ('error' in authorized) {
      return authorized.error
    }

    const { admin, profile } = authorized
    const accountId = new URL(request.url).searchParams.get('id')

    if (!accountId) {
      return NextResponse.json({ error: 'Bank account id is required' }, { status: 400 })
    }

    const { data: existingAccount, error: existingError } = await admin
      .from('bank_accounts')
      .select('id, organization_id')
      .eq('id', accountId)
      .maybeSingle()

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 400 })
    }

    if (!existingAccount || existingAccount.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: 'Bank account not found' }, { status: 404 })
    }

    const { error } = await admin.from('bank_accounts').delete().eq('id', accountId)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
