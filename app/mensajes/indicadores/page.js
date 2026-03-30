'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api';
import {
  MessageCircle,
  Send,
  Inbox,
  RefreshCw,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Users,
  Timer,
  Activity,
  AlertCircle,
  Link,
  ChevronRight,
} from 'lucide-react';

const COLORS = {
  accent: '#06d6a0',
  info: '#38bdf8',
  warning: '#fbbf24',
  danger: '#ef4444',
  purple: '#a78bfa',
  orange: '#fb923c',
};

function useAnimatedValue(target, duration = 1200) {
  const [val, setVal] = useState(0);

  useMemo(() => {
    const num =
      typeof target === 'number'
        ? target
        : parseFloat(String(target).replace(/[^0-9.]/g, ''));

    if (isNaN(num) || num === 0) {
      setVal(0);
      return;
    }

    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Number((eased * num).toFixed(1)));

      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [target, duration]);

  return val;
}

function KpiCard({ label, value, icon: Icon, color, bgDim, format, index, integer = false }) {
  const animated = useAnimatedValue(value);

  let display;
  if (format) {
    display = format(animated);
  } else if (integer) {
    display = Math.round(animated).toLocaleString();
  } else {
    display = Number(animated).toFixed(1);
  }

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-white/60 bg-white p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="absolute top-0 left-0 right-0 h-1 opacity-80" style={{ background: color }} />
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl"
        style={{ background: color }}
      />
      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
          <p className="text-3xl font-bold tracking-tight">{display}</p>
        </div>

        <div
          className="h-11 w-11 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300"
          style={{ background: bgDim }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      </div>
    </div>
  );
}

function GlassCard({ children, className = '' }) {
  return (
    <Card
      className={`relative overflow-hidden border-white/60 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-shadow duration-300 ${className}`}
    >
      {children}
    </Card>
  );
}

function SectionSeparator({ label }) {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200/60" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-[#f5f3ff] px-4 text-xs text-muted-foreground uppercase tracking-widest">
          {label}
        </span>
      </div>
    </div>
  );
}

