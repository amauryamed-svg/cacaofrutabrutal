/**
 * AdminCRM — internal CRM dashboard.
 * Only visible to amauryamed@gmail.com (isAdmin from AuthContext).
 * Reads user_profiles + lot_investments + orders from Supabase.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BRAND, FONTS } from '../utils/constants'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { UserProfile } from '../lib/database.types'

interface InvestRow {
  id: string
  user_id: string
  lots_count: number
  amount_usd_cents: number
  currency: string
  created_at: string
  technology_id: string
}

interface OrderRow {
  id: string
  user_id: string
  amount_cents: number
  currency: string
  status: string
  payment_provider: string
  created_at: string
}

export default function AdminCRM() {
  const { isAdmin, loading } = useAuth()
  const navigate = useNavigate()

  const [users,  setUsers]  = useState<UserProfile[]>([])
  const [invs,   setInvs]   = useState<InvestRow[]>([])
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [tab,    setTab]    = useState<'users' | 'investments' | 'orders'>('users')
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (loading) return
    if (!isAdmin) { navigate('/'); return }

    Promise.all([
      supabase.from('user_profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('lot_investments').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
    ]).then(([u, i, o]) => {
      setUsers((u.data as UserProfile[]) ?? [])
      setInvs((i.data as InvestRow[]) ?? [])
      setOrders((o.data as OrderRow[]) ?? [])
      setFetching(false)
    })
  }, [isAdmin, loading, navigate])

  if (loading || fetching) return <LoadingScreen />
  if (!isAdmin) return null

  const totalRaised = invs.reduce((s, i) => s + i.amount_usd_cents, 0)
  const totalLots   = invs.reduce((s, i) => s + i.lots_count, 0)

  return (
    <div style={{ minHeight: '100vh', background: BRAND.bgDeep, paddingTop: 64 }}>
      {/* Header */}
      <div style={{ background: BRAND.bgDark, borderBottom: `1px solid ${BRAND.amazon}44`, padding: '20px var(--space-page)' }}>
        <p style={{ fontFamily: FONTS.serif, fontStyle: 'italic', fontSize: 11, color: BRAND.mazorca, letterSpacing: '0.2em', marginBottom: 6 }}>
          Super Admin · amauryamed@gmail.com
        </p>
        <h1 style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 'clamp(20px,4vw,32px)', color: BRAND.heirloom, textTransform: 'uppercase', margin: 0 }}>
          CRM INTERNO CAUA
        </h1>

        {/* KPIs */}
        <div style={{ display: 'flex', gap: 24, marginTop: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Usuarios', value: users.length },
            { label: 'Inversiones', value: invs.length },
            { label: 'Lotes totales', value: totalLots },
            { label: 'Capital USD', value: '$' + (totalRaised / 100).toLocaleString('en-US', { maximumFractionDigits: 0 }) },
            { label: 'Órdenes', value: orders.length },
          ].map(k => (
            <div key={k.label} style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.amazon}44`, borderRadius: 12, padding: '12px 20px' }}>
              <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 22, color: BRAND.pod }}>{k.value}</div>
              <div style={{ fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}55`, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{k.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 var(--space-page)', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${BRAND.amazon}33`, marginBottom: 24, marginTop: 24 }}>
          {(['users', 'investments', 'orders'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '8px 20px', border: 'none', cursor: 'pointer', borderRadius: '8px 8px 0 0',
                background: tab === t ? BRAND.bgCard : 'transparent',
                borderBottom: tab === t ? `2px solid ${BRAND.pod}` : '2px solid transparent',
                fontFamily: FONTS.display, fontWeight: 700, fontSize: 10, letterSpacing: '0.1em',
                color: tab === t ? BRAND.pod : `${BRAND.heirloom}55`,
                textTransform: 'uppercase',
              }}
            >
              {t === 'users' ? `Usuarios (${users.length})` : t === 'investments' ? `Inversiones (${invs.length})` : `Órdenes (${orders.length})`}
            </button>
          ))}
        </div>

        {tab === 'users' && <UsersTable users={users} />}
        {tab === 'investments' && <InvestmentsTable rows={invs} />}
        {tab === 'orders' && <OrdersTable rows={orders} />}
      </div>
    </div>
  )
}

