import { useState } from 'react'
import { BRAND, FONTS } from '../../utils/constants'
import { crmApi, type DealCreate, STAGES } from '../../lib/crmApi'

interface Props { onCreated: () => void; onClose: () => void }

const INPUT = {
  background: '#1a1a1a', border: `1px solid ${BRAND.amazon}44`,
  borderRadius: 6, color: BRAND.heirloom, fontFamily: FONTS.body,
  fontSize: 12, padding: '8px 10px', width: '100%', boxSizing: 'border-box' as const,
}
const LABEL = { fontFamily: FONTS.body, fontSize: 10, color: `${BRAND.heirloom}99`,
  letterSpacing: '0.12em', textTransform: 'uppercase' as const, display: 'block', marginBottom: 4 }

export default function CotizacionForm({ onCreated, onClose }: Props) {
  const [form, setForm] = useState<DealCreate>({
    title: '', contact_name: '', contact_email: '', contact_role: '',
    company_name: '', company_domain: '', value_cop: 100000,
    stage: 'abierto', notes: '', expected_close_date: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof DealCreate, v: string | number) =>
    setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.contact_email || !form.contact_name) {
      setError('Título, nombre y email son obligatorios')
      return
    }
    setSaving(true)
    try {
      const { deal } = await crmApi.createDeal(form)
      await crmApi.syncHubSpot(deal.id)      // auto-sync to HubSpot on create
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear cotización')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: '#00000088', zIndex: 50 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        background: '#111', border: `1px solid ${BRAND.amazon}55`, borderRadius: 12,
        padding: 28, width: 480, maxHeight: '85vh', overflowY: 'auto', zIndex: 51,
      }}>
        <h2 style={{ fontFamily: FONTS.display, color: BRAND.heirloom, fontSize: 15,
          fontWeight: 900, letterSpacing: '0.08em', marginBottom: 20 }}>
          NUEVA COTIZACIÓN B2B
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={LABEL}>Título del negocio *</label>
            <input style={INPUT} value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Ej: Catación Cinco Tiempos — CESA" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={LABEL}>Nombre contacto *</label>
              <input style={INPUT} value={form.contact_name}
                onChange={e => set('contact_name', e.target.value)} />
            </div>
            <div>
              <label style={LABEL}>Cargo</label>
              <input style={INPUT} value={form.contact_role}
                onChange={e => set('contact_role', e.target.value)} />
            </div>
          </div>

          <div>
            <label style={LABEL}>Email contacto *</label>
            <input style={INPUT} type="email" value={form.contact_email}
              onChange={e => set('contact_email', e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={LABEL}>Empresa</label>
              <input style={INPUT} value={form.company_name}
                onChange={e => set('company_name', e.target.value)} />
            </div>
            <div>
              <label style={LABEL}>Dominio web</label>
              <input style={INPUT} value={form.company_domain}
                placeholder="empresa.com"
                onChange={e => set('company_domain', e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={LABEL}>Valor (COP)</label>
              <input style={INPUT} type="number" value={form.value_cop}
                onChange={e => set('value_cop', Number(e.target.value))} />
            </div>
            <div>
              <label style={LABEL}>Etapa</label>
              <select style={{ ...INPUT, appearance: 'none' }}
                value={form.stage}
                onChange={e => set('stage', e.target.value)}>
                {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={LABEL}>Fecha cierre esperada</label>
            <input style={INPUT} type="date" value={form.expected_close_date}
              onChange={e => set('expected_close_date', e.target.value)} />
          </div>

          <div>
            <label style={LABEL}>Notas</label>
            <textarea style={{ ...INPUT, minHeight: 70, resize: 'vertical' }}
              value={form.notes}
              onChange={e => set('notes', e.target.value)} />
          </div>

          {error && <p style={{ color: '#e05', fontSize: 11, margin: 0 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: 10, borderRadius: 8, background: '#1a1a1a',
              border: `1px solid ${BRAND.amazon}44`, color: `${BRAND.heirloom}cc`,
              cursor: 'pointer', fontFamily: FONTS.display, fontWeight: 700, fontSize: 11,
            }}>Cancelar</button>
            <button type="submit" disabled={saving} style={{
              flex: 1, padding: 10, borderRadius: 8,
              background: saving ? '#333' : `linear-gradient(135deg, ${BRAND.pod}, ${BRAND.criollo})`,
              border: 'none', color: BRAND.heirloom, cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: FONTS.display, fontWeight: 700, fontSize: 11,
            }}>{saving ? 'Guardando…' : 'Crear + Sync HubSpot'}</button>
          </div>
        </form>
      </div>
    </>
  )
}
