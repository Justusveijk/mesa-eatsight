import { createClient } from '@/lib/supabase/client'

/**
 * Track an analytics event
 */
export async function trackEvent(
  venueId: string,
  sessionId: string | null,
  eventName: string,
  props: Record<string, unknown> = {}
): Promise<void> {
  try {
    const supabase = createClient()

    console.log('[Analytics] Tracking:', eventName, { venueId, sessionId, props })

    const { error } = await supabase
      .from('events')
      .insert({
        venue_id: venueId,
        session_id: sessionId,
        name: eventName,
        props: props,
        ts: new Date().toISOString()
      })

    if (error) {
      console.error('[Analytics] Failed to track event:', error.message)
    }
  } catch (err) {
    console.error('[Analytics] Error tracking event:', err)
  }
}

/**
 * Create a new recommendation session
 */
export async function createSession(
  venueId: string,
  userAgent?: string,
  tableRef?: string
): Promise<string | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('rec_sessions')
      .insert({
        venue_id: venueId,
        user_agent: userAgent || navigator?.userAgent || 'unknown',
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error) {
      console.error('[Analytics] Failed to create session:', error.message)
      return null
    }

    console.log('[Analytics] Session created:', data.id)

    // Track the scan event
    await trackEvent(venueId, data.id, EVENTS.SCAN, {
      source: 'qr_code',
      table_ref: tableRef,
      user_agent: userAgent || navigator?.userAgent,
    })

    return data.id
  } catch (err) {
    console.error('[Analytics] Error creating session:', err)
    return null
  }
}

/**
 * Save recommendation results
 */
export async function saveRecResults(
  sessionId: string,
  items: Array<{ id: string; score?: number }>
): Promise<void> {
  try {
    const supabase = createClient()

    const results = items.map((item, index) => ({
      session_id: sessionId,
      item_id: item.id,
      rank: index + 1,
      score: item.score || 0,
    }))

    const { error } = await supabase
      .from('rec_results')
      .insert(results)

    if (error) {
      console.error('[Analytics] Failed to save rec results:', error.message)
    } else {
      console.log('[Analytics] Saved', results.length, 'recommendation results')
    }
  } catch (err) {
    console.error('[Analytics] Error saving rec results:', err)
  }
}

/**
 * Update session with intent chips (preferences selected)
 */
export async function updateSessionIntents(
  sessionId: string,
  intentChips: string[]
): Promise<void> {
  try {
    const supabase = createClient()

    const { error } = await supabase
      .from('rec_sessions')
      .update({ intent_chips: intentChips })
      .eq('id', sessionId)

    if (error) {
      console.error('[Analytics] Failed to update session intents:', error.message)
    }
  } catch (err) {
    console.error('[Analytics] Error updating session intents:', err)
  }
}

// Event name constants
export const EVENTS = {
  // Guest flow events
  SCAN: 'scan',
  FLOW_STARTED: 'flow_started',
  QUESTION_ANSWERED: 'question_answered',
  RECOMMENDATIONS_SHOWN: 'recommendations_shown',
  ITEM_CLICKED: 'rec_clicked', // Keep as rec_clicked for backwards compatibility
  ITEM_EXPANDED: 'item_expanded',
  FLOW_COMPLETED: 'flow_completed',
  FLOW_ABANDONED: 'flow_abandoned',

  // Menu events
  MENU_PUBLISHED: 'menu_published',
  ITEM_ADDED: 'item_added',
  ITEM_UPDATED: 'item_updated',
  ITEM_DELETED: 'item_deleted',
} as const

export type EventName = typeof EVENTS[keyof typeof EVENTS]
