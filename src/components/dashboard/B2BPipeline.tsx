import { useState, useEffect } from 'react'
import { BRAND, FONTS } from '../../utils/constants'
import { crmApi, type Deal, type Activity, STAGES } from '../../lib/crmApi'
import { hsTrackEvent } from '../../lib/hubspotTracking'
import CotizacionForm from './CotizacionForm'

/* ── helpers ─────────────────────────────────────────────── */
const fmt = (cop: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(cop)
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('es-CO', { day:'2-digit', month:'short' }) : '—'

const ACTIVITY_ICON: Record<string, string> = {
  nota: '📝', email_enviado: '📧', llamada: '📞', reunion: '🤝',
  propuesta_vista: '👁', stage_change: '→', hubspot_sync: '🔄', cotizacion_creada: '✨',
}

/* ── DealDetail (slide panel) ────────────────────────────── */
function DealDetail({ deal, onClose, onStageChange }: {
  deal: Deal; onClose: () => void
  onStageChange: (id: string, stage: string) => void
}) {
  const [acts, setActs] = useState<Activity[]>([])
  const [newNote, setNewNote] = useState('')
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    crmApi.getDeal(deal.id).then(r => setActs(r.activities))
  }, [deal.id])

  async function addNote() {
    if (!newNote.trim()) return
    await crmApi.addActivity(deal.id, 'nota', newNote)
    hsTrackEvent('CRM Activity Logged', { deal_id: deal.id, type: 'nota' })
    setActs(a => [{ id: Date.now().toString(), deal_id: deal.id, type: 'nota',
      description: newNote, metadata: {}, created_by: 'admin',
      created_at: new Date().toISOString() }, ...a])
    setNewNote('')
  }

  async function syncHS() {
    setSyncing(true)
    try {
      const r = await crmApi.syncHubSpot(deal.id)
      hsTrackEvent('CRM HubSpot Synced', { deal_id: deal.id, hubspot_id: r.hubspot_deal_id })
      alert(`✓ Sincronizado con HubSpot (${r.hubspot_deal_id})`)
    } catch { alert('Error al sincronizar con HubSpot') }
    setSyncing(false)
  }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'#00000066', zIndex:40 }} />
      <div style={{ position:'fixed', right:0, top:0, bottom:0, width:400, background:'#111',
        borderLeft:`1px solid ${BRAND.amazon}33`, zIndex:41, overflowY:'auto', padding:24, display:'flex', flexDirection:'column', gap:16 }}>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
          <div>
            <p style={{ fontFamily:FONTS.display, fontSize:13, fontWeight:900,
              color:BRAND.heirloom, margin:0 }}>{deal.title}</p>
            <p style={{ fontFamily:FONTS.body, fontSize:10, color:`${BRAND.heirloom}77`, margin:0 }}>
              {deal.crm_companies?.name} · {deal.contact_name}
            </p>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none',
            color:`${BRAND.heirloom}77`, cursor:'pointer', fontSize:18 }}>✕</button>
        </div>

        {/* Stage selector */}
        <div>
          <p style={{ ...FONTS, fontFamily:FONTS.body, fontSize:10, color:`${BRAND.heirloom}66`,
            letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>Etapa</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
            {STAGES.map(s => (
              <button key={s.key} onClick={() => onStageChange(deal.id, s.key)} style={{
                padding:'4px 10px', borderRadius:20, fontFamily:FONTS.body, fontSize:10,
                fontWeight:deal.stage === s.key ? 700 : 400,
                background: deal.stage === s.key ? s.color : '#1a1a1a',
                border:`1px solid ${s.color}`, color:BRAND.heirloom, cursor:'pointer',
              }}>{s.label}</button>
            ))}
          </div>
        </div>

        {/* Deal info */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {[
            ['Valor', fmt(deal.value_cop)],
            ['Cierre esperado', fmtDate(deal.expected_close_date)],
            ['Email', deal.contact_email],
            ['HubSpot ID', deal.hubspot_deal_id ?? '—'],
          ].map(([k, v]) => (
            <div key={k} style={{ background:'#1a1a1a', borderRadius:6, padding:'8px 10px' }}>
              <p style={{ fontFamily:FONTS.body, fontSize:9, color:`${BRAND.heirloom}55`,
                letterSpacing:'0.1em', textTransform:'uppercase', margin:'0 0 2px' }}>{k}</p>
              <p style={{ fontFamily:FONTS.body, fontSize:11, color:BRAND.heirloom, margin:0,
                wordBreak:'break-all' }}>{v}</p>
            </div>
          ))}
        </div>

        {/* HubSpot sync */}
        <button onClick={syncHS} disabled={syncing} style={{
          padding:'8px 12px', borderRadius:8, fontFamily:FONTS.display, fontWeight:700,
          fontSize:10, background: syncing ? '#333' : '#1a1a2a',
          border:`1px solid ${BRAND.amazon}55`, color:BRAND.heirloom, cursor: syncing ? 'not-allowed' : 'pointer',
        }}>{syncing ? 'Sincronizando…' : '🔄 Sync HubSpot'}</button>

        {/* Add note */}
        <div>
          <textarea value={newNote} onChange={e => setNewNote(e.target.value)}
            placeholder="Agregar nota o actividad…"
            style={{ width:'100%', boxSizing:'border-box', background:'#1a1a1a',
              border:`1px solid ${BRAND.amazon}33`, borderRadius:6, color:BRAND.heirloom,
              fontFamily:FONTS.body, fontSize:11, padding:'8px 10px', minHeight:60, resize:'vertical' }} />
          <button onClick={addNote} style={{ marginTop:6, padding:'6px 14px', borderRadius:6,
            background:`${BRAND.pod}cc`, border:'none', color:BRAND.heirloom,
            fontFamily:FONTS.display, fontWeight:700, fontSize:10, cursor:'pointer' }}>
            + Nota
          </button>
        </div>

        {/* Activity timeline */}
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <p style={{ fontFamily:FONTS.body, fontSize:10, color:`${BRAND.heirloom}55`,
            letterSpacing:'0.1em', textTransform:'uppercase', margin:0 }}>Actividad</p>
          {acts.map(a => (
            <div key={a.id} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
              <span style={{ fontSize:14, flexShrink:0 }}>{ACTIVITY_ICON[a.type] ?? '•'}</span>
              <div>
                <p style={{ fontFamily:FONTS.body, fontSize:11, color:BRAND.heirloom,
                  margin:'0 0 2px' }}>{a.description}</p>
                <p style={{ fontFamily:FONTS.body, fontSize:9, color:`${BRAND.heirloom}55`, margin:0 }}>
                  {fmtDate(a.created_at)} · {a.created_by}
                </p>
              </div>
            </div>
          ))}
          {acts.length === 0 && (
            <p style={{ fontFamily:FONTS.body, fontSize:11, color:`${BRAND.heirloom}44` }}>
              Sin actividad registrada
            </p>
          )}
        </div>
      </div>
    </>
  )
}

/* ── DealCard ─────────────────────────────────────────────── */
function DealCard({ deal, onClick }: { deal: Deal; onClick: () => void }) {
  const stage = STAGES.find(s => s.key === deal.stage)
  return (
    <div onClick={onClick} style={{ background:'#1a1a1a', border:`1px solid ${BRAND.amazon}22`,
      borderLeft:`3px solid ${stage?.color ?? BRAND.amazon}`, borderRadius:8,
      padding:'12px 14px', cursor:'pointer', display:'flex', flexDirection:'column', gap:6,
      transition:'border-color 0.2s' }}>
      <p style={{ fontFamily:FONTS.display, fontSize:12, fontWeight:700,
        color:BRAND.heirloom, margin:0, lineHeight:1.3 }}>{deal.title}</p>
      <p style={{ fontFamily:FONTS.body, fontSize:10, color:`${BRAND.heirloom}88`, margin:0 }}>
        {deal.crm_companies?.name ?? '—'} · {deal.contact_name}
      </p>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontFamily:FONTS.body, fontSize:11, color:BRAND.criollo, fontWeight:700 }}>
          {fmt(deal.value_cop)}
        </span>
        {deal.hubspot_deal_id && (
          <span style={{ fontFamily:FONTS.body, fontSize:9, color:`${BRAND.amazon}aa`,
            background:`${BRAND.amazon}11`, padding:'2px 6px', borderRadius:10 }}>HS</span>
        )}
      </div>
      {deal.last_activity && (
        <p style={{ fontFamily:FONTS.body, fontSize:9, color:`${BRAND.heirloom}44`, margin:0 }}>
          {ACTIVITY_ICON[deal.last_activity.type] ?? '•'} {deal.last_activity.description.slice(0, 50)}
        </p>
      )}
    </div>
  )
}

