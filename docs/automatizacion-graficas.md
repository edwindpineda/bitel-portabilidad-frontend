# Documentación de Gráficas de Automatización

## Endpoints

| Tab | Endpoint | Controller |
|-----|----------|------------|
| Campañas | `GET /api/automatizacion/campanas?idEmpresa={id}` | `getAutomatizacionCampanas()` |
| Recordatorios | `GET /api/automatizacion/recordatorios?idEmpresa={id}` | `getAutomatizacionRecordatorios()` |
| Recuperación | `GET /api/automatizacion/recuperacion?idEmpresa={id}` | `getAutomatizacionRecuperacion()` |
| Segmentación | `GET /api/automatizacion/segmentar?idEmpresa={id}&...` | `getSegmentacion()` |

**Frontend:** `app/(dashboard)/dashboard/automatizacion/page.js`
**Backend:** `viva-api/src/controllers/reportes.controller.js`

---

## TAB 1: Campañas WS

### 4 KPI Cards

| Card | Valor | Lógica SQL | Por qué |
|------|-------|------------|---------|
| **Envíos** | Total de prospectos que recibieron una campaña WS | `COUNT(DISTINCT cp.id_prospecto)` de `campania_prospectos` donde la campaña tiene `id_plantilla_whatsapp IS NOT NULL` | Cuenta prospectos únicos incluidos en ejecuciones de campañas de WhatsApp. Se filtra por `id_plantilla_whatsapp` para solo contar campañas que usan plantilla WS (no email ni otro canal). |
| **Vistos** | Prospectos cuyo mensaje de plantilla fue entregado | Subquery: existe en `mensaje` un registro con `m.id_plantilla_whatsapp IS NOT NULL` para el chat de ese prospecto | Proxy de "entregado/visto": si existe un mensaje en el chat del prospecto que referencia una plantilla WS, significa que el mensaje fue procesado y entregado. No tenemos confirmación de lectura de WhatsApp, así que usamos entrega como proxy. |
| **Respondidos** | Prospectos que respondieron después de la campaña | Subquery: existe un `mensaje` con `direccion = 'in'` cuya `fecha_hora > ce.fecha_registro` (fecha de ejecución de la campaña) | Si el prospecto envió un mensaje entrante (`in`) después de que se ejecutó la campaña, se considera que respondió al mensaje de la campaña. |
| **Desuscritos** | Prospectos que solicitaron hablar con humano | Subquery: existe un `chat` con `bot_activo = 0` para ese prospecto | Cuando un prospecto pide hablar con un humano, el bot se desactiva (`bot_activo = 0`). Esto se usa como proxy de "desuscripción" ya que indica que el prospecto no quiere seguir interactuando con el bot. |

**% vs mes anterior:** Se ejecuta una segunda query idéntica pero filtrando `ce.fecha_registro` al mes anterior. El cambio se calcula como `((actual - anterior) / anterior * 100)`. Solo se calcula para Envíos y Respondidos.

### Embudo de interacciones (FunnelChart - 4 niveles)

```
Envíos (100%) → Visto (X%) → Respondido (Y%) → Desuscrito (Z%)
```

- Mismos valores que los KPIs
- El porcentaje de cada nivel se calcula sobre el total de envíos: `Math.round(valor / enviados * 100) + '%'`
- Si enviados = 0, todos los porcentajes son "0%"

### Evolución mensual (AreaChart)

- **Filtro:** `ce.fecha_registro >= DATE_TRUNC('year', CURRENT_DATE)` — solo el año actual
- **Agrupación:** `EXTRACT(MONTH FROM ce.fecha_registro)` + `TO_CHAR(..., 'Mon')`
- **Series:** `Envios`, `Vistos`, `Respondido`, `Desuscritos` (misma lógica que KPIs pero por mes)
- **Colores:** `#6366f1` (envíos), `#8b5cf6` (vistos), `#06b6d4` (respondidos), `#f43f5e` (desuscritos)

### Tablas involucradas

| Tabla | Rol |
|-------|-----|
| `campania_prospectos` (cp) | Tabla base — relación campaña-prospecto |
| `campania_ejecucion` (ce) | JOIN — fecha de ejecución de la campaña |
| `campania` (ca) | JOIN — filtrar solo campañas WS (`id_plantilla_whatsapp IS NOT NULL`) |
| `prospecto` (p) | JOIN — filtrar por empresa y estado activo |
| `chat` (ch) | Subquery — verificar bot_activo y mensajes |
| `mensaje` (m) | Subquery — verificar entrega de plantilla y respuestas |

---

