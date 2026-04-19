# 📋 Propuesta "Cinco Tiempos de Cacao" — Instrucciones de Uso

## 📄 Archivos Generados

Dos versiones disponibles:

### 1. **Versión HTML Pura** (Recomendado para PDF)
- **Archivo:** `CincoTiemposCacao.html`
- **Ubicación:** Raíz del proyecto
- **Ventajas:**
  - Abre directamente en cualquier navegador
  - Perfectamente optimizada para impresión A4
  - Exportable a PDF (Ctrl+P o ⌘+P)
  - Sin dependencias de React
  - Portable y fácil de compartir

**Cómo usar:**
1. Abre el archivo en tu navegador: `File → Open File` o arrastra a la ventana
2. Verifica que se vea correctamente
3. Imprime a PDF: `Ctrl+P` (o `⌘+P` en Mac)
4. Selecciona:
   - Destino: "Guardar como PDF"
   - Tamaño: "A4"
   - Márgenes: "Ninguno"
   - Escala: "100%"
5. ¡Listo! PDF exportado

### 2. **Versión React** (Desarrollo integrado)
- **Archivo:** `src/pages/CincoTiemposProposal.tsx`
- **Ruta:** `http://localhost:3002/cinco-tiempos`
- **Logo SVG:** `src/assets/logo-caua.svg`

**Cómo usar en desarrollo:**
```bash
npm run dev
# Abre http://localhost:3002/cinco-tiempos
# Ctrl+P para exportar a PDF
```

---

## 🎨 Especificaciones Implementadas

✅ **IDENTIDAD VISUAL CAÚA**
- Paleta completa: Pod Green (#91A63B), Mazorca Yellow (#F1A91E), Amazon Green (#1C3B26), Cosmic Criollo (#8D2679), Heirloom White (#F7F1EE), Theobroma Orange (#DB5527)
- Tipografía: Cormorant Garamond (títulos) + Lato (body) — ambas desde Google Fonts
- Logo SVG integrado: white "caúa" con "á" en purple

✅ **ESTRUCTURA A4 (210mm × 297mm)**
- Header 140px: Logo + Tagline + Borde Mazorca Yellow
- Contenido: H1 "Cinco Tiempos de Cacao" + Subtítulo + Intro
- Cinco Tiempos en grid asimétrico numerado 01-05
- Pricing Base ($60.000) + Premium ($100.000)
- Triple Impacto: Comunidad | Agricultor | Ecosistema
- Footer 95px: Facilitadores + Detalles + Lema + Borde Superior Mazorca Yellow

✅ **DISEÑO**
- Fondo: Heirloom White (#F7F1EE)
- Header/Footer: Dark gradient → Amazon Green (#1C3B26)
- Editorial premium, minimalista, sin improvisaciones
- Animaciones fade-in sutiles (staggered)
- **Print-ready**: Optimizado para impresión A4 sin scroll
- Exportable a PDF vía navegador (Ctrl+P)

---

## 📱 Responsive Behavior

| Dispositivo | Comportamiento |
|-----------|---|
| **Pantalla (>900px)** | Layout A4 con sombra, animaciones activas |
| **Tablet/Mobile (<900px)** | Se adapta a ancho disponible, stack vertical |
| **Impresión (Print)** | A4 exacto, sin márgenes, sin sombras |

---

## 🖨️ Instrucciones de Exportación a PDF

### **Opción 1: Desde HTML puro (más simple)**
```
1. Abre: CincoTiemposCacao.html
2. Ctrl+P (Windows/Linux) o ⌘+P (Mac)
3. Destino: "Guardar como PDF"
4. Márgenes: Ninguno
5. Escala: 100%
6. Guardar
```

### **Opción 2: Desde React (http://localhost:3002/cinco-tiempos)**
```
1. npm run dev
2. Navega a: http://localhost:3002/cinco-tiempos
3. Ctrl+P o ⌘+P
4. Mismos ajustes como Opción 1
5. Guardar
```

### **Opción 3: Desde línea de comandos (si tienes Puppeteer)**
```bash
# Instalación una sola vez:
npm install -g puppeteer-cli

# Generar PDF:
puppeteer pdf CincoTiemposCacao.html --print-background
```

---

## 🔧 Customización

Si necesitas cambiar contenido, edita directamente:

### **Versión HTML:**
- Abre `CincoTiemposCacao.html` con tu editor de texto
- Busca el texto a cambiar (ej: "Cinco Tiempos de Cacao")
- Modifica y guarda
- Recarga en navegador

### **Versión React:**
- Edita `src/pages/CincoTiemposProposal.tsx`
- Los cambios se reflejan automáticamente con hot reload
- Exporta a PDF cuando esté listo

---

## 🎯 Colores de Referencia (Hex)

Para cualquier personalización futura:

| Color | Hex | Uso |
|-------|-----|-----|
| Pod Green | #91A63B | Acentos, bordes, bullets |
| Mazorca Yellow | #F1A91E | Bordes header/footer, énfasis |
| Amazon Green | #1C3B26 | Header/footer fondo, textos oscuros |
| Cosmic Criollo | #8D2679 | Números, énfasis morado |
| Heirloom White | #F7F1EE | Fondo principal |
| Theobroma Orange | #DB5527 | Links, precios, énfasis |

---

## ✨ Features Especiales

- **Animaciones Fade-in:** Los "Cinco Tiempos" aparecen con delay staggered
- **Grid Asimétrico:** Tiempos 4 y 5 al 50% de ancho (puede ajustarse)
- **Print-Ready:** Todas las fuentes son web-safe (Google Fonts)
- **Accesibilidad:** Estructura semántica HTML5 limpia
- **Mobile-First:** Responsive sin complicaciones

---

## 🚀 Próximos Pasos

1. **Revisar en navegador** ✓ (HTTP o HTML puro)
2. **Exportar a PDF** ✓ (Ctrl+P)
3. **Compartir o imprimir** → Lista para distribuir a clientes/stakeholders

---

## 📞 Soporte

Si necesitas:
- Cambiar colores → Busca hex en CSS/HTML
- Agregar secciones → Duplica un `.tiempo` o `.impacto-card`
- Ajustar espaciados → Modifica `padding`, `gap`, `margin`
- Cambiar tipografía → Edita `@import` de Google Fonts o `font-family`

**¿Problemas en impresión?** Asegúrate de:
- ✓ Márgenes: Ninguno
- ✓ Escala: 100%
- ✓ Fondos gráficos: Activado (en algunos navegadores)
- ✓ Encabezados/pies: Desactivados

---

## 📋 Checklist Final

- [x] Logo SVG integrado
- [x] Colores exactos Caúa
- [x] Tipografía Google Fonts
- [x] Layout A4 precise
- [x] Header/Footer con bordes Mazorca Yellow
- [x] Cinco Tiempos asimétrico
- [x] Pricing dual
- [x] Triple Impacto
- [x] Animaciones sutiles
- [x] Print-ready
- [x] Responsive
- [x] Exportable a PDF
- [x] Sin localStorage / sin console.log
- [x] Editorial premium

**Status:** ✅ LISTA PARA PRODUCCIÓN

---

Generated with ❤️ for Caúa | Turismo Sostenible × Cacao Regenerativo
