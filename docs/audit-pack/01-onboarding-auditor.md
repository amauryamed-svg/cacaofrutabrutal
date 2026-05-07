# Onboarding — Auditoría Externa CAUA COLOMBIA SAS

Bienvenido al proceso de auditoría externa académica del Sistema CAUA COLOMBIA SAS / CacaoFrutaBrutal. Este documento contiene todo lo que necesita saber para arrancar.

---

## 1. Carta de presentación

Bogotá, fecha de envío

**Para:** Andrés Gallardo + equipo asignado por la Universidad Distrital
**De:** Amaury Amed — Chief Technology Officer, CAUA COLOMBIA SAS
**Asunto:** Invitación a auditoría externa de la plataforma CAUA COLOMBIA SAS / CacaoFrutaBrutal

Andrés,

Gracias por aceptar liderar la auditoría externa académica de nuestra plataforma. Este onboarding pack contiene todo lo necesario para arrancar:

1. **Este documento** — pasos del proceso, matriz de acceso, reglas de juego
2. **Acuerdo de Confidencialidad (NDA)** — para firmar y regresar antes de provisionar accesos

El alcance de la auditoría comprende:

- Infraestructura técnica del sistema (frontend React + Vite, backend Supabase, Edge Functions, base de datos PostgreSQL)
- Capa Web3 desplegada en Base Sepolia testnet (5 smart contracts: NFT árbol, $CACAO ERC-20, Redención EIP-712, Adopción con escrow 60/30/10, Atestación IoT)
- Cadena de eventos on-chain → off-chain (Alchemy webhook → Edge Function → DB ledger)
- Integraciones de terceros (Coinbase CDP Onramp, Persona KYC, Chainalysis, Stripe, MercadoPago)
- Compliance y postura de seguridad (RLS Postgres, segregación de secrets, geo-blocking, KYC tier matrix)

**Lo que NO está en alcance:**

- Auditoría legal o financiera (otra firma cubrirá esos lados)
- Auditoría formal de smart contracts pre-mainnet (Spearbit / Trail of Bits — pendiente cotizar separadamente)
- Datos personales de usuarios (PII) — Postgres RLS impide su lectura; el alcance del auditor es esquema + políticas, no contenido individual
- Infraestructura mainnet — el sistema opera hoy 100% en Base Sepolia testnet

Cuando regrese el NDA firmado, en 24 horas hábiles provisionaremos sus accesos a GitHub, Vercel, Supabase y Postgres (read-only). La ventana de auditoría es de 60 días renovables, con un informe preliminar al día 50 y un informe final al cierre.

Nuestro CTO directo (yo) está disponible como punto único de contacto para cualquier pregunta técnica, escalación, o solicitud de aclaración durante toda la ventana.

Saludos,

**Amaury Amed**
Chief Technology Officer · CAUA COLOMBIA SAS · NIT 901.213.846-7
amauryamed@gmail.com

---

## 2. Checklist del auditor

Pasos en orden:

### Antes de provisionar accesos

- [ ] **Leer este documento completo** (incluye matriz de acceso + reglas de juego)
- [ ] **Leer el NDA** (`02-nda-confidencialidad.md`) — preguntas a CTO antes de firmar
- [ ] **Firmar el NDA digital o físico** y regresarlo a amauryamed@gmail.com
- [ ] **Confirmar email de contacto** que se usará para las invitaciones (personal o institucional UD)
- [ ] **Enviar lista nominal** del equipo Universidad Distrital con acceso al alcance (nombre, email, rol académico). Solo los miembros listados pueden acceder.
- [ ] **Confirmar fecha de inicio** de la ventana de 60 días con CTO

### Tras NDA firmado (CAUA COLOMBIA SAS provisiona en 24h)

Recibirá invitaciones por email a:

