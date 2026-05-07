-- Fix recursive RLS on user_profiles_select.
-- The previous policy had `auth.uid() IN (SELECT user_id FROM user_profiles
-- WHERE caua_role='founder')` which self-references user_profiles. Under RLS
-- the subquery is filtered by the same SELECT policy, so it only returns the
-- caller's own row → founders saw 0 admin rows.
-- Fix: delegate to SECURITY DEFINER helper `is_founder_cached(uuid)` which
-- bypasses RLS for the role lookup. Same helper already used by cacao_trees.

DROP POLICY IF EXISTS user_profiles_select ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_update ON public.user_profiles;
DROP POLICY IF EXISTS user_profiles_delete ON public.user_profiles;

CREATE POLICY user_profiles_select ON public.user_profiles
  FOR SELECT
  USING (
    (select auth.uid()) = user_id
    OR public.is_founder_cached((select auth.uid()))
  );

CREATE POLICY user_profiles_update ON public.user_profiles
  FOR UPDATE
  USING (
    (select auth.uid()) = user_id
    OR public.is_founder_cached((select auth.uid()))
  )
  WITH CHECK (
    (select auth.uid()) = user_id
    OR public.is_founder_cached((select auth.uid()))
  );

CREATE POLICY user_profiles_delete ON public.user_profiles
  FOR DELETE
  USING (public.is_founder_cached((select auth.uid())));
