# Audit Pack — Universidad Distrital

Pack de onboarding para auditoría externa académica del Sistema CAUA COLOMBIA SAS / CacaoFrutaBrutal. Aplica al equipo asignado por la Universidad Distrital (responsable: Andrés Gallardo).

## Contenido

| Archivo | Propósito | Audiencia |
|---|---|---|
| [01-onboarding-auditor.md](01-onboarding-auditor.md) | Carta de presentación + checklist de pasos + matriz de acceso + reglas de juego | Auditor (UD) |
| [02-nda-confidencialidad.md](02-nda-confidencialidad.md) | Acuerdo de confidencialidad mutuo, listo para firmar | Auditor (UD) + CAUA COLOMBIA SAS |

## Flujo de onboarding (alto nivel)

```
[1] CAUA COLOMBIA SAS envía pack al auditor (emails 01 + 02)
       │
[2] Auditor recibe NDA, lo firma, lo regresa firmado
       │
[3] Auditor envía email de contacto + lista nominal del equipo
       │
[4] CAUA COLOMBIA SAS valida (NDA firmado + email institucional) → provisiona accesos (24h SLA)
       │
[5] Auditor confirma recepción de invitaciones GitHub / Vercel / Supabase / BaseScan
       │
[6] Ventana de auditoría 60 días — auditor reporta hallazgos a CTO al cierre
       │
[7] CAUA COLOMBIA SAS revoca accesos automáticamente al día 60 (o renueva si las partes acuerdan)
```

## Provisioning checklist (interno CAUA COLOMBIA SAS — no compartir)

Una vez el auditor regresa el NDA firmado + email institucional + lista nominal:

### Pre-condiciones
- [ ] NDA escaneado/digital firmado por auditor recibido
- [ ] Email de contacto del auditor confirmado (Andrés Gallardo: andresgalladofr@gmail.com)
- [ ] Lista nominal del equipo UD (nombre + email + rol académico)
- [ ] Fecha de inicio de ventana acordada
- [ ] CTO + CEO han revisado y aprobado el alcance

### Provisioning (en orden, 24h SLA)

#### 1. GitHub — repo `amauryamed-svg/cacaofrutabrutal`
- [ ] `gh api repos/amauryamed-svg/cacaofrutabrutal/collaborators/<email-username> -X PUT -f permission=read`
- [ ] Confirmar permission `read` (no write, no admin)
- [ ] El auditor recibe email de invitación, lo acepta

#### 2. Vercel — proyecto `prj_Fc5Rbha3hlIRAXrevMIoIaBeXWoz` (team `team_aVPGjM9P30YNoCQKEvdBp4UQ`)
- [ ] Vercel Dashboard → Team → Members → Invite → role: `Viewer` (preferred sobre Member para least-privilege)
- [ ] Email del auditor en el campo Member
- [ ] Confirmar el envío de invitación

#### 3. Supabase — proyecto `kjygovuiphbxcdxeduco`
- [ ] Supabase Dashboard → Settings → Team → Invite member → role: `Read-only`
- [ ] Email del auditor
- [ ] Confirmar invitación enviada

#### 4. Postgres directo (opcional — solo si auditor solicita queries analíticas)
```sql
-- Crear rol auditor con SELECT-only
create role auditor_unidistrital with login password '<random-32-chars>';
grant connect on database postgres to auditor_unidistrital;
grant usage on schema public to auditor_unidistrital;
grant select on all tables in schema public to auditor_unidistrital;
grant pg_read_all_stats to auditor_unidistrital;  -- pg_stat_statements
alter default privileges in schema public grant select on tables to auditor_unidistrital;
```
- [ ] Compartir credenciales por canal seguro (1Password vault compartido, no email)
- [ ] Documentar en `project_unidistrital_audit.md` con fecha

#### 5. BaseScan Sepolia (no requiere invitación — público)
Compartir los 5 contract verifier links:
- CacaoTreeNFT — https://sepolia.basescan.org/address/0xf5f2dE2237334680fC74cFD1dbCFaF5E5285ad23
- CacaoToken — https://sepolia.basescan.org/address/0x8f5f9d696F8004b7d77c915c70569eec3234D7E1
- MazorcaRedemption — https://sepolia.basescan.org/address/0x9Aa80f33067316De88757ff8c21660f5672644e6
- TreeAdoption — https://sepolia.basescan.org/address/0x1c6724cdfe8906ae5a2042c431169b6987755711
- IoTAttestation — https://sepolia.basescan.org/address/0x0077649ed45ce82225b3a3d5a364a4f804007e53

### Post-provisioning
- [ ] Email de confirmación al auditor con: lista de servicios provisionados + fechas de cierre + canal de soporte (CTO directo)
- [ ] Crear cron de revocación automática al día 60 desde fecha de inicio
- [ ] Actualizar memoria `project_unidistrital_audit.md` con fechas + contactos + alcance específico aprobado

## Cosas que NO compartir incluso bajo NDA

- Service role JWT / `sb_secret_*` keys (rotados 2026-05-01, ver `project_service_role_leak_2026_05_01.md`)
- Edge Function secrets (RELAYER_PRIVATE_KEY, ORACLE_PRIVATE_KEY, IOT_ORACLE_PRIVATE_KEY, CDP_API_KEY_*, PERSONA_WEBHOOK_SECRET, ALCHEMY_SIGNING_KEY)
- Private keys en `contracts/.env.deploy.sepolia` (gitignored, mode 600 — ni siquiera al auditor)
- DEPLOYER private key Sepolia (apareció brevemente en transcripts; nunca reusar en mainnet)
- KYC documents reales de usuarios (Persona los almacena, no nosotros — la BD solo tiene status verdicts)

El NDA cubre el resto.

## Soporte durante la ventana

- **CTO directo:** amauryamed@gmail.com (Amaury Amed)
- **Tiempo de respuesta:** ≤ 4h hábiles (timezone Colombia, lunes-viernes)
- **Escalación urgente** (security incident sospechado): WhatsApp directo CTO

## Renovación / cierre

- A los 50 días: CTO + auditor coordinan informe preliminar de hallazgos
- A los 55 días: decisión conjunta de cerrar o renovar (otros 60 días)
- Día 60: revocación automática si no hay renovación firmada
- Auditor entrega informe final + destruye copias locales de información confidencial bajo cláusula 7 del NDA
