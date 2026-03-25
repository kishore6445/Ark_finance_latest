import { NextResponse } from 'next/server'
import { createClient, type User } from '@supabase/supabase-js'

type CreateOrganizationRequest = {
  name: string
  email: string
  phone?: string
  gstin?: string
  pan?: string
  address?: string
  city?: string
  state?: string
  pinCode?: string
}

type OrganizationRow = {
  id: string
  name: string
  gst_number: string | null
  pan_number: string | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  contact_email: string | null
  contact_phone: string | null
  logo_url: string | null
  created_at: string | null
  updated_at: string | null
}

function resolveInviteRedirectTo(request: Request) {
  const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (configuredAppUrl) {
    return `${configuredAppUrl.replace(/\/$/, '')}/auth/set-password`
  }

  const requestOrigin = new URL(request.url).origin
  return `${requestOrigin.replace(/\/$/, '')}/auth/set-password`
}

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  const urlRefMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/i)
  const urlRef = urlRefMatch?.[1]

  const payloadPart = serviceRoleKey.split('.')[1]
  let keyRef: string | undefined
  if (payloadPart) {
    const padded = payloadPart + '='.repeat((4 - (payloadPart.length % 4)) % 4)
    const decoded = Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    const parsed = JSON.parse(decoded) as { ref?: string }
    keyRef = parsed.ref
  }

  if (urlRef && keyRef && urlRef !== keyRef) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY belongs to a different project than NEXT_PUBLIC_SUPABASE_URL')
  }

  return createClient<any>(supabaseUrl, serviceRoleKey)
}

async function findAuthUserByEmail(admin: ReturnType<typeof getAdminClient>, email: string) {
  let page = 1

  while (page <= 20) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })

    if (error) {
      throw new Error(error.message)
    }

    const users: User[] = data.users ?? []
    const matched = users.find((user) => user.email?.toLowerCase() === email.toLowerCase())
    if (matched) {
      return matched
    }

    if (users.length < 1000) {
      break
    }

    page += 1
  }

  return null
}

async function getOrCreateOwnerAuthUser(
  admin: ReturnType<typeof getAdminClient>,
  ownerEmail: string,
  redirectTo: string
) {
  const existing = await findAuthUserByEmail(admin, ownerEmail)
  if (existing) {
    return { id: existing.id, invited: false, setupLink: null as string | null }
  }

  const { data, error } = await admin.auth.admin.inviteUserByEmail(ownerEmail, {
    redirectTo,
  })

  if (!error) {
    const invitedUserId = data.user?.id
    if (invitedUserId) {
      return { id: invitedUserId, invited: true, setupLink: null as string | null }
    }

    const invitedUser = await findAuthUserByEmail(admin, ownerEmail)
    if (invitedUser?.id) {
      return { id: invitedUser.id, invited: true, setupLink: null as string | null }
    }
  }

  const isRateLimited = (error?.message ?? '').toLowerCase().includes('rate limit')
  if (!isRateLimited) {
    throw new Error(error?.message ?? 'Unable to provision owner auth user')
  }

  // Fallback when invite emails are throttled: generate a manual invite link for admin to share.
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'invite',
    email: ownerEmail,
    options: {
      redirectTo,
    },
  })

  if (linkError) {
    throw new Error(linkError.message)
  }

  const linkedUserId = linkData.user?.id
  if (!linkedUserId) {
    throw new Error('Unable to provision owner auth user')
  }

  const setupLink = linkData.properties?.action_link ?? null
  return { id: linkedUserId, invited: false, setupLink }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization token' }, { status: 401 })
    }

    const accessToken = authHeader.replace('Bearer ', '')
    const body = (await request.json()) as CreateOrganizationRequest

    if (!body?.name?.trim() || !body?.email?.trim()) {
      return NextResponse.json({ error: 'Organization name and owner email are required' }, { status: 400 })
    }

    const admin = getAdminClient()

    const { data: authData, error: authError } = await admin.auth.getUser(accessToken)
    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message ?? 'Unauthorized' }, { status: 401 })
    }

    const requesterId = authData.user.id
    const { data: requesterProfile, error: requesterError } = await admin
      .from('users')
      .select('role, is_active')
      .eq('id', requesterId)
      .maybeSingle()

    if (requesterError) {
      return NextResponse.json({ error: requesterError.message }, { status: 400 })
    }

    if (!requesterProfile || requesterProfile.role !== 'Admin' || !requesterProfile.is_active) {
      return NextResponse.json({ error: 'Only Admin users can create organizations' }, { status: 403 })
    }

    const { data: organization, error: organizationError } = await admin
      .from('organizations')
      .insert({
        name: body.name,
        gst_number: body.gstin ?? null,
        pan_number: body.pan ?? null,
        address: body.address ?? null,
        city: body.city ?? null,
        state: body.state ?? null,
        pincode: body.pinCode ?? null,
        contact_email: body.email,
        contact_phone: body.phone ?? null,
      })
      .select('*')
      .single()

    if (organizationError) {
      return NextResponse.json({ error: organizationError.message }, { status: 400 })
    }

    const redirectTo = resolveInviteRedirectTo(request)
    const ownerAuthUser = await getOrCreateOwnerAuthUser(admin, body.email, redirectTo)

    const { error: ownerUpsertError } = await admin
      .from('users')
      .upsert(
        {
          id: ownerAuthUser.id,
          organization_id: (organization as OrganizationRow).id,
          email: body.email,
          role: 'Owner',
          is_active: true,
        },
        { onConflict: 'id' }
      )

    if (ownerUpsertError) {
      return NextResponse.json({ error: ownerUpsertError.message }, { status: 400 })
    }

    return NextResponse.json(
      {
        organization,
        ownerInvited: ownerAuthUser.invited,
        ownerSetupLink: ownerAuthUser.setupLink,
      },
      { status: 200 }
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
