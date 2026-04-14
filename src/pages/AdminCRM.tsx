/**
 * AdminCRM — internal CRM dashboard.
 * Only visible to amauryamed@gmail.com (isAdmin from AuthContext).
 * Reads user_profiles + lot_investments + orders + cacao_trees from Supabase.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BRAND, FONTS, GUARDIANS } from '../utils/constants'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { UserProfile, CacaoTree } from '../lib/database.types'

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

interface EmailRow {
  id: string
  user_id: string
  email: string
  type: string
  subject: string
  status: string
  created_at: string
}

interface TreeRow {
  id: string
  user_id: string
  email: string
  guardian_name: string
  variety: string
  stage: string
  co2_kg: number
  adopted_at: string
}

export default function AdminCRM() {
  const { isAdmin, loading } = useAuth()
  const navigate = useNavigate()

  const [users,  setUsers]  = useState<UserProfile[]>([])
  const [invs,   setInvs]   = useState<InvestRow[]>([])
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [emails, setEmails] = useState<EmailRow[]>([])
  const [trees,  setTrees]  = useState<TreeRow[]>([])
  const [tab,    setTab]    = useState<'users' | 'investments' | 'orders' | 'emails' | 'trees'>('users')
  const [fetching, setFetching] = useState(true)
  const [editUser, setEditUser] = useState<UserProfile | null>(null)

  useEffect(() => {
    if (loading) return
    if (!isAdmin) { navigate('/'); return }

    Promise.all([
      supabase.from('user_profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('lot_investments').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('email_log').select('*').order('created_at', { ascending: false }),
      supabase.from('cacao_trees').select('*').order('adopted_at', { ascending: false }),
    ]).then(async ([u, i, o, e, t]) => {
      setUsers((u.data as UserProfile[]) ?? [])
      setInvs((i.data as InvestRow[]) ?? [])
      setOrders((o.data as OrderRow[]) ?? [])
      setEmails((e.data as EmailRow[]) ?? [])

      // Map cacao_trees with user emails
      const cacaoTrees = (t.data as CacaoTree[]) ?? []
      const treeRows: TreeRow[] = []

      for (const tree of cacaoTrees) {
        const user = (u.data as UserProfile[])?.find(up => up.user_id === tree.user_id)
        const guardian = GUARDIANS[tree.guardian_id] || { name: `Guardian #${tree.guardian_id}` }

        treeRows.push({
          id: tree.id,
          user_id: tree.user_id,
          email: user?.email ?? '—',
          guardian_name: guardian.name,
          variety: tree.variety,
          stage: tree.stage,
          co2_kg: tree.co2_kg,
          adopted_at: tree.adopted_at,
        })
      }

      setTrees(treeRows)
      setFetching(false)
    })
  }, [isAdmin, loading, navigate])

  if (loading || fetching) return <LoadingScreen />
  if (!isAdmin) return null

  const totalRaised = invs.reduce((s, i) => s + i.amount_usd_cents, 0)
  const totalLots   = invs.reduce((s, i) => s + i.lots_count, 0)
  const totalTrees  = trees.length
  const usersWithTrees = new Set(trees.map(t => t.user_id)).size

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
            { label: 'Árboles adoptados', value: totalTrees },
            { label: 'Usuarios con árboles', value: usersWithTrees },
            { label: 'Capital USD', value: '$' + (totalRaised / 100).toLocaleString('en-US', { maximumFractionDigits: 0 }) },
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
          {(['users', 'investments', 'orders', 'emails', 'trees'] as const).map(t => (
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
              {t === 'users' ? `Usuarios (${users.length})` : t === 'investments' ? `Inversiones (${invs.length})` : t === 'orders' ? `Órdenes (${orders.length})` : t === 'emails' ? `Emails (${emails.length})` : `Árboles (${trees.length})`}
            </button>
          ))}
        </div>

        {tab === 'users' && <UsersTable users={users} onEdit={setEditUser} />}
        {tab === 'investments' && <InvestmentsTable rows={invs} />}
        {tab === 'orders' && <OrdersTable rows={orders} />}
        {tab === 'emails' && <EmailsTable rows={emails} />}
        {tab === 'trees' && <TreesTable rows={trees} />}

        {editUser && <EditUserPanel user={editUser} onClose={() => setEditUser(null)} onSave={(u) => { setUsers(users.map(x => x.id === u.id ? u : x)); setEditUser(null) }} />}
      </div>
    </div>
  )
}

function UsersTable({ users, onEdit }: { users: UserProfile[]; onEdit: (u: UserProfile) => void }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONTS.body, fontSize: 12 }}>
        <thead>
          <TR header>
            <TD>Email</TD><TD>Nombre</TD><TD>Región</TD><TD>Rol</TD>
            <TD>Puntuación</TD><TD>Streak</TD><TD>Órdenes</TD><TD>Referidos</TD><TD>Registro</TD>
          </TR>
        </thead>
        <tbody>
          {users.map(u => (
            <TR key={u.id}>
              <TD accent onClick={() => onEdit(u)} style={{ cursor: 'pointer' }}>{u.email}</TD>
              <TD onClick={() => onEdit(u)} style={{ cursor: 'pointer' }}>{u.full_name ?? '—'}</TD>
              <TD onClick={() => onEdit(u)} style={{ cursor: 'pointer' }}>{u.region}</TD>
              <TD><RoleBadge role={u.caua_role} /></TD>
              <TD>
                <div style={{ display: 'flex', gap: 2 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} style={{ fontSize: 14, cursor: 'pointer', opacity: i < (u.lead_score || 1) ? 1 : 0.2 }}>
                      🫘
                    </span>
                  ))}
                </div>
              </TD>
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

function EmailsTable({ rows }: { rows: EmailRow[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONTS.body, fontSize: 12 }}>
        <thead>
          <TR header>
            <TD>Email</TD><TD>Tipo</TD><TD>Asunto</TD><TD>Estado</TD><TD>Fecha</TD>
          </TR>
        </thead>
        <tbody>
          {rows.map(r => (
            <TR key={r.id}>
              <TD>{r.email}</TD>
              <TD><EmailTypeBadge type={r.type} /></TD>
              <TD dim>{r.subject ?? '—'}</TD>
              <TD><EmailStatusBadge status={r.status} /></TD>
              <TD dim>{new Date(r.created_at).toLocaleDateString('es-CO')}</TD>
            </TR>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TreesTable({ rows }: { rows: TreeRow[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONTS.body, fontSize: 12 }}>
        <thead>
          <TR header>
            <TD>Email</TD><TD>Guardián</TD><TD>Variedad</TD><TD>Etapa</TD><TD>CO₂ kg</TD><TD>Adoptado</TD>
          </TR>
        </thead>
        <tbody>
          {rows.map(r => (
            <TR key={r.id}>
              <TD>{r.email}</TD>
              <TD accent>{r.guardian_name}</TD>
              <TD>{r.variety}</TD>
              <TD>{r.stage}</TD>
              <TD accent>{r.co2_kg}</TD>
              <TD dim>{new Date(r.adopted_at).toLocaleDateString('es-CO')}</TD>
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

function TD({ children, accent, dim, onClick, style }: { children: React.ReactNode; accent?: boolean; dim?: boolean; onClick?: () => void; style?: React.CSSProperties }) {
  return (
    <td onClick={onClick} style={{
      padding: '10px 14px',
      color: accent ? BRAND.pod : dim ? `${BRAND.heirloom}44` : `${BRAND.heirloom}cc`,
      fontWeight: accent ? 700 : 400,
      whiteSpace: 'nowrap',
      ...style,
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

function EmailTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    order_created: BRAND.pod,
    payment_confirmed: BRAND.criollo,
    recovery: BRAND.mazorca,
    confirmation: BRAND.theobroma,
  }
  const c = colors[type] ?? BRAND.heirloom
  return (
    <span style={{
      fontFamily: FONTS.display, fontWeight: 700, fontSize: 8, letterSpacing: '0.1em',
      padding: '2px 8px', borderRadius: 999,
      background: `${c}18`, color: c, border: `1px solid ${c}33`,
    }}>
      {type.replace(/_/g, ' ').toUpperCase()}
    </span>
  )
}

function EmailStatusBadge({ status }: { status: string }) {
  const c = status === 'sent' ? BRAND.pod : status === 'failed' ? BRAND.radioRed : BRAND.mazorca
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

function EditUserPanel({ user, onClose, onSave }: { user: UserProfile; onClose: () => void; onSave: (u: UserProfile) => void }) {
  const [formData, setFormData] = useState(user)

  const handleSave = async () => {
    const { error } = await supabase.from('user_profiles').update(formData).eq('id', user.id)
    if (!error) onSave(formData)
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(4,12,6,0.88)', backdropFilter: 'blur(8px)', zIndex: 500 }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 501,
        width: 'min(400px, 90vw)', background: BRAND.bgDark,
        borderLeft: `1px solid ${BRAND.amazon}44`,
        display: 'flex', flexDirection: 'column', padding: '20px 24px',
        overflowY: 'auto',
      }}>
        <div style={{ fontFamily: FONTS.display, fontWeight: 900, fontSize: 16, color: BRAND.heirloom, marginBottom: 24 }}>
          Editar usuario
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
          <div>
            <label style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 10, color: `${BRAND.heirloom}66`, display: 'block', marginBottom: 6 }}>NOMBRE</label>
            <input
              type="text"
              value={formData.full_name || ''}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: BRAND.bgCard, border: `1px solid ${BRAND.amazon}44`, color: BRAND.heirloom, fontFamily: FONTS.body, fontSize: 12 }}
            />
          </div>

          <div>
            <label style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 10, color: `${BRAND.heirloom}66`, display: 'block', marginBottom: 6 }}>REGIÓN</label>
            <input
              type="text"
              value={formData.region || ''}
              onChange={(e) => setFormData({ ...formData, region: e.target.value as "EU" | "US" | "CO" | "OTHER" })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: BRAND.bgCard, border: `1px solid ${BRAND.amazon}44`, color: BRAND.heirloom, fontFamily: FONTS.body, fontSize: 12 }}
            />
          </div>

          <div>
            <label style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 10, color: `${BRAND.heirloom}66`, display: 'block', marginBottom: 6 }}>ROL</label>
            <select
              value={formData.caua_role}
              onChange={(e) => setFormData({ ...formData, caua_role: e.target.value as any })}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: BRAND.bgCard, border: `1px solid ${BRAND.amazon}44`, color: BRAND.heirloom, fontFamily: FONTS.body, fontSize: 12 }}
            >
              <option value="creyente">Creyente</option>
              <option value="nativo">Nativo</option>
              <option value="investor">Inversor</option>
              <option value="farmer">Agricultor</option>
              <option value="founder">Fundador</option>
            </select>
          </div>

          <div>
            <label style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 10, color: `${BRAND.heirloom}66`, display: 'block', marginBottom: 6 }}>PUNTUACIÓN LEAD (🫘)</label>
            <div style={{ display: 'flex', gap: 4 }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setFormData({ ...formData, lead_score: i + 1 })}
                  style={{
                    flex: 1, padding: '8px', borderRadius: 8,
                    background: i < (formData.lead_score || 1) ? `${BRAND.pod}33` : BRAND.bgCard,
                    border: `1px solid ${i < (formData.lead_score || 1) ? BRAND.pod : BRAND.amazon}44`,
                    fontSize: 16, cursor: 'pointer',
                  }}
                >
                  🫘
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '10px', borderRadius: 8, background: BRAND.bgCard, border: `1px solid ${BRAND.amazon}44`, color: `${BRAND.heirloom}cc`, cursor: 'pointer', fontFamily: FONTS.display, fontWeight: 700, fontSize: 11 }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            style={{ flex: 1, padding: '10px', borderRadius: 8, background: `linear-gradient(135deg, ${BRAND.pod}, ${BRAND.criollo})`, border: 'none', color: BRAND.heirloom, cursor: 'pointer', fontFamily: FONTS.display, fontWeight: 700, fontSize: 11 }}
          >
            Guardar
          </button>
        </div>
      </div>
    </>
  )
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', background: BRAND.bgDeep, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: FONTS.body, fontSize: 11, color: `${BRAND.heirloom}33`, letterSpacing: '0.2em' }}>Cargando CRM…</div>
    </div>
  )
}
