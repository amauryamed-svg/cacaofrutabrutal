# CAUA Brand Guidelines — Reference Completo

## Identidad de Marca

**Nombre:** caúa (minúsculas, con tilde)
**Tagline ES:** con la naturaleza caminamos
**Tagline EN:** with nature we walk
**Descriptor:** Biotecnología ancestral del cacao colombiano · Novel Foods funcionales · Agroforestería regenerativa

---

## Paleta de Colores

### Colores primarios
| Token           | Nombre               | Hex       | Uso                                      |
|-----------------|----------------------|-----------|------------------------------------------|
| `heirloom`      | Heirloom White       | `#F7F1EE` | Texto principal, fondo claro             |
| `amazon`        | Amazon Green         | `#1C3B26` | Fondos oscuros secundarios, bordes       |
| `pod`           | Pod Green            | `#91A63B` | Acento primario, CTAs, logos             |
| `mazorca`       | Mazorca Gold         | `#F1A91E` | Acento energético, highlights            |
| `criollo`       | Cosmic Criollo       | `#8D2679` | Acento ritual/místico, acento en ú       |
| `theobroma`     | Theobroma Orange     | `#DB5527` | Acento cálido, gradientes                |
| `muisca`        | Muisca Blue          | `#004E64` | Acento profundo, agua                    |
| `heroic`        | Heroic Cyan          | `#00A3CD` | Datos, enlaces tecnológicos              |

### Colores de fondo (solo hex, NUNCA variables CSS)
| Token     | Hex       | Uso                         |
|-----------|-----------|-----------------------------| 
| `bgDeep`  | `#040C06` | Fondo principal de la app   |
| `bgDark`  | `#0F2218` | Inputs, paneles secundarios |
| `bgCard`  | `#132B1C` | Cards, contenedores         |

### Colores adicionales
| Nombre          | Hex       | Uso                     |
|-----------------|-----------|-------------------------|
| Leafy Green     | `#667039` | Vegetación, terciario   |
| Radio Red       | `#8C201D` | Alertas, urgencia       |
| Santa María     | `#583915` | Tierra, herencia        |

---

## Tipografía

### Jerarquía de fuentes
1. **Acumin Pro** (Adobe Fonts) — Primaria: UI, body text, etiquetas
   - Sustituto Google Fonts: **DM Sans** → `font-family: 'DM Sans', system-ui, sans-serif`
2. **Gelica** (fuente pagada) — Secundaria: Display editorial, luxury serif
   - Sustituto Google Fonts: **Cormorant Garamond** → `font-family: 'Cormorant Garamond', Georgia, serif`
3. **Century Gothic** — Terciaria: Geométrica, subtítulos
   - Sustituto: **Barlow Condensed** (ya cargado) para headers condensados

### Reglas tipográficas
- Headers display: Barlow Condensed 900, UPPERCASE, letterSpacing `-0.02em` a `0.15em`
- Body texto: DM Sans 400/500, lineHeight 1.6–1.7
- Editorial/poético: Cormorant Garamond italic, color `mazorca`
- Etiquetas/badges: Barlow Condensed 700, UPPERCASE, letterSpacing `0.12em+`
- NUNCA usar font-size menor a 10px en producción
- Scale: 10 / 11 / 12 / 13 / 14 / 16 / 18 / 24 / 32 / 48 / 64 / 96 / 120px

---

## Logotipo

### Wordmark oficial
- Texto: **caúa** (siempre minúsculas)
- Letterforms: redondeados, Pod Green `#91A63B`
- Acento en **ú**: Cosmic Criollo `#8D2679` — teardrop/gota sobre la u
- Proporción: ratio horizontal ~3:1 (ancho:alto)

### Variantes
| Variante  | Uso                              | Color base       |
|-----------|----------------------------------|------------------|
| Default   | Fondos oscuros (app)             | Pod Green        |
| White     | Sobre fondos muy oscuros         | Heirloom White   |
| Dark      | Fondos claros (print, docs)      | Amazon Green     |
| Compact   | NavBar, favicons, pequeños usos  | Pod Green        |

### Reglas logo
- Área de protección: ½ × altura del logotipo en todos los lados
- No rotar, distorsionar, ni cambiar colores fuera de las variantes
- No usar sobre fondos que rompan contraste ≥ 4.5:1

### Ícono de marca (pod botanical)
- Forma: cápsula/pod de cacao estilizada (elipse vertical con nervaduras)
- Color: Pod Green `#91A63B`
- Uso: solo cuando el espacio no admite el wordmark completo

---

## Sistema de Diseño — Componentes

### Cards
```
background: #132B1C
border: 1px solid #1C3B2666
borderRadius: 12–16px
padding: 20–24px
boxShadow: 0 8px 32px rgba(0,0,0,0.3)
```

### Cards destacadas (hover/active)
```
border: 1px solid #91A63B44
boxShadow: 0 16px 48px rgba(145,166,59,0.12)
```

