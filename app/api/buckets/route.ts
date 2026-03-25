import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type BucketRequest = {
  id?: string
  name: string
  type: 'Operating' | 'Reserve' | 'Liability' | 'Owner'
  monthlyTarget?: number | null
  userId?: string
  organizationId?: string
}

type UserProfileRow = {
  id: string
  organization_id: string | null
  is_active: boolean | null
}

async function insertBucketWithFallbacks(
  admin: ReturnType<typeof getAdminClient>,
  organizationId: string,
  body: BucketRequest
) {
  const withMonthlyTarget =
    typeof body.monthlyTarget === 'number' && Number.isFinite(body.monthlyTarget)
      ? { monthly_target: body.monthlyTarget }
      : {}

  const payloadVariants: Array<Record<string, unknown>> = [
    {
      organization_id: organizationId,
      name: body.name.trim(),
      type: body.type,
      status: 'healthy',
      ...withMonthlyTarget,
    },
    {
      organization_id: organizationId,
      name: body.name.trim(),
      bucket_type: body.type,
      status: 'healthy',
      ...withMonthlyTarget,
    },
    {
      organization_id: organizationId,
      name: body.name.trim(),
      ...withMonthlyTarget,
    },
    {
      organization_id: organizationId,
      name: body.name.trim(),
    },
  ]

  let lastErrorMessage = 'Unable to create bucket with the current buckets table schema'

  for (const payload of payloadVariants) {
    const { data, error } = await admin.from('buckets').insert(payload).select('*').single()

    if (!error) {
      return { data, error: null }
    }

    lastErrorMessage = error.message
  }

  return {
    data: null,
    error: {
      message: `Unable to create bucket with current schema. Last error: ${lastErrorMessage}`,
    },
  }
}

async function updateBucketWithFallbacks(
  admin: ReturnType<typeof getAdminClient>,
  organizationId: string,
  bucketId: string,
  body: BucketRequest
) {
  const withMonthlyTarget =
    typeof body.monthlyTarget === 'number' && Number.isFinite(body.monthlyTarget)
      ? { monthly_target: body.monthlyTarget }
      : { monthly_target: null }

  const payloadVariants: Array<Record<string, unknown>> = [
    {
      name: body.name.trim(),
      type: body.type,
      ...withMonthlyTarget,
    },
    {
      name: body.name.trim(),
      bucket_type: body.type,
      ...withMonthlyTarget,
    },
    {
      name: body.name.trim(),
      monthly_target: withMonthlyTarget.monthly_target,
    },
    {
      name: body.name.trim(),
    },
  ]

  const scopeVariants: Array<Array<[string, string]>> = [
    [
      ['id', bucketId],
      ['organization_id', organizationId],
    ],
    [
      ['id', bucketId],
      ['organizationid', organizationId],
    ],
    [['id', bucketId]],
  ]

  const errors: string[] = []
  for (const payload of payloadVariants) {
    for (const scope of scopeVariants) {
      let query = admin.from('buckets').update(payload)
      for (const [column, value] of scope) {
        query = query.eq(column, value)
      }

      const { data, error } = await query.select('*').single()
      if (!error) {
        return { data, error: null }
      }

      errors.push(error.message)
    }
  }

  return {
    data: null,
    error: {
      message: `Unable to update bucket with current schema. Errors: ${errors.join(' | ')}`,
    },
  }
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
      const body = (await clonedRequest.json()) as { accessToken?: string; userId?: string; organizationId?: string }
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

export async function GET(request: Request) {
  try {
    const authorized = await getAuthorizedProfile(request)
    if ('error' in authorized) {
      return authorized.error
    }

    const { admin, profile } = authorized
    const { data, error } = await admin
      .from('buckets')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ buckets: data ?? [] }, { status: 200 })
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
    const body = (await request.json()) as BucketRequest

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Bucket name is required' }, { status: 400 })
    }

    const organizationId = profile.organization_id
    if (!organizationId) {
      return NextResponse.json({ error: 'No organization linked to this user' }, { status: 400 })
    }

    const { data, error } = await insertBucketWithFallbacks(admin, organizationId, body)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ bucket: data }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const authorized = await getAuthorizedProfile(request)
    if ('error' in authorized) {
      return authorized.error
    }

    const { admin, profile } = authorized
    const body = (await request.json()) as BucketRequest

    if (!body.id?.trim()) {
      return NextResponse.json({ error: 'Bucket id is required' }, { status: 400 })
    }

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Bucket name is required' }, { status: 400 })
    }

    const organizationId = profile.organization_id
    if (!organizationId) {
      return NextResponse.json({ error: 'No organization linked to this user' }, { status: 400 })
    }

    const { data, error } = await updateBucketWithFallbacks(admin, organizationId, body.id, body)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ bucket: data }, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
