  import { NextResponse } from 'next/server'
  import { createClient } from '@supabase/supabase-js'

  export const dynamic = 'force-dynamic'

  type TransactionRequest = {
    id?: string
    date: string
    description: string
    amount: number
    isIncome: boolean
    accountingType: 'Revenue' | 'Expense' | 'Asset' | 'Liability'
    subtype: string
    bucketId?: string | null
    vendorCustomerName?: string | null
    paymentMethod?: string | null
    bankAccountId?: string | null
    invoiceId?: string | null
    status?: string
    gstAmount?: number
    taxableAmount?: number
    notes?: string
  }

  type RequestBody = {
    transaction?: TransactionRequest
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
        const body = (await clonedRequest.json()) as RequestBody
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


  function buildTransactionPayload(
    transaction: TransactionRequest,
    organizationId: string,
    resolvedId?: string
  ) {
        const t = transaction as any
        const isIncome = t.isIncome ?? t.is_income
        const accountingType = t.accountingType ?? t.accounting_type
        const bucketId = t.bucketId ?? t.bucket_id
        const vendorCustomerName = t.vendorCustomerName ?? t.vendor_customer_name
        const paymentMethod = t.paymentMethod ?? t.payment_method
        const bankAccountId = t.bankAccountId ?? t.bank_account_id
        const gstAmount = t.gstAmount ?? t.gst_amount ?? 0
        const taxableAmount = t.taxableAmount ?? t.taxable_amount ?? t.amount
        const invoiceId = t.invoiceId ?? t.invoice_reference ?? t.invoice_id

    return {
      ...(resolvedId ? { id: resolvedId } : {}),
      organization_id: organizationId,
      date: t.date,
      description: t.description.trim(),
      amount: t.amount,
        is_income: isIncome,
        accounting_type: accountingType,
      subtype: t.subtype,
        bucket_id: bucketId ?? null,
        vendor_customer_name: vendorCustomerName ?? null,
        bank_account_id: bankAccountId ?? null,
        assigned_bank_account_id: bankAccountId ?? null,
      status: t.status ?? 'DRAFT',
        gst_amount: gstAmount,
        gst_taxable: taxableAmount,
      notes: t.notes ?? '',
        invoice_reference: invoiceId ?? null,
    }
  }

    

  


  // async function selectTransactionsByOrganization(admin: ReturnType<typeof getAdminClient>, organizationId: string) {
  //   const variants = [
  //     () =>
  //       admin
  //         .from('transactions')
  //         .select('*')
  //         .eq('organizationid', organizationId)
  //         .order('createdat', { ascending: false }),
  //     () =>
  //       admin
  //         .from('transactions')
  //         .select('*')
  //         .eq('organization_id', organizationId)
  //         .order('created_at', { ascending: false }),
  //   ]
async function selectTransactionsByOrganization(
  admin: ReturnType<typeof getAdminClient>,
  organizationId: string
) {
  const { data, error } = await admin
    .from('transactions')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  return { data: data ?? [], error }
}

async function adjustBankAccountBalance(
  admin: ReturnType<typeof getAdminClient>,
  bankAccountId: string,
  delta: number
) {
  if (!bankAccountId || delta === 0) {
    return
  }

  const { data: acc } = await admin
    .from('bank_accounts')
    .select('balance')
    .eq('id', bankAccountId)
    .maybeSingle()

  if (acc) {
    await admin
      .from('bank_accounts')
      .update({ balance: Number(acc.balance ?? 0) + delta })
      .eq('id', bankAccountId)
  }
}
  //   const errors: string[] = []
  //   for (const query of variants) {
  //     const { data, error } = await query()
  //     if (!error) {
  //       return { data: data ?? [], error: null }
  //     }
  //     errors.push(error.message)
  //   }

  //   return { data: [], error: { message: errors.join(' | ') } }
  // }

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

      const { data, error } = await selectTransactionsByOrganization(admin, organizationId)
      if (error) {
        return NextResponse.json({ error: `Failed to fetch transactions: ${error.message}` }, { status: 400 })
      }

      return NextResponse.json({ transactions: data }, { status: 200 })
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
      const body = (await request.json()) as RequestBody
      const transaction = body.transaction
      const normalizedTransaction = transaction as any
      const bankAccountId = normalizedTransaction?.bankAccountId ?? normalizedTransaction?.bank_account_id ?? null
      const isIncome = normalizedTransaction?.isIncome ?? normalizedTransaction?.is_income

      if (!transaction || !transaction.description?.trim() || !Number.isFinite(transaction.amount) || !transaction.date) {
        return NextResponse.json({ error: 'Transaction date, description and amount are required' }, { status: 400 })
      }

      const organizationId = profile.organization_id
      if (!organizationId) {
        return NextResponse.json({ error: 'No organization linked to this user' }, { status: 400 })
      }

      // UPDATE existing transaction
      if (transaction.id) {
        // Fetch the old transaction so we can reverse its effect on the bank balance
        const { data: oldTxn } = await admin
          .from('transactions')
          .select('amount, is_income, bank_account_id')
          .eq('id', transaction.id)
          .maybeSingle()

        const payload = buildTransactionPayload(transaction, organizationId)
        const { data, error } = await admin
          .from('transactions')
          .update(payload)
          .eq('id', transaction.id)
          .select('*')
          .single()

        if (error) {
          return NextResponse.json({ error: `Unable to update transaction: ${error.message}` }, { status: 400 })
        }

        // Adjust bank balance: reverse old effect, apply new effect
        const resolvedBankAccountId = bankAccountId ?? oldTxn?.bank_account_id
        if (resolvedBankAccountId) {
          const reversal = oldTxn
            ? (oldTxn.is_income ? -Number(oldTxn.amount) : Number(oldTxn.amount))
            : 0
          const newEffect = isIncome ? Number(transaction.amount) : -Number(transaction.amount)
          const delta = reversal + newEffect

          await adjustBankAccountBalance(admin, resolvedBankAccountId, delta)
        }

        return NextResponse.json({ transaction: data }, { status: 200 })
      }

      // INSERT new transaction
      const resolvedId = crypto.randomUUID()
      const payload = buildTransactionPayload(transaction, organizationId, resolvedId)
      const { data, error } = await admin
        .from('transactions')
        .insert(payload)
        .select('*')
        .single()

      if (error) {
        return NextResponse.json({ error: `Unable to create transaction: ${error.message}` }, { status: 400 })
      }

      // Adjust bank balance: inflow → add, outflow → subtract
      if (bankAccountId) {
        const delta = isIncome ? Number(transaction.amount) : -Number(transaction.amount)
        await adjustBankAccountBalance(admin, bankAccountId, delta)
      }

      return NextResponse.json({ transaction: data }, { status: 200 })
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
      const organizationId = profile.organization_id
      if (!organizationId) {
        return NextResponse.json({ error: 'No organization linked to this user' }, { status: 400 })
      }

      const requestUrl = new URL(request.url)
      const transactionId = requestUrl.searchParams.get('id')
      if (!transactionId) {
        return NextResponse.json({ error: 'Transaction id is required' }, { status: 400 })
      }

      const { data: existingTransaction, error: fetchError } = await admin
        .from('transactions')
        .select('id, amount, is_income, bank_account_id, organization_id')
        .eq('id', transactionId)
        .maybeSingle()

      if (fetchError) {
        return NextResponse.json({ error: `Unable to load transaction: ${fetchError.message}` }, { status: 400 })
      }

      if (!existingTransaction || existingTransaction.organization_id !== organizationId) {
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
      }

      const { error: deleteError } = await admin
        .from('transactions')
        .delete()
        .eq('id', transactionId)

      if (deleteError) {
        return NextResponse.json({ error: `Unable to delete transaction: ${deleteError.message}` }, { status: 400 })
      }

      if (existingTransaction.bank_account_id) {
        const reversal = existingTransaction.is_income
          ? -Number(existingTransaction.amount)
          : Number(existingTransaction.amount)
        await adjustBankAccountBalance(admin, existingTransaction.bank_account_id, reversal)
      }

      return NextResponse.json({ success: true }, { status: 200 })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected server error'
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }
