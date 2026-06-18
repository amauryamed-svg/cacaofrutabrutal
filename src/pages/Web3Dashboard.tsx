import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BRAND, FONTS, ACTIVE_CHAIN_ID, BASE_CHAIN_ID } from '../utils/constants'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

interface WalletProfile {
  wallet_address: string | null
  wallet_chain_id: number | null
  beans_balance: number
  mazorcas_balance: number
}

interface MintedTree {
  id: string
  guardian_id: number
  variety: string
  nft_token_id: number | null
  nft_contract: string | null
  nft_chain_id: number | null
  nft_mint_tx: string | null
  nft_minted_at: string | null
}

const GUARDIAN_NAMES: Record<number, string> = {
  1: 'Lucho · Huila',
  2: 'Ricardo · Santander',
  3: 'Fernando · Meta',
  4: 'Marta · Arauca',
  5: 'Rafael · Cundinamarca',
}

function addrShort(addr: string) {
  return `${addr.slice(0, 6)}···${addr.slice(-4)}`
}

function chainLabel(id: number | null) {
  if (id === 8453) return 'Base'
  if (id === 84532) return 'Base Sepolia'
  return `Chain ${id ?? '?'}`
}

function explorerTx(tx: string, chainId: number | null) {
  const base = chainId === 8453 ? 'https://basescan.org' : 'https://sepolia.basescan.org'
  return `${base}/tx/${tx}`
}

