-- App waitlist table for Mesa guest app pre-signup
CREATE TABLE IF NOT EXISTS app_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE app_waitlist ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anyone (anonymous signups)
CREATE POLICY "Anyone can join waitlist" ON app_waitlist FOR INSERT WITH CHECK (true);

-- Only authenticated users can read
CREATE POLICY "Authenticated users can read waitlist" ON app_waitlist FOR SELECT USING (auth.role() = 'authenticated');
