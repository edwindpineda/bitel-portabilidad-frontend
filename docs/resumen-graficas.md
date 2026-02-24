# Documentación de Gráficas del Resumen

## Endpoint
**GET** `/api/resumen?idEmpresa={id}&dateFrom={YYYY-MM-DD}&dateTo={YYYY-MM-DD}`

**Archivo Frontend:** `app/(dashboard)/dashboard/resumen/page.js`
**Archivo Backend:** `viva-api/src/controllers/reportes.controller.js` → función `getResumen()`

Se ejecutan **18 queries SQL en paralelo** con `Promise.all()`.

---

## 1. KPI Cards (Tarjetas superiores)

### Total Leads
- **Tabla:** `prospecto`
- **Condición:** `COUNT(*)` donde `estado_registro = 1`
- **Filtros:** `id_empresa`, rango de fechas opcionales

### Contactados
- **Tabla:** `prospecto`
- **Campo:** `fue_contactado`
- **Condición:** `COUNT(*) FILTER (WHERE p.fue_contactado = 1)`
- **Nota:** Flag booleano (0/1) en la tabla prospecto. Se actualiza cuando el prospecto ha sido contactado.

### Interesados
- **Tabla:** `prospecto`
- **Campo:** `calificacion_lead`
- **Condición:** `COUNT(*) FILTER (WHERE p.calificacion_lead IN ('tibio', 'caliente'))`
- **Nota:** Solo cuenta prospectos con calificación "tibio" o "caliente". Los "frio" y NULL no cuentan como interesados.

