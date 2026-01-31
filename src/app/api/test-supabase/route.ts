import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        error: 'Missing env vars',
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Test connection by counting venues
    const { count, error } = await supabase
      .from('venues')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      success: true,
      supabaseUrl: supabaseUrl.substring(0, 30) + '...',
      connectionTest: error ? error.message : 'OK',
      venueCount: count,
    })
  } catch (err) {
    return NextResponse.json({
      error: 'Exception',
      message: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 })
  }
}
