# ACUERDO DE CONFIDENCIALIDAD MUTUO

**Entre CAUA COLOMBIA SAS / CacaoFrutaBrutal y el equipo auditor de la Universidad Distrital**

---

## Identificación de las partes

**LA EMPRESA:**
- **Razón social:** CAUA COLOMBIA SAS
- **NIT:** 901.213.846-7
- **Marca operativa:** CacaoFrutaBrutal
- **Representante legal técnico:** Amaury Amed, en su calidad de Chief Technology Officer
- **Domicilio:** Bogotá D.C., Colombia
- **Email de contacto:** amauryamed@gmail.com
- En adelante, "**CAUA COLOMBIA SAS**" o "**la Empresa**"

**EL AUDITOR:**
- **Institución:** Universidad Distrital Francisco José de Caldas
- **Responsable principal:** Andrés Gallardo
- **Equipo asignado:** según lista nominal entregada en el onboarding (Anexo A)
- **Domicilio:** Bogotá D.C., Colombia
- **Email de contacto:** andresgalladofr@gmail.com
- En adelante, "**el Auditor**" o, colectivamente con el equipo, "**los Auditores**"

Las partes han acordado celebrar el presente Acuerdo de Confidencialidad (en adelante, el "**Acuerdo**" o el "**NDA**") sujeto a las siguientes cláusulas.

---

## 1. Objeto del Acuerdo

El presente Acuerdo regula la divulgación, recepción, uso y protección de la **Información Confidencial** (definida en la Cláusula 3) que CAUA COLOMBIA SAS pondrá a disposición del Auditor con el único fin de permitir la realización de una **auditoría externa académica** sobre la plataforma técnica CAUA COLOMBIA SAS / CacaoFrutaBrutal, incluyendo:

a) Su infraestructura de software (frontend, backend, base de datos, Edge Functions)
b) Sus contratos inteligentes desplegados en la red Base Sepolia (testnet)
c) Sus integraciones con terceros (Coinbase CDP, Persona KYC, Chainalysis, Stripe, MercadoPago)
d) Su postura de seguridad (RLS, gestión de secrets, segregación de roles, geo-blocking)
e) Sus políticas de cumplimiento normativo

El alcance específico se detalla en el documento `01-onboarding-auditor.md` (en adelante, "**el Onboarding**"), cuyo contenido forma parte integral de este Acuerdo.

---

## 2. Carácter mutuo

Aunque el flujo principal de información va de CAUA COLOMBIA SAS al Auditor, este Acuerdo es **mutuo**: el Auditor también puede compartir con CAUA COLOMBIA SAS información académica, metodológica o de hallazgos que CAUA COLOMBIA SAS se compromete a mantener confidencial bajo las mismas condiciones aplicables al Auditor respecto de la información de CAUA COLOMBIA SAS.

---

## 3. Definición de Información Confidencial

Se considerará "**Información Confidencial**" toda información, en cualquier soporte o formato, que CAUA COLOMBIA SAS comparta con el Auditor en el marco del Objeto. Sin limitación, se incluyen las siguientes categorías:

3.1. **Código fuente:** repositorio Git completo `cacaofrutabrutal`, incluyendo historia de commits, ramas, y comentarios en pull requests.

3.2. **Configuración de infraestructura:** valores y nombres de variables de entorno (Vercel, Supabase, Edge Functions), configuración de pg_cron, esquemas RLS, migraciones SQL, y scripts de despliegue.

3.3. **Datos operacionales:** logs de servidor, telemetría agregada, métricas de uso, identificadores anonimizados de usuarios (`user_id` UUIDs no resueltos a personas).

3.4. **Información comercial y estratégica:** roadmap, decisiones de arquitectura, ADRs (Architecture Decision Records), informes técnicos internos (incluido el informe a la Universidad Distrital del 6 de mayo de 2026), unit economics, comunicaciones con socios comerciales (Coinbase, Persona, Chainalysis, etc.).

3.5. **Información sobre activos digitales:** direcciones de wallets internas (deployer, relayer, oracle), saldos en wallets de testnet, parámetros de configuración on-chain, eventos no públicos.

3.6. **Información personal de terceros (PII):** aunque RLS bloquea el acceso por defecto, el Auditor podría exponerse incidentalmente a `user_profiles.email`, `wallet_address`, `kyc_*`, `country`, etc. Esta información es Confidencial bajo cualquier circunstancia.