export default function Web3Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<WalletProfile | null>(null)
  const [trees, setTrees] = useState<MintedTree[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    async function load() {
      const [{ data: prof }, { data: mintedTrees }] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('wallet_address, wallet_chain_id, beans_balance, mazorcas_balance')
          .eq('user_id', user!)
          .maybeSingle(),
        supabase
          .from('cacao_trees')
          .select('id, guardian_id, variety, nft_token_id, nft_contract, nft_chain_id, nft_mint_tx, nft_minted_at')
          .eq('user_id', user!)
          .not('nft_mint_tx', 'is', null)
          .order('nft_minted_at', { ascending: false }),
      ])
      setProfile(prof as WalletProfile | null)
      setTrees((mintedTrees ?? []) as MintedTree[])
      setLoading(false)
    }
    load()
  }, [user])

  const isTestnet = (ACTIVE_CHAIN_ID as number) !== BASE_CHAIN_ID

  return (
    <>
      <div style={{
        background: BRAND.bgDeep, minHeight: '100vh',
        padding: '80px 16px 48px',
        fontFamily: FONTS.body,
      }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{
              fontFamily: FONTS.display, fontSize: 11, letterSpacing: '0.2em',
              color: `${BRAND.heirloom}55`, textTransform: 'uppercase', marginBottom: 6,
            }}>
              WEB3 / ASSETS
            </div>
            <h1 style={{
              fontFamily: FONTS.display, fontSize: 28, fontWeight: 900,
              color: BRAND.heirloom, margin: 0, letterSpacing: '0.04em',
            }}>
              MIS ACTIVOS DIGITALES
            </h1>
            {isTestnet && (
              <div style={{
                marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 10px', borderRadius: 999,
                background: `${BRAND.mazorca}22`, border: `1px solid ${BRAND.mazorca}44`,
                fontSize: 10, fontFamily: FONTS.display, letterSpacing: '0.1em',
                color: BRAND.mazorca,
              }}>
                TESTNET · Base Sepolia
              </div>
            )}
          </div>

          {loading ? (
            <div style={{ color: `${BRAND.heirloom}55`, fontSize: 14 }}>Cargando...</div>
          ) : (
            <>
              {/* Wallet */}
              <div style={card}>
                <div style={sectionLabel}>WALLET</div>
                {profile?.wallet_address ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{
                      padding: '6px 14px', borderRadius: 999,
                      background: `${BRAND.heroic}18`, border: `1px solid ${BRAND.heroic}55`,
                      fontFamily: 'monospace', fontSize: 13, color: BRAND.heroic,
                    }}>
                      {addrShort(profile.wallet_address)}
                    </div>
                    <span style={{
                      fontSize: 11, fontFamily: FONTS.display, letterSpacing: '0.1em',
                      color: `${BRAND.heirloom}55`,
                    }}>
                      {chainLabel(profile.wallet_chain_id)}
                    </span>
                    <button
                      onClick={() => navigate('/web3/onboarding')}
                      style={{
                        background: 'none', border: `1px solid ${BRAND.amazon}66`,
                        color: `${BRAND.heirloom}55`, padding: '3px 10px',
                        borderRadius: 999, cursor: 'pointer',
                        fontSize: 10, fontFamily: FONTS.display, letterSpacing: '0.1em',
                      }}
                    >
                      cambiar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => navigate('/web3/onboarding')}
                    style={{
                      background: BRAND.heroic, color: BRAND.bgDeep,
                      border: 'none', padding: '10px 20px',
                      fontFamily: FONTS.display, fontSize: 13,
                      letterSpacing: '0.12em', cursor: 'pointer',
                      textTransform: 'uppercase', fontWeight: 900,
                    }}
                  >
                    CONECTAR WALLET →
                  </button>
                )}
              </div>

              {/* Token balances */}
              <div style={{ ...card, marginTop: 12 }}>
                <div style={sectionLabel}>TOKENS</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                  {[
                    { icon: '🌱', label: 'BEANS',    value: profile?.beans_balance?.toFixed(1) ?? '0', color: BRAND.pod },
                    { icon: '🫘', label: 'MAZORCAS', value: profile?.mazorcas_balance?.toFixed(0) ?? '0', color: BRAND.mazorca },
                    { icon: '◈',  label: '$CACAO',   value: '—', color: `${BRAND.heroic}88`, note: 'Phase 5' },
                    { icon: '⬡',  label: 'NIBS',     value: '—', color: `${BRAND.criollo}88`, note: 'Phase 6' },
                  ].map(({ icon, label, value, color, note }) => (
                    <div key={label} style={{
                      background: `${BRAND.amazon}55`,
                      border: `1px solid ${BRAND.amazon}`,
                      borderRadius: 10, padding: '12px 10px', textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
                      <div style={{
                        fontFamily: FONTS.display, fontSize: 18, fontWeight: 900,
                        color, letterSpacing: '0.02em',
                      }}>
                        {value}
                      </div>
                      <div style={{
                        fontSize: 9, fontFamily: FONTS.display, letterSpacing: '0.12em',
                        color: `${BRAND.heirloom}55`, marginTop: 3, textTransform: 'uppercase',
                      }}>
                        {note ?? label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Value chain progress */}
              <div style={{ ...card, marginTop: 12 }}>
                <div style={sectionLabel}>CADENA DE VALOR</div>
                <ValueChain
                  hasTree={trees.length > 0}
                  hasMazorcas={(profile?.mazorcas_balance ?? 0) > 0}
                  onNavigate={navigate}
                />
              </div>

              {/* Minted NFTs */}
              <div style={{ ...card, marginTop: 12 }}>
                <div style={{ ...sectionLabel, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>NFTs MINTEADOS</span>
                  <span style={{ fontFamily: FONTS.display, fontSize: 11, color: `${BRAND.heirloom}44` }}>
                    {trees.length} árbol{trees.length !== 1 ? 'es' : ''}
                  </span>
                </div>

                {trees.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🌱</div>
                    <p style={{ fontSize: 13, color: `${BRAND.heirloom}55`, margin: 0 }}>
                      Ningún árbol minteado aún.
                    </p>
                    <button
                      onClick={() => navigate('/adoptar')}
                      style={{
                        marginTop: 12, background: 'none',
                        border: `1px solid ${BRAND.pod}66`,
                        color: BRAND.pod, padding: '8px 18px',
                        fontFamily: FONTS.display, fontSize: 11,
                        letterSpacing: '0.12em', cursor: 'pointer',
                        textTransform: 'uppercase',
                      }}
                    >
                      ADOPTAR UN ÁRBOL →
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {trees.map(t => (
                      <div
                        key={t.id}
                        style={{
                          background: `${BRAND.heroic}0c`,
                          border: `1px solid ${BRAND.heroic}44`,
                          borderRadius: 10, padding: '12px 14px',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          gap: 10, flexWrap: 'wrap',
                        }}
                      >
                        <div>
                          <div style={{
                            fontFamily: FONTS.display, fontSize: 13, fontWeight: 700,
                            color: BRAND.heroic, letterSpacing: '0.06em',
                          }}>
                            ⛓️ {GUARDIAN_NAMES[t.guardian_id] ?? `Árbol`}
                          </div>
                          <div style={{ fontSize: 11, color: `${BRAND.heirloom}66`, marginTop: 3 }}>
                            {t.variety} · {chainLabel(t.nft_chain_id)}
                            {t.nft_token_id != null && (
                              <span style={{ color: BRAND.mazorca }}> · Token #{t.nft_token_id}</span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          {t.nft_token_id && t.nft_contract && (
                            <a
                              href={`https://opensea.io/assets/base/${t.nft_contract}/${t.nft_token_id}`}
                              target="_blank" rel="noopener noreferrer"
                              style={{ fontSize: 11, color: BRAND.mazorca, textDecoration: 'none', fontFamily: FONTS.display, letterSpacing: '0.08em' }}
                            >
                              OpenSea ↗
                            </a>
                          )}
                          {t.nft_mint_tx && (
                            <a
                              href={explorerTx(t.nft_mint_tx, t.nft_chain_id)}
                              target="_blank" rel="noopener noreferrer"
                              style={{ fontSize: 10, color: `${BRAND.heirloom}55`, textDecoration: 'none', fontFamily: 'monospace' }}
                            >
                              {t.nft_mint_tx.slice(0, 8)}… ↗
                            </a>
                          )}
                          <button
                            onClick={() => navigate(`/tree/${t.id}`)}
                            style={{
                              background: `${BRAND.heroic}18`,
                              border: `1px solid ${BRAND.heroic}44`,
                              color: BRAND.heroic, padding: '5px 12px',
                              fontFamily: FONTS.display, fontSize: 10,
                              letterSpacing: '0.1em', cursor: 'pointer',
                              textTransform: 'uppercase',
                            }}
                          >
                            VER →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick actions */}
              <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={() => navigate('/adoptar')} style={quickBtn(BRAND.pod)}>
                  🌱 ADOPTAR ÁRBOL
                </button>
                <button onClick={() => navigate('/web3/onboarding')} style={quickBtn(BRAND.heroic)}>
                  ⛓️ ONBOARDING WEB3
                </button>
                <button onClick={() => navigate('/web3')} style={quickBtn(BRAND.criollo)}>
                  ⬡ NIBS PIPELINE
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

function ValueChain({
  hasTree, hasMazorcas, onNavigate,
}: { hasTree: boolean; hasMazorcas: boolean; onNavigate: (path: string) => void }) {
  const steps = [
    { label: 'ADOPT',    color: BRAND.pod,     done: hasTree,      cta: 'ADOPTAR →',  path: '/adoptar' },
    { label: 'CARE',     color: BRAND.pod,     done: false,        cta: 'CUIDAR →',   path: '/adoptar' },
    { label: 'MAZORCAS', color: BRAND.mazorca, done: hasMazorcas,  cta: null,         path: '' },
    { label: '$CACAO',   color: BRAND.heroic,  done: false,        cta: null,         path: '' },
    { label: 'NIBS',     color: BRAND.criollo, done: false,        cta: null,         path: '' },
  ]
  const firstActiveIdx = steps.findIndex((s, i) => {
    if (i === 0) return !s.done
    return !s.done && steps[i - 1].done
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {steps.map((s, i) => {
        const done   = s.done
        const active = i === firstActiveIdx
        const locked = !done && !active
        return (
          <div key={s.label} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 12px', borderRadius: 8,
            background: active ? `${s.color}12` : done ? `${s.color}0A` : 'transparent',
            border: `1px solid ${active ? s.color + '55' : done ? s.color + '33' : BRAND.amazon + '44'}`,
            opacity: locked ? 0.45 : 1,
            transition: 'all 0.3s',
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: '50%',
              background: done ? s.color : active ? `${s.color}33` : `${BRAND.amazon}55`,
              border: `1px solid ${done ? s.color : s.color + '44'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, color: done ? BRAND.bgDeep : s.color, flexShrink: 0,
            }}>
              {done ? '✓' : i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: FONTS.display, fontSize: 10, fontWeight: 700,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: done ? s.color : active ? s.color : `${BRAND.heirloom}44`,
              }}>
                {s.label}
              </div>
            </div>
            {active && s.cta && s.path && (
              <button
                onClick={() => onNavigate(s.path)}
                style={{
                  background: `${s.color}22`, border: `1px solid ${s.color}55`,
                  color: s.color, padding: '4px 10px',
                  fontFamily: FONTS.display, fontSize: 9,
                  letterSpacing: '0.12em', cursor: 'pointer',
                  textTransform: 'uppercase', borderRadius: 4,
                }}
              >
                {s.cta}
              </button>
            )}
            {!active && !done && i > 1 && (
              <div style={{
                fontSize: 9, fontFamily: FONTS.display, letterSpacing: '0.1em',
                color: `${BRAND.heirloom}33`, textTransform: 'uppercase',
              }}>
                {i === 3 ? 'PHASE 5' : i === 4 ? 'PHASE 6' : ''}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const card: React.CSSProperties = {
  background: BRAND.bgCard,
  border: `1px solid ${BRAND.amazon}`,
  borderRadius: 12,
  padding: '16px 18px',
}

const sectionLabel: React.CSSProperties = {
  fontFamily: FONTS.display,
  fontSize: 10,
  letterSpacing: '0.18em',
  color: `${BRAND.heirloom}55`,
  textTransform: 'uppercase',
  marginBottom: 12,
}

function quickBtn(color: string): React.CSSProperties {
  return {
    background: `${color}18`,
    border: `1px solid ${color}44`,
    color,
    padding: '9px 16px',
    fontFamily: FONTS.display,
    fontSize: 11,
    letterSpacing: '0.12em',
    cursor: 'pointer',
    textTransform: 'uppercase',
    borderRadius: 6,
  }
}
