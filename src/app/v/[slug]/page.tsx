import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { VenueFlow } from './VenueFlow'

interface Venue {
  id: string
  name: string
  slug: string
}

export default async function VenuePage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ t?: string }>
}) {
  const { slug } = await params
  const { t: tableRef } = await searchParams

  const supabase = await createClient()

  // Fetch venue by slug
  const { data: venue, error } = await supabase
    .from('venues')
    .select('id, name, slug')
    .eq('slug', slug)
    .single()

  if (error || !venue) {
    notFound()
  }

  return (
    <VenueFlow
      venue={venue as Venue}
      tableRef={tableRef ?? null}
    />
  )
}
