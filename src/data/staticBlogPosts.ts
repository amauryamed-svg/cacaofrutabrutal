export interface BlogPost {
  id: string
  slug: string
  authorName: string
  authorRole: string
  authorBio?: string
  title: string
  titleEn: string
  subtitle: string
  subtitleEn: string
  bodyMd: string
  bodyMdEn: string
  coverEmoji: string
  tags: string[]
  tagsEn: string[]
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
    titleEn: 'Individual Sovereignty Begins with Health',
    subtitle: 'Cómo el cacao regenera tus células y devuelve el poder a tu cuerpo',
    subtitleEn: 'How cacao regenerates your cells and returns power to your body',
    tags: ['nutriómica', 'regeneración', 'polifenoles', 'soberanía'],
    tagsEn: ['nutrigenomics', 'regeneration', 'polyphenols', 'sovereignty'],
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
    bodyMdEn: `# Individual Sovereignty Begins with Health

True freedom is not political—it's physiological.

In a world where our bodies have become battlegrounds for the food industry, individual sovereignty begins where we least expect to find it: **in cellular health**.

It's not a pretty phrase. It's biology.

## Cacao as an act of resistance

For 3,000 years, Mesoamerican cultures knew something the West forgot: cacao is not a dessert. It's a sacred food that **regenerates**.

Fresh cacao mucilage contains:
- **Epicatechin** (polyphenol): regulates blood pressure and regenerates mitochondria
- **Theobromine**: dilates blood vessels, improves cellular oxygenation
- **Magnesium**: restores the mineral balance that modern stress steals from you

When you consume regenerative cacao, you're not buying a product. **You're reclaiming your metabolic power**.

## Nutrigenomics: the language your body understands

Nutrigenomics is the science of how nutrients speak to your DNA. Every food molecule is an instruction for your cells:

- Do you regenerate or degenerate?
- Do you reduce inflammation or increase it?
- Do you age or rejuvenate?

Regenerative cacao is elite nutrigenomics. **Every bean of the Criollo Hybrid from Huila that we cultivate has been nurtured to maximize this conversation between food and cell**.

## The revolution is cellular, not political

You cannot vote for freedom if your body is imprisoned in chronic inflammation.

You cannot think clearly if your mitochondrial energy is shut down.

You cannot create if you're exhausted.

**Individual sovereignty begins when you reclaim control of what enters your body.** And at CAUA, every batch of cacao is an act of liberation.

Your health. Your power. Your freedom.

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
    titleEn: 'Nutrigenomics: The Cacao That Regenerates Your Stem Cells',
    subtitle: 'La ciencia detrás del rejuvenecimiento celular a través del mucílago de cacao',
    subtitleEn: 'The science behind cellular rejuvenation through cacao mucilage',
    tags: ['nutriómica', 'células madre', 'epicatequina', 'regeneración'],
    tagsEn: ['nutrigenomics', 'stem cells', 'epicatechin', 'regeneration'],
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
    bodyMdEn: `# Nutrigenomics: The Cacao That Regenerates Your Stem Cells

## What are stem cells? The fountain of youth

Your body is born with the capacity to self-repair. That capacity lives in your **stem cells**: undifferentiated cells that can become anything your body needs.

When you're 20, your stem cells are active.

When you're 40, many are asleep.

**The nutrigenomics question is: what foods awaken those dormant cells?**

## Epicatechin: the key that unlocks stem cells

In 2014, research by Dr. Norman Hollenberg from Harvard revealed something revolutionary:

**Epicatechin (a polyphenol from cacao) crosses the blood-brain barrier and activates new mitochondria**.

It's not regeneration. It's **creation of new mitochondria**.

Every mitochondrion you awaken is new energy. Every stem cell you activate is new potential.

## The mucilage: where the magic lives

Not all cacaos are created equal.

The fresh mucilage of elite Criollo cacao (what we cultivate at CAUA) has:
- **10X more epicatechin** than commercial cacao
- **Living enzymes** your gut can metabolize
- **Chelated minerals** (magnesium, zinc, iron) your body absorbs directly

When we talk about "nutrigenomics," we're talking about **how the molecular language of food impacts your genetic expression**.

Regenerative cacao mucilage is a dictionary of cellular youth.

## The proof is in your energy

You don't have to believe in nutrigenomics.

Your body will tell you the truth in 2 weeks:
- Deeper sleep
- More stable energy
- Mental clarity without crashes
- Improved physical endurance

**That's not placebo. That's new mitochondria**.

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
    titleEn: 'Dimeric Polyphenols and Cardiovascular Health',
    subtitle: 'Por qué los procantocianidinas del cacao protegen tu corazón',
    subtitleEn: 'Why cacao procyanidins protect your heart',
    tags: ['polifenoles', 'cardiovascular', 'salud', 'procantocianidinas'],
    tagsEn: ['polyphenols', 'cardiovascular', 'health', 'procyanidins'],
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
    bodyMdEn: `# Dimeric Polyphenols and Cardiovascular Health

## The silent disease: endothelial dysfunction

50% of heart attacks occur in people with "normal" cholesterol.

Why?

Because cholesterol isn't the culprit. **It's endothelial inflammation** (the layer that lines your arteries).

An inflamed endothelium is a highway with no signals: immune cells enter, plaques form, and the result is occlusion.

## Dimeric polyphenols: endothelial defense

Not all cacao polyphenols are created equal.

**Dimeric polyphenols** (two-molecule procyanidins) have a unique property:

1. **They cross the intestinal barrier** (most polyphenols don't)
2. **They deposit in the endothelium** (they adhere directly to the cells that form it)
3. **They reduce systemic inflammation** (they inhibit NF-kB, the pro-inflammatory transcription factor)
4. **They restore endothelial function** (they improve vasodilation via nitric oxide)

## Controlled fermentation: the key

At CAUA, fermentation processes in Huila are not arbitrary.

**They're designed to maximize dimeric polyphenols**:

- Slow fermentation (5-7 days) preserves epicatechin
- Controlled drying at 55°C maintains molecular structure
- Storage without oxidation prevents dimer breakdown

Commercial cacao loses 70% of its polyphenols in processing.

**Ours retains 85%**.

## The numbers: cardiovascular evidence

Recent studies (2022-2024) show:

- **Epicatechin + procyanidins**: blood pressure reduction of 7-12 mmHg
- **Daily consumption**: reversal of endothelial dysfunction in 8-12 weeks
- **Cardioprotective effect**: 20-30% reduction in cardiovascular risk

That's comparable to some pharmaceuticals—without side effects.

## Your heart is a daily choice

You don't need statins if your endothelium is healthy.

You don't need to fear your next cardiovascular checkup if you're regenerating your vasculature.

**Every cacao bean you consume is a vote for your heart health**.

At CAUA, that vote carries weight. Literally and chemically.

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
    titleEn: 'Controlled Fermentation in Huila: The Fine Flavor and Aroma of Criollo Hybrid',
    subtitle: 'Cómo 7 días de fermentación despiertan el potencial de 3 generaciones de cacao',
    subtitleEn: 'How 7 days of fermentation awakens the potential of 3 generations of cacao',
    tags: ['fermentación', 'huila', 'híbrido acriollado', 'aroma'],
    tagsEn: ['fermentation', 'huila', 'criollo hybrid', 'aroma'],
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
    bodyMdEn: `# Controlled Fermentation in Huila: The Fine Flavor and Aroma of Criollo Hybrid

## Three generations in one week

My grandfather planted the first Criollo Hybrid tree at Finca Santamaría in 1992.

My father cared for it for 20 years.

I inherited it with a mission: **to show the world what this cacao can become**.

This isn't commercial cacao. It's the result of 30 years of selection, care, and respect for the tree.

## Fermentation: where cacao decides who it will become

Many people believe cacao quality comes from the tree.

**It doesn't. It comes from fermentation**.

For 7 days after harvest, fresh mucilage hosts bacteria and yeasts that transform the bean's molecules:

- Aroma precursors become esters and aldehydes (floral, fruity notes)
- Polyphenols partially oxidize (developing balanced astringency)
- Sugars become complex acids (caramel, natural roasting)

**Ferment for 3 days: flat cacao.**

**Ferment for 5 days: ordinary cacao.**

**Ferment for 7 days with controlled temperature (26-28°C): fine cacao.**

## Our process: living temperature

At Finca Santamaría, we don't use machines. We use 500 kg wooden boxes, covered with plantain leaves, monitored every 12 hours.

During those 7 days:

1. **Hour 0-24**: Saccharomyces yeast dominates (produces alcohol, aroma)
2. **Hour 24-72**: Acetobacter acetic bacteria take over (create acids, floral notes)
3. **Hour 72-168**: slow fermentation (stabilization, depth)

**On day 7**, we open the box and smell the work of 3 generations.

Red fruit notes, wildflowers, honey... that's Criollo Hybrid from Huila.

## Drying: the final test

Then comes drying at 55°C for 10-12 days. This is where many fine cacaos are lost:

- Too-high temperatures (>60°C) destroy aroma
- Too much time loses complexity

We dry slowly, on wooden racks, turning 3 times a day.

**It's manual work. It's tradition. It's why our cacao is never forgotten**.

## The result: who we ferment for

We don't sell cacao. We sell **7 days of controlled fermentation**.

Every bean that reaches your cup is the result of:

- 30 years of genetic selection (my family)
- 7 days of chemical transformation (the bacteria)
- 12 days of respected drying (our hands)

**That's why at CAUA you won't find "good cacao." You'll find Criollo Hybrid. Period.**

It's what my grandfather planted.

It's what my father nurtured.

It's what my son will inherit.

— Lucho, Finca Santamaría`,
    publishedAt: new Date(Date.now() - 259200000).toISOString(),
  },
]
