-- ==========================================
-- USER PROFILES RLS POLICIES
-- Allow users to see their own profile + admins to see all
-- ==========================================

-- Enable RLS if not already enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can view their own profile + founders can view all
DROP POLICY IF EXISTS "user_profiles_select" ON user_profiles;
CREATE POLICY "user_profiles_select" ON user_profiles
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR auth.uid() IN (
      SELECT user_id FROM user_profiles WHERE caua_role = 'founder'
    )
  );

-- INSERT: Only system can create profiles (via auth trigger)
DROP POLICY IF EXISTS "user_profiles_insert" ON user_profiles;
CREATE POLICY "user_profiles_insert" ON user_profiles
  FOR INSERT
  WITH CHECK (true);

-- UPDATE: Users can update their own profile, founders can update anyone's
DROP POLICY IF EXISTS "user_profiles_update" ON user_profiles;
CREATE POLICY "user_profiles_update" ON user_profiles
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR auth.uid() IN (
      SELECT user_id FROM user_profiles WHERE caua_role = 'founder'
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR auth.uid() IN (
      SELECT user_id FROM user_profiles WHERE caua_role = 'founder'
    )
  );

-- DELETE: Only system can delete
DROP POLICY IF EXISTS "user_profiles_delete" ON user_profiles;
CREATE POLICY "user_profiles_delete" ON user_profiles
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_profiles WHERE caua_role = 'founder'
    )
  );

-- ==========================================
-- Indexes for performance
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_caua_role ON user_profiles(caua_role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
