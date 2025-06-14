/*
  # Nomencladores Schema

  1. New Tables
    - `paises` - Countries table
    - `tipos_documento_identidad` - Identity document types
    - `tipos_documento_factura` - Invoice document types
    - `tipos_impuesto` - Tax types
    - `formas_pago` - Payment methods
    - `tipos_movimiento_tesoreria` - Treasury movement types
    - `tipos_moneda` - Currency types
    - `bancos` - Banks
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create countries table
CREATE TABLE IF NOT EXISTS paises (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  codigo TEXT NOT NULL,
  codigo_iso TEXT NOT NULL,
  moneda_principal TEXT NOT NULL,
  simbolo_moneda TEXT NOT NULL,
  formato_fecha TEXT DEFAULT 'DD/MM/YYYY',
  separador_decimal TEXT DEFAULT '.',
  separador_miles TEXT DEFAULT ',',
  plan_contable_base TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create identity document types table
CREATE TABLE IF NOT EXISTS tipos_documento_identidad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  codigo TEXT NOT NULL,
  descripcion TEXT,
  pais_id TEXT NOT NULL REFERENCES paises(id),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create invoice document types table
CREATE TABLE IF NOT EXISTS tipos_documento_factura (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  codigo TEXT NOT NULL,
  descripcion TEXT,
  pais_id TEXT NOT NULL REFERENCES paises(id),
  activo BOOLEAN DEFAULT true,
  requiere_impuesto BOOLEAN DEFAULT true,
  requiere_cliente BOOLEAN DEFAULT true,
  afecta_inventario BOOLEAN DEFAULT true,
  afecta_contabilidad BOOLEAN DEFAULT true,
  prefijo TEXT,
  formato TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create tax types table
CREATE TABLE IF NOT EXISTS tipos_impuesto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  codigo TEXT NOT NULL,
  porcentaje DECIMAL(10, 2) NOT NULL,
  tipo TEXT NOT NULL,
  pais_id TEXT NOT NULL REFERENCES paises(id),
  activo BOOLEAN DEFAULT true,
  cuenta_contable_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create payment methods table
CREATE TABLE IF NOT EXISTS formas_pago (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  codigo TEXT NOT NULL,
  descripcion TEXT,
  pais_id TEXT NOT NULL REFERENCES paises(id),
  activo BOOLEAN DEFAULT true,
  requiere_banco BOOLEAN DEFAULT false,
  requiere_referencia BOOLEAN DEFAULT false,
  requiere_fecha BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create treasury movement types table
CREATE TABLE IF NOT EXISTS tipos_movimiento_tesoreria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  codigo TEXT NOT NULL,
  descripcion TEXT,
  pais_id TEXT NOT NULL REFERENCES paises(id),
  activo BOOLEAN DEFAULT true,
  afecta_saldo BOOLEAN DEFAULT true,
  requiere_referencia BOOLEAN DEFAULT false,
  requiere_documento BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create currency types table
CREATE TABLE IF NOT EXISTS tipos_moneda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  codigo TEXT NOT NULL,
  simbolo TEXT NOT NULL,
  pais_id TEXT NOT NULL REFERENCES paises(id),
  activo BOOLEAN DEFAULT true,
  es_principal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create banks table
CREATE TABLE IF NOT EXISTS bancos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  codigo TEXT NOT NULL,
  pais_id TEXT NOT NULL REFERENCES paises(id),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE paises ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_documento_identidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_documento_factura ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_impuesto ENABLE ROW LEVEL SECURITY;
ALTER TABLE formas_pago ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_movimiento_tesoreria ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_moneda ENABLE ROW LEVEL SECURITY;
ALTER TABLE bancos ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow read for authenticated users" ON paises
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert for authenticated users" ON paises
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update for authenticated users" ON paises
  FOR UPDATE TO authenticated USING (true);

-- Create policies for all nomenclador tables
DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOR table_name IN 
    SELECT 'tipos_documento_identidad' UNION
    SELECT 'tipos_documento_factura' UNION
    SELECT 'tipos_impuesto' UNION
    SELECT 'formas_pago' UNION
    SELECT 'tipos_movimiento_tesoreria' UNION
    SELECT 'tipos_moneda' UNION
    SELECT 'bancos'
  LOOP
    EXECUTE format('CREATE POLICY "Allow read for authenticated users" ON %I FOR SELECT TO authenticated USING (true)', table_name);
    EXECUTE format('CREATE POLICY "Allow insert for authenticated users" ON %I FOR INSERT TO authenticated WITH CHECK (true)', table_name);
    EXECUTE format('CREATE POLICY "Allow update for authenticated users" ON %I FOR UPDATE TO authenticated USING (true)', table_name);
    EXECUTE format('CREATE POLICY "Allow delete for authenticated users" ON %I FOR DELETE TO authenticated USING (true)', table_name);
  END LOOP;
END $$;

-- Insert default countries
INSERT INTO paises (id, nombre, codigo, codigo_iso, moneda_principal, simbolo_moneda, activo)
VALUES
  ('peru', 'Perú', 'PE', 'PER', 'PEN', 'S/', true),
  ('colombia', 'Colombia', 'CO', 'COL', 'COP', '$', true),
  ('mexico', 'México', 'MX', 'MEX', 'MXN', '$', true),
  ('argentina', 'Argentina', 'AR', 'ARG', 'ARS', '$', true),
  ('chile', 'Chile', 'CL', 'CHL', 'CLP', '$', true),
  ('ecuador', 'Ecuador', 'EC', 'ECU', 'USD', '$', true),
  ('bolivia', 'Bolivia', 'BO', 'BOL', 'BOB', 'Bs', true),
  ('uruguay', 'Uruguay', 'UY', 'URY', 'UYU', '$U', true),
  ('paraguay', 'Paraguay', 'PY', 'PRY', 'PYG', '₲', true),
  ('venezuela', 'Venezuela', 'VE', 'VEN', 'VES', 'Bs.S', true)
ON CONFLICT (id) DO NOTHING;