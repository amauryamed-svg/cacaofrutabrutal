/**
 * CAUA CRM API client — calls FastAPI at /api/crm
 * All writes go through FastAPI (not Supabase directly).
 */

const BASE = '/api/crm'
const CRM_KEY = import.meta.env.VITE_CRM_SECRET ?? ''

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-CRM-Key': CRM_KEY },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`CRM API ${method} ${path} → ${res.status}`)
  return res.json() as Promise<T>
}

export interface Deal {
  id: string
  title: string
  contact_name: string
  contact_email: string
  contact_role?: string
  stage: string
  value_cop: number
  notes?: string
  expected_close_date?: string
  cotizacion_slug?: string
  hubspot_deal_id?: string
  hubspot_synced_at?: string
  created_at: string
  updated_at: string
  crm_companies?: { name: string; domain: string; industry: string }
  last_activity?: { type: string; description: string; created_at: string }
}

export interface Activity {
  id: string
  deal_id: string
  type: string
  description: string
  metadata: Record<string, unknown>
  created_by: string
  created_at: string
}

export interface DealCreate {
  title: string
  contact_name: string
  contact_email: string
  contact_role?: string
  company_name?: string
  company_domain?: string
  value_cop: number
  stage?: string
  notes?: string
  expected_close_date?: string
  cotizacion_slug?: string
}

export const crmApi = {
  listDeals: ()                          => req<{ deals: Deal[]; total: number }>('GET', '/deals'),
  createDeal: (body: DealCreate)         => req<{ deal: Deal }>('POST', '/deals', body),
  getDeal: (id: string)                  => req<{ deal: Deal; activities: Activity[] }>('GET', `/deals/${id}`),
  patchDeal: (id: string, p: Partial<Deal>) => req<{ updated: boolean }>('PATCH', `/deals/${id}`, p),
  addActivity: (id: string, type: string, description: string, metadata = {}) =>
    req<{ activity: Activity }>('POST', `/deals/${id}/activities`, { type, description, metadata }),
  syncHubSpot: (id: string)              => req<{ synced: boolean; hubspot_deal_id: string }>('POST', `/deals/${id}/sync`),
}

export const STAGES: { key: string; label: string; color: string }[] = [
  { key: 'abierto',           label: 'Abierto',          color: '#5b8a3c' },
  { key: 'contactado',        label: 'Contactado',        color: '#8a6a1a' },
  { key: 'propuesta_enviada', label: 'Propuesta Enviada', color: '#3a6a8a' },
  { key: 'propuesta_vista',   label: 'Vista',             color: '#6a3a8a' },
  { key: 'negociacion',       label: 'Negociación',       color: '#8a3a3a' },
  { key: 'ganado',            label: 'Ganado ✓',          color: '#1a5a1a' },
  { key: 'perdido',           label: 'Perdido',           color: '#3a3a3a' },
]
