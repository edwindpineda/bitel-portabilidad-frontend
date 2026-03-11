'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
  CheckCircle2,
  XCircle,
  CalendarDays
} from 'lucide-react';
// ─── Colors ───
const COLORS = {
  accent: '#06d6a0',
  info: '#38bdf8',
  warning: '#fbbf24',
  danger: '#ef4444',
  purple: '#a78bfa',
  orange: '#fb923c'
};
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, 
} from 'recharts';

function TipificacionTree({ stats }) {
  const baseTotal = stats?.embudo?.base_total || 0;
  const baseNoRecorrida = stats?.embudo?.base_no_recorrida || 0;
  const baseRecorrida = stats?.embudo?.base_recorrida || 0;

  const answer = stats?.embudo?.answer || 0;
  const noAnswer = stats?.embudo?.no_answer || 0;

  const valido = stats?.embudo?.contacto_valido || 0;
  const noValido = stats?.embudo?.contacto_no_valido || 0;

  const efectivo = stats?.embudo?.contacto_efectivo || 0;
  const noEfectivo = stats?.embudo?.contacto_no_efectivo || 0;

  const Node = ({ title, value, color, Icon, sub, level = 2 }) => {
    const styles = {
      1: {
        card: 'w-full max-w-[220px] px-4 py-4 rounded-2xl',
        iconWrap: 'h-9 w-9 rounded-xl',
        icon: 18,
        title: 'text-[10px] md:text-[11px]',
        value: 'text-[40px] md:text-[46px]',
        sub: 'text-[9px] md:text-[10px]',
      },
      2: {
        card: 'w-full max-w-[190px] px-4 py-3.5 rounded-xl',
        iconWrap: 'h-8 w-8 rounded-lg',
        icon: 16,
        title: 'text-[9px] md:text-[10px]',
        value: 'text-[30px] md:text-[34px]',
        sub: 'text-[8px] md:text-[9px]',
      },
      3: {
        card: 'w-full max-w-[170px] px-3 py-3 rounded-xl',
        iconWrap: 'h-7 w-7 rounded-lg',
        icon: 14,
        title: 'text-[8px] md:text-[9px]',
        value: 'text-[24px] md:text-[28px]',
        sub: 'text-[8px]',
      },
    };

    const s = styles[level];

    return (
      <div
        className={`bg-white/95 backdrop-blur border border-slate-200 shadow-md text-center ${s.card}`}
      >
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <div
            className={`${s.iconWrap} flex items-center justify-center shadow-sm`}
            style={{ background: `${color}18` }}
          >
            <Icon size={s.icon} style={{ color }} />
          </div>

          <p
            className={`font-extrabold uppercase tracking-[0.08em] ${s.title}`}
            style={{ color }}
          >
            {title}
          </p>
        </div>

        <p className={`font-black leading-none ${s.value}`}>{value}</p>

        {sub ? (
          <p className={`mt-2 uppercase tracking-wide text-muted-foreground ${s.sub}`}>
            {sub}
          </p>
        ) : null}
      </div>
    );
  };

  const SplitConnector = ({ topColor, bottomColor }) => (
    <div className="hidden lg:flex flex-col items-center py-1">
      <div className="flex items-center justify-center h-8">
        <div className="h-[2px] w-12 xl:w-16 rounded-full" style={{ backgroundColor: topColor }} />
        <div
          className="w-0 h-0 border-y-[4px] border-y-transparent border-l-[7px]"
          style={{ borderLeftColor: topColor }}
        />
      </div>
      <div className="flex items-center justify-center h-8">
        <div className="h-[2px] w-12 xl:w-16 rounded-full" style={{ backgroundColor: bottomColor }} />
        <div
          className="w-0 h-0 border-y-[4px] border-y-transparent border-l-[7px]"
          style={{ borderLeftColor: bottomColor }}
        />
      </div>
    </div>
  );

  const SingleConnector = ({ color }) => (
    <div className="hidden lg:flex items-center justify-center">
      <div className="h-[2px] w-10 xl:w-14 rounded-full" style={{ backgroundColor: color }} />
      <div
        className="w-0 h-0 border-y-[4px] border-y-transparent border-l-[7px]"
        style={{ borderLeftColor: color }}
      />
    </div>
  );

  return (
    <div className="w-full">
      {/* MOBILE / TABLET */}
      <div className="flex flex-col gap-4 lg:hidden">
        <div className="flex justify-center">
          <Node
            title="BASE_TOTAL"
            value={baseTotal}
            color="#0f172a"
            Icon={BarChart3}
            sub="Base general"
            level={1}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 justify-items-center">
          <Node
            title="BASE_RECORRIDA"
            value={baseRecorrida}
            color="#06b6d4"
            Icon={PhoneCall}
            sub={baseTotal > 0 ? `${((baseRecorrida / baseTotal) * 100).toFixed(1)}% del total` : '0.0% del total'}
            level={2}
          />
          <Node
            title="BASE_NO_RECORRIDA"
            value={baseNoRecorrida}
            color="#64748b"
            Icon={PhoneMissed}
            sub={baseTotal > 0 ? `${((baseNoRecorrida / baseTotal) * 100).toFixed(1)}% del total` : '0.0% del total'}
            level={2}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 justify-items-center">
          <Node
            title="ANSWER"
            value={answer}
            color="#10b981"
            Icon={Phone}
            sub={baseRecorrida > 0 ? `${((answer / baseRecorrida) * 100).toFixed(1)}% de recorrida` : '0.0% de recorrida'}
            level={2}
          />
          <Node
            title="NO_ANSWER"
            value={noAnswer}
            color="#ef4444"
            Icon={PhoneOff}
            sub={baseRecorrida > 0 ? `${((noAnswer / baseRecorrida) * 100).toFixed(1)}% de recorrida` : '0.0% de recorrida'}
            level={2}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 justify-items-center">
          <Node
            title="CONTACTO_VALIDO"
            value={valido}
            color="#10b981"
            Icon={PhoneCall}
            sub={answer > 0 ? `${((valido / answer) * 100).toFixed(1)}% de answer` : '0.0% de answer'}
            level={3}
          />
          <Node
            title="CONTACTO_NO_VALIDO"
            value={noValido}
            color="#ef4444"
            Icon={XCircle}
            sub={answer > 0 ? `${((noValido / answer) * 100).toFixed(1)}% de answer` : '0.0% de answer'}
            level={3}
          />
          <Node
            title="CONTACTO_EFECTIVO"
            value={efectivo}
            color="#10b981"
            Icon={CheckCircle2}
            sub={valido > 0 ? `${((efectivo / valido) * 100).toFixed(1)}% de válido` : '0.0% de válido'}
            level={3}
          />
          <Node
            title="CONTACTO_NO_EFECTIVO"
            value={noEfectivo}
            color="#f59e0b"
            Icon={PhoneMissed}
            sub={valido > 0 ? `${((noEfectivo / valido) * 100).toFixed(1)}% de válido` : '0.0% de válido'}
            level={3}
          />
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden lg:flex items-center justify-start gap-3 xl:gap-4 overflow-x-auto pb-2">
        {/* Columna 1 */}
        <div className="flex flex-col justify-center min-w-fit">
          <Node
            title="BASE_TOTAL"
            value={baseTotal}
            color="#0f172a"
            Icon={BarChart3}
            sub="Base general"
            level={1}
          />
        </div>

        <SplitConnector topColor="#06b6d4" bottomColor="#64748b" />

        {/* Columna 2 */}
        <div className="flex flex-col gap-10 min-w-fit">
          <Node
            title="BASE_RECORRIDA"
            value={baseRecorrida}
            color="#06b6d4"
            Icon={PhoneCall}
            sub={baseTotal > 0 ? `${((baseRecorrida / baseTotal) * 100).toFixed(1)}% del total` : '0.0% del total'}
            level={2}
          />
          <Node
            title="BASE_NO_RECORRIDA"
            value={baseNoRecorrida}
            color="#64748b"
            Icon={PhoneMissed}
            sub={baseTotal > 0 ? `${((baseNoRecorrida / baseTotal) * 100).toFixed(1)}% del total` : '0.0% del total'}
            level={2}
          />
        </div>

        <SplitConnector topColor="#10b981" bottomColor="#ef4444" />

        {/* Columna 3 */}
        <div className="flex flex-col gap-8 min-w-fit">
          <Node
            title="ANSWER"
            value={answer}
            color="#10b981"
            Icon={Phone}
            sub={baseRecorrida > 0 ? `${((answer / baseRecorrida) * 100).toFixed(1)}% de recorrida` : '0.0% de recorrida'}
            level={2}
          />
          <Node
            title="NO_ANSWER"
            value={noAnswer}
            color="#ef4444"
            Icon={PhoneOff}
            sub={baseRecorrida > 0 ? `${((noAnswer / baseRecorrida) * 100).toFixed(1)}% de recorrida` : '0.0% de recorrida'}
            level={2}
          />
        </div>

        <SplitConnector topColor="#10b981" bottomColor="#ef4444" />

        {/* Columna 4 */}
        <div className="flex flex-col gap-7 min-w-fit">
          <Node
            title="CONTACTO_VALIDO"
            value={valido}
            color="#10b981"
            Icon={PhoneCall}
            sub={answer > 0 ? `${((valido / answer) * 100).toFixed(1)}% de answer` : '0.0% de answer'}
            level={3}
          />
          <Node
            title="CONTACTO_NO_VALIDO"
            value={noValido}
            color="#ef4444"
            Icon={XCircle}
            sub={answer > 0 ? `${((noValido / answer) * 100).toFixed(1)}% de answer` : '0.0% de answer'}
            level={3}
          />
        </div>

        <SplitConnector topColor="#10b981" bottomColor="#f59e0b" />

        {/* Columna 5 */}
        <div className="flex flex-col gap-6 min-w-fit">
          <Node
            title="CONTACTO_EFECTIVO"
            value={efectivo}
            color="#10b981"
            Icon={CheckCircle2}
            sub={valido > 0 ? `${((efectivo / valido) * 100).toFixed(1)}% de válido` : '0.0% de válido'}
            level={3}
          />
          <Node
            title="CONTACTO_NO_EFECTIVO"
            value={noEfectivo}
            color="#f59e0b"
            Icon={PhoneMissed}
            sub={valido > 0 ? `${((noEfectivo / valido) * 100).toFixed(1)}% de válido` : '0.0% de válido'}
            level={3}
          />
        </div>
      </div>
    </div>
  );
}
const formatDuration = (seconds) => {
  if (!seconds) return '0s';

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;

  if (m === 0) return `${s}s`;

  return `${m}m ${s}s`;
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
      setVal(Number((eased * num).toFixed(1)));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);
  return val;
}

