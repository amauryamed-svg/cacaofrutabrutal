-- ==========================================
-- RLS Testing Script for Phase F
-- Run these tests in Supabase SQL Editor
-- ==========================================

-- ==========================================
-- SETUP: Create test users
-- ==========================================
-- Note: Run these with a logged-in user first, then switch to test

-- INSERT test user 1 (regular user)
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
VALUES (
  'test-user-1'::uuid,
  'user1@test.com',
  now(),
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_profiles (user_id, email, full_name, caua_role, locale, region, created_at)
VALUES (
  'test-user-1'::uuid,
  'user1@test.com',
  'Test User 1',
  'creyente',
  'es',
  'CO',
  now()
)
ON CONFLICT (user_id) DO NOTHING;

-- INSERT test user 2 (founder for blog)
INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
VALUES (
  'test-founder-1'::uuid,
  'founder@test.com',
  now(),
  now(),
  now()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_profiles (user_id, email, full_name, caua_role, locale, region, created_at)
VALUES (
  'test-founder-1'::uuid,
  'founder@test.com',
  'Test Founder',
  'founder',
  'es',
  'CO',
  now()
)
ON CONFLICT (user_id) DO NOTHING;

-- ==========================================
-- TEST 1: BLOG POSTS RLS
-- ==========================================

-- As authenticated user (non-founder), should see published posts only
SET LOCAL role authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"test-user-1"}';

SELECT * FROM blog_posts WHERE published = true;
-- ✓ Should see published posts

-- Try to insert (should FAIL - not a farmer/founder)
INSERT INTO blog_posts (slug, title, author_name, author_role, body_md, published)
VALUES ('test-slug', 'Test Post', 'Test', 'founder', 'Content', true);
-- ✗ Should error: policy violation

-- Reset role
RESET role;

-- As founder, should be able to insert
SET LOCAL role authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"test-founder-1"}';

INSERT INTO blog_posts (slug, title, author_name, author_role, body_md, published)
VALUES ('founder-test-slug', 'Founder Post', 'Test Founder', 'founder', 'Test content', true);
-- ✓ Should succeed

RESET role;

-- ==========================================
-- TEST 2: EMAIL LOG RLS
-- ==========================================

-- Test user 1 can only view their own emails
SET LOCAL role authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"test-user-1"}';

-- Insert email for user 1
INSERT INTO email_log (user_id, email, type, subject, status)
VALUES ('test-user-1'::uuid, 'user1@test.com', 'payment_confirmed', 'Pago confirmado', 'sent');

-- Insert email for user 2 (simulate system inserting)
RESET role;
INSERT INTO email_log (user_id, email, type, subject, status)
VALUES ('test-founder-1'::uuid, 'founder@test.com', 'order_created', 'Orden creada', 'sent');

-- Now test as user 1 - should only see their own email
SET LOCAL role authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"test-user-1"}';

SELECT email, type, subject FROM email_log;
-- ✓ Should only see 1 row (user1@test.com)

-- Try to see founder's email (should be filtered by RLS)
SELECT email FROM email_log WHERE email = 'founder@test.com';
-- ✗ Should return empty

RESET role;

-- Test as founder - should see all emails (admin access)
SET LOCAL role authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"test-founder-1"}';

SELECT email, type FROM email_log;
-- ✓ Should see both emails (founder has admin access)

RESET role;

-- ==========================================
-- TEST 3: TOKEN EVENTS RLS
-- ==========================================

-- Insert token events for users
INSERT INTO token_events (user_id, event_type, beans, mazorcas)
VALUES ('test-user-1'::uuid, 'ritual_draw', 0.5, 0);

INSERT INTO token_events (user_id, event_type, beans, mazorcas)
VALUES ('test-founder-1'::uuid, 'ritual_draw', 0.5, 0);

-- Test as user 1 - should only see own events
SET LOCAL role authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"test-user-1"}';

SELECT user_id, event_type, beans FROM token_events;
-- ✓ Should only see 1 row

-- Test as user 2 - should only see own events
SET LOCAL role authenticated;
SET LOCAL "request.jwt.claims" = '{"sub":"test-founder-1"}';

SELECT user_id, event_type, beans FROM token_events;
-- ✓ Should only see 1 row

RESET role;

-- ==========================================
-- TEST 4: LEAD SCORE UPDATES IN ADMIN
-- ==========================================

-- Update lead_score (admin function would do this)
UPDATE user_profiles
SET lead_score = 3
WHERE user_id = 'test-user-1'::uuid;

-- Verify update worked
SELECT user_id, lead_score FROM user_profiles WHERE user_id = 'test-user-1'::uuid;
-- ✓ Should show lead_score = 3

-- ==========================================
-- CLEANUP (optional)
-- ==========================================
-- DELETE FROM blog_posts WHERE slug LIKE 'test-%' OR slug LIKE 'founder-%';
-- DELETE FROM email_log WHERE email LIKE '%@test.com';
-- DELETE FROM token_events WHERE user_id IN ('test-user-1'::uuid, 'test-founder-1'::uuid);
-- DELETE FROM user_profiles WHERE email LIKE '%@test.com';
-- DELETE FROM auth.users WHERE email LIKE '%@test.com';
