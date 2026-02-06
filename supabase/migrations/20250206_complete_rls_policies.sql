-- ============================================
-- COMPLETE RLS POLICY SETUP
-- Run this to ensure all policies are correct
-- ============================================

-- Enable RLS on all tables
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE rec_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rec_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_waitlist ENABLE ROW LEVEL SECURITY;

-- ============================================
-- DROP ALL EXISTING POLICIES (clean slate)
-- ============================================

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- ============================================
-- VENUES
-- ============================================
-- Anyone can read venues (for guest flow)
CREATE POLICY "venues_select_public" ON venues FOR SELECT USING (true);

-- Authenticated users can create venues
CREATE POLICY "venues_insert_authenticated" ON venues
  FOR INSERT TO authenticated WITH CHECK (true);

-- Owners can update their venue
CREATE POLICY "venues_update_owner" ON venues
  FOR UPDATE TO authenticated USING (
    id IN (SELECT venue_id FROM operator_users WHERE auth_user_id = auth.uid())
  );

-- ============================================
-- OPERATOR_USERS
-- ============================================
-- Users can read their own record
CREATE POLICY "operator_users_select_own" ON operator_users
  FOR SELECT TO authenticated USING (auth_user_id = auth.uid() OR email = auth.jwt()->>'email');

-- Users can insert their own record
CREATE POLICY "operator_users_insert_own" ON operator_users
  FOR INSERT TO authenticated WITH CHECK (auth_user_id = auth.uid());

-- ============================================
-- MENUS
-- ============================================
-- Anyone can read menus (for guest flow)
CREATE POLICY "menus_select_public" ON menus FOR SELECT USING (true);

-- Owners can insert menus
CREATE POLICY "menus_insert_owner" ON menus
  FOR INSERT TO authenticated WITH CHECK (
    venue_id IN (SELECT venue_id FROM operator_users WHERE auth_user_id = auth.uid())
  );

-- Owners can update menus
CREATE POLICY "menus_update_owner" ON menus
  FOR UPDATE TO authenticated USING (
    venue_id IN (SELECT venue_id FROM operator_users WHERE auth_user_id = auth.uid())
  );

-- ============================================
-- MENU_ITEMS
-- ============================================
-- Anyone can read menu items (for guest flow)
CREATE POLICY "menu_items_select_public" ON menu_items FOR SELECT USING (true);

-- Owners can insert items
CREATE POLICY "menu_items_insert_owner" ON menu_items
  FOR INSERT TO authenticated WITH CHECK (
    menu_id IN (
      SELECT m.id FROM menus m
      JOIN operator_users o ON m.venue_id = o.venue_id
      WHERE o.auth_user_id = auth.uid()
    )
  );

-- Owners can update items
CREATE POLICY "menu_items_update_owner" ON menu_items
  FOR UPDATE TO authenticated USING (
    menu_id IN (
      SELECT m.id FROM menus m
      JOIN operator_users o ON m.venue_id = o.venue_id
      WHERE o.auth_user_id = auth.uid()
    )
  );

-- Owners can delete items
CREATE POLICY "menu_items_delete_owner" ON menu_items
  FOR DELETE TO authenticated USING (
    menu_id IN (
      SELECT m.id FROM menus m
      JOIN operator_users o ON m.venue_id = o.venue_id
      WHERE o.auth_user_id = auth.uid()
    )
  );

-- ============================================
-- ITEM_TAGS
-- ============================================
-- Anyone can read tags (for guest flow)
CREATE POLICY "item_tags_select_public" ON item_tags FOR SELECT USING (true);

-- Authenticated can manage tags
CREATE POLICY "item_tags_insert_authenticated" ON item_tags
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "item_tags_update_authenticated" ON item_tags
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "item_tags_delete_authenticated" ON item_tags
  FOR DELETE TO authenticated USING (true);

-- ============================================
-- VENUE_SETTINGS
-- ============================================
-- Anyone can read settings (for guest flow upsell check)
CREATE POLICY "venue_settings_select_public" ON venue_settings FOR SELECT USING (true);

-- Owners can insert/update settings
CREATE POLICY "venue_settings_insert_owner" ON venue_settings
  FOR INSERT TO authenticated WITH CHECK (
    venue_id IN (SELECT venue_id FROM operator_users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "venue_settings_update_owner" ON venue_settings
  FOR UPDATE TO authenticated USING (
    venue_id IN (SELECT venue_id FROM operator_users WHERE auth_user_id = auth.uid())
  );

-- ============================================
-- REC_SESSIONS (guest + owner access)
-- ============================================
-- Anyone can read sessions
CREATE POLICY "rec_sessions_select_public" ON rec_sessions FOR SELECT USING (true);

-- Anyone can create sessions (anonymous guests)
CREATE POLICY "rec_sessions_insert_public" ON rec_sessions FOR INSERT WITH CHECK (true);

-- Anyone can update sessions (for adding intent_chips)
CREATE POLICY "rec_sessions_update_public" ON rec_sessions FOR UPDATE USING (true);

-- ============================================
-- REC_RESULTS
-- ============================================
-- Anyone can read results
CREATE POLICY "rec_results_select_public" ON rec_results FOR SELECT USING (true);

-- Anyone can create results
CREATE POLICY "rec_results_insert_public" ON rec_results FOR INSERT WITH CHECK (true);

-- ============================================
-- EVENTS
-- ============================================
-- Anyone can read events
CREATE POLICY "events_select_public" ON events FOR SELECT USING (true);

-- Anyone can create events (anonymous tracking)
CREATE POLICY "events_insert_public" ON events FOR INSERT WITH CHECK (true);

-- ============================================
-- SUBSCRIPTIONS
-- ============================================
-- Owners can read their subscription
CREATE POLICY "subscriptions_select_owner" ON subscriptions
  FOR SELECT TO authenticated USING (
    venue_id IN (SELECT venue_id FROM operator_users WHERE auth_user_id = auth.uid())
  );

-- Owners can insert subscription
CREATE POLICY "subscriptions_insert_owner" ON subscriptions
  FOR INSERT TO authenticated WITH CHECK (
    venue_id IN (SELECT venue_id FROM operator_users WHERE auth_user_id = auth.uid())
  );

-- ============================================
-- APP_WAITLIST
-- ============================================
-- Anyone can join waitlist
CREATE POLICY "app_waitlist_insert_public" ON app_waitlist FOR INSERT WITH CHECK (true);

-- Authenticated can read waitlist
CREATE POLICY "app_waitlist_select_authenticated" ON app_waitlist
  FOR SELECT TO authenticated USING (true);

-- ============================================
-- ENABLE REALTIME
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'rec_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE rec_sessions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE events;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'rec_results'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE rec_results;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