3.7. **Memorias técnicas y diagnósticos** que CAUA COLOMBIA SAS comparta voluntariamente con el Auditor (archivos `.md` en `~/.claude/projects/.../memory/`).

3.8. **Cualquier otro material** marcado como "Confidencial", "Privado", "Interno" o equivalente, o que por su naturaleza una persona razonable consideraría confidencial.

### 3.9 Exclusiones

NO constituye Información Confidencial:

a) Información que sea o se vuelva de dominio público sin culpa del Auditor
b) Información que el Auditor ya poseía legítimamente con anterioridad documentada (anterior a la firma)
c) Información obtenida lícitamente de terceros sin obligación de confidencialidad
d) Información que el Auditor desarrolle de manera independiente, demostrable por registros previos
e) Smart contracts cuyo bytecode esté verificado y públicamente accesible en BaseScan u otros block explorers
f) Información cuya divulgación sea ordenada por autoridad judicial competente, en cuyo caso el Auditor deberá notificar a CAUA COLOMBIA SAS por escrito antes de divulgar, salvo prohibición legal expresa

---

## 4. Obligaciones del Auditor

El Auditor (y todo su equipo nombrado en el Anexo A) se obliga a:

4.1. **Confidencialidad estricta:** mantener la Información Confidencial en estricta reserva, no divulgarla a terceros sin autorización escrita previa de CAUA COLOMBIA SAS.

4.2. **Uso limitado al Objeto:** usar la Información Confidencial exclusivamente para el desarrollo de la auditoría académica acordada, y no para ningún otro fin (incluyendo, sin limitación, uso académico para tesis, papers, u otro material publicable sin autorización escrita expresa).

4.3. **Custodia diligente:** aplicar al menos el mismo grado de diligencia y cuidado que aplica a su propia información confidencial, y en ningún caso menor a un grado razonable.

4.4. **Restricción de acceso:** limitar el acceso a la Información Confidencial únicamente a los miembros del equipo nombrados en el Anexo A. Cada miembro debe haber firmado un compromiso de confidencialidad equivalente a este, ya sea como anexo individual o como vinculación contractual con la Universidad Distrital.

4.5. **No reverse engineering ni derivados:** no realizar ingeniería inversa, descompilación, modificación, ni crear obras derivadas a partir del código fuente o algoritmos compartidos, salvo en la medida estrictamente necesaria para el análisis técnico del alcance.

4.6. **No exfiltración:** no copiar, almacenar, sincronizar ni respaldar Información Confidencial en sistemas no aprobados (incluyendo, sin limitación, cuentas personales de Google Drive, Dropbox, GitHub personal, ChatGPT, Claude.ai personal u otros servicios cloud no institucionales).

4.7. **No publicación previa:** no publicar, presentar, transmitir, exponer o discutir externamente hallazgos, observaciones, opiniones técnicas o cualquier derivado de la Información Confidencial, antes de la entrega del informe final y la revisión conjunta con CAUA COLOMBIA SAS prevista al día 60 de la ventana.

4.8. **Notificación de incidentes:** notificar inmediatamente y por escrito a CAUA COLOMBIA SAS cualquier acceso no autorizado, pérdida, divulgación accidental, o intento de exfiltración por terceros que afecte la Información Confidencial.

4.9. **No pentesting activo:** abstenerse de realizar pruebas de penetración activas, fuzzing, escaneos agresivos, intentos de bypass de RLS o cualquier acción que se considere "red team" sin autorización escrita previa de CAUA COLOMBIA SAS. La auditoría es de naturaleza estática y consultiva.

4.10. **No compromiso de fondos:** no ejecutar transacciones on-chain mainnet ni testnet usando claves de CAUA COLOMBIA SAS, ni utilizando sus accesos para impactar el estado del sistema. Toda interacción es read-only.

---

## 5. Obligaciones de CAUA COLOMBIA SAS

CAUA COLOMBIA SAS se obliga a:

5.1. Proveer al Auditor los accesos descritos en el Onboarding dentro del SLA acordado (24 horas hábiles desde la recepción del NDA firmado y los datos del equipo).

5.2. Mantener canales de soporte funcionales con tiempo de respuesta razonable (≤ 4 horas hábiles) durante toda la ventana.