### Botones primarios
```
background: linear-gradient(135deg, #91A63B, #1C3B26)
color: #F7F1EE
borderRadius: 999px
fontFamily: 'Barlow Condensed', sans-serif
fontWeight: 700
letterSpacing: 0.12em
```

### Inputs
```
background: #0F2218
border: 1px solid #1C3B2666
borderRadius: 8px
color: #F7F1EE
fontFamily: 'DM Sans', system-ui
```

### Grain overlay
```
opacity: 0.035  (3.5%)
position: fixed, zIndex: 9999
pointerEvents: none
```

---

## Voz y Tono

### Principios
- **Directa** — no palabras vacías, cada frase tiene peso
- **Poética** — metáforas botánicas, tiempo de la naturaleza
- **Precisa** — cifras reales, beneficios verificables
- **Brutalist luxury** — sin suavizantes pasteles, sin eufemismos corporativos

### Vocabulario activo
**ES:** semilla, cosecha, fermentación, guardián, fruta, terroir, origen, transformación, ciclo, floración, mucílago, ancestral, regenerativo, potencia, comunidad, ritual

**EN:** seed, harvest, fermentation, guardian, fruit, terroir, origin, transformation, cycle, flowering, mucilage, ancestral, regenerative, potency, community, ritual

### Palabras prohibidas
- "revolucionario", "disruptivo", "innovador" (son clichés)
- "premium" sin sustancia detrás
- "orgánico" (usar "regenerativo" o "agroforestal")
- Eufemismos pasivos: "tratamos de", "intentamos"

### Copywriting por sección
- **Hero:** promesa audaz + sustancia científica (ej: "Mucílago 20% · Epicatequina · Teobromina")
- **Producto:** nombre en UPPERCASE + descriptor funcional en minúsculas
- **Guardián:** región + poder + herencia (no "historia", sino datos reales)
- **CTA:** verbo de acción + destino ("RESERVA TU LOTE", no "Haz clic aquí")

---

## Motion & Animación

### Principios
- Transiciones: 0.3s ease para hover, 1.2s cubic-bezier(0.16, 1, 0.3, 1) para entradas hero
- Float animation: 4s ease-in-out infinite para elementos flotantes
- Fade-in-up: translateY(40px→0) + opacity(0→1) en entrada de página
- Glow pulse: box-shadow pulsante para estados activos ritual

### CSS keyframes requeridos
```css
@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes glowPulse {
  0%, 100% { box-shadow: 0 0 20px rgba(145,166,59,0.2); }
  50%       { box-shadow: 0 0 48px rgba(145,166,59,0.5); }
}
```

---

## Anti-Patrones (PROHIBIDOS)

1. **Gradientes pastel** — ningún color con opacidad mayor al 30% sobre blanco
2. **Fondos con variables CSS** (`var(--color)`) — solo hex directos
3. **localStorage** — usar Supabase o React context
4. **Demografía asumida** — todos los textos son agnósticos de género/edad
5. **Emojis como iconografía principal** — usar SVG botánicos
6. **Sombras grises** — solo sombras con tinte de color de marca
7. **Bordes con colores sólidos** — siempre con alpha (`#1C3B2666`, no `#1C3B26`)
8. **Fuentes sistema sin fallback** — siempre declarar stack completo

---

## Ilustraciones y Assets

### Estilo ilustrativo
- **Botanical brutalism** — líneas orgánicas con peso geométrico
- Trazo: 0.4–1px, sin rellenos sólidos (máx opacity 0.35)
- Motivos: pod de cacao, mazorca, hoja theobroma, raíces, flores pentámeras, fermentación
- Paleta: color del elemento (Tierra/Fuego/Agua/Aire) sobre fondo `#0D1A10`

### Guardians
- Cada guardián tiene un "poder" funcional (ej: "Escala + Complejidad Aromática")
- Herencia: "Campesina" / "Indígena" / "Indígena + Campesina"
- No añadir foto placeholder — usar el sistema de iniciales + gradiente

### Ritual/Tarot
- 22 arcanos mayores mapeados a ciclos de cacao
- Elementos: Tierra (#91A63B), Fuego (#DB5527), Agua (#004E64), Aire (#00A3CD)
- Arcano numerado en romano + nombre en español

---

## Métricas de Calidad UI

| Criterio               | Estándar mínimo                           |
|------------------------|-------------------------------------------|
| Contraste texto/fondo  | ≥ 4.5:1 (WCAG AA)                        |
| Touch targets          | ≥ 44×44px                                |
| Responsive             | 375 / 768 / 1280px                       |
| Grain overlay          | 3.5% opacity, fixed, zIndex 9999         |
| Animaciones            | prefers-reduced-motion: skip animations   |
| Fuentes cargadas       | DM Sans + Barlow Condensed + Cormorant   |
