# Plan de Tablas para Speech Analytics

## Tablas existentes (con 0 registros)

| Tabla | Columnas clave | Estado |
|-------|---------------|--------|
| `llamada` | id, provider_call_id, fecha_inicio, fecha_fin, duracion_seg, metadata_json, url_audio, id_estado_llamada, id_prospecto, id_empresa | Existe, 0 registros |
| `estado_llamada` | id, nombre, id_empresa | Existe, 0 registros |
| `transcripcion` | id, texto, id_llamada | Existe, 0 registros |
| `speaker` | id, nombre | Existe (modelo), no tiene FK en transcripcion |
| `tipificacion` | id, nombre, tipo, id_prospecto, resumen... | Existe, 5 registros |

---

## Tablas nuevas necesarias

### 1. `analisis_llamada` — Métricas por llamada

Almacena las métricas calculadas de cada llamada tras procesarla. Alimenta el **Tab Conversación**.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | SERIAL PK | |
| `id_llamada` | INTEGER FK → llamada | Referencia a la llamada |
| `total_tokens` | INTEGER | Tokens totales de la conversación |
| `total_palabras` | INTEGER | Palabras totales |
| `tiempo_habla_seg` | INTEGER | Segundos de habla efectiva |
| `tiempo_silencio_seg` | INTEGER | Segundos de silencio |
| `cumplimiento_protocolo` | FLOAT | % de cumplimiento (0-100) |
| `fcr` | BOOLEAN | First Call Resolution (resuelta en 1ra llamada) |
| `id_empresa` | INTEGER FK → empresa | Multi-tenant |
| `estado_registro` | INTEGER DEFAULT 1 | Soft delete |
| `usuario_registro` | INTEGER | |
| `fecha_registro` | TIMESTAMP | |
| `fecha_actualizacion` | TIMESTAMP | |

**Gráficas que alimenta:**

| Gráfica | Query |
|---------|-------|
| KPI "Conv. promedio/hora" | `COUNT(llamada)` agrupado por hora del día |
| KPI "Tiempo silencio" | `AVG(tiempo_silencio_seg / duracion_seg * 100)` |
| KPI "Protocolo" | `AVG(cumplimiento_protocolo)` |
| KPI "FCR" | `COUNT(fcr=true) / COUNT(*) * 100` |
| Bar "Conversaciones por hora" | `COUNT(*)` agrupado por hora de `fecha_inicio` |
| Bar "Tokens y palabras promedio" | `AVG(total_tokens)`, `AVG(total_palabras)` por mes |
| Donut "Tiempo de silencio" | `AVG(tiempo_habla_seg)` vs `AVG(tiempo_silencio_seg)` |
| Bar "Distribución habla/silencio por mes" | `AVG` por mes |
| Donut + Line "Protocolo" | `AVG(cumplimiento_protocolo)` global y por mes |
| Donut + Line "FCR" | `COUNT(fcr=true)/COUNT(*)` global y por mes |

---

### 2. `analisis_sentimiento` — Sentimiento por llamada

Resultado del análisis de sentimiento de cada llamada. Alimenta el **Tab Sentimiento**.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | SERIAL PK | |
| `id_llamada` | INTEGER FK → llamada | Referencia a la llamada |
| `sentimiento` | VARCHAR(20) | `'positivo'`, `'negativo'`, `'neutro'` |
| `score_sentimiento` | FLOAT | Score numérico (-1 a 1) |
| `emocion_principal` | VARCHAR(30) | Ej: `'frustracion'`, `'enojo'`, `'confusion'`, `'ansiedad'`, `'desconfianza'`, `'decepcion'`, `'satisfaccion'`, `'gratitud'` |
| `score_emocion` | FLOAT | Confianza de la emoción (0-1) |
| `id_empresa` | INTEGER FK → empresa | Multi-tenant |
| `estado_registro` | INTEGER DEFAULT 1 | Soft delete |
| `usuario_registro` | INTEGER | |
| `fecha_registro` | TIMESTAMP | |
| `fecha_actualizacion` | TIMESTAMP | |

**Gráficas que alimenta:**

