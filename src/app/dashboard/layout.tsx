import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from './DashboardShell'

interface VenueData {
  id: string
  name: string
  slug: string
}

interface OperatorUser {
  id: string
  email: string
  role: string
  venue_id: string
  venues: VenueData
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get operator user with venue
  const { data: operatorUser } = await supabase
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
    .eq('auth_user_id', user.id)
    .single()

  if (!operatorUser?.venue_id) {
    redirect('/onboarding/venue')
  }

  const typedOperatorUser = operatorUser as unknown as OperatorUser

  return (
    <DashboardShell
      venueName={typedOperatorUser.venues?.name || 'Your Venue'}
      userEmail={typedOperatorUser.email || user.email || ''}
      venueSlug={typedOperatorUser.venues?.slug}
      venueId={typedOperatorUser.venues?.id}
    >
      {children}
    </DashboardShell>
  )
}