- [ ] **GitHub** — `amauryamed-svg/cacaofrutabrutal` (rol: Read) — aceptar invitación
- [ ] **Vercel** — team CAUA COLOMBIA SAS (rol: Viewer) — aceptar invitación
- [ ] **Supabase** — proyecto kjygovuiphbxcdxeduco (rol: Read-only) — aceptar invitación
- [ ] **Postgres directo** (opcional, si lo solicitó) — credenciales por canal seguro (1Password vault compartido)
- [ ] **BaseScan links** (públicos, no requieren invitación) — los 5 contratos en Sepolia

### Durante la ventana (60 días)

- [ ] Documentar hallazgos en formato académico estándar (severidad, evidencia, recomendación)
- [ ] Reportar cualquier hallazgo CRÍTICO inmediatamente (no esperar al informe final)
- [ ] Solicitar aclaraciones técnicas al CTO directamente
- [ ] Consultar memorias del proyecto que CAUA COLOMBIA SAS comparta (incluye contexto histórico de decisiones)

### Cierre

- [ ] Día 50: entregar informe preliminar de hallazgos al CTO
- [ ] Día 55: revisión conjunta + decisión renovar / cerrar
- [ ] Día 60: informe final + destrucción de copias locales de información confidencial (cláusula 7 del NDA)
- [ ] Confirmación escrita por email de cumplimiento de cláusula 7

---

## 3. Matriz de acceso

| Sistema | Rol asignado | Lo que puede ver | Lo que NO puede ver / hacer |
|---|---|---|---|
| **GitHub** repo `cacaofrutabrutal` | `Read` | Código completo · Historia de commits · Issues · Pull requests · Wiki · Secrets metadata (nombres) | Secrets values · Push · Merge · Delete branches |
| **Vercel** proyecto `prj_Fc5Rb…` | `Viewer` | Deployments · Build logs · Runtime logs · Env vars (valores enmascarados) · Métricas de tráfico | Modificar config · Trigger deploys · Cancel deploys · Ver env values |
| **Supabase** proyecto `kjygovuiphbxcdxeduco` | `Read-only` | Schema completo · RLS policies · Migraciones · Edge Functions code · Logs · Auth users metadata (no contraseñas) · Storage buckets metadata | DDL · DML · Edge Function deploy · Crear/modificar policies · Auth users PII (RLS bloquea) · Storage objects content |
| **Postgres directo** (si solicitado) | `auditor_unidistrital` (custom rol) | `SELECT` en `public.*` · `pg_stat_statements` · `pg_stat_user_tables` (performance) | `INSERT`/`UPDATE`/`DELETE` · DDL · Acceso a `auth.*` · Acceso a `storage.*` |
| **BaseScan Sepolia** | Público (sin login) | Bytecode + ABI verificados de los 5 contratos · Tx history · Eventos | n/a — pública |
| **Memorias del proyecto** (`~/.claude/projects/.../memory/*.md`) | Acceso por compartir explícito | Decisiones técnicas históricas · Diagnósticos · Architecture snapshots | (depende de qué comparte CAUA COLOMBIA SAS) |

**Datos sensibles por clase:**

| Clase de dato | Visible para auditor | Razón |
|---|---|---|
| Código fuente | ✅ Sí (Read en GitHub) | Alcance principal |
| Schema PostgreSQL + RLS policies | ✅ Sí (Read-only Supabase) | Alcance — postura de seguridad |
| Edge Function source code | ✅ Sí (Read en GitHub + Read-only Supabase) | Alcance |
| Edge Function secrets values | ❌ No | RELAYER/ORACLE/CDP/etc. — fuera de alcance, el NDA cubre por si se exponen accidentalmente |
| User PII (`user_profiles.email`, `kyc_*`, `wallet_address`) | ❌ No (RLS bloquea) | Compliance + alcance |
| KYC documentos reales | ❌ No (Persona los almacena, no CAUA COLOMBIA SAS) | n/a |
| Smart contract bytecode + ABI | ✅ Sí (BaseScan público) | Pública por diseño |
| Smart contract private keys (DEPLOYER, RELAYER, ORACLE, IOT_ORACLE) | ❌ No | Compromiso de keys = compromiso de contratos |
| Logs Vercel/Supabase con eventos de usuarios | ✅ Aggregated counts y patterns | Sin PII expuesta — el auditor verá `user_id` UUIDs no resueltos a personas |
| Financial: Stripe / MP / Coinbase Commerce data | ❌ No | Otra auditoría cubre esto |

