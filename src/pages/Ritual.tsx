import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BRAND, FONTS, TAROT_CARDS, ELEMENT_COLORS } from '../utils/constants'
import { useAuth } from '../context/AuthContext'
import TarotCardArt from '../components/ritual/TarotCardArt'
import TokenReward from '../components/ritual/TokenReward'
import CacaoCeremonyCTA from '../components/marketplace/CacaoCeremonyCTA'
import { useTokenBalance } from '../hooks/useTokenBalance'
import { hsUpdateRitual } from '../lib/hubspotTracking'
import { useLang } from '../context/LangContext'
import { makeT } from '../utils/i18n'
import type { TarotCard } from '../types'

type Phase = 'intro' | 'drawing' | 'reveal'

export default function Ritual() {
  const [phase, setPhase]       = useState<Phase>('intro')
  const [selectedCard, setCard] = useState<TarotCard | null>(null)
  const [drawCount, setDrawCount]   = useState(0)
  const [shareCount, setShareCount] = useState(0)
  const [tokenReward, setTokenReward] = useState<{ beans: number; mazorcas: number } | null>(null)
  const { user, profile }       = useAuth()
  const navigate                = useNavigate()
  const { beans }               = useTokenBalance()
  const streak                  = profile?.ritual_streak ?? (user ? 7 : 0)
  const { lang } = useLang()
  const T = makeT(lang)

  const getTranslatedCard = (card: TarotCard) => ({
    ...card,
    name: T(`card_${card.id}_name` as any),
    meaning: T(`card_${card.id}_meaning` as any),
    advice: T(`card_${card.id}_advice` as any),
  })

  const ELEMENT_LABELS: Record<string, string> = {
    Tierra: T('rit_el_tierra'),
    Fuego:  T('rit_el_fuego'),
    Agua:   T('rit_el_agua'),
    Aire:   T('rit_el_aire'),
  }

  const awardTokens = async (eventType: string, amount?: number) => {
    if (!user) return
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/award-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await import('../lib/supabase').then(m => m.supabase.auth.getSession())).data.session?.access_token}`,
        },
        body: JSON.stringify({ event_type: eventType, amount }),
      })
      const data = await response.json()
      if (data.beans_awarded || data.mazorcas_awarded) {
        setTokenReward({
          beans: data.beans_awarded,
          mazorcas: data.mazorcas_awarded,
        })
        setTimeout(() => setTokenReward(null), 2500)
      }
    } catch {
      // Token award failed silently - user can try again
    }
  }

  const drawCard = () => {
    if (!user) { navigate('/auth'); return }
    setPhase('drawing')
    setTimeout(() => {
      const idx = Math.floor(Math.random() * TAROT_CARDS.length)
      const card = TAROT_CARDS[idx]
      setCard(card)
      setPhase('reveal')
      const newCount = drawCount + 1
      setDrawCount(newCount)
      awardTokens('ritual_draw')
      if (profile?.email) {
        hsUpdateRitual({
          email:                        profile.email,
          last_ritual_draw_card_name:    card.name,
          last_ritual_draw_card_element: card.element,
          last_ritual_draw_streak:       String(streak),
          ritual_draw_count:             String(newCount),
        })
      }
    }, 2200)
  }

  const cardColor = selectedCard ? ELEMENT_COLORS[selectedCard.element] : BRAND.criollo

  return (
    <div style={{ background: '#040C06', minHeight: '100vh', paddingTop: 80 }}>

      {/* Hero header */}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(24px,5vw,40px) var(--space-page) 0', textAlign: 'center' }}>
        <p style={{
          fontFamily: FONTS.serif, fontStyle: 'italic',
          color: BRAND.criollo, fontSize: 13, letterSpacing: '0.25em', marginBottom: 10,
        }}>
          {T('rit_eyebrow')}
        </p>
        <h1 style={{
          fontFamily: FONTS.display, fontWeight: 900,
          fontSize: 'clamp(42px, 10vw, 72px)', color: BRAND.heirloom,
          textTransform: 'uppercase', margin: '0 0 12px', lineHeight: 0.9,
        }}>
          {T('rit_title1')}<br />
          <span style={{ color: BRAND.criollo }}>{T('rit_title2')}</span>
        </h1>
        <p style={{
          fontFamily: FONTS.body, color: `${BRAND.heirloom}66`,
          fontSize: 14, lineHeight: 1.65, maxWidth: 440, margin: '0 auto 24px',
        }}>
          {T('rit_desc')}
        </p>

        {/* Streak + Token balance — only when logged in */}
        {user && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', marginBottom: 32 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: `${BRAND.mazorca}12`, border: `1px solid ${BRAND.mazorca}30`,
              padding: '6px 16px', borderRadius: 999,
            }}>
              <span style={{ fontSize: 15 }}>🔥</span>
              <span style={{
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
                fontSize: 12, color: BRAND.mazorca, letterSpacing: '0.1em',
              }}>{streak} {T('rit_streak')}</span>
            </div>
            {beans > 0 && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: `${BRAND.pod}12`, border: `1px solid ${BRAND.pod}30`,
                padding: '6px 16px', borderRadius: 999,
              }}>
                <span style={{ fontSize: 15 }}>🫘</span>
                <span style={{
                  fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
                  fontSize: 12, color: BRAND.pod, letterSpacing: '0.1em',
                }}>{beans.toFixed(1)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main ritual area */}
      <div style={{
        maxWidth: 480, margin: '0 auto', padding: '0 var(--space-page) clamp(48px,8vw,80px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32,
      }}>

        {/* INTRO — card back, invitation to draw */}
        {phase === 'intro' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <div
              onClick={drawCard}
              style={{
                width: 'min(200px, 55vw)', aspectRatio: '2/3', cursor: 'pointer',
                transition: 'transform 0.4s',
                filter: 'drop-shadow(0 20px 48px rgba(141,38,121,0.3))',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04) translateY(-6px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1) translateY(0)')}
            >
              <TarotCardArt card={TAROT_CARDS[0]} revealed={false} />
            </div>

            <div style={{ textAlign: 'center' }}>
              <p style={{
                fontFamily: FONTS.serif, fontStyle: 'italic',
                color: `${BRAND.heirloom}70`, fontSize: 13, marginBottom: 16, lineHeight: 1.6,
              }}>
                {T('rit_intention').split('\n').map((line, i) => (
                  <span key={i}>{line}{i === 0 && <br />}</span>
                ))}
              </p>
              <button onClick={drawCard} style={{
                background: `linear-gradient(135deg, ${BRAND.criollo}, #6B1B5A)`,
                color: BRAND.heirloom, border: 'none',
                padding: '14px 36px', borderRadius: 999,
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
                fontSize: 13, letterSpacing: '0.15em', cursor: 'pointer',
              }}>
                {user ? T('rit_reveal') : T('rit_start')}
              </button>
              {user && (
                <p style={{ fontFamily: FONTS.body, fontSize: 11, color: BRAND.pod, marginTop: 10 }}>
                  {T('rit_tokens')}
                </p>
              )}
              {!user && (
                <p style={{ fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}44`, marginTop: 10 }}>
                  {T('rit_anon')}
                </p>
              )}
            </div>
          </div>
        )}

        {/* DRAWING — animated pulse */}
        {phase === 'drawing' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
            <div className="animate-pulse-glow" style={{
              width: 'min(200px, 55vw)', aspectRatio: '2/3', borderRadius: 12,
              background: `linear-gradient(145deg, ${BRAND.criollo}44, #132B1C)`,
              border: `2px solid ${BRAND.criollo}`,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 12,
            }}>
              <div style={{ fontSize: 36, animation: 'float 2s ease-in-out infinite' }}>🫘</div>
              <div style={{
                fontFamily: FONTS.serif, fontStyle: 'italic',
                color: `${BRAND.heirloom}80`, fontSize: 12,
              }}>{T('rit_listening')}</div>
            </div>
          </div>
        )}

        {/* REVEAL */}
        {phase === 'reveal' && selectedCard && (() => {
          const translatedCard = getTranslatedCard(selectedCard)
          return (
            <>
              {tokenReward && <TokenReward beans={tokenReward.beans} mazorcas={tokenReward.mazorcas} />}
              {/* Card */}
              <div className="animate-fade-in-up" style={{
                width: 'min(220px, 60vw)', aspectRatio: '2/3',
                filter: `drop-shadow(0 24px 56px ${cardColor}44)`,
              }}>
                <TarotCardArt card={selectedCard} revealed />
              </div>

              {/* Element label */}
              <div style={{
                fontFamily: FONTS.body, fontSize: 11, color: cardColor,
                letterSpacing: '0.2em', textTransform: 'uppercase',
                opacity: 0.8,
              }}>
                {ELEMENT_LABELS[selectedCard.element]}
              </div>

              {/* Meaning */}
              <div className="animate-fade-in-up" style={{
                background: '#0D1A10',
                border: `1px solid ${cardColor}33`,
                borderRadius: 14, padding: '22px 24px',
                width: '100%',
              }}>
                <p style={{
                  fontFamily: FONTS.serif, fontStyle: 'italic',
                  color: `${BRAND.heirloom}cc`, fontSize: 14, lineHeight: 1.7,
                  margin: '0 0 16px',
                }}>"{translatedCard.meaning}"</p>

                <div style={{
                  borderTop: `1px solid ${BRAND.amazon}44`,
                  paddingTop: 16,
                }}>
                  <div style={{
                    fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
                    color: BRAND.pod, fontSize: 10, letterSpacing: '0.2em', marginBottom: 8,
                  }}>{T('rit_invitation')}</div>
                  <p style={{
                    fontFamily: FONTS.body, color: BRAND.heirloom,
                    fontSize: 13, lineHeight: 1.65, margin: 0,
                  }}>{translatedCard.advice}</p>
                </div>
              </div>

              {/* Meditation invite */}
              <div className="animate-fade-in-up" style={{
                background: `linear-gradient(135deg, ${BRAND.criollo}12, ${BRAND.muisca}10)`,
                border: `1px solid ${BRAND.criollo}25`,
                borderRadius: 14, padding: '20px 24px', width: '100%', textAlign: 'center',
              }}>
                <div style={{
                  fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
                  color: BRAND.heirloom, fontSize: 13, letterSpacing: '0.1em', marginBottom: 6,
                }}>{T('rit_ceremony')}</div>
                <p style={{
                  fontFamily: FONTS.body, color: `${BRAND.heirloom}66`,
                  fontSize: 12, margin: '0 0 14px', lineHeight: 1.5,
                }}>
                  {T('rit_cer_desc')}
                </p>
                <button onClick={() => window.open('https://open.spotify.com/playlist/0fu5LFh6NsOQguG6kT0PQN', '_blank')} style={{
                  background: 'transparent',
                  border: `1px solid ${BRAND.criollo}55`,
                  color: `${BRAND.heirloom}cc`, padding: '10px 22px', borderRadius: 999,
                  cursor: 'pointer',
                  fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
                  fontSize: 11, letterSpacing: '0.12em',
                }}>
                  {T('rit_spotify')}
                </button>
              </div>

              {/* Action row */}
              <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                <button onClick={() => {
                  const translatedCard = getTranslatedCard(selectedCard)
                  const text = `${T('rit_share_text')}: ${translatedCard.name} — "${translatedCard.meaning}" · CAUA Ritual`
                  if (navigator.share) navigator.share({ text })
                  else navigator.clipboard.writeText(text)
                  const newShare = shareCount + 1
                  setShareCount(newShare)
                  awardTokens('blog_share')
                  if (profile?.email) {
                    hsUpdateRitual({ email: profile.email, ritual_share_count: String(newShare) })
                  }
                }} style={{
                  flex: 1, padding: '12px', borderRadius: 10,
                  background: '#132B1C', border: `1px solid ${BRAND.amazon}66`,
                  color: `${BRAND.heirloom}cc`, cursor: 'pointer',
                  fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
                  fontSize: 11, letterSpacing: '0.1em',
                }}>{T('rit_share')}</button>

                <button onClick={() => { setPhase('intro'); setCard(null) }} style={{
                  flex: 1, padding: '12px', borderRadius: 10,
                  background: `${BRAND.pod}18`, border: `1px solid ${BRAND.pod}40`,
                  color: BRAND.pod, cursor: 'pointer',
                  fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700,
                  fontSize: 11, letterSpacing: '0.1em',
                }}>{T('rit_new_draw')}</button>
              </div>

              {/* Cacao Ceremony cross-sell — Cauaculture.co with adopter discount */}
              <div style={{ width: '100%' }}>
                <CacaoCeremonyCTA variant="ritual" />
              </div>
            </>
          )
        })()}
      </div>
    </div>
  )
}
