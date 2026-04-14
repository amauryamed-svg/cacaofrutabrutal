-- ==========================================
-- CATACION LEADS — tabla pública sin auth
-- ==========================================
-- Captura leads de la página /catacion sin requerir sesión activa
-- El lead recibe magic link OTP de Supabase Auth para completar el registro

CREATE TABLE IF NOT EXISTS catacion_leads (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL UNIQUE,
  full_name  text NOT NULL,
  status     text NOT NULL DEFAULT 'lead'
               CHECK (status IN ('lead', 'magic_sent', 'confirmed')),
  source     text NOT NULL DEFAULT 'catacion',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para búsquedas frecuentes
CREATE INDEX idx_catacion_leads_email ON catacion_leads(email);
CREATE INDEX idx_catacion_leads_status ON catacion_leads(status);
CREATE INDEX idx_catacion_leads_created_at ON catacion_leads(created_at DESC);

-- RLS: la tabla es pública para inserts (formulario), privada para lecturas
ALTER TABLE catacion_leads ENABLE ROW LEVEL SECURITY;

-- Permite INSERT sin autenticación (usuarios públicos rellenando el formulario)
CREATE POLICY "catacion_leads_insert_public" ON catacion_leads
  FOR INSERT
  WITH CHECK (true);

-- Solo service_role (backend/admin) puede leer
CREATE POLICY "catacion_leads_select_service" ON catacion_leads
  FOR SELECT
  USING (auth.role() = 'service_role');

-- Solo service_role puede actualizar (admin workflow, notificaciones)
CREATE POLICY "catacion_leads_update_service" ON catacion_leads
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- Solo service_role puede eliminar
CREATE POLICY "catacion_leads_delete_service" ON catacion_leads
  FOR DELETE
  USING (auth.role() = 'service_role');

-- Comentario explicativo para futuras referencias
COMMENT ON TABLE catacion_leads IS
  'Tabla de leads capturados desde /catacion. '
  'No requiere sesión activa. Los leads reciben magic link OTP '
  'de Supabase Auth para convertirse en user_profiles autenticados.';