| Gráfica | Query |
|---------|-------|
| KPI "Positivo %" | `COUNT(sentimiento='positivo') / COUNT(*) * 100` |
| KPI "Negativo %" | `COUNT(sentimiento='negativo') / COUNT(*) * 100` |
| KPI "Neutro %" | `COUNT(sentimiento='neutro') / COUNT(*) * 100` |
| Donut "Tipos de sentimiento" | Distribución % por `sentimiento` |
| Donut "Tipos de emociones" | Distribución % por `emocion_principal` (filtrado por sentimiento) |
| AreaChart "Evolución sentimiento" | `COUNT` por `sentimiento` por mes |
| AreaChart "Evolución emociones" | `COUNT` por `emocion_principal` por mes |

---

### 3. `pregunta_frecuente` — Preguntas, temas y palabras extraídas

Preguntas, temas y palabras clave identificados en las conversaciones. Alimenta el **Tab Preguntas frecuentes**.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | SERIAL PK | |
| `id_llamada` | INTEGER FK → llamada | Llamada donde se detectó |
| `tipo` | VARCHAR(20) | `'pregunta'`, `'tema'`, `'palabra'` |
| `contenido` | VARCHAR(255) | El texto (ej: "¿Cómo hago un pedido?", "Envíos", "Ayuda") |
| `frecuencia` | INTEGER DEFAULT 1 | Conteo de ocurrencias en esa llamada |
| `id_empresa` | INTEGER FK → empresa | Multi-tenant |
| `estado_registro` | INTEGER DEFAULT 1 | Soft delete |
| `usuario_registro` | INTEGER | |
| `fecha_registro` | TIMESTAMP | |
| `fecha_actualizacion` | TIMESTAMP | |

**Gráficas que alimenta:**

| Gráfica | Query |
|---------|-------|
| Bar horizontal "Preguntas frecuentes" | `WHERE tipo='pregunta'` → `GROUP BY contenido` → `SUM(frecuencia) DESC LIMIT 8` |
| Bar horizontal "Temas frecuentes" | `WHERE tipo='tema'` → `GROUP BY contenido` → `SUM(frecuencia) DESC LIMIT 8` |
| Word cloud "Palabras frecuentes" | `WHERE tipo='palabra'` → `GROUP BY contenido` → `SUM(frecuencia) DESC LIMIT 20` |

---

### 4. Modificación a `transcripcion` — Agregar columnas

La tabla `transcripcion` actual solo tiene `texto` e `id_llamada`. Se necesitan columnas adicionales para segmentación por speaker y tiempos.

| Columna nueva | Tipo | Descripción |
|---------------|------|-------------|
| `id_speaker` | INTEGER FK → speaker | Quién habló este segmento |
| `inicio_seg` | FLOAT | Segundo de inicio del segmento |
| `fin_seg` | FLOAT | Segundo de fin del segmento |

Esto permite saber quién dijo qué y cuándo, necesario para calcular tiempos de habla/silencio por speaker.

---

### 5. Insertar datos en `estado_llamada`

| id | nombre |
|----|--------|
| 1 | Completada |
| 2 | En progreso |
| 3 | Fallida |
| 4 | Sin contestar |

---

## Resumen de cambios

| Tabla | Acción | Registros por llamada |
|-------|--------|----------------------|
| `analisis_llamada` | **CREAR** | 1 por llamada |
| `analisis_sentimiento` | **CREAR** | 1 por llamada |
| `pregunta_frecuente` | **CREAR** | N por llamada (varias preguntas/temas/palabras) |
| `transcripcion` | **MODIFICAR** | Agregar `id_speaker`, `inicio_seg`, `fin_seg` |
| `estado_llamada` | **INSERTAR** | 4 estados base |

---

## Flujo de datos

```
Llamada (audio)
  → Speech-to-Text → transcripcion (segmentos con speaker y tiempos)
  → Análisis IA → analisis_llamada (tokens, palabras, silencio, protocolo, FCR)
  → Análisis IA → analisis_sentimiento (sentimiento + emoción)
  → NLP/IA → pregunta_frecuente (preguntas, temas, palabras clave)
```

Cada vez que se procesa una llamada, un servicio (IA/API externo) genera los registros en las 3 tablas nuevas a partir de la transcripción.