function UsersTable({ users }: { users: UserProfile[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONTS.body, fontSize: 12 }}>
        <thead>
          <TR header>
            <TD>Email</TD><TD>Nombre</TD><TD>Región</TD><TD>Rol</TD>
            <TD>Streak</TD><TD>Órdenes</TD><TD>Referidos</TD><TD>Registro</TD>
          </TR>
        </thead>
        <tbody>
          {users.map(u => (
            <TR key={u.id}>
              <TD accent>{u.email}</TD>
              <TD>{u.full_name ?? '—'}</TD>
              <TD>{u.region}</TD>
              <TD><RoleBadge role={u.caua_role} /></TD>
              <TD>{u.ritual_streak}</TD>
              <TD>{u.completed_orders}</TD>
              <TD>{u.referral_count}</TD>
              <TD dim>{new Date(u.created_at).toLocaleDateString('es-CO')}</TD>
            </TR>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function InvestmentsTable({ rows }: { rows: InvestRow[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONTS.body, fontSize: 12 }}>
        <thead>
          <TR header>
            <TD>ID</TD><TD>Lotes</TD><TD>Monto USD</TD><TD>Moneda</TD><TD>Fecha</TD>
          </TR>
        </thead>
        <tbody>
          {rows.map(r => (
            <TR key={r.id}>
              <TD dim>{r.id.slice(0, 8)}…</TD>
              <TD accent>{r.lots_count}</TD>
              <TD>${(r.amount_usd_cents / 100).toFixed(2)}</TD>
              <TD>{r.currency}</TD>
              <TD dim>{new Date(r.created_at).toLocaleDateString('es-CO')}</TD>
            </TR>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function OrdersTable({ rows }: { rows: OrderRow[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONTS.body, fontSize: 12 }}>
        <thead>
          <TR header>
            <TD>ID</TD><TD>Monto</TD><TD>Moneda</TD><TD>Estado</TD><TD>Pasarela</TD><TD>Fecha</TD>
          </TR>
        </thead>
        <tbody>
          {rows.map(r => (
            <TR key={r.id}>
              <TD dim>{r.id.slice(0, 8)}…</TD>
              <TD accent>${(r.amount_cents / 100).toFixed(2)}</TD>
              <TD>{r.currency}</TD>
              <TD><StatusBadge status={r.status} /></TD>
              <TD>{r.payment_provider}</TD>
              <TD dim>{new Date(r.created_at).toLocaleDateString('es-CO')}</TD>
            </TR>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Table helpers ─────────────────────────────────────────────────────────────
function TR({ children, header }: { children: React.ReactNode; header?: boolean }) {
  return (
    <tr style={{
      borderBottom: `1px solid ${BRAND.amazon}22`,
      background: header ? BRAND.bgCard : 'transparent',
    }}>
      {children}
    </tr>
  )
}

function TD({ children, accent, dim }: { children: React.ReactNode; accent?: boolean; dim?: boolean }) {
  return (
    <td style={{
      padding: '10px 14px',
      color: accent ? BRAND.pod : dim ? `${BRAND.heirloom}44` : `${BRAND.heirloom}cc`,
      fontWeight: accent ? 700 : 400,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </td>
  )
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    investor: '#00A3CD', founder: BRAND.heirloom, colono: BRAND.mazorca,
    creyente: BRAND.pod, nativo: BRAND.criollo, farmer: BRAND.theobroma,
  }
  const c = colors[role] ?? BRAND.pod
  return (
    <span style={{
      fontFamily: FONTS.display, fontWeight: 700, fontSize: 8, letterSpacing: '0.1em',
      padding: '2px 8px', borderRadius: 999,
      background: `${c}18`, color: c, border: `1px solid ${c}33`,
    }}>
      {role.toUpperCase()}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const c = status === 'completed' ? BRAND.pod : status === 'failed' ? BRAND.radioRed : BRAND.mazorca
  return (
    <span style={{
      fontFamily: FONTS.display, fontWeight: 700, fontSize: 8, letterSpacing: '0.1em',
      padding: '2px 8px', borderRadius: 999,
      background: `${c}18`, color: c, border: `1px solid ${c}33`,
    }}>
      {status.toUpperCase()}
    </span>
  )
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', background: BRAND.bgDeep, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}33`, letterSpacing: '0.2em' }}>Cargando CRM…</div>
    </div>
  )
}
