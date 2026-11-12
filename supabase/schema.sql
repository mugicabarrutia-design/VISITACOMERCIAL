-- ====================================================================
-- ESQUEMA SEGURO PARA SUPABASE: GESTIÓN COMERCIAL COMPLETA
-- ====================================================================
-- Conserva las tablas importadas: clientes, articulos, ventas
-- Crea las tablas de comerciales y visitas
-- Habilita políticas de seguridad RLS permisivas para el rol anon (didáctico)
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA: comerciales (si no existe)
CREATE TABLE IF NOT EXISTS comerciales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(50) NOT NULL,
    zona VARCHAR(100) NOT NULL,
    color VARCHAR(20) NOT NULL DEFAULT '#2563EB',
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Asegurar que clientes tiene columna comercial_asignado_id (opcional)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clientes' AND column_name = 'comercial_asignado_id'
    ) THEN
        ALTER TABLE clientes ADD COLUMN comercial_asignado_id UUID REFERENCES comerciales(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. TABLA: visitas (vinculada a clientes.codigo)
CREATE TABLE IF NOT EXISTS visitas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id TEXT NOT NULL,
    comercial_id UUID NOT NULL REFERENCES comerciales(id) ON DELETE CASCADE,
    fecha_inicio TIMESTAMPTZ NOT NULL,
    fecha_fin TIMESTAMPTZ NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('presentación', 'seguimiento', 'cierre', 'incidencia', 'postventa')),
    estado VARCHAR(50) NOT NULL CHECK (estado IN ('programada', 'realizada', 'cancelada', 'aplazada')),
    objetivo TEXT NOT NULL,
    resultado TEXT,
    importe_estimado NUMERIC(12, 2) DEFAULT 0,
    proxima_accion TEXT,
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT check_visita_fechas CHECK (fecha_fin >= fecha_inicio)
);

-- Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_visitas_cliente ON visitas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_visitas_comercial ON visitas(comercial_id);
CREATE INDEX IF NOT EXISTS idx_visitas_fechas ON visitas(fecha_inicio, fecha_fin);

-- ====================================================================
-- HABILITAR RLS Y POLÍTICAS PERMISIVAS PARA ROL ANON (CLIENTE WEB)
-- ====================================================================
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE articulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE comerciales ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitas ENABLE ROW LEVEL SECURITY;

-- Clientes
DROP POLICY IF EXISTS "Anon clientes all" ON clientes;
CREATE POLICY "Anon clientes all" ON clientes FOR ALL TO anon USING (true) WITH CHECK (true);

-- Artículos
DROP POLICY IF EXISTS "Anon articulos all" ON articulos;
CREATE POLICY "Anon articulos all" ON articulos FOR ALL TO anon USING (true) WITH CHECK (true);

-- Ventas
DROP POLICY IF EXISTS "Anon ventas all" ON ventas;
CREATE POLICY "Anon ventas all" ON ventas FOR ALL TO anon USING (true) WITH CHECK (true);

-- Comerciales
DROP POLICY IF EXISTS "Anon comerciales all" ON comerciales;
CREATE POLICY "Anon comerciales all" ON comerciales FOR ALL TO anon USING (true) WITH CHECK (true);

-- Visitas
DROP POLICY IF EXISTS "Anon visitas all" ON visitas;
CREATE POLICY "Anon visitas all" ON visitas FOR ALL TO anon USING (true) WITH CHECK (true);

-- ====================================================================
-- DATOS DE EJEMPLO PARA COMERCIALES Y VISITAS
-- ====================================================================
INSERT INTO comerciales (id, nombre, apellidos, email, telefono, zona, color, activo)
VALUES
    ('e1111111-1111-1111-1111-111111111111', 'Carlos', 'Gómez Ruiz', 'carlos.gomez@empresa.es', '+34 611 223 344', 'Zona Centro (Madrid)', '#2563EB', true),
    ('e2222222-2222-2222-2222-222222222222', 'Laura', 'Martínez Soler', 'laura.martinez@empresa.es', '+34 622 334 455', 'Zona Noreste (Cataluña)', '#10B981', true),
    ('e3333333-3333-3333-3333-333333333333', 'Javier', 'Fernández Vega', 'javier.fernandez@empresa.es', '+34 633 445 566', 'Zona Sur (Andalucía)', '#F59E0B', true)
ON CONFLICT (id) DO UPDATE SET 
    nombre = EXCLUDED.nombre,
    apellidos = EXCLUDED.apellidos,
    zona = EXCLUDED.zona,
    color = EXCLUDED.color;

