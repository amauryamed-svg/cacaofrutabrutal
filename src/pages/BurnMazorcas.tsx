// /app/burn — Burn mazorcas off-chain → claim $CACAO on Base.
// Self-contained: Web3Provider inside, no global wagmi needed.
import { useEffect, useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import Web3Provider from '../components/web3/Web3Provider'
import ConnectWalletButton from '../components/web3/ConnectWalletButton'
import { useTokenBalance } from '../hooks/useTokenBalance'
import { useKYCStatus } from '../hooks/useKYCStatus'
import { useAuth } from '../context/AuthContext'
import {
  BRAND, FONTS,
  WEB3_CONTRACTS, BASE_CHAIN_ID,
  MAZORCA_TO_CACAO_RATE,
} from '../utils/constants'
import {
  requestBurnSignature,
  burnArgs,
  MAZORCA_REDEMPTION_ABI,
  type SignedRedemption,
} from '../lib/web3/redemption'

type Phase = 'pick' | 'signing' | 'ready' | 'claiming' | 'mining' | 'done' | 'error'

function BurnInner() {
  const { userId } = useAuth()
  const { address } = useAccount()
  const kyc = useKYCStatus()
  const balance = useTokenBalance()
  const { writeContractAsync } = useWriteContract()

  const [phase, setPhase] = useState<Phase>('pick')
  const [amount, setAmount] = useState(MAZORCA_TO_CACAO_RATE)
  const [redemption, setRedemption] = useState<SignedRedemption | null>(null)
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null)
  const [errMsg, setErrMsg] = useState<string | null>(null)

  const receipt = useWaitForTransactionReceipt({ hash: txHash ?? undefined })

  useEffect(() => {
    if (!txHash) return
    if (receipt.isLoading) setPhase('mining')
    else if (receipt.isSuccess) setPhase('done')
    else if (receipt.isError) { setPhase('error'); setErrMsg('Transaction reverted on-chain.') }
  }, [receipt.isLoading, receipt.isSuccess, receipt.isError, txHash])

  const cacaoOut    = Math.floor(amount / MAZORCA_TO_CACAO_RATE)
  const maxAmount   = Math.floor(balance.mazorcas / MAZORCA_TO_CACAO_RATE) * MAZORCA_TO_CACAO_RATE
  const canBurn     = !!address && kyc.canPerform('redeem') && balance.mazorcas >= MAZORCA_TO_CACAO_RATE

  async function sign() {
    setPhase('signing'); setErrMsg(null)
    try {
      const r = await requestBurnSignature(amount)
      setRedemption(r); setPhase('ready')
    } catch (e) {
      setPhase('error'); setErrMsg(e instanceof Error ? e.message : 'sign_failed')
    }
  }

  async function claim() {
    if (!redemption) return
    setPhase('claiming'); setErrMsg(null)
    try {
      const args = burnArgs(redemption)
      const hash = await writeContractAsync({
        address: WEB3_CONTRACTS.mazorcaRedemption as `0x${string}`,
        abi: MAZORCA_REDEMPTION_ABI,
        functionName: 'claim',
        args,
        chainId: BASE_CHAIN_ID,
      })
      setTxHash(hash)
    } catch (e) {
      setPhase('error'); setErrMsg(e instanceof Error ? e.message : 'claim_failed')
    }
  }

  return (
    <main style={{
      minHeight: '100vh', background: BRAND.bgDeep, color: BRAND.heirloom,
      fontFamily: FONTS.body, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '40px 24px',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            fontFamily: FONTS.body, fontSize: 10, letterSpacing: '0.2em',
            color: `${BRAND.heirloom}44`, textTransform: 'uppercase', marginBottom: 8,
          }}>
            CAÚA WEB3 · BURN
          </div>
          <h1 style={{
            fontFamily: FONTS.display, fontSize: 'clamp(36px, 8vw, 52px)',
            fontWeight: 900, lineHeight: 1, letterSpacing: '-0.01em',
            textTransform: 'uppercase', margin: 0,
          }}>
            MAZORCAS<br /><span style={{ color: BRAND.mazorca }}>→ $CACAO</span>
          </h1>
          <p style={{ fontSize: 13, color: `${BRAND.heirloom}66`, marginTop: 12, lineHeight: 1.6 }}>
            Quema mazorcas acumuladas en el juego y reclama $CACAO en Base.
            Cooldown: 1 redención cada 30 días.
          </p>
        </div>

        {/* Balance chip */}
        <div style={{
          display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap',
        }}>
          <Chip label="MAZORCAS" value={balance.mazorcas.toLocaleString()} color={BRAND.mazorca} />
          <Chip label="RATE" value={`${MAZORCA_TO_CACAO_RATE}:1`} color={BRAND.heroic} />
          <Chip label="RECIBES" value={`${cacaoOut} $CACAO`} color={BRAND.criollo} />
        </div>

        {/* Flow */}
        {!userId ? (
          <Card>
            <p style={p}>Inicia sesión para quemar mazorcas.</p>
            <a href="/auth" style={primaryBtn(BRAND.mazorca)}>INICIAR SESIÓN →</a>
          </Card>

        ) : !address ? (
          <Card>
            <p style={p}>Conecta tu wallet para recibir $CACAO en Base.</p>
            <ConnectWalletButton />
          </Card>

        ) : !kyc.canPerform('redeem') ? (
          <Card>
            <p style={p}>Necesitas completar el onboarding Web3 (KYC tier ≥ 1) para redimir.</p>
            <a href="/web3/onboarding" style={primaryBtn(BRAND.mazorca)}>IR AL ONBOARDING →</a>
          </Card>

        ) : balance.mazorcas < MAZORCA_TO_CACAO_RATE ? (
          <Card>
            <p style={p}>
              Necesitas al menos <strong>{MAZORCA_TO_CACAO_RATE}</strong> mazorcas.
              Tienes <strong style={{ color: BRAND.mazorca }}>{balance.mazorcas}</strong>.
            </p>
            <p style={{ ...p, opacity: 0.5, fontSize: 11 }}>
              Cuida tu árbol, completa combos y lee el blog para acumular mazorcas.
            </p>
            <a href="/dashboard" style={primaryBtn(BRAND.pod)}>IR AL DASHBOARD →</a>
          </Card>

        ) : phase === 'done' && txHash ? (
          <Card>
            <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>◈</div>
              <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 20, color: BRAND.criollo, marginBottom: 8 }}>
                {cacaoOut} $CACAO RECLAMADOS
              </div>
              <p style={{ ...p, color: `${BRAND.heirloom}66` }}>
                Ya están en tu wallet en Base.
              </p>
              <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: FONTS.body, fontSize: 10, color: BRAND.heroic, letterSpacing: '0.1em' }}>
                Ver en BaseScan →
              </a>
            </div>
            <button onClick={() => { setPhase('pick'); setTxHash(null); setRedemption(null) }} style={primaryBtn(BRAND.amazon)}>
              NUEVA QUEMA
            </button>
          </Card>

        ) : phase === 'error' ? (
          <Card>
            <p style={{ ...p, color: BRAND.radioRed }}>{errMsg ?? 'Error desconocido'}</p>
            <button onClick={() => { setPhase('pick'); setErrMsg(null) }} style={primaryBtn(BRAND.mazorca)}>REINTENTAR</button>
          </Card>

        ) : (
          <Card>
            {/* Amount picker */}
            {(phase === 'pick') && (
              <>
                <label style={label}>Mazorcas a quemar</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <button
                    onClick={() => setAmount(a => Math.max(MAZORCA_TO_CACAO_RATE, a - MAZORCA_TO_CACAO_RATE))}
                    style={stepBtn}
                  >−</button>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 32, color: BRAND.heirloom }}>
                      {amount.toLocaleString()}
                    </div>
                    <div style={{ fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}44` }}>
                      mazorcas · max {maxAmount.toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={() => setAmount(a => Math.min(maxAmount, a + MAZORCA_TO_CACAO_RATE))}
                    disabled={amount >= maxAmount}
                    style={{ ...stepBtn, opacity: amount >= maxAmount ? 0.3 : 1 }}
                  >+</button>
                </div>
                <div style={{
                  padding: '12px 16px', borderRadius: 8,
                  background: `${BRAND.criollo}12`, border: `1px solid ${BRAND.criollo}33`,
                  fontFamily: FONTS.display, fontSize: 14, fontWeight: 700,
                  color: BRAND.criollo, textAlign: 'center', marginBottom: 20,
                }}>
                  {amount.toLocaleString()} mazorcas → <span style={{ color: BRAND.heirloom }}>{cacaoOut} $CACAO</span>
                </div>
                <button onClick={sign} style={primaryBtn(BRAND.mazorca)}>
                  {canBurn ? 'FIRMAR QUEMA →' : 'SIN SALDO SUFICIENTE'}
                </button>
              </>
            )}

            {phase === 'signing' && (
              <p style={{ ...p, textAlign: 'center', paddingTop: 12 }}>
                <span style={{ display: 'block', fontFamily: FONTS.display, fontSize: 14, marginBottom: 8, color: BRAND.mazorca }}>
                  FIRMANDO CON EL SERVIDOR…
                </span>
                Generando payload EIP-712. No cierres esta ventana.
              </p>
            )}

            {(phase === 'ready' || phase === 'claiming') && redemption && (
              <>
                <p style={p}>
                  Servidor firmó <strong>{redemption.burn.mazorcaCount}</strong> mazorcas.
                  Confirma la transacción en tu wallet.
                </p>
                <p style={{ ...p, fontSize: 10, opacity: 0.5 }}>
                  Deadline: {new Date(Number(redemption.burn.deadline) * 1000).toLocaleString()}
                </p>
                <button
                  onClick={claim}
                  disabled={phase === 'claiming'}
                  style={{ ...primaryBtn(BRAND.criollo), opacity: phase === 'claiming' ? 0.6 : 1 }}
                >
                  {phase === 'claiming' ? 'ESPERANDO WALLET…' : `CLAIM ${cacaoOut} $CACAO ON BASE →`}
                </button>
              </>
            )}

            {phase === 'mining' && txHash && (
              <p style={{ ...p, textAlign: 'center', paddingTop: 12 }}>
                <span style={{ display: 'block', fontFamily: FONTS.display, fontSize: 14, marginBottom: 8, color: BRAND.heroic }}>
                  PROCESANDO EN BASE…
                </span>
                <a href={`https://basescan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                  style={{ fontFamily: FONTS.body, fontSize: 10, color: BRAND.heroic }}>
                  Ver transacción →
                </a>
              </p>
            )}
          </Card>
        )}

        <div style={{ marginTop: 24, display: 'flex', gap: 20, justifyContent: 'center' }}>
          <a href="/dashboard" style={ghostLink}>← Dashboard</a>
          <a href="/web3" style={ghostLink}>Web3 →</a>
        </div>
      </div>
    </main>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Chip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      padding: '6px 14px', borderRadius: 999,
      background: `${color}12`, border: `1px solid ${color}33`,
      fontFamily: FONTS.display,
    }}>
      <div style={{ fontSize: 8, letterSpacing: '0.18em', color: `${color}99`, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 900, color, marginTop: 2 }}>{value}</div>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: '24px 20px', borderRadius: 16,
      background: BRAND.bgCard, border: `1px solid ${BRAND.amazon}55`,
    }}>
      {children}
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const p: React.CSSProperties = {
  fontFamily: FONTS.body, fontSize: 13, lineHeight: 1.6,
  color: `${BRAND.heirloom}88`, marginBottom: 16,
}

