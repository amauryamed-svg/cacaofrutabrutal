-- 052_seasonal_system.sql
-- Adds seasonal columns to cacao_trees for the CacaoGotchi seasonal mini-game system.
-- Season IDs match src/utils/seasonSystem.ts CacaoSeason union type.

ALTER TABLE cacao_trees
  ADD COLUMN IF NOT EXISTS adoption_season text
    CHECK (adoption_season IN ('floracion','mitaca','traviesa','cosecha_mayor')),
  ADD COLUMN IF NOT EXISTS minigame_last_completed_season text
    CHECK (minigame_last_completed_season IN ('floracion','mitaca','traviesa','cosecha_mayor')),
  ADD COLUMN IF NOT EXISTS minigame_last_completed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_cacao_trees_adoption_season
  ON cacao_trees (adoption_season);

COMMENT ON COLUMN cacao_trees.adoption_season
  IS 'Colombian cacao season at time of adoption: floracion (Jan-Mar), mitaca (Apr-Jun), traviesa (Jul-Sep), cosecha_mayor (Oct-Dec)';

COMMENT ON COLUMN cacao_trees.minigame_last_completed_season
  IS 'Last seasonal mini-game completed by the user for this tree';

COMMENT ON COLUMN cacao_trees.minigame_last_completed_at
  IS 'Timestamp of the last seasonal mini-game completion';
