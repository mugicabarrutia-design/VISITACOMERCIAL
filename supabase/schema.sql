-- ====================================================================
-- ESQUEMA COMPLETO PARA SUPABASE: GESTIÓN DE VISITAS COMERCIALES
-- ====================================================================

-- 1. Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Limpieza previa (opcional si se desea resetear)
DROP TABLE IF EXISTS visitas CASCADE;
DROP TABLE IF EXISTS clientes CASCADE;
DROP TABLE IF EXISTS comerciales CASCADE;

-- --------------------------------------------------------------------
-- 3. Tabla: comerciales
-- --------------------------------------------------------------------
CREATE TABLE comerciales (
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

-- --------------------------------------------------------------------
-- 4. Tabla: clientes
-- --------------------------------------------------------------------
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_empresa VARCHAR(200) NOT NULL,
    cif VARCHAR(50) NOT NULL,
    persona_contacto VARCHAR(150) NOT NULL,
    telefono VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    direccion TEXT NOT NULL,
    poblacion VARCHAR(100) NOT NULL,
    provincia VARCHAR(100) NOT NULL,
    codigo_postal VARCHAR(20) NOT NULL,
    sector VARCHAR(100) NOT NULL,
    notas TEXT,
    comercial_asignado_id UUID REFERENCES comerciales(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- --------------------------------------------------------------------
-- 5. Tabla: visitas
-- --------------------------------------------------------------------
CREATE TABLE visitas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
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

-- --------------------------------------------------------------------
-- 6. Índices para acelerar búsquedas y filtros
-- --------------------------------------------------------------------
CREATE INDEX idx_clientes_comercial ON clientes(comercial_asignado_id);
CREATE INDEX idx_visitas_cliente ON visitas(cliente_id);
CREATE INDEX idx_visitas_comercial ON visitas(comercial_id);
CREATE INDEX idx_visitas_fechas ON visitas(fecha_inicio, fecha_fin);
CREATE INDEX idx_visitas_estado ON visitas(estado);
CREATE INDEX idx_visitas_tipo ON visitas(tipo);

-- --------------------------------------------------------------------
-- 7. Seguridad: Row Level Security (RLS) permisiva para rol 'anon'
-- Proyecto didáctico con acceso público directo desde cliente Supabase JS
-- --------------------------------------------------------------------
ALTER TABLE comerciales ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitas ENABLE ROW LEVEL SECURITY;

-- Políticas para 'comerciales'
CREATE POLICY "Permissive anon read/write comerciales"
    ON comerciales FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Políticas para 'clientes'
CREATE POLICY "Permissive anon read/write clientes"
    ON clientes FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Políticas para 'visitas'
CREATE POLICY "Permissive anon read/write visitas"
    ON visitas FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- ====================================================================
-- 8. DATOS DE EJEMPLO (3 comerciales, 8 clientes, 10 visitas en mes actual)
-- Usamos CURRENT_DATE para que las visitas siempre caigan en el mes en curso
-- ====================================================================

-- Insertar 3 comerciales
INSERT INTO comerciales (id, nombre, apellidos, email, telefono, zona, color, activo) VALUES
('c1111111-1111-1111-1111-111111111111', 'Carlos', 'Mendoza Ruiz', 'carlos.mendoza@empresa.es', '+34 612 345 678', 'Madrid y Centro', '#2563EB', true),
('c2222222-2222-2222-2222-222222222222', 'Laura', 'Sánchez Vidal', 'laura.sanchez@empresa.es', '+34 623 456 789', 'Cataluña y Levante', '#059669', true),
('c3333333-3333-3333-3333-333333333333', 'Alejandro', 'Gómez Herrera', 'alejandro.gomez@empresa.es', '+34 634 567 890', 'Andalucía y Sur', '#D97706', true);

-- Insertar 8 clientes
INSERT INTO clientes (id, nombre_empresa, cif, persona_contacto, telefono, email, direccion, poblacion, provincia, codigo_postal, sector, notas, comercial_asignado_id) VALUES
('e1111111-1111-1111-1111-111111111111', 'InnovaTech Solutions S.L.', 'B87654321', 'Elena Morales (Directora IT)', '+34 914 556 789', 'contacto@innovatech.es', 'Paseo de la Castellana 140, Planta 6', 'Madrid', 'Madrid', '28046', 'Tecnología y Software', 'Interesados en renovar su infraestructura cloud y licencias corporativas.', 'c1111111-1111-1111-1111-111111111111'),
('e2222222-2222-2222-2222-222222222222', 'Logística & Transportes del Sur', 'B91234567', 'Manuel Domínguez (Jefe de Flota)', '+34 954 112 233', 'logistica@transur.com', 'Polígono Industrial La Isla, Parcela 14', 'Dos Hermanas', 'Sevilla', '41703', 'Transporte y Logística', 'Flota de 45 camiones. Buscan optimización de telemetría y combustible.', 'c3333333-3333-3333-3333-333333333333'),
('e3333333-3333-3333-3333-333333333333', 'Farmacias Unidas Mediterráneo', 'A08761234', 'Dra. Montserrat Puig', '+34 932 778 899', 'compras@farmaciasunidas.cat', 'Avinguda Diagonal 405', 'Barcelona', 'Barcelona', '08008', 'Farmacéutico y Salud', 'Red de 18 boticas en el área metropolitana. Alta solvencia.', 'c2222222-2222-2222-2222-222222222222'),
('e4444444-4444-4444-4444-444444444444', 'Distribuciones Alimentarias Norte', 'B48991200', 'Iker Bilbao (Director de Compras)', '+34 944 332 110', 'ibilbao@distrinorte.eus', 'Calle Gran Vía 28', 'Bilbao', 'Bizkaia', '48009', 'Alimentación y Bebidas', 'Distribución mayorista a hostelería. Negociando contrato anual.', 'c1111111-1111-1111-1111-111111111111'),
('e5555555-5555-5555-5555-555555555555', 'Grupo Gastronómico Ibérico', 'B82341999', 'Lucía Navarro (Gerente de Operaciones)', '+34 915 667 890', 'gerencia@grupoibericogastronomia.com', 'Calle Alcalá 92', 'Madrid', 'Madrid', '28009', 'Hostelería y Restauración', 'Cadena de 6 restaurantes gourmet en Madrid y Valencia.', 'c1111111-1111-1111-1111-111111111111'),
('e6666666-6666-6666-6666-666666666666', 'Moda & Retail Ibérica S.A.', 'A46112233', 'Javier Valls (Director Comercial)', '+34 963 889 001', 'j.valls@modaretail.es', 'Calle Colón 15', 'Valencia', 'Valencia', '46004', 'Moda y Textil', 'Expansión a tiendas físicas en centros comerciales.', 'c2222222-2222-2222-2222-222222222222'),
('e7777777-7777-7777-7777-777777777777', 'Construcciones y Obras Valles', 'B29556778', 'Antonio Valles (CEO)', '+34 952 445 667', 'contacto@obrasvalles.es', 'Avenida de Andalucía 54', 'Málaga', 'Málaga', '29007', 'Construcción e Ingeniería', 'Desarrollo de complejos residenciales en la Costa del Sol.', 'c3333333-3333-3333-3333-333333333333'),
('e8888888-8888-8888-8888-888888888888', 'Energías Renovables del Sol', 'B14889900', 'Carmen Roldán (Directora Técnica)', '+34 957 223 344', 'croldan@renovablesdelsol.es', 'Parque Tecnológico Rabanales 21', 'Córdoba', 'Córdoba', '14014', 'Energía y Medio Ambiente', 'Proyectos fotovoltaicos industriales. Alta previsión de inversión.', 'c3333333-3333-3333-3333-333333333333');

-- Insertar 10 visitas dinámicamente repartidas en el mes actual
INSERT INTO visitas (id, cliente_id, comercial_id, fecha_inicio, fecha_fin, tipo, estado, objetivo, resultado, importe_estimado, proxima_accion, notas) VALUES
('v1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 
 (CURRENT_DATE - INTERVAL '3 days' + TIME '10:00:00'), (CURRENT_DATE - INTERVAL '3 days' + TIME '11:30:00'),
 'presentación', 'realizada', 'Presentación de la nueva plataforma de gestión en la nube', 'Excelente acogida por parte del equipo IT. Solicitan demo personalizada.', 12500, 'Enviar propuesta económica detallada y preparar entorno de pruebas', 'Reunión en su sede central. Estuvieron presentes 4 responsables técnicos.'),

('v2222222-2222-2222-2222-222222222222', 'e2222222-2222-2222-2222-222222222222', 'c3333333-3333-3333-3333-333333333333', 
 (CURRENT_DATE - INTERVAL '1 day' + TIME '12:00:00'), (CURRENT_DATE - INTERVAL '1 day' + TIME '13:00:00'),
 'seguimiento', 'realizada', 'Revisar métricas de ahorro de combustible del piloto', 'Ahorro confirmado del 8.4%. Muy satisfechos con el reporte.', 28000, 'Agendar reunión con el director financiero para firma de contrato', 'Manuel confirma que el comité dará el visto bueno el próximo lunes.'),

('v3333333-3333-3333-3333-333333333333', 'e3333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', 
 (CURRENT_DATE + TIME '09:30:00'), (CURRENT_DATE + TIME '11:30:00'),
 'cierre', 'programada', 'Firma definitiva del acuerdo marco para las 18 farmacias', NULL, 45000, 'Llevar copias impresas y validar aval bancario', 'Punto clave: confirmar entrega de los primeros lotes en 15 días.'),

('v4444444-4444-4444-4444-444444444444', 'e4444444-4444-4444-4444-444444444444', 'c1111111-1111-1111-1111-111111111111', 
 (CURRENT_DATE + TIME '16:00:00'), (CURRENT_DATE + TIME '17:30:00'),
 'seguimiento', 'programada', 'Ajustar condiciones logísticas de entregas nocturnas', NULL, 18500, 'Revisar con almacén la ruta norteña', 'Cliente exige trazabilidad de temperatura en tiempo real.'),

('v5555555-5555-5555-5555-555555555555', 'e5555555-5555-5555-5555-555555555555', 'c1111111-1111-1111-1111-111111111111', 
 (CURRENT_DATE + INTERVAL '1 day' + TIME '11:00:00'), (CURRENT_DATE + INTERVAL '1 day' + TIME '12:30:00'),
 'incidencia', 'programada', 'Resolver retraso en la entrega de suministros del local en Castellana', NULL, 8900, 'Ofrecer bonificación del 5% en la siguiente factura', 'Prioridad alta para mantener la buena relación con Lucía.'),

('v6666666-6666-6666-6666-666666666666', 'e6666666-6666-6666-6666-666666666666', 'c2222222-2222-2222-2222-222222222222', 
 (CURRENT_DATE + INTERVAL '2 days' + TIME '10:00:00'), (CURRENT_DATE + INTERVAL '2 days' + TIME '12:00:00'),
 'presentación', 'programada', 'Demostración de terminales TPV inteligentes y fidelización', NULL, 34000, 'Preparar casos de éxito en el sector retail textil', 'Tienen interés en integrarlo con su ERP actual.'),

('v7777777-7777-7777-7777-777777777777', 'e7777777-7777-7777-7777-777777777777', 'c3333333-3333-3333-3333-333333333333', 
 (CURRENT_DATE + INTERVAL '3 days' + TIME '16:30:00'), (CURRENT_DATE + INTERVAL '3 days' + TIME '18:00:00'),
 'postventa', 'programada', 'Comprobar satisfacción con la maquinaria entregada el mes anterior', NULL, 0, 'Entregar manual de mantenimiento preventivo', 'Revisión técnica de cortesía.'),

('v8888888-8888-8888-8888-888888888888', 'e8888888-8888-8888-8888-888888888888', 'c3333333-3333-3333-3333-333333333333', 
 (CURRENT_DATE + INTERVAL '5 days' + TIME '09:00:00'), (CURRENT_DATE + INTERVAL '5 days' + TIME '11:00:00'),
 'cierre', 'programada', 'Cierre de licitación para la planta solar en Antequera', NULL, 75000, 'Formalizar póliza de garantía', 'Oportunidad estratégica de gran volumen.'),

('v9999999-9999-9999-9999-999999999999', 'e1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 
 (CURRENT_DATE + INTERVAL '7 days' + TIME '12:00:00'), (CURRENT_DATE + INTERVAL '7 days' + TIME '13:30:00'),
 'seguimiento', 'aplazada', 'Seguimiento de la propuesta técnica enviada', 'El cliente pidió aplazar 1 semana por viaje de Elena Morales a Berlín.', 12500, 'Contactar a la vuelta de su viaje el día 20', 'Reagendada por incompatibilidad de agenda.'),

('vaaaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e3333333-3333-3333-3333-333333333333', 'c2222222-2222-2222-2222-222222222222', 
 (CURRENT_DATE + INTERVAL '10 days' + TIME '15:00:00'), (CURRENT_DATE + INTERVAL '10 days' + TIME '17:00:00'),
 'postventa', 'programada', 'Evaluación del primer mes de servicio y formación de personal', NULL, 6000, 'Enviar encuesta de calidad a los directores de farmacia', 'Se realizará por videoconferencia si la dra. Puig no puede presencial.');