function MetricRow({ label, value, color = '#0f172a' }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-bold font-mono" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

// ─── Embudo visual vertical ───
function FunnelEmbudo({ masivos, respondieron, links }) {
  const pctRespondieron = masivos > 0 ? (respondieron / masivos) * 100 : 0;
  const pctLinks = masivos > 0 ? (links / masivos) * 100 : 0;

  const steps = [
    {
      label: 'Masivos Enviados',
      sub: 'Mensajes salientes',
      value: masivos,
      pct: 100,
      color: '#38bdf8',
      bg: 'rgba(56,189,248,0.08)',
      border: 'rgba(56,189,248,0.25)',
      Icon: Send,
    },
    {
      label: 'Clientes Respondieron',
      sub: masivos > 0 ? `${pctRespondieron.toFixed(1)}% del total` : '—',
      value: respondieron,
      pct: pctRespondieron,
      color: '#06d6a0',
      bg: 'rgba(6,214,160,0.08)',
      border: 'rgba(6,214,160,0.25)',
      Icon: MessageCircle,
    },
    {
      label: 'Link de Pago Enviado',
      sub: masivos > 0 ? `${pctLinks.toFixed(1)}% del total` : '—',
      value: links,
      pct: pctLinks,
      color: '#a78bfa',
      bg: 'rgba(167,139,250,0.08)',
      border: 'rgba(167,139,250,0.25)',
      Icon: Link,
    },
  ];

  return (
    <div className="flex flex-col items-center gap-0 py-2">
      {steps.map((step, i) => {
        // ancho del trapecio decrece con cada nivel
        const widthPct = 100 - i * 15;
        return (
          <div key={step.label} className="flex flex-col items-center w-full">
            {/* Tarjeta trapezoidal */}
            <div
              className="relative flex items-center gap-5 rounded-2xl border px-6 py-5 shadow-sm transition-all duration-300 hover:shadow-md"
              style={{
                background: step.bg,
                borderColor: step.border,
                width: `${widthPct}%`,
              }}
            >
              {/* Icono */}
              <div
                className="h-12 w-12 flex-shrink-0 rounded-xl flex items-center justify-center shadow-sm"
                style={{ background: `${step.color}20` }}
              >
                <step.Icon className="h-6 w-6" style={{ color: step.color }} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: step.color }}>
                  {step.label}
                </p>
                <p className="text-4xl font-black leading-tight text-slate-800">
                  {step.value.toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">{step.sub}</p>
              </div>

              {/* Barra de % */}
              <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-xs font-mono font-semibold" style={{ color: step.color }}>
                  {step.pct.toFixed(1)}%
                </span>
                <div className="w-24 h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(step.pct, 100)}%`, background: step.color }}
                  />
                </div>
              </div>

              {/* Número de paso */}
              <div
                className="absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow"
                style={{ background: step.color }}
              >
                {i + 1}
              </div>
            </div>

            {/* Flecha hacia abajo entre pasos */}
            {i < steps.length - 1 && (
              <div className="flex flex-col items-center my-1" style={{ width: `${widthPct - 15}%` }}>
                <div className="w-px h-4 bg-slate-300" />
                <div
                  className="w-0 h-0"
                  style={{
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderTop: '8px solid #cbd5e1',
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const EMPTY_KPIS = {
  chat_totales: 0,
  no_enviados: 0,
  mensajes_entrantes: 0,
  mensajes_salientes: 0,
  mensajes_entrantes_respondidos: 0,
  mensajes_salientes_respondidos: 0,
  tasa_respuesta_inbound: 0,
  tasa_respuesta_outbound: 0,
  productividad_entrante: 0,
  productividad_saliente: 0,
  frt_minutos: 0,
  links_pago_enviados: 0,
};

export default function MensajesIndicadoresPage() {
  const today = new Date().toISOString().split('T')[0];
  const [loading, setLoading] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(today);
  const [fechaFin, setFechaFin] = useState(today);
  const [kpisData, setKpisData] = useState(null);
  const [porUsuarioHora, setPorUsuarioHora] = useState([]);
  const [error, setError] = useState(null);

  const stats = kpisData || EMPTY_KPIS;

  useEffect(() => {
    loadData();
  }, [fechaInicio, fechaFin]);

  const formatMinutes = (minutes) => {
    const total = Math.max(0, Number(minutes) || 0);
    const m = Math.floor(total);
    const s = Math.round((total - m) * 60);
    if (m === 0) return `${s}s`;
    if (s === 0) return `${m}m`;
    return `${m}m ${s}s`;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const id_empresa = localStorage.getItem('id_empresa') || '1';

      const params = { id_empresa };
      if (fechaInicio) params.start_date = fechaInicio;
      if (fechaFin) params.end_date = fechaFin;

      const res = await apiClient.get('/kpi', { params });

      setKpisData(res?.data?.kpis || EMPTY_KPIS);
      setPorUsuarioHora(res?.data?.por_usuario_hora || []);
    } catch (err) {
      console.error('Error cargando indicadores de mensajes:', err);
      setError('No se pudieron cargar los indicadores. Verifica los filtros e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const kpis = [
    {
      label: 'Chat Totales',
      value: stats.chat_totales,
      icon: MessageCircle,
      color: COLORS.accent,
      bgDim: 'rgba(6,214,160,0.12)',
      integer: true,
    },
    {
      label: 'No Enviados',
      value: stats.no_enviados,
      icon: XCircle,
      color: COLORS.danger,
      bgDim: 'rgba(239,68,68,0.12)',
      integer: true,
    },
    {
      label: 'Msg. Entrantes',
      value: stats.mensajes_entrantes,
      icon: Inbox,
      color: COLORS.purple,
      bgDim: 'rgba(167,139,250,0.12)',
      integer: true,
    },
    {
      label: 'Msg. Salientes',
      value: stats.mensajes_salientes,
      icon: Send,
      color: COLORS.info,
      bgDim: 'rgba(56,189,248,0.12)',
      integer: true,
    },
    {
      label: 'Entrantes Resp.',
      value: stats.mensajes_entrantes_respondidos,
      icon: CheckCircle2,
      color: COLORS.accent,
      bgDim: 'rgba(6,214,160,0.12)',
      integer: true,
    },
    {
      label: 'Salientes Resp.',
      value: stats.mensajes_salientes_respondidos,
      icon: CheckCircle2,
      color: COLORS.info,
      bgDim: 'rgba(56,189,248,0.12)',
      integer: true,
    },
    {
      label: 'Tasa Resp. Inbound',
      value: stats.tasa_respuesta_inbound,
      icon: TrendingUp,
      color: COLORS.orange,
      bgDim: 'rgba(251,146,60,0.12)',
      format: (v) => `${v.toFixed(1)}%`,
    },
    {
      label: 'Tasa Resp. Outbound',
      value: stats.tasa_respuesta_outbound,
      icon: Activity,
      color: COLORS.warning,
      bgDim: 'rgba(251,191,36,0.12)',
      format: (v) => `${v.toFixed(1)}%`,
    },
    {
      label: 'Productividad Entr.',
      value: stats.productividad_entrante,
      icon: BarChart3,
      color: COLORS.purple,
      bgDim: 'rgba(167,139,250,0.12)',
      format: (v) => v.toFixed(2),
    },
    {
      label: 'Productividad Sal.',
      value: stats.productividad_saliente,
      icon: BarChart3,
      color: COLORS.accent,
      bgDim: 'rgba(6,214,160,0.12)',
      format: (v) => v.toFixed(2),
    },
    {
      label: 'FRT Promedio',
      value: stats.frt_minutos,
      icon: Timer,
      color: COLORS.info,
      bgDim: 'rgba(56,189,248,0.12)',
      format: (v) => formatMinutes(v),
    },
    {
      label: 'Links de Pago',
      value: stats.links_pago_enviados,
      icon: Link,
      color: COLORS.purple,
      bgDim: 'rgba(167,139,250,0.12)',
      integer: true,
    },
    {
      label: 'Agentes con Chats',
      value: new Set(porUsuarioHora.map((r) => r.username)).size,
      icon: Users,
      color: COLORS.warning,
      bgDim: 'rgba(251,191,36,0.12)',
      integer: true,
    },
  ];

  return (
    <div
      className="min-h-full"
      style={{
        background: 'linear-gradient(135deg, #f8f9fe 0%, #f1f5f9 50%, #f5f3ff 100%)',
      }}
    >
      <div className="space-y-7">
        {/* Breadcrumb */}
        <div className="text-sm text-muted-foreground">
          Mensajes <span className="mx-1.5 text-gray-300">/</span>
          <span className="text-foreground font-medium">Indicadores</span>
        </div>

        {/* Header */}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Indicadores de Mensajes</h1>
              <p className="text-xs text-muted-foreground">
                Métricas y rendimiento del módulo de mensajería
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="h-10 w-full sm:w-[170px] rounded-xl border border-violet-200 bg-white pl-10 pr-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="h-10 w-full sm:w-[170px] rounded-xl border border-violet-200 bg-white pl-10 pr-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFechaInicio('');
                setFechaFin('');
              }}
              className="h-10 gap-2 rounded-xl border-violet-200 px-4 text-violet-600 hover:bg-violet-50 hover:border-violet-300 transition-all duration-200"
            >
              Limpiar
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="h-10 gap-2 rounded-xl border-violet-200 px-4 text-violet-600 hover:bg-violet-50 hover:border-violet-300 transition-all duration-200"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Empty state */}
        {!kpisData && !loading && !error && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-violet-200 bg-white/60 py-16 text-center">
            <div className="mb-4 h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center shadow-lg">
              <MessageCircle className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-base font-semibold text-slate-700">Sin datos cargados</h3>
            <p className="mt-1 text-sm text-slate-400">
              Selecciona un rango de fechas y presiona <span className="font-medium text-violet-600">Actualizar</span>.
            </p>
          </div>
        )}

        {/* KPIs + contenido */}
        {kpisData && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {kpis.map((kpi, i) => (
                <KpiCard key={kpi.label} {...kpi} index={i} />
              ))}
            </div>

            <SectionSeparator label="Embudo de conversión" />

            {/* Embudo visual */}
            <GlassCard>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">Embudo de Mensajería Masiva</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Desde el envío masivo hasta el link de pago generado
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <FunnelEmbudo
                  masivos={stats.mensajes_salientes}
                  respondieron={stats.mensajes_salientes_respondidos}
                  links={stats.links_pago_enviados}
                />
              </CardContent>
            </GlassCard>

            <SectionSeparator label="Resumen general" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GlassCard>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">Flujo de Mensajes</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Resumen de chats entrantes y salientes
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <MetricRow label="Chat totales" value={stats.chat_totales.toLocaleString()} />
                  <MetricRow label="Sin mensajes enviados" value={stats.no_enviados.toLocaleString()} color={COLORS.danger} />
                  <MetricRow label="Mensajes entrantes" value={stats.mensajes_entrantes.toLocaleString()} color={COLORS.purple} />
                  <MetricRow label="Mensajes salientes" value={stats.mensajes_salientes.toLocaleString()} color={COLORS.info} />
                  <MetricRow label="Entrantes respondidos" value={stats.mensajes_entrantes_respondidos.toLocaleString()} color={COLORS.accent} />
                  <MetricRow label="Salientes respondidos" value={stats.mensajes_salientes_respondidos.toLocaleString()} color={COLORS.accent} />
                  <MetricRow label="Links de pago enviados" value={stats.links_pago_enviados.toLocaleString()} color={COLORS.purple} />
                </CardContent>
              </GlassCard>

              <GlassCard>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shadow-lg">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">Rendimiento Operativo</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Tasas, productividad y tiempos
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <MetricRow label="Tasa respuesta inbound" value={`${stats.tasa_respuesta_inbound.toFixed(1)}%`} color={COLORS.orange} />
                  <MetricRow label="Tasa respuesta outbound" value={`${stats.tasa_respuesta_outbound.toFixed(1)}%`} color={COLORS.warning} />
                  <MetricRow label="Productividad entrante" value={stats.productividad_entrante.toFixed(2)} color={COLORS.purple} />
                  <MetricRow label="Productividad saliente" value={stats.productividad_saliente.toFixed(2)} color={COLORS.accent} />
                  <MetricRow label="FRT promedio" value={formatMinutes(stats.frt_minutos)} color={COLORS.info} />
                  <MetricRow
                    label="Agentes con chats"
                    value={new Set(porUsuarioHora.map((r) => r.username)).size.toLocaleString()}
                    color={COLORS.warning}
                  />
                </CardContent>
              </GlassCard>
            </div>

            <SectionSeparator label="En construcción" />

            <GlassCard>
              <CardContent className="py-10">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="mb-4 h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                    <MessageCircle className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Módulo de gráficos de mensajes</h3>
                  <p className="mt-2 max-w-xl text-sm text-slate-500">
                    Aquí luego metemos volumen por hora, rendimiento por agente y mapa de calor.
                    Los datos <span className="font-medium text-slate-700">por_usuario_hora</span> ya
                    están disponibles desde el backend ({porUsuarioHora.length} registros cargados).
                  </p>
                </div>
              </CardContent>
            </GlassCard>
          </>
        )}
      </div>
    </div>
  );
}
