'use client';

import { useState, useEffect, useMemo } from 'react';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  PhoneMissed,
  Clock,
  RefreshCw,
  Loader2,
  Activity,
  BarChart3,
  TrendingUp,
  Users,
  Flame,
  Timer,
  Voicemail,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';

// ─── Colors ───
const COLORS = {
  accent: '#06d6a0',
  info: '#38bdf8',
  warning: '#fbbf24',
  danger: '#ef4444',
  purple: '#a78bfa',
  orange: '#fb923c',
};

const COLOR_MAP = {
  'rojo': '#EF4444', 'naranja': '#F97316', 'amarillo': '#EAB308',
  'verde': '#22C55E', 'azul': '#3B82F6', 'indigo': '#6366F1',
  'cyan': '#06B6D4', 'teal': '#14B8A6', 'gris': '#6B7280',
  'morado': '#A855F7', 'rosa': '#EC4899',
};

const getColorHex = (color) => {
  if (!color) return '#6B7280';
  if (color.startsWith('#')) return color;
  return COLOR_MAP[color.toLowerCase()] || '#6B7280';
};

// ─── Animated counter ───
function useAnimatedValue(target, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const num = typeof target === 'number' ? target : parseFloat(String(target).replace(/[^0-9.]/g, ''));
    if (isNaN(num) || num === 0) { setVal(0); return; }
    const startTime = performance.now();
    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.floor(eased * num));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);
  return val;
}

// ─── KPI Card ───
function KpiCard({ label, value, icon: Icon, color, bgDim, format, index }) {
  const animated = useAnimatedValue(value);
  const display = format ? format(animated) : animated.toLocaleString();

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
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
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

// ─── Glass Card ───
function GlassCard({ children, className = '' }) {
  return (
    <Card className={`relative overflow-hidden border-white/60 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-shadow duration-300 ${className}`}>
      {children}
    </Card>
  );
}

// ─── Section Separator ───
function SectionSeparator({ label }) {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200/60" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-[#f5f3ff] px-4 text-xs text-muted-foreground uppercase tracking-widest">{label}</span>
      </div>
    </div>
  );
}

// ─── Custom Tooltip ───
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/50 bg-white px-3 py-2 shadow-xl text-xs">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-mono font-semibold">{p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Heatmap ───
const HOURS = ['08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19'];
const DAYS = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

function HeatmapCell({ value, max }) {
  const ratio = max > 0 ? value / max : 0;
  let bg;
  if (ratio < 0.15) bg = 'rgba(6,214,160,0.06)';
  else if (ratio < 0.3) bg = 'rgba(6,214,160,0.18)';
  else if (ratio < 0.5) bg = 'rgba(6,214,160,0.32)';
  else if (ratio < 0.7) bg = 'rgba(6,214,160,0.50)';
  else if (ratio < 0.85) bg = 'rgba(6,214,160,0.70)';
  else bg = 'rgba(6,214,160,0.92)';
  const textColor = ratio > 0.5 ? '#064e3b' : '#64748b';

  return (
    <div
      className="flex items-center justify-center rounded text-[10px] font-mono font-semibold h-8 hover:scale-110 hover:ring-1 hover:ring-foreground/30 transition-all cursor-default"
      style={{ background: bg, color: textColor }}
    >
      {value}
    </div>
  );
}

function Heatmap({ data }) {
  const max = Math.max(...data.flat(), 1);
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Header */}
        <div className="grid gap-1" style={{ gridTemplateColumns: `56px repeat(${HOURS.length}, 1fr)` }}>
          <div />
          {HOURS.map(h => (
            <div key={h} className="text-center text-[10px] font-mono text-muted-foreground pb-1">{h}:00</div>
          ))}
        </div>
        {/* Rows */}
        {DAYS.map((day, di) => (
          <div key={day} className="grid gap-1 mb-1" style={{ gridTemplateColumns: `56px repeat(${HOURS.length}, 1fr)` }}>
            <div className="flex items-center text-xs font-semibold text-muted-foreground pr-2">{day}</div>
            {HOURS.map((_, hi) => (
              <HeatmapCell key={hi} value={data[di]?.[hi] ?? 0} max={max} />
            ))}
          </div>
        ))}
        {/* Legend */}
        <div className="flex items-center justify-end gap-1.5 mt-3">
          <span className="text-[10px] text-muted-foreground">Menos</span>
          {[0.06, 0.18, 0.32, 0.50, 0.70, 0.92].map((op, i) => (
            <div key={i} className="w-3.5 h-3.5 rounded-sm" style={{ background: `rgba(6,214,160,${op})` }} />
          ))}
          <span className="text-[10px] text-muted-foreground">Mas</span>
        </div>
      </div>
    </div>
  );
}

