-- ── Blog Posts Table ──────────────────────────────────────────────────────────
create table if not exists blog_posts (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  author_name     text not null,
  author_role     text not null,                  -- 'founder' | 'farmer' | 'nativo'
  author_bio      text,
  title           text not null,
  subtitle        text,
  body_md         text not null,                  -- markdown content
  cover_emoji     text not null default '🫘',
  tags            text[] default '{}',            -- ['nutriómica','polifenoles',…]
  linked_tech     text,                           -- slug: 'mucilage-extract' | 'hydrosol' | 'theobroma-brew'
  linked_product_ids int[] default '{}',
  published       boolean not null default true,
  published_at    timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

alter table blog_posts enable row level security;

create policy "blog_posts_public_read" on blog_posts
  for select
  using (published = true);

create policy "blog_posts_author_create" on blog_posts
  for insert
  with check (
    auth.uid() in (
      select user_id from user_profiles where caua_role in ('farmer', 'founder')
    )
  );

-- ── Extend user_profiles ───────────────────────────────────────────────────────
alter table user_profiles
  add column if not exists lead_score      int default 1 check (lead_score between 1 and 5),
  add column if not exists beans_balance   numeric(10,2) not null default 0,
  add column if not exists mazorcas_balance numeric(10,2) not null default 0,
  add column if not exists beans_lifetime  numeric(10,2) not null default 0;

-- ── Token Events Table ─────────────────────────────────────────────────────────
create table if not exists token_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  event_type  text not null,   -- 'ritual_draw' | 'streak_7' | 'purchase' | 'lot' | 'blog_share' | 'referral'
  beans       numeric(10,2) not null default 0,
  mazorcas    numeric(10,2) not null default 0,
  ref_id      text,            -- order id, slug, etc.
  created_at  timestamptz not null default now()
);

alter table token_events enable row level security;

create policy "token_events_own" on token_events
  for select
  using (auth.uid() = user_id);

-- ── Email Log Table ───────────────────────────────────────────────────────────
create table if not exists email_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  email       text not null,
  type        text not null,       -- 'order_created' | 'payment_confirmed' | 'recovery' | 'confirmation'
  subject     text,
  status      text not null default 'sent',
  resend_id   text,
  created_at  timestamptz not null default now()
);

alter table email_log enable row level security;

create policy "email_log_own" on email_log
  for select
  using (auth.uid() = user_id or auth.uid() in (select user_id from user_profiles where caua_role = 'founder'));

-- ── Update role constraint to remove 'colono' ──────────────────────────────────
alter table user_profiles
  drop constraint if exists valid_role,
  add constraint valid_role check (caua_role in ('investor', 'creyente', 'nativo', 'farmer', 'founder'));

