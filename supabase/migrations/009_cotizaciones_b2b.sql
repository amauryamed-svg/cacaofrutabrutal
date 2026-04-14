-- Tabla de cotizaciones B2B — dinámica de ventas privadas
CREATE TABLE IF NOT EXISTS cotizaciones_b2b (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text NOT NULL UNIQUE,
  destinatario  text NOT NULL,
  email         text NOT NULL UNIQUE,
  empresa       text,
  cargo         text,
  monto_base    int NOT NULL DEFAULT 60000,
  monto_premium int NOT NULL DEFAULT 100000,
  status        text NOT NULL DEFAULT 'enviada'
                  CHECK (status IN ('enviada', 'vista', 'aceptada', 'rechazada')),
  vista_en      timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- RLS: Solo el destinatario (via email autenticado) puede ver su propia cotización
ALTER TABLE cotizaciones_b2b ENABLE ROW LEVEL SECURITY;

-- RLS Policy 1: Destinatario ve su cotización
CREATE POLICY "cotizaciones_b2b_owner_read" ON cotizaciones_b2b
  FOR SELECT USING (email = auth.email());

-- RLS Policy 2: Service role (admin/backend) puede hacer todo
CREATE POLICY "cotizaciones_b2b_service" ON cotizaciones_b2b
  USING (auth.role() = 'service_role');

-- RLS Policy 3: Insert inicial
CREATE POLICY "cotizaciones_b2b_service_insert" ON cotizaciones_b2b
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Índice en email para RLS rápida
CREATE INDEX idx_cotizaciones_b2b_email ON cotizaciones_b2b(email);

-- Seed inicial: Andrea Rojas
INSERT INTO cotizaciones_b2b (slug, destinatario, email, empresa, cargo, monto_base, monto_premium)
VALUES (
  'andrea-rojas',
  'Andrea Rojas',
  'andrea.rojas@cesa.edu.co',
  'Universidad CESA',
  'Turismo Sostenible',
  60000,
  100000
) ON CONFLICT (slug) DO NOTHING;
