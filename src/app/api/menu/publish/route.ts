import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's venue
    const { data: operatorUser } = await supabase
      .from('operator_users')
      .select('venue_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!operatorUser?.venue_id) {
      return NextResponse.json({ error: 'No venue found' }, { status: 404 })
    }

    const venueId = operatorUser.venue_id

    // Get the menu for this venue (draft or published)
    const { data: menu, error: menuError } = await supabase
      .from('menus')
      .select('id, status')
      .eq('venue_id', venueId)
      .in('status', ['draft', 'published'])
      .single()

    if (menuError || !menu) {
      return NextResponse.json({ error: 'No menu found' }, { status: 404 })
    }

    // Count items in the menu
    const { count } = await supabase
      .from('menu_items')
      .select('*', { count: 'exact', head: true })
      .eq('menu_id', menu.id)

    if (!count || count === 0) {
      return NextResponse.json({ error: 'Cannot publish empty menu' }, { status: 400 })
    }

    // Update menu status to published
    const { error: updateError } = await supabase
      .from('menus')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .eq('id', menu.id)

    if (updateError) {
      console.error('Publish error:', updateError)
      return NextResponse.json({ error: 'Failed to publish menu' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Menu published with ${count} items`,
      itemCount: count,
    })
  } catch (error) {
    console.error('Publish error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
