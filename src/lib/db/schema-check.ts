// Schema verification - run this to check database health
// Usage: Import and call verifySchema() from a server component or API route

export const REQUIRED_TABLES = {
  venues: [
    'id', 'slug', 'name', 'address', 'country', 'city', 'timezone',
    'currency', 'primary_language', 'category', 'phone', 'website',
    'vat_number', 'logo_url', 'created_at'
  ],
  operator_users: [
    'id', 'email', 'role', 'venue_id', 'auth_user_id', 'created_at'
  ],
  subscriptions: [
    'id', 'venue_id', 'stripe_customer_id', 'stripe_subscription_id',
    'status', 'plan', 'price_effective', 'trial_ends_at',
    'current_period_end', 'created_at'
  ],
  menus: [
    'id', 'venue_id', 'version', 'status', 'published_at', 'created_at'
  ],
  menu_items: [
    'id', 'menu_id', 'name', 'description', 'price', 'category', 'type',
    'is_available', 'is_push', 'push_weight', 'is_out_of_stock',
    'stock_status', 'popularity_score', 'created_at'
  ],
  item_tags: ['id', 'item_id', 'tag'],
  venue_settings: [
    'id', 'venue_id', 'upsell_enabled', 'upsell_mode',
    'upsell_items', 'upsell_rules', 'created_at'
  ],
  rec_sessions: [
    'id', 'venue_id', 'started_at', 'table_ref', 'user_agent',
    'intent_chips', 'constraints'
  ],
  rec_results: [
    'id', 'session_id', 'item_id', 'rank', 'score', 'reason', 'created_at'
  ],
  events: [
    'id', 'venue_id', 'session_id', 'name', 'ts', 'props'
  ],
  app_waitlist: [
    'id', 'email', 'source', 'venue_slug', 'created_at'
  ],
} as const

export type TableName = keyof typeof REQUIRED_TABLES

export interface SchemaCheckResult {
  table: string
  exists: boolean
  missingColumns: string[]
  error?: string
}

export async function verifySchema(supabase: any): Promise<{
  success: boolean
  results: SchemaCheckResult[]
}> {
  const results: SchemaCheckResult[] = []

  for (const [tableName, requiredColumns] of Object.entries(REQUIRED_TABLES)) {
    try {
      // Try to select from the table to verify it exists
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0)

      if (error) {
        results.push({
          table: tableName,
          exists: false,
          missingColumns: requiredColumns as unknown as string[],
          error: error.message,
        })
        continue
      }

      // Table exists - we can't easily check columns without direct SQL access
      // but at least we know the table is there
      results.push({
        table: tableName,
        exists: true,
        missingColumns: [],
      })
    } catch (err) {
      results.push({
        table: tableName,
        exists: false,
        missingColumns: requiredColumns as unknown as string[],
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  const success = results.every(r => r.exists)
  return { success, results }
}

// SQL to create missing tables (for reference)
export const CREATE_TABLES_SQL = `
-- Venues table
CREATE TABLE IF NOT EXISTS venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  country TEXT DEFAULT 'Netherlands',
  city TEXT,
  postal_code TEXT,
  timezone TEXT DEFAULT 'Europe/Amsterdam',
  currency TEXT DEFAULT 'EUR',
  primary_language TEXT DEFAULT 'en',
  category TEXT,
  cuisine_type TEXT,
  phone TEXT,
  website TEXT,
  vat_number TEXT,
  logo_url TEXT,
  google_place_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Operator users (links auth.users to venues)
CREATE TABLE IF NOT EXISTS operator_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'owner',
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(auth_user_id, venue_id)
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'trialing',
  plan TEXT DEFAULT 'monthly',
  price_effective INTEGER,
  trial_ends_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menus
CREATE TABLE IF NOT EXISTS menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu items
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  category TEXT,
  type TEXT DEFAULT 'food',
  is_available BOOLEAN DEFAULT true,
  is_push BOOLEAN DEFAULT false,
  push_weight INTEGER DEFAULT 0,
  is_out_of_stock BOOLEAN DEFAULT false,
  stock_status TEXT DEFAULT 'in_stock',
  popularity_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Item tags (for taxonomy)
CREATE TABLE IF NOT EXISTS item_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  UNIQUE(item_id, tag)
);

-- Venue settings
CREATE TABLE IF NOT EXISTS venue_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  upsell_enabled BOOLEAN DEFAULT false,
  upsell_mode TEXT DEFAULT 'auto',
  upsell_items JSONB,
  upsell_rules JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(venue_id)
);

-- Recommendation sessions
CREATE TABLE IF NOT EXISTS rec_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  table_ref TEXT,
  user_agent TEXT,
  intent_chips TEXT[],
  constraints TEXT[]
);

-- Recommendation results
CREATE TABLE IF NOT EXISTS rec_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES rec_sessions(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  score DECIMAL(5,2),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events (analytics)
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  session_id UUID REFERENCES rec_sessions(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  ts TIMESTAMPTZ DEFAULT NOW(),
  props JSONB DEFAULT '{}'
);

-- App waitlist
CREATE TABLE IF NOT EXISTS app_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  source TEXT,
  venue_slug TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`
