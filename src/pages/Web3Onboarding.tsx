import { useEffect, useState } from 'react'
import { useAccount, useChainId, useSignMessage, useSwitchChain } from 'wagmi'
import { base } from 'wagmi/chains'
import Web3Provider from '../components/web3/Web3Provider'
import ConnectWalletButton from '../components/web3/ConnectWalletButton'
import { useKYCStatus } from '../hooks/useKYCStatus'
import { useAuth } from '../context/AuthContext'
import { BRAND, FONTS, BASE_CHAIN_ID } from '../utils/constants'
import { buildSiweMessage, linkWallet, requestNonce } from '../lib/web3/siwe'

type Step = 'connect' | 'switch' | 'sign' | 'kyc' | 'done'

function Inner() {
  const { user, userId } = useAuth()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain, isPending: switching } = useSwitchChain()
  const { signMessageAsync, isPending: signing } = useSignMessage()
  const kyc = useKYCStatus()

  const [step, setStep] = useState<Step>('connect')
  const [linking, setLinking] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!isConnected) return setStep('connect')
    if (chainId !== BASE_CHAIN_ID) return setStep('switch')
    if (!kyc.walletAddress || kyc.walletAddress.toLowerCase() !== address?.toLowerCase()) return setStep('sign')
    if (kyc.status !== 'verified') return setStep('kyc')
    setStep('done')
  }, [isConnected, chainId, kyc.walletAddress, kyc.status, address])

  async function onSignAndLink() {
    if (!address) return
    setLinking(true)
    setErr(null)
    try {
      const { nonce } = await requestNonce()
      const message = buildSiweMessage({ address, chainId: BASE_CHAIN_ID, nonce })
      const signature = await signMessageAsync({ message })
      await linkWallet({ message, signature })
      await kyc.refresh()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'sign_failed')
    } finally {
      setLinking(false)
    }
  }

  if (!userId) {
    return (
      <Shell>
        <h1 style={h1Style}>SIGN IN FIRST</h1>
        <p style={pStyle}>You need a CauaCorp account before linking a wallet.</p>
        <a href="/app/auth" style={linkStyle}>→ Go to sign-in</a>
      </Shell>
    )
  }
  void user // reserved for greeting copy in Phase 5

  return (
    <Shell>
      <h1 style={h1Style}>WEB3 ONBOARDING</h1>
      <p style={pStyle}>
        Link an Ethereum wallet on Base to mint your tree NFT, redeem mazorcas for $CACAO,
        and adopt with crypto. Read the <a href="/docs/CHARTER.md" style={linkStyle}>Charter</a>{' '}
        before signing — this binds your identity to an on-chain address.
      </p>

      <ol style={olStyle}>
        <Step n={1} label="Connect wallet" active={step === 'connect'} done={step !== 'connect'}>
          <ConnectWalletButton />
        </Step>

        <Step n={2} label={`Switch to Base (chain ${BASE_CHAIN_ID})`} active={step === 'switch'} done={['sign','kyc','done'].includes(step)}>
          {step === 'switch' && (
            <button
              onClick={() => switchChain({ chainId: base.id })}
              disabled={switching}
              style={btnStyle}
            >
              {switching ? 'SWITCHING…' : 'SWITCH TO BASE'}
            </button>
          )}
        </Step>

        <Step n={3} label="Sign SIWE message" active={step === 'sign'} done={['kyc','done'].includes(step)}>
          {step === 'sign' && (
            <button
              onClick={onSignAndLink}
              disabled={signing || linking}
              style={btnStyle}
            >
              {linking || signing ? 'SIGNING…' : 'SIGN & LINK WALLET'}
            </button>
          )}
          {kyc.walletAddress && (
            <p style={{ ...pStyle, fontSize: 12, marginTop: 8 }}>
              Linked: <span style={{ fontFamily: 'monospace' }}>{kyc.walletAddress}</span>
            </p>
          )}
        </Step>

        <Step n={4} label="Verify identity (KYC)" active={step === 'kyc'} done={step === 'done'}>
          {step === 'kyc' && (
            <p style={pStyle}>
              KYC is handled by Persona. Click below to start verification — required for mint, redeem,
              and crypto adoption per <a href="/docs/COMPLIANCE.md" style={linkStyle}>Compliance</a>.
            </p>
          )}
          {step === 'kyc' && (
            <button
              onClick={() => alert('Persona flow wiring pending — set PERSONA_TMPL_BASIC env + integrate hosted flow')}
              style={btnStyle}
              disabled
              title="Persona setup pending"
            >
              VERIFY IDENTITY (PENDING SETUP)
            </button>
          )}
        </Step>
      </ol>

      {err && <p style={{ ...pStyle, color: BRAND.theobroma, marginTop: 16 }}>Error: {err}</p>}

      {step === 'done' && (
        <div style={{ marginTop: 32, padding: 20, border: `1px solid ${BRAND.pod}`, background: BRAND.bgCard }}>
          <h2 style={{ ...h1Style, fontSize: 22 }}>WELCOME TO CAÚA WEB3</h2>
          <p style={pStyle}>
            Wallet linked, identity verified, ready to mint. Head to{' '}
            <a href="/app/adoptar" style={linkStyle}>Adoptar</a> to mint your first tree NFT on Base.
          </p>
        </div>
      )}
    </Shell>
  )
}

function Step({
  n, label, active, done, children,
}: { n: number; label: string; active: boolean; done: boolean; children?: React.ReactNode }) {
  const color = done ? BRAND.pod : active ? BRAND.mazorca : BRAND.heirloom
  return (
    <li style={{ borderLeft: `2px solid ${color}`, paddingLeft: 16, paddingBottom: 24, opacity: active || done ? 1 : 0.5 }}>
      <div style={{ fontFamily: FONTS.display, fontSize: 14, letterSpacing: '0.12em', color, marginBottom: 8 }}>
        {done ? '✓' : `STEP ${n}`} · {label}
      </div>
      {children}
    </li>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main style={{
      minHeight: '100vh',
      background: BRAND.bgDeep,
      color: BRAND.heirloom,
      padding: '64px 24px',
      fontFamily: FONTS.body,
    }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>{children}</div>
    </main>
  )
}

const h1Style: React.CSSProperties = {
  fontFamily: FONTS.display,
  fontSize: 42,
  letterSpacing: '0.08em',
  color: BRAND.heirloom,
  marginBottom: 16,
}
const pStyle: React.CSSProperties = { fontSize: 16, lineHeight: 1.6, color: BRAND.heirloom, marginBottom: 16 }
const linkStyle: React.CSSProperties = { color: BRAND.mazorca, textDecoration: 'underline' }
const olStyle: React.CSSProperties = { listStyle: 'none', padding: 0, marginTop: 32 }
const btnStyle: React.CSSProperties = {
  background: BRAND.mazorca,
  color: BRAND.bgDeep,
  border: 'none',
  padding: '12px 22px',
  fontFamily: FONTS.display,
  fontSize: 14,
  letterSpacing: '0.12em',
  cursor: 'pointer',
  textTransform: 'uppercase',
}

export default function Web3Onboarding() {
  return (
    <Web3Provider>
      <Inner />
    </Web3Provider>
  )
}