---

## 4. Reglas de juego

### Lo que **SÍ** puede hacer

- Leer todo el código + decisiones de arquitectura
- Ejecutar queries `SELECT` en Postgres (si tiene acceso directo) o vía Supabase Studio
- Inspeccionar logs Vercel + Edge Functions (busqueda de patrones, no PII)
- Leer y verificar bytecode + ABI de smart contracts en BaseScan
- Replicar localmente (clone repo + run local — no afecta producción)
- Solicitar aclaraciones al CTO en cualquier momento
- Documentar hallazgos en cualquier formato académico

### Lo que **NO** puede hacer

- Push a cualquier branch del repo
- Modificar cualquier configuración (Vercel, Supabase, Alchemy, Coinbase)
- Ejecutar `INSERT`/`UPDATE`/`DELETE` en Postgres
- Compartir credenciales o accesos con terceros (incluso dentro de UD que no estén en la lista nominal)
- Exfiltrar datos a sistemas fuera del scope académico (cloud personal, drives no institucionales, etc.)
- Publicar hallazgos antes del día 60 sin revisión conjunta con CTO
- Realizar "pentesting activo" (escaneos automáticos, fuzzing, attempt to bypass RLS) — el alcance es review estático, no red team

### Hallazgos: clasificación por severidad

| Nivel | Definición | Tiempo de notificación a CTO |
|---|---|---|
| 🔴 **Crítico** | Vulnerabilidad explotable que compromete datos de usuarios o fondos | Inmediato (mismo día) |
| 🟠 **Alto** | Riesgo significativo si se cumple cierta condición | ≤ 24h |
| 🟡 **Medio** | Hardening necesario, no compromete operación actual | Informe preliminar (día 50) |
| 🔵 **Bajo / Informativo** | Mejoras, deuda técnica, observaciones | Informe final (día 60) |

### Escalación urgente

**Sospecha de incidente activo de seguridad** (ej. secret leaked, RLS bypass real, contrato exploitable):

1. **NO** publicar / compartir / discutir externamente
2. WhatsApp directo CTO Amaury Amed (número compartido aparte)
3. Email backup: amauryamed@gmail.com con asunto `[CAUA-SEC-CRITICAL]`
4. CAUA COLOMBIA SAS activa runbook de respuesta — auditor no actúa unilateralmente

### Soporte durante la ventana

- **CTO directo:** amauryamed@gmail.com (Amaury Amed)
- **Tiempo de respuesta:** ≤ 4h hábiles (timezone Colombia, lunes-viernes)
- **Llamadas/videollamadas técnicas:** agendar por email con 24h anticipación

---

## 5. Recursos compartidos al inicio de ventana

Cuando se confirme la fecha de inicio, CAUA COLOMBIA SAS compartirá un Notion / Google Drive con:

- Diagrama de arquitectura completo
- Listado de Edge Functions activas + sus propósitos
- Mapa de migraciones aplicadas
- ADRs (Architecture Decision Records) relevantes
- Memorias técnicas del proyecto compartibles bajo NDA
- Informes técnicos previos (CDP Onramp, Web3 transformation roadmap)

---

## 6. Cierre del onboarding

Una vez completados los pasos del checklist (NDA firmado, datos enviados, accesos aceptados), recibirá un email de **CONFIRMACIÓN DE INICIO DE VENTANA** con:

- Fecha exacta de inicio (T+0)
- Fecha de día 50 (informe preliminar) y día 60 (informe final)
- Lista final de accesos provisionados
- Canales de comunicación activados

A partir de ahí, la auditoría arranca formalmente.

Bienvenido al proceso. Cualquier duda antes de firmar el NDA, contacte directamente al CTO.
