import { createClient } from './client'

export interface SignUpData {
  email: string
  password: string
  plan?: string
}

export interface SignInData {
  email: string
  password: string
}

export async function signUp({ email, password, plan }: SignUpData) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        plan: plan || 'monthly',
      },
    },
  })

  if (error) {
    return { user: null, error: error.message }
  }

  return { user: data.user, error: null }
}

export async function signIn({ email, password }: SignInData) {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { user: null, session: null, error: error.message }
  }

  return { user: data.user, session: data.session, error: null }
}

export async function signOut() {
  const supabase = createClient()
  const { error } = await supabase.auth.signOut()
  return { error: error?.message || null }
}

export async function getCurrentUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

export async function getUserVenue(authUserId: string) {
  const supabase = createClient()

  console.log('[getUserVenue] Looking up operator for auth_user_id:', authUserId)

  const { data: operatorUser, error } = await supabase
    .from('operator_users')
    .select(`
      id,
      email,
      role,
      venue_id,
      venues (
        id,
        name,
        slug
      )
    `)
    .eq('auth_user_id', authUserId)
    .maybeSingle()  // Use maybeSingle to avoid error when no row found

  console.log('[getUserVenue] Result:', { operatorUser, error })

  if (error) {
    console.error('[getUserVenue] Database error:', error)
    return null
  }

  return operatorUser
}
