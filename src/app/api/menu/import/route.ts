import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MenuTag } from '@/lib/types/taxonomy'

interface ImportItem {
  name: string
  description: string | null
  price: number
  category: string
  tags?: MenuTag[]
}

export async function POST(request: NextRequest) {
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
    const { items } = await request.json() as { items: ImportItem[] }

    console.log('=== MENU IMPORT START ===')
    console.log('Venue ID:', venueId)
    console.log('Items to import:', items.length)
    console.log('Sample item with tags:', items[0] ? { name: items[0].name, tags: items[0].tags } : 'none')

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items to import' }, { status: 400 })
    }

    // Get or create a menu for this venue
    let { data: menu } = await supabase
      .from('menus')
      .select('id')
      .eq('venue_id', venueId)
      .in('status', ['draft', 'published'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!menu) {
      // Create a new draft menu
      const { data: newMenu, error: menuError } = await supabase
        .from('menus')
        .insert({
          venue_id: venueId,
          version: 1,
          status: 'draft',
        })
        .select('id')
        .single()

      if (menuError) {
        console.error('Menu creation error:', menuError?.message, menuError?.details, menuError?.hint, menuError?.code)
        return NextResponse.json({ error: 'Failed to create menu' }, { status: 500 })
      }
      menu = newMenu
      console.log('Created new menu:', menu.id)
    } else {
      console.log('Using existing menu:', menu.id)
    }

    // Insert items one by one to ensure we can properly associate tags
    const insertedItems: { id: string; name: string }[] = []
    const allTagsToInsert: { item_id: string; tag: string }[] = []
    let successCount = 0
    let errorCount = 0

    for (const item of items) {
      try {
        console.log(`Inserting item: "${item.name}" with ${item.tags?.length || 0} tags`)

        const { data: newItem, error: insertError } = await supabase
          .from('menu_items')
          .insert({
            menu_id: menu.id,
            name: item.name,
            description: item.description || null,
            price: typeof item.price === 'number' ? item.price : parseFloat(String(item.price)) || 0,
            category: item.category || 'Uncategorized',
            popularity_score: 0,
            is_push: false,
            is_out_of_stock: false,
          })
          .select('id, name')
          .single()

        if (insertError) {
          console.error(`Insert error for "${item.name}":`, insertError?.message, insertError?.details, insertError?.hint, insertError?.code)
          errorCount++
          continue
        }

        if (!newItem?.id) {
          console.error(`No ID returned for "${item.name}"`)
          errorCount++
          continue
        }

        console.log(`Successfully inserted item "${item.name}" with ID: ${newItem.id}`)
        insertedItems.push(newItem)
        successCount++

        // Collect tags for this item - check multiple possible property names
        const tagsToInsert = item.tags || []
        console.log(`Tags for "${item.name}":`, tagsToInsert)

        if (tagsToInsert.length > 0) {
          tagsToInsert.forEach((tag) => {
            if (tag && typeof tag === 'string') {
              allTagsToInsert.push({
                item_id: newItem.id,
                tag: tag.trim(),
              })
            }
          })
        }
      } catch (err) {
        console.error(`Unexpected error importing "${item.name}":`, err)
        errorCount++
      }
    }

    console.log(`Items inserted: ${successCount}/${items.length}`)
    console.log(`Total tags to insert: ${allTagsToInsert.length}`)

    // Insert all tags in one batch
    if (allTagsToInsert.length > 0) {
      console.log('Inserting tags:', allTagsToInsert.slice(0, 5), '...')

      const { error: tagError } = await supabase
        .from('item_tags')
        .insert(allTagsToInsert)

      if (tagError) {
        console.error('Tag insert error:', tagError?.message, tagError?.details, tagError?.hint, tagError?.code)
      } else {
        console.log(`Successfully inserted ${allTagsToInsert.length} tags`)
      }
    }

    console.log('=== MENU IMPORT COMPLETE ===')
    console.log(`Success: ${successCount}, Errors: ${errorCount}`)

    return NextResponse.json({
      success: true,
      count: insertedItems.length,
      items: insertedItems,
      tagsInserted: allTagsToInsert.length,
    })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