// ─── KPI Card ───
function KpiCard({ label, value, icon: Icon, color, bgDim, format, index }) {
  const animated = useAnimatedValue(value);
  const display = format
  ? format(animated)
  : Number.isInteger(animated)
    ? animated.toLocaleString()
    : animated.toFixed(1);

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
const HOURS = ['06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22'];
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
  const max = Math.max(...(data?.flat?.() || [0]), 1);
  
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

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [idEmpresa, setIdEmpresa] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [empresaInicializada, setEmpresaInicializada] = useState(false);

  useEffect(() => {
    const empresaGuardada =
      localStorage.getItem('id_empresa') ||
      localStorage.getItem('empresa') ||
      '';

    if (empresaGuardada) {
      setIdEmpresa(String(empresaGuardada));
    }

    setEmpresaInicializada(true);
  }, []);
  const loadData = async () => {
    try {
      setLoading(true);

      const params = {};

      if (idEmpresa) params.empresa = idEmpresa;
      if (fechaInicio) params.fecha_inicio = fechaInicio;
if (fechaFin) params.fecha_fin = fechaFin;

      const res = await apiClient.get('/crm/consumo-indicadores', { params });

      const payload = res?.data?.data || res?.data || res;

      console.log('Indicadores:', payload);
      setData(payload);
    } catch (err) {
      console.error('Error cargando indicadores:', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!empresaInicializada) return;
    loadData();
  }, [empresaInicializada, idEmpresa, fechaInicio, fechaFin]);

  // ─── Computed stats ───
  
  const stats = data;
  const totalDuracionCampanias = (stats?.campanias || []).reduce(
    (sum, c) => sum + (c.duracion || 0),
    0
  );
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <Loader2 className="animate-spin h-10 w-10 text-emerald-500" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-[500px] text-sm text-gray-500">
        No se pudieron cargar los indicadores
      </div>
    );
  }
  const kpis = [
  {
    label: 'Base Total',
    value: stats?.embudo?.base_total || 0,
    icon: Phone,
    color: COLORS.accent,
    bgDim: 'rgba(6,214,160,0.12)'
  },

  {
    label: 'Base Recorrida',
    value: stats?.embudo?.base_recorrida || 0,
    icon: PhoneCall,
    color: COLORS.info,
    bgDim: 'rgba(56,189,248,0.12)'
  },

  {
    label: 'Sin Tipificar',
    value: stats?.embudo?.base_no_recorrida || 0,
    icon: PhoneMissed,
    color: COLORS.danger,
    bgDim: 'rgba(239,68,68,0.12)'
  },

  {
    label: 'T. Promedio',
    value: stats?.promedioDuracion || 0,
    icon: Timer,
    color: COLORS.purple,
    bgDim: 'rgba(167,139,250,0.12)',
    format: (v) => formatDuration(v)
  },

  {
    label: 'Minutos Totales',
    value: stats?.totalMinutosWeek || 0,
    icon: Clock,
    color: COLORS.warning,
    bgDim: 'rgba(251,191,36,0.12)'
  },

  {
    label: 'Campañas',
    value: stats?.totalCampanias || 0,
    icon: Users,
    color: COLORS.accent,
    bgDim: 'rgba(6,214,160,0.12)'
  },

  {
    label: 'Contactabilidad',
    value: parseFloat(stats?.kpis_percent?.contactabilidad || 0),
    icon: PhoneCall,
    color: COLORS.info,
    bgDim: 'rgba(56,189,248,0.12)',
    format: (v) => `${v.toFixed(1)}%`
  },

  {
    label: 'Tasa Cierre',
    value: parseFloat(stats?.kpis_percent?.tasa_cierre || 0),
    icon: Activity,
    color: COLORS.warning,
    bgDim: 'rgba(251,191,36,0.12)',
    format: (v) => `${v.toFixed(1)}%`
  },

  {
    label: 'Efectividad',
    value: parseFloat(stats?.kpis_percent?.efectividad || 0),
    icon: TrendingUp,
    color: COLORS.purple,
    bgDim: 'rgba(167,139,250,0.12)',
    format: (v) => `${v.toFixed(1)}%`
  },

  {
  label: 'Conversión Total',
  value: (parseFloat(stats?.kpis?.conversion_total || 0) * 100),
  icon: Flame,
  color: COLORS.orange,
  bgDim: 'rgba(251,146,60,0.12)',
  format: (v) => `${v.toFixed(1)}%`
},

{
  label: 'Conversión Recorrida',
  value: (parseFloat(stats?.kpis?.conversion_recorrida || 0) * 100),
  icon: CheckCircle2,
  color: COLORS.accent,
  bgDim: 'rgba(6,214,160,0.12)',
  format: (v) => `${v.toFixed(1)}%`
},


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
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
  <div className="flex items-center gap-3">
    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
      <BarChart3 className="h-5 w-5 text-white" />
    </div>
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Indicadores de Llamadas</h1>
      <p className="text-xs text-muted-foreground">Metricas y rendimiento del call center</p>
    </div>
  </div>

  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative">
        <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
        <input
          type="date"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          className="h-10 w-full sm:w-[170px] rounded-xl border border-emerald-200 bg-white pl-10 pr-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <div className="relative">
        <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
        <input
          type="date"
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
          className="h-10 w-full sm:w-[170px] rounded-xl border border-emerald-200 bg-white pl-10 pr-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
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
  className="h-10 gap-2 rounded-xl border-emerald-200 px-4 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200"
    
>
  Limpiar
</Button>
    <Button
      variant="outline"
      size="sm"
      onClick={loadData}
      className="h-10 gap-2 rounded-xl border-emerald-200 px-4 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 transition-all duration-200"
    >
      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      Actualizar
    </Button>
  </div>
</div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <KpiCard key={kpi.label} {...kpi} index={i} />
          ))}
        </div>
      
  <GlassCard className="overflow-hidden">
  <CardHeader className="pb-2"> 
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-lg">
          <BarChart3 className="h-5 w-5 text-white" />
        </div>
        <div>
          <CardTitle className="text-sm font-semibold">Embudo de Tipificaciones</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Flujo completo desde base total hasta contacto efectivo
          </p>
        </div>
      </div>
    </CardHeader>

    <CardContent className="pt-2 pb-4 px-3 sm:px-4 md:px-6">
      <TipificacionTree stats={stats} />
    </CardContent>
  </GlassCard>



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
                  <AreaChart data={stats?.hourly || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                      data={stats?.tipificaciones || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      labelLine={false}
                      label={renderDonutLabel}
                    >
                      {(stats?.tipificaciones || []).map((entry, i) => (
                        <Cell key={i} fill={entry.color || COLORS.accent} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend */}
              <div className="space-y-1.5 mt-2">
                {(stats?.tipificaciones || []).map((entry, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ background: entry.color || COLORS.accent }}
                      />
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
                  <BarChart data={stats?.weekly || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar dataKey="llamadas" name="Llamadas" fill={COLORS.info} radius={[4,4,0,0]} />
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
              <Heatmap data={stats?.heatmap ?? DAYS.map(() => HOURS.map(() => 0))} />
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
                <BarChart data={stats?.minutes || []} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={v => `${v} min`} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="minutos" name="Minutos" fill={COLORS.accent} radius={[6, 6, 0, 0]}>
                    {(stats?.minutes || []).map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.day === stats?.peakDay?.day ? COLORS.warning : COLORS.accent}
                      />
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
                { label: 'Total Llamadas', value: stats?.total || 0, sub: `${stats?.totalCampanias || 0} campanias`, color: COLORS.info, bg: 'rgba(56,189,248,0.08)' },
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
        {stats?.campanias && stats.campanias.length > 0 && (
          <GlassCard>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">Rendimiento por Campania</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Resumen de llamadas por campania</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/30 border-b">
                      <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Campania</th>
                      <th className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Llamadas</th>
                      <th className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Participación</th>
                      <th className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Tasa</th>
                      <th className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">Duracion Total</th>
                      <th className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-4 py-3">T. Promedio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.campanias.map((camp, i) => {
                      const tasa = totalDuracionCampanias > 0
                      ? ((camp.duracion / totalDuracionCampanias) * 100).toFixed(1)
                      : '0.0';

                      const tasaNum = parseFloat(tasa);
                      const tasaColor = tasaNum >= 40 ? COLORS.accent : tasaNum >= 20 ? COLORS.warning : COLORS.danger;
                      const tasaBg = tasaNum >= 40
                        ? 'rgba(6,214,160,0.12)'
                        : tasaNum >= 20
                          ? 'rgba(251,191,36,0.12)'
                          : 'rgba(239,68,68,0.12)';

                      const avgDur = camp.avg_duracion || 0;
                      return (
                        <tr key={i} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                          <td className="px-4 py-3">
                            <span className="text-sm font-semibold">{camp.name}</span>
                          </td>
                          <td className="text-center px-4 py-3">
                            <span className="text-sm font-mono font-semibold">{camp.total}</span>
                          </td>
                          <td className="text-center px-4 py-3">
                            <span className="text-sm font-mono font-semibold" style={{ color: COLORS.accent }}>
                              {stats?.embudo?.base_recorrida > 0
                                ? ((camp.total / stats.embudo.base_recorrida) * 100).toFixed(1)
                                : '0.0'}%
                            </span>
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