### % vs mes anterior
- **Query adicional (#18):** Misma consulta de KPIs pero filtrando `fecha_registro` del mes anterior
- **Cálculo JS:** `((actual - anterior) / anterior * 100)`
- Si anterior = 0 y actual > 0 → muestra `+100%`

---

## 2. Embudo de Conversión

- **Tablas:** `estado_prospecto` LEFT JOIN `prospecto`
- **Agrupación:** Por `estado_prospecto.nombre`, ordenado por `estado_prospecto.orden`
- **Porcentaje:** `Math.round((total_del_estado / total_todos_estados) * 100)`
- **Estados actuales (empresa 1):**

| Orden | Estado | Color | ID |
|-------|--------|-------|----|
| 1 | Nuevo | #00FF00 | 1 |
| 2 | Contactado | #3B82F6 | 2 |
| 3 | Cotizado | #F59E0B | 3 |
| 4 | En seguimiento | #8B5CF6 | 4 |
| 5 | Ganado | #10B981 | 5 |
| 6 | Perdido | #EF4444 | 6 |

- **Campo en prospecto:** `id_estado_prospecto` (FK a `estado_prospecto.id`)
- **Nota:** Muestra todos los estados activos (`estado_registro = 1`) de la empresa. Si no hay prospectos en un estado, aparece con 0.

---

## 3. Lead Scoring

- **Tabla:** `prospecto`
- **Campo:** `calificacion_lead` (valores: `'frio'`, `'tibio'`, `'caliente'`, `NULL`)
- **Condición:**
  - Frío: `calificacion_lead = 'frio' OR calificacion_lead IS NULL`
  - Tibio: `calificacion_lead = 'tibio'`
  - Caliente: `calificacion_lead = 'caliente'`
- **Resultado:** Porcentaje de cada categoría sobre el total
- **Nota:** Los prospectos sin calificación (NULL) se cuentan como "Frío"

---

## 4. Conversaciones Abandonadas

- **Tablas:** `chat` + `mensaje` + `prospecto`
- **Lógica:** Para cada chat, se obtiene el **último mensaje** usando `LATERAL JOIN`
- **Condiciones:**
  - **Abandonado:** Último mensaje es `direccion = 'out'` (enviado por bot/asesor) **Y** tiene más de **24 horas** sin respuesta (`NOW() - fecha_hora > INTERVAL '24 hours'`)
  - **Activo:** Último mensaje es `direccion = 'in'` (del cliente) **O** es `'out'` pero con menos de 24 horas
  - **Total:** Suma de abandonados + activos
- **Filtro:** Solo chats con `estado_registro = 1` y que tengan al menos un mensaje

---

## 5. Utilidad de Información

- **Tabla:** `interaccion`
- **Campo:** `satisfactorio` (valores: `1`, `0`, `NULL`)
- **Condiciones:**
  - Sí: `satisfactorio = 1`
  - No: `satisfactorio = 0`
  - No responde: `satisfactorio IS NULL`
- **Resultado:** Porcentaje de cada categoría sobre el total de interacciones
- **Join:** `INNER JOIN prospecto` para filtrar por empresa

---

## 6. Asistencia Humana

- **Tabla:** `chat`
- **Campo:** `bot_activo` (valores: `0`, `1`)
- **Condiciones:**
  - Con humano: `bot_activo = 0` (bot desactivado, atendido por persona)
  - Solo bot: `bot_activo = 1` (atendido completamente por bot)
- **Resultado:** Porcentaje de cada categoría sobre el total de chats
- **Join:** `INNER JOIN prospecto` para filtrar por empresa

---

## 7. Tipo de Conversación

- **Tabla:** `tipificacion`
- **Campo:** `tipo`
- **Agrupación:** `GROUP BY tipo`, ordenado por total DESC
- **Resultado:** Top 4 tipos de conversación con su conteo
- **Nota:** Los tipos sin nombre se agrupan como "Otros"
- **Join:** `INNER JOIN prospecto` para filtrar por empresa

---

## 8. Mapa de Calor de Leads

Tres vistas disponibles, todas basadas en **mensajes entrantes** (`direccion = 'in'`).

### Semana (últimos 7 días)
- **Ejes:** Día de la semana (Dom-Sáb) × Hora (6am-10pm)
- **SQL:** `EXTRACT(DOW FROM m.fecha_hora)` × `EXTRACT(HOUR FROM m.fecha_hora)`
- **Filtro:** `fecha_hora >= CURRENT_DATE - INTERVAL '7 days'`

### Mes (últimos 31 días)
- **Ejes:** Día del mes (1-31) × Hora (6am-10pm)
- **SQL:** `EXTRACT(DAY FROM m.fecha_hora)` × `EXTRACT(HOUR FROM m.fecha_hora)`
- **Filtro:** `fecha_hora >= CURRENT_DATE - INTERVAL '31 days'`

### Año (últimos 12 meses)
- **Ejes:** Mes (Ene-Dic) × Hora (6am-10pm)
- **SQL:** `EXTRACT(MONTH FROM m.fecha_hora)` × `EXTRACT(HOUR FROM m.fecha_hora)`
- **Filtro:** `fecha_hora >= CURRENT_DATE - INTERVAL '12 months'`

### Tablas involucradas
- `mensaje` (principal)
- `chat` (join para validar estado)
- `prospecto` (join para filtrar por empresa)

### Escala de colores
| Valor | Color |
|-------|-------|
| 0 | #f7f7f5 (gris claro) |
| 1-9 | #ffffcc (amarillo claro) |
| 10-24 | #ffeda0 |
| 25-39 | #fed976 |
| 40-54 | #feb24c |
| 55-69 | #fd8d3c (naranja) |
| 70-84 | #e31a1c (rojo) |
| 85+ | #b10026 (rojo oscuro) |

---

## 9. Evolución (vista mensual, año actual)

Todos los gráficos de evolución filtran por `fecha_registro >= DATE_TRUNC('year', CURRENT_DATE)` y agrupan por mes.

### Evolución Embudo
- Misma lógica que el embudo estático pero agrupado por mes
- Pivotea las filas a formato `[{mes, Estado1: X, Estado2: Y}]`

### Evolución Scoring
- Misma lógica que Lead Scoring pero agrupado por mes
- Campos: Frío, Tibio, Caliente por mes

### Evolución Abandonos
- Misma lógica que Conversaciones Abandonadas pero agrupado por mes
- Campos: Total, Abandonos, Activos por mes

### Evolución Utilidad
- Misma lógica que Utilidad de Información pero agrupado por mes
- Campos: Sí, No, No responde por mes

### Evolución Asistencia
- Misma lógica que Asistencia Humana pero agrupado por mes
- Campos: Sí (con humano), No (solo bot) por mes

### Evolución Tipo Conversación
- Misma lógica que Tipo de Conversación pero agrupado por mes
- Campos dinámicos según los tipos existentes

---

## Tablas de Base de Datos Involucradas

| Tabla | Uso principal |
|-------|--------------|
| `prospecto` | KPIs, embudo, scoring (tabla central) |
| `estado_prospecto` | Estados del embudo de conversión |
| `chat` | Conversaciones abandonadas, asistencia humana |
| `mensaje` | Último mensaje de chats, mapa de calor |
| `interaccion` | Utilidad de información |
| `tipificacion` | Tipo de conversación |
| `cita` | Citados (dato auxiliar) |

## Campos Clave en `prospecto`

| Campo | Tipo | Uso |
|-------|------|-----|
| `id_estado_prospecto` | INTEGER (FK) | Embudo de conversión |
| `fue_contactado` | INTEGER (0/1) | KPI "Contactados" |
| `calificacion_lead` | VARCHAR | Lead Scoring (frio/tibio/caliente) |
| `id_empresa` | INTEGER (FK) | Filtro multi-empresa |
| `fecha_registro` | TIMESTAMP | Filtros de fecha, evolución |
| `estado_registro` | INTEGER (0/1) | Soft delete |

---

## Bug Conocido (Corregido)

**Problema:** El frontend enviaba `id_estado` al actualizar un prospecto, pero la columna en BD es `id_estado_prospecto`. Sequelize ignoraba el campo silenciosamente.

**Fix aplicado en:** `viva-api/src/controllers/leads.controller.js` → `updateLead()` — ahora mapea `id_estado` → `id_estado_prospecto` antes del update.