5.3. Compartir información adicional bajo este Acuerdo si el Auditor la solicita en el marco del Objeto.

5.4. No retaliar contra el Auditor por hallazgos comunicados de buena fe.

5.5. Tratar como confidencial la información que el Auditor comparta con CAUA COLOMBIA SAS en el marco del Objeto.

---

## 6. Plazo

6.1. Este Acuerdo entra en vigor en la fecha de su firma por ambas partes y permanece vigente hasta la fecha más tardía entre:

a) **Sesenta (60) días corridos desde la fecha de inicio formal de la ventana de auditoría** (notificada por escrito por CAUA COLOMBIA SAS), o
b) Hasta la entrega del informe final y la confirmación escrita por el Auditor del cumplimiento de la Cláusula 7.

6.2. Las partes pueden acordar por escrito una extensión de la ventana antes de su vencimiento.

6.3. **Las obligaciones de confidencialidad de la Cláusula 4 sobrevivirán a la terminación del Acuerdo por un período adicional de tres (3) años**, contados a partir de la fecha de terminación.

---

## 7. Devolución y destrucción de la Información Confidencial

Al cierre de la ventana de auditoría o por terminación anticipada del Acuerdo, el Auditor deberá:

7.1. Cesar todo uso de la Información Confidencial.

7.2. Destruir o devolver, a elección de CAUA COLOMBIA SAS, toda copia (digital o física) de Información Confidencial bajo su control. La destrucción digital incluye eliminación de:
- Repositorios Git locales clonados
- Backups en discos personales o institucionales
- Archivos descargados de Vercel, Supabase, BaseScan
- Notas, screenshots, documentos derivados
- Caches de IDE, búfers de editor, bases de datos locales

7.3. Confirmar por escrito (email a `amauryamed@gmail.com` con asunto `[CAUA-NDA-CIERRE]`) el cumplimiento de la Cláusula 7.2 dentro de los **siete (7) días corridos** posteriores al cierre.

7.4. **Excepción:** el Auditor puede conservar **una (1) copia archivada** del informe final y materiales que él mismo produjo, para fines de respaldo académico institucional, siempre que esta copia se mantenga bajo las mismas obligaciones de confidencialidad de este Acuerdo durante el período de supervivencia (3 años).

---

## 8. Cumplimiento normativo específico

8.1. **Datos personales:** ambas partes se comprometen a cumplir la **Ley 1581 de 2012** (Régimen General de Protección de Datos Personales de Colombia) y su decreto reglamentario 1377 de 2013, en todo manejo de información personal incidental.

8.2. **Sectores regulados Web3:** el Auditor reconoce que CAUA COLOMBIA SAS opera en un sector emergente regulado por:
- Decreto 1048 de 2021 (Colombia, criptoactivos)
- Próxima ley MiCA de la Unión Europea (cuando aplique)
- Regulación FinCEN / OFAC en Estados Unidos (sanciones)

Cualquier hallazgo del Auditor con implicaciones regulatorias deberá comunicarse al CTO antes que a cualquier otra parte.

8.3. **PII expuesta accidentalmente:** si el Auditor accede incidentalmente a información personal identificable de usuarios (a pesar del RLS), debe:
- No registrar, capturar, ni transmitir esa información
- Notificar al CTO en ≤ 24h
- Continuar la auditoría sin esa información

---

## 9. Sanciones por incumplimiento

9.1. **Reconocimiento del daño:** el Auditor reconoce que el incumplimiento de las obligaciones de este Acuerdo puede causar a CAUA COLOMBIA SAS un daño significativo, irreparable y de difícil cuantificación, especialmente respecto de la Información Confidencial relacionada con activos digitales y datos personales de usuarios.

9.2. **Remedios disponibles:** ante un incumplimiento confirmado, CAUA COLOMBIA SAS podrá:
a) Solicitar medidas cautelares ante autoridad judicial competente para impedir continuación del incumplimiento o publicación de información
b) Reclamar daños y perjuicios efectivamente probados
c) Terminar inmediatamente el Acuerdo
d) Notificar a la Universidad Distrital del incumplimiento, con copia al rector o a quien designe la institución

