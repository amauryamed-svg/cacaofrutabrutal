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

  // ── Guardiana Marta · Arauca ────────────────────────────────────────
  {
    id: 'post-5',
    slug: 'guardiana-marta-arauca',
    authorName: 'Marta',
    authorRole: 'Guardiana · Saravena, Arauca',
    authorBio: 'La Alquimista del Llano · Modelo Araucano · Criollo Élite (Saravena 12 · FEAR5 · Tame 2)',
    title: 'La Alquimista del Llano: cómo la sabana inundable hace floral mi cacao',
    titleEn: 'The Alchemist of the Llano: How the Flooded Savanna Makes My Cacao Floral',
    subtitle: 'Modelo Araucano desde 2011 · tres variedades tipificadas · notas de maracuyá y flor blanca',
    subtitleEn: 'Araucan Model since 2011 · three typified varieties · maracuyá and white flower notes',
    tags: ['arauca', 'criollo élite', 'fine-flavor', 'modelo araucano', 'territorio'],
    tagsEn: ['arauca', 'criollo elite', 'fine-flavor', 'araucan model', 'territory'],
    coverEmoji: '🌸',
    linkedTech: 'mucilage-extract',
    bodyMd: `# La Alquimista del Llano: cómo la sabana inundable hace floral mi cacao

## Saravena no es como cualquier otro lugar

Saravena se inunda 6 meses al año.

Los suelos cambian con el agua. Los aromas del aire cambian con la fluctuación. Mis árboles aprenden a sobrevivir bajo agua y luego a florecer bajo sol intenso.

**Eso es lo que pone el perfil floral en mi cacao**: una planta que ha pasado por estrés hídrico extremo concentra precursores aromáticos que ningún cacao de tierra firme tiene.

Por eso me dicen *La Alquimista del Llano*. Yo no hago alquimia. La hace el territorio.

## Tres variedades tipificadas — únicas en Colombia

Desde 2011 trabajamos con el **Modelo Araucano**, un programa que tipificó tres variedades de Criollo Élite que sólo existen aquí:

- **Saravena 12** — mazorca verde · perfil cítrico-floral
- **FEAR5 Arauquita** — mazorca naranja · maracuyá y flor blanca · la que ganó Medalla de Oro
- **Tame 2** — mazorca amarilla pequeña · dulzor profundo

No son híbridos comerciales. Son seleccionadas en finca, generación tras generación, desde el linaje original Criollo. **El 1% del cacao mundial es Criollo Élite. Mis tres variedades pertenecen a ese 1%.**

## Qué hace mi cacao único — y a quién le sirve

El Criollo Élite araucano no es para chocolate de góndola. Es para:

- **Barras de autor 100%** — chocolatería boutique que respeta el origen
- **Liofilizados premium** — cuando se preserva el aroma fresco intacto
- **Chocolatería funcional** — porque su mucílago concentra epicatequina + teobromina
- **Fine-Flavor export** — para mercados que pagan el precio del 1%

El mucílago tiene tanta personalidad que se usa solo, sin azúcar añadida, en bebidas funcionales. Eso es lo que hace **MucilageExtract™** — rescatar el subproducto que tradicionalmente se tiraba al suelo del llano.

## El impacto que llega a Saravena

Cuando adoptas un árbol conmigo, el 60% del precio de adopción cae directamente en la finca:

- **Compañeros agroforestales**: plátano hartón, mango tommy, aguacate hass — sombra y diversificación de ingreso
- **Cajones de fermentación de madera** — el corazón del fine-flavor
- **Cuartos de frío** para preservar el mucílago fresco antes del transporte

El otro 30% va a R&D + producción (ahí nace la tecnología que rescata mi mucílago) y 10% a comunidad + reinversión.

**La sabana se inunda. Los compradores cambian. Lo que no cambia es la finca.** Cada cacao adoptado es una raíz más anclada al territorio.

— Marta · Saravena, Arauca`,
    bodyMdEn: `# The Alchemist of the Llano: How the Flooded Savanna Makes My Cacao Floral

## Saravena is unlike anywhere else

Saravena floods six months a year.

The soils change with the water. The aromas in the air change with the fluctuation. My trees learn to survive submerged and then bloom under intense sun.

**That's what puts the floral profile into my cacao**: a plant that has been through extreme water stress concentrates aromatic precursors no upland cacao has.

That's why they call me *The Alchemist of the Llano*. I don't make alchemy. The territory does.

## Three typified varieties — unique in Colombia

Since 2011 we have worked with the **Araucan Model**, a program that typified three Criollo Élite varieties that only exist here:

- **Saravena 12** — green pod · citrus-floral profile
- **FEAR5 Arauquita** — orange pod · maracuyá and white flower · the one that won Gold Medal
- **Tame 2** — small yellow pod · deep sweetness

These are not commercial hybrids. They are farm-selected, generation after generation, from the original Criollo lineage. **Criollo Élite is 1% of the world's cacao. My three varieties belong to that 1%.**

## What makes my cacao unique — and who it serves

Araucan Criollo Élite is not for shelf chocolate. It's for:

- **Author bars 100%** — boutique chocolatiers who respect origin
- **Premium freeze-dried** — when fresh aroma is preserved intact
- **Functional chocolate** — because its mucilage concentrates epicatechin + theobromine
- **Fine-Flavor export** — for markets that pay the 1% price

The mucilage has so much personality it's used straight, no added sugar, in functional drinks. That's what **MucilageExtract™** does — rescue the byproduct traditionally dumped on llano soil.

## The impact that reaches Saravena

When you adopt a tree with me, 60% of the adoption price lands directly on the farm:

- **Agroforestry companions**: hartón plantain, tommy mango, hass avocado — shade and income diversification
- **Wooden fermentation boxes** — the heart of fine-flavor
- **Cold rooms** to preserve fresh mucilage before transport

The other 30% goes to R&D + production (that's where the technology that rescues my mucilage is born) and 10% to community + reinvestment.

**The savanna floods. Buyers change. What doesn't change is the farm.** Every adopted cacao is one more root anchored in the territory.

— Marta · Saravena, Arauca`,
    publishedAt: new Date(Date.now() - 345600000).toISOString(),
  },

  // ── Guardian Rafael · Sumapaz, Cundinamarca ─────────────────────────
  {
    id: 'post-6',
    slug: 'guardian-rafael-sumapaz',
    authorName: 'Rafael',
    authorRole: 'Guardián · Arbeláez, Cundinamarca',
    authorBio: 'El Ingeniero del Sabor · cacao altitudinal del Sumapaz · polifenoles diméricos premium',
    title: 'El Ingeniero del Sabor: el viento del Magdalena, el páramo del Sumapaz, y el dulzor que nadie más tiene',
    titleEn: 'The Engineer of Flavor: The Magdalena Wind, the Sumapaz Páramo, and the Sweetness No One Else Has',
    subtitle: 'Cacao altitudinal · polifenoles diméricos · 5 variedades de Criollo Élite tipificadas',
    subtitleEn: 'Altitudinal cacao · dimeric polyphenols · 5 typified Criollo Élite varieties',
    tags: ['cundinamarca', 'sumapaz', 'altitud', 'polifenoles', 'criollo élite'],
    tagsEn: ['cundinamarca', 'sumapaz', 'altitude', 'polyphenols', 'criollo elite'],
    coverEmoji: '🥭',
    linkedTech: 'theobroma-brew',
    bodyMd: `# El Ingeniero del Sabor: el viento del Magdalena, el páramo del Sumapaz, y el dulzor que nadie más tiene

## Dos vientos que se encuentran en mi finca

En Arbeláez, Cundinamarca, mi finca está en la línea exacta donde se cruzan dos corrientes que ningún otro cacao colombiano recibe juntas:

1. El **viento cálido y húmedo del río Magdalena**, cargado de aerosoles dulces de la cuenca tropical
2. El **viento frío y seco del páramo del Sumapaz**, cargado de minerales de la roca

Cuando ambos se condensan sobre mis árboles, pasa algo único: **el mucílago se carga de azúcares naturales y los polifenoles del grano se compactan en estructuras diméricas más estables**.

Por eso me dicen *El Ingeniero del Sabor*. Pero el ingeniero real es la geografía.

## Polifenoles diméricos — la palabra que pocos entienden

Los polifenoles del cacao normal son monoméricos: una molécula sola, fácil de oxidar, fácil de perder en el procesado.

En cacao altitudinal del Sumapaz, los polifenoles se enlazan en **dímeros** — pares estables que aguantan tueste, fermentación y digestión.

¿Qué significa para tu cuerpo?

- **Más epicatequina sobreviviendo** hasta llegar a tu intestino
- **Mejor biodisponibilidad cardiovascular** — el polifenol llega activo a tus vasos sanguíneos
- **Amargor fino, no agresivo** — la oxidación parcial da una astringencia balanceada

Es el cacao que la chocolatería premium busca cuando quiere sabor profundo sin amargor punzante.

## Cinco variedades · una sola finca

En Arbeláez tipificamos cinco variedades de Criollo Élite trabajando con el linaje del Modelo Araucano y selecciones propias:

- **FEAR5** — el favorito de la cata profesional
- **Saravena 12** — el verde con perfil cítrico
- **San Vicente 41** — mazorca morado-roja, para barras de autor
- **Bolívar 1** — dulzor altitudinal denso
- **Gigante 4** — mazorca grande, rendimiento alto sin perder fineza

Cada una expresa el viento Magdalena × Sumapaz a su manera.

## El impacto que llega a Arbeláez

Cuando me adoptas, el 60% directo a la finca financia:

- **Plátano dominico, mango tommy técnico, guayabo** — agroforestería que estabiliza el microclima
- **Tendales de secado lento** — esenciales para preservar los polifenoles diméricos
- **Análisis de polifenoles** — laboratorios externos que verifican que cada lote cumple el perfil prometido

El 30% R&D produce las tecnologías que rescatan el mucílago dulce-altitudinal y lo convierten en bebida funcional cardiovascular. El 10% reinvierte en comunidad — los vecinos que también quieren entrar al modelo de cacao altitudinal.

**El páramo no se mueve. El río no se mueve. La finca tampoco. Tu adopción ancla las tres.**

— Rafael · Arbeláez, Cundinamarca`,
    bodyMdEn: `# The Engineer of Flavor: The Magdalena Wind, the Sumapaz Páramo, and the Sweetness No One Else Has

## Two winds that meet on my farm

In Arbeláez, Cundinamarca, my farm sits on the exact line where two currents — that no other Colombian cacao receives together — cross:

1. The **warm, humid wind from the Magdalena River**, loaded with sweet aerosols from the tropical basin
2. The **cold, dry wind from the Sumapaz páramo**, loaded with rock minerals

When they condense over my trees, something unique happens: **the mucilage loads with natural sugars and the bean's polyphenols compact into more stable dimeric structures**.

That's why they call me *The Engineer of Flavor*. But the real engineer is geography.

## Dimeric polyphenols — the word few people understand

Normal cacao polyphenols are monomeric: a single molecule, easy to oxidize, easy to lose during processing.

In altitudinal Sumapaz cacao, polyphenols link into **dimers** — stable pairs that withstand roasting, fermentation, and digestion.

What does that mean for your body?

- **More epicatechin surviving** to your gut
- **Better cardiovascular bioavailability** — the polyphenol arrives active at your blood vessels
- **Fine bitterness, not aggressive** — partial oxidation gives a balanced astringency

It's the cacao premium chocolatiers want when they're after deep flavor without sharp bitterness.

## Five varieties · one single farm

In Arbeláez we typified five Criollo Élite varieties working with the Araucan Model lineage and our own selections:

- **FEAR5** — the favorite of professional tasting
- **Saravena 12** — the green one with citrus profile
- **San Vicente 41** — purple-red pod, for author bars
- **Bolívar 1** — dense altitudinal sweetness
- **Gigante 4** — large pod, high yield without losing finesse

Each expresses the Magdalena × Sumapaz wind in its own way.

## The impact that reaches Arbeláez

When you adopt with me, the direct 60% to the farm funds:

- **Dominico plantain, technical tommy mango, guava** — agroforestry that stabilizes the microclimate
- **Slow drying racks** — essential to preserve dimeric polyphenols
- **Polyphenol analysis** — external labs verifying every batch meets the promised profile

The 30% R&D produces technologies that rescue the sweet-altitudinal mucilage and turn it into functional cardiovascular drink. The 10% reinvests in community — neighbors who also want to enter the altitudinal cacao model.

**The páramo doesn't move. The river doesn't move. Neither does the farm. Your adoption anchors all three.**

— Rafael · Arbeláez, Cundinamarca`,
    publishedAt: new Date(Date.now() - 432000000).toISOString(),
  },

  // ── Guardian Fernando · Meta · Medalla de Oro ───────────────────────
  {
    id: 'post-7',
    slug: 'guardian-fernando-meta-oro',
    authorName: 'Fernando',
    authorRole: 'Guardián · Guamal, Meta',
    authorBio: 'El Explorador del Piedemonte · Medalla de Oro Cacao de Excelencia 2024 · FEAR5 + San Vicente 41',
    title: 'Medalla de Oro 2024: cómo el piedemonte del Meta cosecha cacao casi vinoso',
    titleEn: 'Gold Medal 2024: How the Meta Foothills Yield an Almost-Wine-Like Cacao',
    subtitle: 'Cacao de Excelencia · perfil frutal y vinoso · transición Andes-Llano',
    subtitleEn: 'Cocoa of Excellence · fruity and wine-like profile · Andes-Llano transition',
    tags: ['meta', 'medalla de oro', 'cacao de excelencia', 'piedemonte', 'fine-flavor'],
    tagsEn: ['meta', 'gold medal', 'cocoa of excellence', 'foothills', 'fine-flavor'],
    coverEmoji: '🍇',
    linkedTech: 'mucilage-extract',
    bodyMd: `# Medalla de Oro 2024: cómo el piedemonte del Meta cosecha cacao casi vinoso

## Soy el explorador, no el dueño

En Guamal, Meta, mi finca está en la transición entre los Andes y el llano. No es montaña. No es sabana. Es un piedemonte caprichoso, con suelos que cambian cada 200 metros y nubes que se quedan atrapadas contra la cordillera.

A mí me dicen *El Explorador del Piedemonte*. Pero la verdad es que el cacao explora. Yo solo lo acompaño.

## La Medalla de Oro 2024

En 2024, dos de mis variedades — **FEAR5** y **San Vicente 41** — ganaron la **Medalla de Oro en Cacao de Excelencia**, el reconocimiento internacional más exigente del mundo del fine-flavor.

¿Qué significa eso? Que el panel de cata global descubrió en mis lotes algo que nunca habían encontrado en otro cacao colombiano:

- Notas **frutales casi vinosas** — fresa madura, ciruela negra, uva noble
- **Especias dulces de fondo** — clavo, canela, pimienta rosada
- **Acidez balanceada** que no se confunde con astringencia

Esas notas no son aleatorias. Son el resultado del microclima del piedemonte: mucha humedad por la mañana, sol intenso al mediodía, descenso brusco de temperatura por la tarde. **Estrés diario que el árbol convierte en complejidad aromática**.

## El apoyo técnico que cambia las reglas

No estoy solo. Trabajo con dos instituciones que hicieron posible la medalla:

- **Fedecacao** — federación nacional, asistencia agronómica
- **Agrosavia** — investigación pública, identificación genética de variedades

Sin ellos, FEAR5 y San Vicente 41 serían "cacao bueno" anónimo. Con ellos son material genético tipificado, trazable, defendible en la cata internacional.

## Qué se hace con el cacao premiado

El Criollo Élite premiado no se desperdicia en chocolate comercial. Va a:

- **Barras de autor premiadas** — chocolatiers que cobran $30-60 USD por barra
- **Liofilizados gourmet** — donde el aroma vinoso se preserva intacto
- **Fine-Flavor export** — Europa, Japón, Corea
- **Cacao de Excelencia** — la categoría reservada al 1% del 1%

El mucílago, naturalmente cargado de teobromina y notas frutales, alimenta la línea **MucilageExtract™ de CAUA** — la bebida funcional con más epicatequina del mercado andino.

## El impacto que llega a Guamal

Tu adopción · 60% directo a la finca:

- **Plátano hartón, nogal cafetero, guamo** — sombra alta para un piedemonte que se calienta rápido
- **Sistemas de control de humedad** en los cajones de fermentación — clave para mantener el perfil frutal
- **Etiquetado de lote a lote** — porque cada cosecha del piedemonte es distinta y vale ser nombrada

30% R&D + producción · 10% comunidad y reinversión.

**Una medalla de oro no se gana con suerte. Se gana cuando el territorio, la genética y la disciplina se cruzan en un lugar específico. Tu adopción mantiene ese cruce vivo.**

— Fernando · Guamal, Meta`,
    bodyMdEn: `# Gold Medal 2024: How the Meta Foothills Yield an Almost-Wine-Like Cacao

## I'm the explorer, not the owner

In Guamal, Meta, my farm sits in the transition between the Andes and the llano. Not mountain. Not savanna. A capricious foothills zone, with soils that change every 200 meters and clouds that get trapped against the cordillera.

They call me *The Explorer of the Foothills*. But the truth is the cacao explores. I just go along.

## The 2024 Gold Medal

In 2024, two of my varieties — **FEAR5** and **San Vicente 41** — won the **Gold Medal at Cocoa of Excellence**, the most demanding international recognition in the fine-flavor world.

What does that mean? That the global tasting panel found something in my lots they had never found in any other Colombian cacao:

- **Almost wine-like fruity notes** — ripe strawberry, black plum, noble grape
- **Sweet background spices** — clove, cinnamon, pink pepper
- **Balanced acidity** not confused with astringency

Those notes aren't random. They're the result of the foothills microclimate: heavy morning humidity, intense midday sun, sharp afternoon temperature drop. **Daily stress the tree converts into aromatic complexity**.

## The technical support that changes the rules

I'm not alone. I work with two institutions that made the medal possible:

- **Fedecacao** — national federation, agronomic assistance
- **Agrosavia** — public research, varietal genetic identification

Without them, FEAR5 and San Vicente 41 would be anonymous "good cacao." With them they are typified, traceable genetic material defensible in international tasting.

## What gets made with award-winning cacao

Award-winning Criollo Élite isn't wasted on commercial chocolate. It goes to:

- **Award-winning author bars** — chocolatiers who charge $30-60 USD per bar
- **Gourmet freeze-dried** — where the wine-like aroma is preserved intact
- **Fine-Flavor export** — Europe, Japan, Korea
- **Cocoa of Excellence** — the category reserved for the 1% of the 1%

The mucilage, naturally loaded with theobromine and fruity notes, feeds CAUA's **MucilageExtract™** line — the functional drink with the most epicatechin in the Andean market.

## The impact that reaches Guamal

Your adoption · 60% direct to the farm:

- **Hartón plantain, coffee walnut, guamo** — high shade for foothills that heat up fast
- **Humidity control systems** in fermentation boxes — key to keeping the fruity profile
- **Lot-to-lot labeling** — because every foothills harvest is different and deserves to be named

30% R&D + production · 10% community and reinvestment.

**A gold medal is not won by luck. It's won when territory, genetics and discipline cross in a specific place. Your adoption keeps that crossing alive.**

— Fernando · Guamal, Meta`,
    publishedAt: new Date(Date.now() - 518400000).toISOString(),
  },

  // ── Guardian Ricardo · Santander ────────────────────────────────────
  {
    id: 'post-8',
    slug: 'guardian-ricardo-santander',
    authorName: 'Ricardo',
    authorRole: 'Guardián · Landázuri, Santander',
    authorBio: 'El Certificador · Trinitario Robusto · trazabilidad lote a lote · cadena de frío',
    title: 'El Certificador: cómo unimos las fincas atomizadas de Landázuri en una sola cadena de frío',
    titleEn: 'The Certifier: How We United the Atomized Farms of Landázuri Into One Cold Chain',
    subtitle: 'Trinitario robusto · tradición santandereana · trazabilidad lote a lote',
    subtitleEn: 'Robust Trinitario · Santander tradition · lot-to-lot traceability',
    tags: ['santander', 'trinitario', 'trazabilidad', 'cadena de frío', 'asociatividad'],
    tagsEn: ['santander', 'trinitario', 'traceability', 'cold chain', 'associativity'],
    coverEmoji: '⚗️',
    linkedTech: 'theobroma-brew',
    bodyMd: `# El Certificador: cómo unimos las fincas atomizadas de Landázuri en una sola cadena de frío

## Santander es montaña, no llano

En Landázuri, Santander, las fincas son pequeñas y están dispersas. Una hectárea aquí, dos hectáreas allá, separadas por trochas que se vuelven barro en invierno.

Esa atomización es buena para la biodiversidad — pero terrible para el comprador, que necesita volúmenes consistentes y trazabilidad real.

A mí me dicen *El Certificador*. Mi trabajo es coser estas fincas dispersas en una sola cadena de calidad sin perder la identidad de cada lote.

## El Trinitario: chocolatería seria, no boutique

Yo no trabajo Criollo Élite como mis colegas Marta o Fernando. Trabajo **Trinitario**.

¿Por qué importa la diferencia?

El Trinitario es un cruce robusto entre Criollo y Forastero. No tiene la fineza floral del Criollo Élite, pero tiene algo que el Criollo no da:

- **Sabor a cacao profundo** — el chocolate "sabe a chocolate"
- **Rendimiento alto** — la finca produce volumen comercial real
- **Robustez en taza** — aguanta tueste alto sin perder cuerpo

Es el cacao para **bombones, chocolatinas, tabletas de 70% hacia abajo, coberturas gourmet**. Donde el público quiere chocolate confiable, no una experiencia de cata.

## La cadena de frío: por qué importa cada hora

Una mazorca cosechada en finca empieza a degradarse a las 6 horas si no se controla la temperatura.

En Landázuri montamos un **centro de acopio con cuartos de frío** que recibe el cacao de 30+ fincas asociadas a las 8-12 horas de cosechado. Ahí se baja la temperatura a 18°C, se mide Brix (azúcares del mucílago) en laboratorio, se etiqueta el lote con su finca de origen, y se entra a fermentación con datos en mano.

**Ese paso convierte cacao "santandereano" anónimo en cacao trazable lote a lote** — y eso es lo que un comprador europeo serio paga.

## Las asociaciones que sostienen Landázuri

Trabajamos en red con:

- **Asociaciones locales de productores** — pequeños cacaoculturos que sin la asociatividad no podrían exportar
- **Fedecacao Santander** — apoyo agronómico y certificaciones
- **Laboratorio de Brix** propio — el corazón técnico de la trazabilidad

Cada lote sale con una hoja de vida: finca de origen, hora de cosecha, Brix entrada, días de fermentación, temperatura de secado. **Si lo puedes leer, lo puedes vender al precio del fine-flavor.**

## El impacto que llega a Landázuri

Tu adopción · 60% directo a la finca de uno de los 30+ productores asociados (rotación):

- **Plátano dominico, caucho, cedro negro** — sombra alta y diversificación de ingreso
- **Sostenimiento del laboratorio de Brix** y los cuartos de frío del centro de acopio
- **Gastos de certificación** — orgánico, fine-flavor, trazabilidad

El 30% R&D + producción se invierte en mejorar la cadena de frío rural — uno de los cuellos de botella más reales del cacao colombiano. El 10% reinvierte en la comunidad: los vecinos que faltan por entrar al modelo asociativo.

**No vendo cacao bueno. Vendo cacao trazable. La diferencia es 7 horas de cadena de frío y 30 fincas que se pusieron de acuerdo.**

— Ricardo · Landázuri, Santander`,
    bodyMdEn: `# The Certifier: How We United the Atomized Farms of Landázuri Into One Cold Chain

## Santander is mountain, not llano

In Landázuri, Santander, farms are small and scattered. One hectare here, two hectares over there, separated by dirt roads that turn to mud in winter.

That atomization is good for biodiversity — but terrible for the buyer, who needs consistent volume and real traceability.

They call me *The Certifier*. My job is to stitch these scattered farms into a single quality chain without losing the identity of each lot.

## Trinitario: serious chocolate, not boutique

I don't work Criollo Élite like my colleagues Marta or Fernando. I work **Trinitario**.

Why does the difference matter?

Trinitario is a robust cross between Criollo and Forastero. It doesn't have the floral finesse of Criollo Élite, but it has something Criollo doesn't:

- **Deep cacao flavor** — chocolate that "tastes like chocolate"
- **High yield** — the farm produces real commercial volume
- **Cup robustness** — withstands high roast without losing body

It's the cacao for **bonbons, chocolate bars, tablets 70% and below, gourmet couvertures**. Where the public wants reliable chocolate, not a tasting experience.

## The cold chain: why every hour matters

A pod harvested on the farm starts degrading after 6 hours if temperature isn't controlled.

In Landázuri we set up a **collection center with cold rooms** that receives cacao from 30+ associated farms 8-12 hours after harvest. There the temperature is dropped to 18°C, Brix (mucilage sugars) is measured in lab, the lot is labeled with its farm of origin, and fermentation begins with data in hand.

**That step converts anonymous "Santander cacao" into lot-traceable cacao** — and that's what a serious European buyer pays for.

## The associations that hold up Landázuri

We work in a network with:

- **Local producer associations** — small cacao farmers who couldn't export without associativity
- **Fedecacao Santander** — agronomic support and certifications
- **Our own Brix laboratory** — the technical heart of traceability

Every lot leaves with a CV: farm of origin, harvest time, entry Brix, days of fermentation, drying temperature. **If you can read it, you can sell it at fine-flavor prices.**

## The impact that reaches Landázuri

Your adoption · 60% direct to one of the 30+ associated producers (rotating):

- **Dominico plantain, rubber, black cedar** — high shade and income diversification
- **Sustaining the Brix lab** and the collection center's cold rooms
- **Certification costs** — organic, fine-flavor, traceability

The 30% R&D + production invests in improving the rural cold chain — one of the most real bottlenecks in Colombian cacao. The 10% reinvests in community: the neighbors who still need to enter the associative model.

**I don't sell good cacao. I sell traceable cacao. The difference is 7 hours of cold chain and 30 farms that agreed.**

— Ricardo · Landázuri, Santander`,
    publishedAt: new Date(Date.now() - 604800000).toISOString(),
  },
]
