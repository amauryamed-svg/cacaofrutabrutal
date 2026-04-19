"""HubSpot CRM Deals API v3 — private app token auth."""
import os
import httpx
from datetime import datetime

PORTAL_ID   = "51142173"
BASE_URL    = "https://api.hubapi.com"
_TOKEN      = lambda: os.environ.get("HUBSPOT_ACCESS_TOKEN", "")

STAGE_MAP = {
    "abierto":           "appointmentscheduled",
    "contactado":        "qualifiedtobuy",
    "propuesta_enviada": "presentationscheduled",
    "propuesta_vista":   "decisionmakerboughtin",
    "negociacion":       "contractsent",
    "ganado":            "closedwon",
    "perdido":           "closedlost",
}


def _headers() -> dict:
    return {"Authorization": f"Bearer {_TOKEN()}", "Content-Type": "application/json"}


def upsert_contact(email: str, name: str, role: str) -> str | None:
    """Create or update a HubSpot contact. Returns contact_id."""
    first, *rest = name.split(" ", 1)
    payload = {"properties": {
        "email": email, "firstname": first,
        "lastname": rest[0] if rest else "",
        "jobtitle": role or "",
    }}
    r = httpx.post(f"{BASE_URL}/crm/v3/objects/contacts", json=payload, headers=_headers())
    if r.status_code == 409:  # already exists — fetch id
        search = httpx.post(f"{BASE_URL}/crm/v3/objects/contacts/search", headers=_headers(),
            json={"filterGroups": [{"filters": [{"propertyName": "email", "operator": "EQ", "value": email}]}]})
        results = search.json().get("results", [])
        return results[0]["id"] if results else None
    return r.json().get("id") if r.is_success else None


def upsert_company(name: str, domain: str) -> str | None:
    """Create or update a HubSpot company. Returns company_id."""
    payload = {"properties": {"name": name, "domain": domain or ""}}
    r = httpx.post(f"{BASE_URL}/crm/v3/objects/companies", json=payload, headers=_headers())
    if r.status_code == 409:
        search = httpx.post(f"{BASE_URL}/crm/v3/objects/companies/search", headers=_headers(),
            json={"filterGroups": [{"filters": [{"propertyName": "domain", "operator": "EQ", "value": domain}]}]})
        results = search.json().get("results", [])
        return results[0]["id"] if results else None
    return r.json().get("id") if r.is_success else None


def create_deal(title: str, stage: str, value_cop: int) -> str | None:
    """Create a HubSpot deal. Returns hubspot_deal_id."""
    hs_stage = STAGE_MAP.get(stage, "appointmentscheduled")
    payload = {"properties": {
        "dealname": title,
        "dealstage": hs_stage,
        "amount": str(value_cop),
        "pipeline": "default",
        "closedate": datetime.utcnow().strftime("%Y-%m-%dT00:00:00.000Z"),
    }}
    r = httpx.post(f"{BASE_URL}/crm/v3/objects/deals", json=payload, headers=_headers())
    return r.json().get("id") if r.is_success else None


def update_deal(hubspot_deal_id: str, stage: str, value_cop: int) -> bool:
    """Update deal stage and amount in HubSpot."""
    hs_stage = STAGE_MAP.get(stage, "appointmentscheduled")
    payload = {"properties": {"dealstage": hs_stage, "amount": str(value_cop)}}
    r = httpx.patch(f"{BASE_URL}/crm/v3/objects/deals/{hubspot_deal_id}",
                    json=payload, headers=_headers())
    return r.is_success


def associate(deal_id: str, object_id: str, object_type: str) -> bool:
    """Associate a deal with a contact or company."""
    label = "deal_to_contact" if object_type == "contact" else "deal_to_company"
    url = f"{BASE_URL}/crm/v3/objects/deals/{deal_id}/associations/{object_type}s/{object_id}/{label}"
    return httpx.put(url, headers=_headers()).is_success


def log_activity(hubspot_deal_id: str, note: str) -> bool:
    """Log a note engagement on a deal."""
    payload = {
        "engagement": {"active": True, "type": "NOTE"},
        "associations": {"dealIds": [int(hubspot_deal_id)]},
        "metadata": {"body": note},
    }
    r = httpx.post(f"{BASE_URL}/engagements/v1/engagements", json=payload, headers=_headers())
    return r.is_success


def full_sync(deal: dict, company_name: str, company_domain: str) -> str | None:
    """Upsert contact + company + deal + associations. Returns hubspot_deal_id."""
    contact_id = upsert_contact(deal["contact_email"], deal["contact_name"], deal.get("contact_role", ""))
    company_id = upsert_company(company_name, company_domain) if company_name else None
    if deal.get("hubspot_deal_id"):
        update_deal(deal["hubspot_deal_id"], deal["stage"], deal["value_cop"])
        hs_deal_id = deal["hubspot_deal_id"]
    else:
        hs_deal_id = create_deal(deal["title"], deal["stage"], deal["value_cop"])
    if hs_deal_id:
        if contact_id: associate(hs_deal_id, contact_id, "contact")
        if company_id: associate(hs_deal_id, company_id, "company")
    return hs_deal_id
