-- Migration 020: CauaBonga world — farms metadata + seed for 5 guardianes
-- Tabla pública (read-only para todos los usuarios autenticados); admin edita vía AdminCRM en futuras phases.

CREATE TABLE IF NOT EXISTS public.caua_bonga_farms (
  guardian_id    smallint    PRIMARY KEY,           -- 0..4 (matches GUARDIANS array index)
  region         text        NOT NULL,              -- 'Huila' | 'Arauca' | 'Cundinamarca' | 'Meta' | 'Santander'
  layout_x       numeric     NOT NULL,              -- coord en viewBox 100x130 del world map (0..100)
  layout_y       numeric     NOT NULL,              -- coord en viewBox 100x130 del world map (0..130)
  biome          text        NOT NULL,              -- 'cordillera' | 'sabana' | 'paramo' | 'piedemonte' | 'montana'
  asset_palette  jsonb       DEFAULT '{}'::jsonb,   -- color overrides futuros (e.g., { "accent": "#XXX" })
  npc_dialogue   text[]      DEFAULT '{}',          -- frases del guardián para tooltip/intro
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.caua_bonga_farms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "farms_public_read" ON public.caua_bonga_farms;
CREATE POLICY "farms_public_read" ON public.caua_bonga_farms
  FOR SELECT USING (true);

-- Seed 5 fincas correspondiendo al GUARDIANS array de constants.ts
INSERT INTO public.caua_bonga_farms (guardian_id, region, layout_x, layout_y, biome, npc_dialogue) VALUES
  (0, 'Huila',        27, 76, 'cordillera', ARRAY[
    '¡Bienvenido al Huila! Aquí, bajo el dosel de cedros, el cacao aprende a tomar su tiempo.',
    'Tercera generación cuidando esta finca. La fermentación en cajón de madera es nuestro arte.'
  ]),
  (1, 'Arauca',       55, 43, 'sabana', ARRAY[
    'La sabana araucana huele a flor blanca y maracuyá. Acércate sin miedo.',
    'Saravena 12, FEAR5, Tame 2 — cada variedad tiene su humor y su perfil.'
  ]),
  (2, 'Cundinamarca', 35, 63, 'paramo', ARRAY[
    'El viento del Sumapaz baja con dulzor. Cierra los ojos, lo vas a sentir.',
    'Polifenoles diméricos: el secreto del amargor fino del cacao altitudinal.'
  ]),
  (3, 'Meta',         40, 66, 'piedemonte', ARRAY[
    'Medalla de Oro 2024. Pero el verdadero premio es ver crecer las mazorcas.',
    'FEAR5 + San Vicente 41 — frutal, casi vinoso. El piedemonte les da carácter.'
  ]),
  (4, 'Santander',    40, 48, 'montana', ARRAY[
    'En Landázuri unimos las fincas atomizadas de la montaña santandereana.',
    'Trinitario robusto, perfil chocolatoso profundo. Trazabilidad lote a lote.'
  ])
ON CONFLICT (guardian_id) DO UPDATE SET
  region        = EXCLUDED.region,
  layout_x      = EXCLUDED.layout_x,
  layout_y      = EXCLUDED.layout_y,
  biome         = EXCLUDED.biome,
  npc_dialogue  = EXCLUDED.npc_dialogue;
