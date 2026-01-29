import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MenuTag } from '@/lib/types/taxonomy'

interface UpdateItemData {
  name?: string
  description?: string | null
  price?: number
  category?: string
  is_push?: boolean
  is_out_of_stock?: boolean
  tags?: MenuTag[]
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Verify the item belongs to this user's venue
    const { data: item } = await supabase
      .from('menu_items')
      .select('id, menu_id, menus!inner(venue_id)')
      .eq('id', id)
      .single()

    const menuVenueId = (item?.menus as unknown as { venue_id: string })?.venue_id
    if (!item || menuVenueId !== operatorUser.venue_id) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    const data: UpdateItemData = await request.json()
    const { tags, ...itemData } = data

    // Update the item
    if (Object.keys(itemData).length > 0) {
      const { error: updateError } = await supabase
        .from('menu_items')
        .update(itemData)
        .eq('id', id)

      if (updateError) {
        console.error('Update error:', updateError)
        return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
      }
    }

    // Update tags if provided
    if (tags !== undefined) {
      console.log(`[Tags] Updating tags for item ${id}`)
      console.log(`[Tags] New tags:`, tags)

      // Delete existing tags
      const { error: deleteTagError } = await supabase
        .from('item_tags')
        .delete()
        .eq('item_id', id)

      if (deleteTagError) {
        console.error('[Tags] Delete error:', deleteTagError.message, deleteTagError.code)
        return NextResponse.json({
          error: `Failed to delete existing tags: ${deleteTagError.message}`
        }, { status: 500 })
      }
      console.log(`[Tags] Deleted existing tags for item ${id}`)

      // Insert new tags
      if (tags.length > 0) {
        const tagsToInsert = tags.map((tag) => ({
          item_id: id,
          tag,
        }))

        console.log('[Tags] Inserting tags:', tagsToInsert)

        const { data: insertedTags, error: tagError } = await supabase
          .from('item_tags')
          .insert(tagsToInsert)
          .select()

        if (tagError) {
          console.error('[Tags] Insert error:', tagError.message)
          console.error('[Tags] Error details:', tagError.details)
          console.error('[Tags] Error hint:', tagError.hint)
          console.error('[Tags] Error code:', tagError.code)
          return NextResponse.json({
            error: `Failed to save tags: ${tagError.message} (${tagError.code})`
          }, { status: 500 })
        }
        console.log(`[Tags] Successfully inserted ${insertedTags?.length || tags.length} tags`)
      }
    }

    // Fetch updated item with tags
    const { data: updatedItem } = await supabase
      .from('menu_items')
      .select(`
        id,
        name,
        description,
        price,
        category,
        popularity_score,
        is_push,
        is_out_of_stock,
        item_tags (tag)
      `)
      .eq('id', id)
      .single()

    return NextResponse.json({
      success: true,
      item: updatedItem,
    })
  } catch (error) {
    console.error('Update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Verify the item belongs to this user's venue
    const { data: item } = await supabase
      .from('menu_items')
      .select('id, menu_id, menus!inner(venue_id)')
      .eq('id', id)
      .single()

    const menuVenueId = (item?.menus as unknown as { venue_id: string })?.venue_id
    if (!item || menuVenueId !== operatorUser.venue_id) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Delete tags first (if cascade isn't set up)
    await supabase
      .from('item_tags')
      .delete()
      .eq('item_id', id)

    // Delete the item
    const { error: deleteError } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