## TAB 2: Recordatorios de citas

### 3 KPI Cards

| Card | Valor | Lógica SQL | Por qué |
|------|-------|------------|---------|
| **Enviados** | Total de recordatorios enviados | `COUNT(*)` de `prospecto_recordatorio` | Cada registro en `prospecto_recordatorio` representa un recordatorio enviado a un prospecto. |
| **Vistos** | Recordatorios con cantidad > 0 | `COUNT(*) FILTER (WHERE pr.cantidad > 0)` | El campo `cantidad` indica cuántas veces se ha enviado el recordatorio. Si es > 0, significa que efectivamente se envió al menos una vez (fue procesado). |
| **Respondidos** | Prospectos que respondieron después del recordatorio | Subquery: existe `mensaje` con `direccion = 'in'` y `fecha_hora > pr.fecha_registro` | Si el prospecto envió un mensaje entrante después de la fecha del recordatorio, se considera que respondió al recordatorio. |

### Embudo de recordatorios (FunnelChart - 3 niveles, con toggle)

```
Enviados (100%) → Vistos (X%) → Respondidos (Y%)
```

- Vista estática: embudo
- Vista evolución: AreaChart mensual con series `Enviados`, `Vistos`, `Respondidos`

### Donut de Reagendamiento (con toggle)

| Segmento | Valor | Lógica SQL | Por qué |
|----------|-------|------------|---------|
| **Sí** (verde) | % de citas reagendadas | `COUNT(*) FILTER (WHERE c.fecha_actualizacion > c.fecha_registro)` / total × 100 | Si la `fecha_actualizacion` de una cita es posterior a su `fecha_registro`, significa que la cita fue modificada/reagendada después de crearse. |
| **No** (rojo) | % de citas no reagendadas | `100 - porcentaje_si` | Citas que no fueron modificadas (la fecha de actualización es igual a la de registro o es NULL). |

- **Centro del donut:** muestra el porcentaje de "Sí" (reagendadas)
- **Vista evolución:** AreaChart mensual con series `Sí` y `No`

### Evolución recordatorios (AreaChart)

- **Filtro:** `pr.fecha_registro >= DATE_TRUNC('year', CURRENT_DATE)`
- **Series:** `Enviados`, `Vistos`, `Respondidos`
- **Colores:** `#6366f1`, `#06b6d4`, `#10b981`

### Evolución reagendamiento (AreaChart)

- **Filtro:** `c.fecha_registro >= DATE_TRUNC('year', CURRENT_DATE)`
- **Series:** `Sí`, `No`
- **Colores:** `#10b981` (sí), `#f43f5e` (no)

### Tablas involucradas

| Tabla | Rol |
|-------|-----|
| `prospecto_recordatorio` (pr) | Tabla base — recordatorios enviados |
| `prospecto` (p) | JOIN — filtrar por empresa |
| `cita` (c) | Query separada — datos de reagendamiento |
| `chat` (ch) | Subquery — buscar respuestas |
| `mensaje` (m) | Subquery — verificar mensajes `in` posteriores |

---

## TAB 3: Mensajes de recuperación

### 3 KPI Cards

| Card | Valor | Lógica SQL | Por qué |
|------|-------|------------|---------|
| **Enviados** | Total de chats abandonados | CTE `chats_abandonados`: chats cuyo último mensaje es `direccion = 'out'` y `NOW() - fecha_hora > INTERVAL '24 hours'` | Un chat se considera "abandonado" cuando el último mensaje fue enviado por el bot/asesor (`out`) y han pasado más de 24 horas sin respuesta del prospecto. Estos son los chats candidatos a recuperación. |
| **Vistos** | Chats abandonados con mensaje de seguimiento | De los chats abandonados, los que tienen un mensaje `out` adicional cercano al último | Proxy: si hay un mensaje `out` enviado cerca del último mensaje de abandono, se considera que se envió un intento de recuperación y fue "visto" (entregado). |
| **Respondidos** | Chats abandonados donde el prospecto respondió | De los chats abandonados, los que tienen un `mensaje` con `direccion = 'in'` posterior al último `out` | Si después del abandono el prospecto envió un mensaje entrante, se considera recuperación exitosa. |

### Embudo de recuperación (FunnelChart - 3 niveles)

```
Enviados (100%) → Vistos (X%) → Respondidos (Y%)
```

### Evolución mensual (AreaChart)