/* ── B2BPipeline (main) ──────────────────────────────────── */
export default function B2BPipeline() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [selected, setSelected] = useState<Deal | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    crmApi.listDeals().then(r => { setDeals(r.deals); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleStageChange(id: string, stage: string) {
    await crmApi.patchDeal(id, { stage })
    hsTrackEvent('CRM Deal Stage Changed', { deal_id: id, new_stage: stage })
    setDeals(prev => prev.map(d => d.id === id ? { ...d, stage } : d))
    if (selected?.id === id) setSelected(s => s ? { ...s, stage } : s)
  }

  const totalOpen = deals
    .filter(d => !['ganado','perdido'].includes(d.stage))
    .reduce((s, d) => s + d.value_cop, 0)
  const totalWon = deals.filter(d => d.stage === 'ganado').reduce((s, d) => s + d.value_cop, 0)

  return (
    <div style={{ padding: '0 0 40px' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div style={{ display:'flex', gap:20 }}>
          <div>
            <p style={{ fontFamily:FONTS.body, fontSize:9, color:`${BRAND.heirloom}55`,
              letterSpacing:'0.12em', textTransform:'uppercase', margin:0 }}>Pipeline abierto</p>
            <p style={{ fontFamily:FONTS.display, fontSize:18, fontWeight:900,
              color:BRAND.heirloom, margin:0 }}>{fmt(totalOpen)}</p>
          </div>
          <div>
            <p style={{ fontFamily:FONTS.body, fontSize:9, color:`${BRAND.heirloom}55`,
              letterSpacing:'0.12em', textTransform:'uppercase', margin:0 }}>Ganado</p>
            <p style={{ fontFamily:FONTS.display, fontSize:18, fontWeight:900,
              color:BRAND.pod, margin:0 }}>{fmt(totalWon)}</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} style={{
          padding:'8px 16px', borderRadius:8, fontFamily:FONTS.display, fontWeight:700,
          fontSize:11, background:`linear-gradient(135deg, ${BRAND.pod}, ${BRAND.criollo})`,
          border:'none', color:BRAND.heirloom, cursor:'pointer', letterSpacing:'0.05em',
        }}>+ NUEVA COTIZACIÓN</button>
      </div>

      {/* Kanban */}
      {loading ? (
        <p style={{ fontFamily:FONTS.body, fontSize:11, color:`${BRAND.heirloom}44` }}>Cargando…</p>
      ) : (
        <div style={{ display:'flex', gap:12, overflowX:'auto', paddingBottom:8 }}>
          {STAGES.filter(s => s.key !== 'perdido').map(stage => {
            const col = deals.filter(d => d.stage === stage.key)
            return (
              <div key={stage.key} style={{ minWidth:220, flex:'0 0 220px' }}>
                <div style={{ display:'flex', justifyContent:'space-between',
                  alignItems:'center', marginBottom:10 }}>
                  <p style={{ fontFamily:FONTS.display, fontSize:10, fontWeight:700,
                    color:stage.color, margin:0, letterSpacing:'0.08em',
                    textTransform:'uppercase' }}>{stage.label}</p>
                  <span style={{ fontFamily:FONTS.body, fontSize:10,
                    color:`${BRAND.heirloom}44` }}>{col.length}</span>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {col.map(d => (
                    <DealCard key={d.id} deal={d} onClick={() => setSelected(d)} />
                  ))}
                  {col.length === 0 && (
                    <div style={{ border:`1px dashed ${BRAND.amazon}22`, borderRadius:8,
                      height:60, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <span style={{ fontFamily:FONTS.body, fontSize:10,
                        color:`${BRAND.heirloom}22` }}>vacío</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {selected && (
        <DealDetail deal={selected} onClose={() => setSelected(null)}
          onStageChange={handleStageChange} />
      )}
      {showForm && (
        <CotizacionForm onClose={() => setShowForm(false)}
          onCreated={() => { setShowForm(false); load() }} />
      )}
    </div>
  )
}
