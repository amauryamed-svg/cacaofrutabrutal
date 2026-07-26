// Public ERC-721 metadata endpoint. Receives ?tokenId=N, returns JSON.
//
// Birth certificate (immutable) is stored at metadata_ipfs_cid (Pinata) and referenced
// from the JSON via `image` and `external_url`. Game state (mutable) — stage, vitals,
// rarity score, care streak — is composed live from cacao_trees + token_events.
//
// OpenSea/Zora call this endpoint per token; we cache 60s server-side.

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const supabaseUrl        = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const contractAddress    = (Deno.env.get('CACAO_TREE_NFT_ADDRESS') ?? '').toLowerCase()
const chainId            = Number(Deno.env.get('WEB3_CHAIN_ID') ?? '8453')
const publicSiteOrigin   = Deno.env.get('PUBLIC_SITE_ORIGIN') ?? 'https://cacaofrutabrutal.com'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const GUARDIAN_NAMES = ['Lucho · Huila', 'Marta · Arauca', 'Rafael · Cundinamarca', 'Fernando · Meta', 'Ricardo · Santander']

// Mirror of growthSystem.ts thresholds (hours).
const STAGE_HOURS: Array<{ name: string; threshold: number }> = [
  { name: 'Siembra',      threshold: 0     },
  { name: 'Germinación',  threshold: 0.6   },
  { name: 'Plántula',     threshold: 1.2   },
  { name: 'Crecimiento',  threshold: 2     },
  { name: 'Desarrollo',   threshold: 2.8   },
  { name: 'Floración',    threshold: 3.5   },
  { name: 'Formación',    threshold: 4     },
  { name: 'Maduración',   threshold: 4.6   },
]

function stageNameForElapsedHours(hours: number): string {
  let current = STAGE_HOURS[0].name
  for (const s of STAGE_HOURS) if (hours >= s.threshold) current = s.name
  return current
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    },
  })
}

serve(async (req) => {
  const url = new URL(req.url)
  const tokenIdRaw = url.searchParams.get('tokenId')
  if (!tokenIdRaw) return jsonResponse({ error: 'missing_tokenId' }, 400)

  const tokenId = Number(tokenIdRaw)
  if (!Number.isFinite(tokenId) || tokenId < 1) {
    return jsonResponse({ error: 'invalid_tokenId' }, 400)
  }

  const { data: tree } = await supabase
    .from('cacao_trees')
    .select('id, guardian_id, region, variety, stage, adopted_at, health, moisture, sunlight, co2_kg, adoption_season, metadata_ipfs_cid, owner_wallet')
    .eq('nft_token_id', tokenId)
    .eq('nft_contract', contractAddress)
    .eq('nft_chain_id', chainId)
    .maybeSingle()

  if (!tree) return jsonResponse({ error: 'token_not_found' }, 404)

  const adoptedAt    = new Date(tree.adopted_at).getTime()
  const elapsedHours = (Date.now() - adoptedAt) / 3_600_000
  const stage        = stageNameForElapsedHours(elapsedHours)
  const guardianName = GUARDIAN_NAMES[tree.guardian_id] ?? `Guardian ${tree.guardian_id}`

  // Light rarity score — better health + further along stage = rarer.
  const stageIndex = Math.max(0, STAGE_HOURS.findIndex(s => s.name === stage))
  const rarityScore = Math.round(
    (tree.health ?? 80) * 2
    + (tree.moisture ?? 70)
    + (tree.sunlight ?? 60)
    + stageIndex * 50
  )

  const ipfsImage = tree.metadata_ipfs_cid
    ? `ipfs://${tree.metadata_ipfs_cid}`
    : `${publicSiteOrigin}/og-tree-default.png`

  return jsonResponse({
    name: `Cacao Tree #${String(tokenId).padStart(5, '0')} — ${guardianName}`,
    description:
      `An on-chain twin of a real cacao tree adopted on CauaCorp. ` +
      `Variety: ${tree.variety}. Guardian: ${guardianName}. ` +
      `Care actions update this metadata via ERC-4906. ` +
      `Read the Charter at ${publicSiteOrigin}/docs/CHARTER.md.`,
    image: ipfsImage,
    external_url: `${publicSiteOrigin}/app/tree/${tree.id}`,
    attributes: [
      { trait_type: 'Stage',         value: stage },
      { trait_type: 'Variety',       value: tree.variety },
      { trait_type: 'Guardian',      value: guardianName },
      { trait_type: 'Region',        value: tree.region },
      { trait_type: 'Health',        value: tree.health,   max_value: 100 },
      { trait_type: 'Moisture',      value: tree.moisture, max_value: 100 },
      { trait_type: 'Sunlight',      value: tree.sunlight, max_value: 100 },
      { trait_type: 'CO₂ sequestered (kg)', value: Number(tree.co2_kg ?? 0) },
      { trait_type: 'Rarity score',         value: rarityScore },
      { trait_type: 'Adoption Season',      value: (tree as { adoption_season?: string | null }).adoption_season ?? 'floracion' },
    ],
  })
})
