export interface BlogPost {
  id: string
  slug: string
  authorName: string
  authorRole: string
  authorBio?: string
  title: string
  subtitle: string
  bodyMd: string
  coverEmoji: string
  tags: string[]
  linkedTech?: string
  publishedAt: string
}

export const STATIC_BLOG_POSTS: BlogPost[] = [
  {
    id: 'post-1',
    slug: 'soberania-individual-salud',
    authorName: 'David Montoya',
    authorRole: 'Founder',
    authorBio: 'Co-Founder de CAUA · Investigador en nutrición y regeneración celular',
    title: 'La soberanía individual comienza por la salud',
    subtitle: 'Cómo el cacao regenera tus células y devuelve el poder a tu cuerpo',
    tags: ['nutriómica', 'regeneración', 'polifenoles', 'soberanía'],
    coverEmoji: '🫘',
    linkedTech: 'mucilage-extract',
    bodyMd: `# La soberanía individual comienza por la salud

La verdadera libertad no es política, es fisiológica.

En un mundo donde nuestros cuerpos se han convertido en campos de batalla para la industria alimentaria, la soberanía individual comienza donde menos la buscamos: **en la salud celular**.

No es una frase bonita. Es biología.

## El cacao como acto de resistencia

Durante 3,000 años, las culturas mesoamericanas supieron algo que occidente olvidó: el cacao no es un postre. Es un alimento sagrado que **regenera**.

Mucílago de cacao fresco contiene:
- **Epicatequina** (polifenol): regula la presión arterial y regenera mitocondrias
- **Teobromina**: dilata vasos sanguíneos, mejora oxigenación celular
- **Magnesio**: restaura el balance mineral que la moderna vida de estrés nos roba

Cuando consumes cacao regenerativo, no estás comprando un producto. **Estás recuperando tu poder metabólico**.

## Nutriómica: el idioma que tu cuerpo entiende

La nutriómica es la ciencia de cómo los nutrientes hablan con tu ADN. Cada molécula de alimento es una instrucción para tus células:

- ¿Regeneras o degeneras?
- ¿Inflas o desinflas?
- ¿Envejeces o rejuveneces?

El cacao regenerativo es nutriómica de élite. **Cada grano del Híbrido acriollado de Huila que cultivamos ha sido cuidado para maximizar esta conversación entre alimento y célula**.

## La revolución es celular, no política

No puedes votar tu libertad si tu cuerpo está encarcelado en inflamación crónica.

No puedes pensar con claridad si tu energía mitocondrial está apagada.

No puedes crear si estás agotado.

**La soberanía individual comienza cuando recuperas el control de lo que entra en tu cuerpo.** Y en CAUA, cada lote de cacao es un acto de liberación.

Tu salud. Tu poder. Tu libertad.

— David`,
    publishedAt: new Date().toISOString(),
  },
  {
    id: 'post-2',
    slug: 'nutreomica-cacao-stem-cells',
    authorName: 'David Montoya',
    authorRole: 'Founder',
    authorBio: 'Co-Founder de CAUA · Investigador en nutrición y regeneración celular',
    title: 'Nutriómica: el cacao que regenera tus células madre',
    subtitle: 'La ciencia detrás del rejuvenecimiento celular a través del mucílago de cacao',
    tags: ['nutriómica', 'células madre', 'epicatequina', 'regeneración'],
    coverEmoji: '🧬',
    linkedTech: 'mucilage-extract',
    bodyMd: `# Nutriómica: el cacao que regenera tus células madre

## ¿Qué son las células madre? La fuente de la juventud

Tu cuerpo nace con capacidad de auto-repararse. Esa capacidad vive en tus **células madre**: células indiferenciadas que pueden convertirse en cualquier cosa que tu cuerpo necesite.

Cuando tienes 20 años, tus células madre están activas.

Cuando tienes 40, muchas están dormidas.

**La pregunta de nutriómica es: ¿qué alimentos despiertan esas células dormidas?**

## La epicatequina: la llave que abre las células madre

En 2014, la investigación del Dr. Norman Hollenberg (Harvard) mostró algo revolucionario:

**La epicatequina (un polifenol del cacao) cruza la barrera hematoencefálica y activa mitocondrias nuevas**.

No es regeneración. Es **creación de nuevas mitocondrias**.

Cada mitocondria que despiertas es energía nueva. Cada célula madre que activas es potencial nuevo.

## El mucílago: donde vive la magia

No todos los cacaos son iguales.

El mucílago fresco de cacao criollo élite (lo que cultivamos en CAUA) tiene:
- **10X más epicatequina** que el cacao comercial
- **Enzimas vivas** que tu intestino puede metabolizar
- **Minerales quelados** (magnesio, zinc, hierro) que tu cuerpo absorbe directamente

Cuando hablamos de "nutriómica", hablamos de **cómo el lenguaje molecular del alimento impacta tu expresión genética**.

El mucílago de cacao regenerativo es un diccionario de juventud celular.

## La prueba está en tu energía

No tienes que creer en nutriómica.

Tu cuerpo te dirá la verdad en 2 semanas:
- Sueño más profundo
- Energía más estable
- Claridad mental sin caídas
- Resistencia física mejora

**Eso no es placebo. Es mitocondrias nuevas**.

— David`,
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'post-3',
    slug: 'polifenoles-dimericos-cardiovascular',
    authorName: 'Amaury Amed',
    authorRole: 'Founder',
    authorBio: 'Co-Founder de CAUA · Investigador en polifenoles y salud cardiovascular',
    title: 'Polifenoles diméricos y salud cardiovascular',
    subtitle: 'Por qué los procantocianidinas del cacao protegen tu corazón',
    tags: ['polifenoles', 'cardiovascular', 'salud', 'procantocianidinas'],
    coverEmoji: '❤️',
    linkedTech: 'mucilage-extract',
    bodyMd: `# Polifenoles diméricos y salud cardiovascular

## La enfermedad silenciosa: disfunción endotelial

El 50% de los ataques cardíacos ocurren en personas con colesterol "normal".

¿Por qué?

Porque el colesterol no es el culpable. **Es la inflamación del endotelio** (la capa que reviste tus arterias).

Un endotelio inflamado es una autopista sin señales: las células inmunes entran, causan placas, y el resultado es oclusión.

## Los polifenoles diméricos: la defensa endotelial

No todos los polifenoles del cacao son iguales.

**Los polifenoles diméricos** (procantocianidinas de dos moléculas) tienen una propiedad única:

1. **Cruzan la barrera intestinal** (la mayoría de polifenoles no lo hacen)
2. **Se depositan en el endotelio** (se adhieren directamente a las células que lo forman)
3. **Reducen inflamación sistémica** (inhiben NF-kB, el factor de transcripción pro-inflamatorio)
4. **Restauran función endotelial** (mejoran vasodilatación vía óxido nítrico)

## La fermentación controlada: la clave

En CAUA, los procesos de fermentación en el Huila no son arbitrarios.

**Están diseñados para maximizar polifenoles diméricos**:

- Fermentación lenta (5-7 días) preserva epicatequina
- Secado controlado a 55°C mantiene la estructura molecular
- Almacenamiento sin oxidación evita descomposición de dímeros

Un cacao comercial pierde el 70% de sus polifenoles en procesamiento.

**El nuestro retiene el 85%**.

## Los números: evidencia cardiovascular

Estudios recientes (2022-2024) muestran:

- **Epicatequina + procantocianidinas**: reducción de presión arterial en 7-12 mmHg
- **Consumo diario**: reversión de disfunción endotelial en 8-12 semanas
- **Efecto cardioprotector**: reducción de riesgo cardiovascular del 20-30%

Eso es comparable a algunos fármacos, sin efectos secundarios.

## Tu corazón es una elección diaria

No tienes que tomar estatinas si tu endotelio está sano.

No tienes que temer tu próximo chequeo cardiovascular si estás regenerando tu vascular.

**Cada grano de cacao que consumes es una votación por la salud de tu corazón**.

En CAUA, esa votación tiene peso. Literal y químicamente.

— Amaury`,
    publishedAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 'post-4',
    slug: 'fermentaciones-huila-lucho',
    authorName: 'Lucho',
    authorRole: 'Guardian, Finca Santamaría',
    authorBio: 'Guardian de cacao · Finca Santamaría, Huila · 30 años de tradición familiar',
    title: 'Fermentaciones controladas en el Huila: el fino y aroma del Híbrido acriollado',
    subtitle: 'Cómo 7 días de fermentación despiertan el potencial de 3 generaciones de cacao',
    tags: ['fermentación', 'huila', 'híbrido acriollado', 'aroma'],
    coverEmoji: '🌾',
    linkedTech: 'theobroma-brew',
    bodyMd: `# Fermentaciones controladas en el Huila: el fino y aroma del Híbrido acriollado

## Tres generaciones en una semana

Mi abuelo plantó el primer árbol de Híbrido acriollado en Finca Santamaría en 1992.

Mi papá lo cuidó durante 20 años.

Yo lo heredé con una misión: **mostrar al mundo lo que este cacao puede ser**.

No es cacao comercial. Es el resultado de 30 años de selección, cuidado, y respeto por el árbol.

## La fermentación: donde el cacao decide quién será

Mucha gente cree que la calidad del cacao viene del árbol.

**No. Viene de la fermentación**.

Durante 7 días, después de cosechar, el mucílago fresco alberga bacterias y levaduras que transforman las moléculas del grano:

- Los precursores de aroma se convierten en ésteres y aldehídos (notas florales, frutales)
- Los polifenoles se oxidan parcialmente (desarrollan astringencia balanceada)
- Los azúcares se convierten en ácidos complejos (caramelo, tueste natural)

**Si fermentas 3 días: cacao plano.**

**Si fermentas 5 días: cacao corriente.**

**Si fermentas 7 días con temperatura controlada (26-28°C): cacao fino.**

## Nuestro proceso: temperatura viva

En Finca Santamaría no usamos máquinas. Usamos botes de madera de 500 kg, cubiertos con plátano, monitoreados cada 12 horas.

Durante esos 7 días:

1. **Hora 0-24**: levaduras Saccharomyces dominan (producen alcohol, aroma)
2. **Hora 24-72**: bacterias acéticas Acetobacter toman el control (crean ácidos, notas florales)
3. **Hora 72-168**: fermentación lenta (estabilización, profundidad)

**En el día 7**, abrimos la caja y hueles el trabajo de 3 generaciones.

Notas de fruta roja, flores silvestres, miel... eso es Híbrido acriollado de Huila.

## El secado: la última prueba

Después viene el secado a 55°C durante 10-12 días. Aquí, muchos cacaos finos se pierden:

- Temperatura muy alta (>60°C) destruye aroma
- Demasiado tiempo pierde complejidad

Nosotros secamos lento, en tendales de madera, volteando 3 veces al día.

**Es trabajo manual. Es tradición. Es la razón por la que nuestro cacao nunca se olvida**.

## El resultado: para quién fermentamos

No vendemos cacao. Vendemos **7 días de fermentación controlada**.

Cada grano que llega a tu taza es el resultado de:

- 30 años de selección genética (mi familia)
- 7 días de transformación química (las bacterias)
- 12 días de secado respetado (nuestras manos)

**Por eso en CAUA no encontrarás "cacao bueno". Encontrarás el Híbrido acriollado. Punto**.

Es el que plantó mi abuelo.

Es el que cuidó mi papá.

Es el que mi hijo va a heredar.

— Lucho, Finca Santamaría`,
    publishedAt: new Date(Date.now() - 259200000).toISOString(),
  },
]