-- Visitas de ejemplo repartidas en el mes actual vinculadas a clientes importados (c1, c10, c16, c23, c36, c45...)
INSERT INTO visitas (id, comercial_id, cliente_id, fecha_inicio, fecha_fin, tipo, estado, objetivo, resultado, importe_estimado, proxima_accion, notas)
VALUES
    ('b1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'c1',
     (CURRENT_DATE - INTERVAL '6 days' + TIME '09:30:00'), (CURRENT_DATE - INTERVAL '6 days' + TIME '11:00:00'),
     'presentación', 'realizada', 'Presentación del nuevo catálogo de productos y condiciones comerciales', 'Reunión muy productiva con Maria Anders. Interés alto en la línea de bebidas.', 14500, 'Enviar propuesta formal de suministro antes de fin de mes', 'Visita presencial.'),

    ('b2222222-2222-2222-2222-222222222222', 'e1111111-1111-1111-1111-111111111111', 'c23',
     (CURRENT_DATE - INTERVAL '3 days' + TIME '11:30:00'), (CURRENT_DATE - INTERVAL '3 days' + TIME '13:00:00'),
     'seguimiento', 'realizada', 'Revisión técnica de suministros para la sede de Alcobendas', 'El cliente dio el visto bueno a los plazos propuestos.', 8200, 'Enviar borrador de contrato para firma', 'Reunión en oficinas centrales de FISSA.'),

    ('b3333333-3333-3333-3333-333333333333', 'e2222222-2222-2222-2222-222222222222', 'c16',
     (CURRENT_DATE - INTERVAL '1 days' + TIME '16:00:00'), (CURRENT_DATE - INTERVAL '1 days' + TIME '17:30:00'),
     'incidencia', 'realizada', 'Resolución de retraso en la entrega del pedido semanal', 'Se acordó compensar con 5% de descuento en el próximo pedido.', 0, 'Comprobar llegada del nuevo envío con la agencia de transportes', 'Incidencia resuelta satisfactoriamente.'),

    ('b4444444-4444-4444-4444-444444444444', 'e1111111-1111-1111-1111-111111111111', 'c1',
     (CURRENT_DATE + TIME '10:00:00'), (CURRENT_DATE + TIME '11:30:00'),
     'cierre', 'programada', 'Negociación y firma de renovación del acuerdo anual de distribución', NULL, 35000, 'Llevar 2 copias físicas del contrato preparadas para firma', 'Visita prioritaria de hoy.'),

    ('b5555555-5555-5555-5555-555555555555', 'e3333333-3333-3333-3333-333333333333', 'c36',
     (CURRENT_DATE + TIME '16:00:00'), (CURRENT_DATE + TIME '17:30:00'),
     'seguimiento', 'programada', 'Demostración de los nuevos artículos añadidos al catálogo', NULL, 12000, 'Preparar muestras físicas del catálogo', 'Reunión presencial con la dirección de compras.'),

    ('b6666666-6666-6666-6666-666666666666', 'e2222222-2222-2222-2222-222222222222', 'c10',
     (CURRENT_DATE + INTERVAL '2 days' + TIME '09:00:00'), (CURRENT_DATE + INTERVAL '2 days' + TIME '10:30:00'),
     'presentación', 'programada', 'Presentación de tarifas especiales por volumen para el nuevo trimestre', NULL, 22000, 'Enviar dossier previo por email', 'Reunión con Elizabeth Lincoln.'),

    ('b7777777-7777-7777-7777-777777777777', 'e3333333-3333-3333-3333-333333333333', 'c45',
     (CURRENT_DATE + INTERVAL '4 days' + TIME '11:00:00'), (CURRENT_DATE + INTERVAL '4 days' + TIME '12:30:00'),
     'cierre', 'programada', 'Firma de pedido mayorista según historial de compras', NULL, 18500, 'Emitir factura proforma previa', 'Oportunidad de gran volumen.'),

    ('b8888888-8888-8888-8888-888888888888', 'e1111111-1111-1111-1111-111111111111', 'c24',
     (CURRENT_DATE + INTERVAL '7 days' + TIME '12:00:00'), (CURRENT_DATE + INTERVAL '7 days' + TIME '13:30:00'),
     'postventa', 'programada', 'Seguimiento de satisfacción del servicio de entrega', NULL, 6500, 'Entregar encuesta de calidad de servicio', 'Revisión periódica.'),

    ('b9999999-9999-9999-9999-999999999999', 'e2222222-2222-2222-2222-222222222222', 'c12',
     (CURRENT_DATE + INTERVAL '10 days' + TIME '15:00:00'), (CURRENT_DATE + INTERVAL '10 days' + TIME '16:30:00'),
     'seguimiento', 'programada', 'Presentación del catálogo de condimentos y repostería', NULL, 9400, 'Confirmar agenda el día previo', 'Reunión con Patricio Simpson.')
ON CONFLICT (id) DO NOTHING;
