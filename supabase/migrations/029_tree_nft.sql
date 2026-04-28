-- 029 — On-chain NFT binding for cacao_trees
-- Phase 3 of the Web3 transformation. See docs/WEB3.md.
-- Adds NFT token id, contract address, mint tx, owner wallet, and IPFS metadata cid
-- columns to cacao_trees so each tree row references its on-chain twin.

alter table public.cacao_trees
  add column if not exists nft_token_id      bigint,
  add column if not exists nft_contract      text,
  add column if not exists nft_chain_id      integer,
  add column if not exists nft_mint_tx       text,
  add column if not exists nft_minted_at     timestamptz,
  add column if not exists owner_wallet      text,   -- last seen owner from Alchemy webhook
  add column if not exists metadata_ipfs_cid text;   -- pinned birth-cert CID

create unique index if not exists uniq_cacao_trees_nft
  on public.cacao_trees (nft_chain_id, nft_contract, nft_token_id)
  where nft_token_id is not null;

create index if not exists idx_cacao_trees_owner_wallet
  on public.cacao_trees (lower(owner_wallet))
  where owner_wallet is not null;

-- Tree mint audit log — append-only.
create table if not exists public.tree_mints (
  id              uuid primary key default gen_random_uuid(),
  tree_id         uuid not null references public.cacao_trees(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  wallet_address  text not null,
  chain_id        integer not null,
  contract        text not null,
  tx_hash         text,
  status          text not null default 'pending'
                   check (status in ('pending','submitted','confirmed','failed')),
  error_message   text,
  created_at      timestamptz not null default now(),
  confirmed_at    timestamptz
);

create index if not exists idx_tree_mints_tree_id on public.tree_mints (tree_id);
create index if not exists idx_tree_mints_user    on public.tree_mints (user_id);
create index if not exists idx_tree_mints_status  on public.tree_mints (status);

alter table public.tree_mints enable row level security;

drop policy if exists "user_reads_own_mints" on public.tree_mints;
create policy "user_reads_own_mints" on public.tree_mints
  for select using (
    user_id = (select auth.uid())
    or (select auth.uid()) in (
      select user_id from public.user_profiles where caua_role = 'founder'
    )
  );

-- Comments for future maintainers
comment on column public.cacao_trees.nft_token_id is
  'On-chain ERC-721 tokenId. Populated by alchemy-nft-webhook when Transfer is observed.';
comment on column public.cacao_trees.nft_contract is
  'ERC-721 contract address (lowercase). Currently CacaoTreeNFT on Base.';
comment on column public.cacao_trees.nft_chain_id is
  'EIP-155 chain id. 8453=Base mainnet, 84532=Base Sepolia.';
comment on column public.cacao_trees.owner_wallet is
  'Last observed owner from Alchemy Transfer events. Authoritative on-chain owner.';
comment on column public.cacao_trees.metadata_ipfs_cid is
  'Pinata IPFS CID of the immutable birth certificate JSON.';
comment on table public.tree_mints is
  'Audit log of mint requests submitted via the relayer. See supabase/functions/mint-tree-nft.';
