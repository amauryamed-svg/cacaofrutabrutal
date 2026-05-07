# Colaboración — CAUA COLOMBIA SAS · Universidad Distrital

Branch dedicada a la auditoría externa con Andrés Gallardo. Esta branch existe para que CAUA COLOMBIA SAS y el equipo UD trabajen con un solo set de documentos vivos durante la ventana de 60 días.

## Branch

- **Nombre:** `audit/unidistrital-andres`
- **Base:** `main`
- **Política:** PRs hacia esta branch (no commits directos). Merge a `main` solo al cierre de la auditoría.

## Drive folder

**📁 [CAUA · Universidad Distrital · Auditoría externa](https://drive.google.com/drive/folders/1ivG13492hVDSCtTdOdCiYa5XWvtrEUQC)**

Folder ID: `1ivG13492hVDSCtTdOdCiYa5XWvtrEUQC`
Owner: `amauryamed@gmail.com` (CauaCorp CTO)

### Contenido del folder (al cierre del onboarding, esto va dentro)

| Archivo | Origen | Propósito |
|---|---|---|
| `audit-pack-caua-colombia-sas-unidistrital.pdf` | Generado desde esta branch | Pack PDF (Onboarding + NDA) para que Andrés firme |
| `[NDA-firmado-AndresGallardo].pdf` | Auditor sube tras firmar | Comprobante firmado |
| `Anexo-A-lista-nominal.pdf` | Auditor genera | Lista del equipo UD con acceso |
| `Anexo-B-alcance-aprobado.pdf` | Aprobación conjunta | Alcance final firmado por ambas partes |
| `informes/` | Auditor entrega durante ventana | Informe preliminar (día 50) + final (día 60) |
| `evidencias/` | Auditor sube en el camino | Capturas, logs, queries que respalden hallazgos |
| `dudas-y-aclaraciones.gdoc` | Doc compartido vivo | Q&A continuo entre CTO + auditor |

### Permisos del folder (configurar manualmente cuando Andrés mande email institucional)

1. Drive → click derecho en el folder → **Compartir**
2. Agregar emails con permisos:
   - **`amauryamed@gmail.com`** — Owner (ya configurado)
   - **`<andres@udistrital.edu.co>`** — Editor (cuando lo confirme)
   - **Cada miembro del equipo UD listado en Anexo A** — Commenter
3. Configuración general: **"Restringido"** (solo personas con acceso explícito)
   - **NO usar** "Cualquier persona con el enlace"
   - Razón: el folder contendrá NDAs firmados + posiblemente evidencias con datos sensibles bajo cláusula 4.6 del NDA (no exfiltración)

### Cómo subir el PDF inicial al folder

Desde el Mac:
1. Abrir el folder en navegador: link arriba
2. Drag-and-drop `docs/audit-pack/audit-pack-caua-colombia-sas-unidistrital.pdf` directamente en la ventana de Drive
3. Confirmar subida

Alternativamente, si tenés Google Drive sincronizado en Finder:
```bash
cp /Users/amauryamed/Documents/CacaoFrutaBrutal/docs/audit-pack/audit-pack-caua-colombia-sas-unidistrital.pdf \
   ~/Google\ Drive/CAUA\ ·\ Universidad\ Distrital\ ·\ Auditoría\ externa/
```

## Workflow de trabajo conjunto

### Durante el onboarding (semana 0)

```
[CTO]                                  [Auditor Andrés]
   │                                            │
   │── envía pack-pdf por email ────────────────▶│
   │                                            │
   │                                       lee, firma NDA
   │                                            │
   │◀─── recibe NDA firmado + email + lista ────│
   │                                            │
   │── invita @udistrital.edu.co al folder ────▶│
   │   Drive (Editor) + GH/Vercel/Supabase     │
   │                                            │
   │── sube PDF + cualquier doc inicial ────────▶│ (Drive)
   │                                            │
   │── notifica T+0 (inicio ventana 60d) ──────▶│
```

### Durante la ventana (semanas 1-8)

- **Q&A asíncrono:** doc Google `dudas-y-aclaraciones.gdoc` en el folder. Auditor escribe pregunta → CTO responde en ≤4h hábiles.
- **Hallazgos críticos:** WhatsApp directo CTO + email backup `[CAUA-SEC-CRITICAL]` (ver §4 del onboarding).
- **Evidencias:** auditor sube a `evidencias/<YYYY-MM-DD>-<slug>/` en Drive folder.
- **Branch git:** auditor puede comentar en el código vía Pull Requests (con su acceso GitHub Read), pero no merge.

### Día 50 (informe preliminar)

- Auditor sube `informes/preliminar-2026-MM-DD.pdf` al folder
- Reunión conjunta de revisión
- Decisión: cerrar a los 10 días o renovar otros 60

### Día 60 (cierre)

- Auditor sube `informes/final-2026-MM-DD.pdf`
- CTO confirma recepción + da por cumplida la auditoría
- Auditor confirma por email destrucción de copias locales (cláusula 7 del NDA)
- CauaCorp revoca accesos (GH/Vercel/Supabase/Postgres rol)
- PR de esta branch hacia `main` para archivar el set de docs

## Contactos

| Rol | Nombre | Contacto |
|---|---|---|
| CTO CAUA COLOMBIA SAS | Amaury Amed | amauryamed@gmail.com |
| Auditor responsable | Andrés Gallardo | _por confirmar al firmar NDA_ |
| Equipo auditor UD | _Anexo A del NDA_ | _por confirmar_ |

## Troubleshooting

**El PDF en el folder de Drive aparece "vacío" / sin acceso:**
- Verificar que el usuario tenga permisos al folder (Editor o Commenter)
- Re-compartir desde Drive UI con el email correcto

**Andrés no recibe la invitación a GitHub:**
- Email puede ir a spam — verificar carpeta
- Re-enviar desde Repo Settings → Manage access → Pending invitations

**Conflicto en este branch:**
- Esta branch evoluciona independiente de `main`. Si `main` avanza durante la ventana, hacer rebase regular: `git fetch && git rebase origin/main`
- Si hay conflictos en el PDF (ambos lo regeneraron): mantener la versión más reciente, eliminar la otra
