-- ==========================================
-- Phase A-F: Blog, Tokens, CRM, Payment Emails
-- ==========================================

-- ==========================================
-- 1. BLOG POSTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  author_name text NOT NULL,
  author_role text NOT NULL CHECK (author_role IN ('founder', 'farmer', 'nativo')),
  author_bio text,
  title text NOT NULL,
  subtitle text,
  body_md text NOT NULL,
  cover_emoji text DEFAULT '🫘',
  tags text[] DEFAULT '{}',
  linked_tech text,
  linked_product_ids int[] DEFAULT '{}',
  published boolean NOT NULL DEFAULT true,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Blog posts are public read
CREATE POLICY "blog_posts_public_read" ON blog_posts
  FOR SELECT
  USING (published = true);

-- Only farmers and founders can insert
CREATE POLICY "blog_posts_insert" ON blog_posts
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM user_profiles
      WHERE caua_role IN ('farmer', 'founder')
    )
  );

CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at DESC);

-- ==========================================
-- 2. USER PROFILES EXTENSIONS
-- ==========================================
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS lead_score int DEFAULT 1 CHECK (lead_score BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS beans_balance numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mazorcas_balance numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS beans_lifetime numeric(10,2) NOT NULL DEFAULT 0;

-- Remove colono from enum constraint if it exists
ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_caua_role_check;

ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_caua_role_check
  CHECK (caua_role IN ('founder', 'farmer', 'investor', 'creyente', 'nativo'));

CREATE INDEX IF NOT EXISTS idx_user_profiles_lead_score ON user_profiles(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_beans_balance ON user_profiles(beans_balance DESC);

-- ==========================================
-- 3. TOKEN EVENTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS token_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('ritual_draw', 'streak_7', 'streak_30', 'purchase', 'lot', 'blog_share', 'blog_read', 'referral')),
  beans numeric(10,2) NOT NULL DEFAULT 0,
  mazorcas numeric(10,2) NOT NULL DEFAULT 0,
  ref_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE token_events ENABLE ROW LEVEL SECURITY;

-- Users can only view their own token events
CREATE POLICY "token_events_view_own" ON token_events
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_token_events_user_id ON token_events(user_id);
CREATE INDEX idx_token_events_created_at ON token_events(created_at DESC);

-- ==========================================
-- 4. EMAIL LOG TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  type text NOT NULL CHECK (type IN ('order_created', 'payment_confirmed', 'recovery', 'confirmation')),
  subject text,
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced')),
  resend_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

-- CRM admins can view all emails, users can view their own
CREATE POLICY "email_log_select" ON email_log
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR auth.uid() IN (
      SELECT user_id FROM user_profiles
      WHERE caua_role IN ('founder', 'investor')
    )
  );

-- Only system can insert (via edge functions)
CREATE POLICY "email_log_insert" ON email_log
  FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_email_log_user_id ON email_log(user_id);
CREATE INDEX idx_email_log_email ON email_log(email);
CREATE INDEX idx_email_log_created_at ON email_log(created_at DESC);

-- ==========================================
-- 5. UPDATE ROLE ENUM IN ORIGINAL CONSTRAINT
-- ==========================================
-- This ensures colono is removed from any existing check constraints
-- Run this if you have an existing constraint:
-- ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_caua_role_check;
-- ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_caua_role_check
--   CHECK (caua_role IN ('founder', 'farmer', 'investor', 'creyente', 'nativo'));
