-- ═══════════════════════════════════════════════════════════════════
-- CAUA Corporation — Tree Death + Forfeit
-- Migration 036 · Real-Tamagotchi death mechanic backend
-- ═══════════════════════════════════════════════════════════════════
--
-- Adds the columns + token_events event_type needed for the death loop:
--
--   cacao_trees.died_at      → set when the tree forfeit fires
--   cacao_trees.harvested_at → set when the user successfully harvests
--                              (so isTreeDead can be definitive — no more
--                              client-side guessing about harvest state)
--
--   token_events.event_type now accepts:
--     'tree_adoption', 'tree_update_read', 'tree_harvest_share',
--     'tree_death_burn'  ← negative amounts that zero-out unredeemed tokens
--                          when a tree dies (Coinbase-onramp compliant: we
--                          don't retain the tokens, we burn them in-ledger).
--
-- Run after 035 lands. Idempotent: ADD COLUMN IF NOT EXISTS, drop+create
-- the check constraint with the full new list.

-- ── Columns ────────────────────────────────────────────────────────
alter table cacao_trees
  add column if not exists died_at      timestamptz,
  add column if not exists harvested_at timestamptz;

-- Index for the dashboard sweep that lists at-risk / dead trees.
create index if not exists idx_cacao_trees_died_at      on cacao_trees(died_at);
create index if not exists idx_cacao_trees_harvested_at on cacao_trees(harvested_at);

-- ── token_events.event_type — extend the check constraint ──────────
-- Migration 010 set the original list; later award-tokens deploys silently
-- broadened the runtime allowlist. We pin all currently-used types here so
-- a `tree_death_burn` insert isn't rejected by the constraint.
alter table token_events
  drop constraint if exists token_events_event_type_check;

alter table token_events
  add constraint token_events_event_type_check check (
    event_type in (
      'ritual_draw', 'streak_7', 'streak_30',
      'purchase', 'lot',
      'blog_share', 'blog_read',
      'referral',
      'tree_adoption', 'tree_update_read', 'tree_harvest_share',
      'tree_death_burn'
    )
  );

-- ── Helper view — outstanding token balance per tree ──────────────
-- Used by the tree-death-forfeit Edge Function to compute how much to burn.
-- Sums ALL token_events with ref_id pointing to a tree id (text-cast match,
-- since ref_id is text and id is uuid).
create or replace view tree_token_ledger as
select
  ct.id              as tree_id,
  ct.user_id         as user_id,
  coalesce(sum(te.beans),    0) as beans_total,
  coalesce(sum(te.mazorcas), 0) as mazorcas_total
from cacao_trees ct
left join token_events te on te.ref_id = ct.id::text
group by ct.id, ct.user_id;

comment on view tree_token_ledger is
  'Per-tree net beans+mazorcas (sums positive earnings + negative burns). '
  'tree-death-forfeit uses this to compute the burn amount before inserting '
  'the negative tree_death_burn token_event.';
