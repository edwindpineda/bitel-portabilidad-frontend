-- ============================================
-- SPEECH ANALYTICS - Tablas nuevas
-- ============================================

-- 1. Métricas por llamada (Tab Conversación)
CREATE TABLE analisis_llamada (
    id SERIAL PRIMARY KEY,
    id_llamada INTEGER NOT NULL REFERENCES llamada(id),
    total_tokens INTEGER DEFAULT 0,
    total_palabras INTEGER DEFAULT 0,
    tiempo_habla_seg INTEGER DEFAULT 0,
    tiempo_silencio_seg INTEGER DEFAULT 0,
    cumplimiento_protocolo FLOAT DEFAULT 0,       -- % de 0 a 100
    fcr BOOLEAN DEFAULT FALSE,                     -- First Call Resolution
    id_empresa INTEGER NOT NULL REFERENCES empresa(id),
    estado_registro INTEGER NOT NULL DEFAULT 1,
    usuario_registro INTEGER NOT NULL DEFAULT 1,
    fecha_registro TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. Sentimiento por llamada (Tab Sentimiento)
CREATE TABLE analisis_sentimiento (
    id SERIAL PRIMARY KEY,
    id_llamada INTEGER NOT NULL REFERENCES llamada(id),
    sentimiento VARCHAR(20) NOT NULL,              -- 'positivo', 'negativo', 'neutro'
    score_sentimiento FLOAT DEFAULT 0,             -- -1 a 1
    emocion_principal VARCHAR(30),                  -- 'frustracion', 'enojo', 'confusion', 'ansiedad', 'desconfianza', 'decepcion', 'satisfaccion', 'gratitud'
    score_emocion FLOAT DEFAULT 0,                 -- 0 a 1
    id_empresa INTEGER NOT NULL REFERENCES empresa(id),
    estado_registro INTEGER NOT NULL DEFAULT 1,
    usuario_registro INTEGER NOT NULL DEFAULT 1,
    fecha_registro TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. Preguntas, temas y palabras extraídas (Tab Preguntas frecuentes)
CREATE TABLE pregunta_frecuente (
    id SERIAL PRIMARY KEY,
    id_llamada INTEGER NOT NULL REFERENCES llamada(id),
    tipo VARCHAR(20) NOT NULL,                     -- 'pregunta', 'tema', 'palabra'
    contenido VARCHAR(255) NOT NULL,               -- Texto: "¿Cómo hago un pedido?", "Envíos", "Ayuda"
    frecuencia INTEGER NOT NULL DEFAULT 1,         -- Ocurrencias en esa llamada
    id_empresa INTEGER NOT NULL REFERENCES empresa(id),
    estado_registro INTEGER NOT NULL DEFAULT 1,
    usuario_registro INTEGER NOT NULL DEFAULT 1,
    fecha_registro TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================

-- analisis_llamada
CREATE INDEX idx_analisis_llamada_llamada ON analisis_llamada(id_llamada);
CREATE INDEX idx_analisis_llamada_empresa ON analisis_llamada(id_empresa, estado_registro);
CREATE INDEX idx_analisis_llamada_fcr ON analisis_llamada(id_empresa, fcr) WHERE estado_registro = 1;

-- analisis_sentimiento
CREATE INDEX idx_analisis_sentimiento_llamada ON analisis_sentimiento(id_llamada);
CREATE INDEX idx_analisis_sentimiento_empresa ON analisis_sentimiento(id_empresa, estado_registro);
CREATE INDEX idx_analisis_sentimiento_tipo ON analisis_sentimiento(id_empresa, sentimiento) WHERE estado_registro = 1;
CREATE INDEX idx_analisis_sentimiento_emocion ON analisis_sentimiento(id_empresa, emocion_principal) WHERE estado_registro = 1;

-- pregunta_frecuente
CREATE INDEX idx_pregunta_frecuente_llamada ON pregunta_frecuente(id_llamada);
CREATE INDEX idx_pregunta_frecuente_empresa ON pregunta_frecuente(id_empresa, estado_registro);
CREATE INDEX idx_pregunta_frecuente_tipo ON pregunta_frecuente(id_empresa, tipo) WHERE estado_registro = 1;
CREATE INDEX idx_pregunta_frecuente_contenido ON pregunta_frecuente(id_empresa, tipo, contenido) WHERE estado_registro = 1;

-- ============================================
-- MODIFICACIÓN a tabla existente: transcripcion
-- Agregar speaker y tiempos de segmento
-- ============================================

ALTER TABLE transcripcion ADD COLUMN id_speaker INTEGER REFERENCES speaker(id);
ALTER TABLE transcripcion ADD COLUMN inicio_seg FLOAT;
ALTER TABLE transcripcion ADD COLUMN fin_seg FLOAT;

-- ============================================
-- INSERTAR estados base en estado_llamada
-- ============================================

INSERT INTO estado_llamada (nombre, id_empresa, estado_registro, usuario_registro, fecha_registro, fecha_actualizacion)
VALUES
    ('Completada', 1, 1, 1, NOW(), NOW()),
    ('En progreso', 1, 1, 1, NOW(), NOW()),
    ('Fallida', 1, 1, 1, NOW(), NOW()),
    ('Sin contestar', 1, 1, 1, NOW(), NOW());