// ─── Agent Mini Heatmap ───
function MiniHeatmap({ data }) {
  const max = Math.max(...data.flat(), 1);
  return (
    <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${HOURS.length}, 1fr)`, gridTemplateRows: `repeat(${DAYS.length}, 1fr)` }}>
      {DAYS.map((_, di) =>
        HOURS.map((_, hi) => {
          const v = data[di]?.[hi] ?? 0;
          const r = max > 0 ? v / max : 0;
          let bg;
          if (r < 0.15) bg = 'rgba(56,189,248,0.05)';
          else if (r < 0.35) bg = 'rgba(56,189,248,0.20)';
          else if (r < 0.6) bg = 'rgba(56,189,248,0.40)';
          else if (r < 0.8) bg = 'rgba(56,189,248,0.65)';
          else bg = 'rgba(56,189,248,0.90)';
          return <div key={`${di}-${hi}`} className="h-2 rounded-sm" style={{ background: bg }} />;
        })
      )}
    </div>
  );
}

// ─── Donut label ───
const renderDonutLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-semibold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// ═══════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════
export default function IndicadoresLlamadasPage() {
  const [llamadas, setLlamadas] = useState([]);
  const [tipificaciones, setTipificaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [llamadasRes, tipRes] = await Promise.all([
        apiClient.get('/crm/llamadas'),
        apiClient.get('/crm/tipificacion-llamada'),
      ]);
      setLlamadas(llamadasRes.data || []);
      setTipificaciones(tipRes.data || []);
    } catch (err) {
      console.error('Error cargando indicadores:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ─── Computed stats ───
  const stats = useMemo(() => {
    if (!llamadas.length) return null;

    const total = llamadas.length;
    const conTipificacion = llamadas.filter(l => l.id_tipificacion_llamada).length;
    const sinTipificacion = total - conTipificacion;
    const totalDuracion = llamadas.reduce((s, l) => s + (l.duracion_seg || 0), 0);
    const promedioDuracion = total > 0 ? Math.round(totalDuracion / total) : 0;
    const totalMinutos = Math.round(totalDuracion / 60);

    // Group by tipificacion
    const tipMap = {};
    llamadas.forEach(l => {
      const key = l.tipificacion_llamada_nombre || 'Sin tipificar';
      if (!tipMap[key]) {
        tipMap[key] = { name: key, value: 0, color: getColorHex(l.tipificacion_llamada_color) };
      }
      tipMap[key].value++;
    });
    const tipificacionData = Object.values(tipMap).sort((a, b) => b.value - a.value);

    // Group by hour
    const hourlyMap = {};
    HOURS.forEach(h => { hourlyMap[h] = { hour: `${h}:00`, llamadas: 0, duracion: 0 }; });
    llamadas.forEach(l => {
      if (!l.fecha_inicio && !l.fecha_registro) return;
      const date = new Date(l.fecha_inicio || l.fecha_registro);
      const h = String(date.getHours()).padStart(2, '0');
      if (hourlyMap[h]) {
        hourlyMap[h].llamadas++;
        hourlyMap[h].duracion += (l.duracion_seg || 0);
      }
    });
    const hourlyData = HOURS.map(h => hourlyMap[h]);

    // Group by day of week
    const dayMap = {};
    DAYS.forEach((d, i) => { dayMap[i] = { day: d, llamadas: 0, conTip: 0, sinTip: 0, duracion: 0 }; });
    llamadas.forEach(l => {
      const date = new Date(l.fecha_registro || l.fecha_inicio);
      let dow = date.getDay(); // 0=Sun
      dow = dow === 0 ? 6 : dow - 1; // Convert to Mon=0
      if (dayMap[dow]) {
        dayMap[dow].llamadas++;
        dayMap[dow].duracion += (l.duracion_seg || 0);
        if (l.id_tipificacion_llamada) dayMap[dow].conTip++;
        else dayMap[dow].sinTip++;
      }
    });
    const weeklyData = DAYS.map((_, i) => dayMap[i]);

    // Heatmap: 7 days x 12 hours
    const heatmapData = DAYS.map(() => HOURS.map(() => 0));
    llamadas.forEach(l => {
      const date = new Date(l.fecha_inicio || l.fecha_registro);
      let dow = date.getDay();
      dow = dow === 0 ? 6 : dow - 1;
      const h = String(date.getHours()).padStart(2, '0');
      const hi = HOURS.indexOf(h);
      if (hi >= 0 && dow >= 0 && dow < 7) heatmapData[dow][hi]++;
    });

    // Minutes per day (for stacked bar)
    const minutesData = weeklyData.map(d => ({
      day: d.day,
      minutos: Math.round(d.duracion / 60),
      llamadas: d.llamadas,
    }));
    const totalMinutosWeek = minutesData.reduce((s, d) => s + d.minutos, 0);
    const avgMinutosDay = minutesData.length > 0 ? Math.round(totalMinutosWeek / 7) : 0;
    const peakDay = minutesData.reduce((max, d) => d.minutos > max.minutos ? d : max, minutesData[0] || { day: '-', minutos: 0 });

    // Group by campania
    const campaniaMap = {};
    llamadas.forEach(l => {
      const key = l.campania_nombre || 'Sin campaña';
      if (!campaniaMap[key]) campaniaMap[key] = { name: key, total: 0, conTip: 0, duracion: 0 };
      campaniaMap[key].total++;
      if (l.id_tipificacion_llamada) campaniaMap[key].conTip++;
      campaniaMap[key].duracion += (l.duracion_seg || 0);
    });
    const campaniaData = Object.values(campaniaMap).sort((a, b) => b.total - a.total);

    return {
      total, conTipificacion, sinTipificacion, promedioDuracion, totalMinutos,
      tipificacionData, hourlyData, weeklyData, heatmapData,
      minutesData, totalMinutosWeek, avgMinutosDay, peakDay,
      campaniaData,
    };
  }, [llamadas]);

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  if (loading) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center h-64 gap-3" style={{ background: 'linear-gradient(135deg, #f8f9fe 0%, #f1f5f9 50%, #f5f3ff 100%)' }}>
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-sm text-muted-foreground">Cargando indicadores...</p>
      </div>
    );
  }

  const kpis = [
    { label: 'Total Llamadas', value: stats?.total || 0, icon: Phone, color: COLORS.accent, bgDim: 'rgba(6,214,160,0.12)' },
    { label: 'Con Tipificacion', value: stats?.conTipificacion || 0, icon: PhoneCall, color: COLORS.info, bgDim: 'rgba(56,189,248,0.12)' },
    { label: 'Sin Tipificar', value: stats?.sinTipificacion || 0, icon: PhoneMissed, color: COLORS.danger, bgDim: 'rgba(239,68,68,0.12)' },
    { label: 'T. Promedio', value: stats?.promedioDuracion || 0, icon: Timer, color: COLORS.purple, bgDim: 'rgba(167,139,250,0.12)', format: (v) => formatDuration(v) },
    { label: 'Minutos Totales', value: stats?.totalMinutos || 0, icon: Clock, color: COLORS.warning, bgDim: 'rgba(251,191,36,0.12)' },
    { label: 'Campañas', value: stats?.campaniaData?.length || 0, icon: Activity, color: COLORS.orange, bgDim: 'rgba(251,146,60,0.12)' },
  ];

  return (
    <div className="min-h-full" style={{ background: 'linear-gradient(135deg, #f8f9fe 0%, #f1f5f9 50%, #f5f3ff 100%)' }}>
      <div className="space-y-7">

        {/* Banner en construccion */}
        <div className="construction-banner relative rounded-2xl overflow-hidden shadow-lg">
          {/* Background animado */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-[length:200%_100%] animate-[gradientSlide_4s_ease-in-out_infinite]" />
          {/* Shimmer overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-[shimmer_3s_ease-in-out_infinite]" />
          {/* Barras diagonales tipo warning */}
          <div className="absolute inset-0 opacity-[0.06] bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,#000_10px,#000_20px)]" />

          <div className="relative flex items-center gap-4 px-5 py-4">
            {/* Icono con pulso */}
            <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 animate-[pulse_2s_ease-in-out_infinite] shadow-inner">
              <span className="text-2xl drop-shadow-lg animate-[lightSwitch_1.5s_ease-in-out_infinite]">💡</span>
            </div>
            <div>
              <p className="text-base font-bold text-white drop-shadow-sm tracking-wide">Modulo en construccion</p>
              <p className="text-sm text-white/80 font-medium">Este modulo esta en desarrollo activo. Los datos mostrados pueden ser parciales.</p>
            </div>
            {/* Badge derecha */}
            <div className="ml-auto shrink-0 hidden sm:flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5">
              <span className="h-2 w-2 rounded-full bg-white animate-[pulse_1.5s_ease-in-out_infinite]" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">En desarrollo</span>
            </div>
          </div>

          <style jsx>{`
            @keyframes lightSwitch {
              0%, 100% { opacity: 1; filter: brightness(1.2) drop-shadow(0 0 8px rgba(251,191,36,0.8)); transform: scale(1); }
              40% { opacity: 0.2; filter: brightness(0.3) drop-shadow(0 0 0px transparent); transform: scale(0.9); }
              60% { opacity: 1; filter: brightness(1.4) drop-shadow(0 0 12px rgba(251,191,36,1)); transform: scale(1.05); }
            }
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(100%); }
            }
            @keyframes gradientSlide {
              0%, 100% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
            }
          `}</style>
        </div>

        {/* Breadcrumb */}
        <div className="text-sm text-muted-foreground">
          Llamadas <span className="mx-1.5 text-gray-300">/</span>
          <span className="text-foreground font-medium">Indicadores</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Indicadores de Llamadas</h1>
              <p className="text-xs text-muted-foreground">Metricas y rendimiento del call center</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="gap-2 rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {kpis.map((kpi, i) => (
            <KpiCard key={kpi.label} {...kpi} index={i} />
          ))}
        </div>

        <SectionSeparator label="Analisis por tiempo" />

        {/* Row 1: Area chart + Donut */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Volumen por hora */}
          <GlassCard className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">Volumen por Hora</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Distribucion horaria de llamadas</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.hourlyData || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradLlamadas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.accent} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={COLORS.accent} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="llamadas" name="Llamadas" stroke={COLORS.accent} fill="url(#gradLlamadas)" strokeWidth={2.5} dot={{ r: 4, fill: COLORS.accent }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </GlassCard>

          {/* Donut: Resultado de llamadas */}
          <GlassCard>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <PhoneOff className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">Resultado de Llamadas</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Distribucion por tipificacion</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.tipificacionData || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      labelLine={false}
                      label={renderDonutLabel}
                    >
                      {(stats?.tipificacionData || []).map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="space-y-1.5 mt-2">
                {(stats?.tipificacionData || []).map((entry, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: entry.color }} />
                      <span className="text-muted-foreground truncate">{entry.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-semibold">{entry.value}</span>
                      <span className="font-mono text-muted-foreground">
                        {stats?.total ? ((entry.value / stats.total) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </GlassCard>
        </div>

        {/* Row 2: Weekly Bars + Heatmap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rendimiento semanal */}
          <GlassCard>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">Rendimiento Semanal</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Llamadas por dia de la semana</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.weeklyData || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar dataKey="conTip" name="Tipificadas" fill={COLORS.info} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="sinTip" name="Sin tipificar" fill={COLORS.warning} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </GlassCard>

          {/* Mapa de calor */}
          <GlassCard>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Flame className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">Mapa de Calor</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Llamadas por dia y hora</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Heatmap data={stats?.heatmapData || DAYS.map(() => HOURS.map(() => 0))} />
            </CardContent>
          </GlassCard>
        </div>

        <SectionSeparator label="Consumo y rendimiento" />

        {/* Minutos consumidos por dia */}
        <GlassCard>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Minutos Consumidos por Dia</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Consumo de minutos semanal</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.minutesData || []} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={v => `${v} min`} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="minutos" name="Minutos" fill={COLORS.accent} radius={[6, 6, 0, 0]}>
                    {(stats?.minutesData || []).map((entry, i) => (
                      <Cell key={i} fill={entry === stats?.peakDay ? COLORS.warning : COLORS.accent} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              {[
                { label: 'Total Semanal', value: `${stats?.totalMinutosWeek || 0} min`, sub: `${((stats?.totalMinutosWeek || 0) / 60).toFixed(1)} horas`, color: COLORS.accent, bg: 'rgba(6,214,160,0.08)' },
                { label: 'Promedio Diario', value: `${stats?.avgMinutosDay || 0} min`, sub: `${((stats?.avgMinutosDay || 0) / 60).toFixed(1)} horas`, color: COLORS.purple, bg: 'rgba(167,139,250,0.08)' },
                { label: 'Dia Pico', value: `${stats?.peakDay?.day || '-'} — ${stats?.peakDay?.minutos || 0} min`, sub: `${((stats?.peakDay?.minutos || 0) / 60).toFixed(1)} horas`, color: COLORS.warning, bg: 'rgba(251,191,36,0.08)' },
                { label: 'Total Llamadas', value: stats?.total || 0, sub: `${stats?.campaniaData?.length || 0} campañas`, color: COLORS.info, bg: 'rgba(56,189,248,0.08)' },
              ].map((card, i) => (
                <div key={i} className="rounded-xl p-4 border" style={{ background: card.bg, borderColor: card.bg }}>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1">{card.label}</p>
                  <p className="text-lg font-bold font-mono" style={{ color: card.color }}>{card.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{card.sub}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </GlassCard>

        {/* Rendimiento por campania */}
        {stats?.campaniaData && stats.campaniaData.length > 0 && (
          <GlassCard>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">Rendimiento por Campaña</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Resumen de llamadas por campaña</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/30 border-b">
                      <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Campaña</th>
                      <th className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Llamadas</th>
                      <th className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Tipificadas</th>
                      <th className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Tasa</th>
                      <th className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Duracion Total</th>
                      <th className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">T. Promedio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.campaniaData.map((camp, i) => {
                      const tasa = camp.total > 0 ? ((camp.conTip / camp.total) * 100).toFixed(1) : '0.0';
                      const tasaNum = parseFloat(tasa);
                      const tasaColor = tasaNum >= 80 ? COLORS.accent : tasaNum >= 50 ? COLORS.warning : COLORS.danger;
                      const tasaBg = tasaNum >= 80 ? 'rgba(6,214,160,0.12)' : tasaNum >= 50 ? 'rgba(251,191,36,0.12)' : 'rgba(239,68,68,0.12)';
                      const avgDur = camp.total > 0 ? Math.round(camp.duracion / camp.total) : 0;

                      return (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                          <td className="px-4 py-3">
                            <span className="text-sm font-semibold">{camp.name}</span>
                          </td>
                          <td className="text-center px-4 py-3">
                            <span className="text-sm font-mono font-semibold">{camp.total}</span>
                          </td>
                          <td className="text-center px-4 py-3">
                            <span className="text-sm font-mono font-semibold" style={{ color: COLORS.accent }}>{camp.conTip}</span>
                          </td>
                          <td className="text-center px-4 py-3">
                            <span
                              className="inline-block px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold"
                              style={{ color: tasaColor, background: tasaBg }}
                            >
                              {tasa}%
                            </span>
                          </td>
                          <td className="text-center px-4 py-3">
                            <span className="text-sm font-mono text-muted-foreground">{formatDuration(camp.duracion)}</span>
                          </td>
                          <td className="text-center px-4 py-3">
                            <span className="text-sm font-mono text-muted-foreground">{formatDuration(avgDur)}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </GlassCard>
        )}

      </div>
    </div>
  );
}