9.3. **Cláusula penal:** en caso de divulgación pública intencional de Información Confidencial Crítica (claves privadas, secrets de servicios, PII de usuarios), las partes acuerdan una **cláusula penal de COP $50,000,000 (cincuenta millones de pesos colombianos)** sin perjuicio del derecho a reclamar daños mayores efectivamente probados, al amparo del artículo 1592 del Código Civil colombiano.

---

## 10. Ley aplicable y jurisdicción

10.1. Este Acuerdo se rige por la **legislación de la República de Colombia**.

10.2. Cualquier controversia derivada o relacionada con este Acuerdo será resuelta:
a) **En primera instancia,** por negociación directa de buena fe entre el CTO de CAUA COLOMBIA SAS y el responsable principal del Auditor, durante un período mínimo de quince (15) días corridos.
b) **Si la negociación falla,** por arbitraje administrado por la **Cámara de Comercio de Bogotá**, con sede en Bogotá D.C., en idioma español, con un (1) árbitro designado por las partes o, en su defecto, por la Cámara.
c) **Subsidiariamente,** por los jueces civiles del circuito de Bogotá D.C.

---

## 11. Disposiciones generales

11.1. **Acuerdo completo:** este documento, junto con sus Anexos, constituye el acuerdo completo entre las partes sobre la materia, y reemplaza cualquier acuerdo verbal o escrito previo.

11.2. **Modificaciones:** cualquier modificación debe constar por escrito y estar firmada por ambas partes.

11.3. **Cesión:** ninguna parte puede ceder sus derechos u obligaciones bajo este Acuerdo a un tercero sin consentimiento previo y por escrito de la otra parte.

11.4. **Divisibilidad:** si una cláusula es declarada inválida o inejecutable, las demás permanecen en pleno vigor.

11.5. **Comunicaciones:** toda notificación bajo este Acuerdo se considera válida si se realiza por email a las direcciones consignadas en la Cláusula de Identificación de las Partes, con confirmación de recepción.

11.6. **Renuncia:** el no ejercicio o ejercicio tardío de cualquier derecho bajo este Acuerdo no constituye renuncia al mismo.

11.7. **Idioma:** este Acuerdo se firma en idioma español. En caso de traducción, prevalecerá la versión en español.

---

## 12. Firmas

En constancia de lo anterior, las partes firman este Acuerdo en dos (2) ejemplares de igual valor, en Bogotá D.C., el día _____ del mes _________________ del año _________.

---

**POR CAUACORP**

Firma: ________________________________________

Nombre: **Amaury Amed**

Cargo: Chief Technology Officer

Documento de identidad: __________________________

Email: amauryamed@gmail.com

Fecha: ____ / ____ / ________

---

**POR EL AUDITOR (Universidad Distrital Francisco José de Caldas)**

Firma: ________________________________________

Nombre: **Andrés Gallardo**

Cargo: __________________________________________

Documento de identidad: __________________________

Email institucional: _____________________________

Fecha: ____ / ____ / ________

---

## ANEXO A — Lista nominal del equipo auditor

A completar por el Auditor antes de la firma. Solo las personas listadas pueden acceder a la Información Confidencial.

| # | Nombre completo | Email de contacto | Rol académico | Vinculación UD |
|---|---|---|---|---|
| 1 | Andrés Gallardo (responsable) | andresgalladofr@gmail.com | _por completar_ | _por completar_ |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |

> Si requiere agregar más personas durante la ventana, se debe firmar un anexo modificatorio aprobado por CAUA COLOMBIA SAS.

---

## ANEXO B — Alcance específico aprobado

A completar al inicio de la ventana, basado en el documento `01-onboarding-auditor.md` y cualquier ajuste de alcance acordado con el CTO.

- [ ] Frontend (React + Vite + TypeScript)
- [ ] Backend Supabase (Postgres, Edge Functions, Auth, Storage, Realtime)
- [ ] Smart contracts en Base Sepolia (5 contratos)
- [ ] Cadena Alchemy → Edge Function → DB ledger
- [ ] Integraciones Coinbase CDP / Persona / Chainalysis
- [ ] Postura de seguridad (RLS, secrets, geo-blocking)
- [ ] Compliance Decreto 1048 + Ley 1581 + KYC/AML
- [ ] Otros (especificar): __________________________________________

Aprobado por:

CTO CAUA COLOMBIA SAS: ________________________  Fecha: ____ / ____ / ________

Auditor responsable: ________________________  Fecha: ____ / ____ / ________
