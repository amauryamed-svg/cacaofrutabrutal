"""
CAUA CRM — FastAPI REST API
Vercel route: /api/crm  (mangum ASGI adapter)
Auth: X-CRM-Key header == CRM_SECRET env var

Endpoints:
  GET    /api/crm/deals               list all deals (+ company + last activity)
  POST   /api/crm/deals               create deal
  GET    /api/crm/deals/{id}          deal detail + activities
  PATCH  /api/crm/deals/{id}          update stage / notes / value
  POST   /api/crm/deals/{id}/activities   log activity
  POST   /api/crm/deals/{id}/sync     push to HubSpot
  GET    /api/crm/health              liveness check
"""
import os
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, HTTPException, Security, Depends
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from supabase import create_client, Client
from mangum import Mangum
from _hubspot import full_sync, log_activity, update_deal

# ─── app ────────────────────────────────────────────────────────────
app = FastAPI(title="CAUA CRM", version="1.0.0", root_path="/api/crm")

app.add_middleware(CORSMiddleware,
    allow_origins=["https://cacaofrutabrutal.com", "https://caua-mvp.vercel.app",
                   "http://localhost:3000"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# ─── auth ────────────────────────────────────────────────────────────
_key_header = APIKeyHeader(name="X-CRM-Key", auto_error=True)

def require_key(key: str = Security(_key_header)):
    if key != os.environ.get("CRM_SECRET", ""):
        raise HTTPException(status_code=401, detail="Unauthorized")


# ─── db ─────────────────────────────────────────────────────────────
def get_sb() -> Client:
    return create_client(os.environ["SUPABASE_URL"],
                         os.environ["SUPABASE_SERVICE_ROLE_KEY"])


# ─── models ─────────────────────────────────────────────────────────
class DealCreate(BaseModel):
    title: str
    contact_name: str
    contact_email: EmailStr
    contact_role: Optional[str] = None
    company_name: Optional[str] = None
    company_domain: Optional[str] = None
    value_cop: int = 0
    stage: str = "abierto"
    notes: Optional[str] = None
    expected_close_date: Optional[str] = None
    cotizacion_slug: Optional[str] = None

class DealPatch(BaseModel):
    stage: Optional[str] = None
    notes: Optional[str] = None
    value_cop: Optional[int] = None
    expected_close_date: Optional[str] = None

class ActivityCreate(BaseModel):
    type: str
    description: str
    metadata: Optional[dict] = {}
    created_by: str = "admin"


# ─── helpers ────────────────────────────────────────────────────────
def _get_or_create_company(sb: Client, name: str, domain: str) -> Optional[str]:
    if not name:
        return None
    r = sb.table("crm_companies").select("id").eq("name", name).limit(1).execute()
    if r.data:
        return r.data[0]["id"]
    ins = sb.table("crm_companies").insert(
        {"name": name, "domain": domain or ""}).execute()
    return ins.data[0]["id"] if ins.data else None


def _log(sb: Client, deal_id: str, atype: str, desc: str, meta: dict = {}):
    sb.table("crm_activities").insert(
        {"deal_id": deal_id, "type": atype,
         "description": desc, "metadata": meta}).execute()


# ─── routes ─────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "ts": datetime.utcnow().isoformat()}


@app.get("/deals", dependencies=[Depends(require_key)])
def list_deals():
    sb = get_sb()
    deals = sb.table("crm_deals").select(
        "*, crm_companies(name, domain, industry)").order(
        "created_at", desc=True).execute()
    for d in deals.data:
        last = sb.table("crm_activities").select("type, description, created_at")\
            .eq("deal_id", d["id"]).order("created_at", desc=True).limit(1).execute()
        d["last_activity"] = last.data[0] if last.data else None
    return {"deals": deals.data, "total": len(deals.data)}


@app.post("/deals", dependencies=[Depends(require_key)], status_code=201)
def create_deal(body: DealCreate):
    sb = get_sb()
    company_id = _get_or_create_company(sb, body.company_name, body.company_domain)
    row = body.model_dump(exclude={"company_name", "company_domain"})
    row["company_id"] = company_id
    deal = sb.table("crm_deals").insert(row).execute()
    if not deal.data:
        raise HTTPException(500, "Error creando deal")
    d = deal.data[0]
    _log(sb, d["id"], "cotizacion_creada",
         f"Deal creado: {body.title}", {"stage": body.stage})
    return {"deal": d}


@app.get("/deals/{deal_id}", dependencies=[Depends(require_key)])
def get_deal(deal_id: str):
    sb = get_sb()
    deal = sb.table("crm_deals").select(
        "*, crm_companies(*)").eq("id", deal_id).single().execute()
    if not deal.data:
        raise HTTPException(404, "Deal no encontrado")
    acts = sb.table("crm_activities").select("*")\
        .eq("deal_id", deal_id).order("created_at", desc=True).execute()
    return {"deal": deal.data, "activities": acts.data}


@app.patch("/deals/{deal_id}", dependencies=[Depends(require_key)])
def patch_deal(deal_id: str, body: DealPatch):
    sb = get_sb()
    prev = sb.table("crm_deals").select("stage, hubspot_deal_id")\
        .eq("id", deal_id).single().execute()
    if not prev.data:
        raise HTTPException(404, "Deal no encontrado")
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    updates["updated_at"] = datetime.utcnow().isoformat()
    sb.table("crm_deals").update(updates).eq("id", deal_id).execute()
    if body.stage and body.stage != prev.data["stage"]:
        _log(sb, deal_id, "stage_change",
             f"{prev.data['stage']} → {body.stage}", {"prev": prev.data["stage"]})
        if prev.data.get("hubspot_deal_id"):
            update_deal(prev.data["hubspot_deal_id"],
                        body.stage, body.value_cop or 0)
    return {"updated": True, "deal_id": deal_id}


@app.post("/deals/{deal_id}/activities", dependencies=[Depends(require_key)], status_code=201)
def add_activity(deal_id: str, body: ActivityCreate):
    sb = get_sb()
    row = {"deal_id": deal_id, **body.model_dump()}
    act = sb.table("crm_activities").insert(row).execute()
    if not act.data:
        raise HTTPException(500, "Error guardando actividad")
    return {"activity": act.data[0]}


@app.post("/deals/{deal_id}/sync", dependencies=[Depends(require_key)])
def sync_hubspot(deal_id: str):
    sb = get_sb()
    res = sb.table("crm_deals").select("*, crm_companies(*)")\
        .eq("id", deal_id).single().execute()
    if not res.data:
        raise HTTPException(404, "Deal no encontrado")
    d = res.data
    company = d.get("crm_companies") or {}
    hs_id = full_sync(d, company.get("name", ""), company.get("domain", ""))
    if not hs_id:
        raise HTTPException(502, "HubSpot sync falló")
    sb.table("crm_deals").update({
        "hubspot_deal_id": hs_id,
        "hubspot_synced_at": datetime.utcnow().isoformat()
    }).eq("id", deal_id).execute()
    _log(sb, deal_id, "hubspot_sync",
         f"Sincronizado con HubSpot (deal_id: {hs_id})",
         {"hubspot_deal_id": hs_id})
    log_activity(hs_id, f"Sincronizado desde CAUA CRM — deal '{d['title']}'")
    return {"synced": True, "hubspot_deal_id": hs_id}


# ─── Vercel ASGI entry ───────────────────────────────────────────────
handler = Mangum(app, lifespan="off")
