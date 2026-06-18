import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useConnectModal } from '@rainbow-me/rainbowkit'
import { parseEther } from 'viem'
import { BRAND, FONTS, WEB3_CONTRACTS, ACTIVE_CHAIN_ID, BASE_SEPOLIA_CHAIN_ID } from '../../utils/constants'
import { useFondoCaua } from '../../hooks/useFondoCaua'
import { FONDO_CAUA_ABI, FONDO_ALLOC, fmtEth, fmtUsdc, estimateUsd } from '../../lib/web3/fondo'
import Web3Provider from '../web3/Web3Provider'

// ─── Inner component (needs wagmi context) ────────────────────────────────────

const ETH_PRESETS = [
  { label: '0.005 ETH', value: '0.005', usdApprox: '$17' },
  { label: '0.01 ETH',  value: '0.01',  usdApprox: '$34' },
  { label: '0.05 ETH',  value: '0.05',  usdApprox: '$170' },
  { label: '0.1 ETH',   value: '0.1',   usdApprox: '$340' },
]

function FondoCauaInner({ lang }: { lang: 'es' | 'en' }) {
  const { address, chainId } = useAccount()
  const { openConnectModal } = useConnectModal()
  const fondo = useFondoCaua()

  const [selectedEth, setSelectedEth] = useState<string>('0.01')
  const [customEth, setCustomEth]     = useState<string>('')
  const [useCustom, setUseCustom]     = useState(false)

  const { writeContract, data: txHash, isPending, error: writeError, reset } = useWriteContract()
  const { isLoading: isMining, isSuccess: isMined } = useWaitForTransactionReceipt({ hash: txHash })

  const T = (es: string, en: string) => lang === 'es' ? es : en

  const isWrongChain = address !== undefined && chainId !== ACTIVE_CHAIN_ID
  const amount = useCustom ? customEth : selectedEth
  const amountNum = parseFloat(amount)
  const amountValid = !isNaN(amountNum) && amountNum > 0.0001

  const allocationItems = [
    { key: 'tech', label: T('Tecnologías', 'Technologies'), sublabel: T('Liofilización · NIBS bioprocess · Lab', 'Lyophilization · NIBS bioprocess · Lab'), pct: FONDO_ALLOC.tech, color: BRAND.heroic },
    { key: 'lots', label: T('Lotes', 'Lots'), sublabel: T('Fincas guardianas · Cosechas · Mucílago', 'Guardian farms · Harvests · Mucilage'), pct: FONDO_ALLOC.lots, color: BRAND.pod },
    { key: 'rd',   label: 'R&D', sublabel: T('Novel Food EU · Bioactivos · Cacao NIBS', 'Novel Food EU · Bioactives · Cacao NIBS'), pct: FONDO_ALLOC.rd, color: BRAND.criollo },
  ]

  function handleContribute() {
    if (!amountValid) return
    writeContract({
      address: WEB3_CONTRACTS.fondoCaua,
      abi: FONDO_CAUA_ABI,
      functionName: 'contributeETH',
      value: parseEther(amount),
      chainId: ACTIVE_CHAIN_ID,
    })
  }

  const basescanBase = ACTIVE_CHAIN_ID === BASE_SEPOLIA_CHAIN_ID
    ? 'https://sepolia.basescan.org/tx/'
    : 'https://basescan.org/tx/'

  const usdEstimate = estimateUsd(fondo.totalEthWei, fondo.totalUsdcRaw)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* ── Testnet badge ── */}
      {ACTIVE_CHAIN_ID === BASE_SEPOLIA_CHAIN_ID && (
        <div style={{
          display: 'inline-flex', alignSelf: 'flex-start',
          alignItems: 'center', gap: 6,
          background: `${BRAND.mazorca}18`, border: `1px solid ${BRAND.mazorca}44`,
          borderRadius: 6, padding: '4px 10px',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: BRAND.mazorca, display: 'inline-block' }} />
          <span style={{ fontFamily: FONTS.body, fontSize: 10, color: BRAND.mazorca, letterSpacing: '0.12em' }}>
            BASE SEPOLIA TESTNET
          </span>
        </div>
      )}

      {/* ── Not yet deployed notice ── */}
      {!fondo.deployed && (
        <div style={{
          background: `${BRAND.amazon}22`, border: `1px solid ${BRAND.amazon}55`,
          borderRadius: 12, padding: '16px 18px',
          fontFamily: FONTS.body, fontSize: 12, color: `${BRAND.heirloom}88`, lineHeight: 1.6,
        }}>
          {T(
            '⏳ Contrato FondoCaua pendiente de deploy. Ejecuta el script Foundry y actualiza WEB3_CONTRACTS.fondoCaua en constants.ts.',
            '⏳ FondoCaua contract not yet deployed. Run the Foundry script and update WEB3_CONTRACTS.fondoCaua in constants.ts.',
          )}
        </div>
      )}

      {/* ── On-chain raised meters ── */}
      {fondo.deployed && (
        <div style={{
          background: BRAND.bgCard, border: `1px solid ${BRAND.amazon}44`,
          borderRadius: 16, padding: '20px 22px',
        }}>
          <p style={{ fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}55`, letterSpacing: '0.18em', marginBottom: 16 }}>
            {T('RECAUDADO ON-CHAIN · BASE NETWORK', 'RAISED ON-CHAIN · BASE NETWORK')}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 20 }}>
            <MetricBox label="ETH" value={fmtEth(fondo.totalEthWei)} color={BRAND.heroic} />
            <MetricBox label="USDC" value={fmtUsdc(fondo.totalUsdcRaw)} color={BRAND.pod} />
            <MetricBox label={T('~USD', '~USD')} value={`$${Math.round(usdEstimate).toLocaleString()}`} color={BRAND.mazorca} sub={T('precio aprox.', 'approx. price')} />
            <MetricBox label={T('META', 'GOAL')} value={`$${(fondo.goalUsd / 1000).toFixed(0)}K`} color={`${BRAND.heirloom}44`} />
          </div>
          {/* Progress bar */}
          <div style={{ height: 6, background: `${BRAND.amazon}44`, borderRadius: 999, overflow: 'hidden' }}>
            <div style={{
              width: `${fondo.pctFunded}%`, height: '100%', borderRadius: 999,
              background: `linear-gradient(90deg, ${BRAND.heroic}, ${BRAND.pod})`,
              transition: 'width 0.8s ease',
            }} />
          </div>
          <div style={{ fontFamily: FONTS.body, fontSize: 9, color: `${BRAND.heirloom}33`, marginTop: 6, letterSpacing: '0.1em' }}>
            {fondo.pctFunded}% {T('del objetivo · datos en vivo desde Base', 'of goal · live data from Base')}
          </div>

          {/* User's own contribution */}
          {address && (fondo.userEthWei > 0n || fondo.userUsdcRaw > 0n) && (
            <div style={{
              marginTop: 16, padding: '12px 14px',
              background: `${BRAND.pod}12`, border: `1px solid ${BRAND.pod}33`, borderRadius: 10,
              fontFamily: FONTS.body, fontSize: 11, color: BRAND.pod, letterSpacing: '0.06em',
            }}>
              ✓ {T('Tu contribución:', 'Your contribution:')} {fmtEth(fondo.userEthWei)} ETH
              {fondo.userUsdcRaw > 0n ? ` + ${fmtUsdc(fondo.userUsdcRaw)} USDC` : ''}
            </div>
          )}
        </div>
      )}

      {/* ── Allocation tracker ── */}
      <div style={{
        background: BRAND.bgCard, border: `1px solid ${BRAND.amazon}44`,
        borderRadius: 16, padding: '20px 22px',
      }}>
        <p style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 13, color: BRAND.heirloom, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
          {T('DISTRIBUCIÓN ON-CHAIN', 'ON-CHAIN ALLOCATION')}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {allocationItems.map(item => (
            <div key={item.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
                <div>
                  <span style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 12, color: item.color, letterSpacing: '0.06em' }}>
                    {item.label}
                  </span>
                  <span style={{ fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}55`, marginLeft: 8 }}>
                    {item.sublabel}
                  </span>
                </div>
                <span style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 14, color: item.color }}>
                  {item.pct}%
                </span>
              </div>
              <div style={{ height: 4, background: `${BRAND.amazon}33`, borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${item.pct}%`, height: '100%', borderRadius: 999, background: item.color }} />
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontFamily: FONTS.body, fontSize: 9, color: `${BRAND.heirloom}33`, marginTop: 14, lineHeight: 1.6 }}>
          {T(
            'Compromisos inmutables en FondoCaua.sol · Charter §III · Desembolso controlado por multisig 2-de-2.',
            'Immutable commitments in FondoCaua.sol · Charter §III · Disbursement controlled by 2-of-2 multisig.',
          )}
        </p>
      </div>

      {/* ── Contribute panel ── */}
      <div style={{
        background: `linear-gradient(135deg, ${BRAND.bgCard}, ${BRAND.amazon}22)`,
        border: `1px solid ${BRAND.pod}44`,
        borderRadius: 16, padding: '24px 22px',
      }}>
        <p style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 16, color: BRAND.heirloom, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
          {T('CONTRIBUIR ON-CHAIN', 'CONTRIBUTE ON-CHAIN')}
        </p>
        <p style={{ fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}66`, marginBottom: 20, lineHeight: 1.6 }}>
          {T(
            'ETH en Base · va directo al treasury multisig · evento registrado en blockchain.',
            'ETH on Base · goes directly to treasury multisig · event recorded on-chain.',
          )}
        </p>

        {/* Not connected */}
        {!address && (
          <button
            onClick={openConnectModal}
            style={{
              width: '100%', padding: '14px 20px',
              background: BRAND.pod, color: BRAND.bgDeep,
              fontFamily: FONTS.display, fontWeight: 800, fontSize: 13,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              border: 'none', borderRadius: 10, cursor: 'pointer',
            }}
          >
            {T('CONECTAR WALLET → CONTRIBUIR', 'CONNECT WALLET → CONTRIBUTE')}
          </button>
        )}

        {/* Wrong chain */}
        {address && isWrongChain && (
          <div style={{
            fontFamily: FONTS.body, fontSize: 12, color: BRAND.mazorca, lineHeight: 1.6,
            background: `${BRAND.mazorca}12`, border: `1px solid ${BRAND.mazorca}33`,
            borderRadius: 10, padding: '12px 14px',
          }}>
            {T('Cambia a Base Sepolia en tu wallet para contribuir.', 'Switch to Base Sepolia in your wallet to contribute.')}
          </div>
        )}

        {/* Paused */}
        {fondo.isPaused && (
          <div style={{
            fontFamily: FONTS.body, fontSize: 12, color: `${BRAND.heirloom}66`,
            background: `${BRAND.amazon}22`, border: `1px solid ${BRAND.amazon}44`,
            borderRadius: 10, padding: '12px 14px',
          }}>
            {T('El contrato está pausado temporalmente.', 'Contract is temporarily paused.')}
          </div>
        )}

        {/* Contribute form */}
        {address && !isWrongChain && !fondo.isPaused && fondo.deployed && (
          <>
            {/* Amount presets */}
            {!isMined && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
                  {ETH_PRESETS.map(p => (
                    <button
                      key={p.value}
                      onClick={() => { setSelectedEth(p.value); setUseCustom(false) }}
                      style={{
                        padding: '10px 12px', border: `1.5px solid`,
                        borderColor: !useCustom && selectedEth === p.value ? BRAND.pod : `${BRAND.amazon}55`,
                        borderRadius: 8, background: !useCustom && selectedEth === p.value ? `${BRAND.pod}18` : 'transparent',
                        cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2,
                      }}
                    >
                      <span style={{ fontFamily: FONTS.display, fontWeight: 800, fontSize: 12, color: BRAND.heirloom, letterSpacing: '0.04em' }}>{p.label}</span>
                      <span style={{ fontFamily: FONTS.body, fontSize: 9, color: `${BRAND.heirloom}55` }}>{p.usdApprox}</span>
                    </button>
                  ))}
                </div>

                {/* Custom amount */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
                  <input
                    type="number" placeholder="0.000 ETH"
                    value={useCustom ? customEth : ''}
                    onChange={e => { setCustomEth(e.target.value); setUseCustom(true) }}
                    onFocus={() => setUseCustom(true)}
                    style={{
                      flex: 1, background: `${BRAND.amazon}22`, border: `1.5px solid ${useCustom ? BRAND.pod : `${BRAND.amazon}55`}`,
                      borderRadius: 8, padding: '10px 12px',
                      fontFamily: FONTS.body, fontSize: 13, color: BRAND.heirloom,
                      outline: 'none',
                    }}
                    min="0.0001" step="0.001"
                  />
                  <span style={{ fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}55` }}>ETH</span>
                </div>

                {/* Confirm button */}
                <button
                  onClick={handleContribute}
                  disabled={!amountValid || isPending || isMining}
                  style={{
                    width: '100%', padding: '14px 20px',
                    background: amountValid ? BRAND.pod : `${BRAND.pod}44`,
                    color: BRAND.bgDeep,
                    fontFamily: FONTS.display, fontWeight: 800, fontSize: 13,
                    letterSpacing: '0.14em', textTransform: 'uppercase',
                    border: 'none', borderRadius: 10,
                    cursor: amountValid && !isPending ? 'pointer' : 'not-allowed',
                    transition: 'background 0.2s',
                  }}
                >
                  {isPending ? T('Confirma en tu wallet…', 'Confirm in your wallet…')
                    : isMining ? T('Procesando en Base…', 'Processing on Base…')
                    : `${T('CONTRIBUIR', 'CONTRIBUTE')} ${amount} ETH →`}
                </button>

                {writeError && (
                  <p style={{ fontFamily: FONTS.body, fontSize: 10, color: BRAND.radioRed, marginTop: 8 }}>
                    {writeError.message.split('\n')[0]}
                  </p>
                )}
              </>
            )}

            {/* Success state */}
            {isMined && txHash && (
              <div style={{
                background: `${BRAND.pod}14`, border: `1.5px solid ${BRAND.pod}55`,
                borderRadius: 12, padding: '18px 16px',
                display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 14, color: BRAND.pod, letterSpacing: '0.06em' }}>
                  ✓ {T('CONTRIBUCIÓN REGISTRADA ON-CHAIN', 'CONTRIBUTION REGISTERED ON-CHAIN')}
                </div>
                <a
                  href={`${basescanBase}${txHash}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ fontFamily: FONTS.body, fontSize: 10, color: BRAND.heroic, letterSpacing: '0.1em' }}
                >
                  {T('Ver transacción en BaseScan →', 'View on BaseScan →')}
                </a>
                <button
                  onClick={reset}
                  style={{
                    background: 'transparent', border: `1px solid ${BRAND.amazon}44`,
                    borderRadius: 8, padding: '8px 14px', cursor: 'pointer',
                    fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}66`,
                    alignSelf: 'flex-start', marginTop: 4,
                  }}
                >
                  {T('Nueva contribución', 'New contribution')}
                </button>
              </div>
            )}
          </>
        )}

        {/* Risk disclosure — §10 */}
        {address && (
          <p style={{ fontFamily: FONTS.body, fontSize: 9, color: `${BRAND.heirloom}30`, marginTop: 12, lineHeight: 1.6 }}>
            {T(
              'Las contribuciones on-chain son irrevocables. Testnet — sin valor real. Mainnet Q3 2026 tras auditoría. No es una oferta de valores.',
              'On-chain contributions are irreversible. Testnet — no real value. Mainnet Q3 2026 post-audit. Not a securities offering.',
            )}
          </p>
        )}
      </div>

      {/* ── Value chain pipeline ── */}
      <div style={{
        background: BRAND.bgCard, border: `1px solid ${BRAND.amazon}33`,
        borderRadius: 16, padding: '20px 22px',
      }}>
        <p style={{ fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}44`, letterSpacing: '0.18em', marginBottom: 14 }}>
          {T('LO QUE ESTÁS FINANCIANDO', 'WHAT YOU ARE FUNDING')}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
          {[
            { icon: '🌱', label: T('Adopción de árboles', 'Tree Adoption'), color: BRAND.pod },
            { icon: '🍫', label: 'NIBS Bioactivos', color: BRAND.criollo },
            { icon: '💧', label: T('Mucílago · Bebidas', 'Mucilage · Beverages'), color: BRAND.heroic },
            { icon: '🧬', label: T('R&D Novel Food EU', 'R&D Novel Food EU'), color: BRAND.mazorca },
            { icon: '👨‍🌾', label: T('Guardianes (fincas)', 'Guardians (farms)'), color: BRAND.theobroma },
            { icon: '⬡', label: '$CACAO on-chain', color: BRAND.amazon },
          ].map(item => (
            <div key={item.label} style={{
              padding: '12px 10px', borderRadius: 10,
              background: `${item.color}0a`, border: `1px solid ${item.color}22`,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={{ fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}88`, lineHeight: 1.4 }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

// ─── Metric box ───────────────────────────────────────────────────────────────

function MetricBox({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div>
      <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 22, color }}>{value}</div>
      <div style={{ fontFamily: FONTS.body, fontSize: 9, color: `${BRAND.heirloom}44`, letterSpacing: '0.14em', textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontFamily: FONTS.body, fontSize: 8, color: `${BRAND.heirloom}25`, marginTop: 1 }}>{sub}</div>}
    </div>
  )
}

// ─── Public export — wraps its own Web3Provider so Fund.tsx stays lean ────────

export default function FondoCauaOnChain({ lang }: { lang: 'es' | 'en' }) {
  return (
    <Web3Provider>
      <FondoCauaInner lang={lang} />
    </Web3Provider>
  )
}