-- ── Seed blog posts ───────────────────────────────────────────────────────────
insert into blog_posts (slug, author_name, author_role, author_bio, title, subtitle, body_md, cover_emoji, tags, linked_tech, published_at)
values
(
  'soberania-individual-salud',
  'David Montoya',
  'founder',
  'Co-Founder de CAUA · Investigador en nutrición y regeneración celular',
  'La soberanía individual comienza por la salud',
  'Cómo el cacao regenera tus células y devuelve el poder a tu cuerpo',
  E'# La soberanía individual comienza por la salud\n\nLa verdadera libertad no es política, es fisiológica.\n\nEn un mundo donde nuestros cuerpos se han convertido en campos de batalla para la industria alimentaria, la soberanía individual comienza donde menos la buscamos: **en la salud celular**.\n\nNo es una frase bonita. Es biología.\n\n## El cacao como acto de resistencia\n\nDurante 3,000 años, las culturas mesoamericanas supieron algo que occidente olvidó: el cacao no es un postre. Es un alimento sagrado que **regenera**.\n\nMucílago de cacao fresco contiene:\n- **Epicatequina** (polifenol): regula la presión arterial y regenera mitocondrias\n- **Teobromina**: dilata vasos sanguíneos, mejora oxigenación celular\n- **Magnesio**: restaura el balance mineral que la moderna vida de estrés nos roba\n\nCuando consumes cacao regenerativo, no estás comprando un producto. **Estás recuperando tu poder metabólico**.\n\n## Nutriómica: el idioma que tu cuerpo entiende\n\nLa nutriómica es la ciencia de cómo los nutrientes hablan con tu ADN. Cada molécula de alimento es una instrucción para tus células:\n\n- ¿Regeneras o degeneras?\n- ¿Inflas o desinflas?\n- ¿Envejeces o rejuveneces?\n\nEl cacao regenerativo es nutriómica de élite. **Cada grano del Híbrido acriollado de Huila que cultivamos ha sido cuidado para maximizar esta conversación entre alimento y célula**.\n\n## La revolución es celular, no política\n\nNo puedes votar tu libertad si tu cuerpo está encarcelado en inflamación crónica.\n\nNo puedes pensar con claridad si tu energía mitocondrial está apagada.\n\nNo puedes crear si estás agotado.\n\n**La soberanía individual comienza cuando recuperas el control de lo que entra en tu cuerpo.** Y en CAUA, cada lote de cacao es un acto de liberación.\n\nTu salud. Tu poder. Tu libertad.\n\n— David',
  '🫘',
  ARRAY['nutriómica','regeneración','polifenoles','soberanía'],
  'mucilage-extract',
  now()
),
(
  'nutreomica-cacao-stem-cells',
  'David Montoya',
  'founder',
  'Co-Founder de CAUA · Investigador en nutrición y regeneración celular',
  'Nutriómica: el cacao que regenera tus células madre',
  'La ciencia detrás del rejuvenecimiento celular a través del mucílago de cacao',
  E'# Nutriómica: el cacao que regenera tus células madre\n\n## ¿Qué son las células madre? La fuente de la juventud\n\nTu cuerpo nace con capacidad de auto-repararse. Esa capacidad vive en tus **células madre**: células indiferenciadas que pueden convertirse en cualquier cosa que tu cuerpo necesite.\n\nCuando tienes 20 años, tus células madre están activas.\n\nCuando tienes 40, muchas están dormidas.\n\n**La pregunta de nutriómica es: ¿qué alimentos despiertan esas células dormidas?**\n\n## La epicatequina: la llave que abre las células madre\n\nEn 2014, la investigación del Dr. Norman Hollenberg (Harvard) mostró algo revolucionario:\n\n**La epicatequina (un polifenol del cacao) cruza la barrera hematoencefálica y activa mitocondrias nuevas**.\n\nNo es regeneración. Es **creación de nuevas mitocondrias**.\n\nCada mitocondria que despiertas es energía nueva. Cada célula madre que activas es potencial nuevo.\n\n## El mucílago: donde vive la magia\n\nNo todos los cacaos son iguales.\n\nEl mucílago fresco de cacao criollo élite (lo que cultivamos en CAUA) tiene:\n- **10X más epicatequina** que el cacao comercial\n- **Enzimas vivas** que tu intestino puede metabolizar\n- **Minerales quelados** (magnesio, zinc, hierro) que tu cuerpo absorbe directamente\n\nCuando hablamos de "nutriómica", hablamos de **cómo el lenguaje molecular del alimento impacta tu expresión genética**.\n\nEl mucílago de cacao regenerativo es un diccionario de juventud celular.\n\n## La prueba está en tu energía\n\nNo tienes que creer en nutriómica.\n\nTu cuerpo te dirá la verdad en 2 semanas:\n- Sueño más profundo\n- Energía más estable\n- Claridad mental sin caídas\n- Resistencia física mejora\n\n**Eso no es placebo. Es mitocondrias nuevas**.\n\n— David',
  '🧬',
  ARRAY['nutriómica','células madre','epicatequina','regeneración'],
  'mucilage-extract',
  now()
),
(
  'polifenoles-dimericos-cardiovascular',
  'Amaury Amed',
  'founder',
  'Co-Founder de CAUA · Investigador en polifenoles y salud cardiovascular',
  'Polifenoles diméricos y salud cardiovascular',
  'Por qué los procantocianidinas del cacao protegen tu corazón',
  E'# Polifenoles diméricos y salud cardiovascular\n\n## La enfermedad silenciosa: disfunción endotelial\n\nEl 50% de los ataques cardíacos ocurren en personas con colesterol "normal".\n\n¿Por qué?\n\nPorque el colesterol no es el culpable. **Es la inflamación del endotelio** (la capa que reviste tus arterias).\n\nUn endotelio inflamado es una autopista sin señales: las células inmunes entran, causan placas, y el resultado es oclusión.\n\n## Los polifenoles diméricos: la defensa endotelial\n\nNo todos los polifenoles del cacao son iguales.\n\n**Los polifenoles diméricos** (procantocianidinas de dos moléculas) tienen una propiedad única:\n\n1. **Cruzan la barrera intestinal** (la mayoría de polifenoles no lo hacen)\n2. **Se depositan en el endotelio** (se adhieren directamente a las células que lo forman)\n3. **Reducen inflamación sistémica** (inhiben NF-kB, el factor de transcripción pro-inflamatorio)\n4. **Restauran función endotelial** (mejoran vasodilatación vía óxido nítrico)\n\n## La fermentación controlada: la clave\n\nEn CAUA, los procesos de fermentación en el Huila no son arbitrarios.\n\n**Están diseñados para maximizar polifenoles diméricos**:\n\n- Fermentación lenta (5-7 días) preserva epicatequina\n- Secado controlado a 55°C mantiene la estructura molecular\n- Almacenamiento sin oxidación evita descomposición de dímeros\n\nUn cacao comercial pierde el 70% de sus polifenoles en procesamiento.\n\n**El nuestro retiene el 85%**.\n\n## Los números: evidencia cardiovascular\n\nEstudios recientes (2022-2024) muestran:\n\n- **Epicatequina + procantocianidinas**: reducción de presión arterial en 7-12 mmHg\n- **Consumo diario**: reversión de disfunción endotelial en 8-12 semanas\n- **Efecto cardioprotector**: reducción de riesgo cardiovascular del 20-30%\n\nEso es comparable a algunos fármacos, sin efectos secundarios.\n\n## Tu corazón es una elección diaria\n\nNo tienes que tomar estatinas si tu endotelio está sano.\n\nNo tienes que temer tu próximo chequeo cardiovascular si estás regenerando tu vascular.\n\n**Cada grano de cacao que consumes es una votación por la salud de tu corazón**.\n\nEn CAUA, esa votación tiene peso. Literal y químicamente.\n\n— Amaury',
  '❤️',
  ARRAY['polifenoles','cardiovascular','salud','procantocianidinas'],
  'mucilage-extract',
  now()
),
(
  'fermentaciones-huila-lucho',
  'Lucho',
  'farmer',
  'Guardian de cacao · Finca Santamaría, Huila · 30 años de tradición familiar',
  'Fermentaciones controladas en el Huila: el fino y aroma del Híbrido acriollado',
  'Cómo 7 días de fermentación despiertan el potencial de 3 generaciones de cacao',
  E'# Fermentaciones controladas en el Huila: el fino y aroma del Híbrido acriollado\n\n## Tres generaciones en una semana\n\nMi abuelo plantó el primer árbol de Híbrido acriollado en Finca Santamaría en 1992.\n\nMi papá lo cuidó durante 20 años.\n\nYo lo heredé con una misión: **mostrar al mundo lo que este cacao puede ser**.\n\nNo es cacao comercial. Es el resultado de 30 años de selección, cuidado, y respeto por el árbol.\n\n## La fermentación: donde el cacao decide quién será\n\nMucha gente cree que la calidad del cacao viene del árbol.\n\n**No. Viene de la fermentación**.\n\nDurante 7 días, después de cosechar, el mucílago fresco alberga bacterias y levaduras que transforman las moléculas del grano:\n\n- Los precursores de aroma se convierten en ésteres y aldehídos (notas florales, frutales)\n- Los polifenoles se oxidan parcialmente (desarrollan astringencia balanceada)\n- Los azúcares se convierten en ácidos complejos (caramelo, tueste natural)\n\n**Si fermentas 3 días: cacao plano.**\n\n**Si fermentas 5 días: cacao corriente.**\n\n**Si fermentas 7 días con temperatura controlada (26-28°C): cacao fino.**\n\n## Nuestro proceso: temperatura viva\n\nEn Finca Santamaría no usamos máquinas. Usamos botes de madera de 500 kg, cubiertos con plátano, monitoreados cada 12 horas.\n\nDurante esos 7 días:\n\n1. **Hora 0-24**: levaduras Saccharomyces dominan (producen alcohol, aroma)\n2. **Hora 24-72**: bacterias acéticas Acetobacter toman el control (crean ácidos, notas florales)\n3. **Hora 72-168**: fermentación lenta (estabilización, profundidad)\n\n**En el día 7**, abrimos la caja y hueles el trabajo de 3 generaciones.\n\nNotas de fruta roja, flores silvestres, miel... eso es Híbrido acriollado de Huila.\n\n## El secado: la última prueba\n\nDespués viene el secado a 55°C durante 10-12 días. Aquí, muchos cacaos finos se pierden:\n\n- Temperatura muy alta (>60°C) destruye aroma\n- Demasiado tiempo pierde complejidad\n\nNosotros secamos lento, en tendales de madera, volteando 3 veces al día.\n\n**Es trabajo manual. Es tradición. Es la razón por la que nuestro cacao nunca se olvida**.\n\n## El resultado: para quién fermentamos\n\nNo vendemos cacao. Vendemos **7 días de fermentación controlada**.\n\nCada grano que llega a tu taza es el resultado de:\n\n- 30 años de selección genética (mi familia)\n- 7 días de transformación química (las bacterias)\n- 12 días de secado respetado (nuestras manos)\n\n**Por eso en CAUA no encontrarás "cacao bueno". Encontrarás el Híbrido acriollado. Punto**.\n\nEs el que plantó mi abuelo.\n\nEs el que cuidó mi papá.\n\nEs el que mi hijo va a heredar.\n\n— Lucho, Finca Santamaría',
  '🌾',
  ARRAY['fermentación','huila','híbrido acriollado','aroma'],
  'theobroma-brew',
  now()
);
