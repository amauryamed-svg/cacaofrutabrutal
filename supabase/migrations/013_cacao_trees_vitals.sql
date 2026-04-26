-- Migration 011: Add health/moisture/sunlight vitals + tree_updates INSERT policy

ALTER TABLE cacao_trees
  ADD COLUMN IF NOT EXISTS health   int NOT NULL DEFAULT 80 CHECK (health   BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS moisture int NOT NULL DEFAULT 70 CHECK (moisture BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS sunlight int NOT NULL DEFAULT 60 CHECK (sunlight BETWEEN 0 AND 100);

-- Users can insert updates for trees they own
DROP POLICY IF EXISTS "updates_owner_insert" ON tree_updates;
CREATE POLICY "updates_owner_insert" ON tree_updates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM cacao_trees
      WHERE cacao_trees.id   = tree_updates.tree_id
        AND cacao_trees.user_id = (SELECT auth.uid())
    )
  );