- **CTE `mensajes_recup`:** Busca mensajes `out` del año actual donde NO existió un mensaje `in` en las 24h previas (mensajes enviados a prospectos que no respondían)
- **Filtro:** `m.fecha_hora >= DATE_TRUNC('year', CURRENT_DATE)`
- **Series:** `Enviados`, `Vistos`, `Respondidos`
- **Colores:** `#6366f1`, `#06b6d4`, `#10b981`

### Lógica del CTE `chats_abandonados`

```sql
WITH chats_abandonados AS (
    SELECT c.id, c.id_prospecto, ultimo.fecha_hora as fecha_ultimo_out
    FROM chat c
    INNER JOIN prospecto p ON p.id = c.id_prospecto AND p.estado_registro = 1
    LEFT JOIN LATERAL (
        SELECT m.direccion, m.fecha_hora
        FROM mensaje m
        WHERE m.id_chat = c.id AND m.estado_registro = 1
        ORDER BY m.fecha_hora DESC
        LIMIT 1
    ) ultimo ON true
    WHERE c.estado_registro = 1
    AND ultimo.direccion = 'out'
    AND NOW() - ultimo.fecha_hora > INTERVAL '24 hours'
)
```

**Explicación paso a paso:**
1. Toma cada chat activo (`estado_registro = 1`)
2. Con `LATERAL JOIN` obtiene el último mensaje de ese chat (por `fecha_hora DESC LIMIT 1`)
3. Filtra solo los chats donde ese último mensaje fue `out` (enviado por bot/asesor)
4. Y ese mensaje tiene más de 24 horas de antigüedad (sin respuesta del prospecto)

### Tablas involucradas

| Tabla | Rol |
|-------|-----|
| `chat` (c) | Tabla base — conversaciones |
| `mensaje` (m) | LATERAL JOIN + subqueries — último mensaje, respuestas |
| `prospecto` (p) | JOIN — filtrar por empresa |

---

## Endpoint: Segmentación

**Ruta:** `GET /api/automatizacion/segmentar`

No tiene gráficas asociadas. Retorna una lista de prospectos filtrados.

### Query params

| Param | Ejemplo | Lógica SQL | Por qué |
|-------|---------|------------|---------|
| `idEmpresa` | `1` | `p.id_empresa = :idEmpresa` | Filtro multi-tenant |
| `estado` | `1,2,3` | `p.id_estado_prospecto IN (1,2,3)` | Filtra por estados del embudo (Nuevo, Contactado, etc.) |
| `scoring` | `frio,tibio` | `p.calificacion_lead IN ('frio','tibio')` | Filtra por temperatura del lead |
| `contactado` | `0` o `1` | `p.fue_contactado = :contactado` | Filtra si fue contactado o no |
| `actividad` | `abandonados` | Subquery LATERAL: último msg es `out` y > 24h | Prospectos con chat abandonado |
| `actividad` | `sin_respuesta` | Subquery LATERAL: último msg es `out` (cualquier tiempo) | Prospectos cuyo último mensaje fue del bot |
| `actividad` | `sin_chat` | `NOT EXISTS (SELECT 1 FROM chat...)` | Prospectos que nunca tuvieron conversación |

### Respuesta

```json
{
  "data": {
    "total": 150,
    "prospectos": [
      {
        "id": 1,
        "nombre_completo": "Juan Pérez",
        "celular": "51999999999",
        "email": "juan@email.com",
        "calificacion_lead": "tibio",
        "id_estado_prospecto": 2,
        "estado_nombre": "Contactado",
        "fue_contactado": 1,
        "fecha_registro": "2026-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

- Máximo 100 prospectos por consulta, ordenados por fecha más reciente
- `total` indica el conteo real sin límite

---

## Campos clave en BD

| Campo | Tabla | Tipo | Significado |
|-------|-------|------|-------------|
| `id_plantilla_whatsapp` | `campania` | INTEGER (FK) | Si no es NULL, la campaña usa plantilla WS |
| `bot_activo` | `chat` | INTEGER (0/1) | 0 = humano atendiendo, 1 = bot activo |
| `direccion` | `mensaje` | VARCHAR | `'in'` = mensaje del prospecto, `'out'` = del bot/asesor |
| `cantidad` | `prospecto_recordatorio` | INTEGER | Veces que se envió el recordatorio |
| `fecha_actualizacion` | `cita` | TIMESTAMP | Si > fecha_registro, la cita fue modificada |
| `calificacion_lead` | `prospecto` | VARCHAR | `'frio'`, `'tibio'`, `'caliente'`, `NULL` |
| `fue_contactado` | `prospecto` | INTEGER (0/1) | Flag de contacto |
| `estado_registro` | (todas) | INTEGER (0/1) | 1 = activo, 0 = eliminado (soft delete) |