const label: React.CSSProperties = {
  display: 'block', fontFamily: FONTS.display, fontSize: 9,
  letterSpacing: '0.2em', textTransform: 'uppercase',
  color: `${BRAND.heirloom}44`, marginBottom: 12,
}

const stepBtn: React.CSSProperties = {
  width: 40, height: 40, borderRadius: 8, flexShrink: 0,
  background: BRAND.bgDeep, border: `1px solid ${BRAND.amazon}66`,
  color: BRAND.heirloom, fontSize: 22, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: FONTS.display, fontWeight: 700,
}

function primaryBtn(color: string): React.CSSProperties {
  return {
    display: 'block', width: '100%', padding: '14px',
    background: color, color: BRAND.bgDeep, border: 'none',
    borderRadius: 10, cursor: 'pointer',
    fontFamily: FONTS.display, fontWeight: 900, fontSize: 11,
    letterSpacing: '0.14em', textTransform: 'uppercase',
    textDecoration: 'none', textAlign: 'center',
  }
}

const ghostLink: React.CSSProperties = {
  fontFamily: FONTS.display, fontSize: 10, letterSpacing: '0.14em',
  color: `${BRAND.heirloom}33`, textDecoration: 'none', textTransform: 'uppercase',
}

export default function BurnMazorcas() {
  return (
    <Web3Provider>
      <BurnInner />
    </Web3Provider>
  )
}
