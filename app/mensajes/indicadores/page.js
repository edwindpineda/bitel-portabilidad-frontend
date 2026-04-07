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
  Crown,
  Medal,
  Trophy,
  Loader2,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';

const COLORS = {
  accent: '#06d6a0',
  info: '#38bdf8',
  warning: '#fbbf24',
  danger: '#ef4444',
  purple: '#a78bfa',
  orange: '#fb923c',
};
const PIE_COLORS = ['#06d6a0', '#38bdf8', '#a78bfa', '#fbbf24', '#fb923c', '#ef4444', '#14b8a6', '#e879f9', '#64748b', '#f97316'];

// ─── Animated value hook ───
function useAnimatedValue(target, duration = 1200) {
  const [val, setVal] = useState(0);
  useMemo(() => {
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
function KpiCard({ label, value, icon: Icon, color, bgDim, format, index, integer = false }) {
  const animated = useAnimatedValue(value);
  let display;
  if (format) display = format(animated);
  else if (integer) display = Math.round(animated).toLocaleString();
  else display = Number(animated).toFixed(1);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/60 bg-white p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500" style={{ animationDelay: `${index * 80}ms` }}>
      <div className="absolute top-0 left-0 right-0 h-1 opacity-80" style={{ background: color }} />
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl" style={{ background: color }} />
      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-bold tracking-tight">{display}</p>
        </div>
        <div className="h-11 w-11 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300" style={{ background: bgDim }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      </div>
    </div>
  );
}

function GlassCard({ children, className = '' }) {
  return (
    <Card className={`relative overflow-hidden border-white/60 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-shadow duration-300 ${className}`}>
      {children}
    </Card>
  );
}

function SectionSeparator({ label }) {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200/60" /></div>
      <div className="relative flex justify-center">
        <span className="bg-[#f5f3ff] px-4 text-xs text-muted-foreground uppercase tracking-widest">{label}</span>
      </div>
    </div>
  );
}

function MetricRow({ label, value, color = '#0f172a' }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="text-sm font-bold font-mono" style={{ color }}>{value}</span>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 backdrop-blur px-4 py-3 shadow-xl">
      <p className="text-xs font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs" style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{Number(p.value).toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
}

// ─── Embudo visual vertical (masivos) ───
function FunnelEmbudo({ masivos, respondieron, links }) {
  const pctRespondieron = masivos > 0 ? (respondieron / masivos) * 100 : 0;
  const pctLinks = masivos > 0 ? (links / masivos) * 100 : 0;
  const steps = [
    { label: 'Masivos Enviados', sub: 'Mensajes salientes', value: masivos, pct: 100, color: '#38bdf8', bg: 'rgba(56,189,248,0.08)', border: 'rgba(56,189,248,0.25)', Icon: Send },
    { label: 'Clientes Respondieron', sub: masivos > 0 ? `${pctRespondieron.toFixed(1)}% del total` : '—', value: respondieron, pct: pctRespondieron, color: '#06d6a0', bg: 'rgba(6,214,160,0.08)', border: 'rgba(6,214,160,0.25)', Icon: MessageCircle },
    { label: 'Link de Pago Enviado', sub: masivos > 0 ? `${pctLinks.toFixed(1)}% del total` : '—', value: links, pct: pctLinks, color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.25)', Icon: Link },
  ];
  return (
    <div className="flex flex-col items-center gap-0 py-2">
      {steps.map((step, i) => {
        const widthPct = 100 - i * 15;
        return (
          <div key={step.label} className="flex flex-col items-center w-full">
            <div className="relative flex items-center gap-5 rounded-2xl border px-6 py-5 shadow-sm transition-all duration-300 hover:shadow-md" style={{ background: step.bg, borderColor: step.border, width: `${widthPct}%` }}>
              <div className="h-12 w-12 flex-shrink-0 rounded-xl flex items-center justify-center shadow-sm" style={{ background: `${step.color}20` }}>
                <step.Icon className="h-6 w-6" style={{ color: step.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: step.color }}>{step.label}</p>
                <p className="text-4xl font-black leading-tight text-slate-800">{step.value.toLocaleString()}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{step.sub}</p>
              </div>
              <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-xs font-mono font-semibold" style={{ color: step.color }}>{step.pct.toFixed(1)}%</span>
                <div className="w-24 h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(step.pct, 100)}%`, background: step.color }} />
                </div>
              </div>
              <div className="absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow" style={{ background: step.color }}>{i + 1}</div>
            </div>
            {i < steps.length - 1 && (
              <div className="flex flex-col items-center my-1" style={{ width: `${widthPct - 15}%` }}>
                <div className="w-px h-4 bg-slate-300" />
                <div className="w-0 h-0" style={{ borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '8px solid #cbd5e1' }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Embudo de Equivalencias (mismo estilo que llamadas) ───
function EquivalenciasTree({ equivalencias }) {
  const getVal = (key) => {
    const found = equivalencias.find(e => e.equivalencia === key);
    return found ? parseInt(found.value) || 0 : 0;
  };

  const total = equivalencias.reduce((acc, e) => acc + (parseInt(e.value) || 0), 0);
  const noAnswer = getVal('NO_ANSWER');
  const sinGestionar = getVal('ULTIMO_MENSAJE_MENOR_A_24_HORAS');
  const answer = getVal('ANSWER');
  const efectivo = getVal('C.EFECTIVO');
  const noEfectivo = getVal('C.N.EFECTIVO');
  const noValido = getVal('C.N.VALIDO');
  const gestionados = total - sinGestionar;
  const contactados = answer + efectivo + noEfectivo + noValido;

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

        <p className={`font-black leading-none ${s.value}`}>{value.toLocaleString()}</p>

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

  return (
    <div className="w-full">
      {/* MOBILE / TABLET */}
      <div className="flex flex-col gap-4 lg:hidden">
        <div className="flex justify-center">
          <Node title="BASE_TOTAL" value={total} color="#0f172a" Icon={BarChart3} sub="Base general" level={1} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 justify-items-center">
          <Node title="BASE_RECORRIDA" value={gestionados} color="#06b6d4" Icon={Send}
            sub={total > 0 ? `${((gestionados / total) * 100).toFixed(1)}% del total` : '0.0% del total'} level={2} />
          <Node title="BASE_NO_RECORRIDA" value={sinGestionar} color="#64748b" Icon={Inbox}
            sub={total > 0 ? `${((sinGestionar / total) * 100).toFixed(1)}% del total` : '0.0% del total'} level={2} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 justify-items-center">
          <Node title="ANSWER" value={contactados} color="#10b981" Icon={MessageCircle}
            sub={gestionados > 0 ? `${((contactados / gestionados) * 100).toFixed(1)}% de recorrida` : '0.0% de recorrida'} level={2} />
          <Node title="NO_ANSWER" value={noAnswer} color="#ef4444" Icon={XCircle}
            sub={gestionados > 0 ? `${((noAnswer / gestionados) * 100).toFixed(1)}% de recorrida` : '0.0% de recorrida'} level={2} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 justify-items-center">
          <Node title="CONTACTO_VALIDO" value={efectivo + noEfectivo} color="#10b981" Icon={CheckCircle2}
            sub={contactados > 0 ? `${(((efectivo + noEfectivo) / contactados) * 100).toFixed(1)}% de answer` : '0.0% de answer'} level={3} />
          <Node title="CONTACTO_NO_VALIDO" value={noValido} color="#ef4444" Icon={XCircle}
            sub={contactados > 0 ? `${((noValido / contactados) * 100).toFixed(1)}% de answer` : '0.0% de answer'} level={3} />
          <Node title="CONTACTO_EFECTIVO" value={efectivo} color="#10b981" Icon={CheckCircle2}
            sub={(efectivo + noEfectivo) > 0 ? `${((efectivo / (efectivo + noEfectivo)) * 100).toFixed(1)}% de válido` : '0.0% de válido'} level={3} />
          <Node title="CONTACTO_NO_EFECTIVO" value={noEfectivo} color="#f59e0b" Icon={AlertCircle}
            sub={(efectivo + noEfectivo) > 0 ? `${((noEfectivo / (efectivo + noEfectivo)) * 100).toFixed(1)}% de válido` : '0.0% de válido'} level={3} />
        </div>
      </div>

      {/* DESKTOP */}
      <div className="hidden lg:flex items-center justify-start gap-3 xl:gap-4 overflow-x-auto pb-2">
        {/* Columna 1 */}
        <div className="flex flex-col justify-center min-w-fit">
          <Node title="BASE_TOTAL" value={total} color="#0f172a" Icon={BarChart3} sub="Base general" level={1} />
        </div>

        <SplitConnector topColor="#06b6d4" bottomColor="#64748b" />

        {/* Columna 2 */}
        <div className="flex flex-col gap-10 min-w-fit">
          <Node title="BASE_RECORRIDA" value={gestionados} color="#06b6d4" Icon={Send}
            sub={total > 0 ? `${((gestionados / total) * 100).toFixed(1)}% del total` : '0.0% del total'} level={2} />
          <Node title="BASE_NO_RECORRIDA" value={sinGestionar} color="#64748b" Icon={Inbox}
            sub={total > 0 ? `${((sinGestionar / total) * 100).toFixed(1)}% del total` : '0.0% del total'} level={2} />
        </div>

        <SplitConnector topColor="#10b981" bottomColor="#ef4444" />

        {/* Columna 3 */}
        <div className="flex flex-col gap-8 min-w-fit">
          <Node title="ANSWER" value={contactados} color="#10b981" Icon={MessageCircle}
            sub={gestionados > 0 ? `${((contactados / gestionados) * 100).toFixed(1)}% de recorrida` : '0.0% de recorrida'} level={2} />
          <Node title="NO_ANSWER" value={noAnswer} color="#ef4444" Icon={XCircle}
            sub={gestionados > 0 ? `${((noAnswer / gestionados) * 100).toFixed(1)}% de recorrida` : '0.0% de recorrida'} level={2} />
        </div>

        <SplitConnector topColor="#10b981" bottomColor="#ef4444" />

        {/* Columna 4 */}
        <div className="flex flex-col gap-7 min-w-fit">
          <Node title="CONTACTO_VALIDO" value={efectivo + noEfectivo} color="#10b981" Icon={CheckCircle2}
            sub={contactados > 0 ? `${(((efectivo + noEfectivo) / contactados) * 100).toFixed(1)}% de answer` : '0.0% de answer'} level={3} />
          <Node title="CONTACTO_NO_VALIDO" value={noValido} color="#ef4444" Icon={XCircle}
            sub={contactados > 0 ? `${((noValido / contactados) * 100).toFixed(1)}% de answer` : '0.0% de answer'} level={3} />
        </div>

        <SplitConnector topColor="#10b981" bottomColor="#f59e0b" />

        {/* Columna 5 */}
        <div className="flex flex-col gap-6 min-w-fit">
          <Node title="CONTACTO_EFECTIVO" value={efectivo} color="#10b981" Icon={CheckCircle2}
            sub={(efectivo + noEfectivo) > 0 ? `${((efectivo / (efectivo + noEfectivo)) * 100).toFixed(1)}% de válido` : '0.0% de válido'} level={3} />
          <Node title="CONTACTO_NO_EFECTIVO" value={noEfectivo} color="#f59e0b" Icon={AlertCircle}
            sub={(efectivo + noEfectivo) > 0 ? `${((noEfectivo / (efectivo + noEfectivo)) * 100).toFixed(1)}% de válido` : '0.0% de válido'} level={3} />
        </div>
      </div>
    </div>
  );
}

const EMPTY_KPIS = {
  chat_totales: 0, no_enviados: 0, mensajes_entrantes: 0, mensajes_salientes: 0,
  mensajes_entrantes_respondidos: 0, mensajes_salientes_respondidos: 0,
  tasa_respuesta_inbound: 0, tasa_respuesta_outbound: 0,
  productividad_entrante: 0, productividad_saliente: 0,
  frt_minutos: 0, links_pago_enviados: 0,
};

export default function MensajesIndicadoresPage() {
  const today = new Date().toISOString().split('T')[0];
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const [loading, setLoading] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(sevenDaysAgo);
  const [fechaFin, setFechaFin] = useState(today);
  const [kpisData, setKpisData] = useState(null);
  const [porUsuarioHora, setPorUsuarioHora] = useState([]);
  const [tipificaciones, setTipificaciones] = useState([]);
  const [equivalencias, setEquivalencias] = useState([]);
  const [error, setError] = useState(null);

  const stats = kpisData || EMPTY_KPIS;

  useEffect(() => {
    loadData();
  }, [fechaInicio, fechaFin]);

  const formatMinutes = (minutes) => {
    const total = Math.max(0, Number(minutes) || 0);
    if (total >= 60) {
      const h = Math.floor(total / 60);
      const m = Math.round(total % 60);
      return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }
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
      setTipificaciones(res?.data?.tipificaciones || []);
      setEquivalencias(res?.data?.equivalencias || []);
    } catch (err) {
      console.error('Error cargando indicadores de mensajes:', err);
      setError('No se pudieron cargar los indicadores.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Datos procesados ───

  // Ranking asesores por chats totales
  const rankingAsesores = useMemo(() => {
    const map = {};
    porUsuarioHora.forEach(r => {
      const name = r.username || 'Sin asignar';
      map[name] = (map[name] || 0) + parseInt(r.chats || 0);
    });
    return Object.entries(map).map(([name, chats]) => ({ name, chats })).sort((a, b) => b.chats - a.chats);
  }, [porUsuarioHora]);

  const totalChatsAsesores = rankingAsesores.reduce((a, b) => a + b.chats, 0);

  // Volumen por hora (agregado)
  const volumenPorHora = useMemo(() => {
    const map = {};
    porUsuarioHora.forEach(r => {
      const h = parseInt(r.hora);
      map[h] = (map[h] || 0) + parseInt(r.chats || 0);
    });
    return Array.from({ length: 24 }, (_, i) => ({ hour: `${String(i).padStart(2, '0')}:00`, chats: map[i] || 0 }));
  }, [porUsuarioHora]);

  // Heatmap data: asesor x hora
  const heatmapData = useMemo(() => {
    const asesores = [...new Set(porUsuarioHora.filter(r => r.username).map(r => r.username))];
    const map = {};
    let maxVal = 0;
    porUsuarioHora.forEach(r => {
      if (!r.username) return;
      const key = `${r.username}-${r.hora}`;
      const val = parseInt(r.chats || 0);
      map[key] = val;
      if (val > maxVal) maxVal = val;
    });
    return { asesores, map, maxVal };
  }, [porUsuarioHora]);

  // Top 10 tipificaciones (sin "No contesta" y "Sin tipificar")
  const top10Tipificaciones = useMemo(() => {
    return tipificaciones
      .filter(t => t.name !== 'No contesta' && t.name !== 'Sin tipificar')
      .map(t => ({ name: t.name, value: parseInt(t.value) || 0 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [tipificaciones]);

  // Equivalencias para donut
  const equivalenciasDonut = useMemo(() => {
    return equivalencias.map(e => ({
      name: e.equivalencia.replace(/_/g, ' '),
      value: parseInt(e.value) || 0,
    }));
  }, [equivalencias]);

  // KPIs calculados
  const totalEquiv = equivalencias.reduce((a, e) => a + (parseInt(e.value) || 0), 0);
  const sinGestionar = parseInt(equivalencias.find(e => e.equivalencia === 'ULTIMO_MENSAJE_MENOR_A_24_HORAS')?.value || 0);
  const cEfectivo = parseInt(equivalencias.find(e => e.equivalencia === 'C.EFECTIVO')?.value || 0);
  const cNoEfectivo = parseInt(equivalencias.find(e => e.equivalencia === 'C.N.EFECTIVO')?.value || 0);
  const pctSinGestionar = totalEquiv > 0 ? ((sinGestionar / totalEquiv) * 100).toFixed(1) : '0.0';
  const tasaEfectividad = (cEfectivo + cNoEfectivo) > 0 ? ((cEfectivo / (cEfectivo + cNoEfectivo)) * 100).toFixed(1) : '0.0';
  const tasaConversion = stats.chat_totales > 0 ? ((cEfectivo / stats.chat_totales) * 100).toFixed(1) : '0.0';
  const ratioChatsAgente = rankingAsesores.filter(a => a.name !== 'Sin asignar').length > 0 ? Math.round(stats.chat_totales / rankingAsesores.filter(a => a.name !== 'Sin asignar').length) : 0;
  const ratioMsgChat = stats.chat_totales > 0 ? (stats.mensajes_salientes / stats.chat_totales).toFixed(2) : '0.00';

  const kpis = [
    { label: 'Chat Totales', value: stats.chat_totales, icon: MessageCircle, color: COLORS.accent, bgDim: 'rgba(6,214,160,0.12)', integer: true },
    { label: 'No Enviados', value: stats.no_enviados, icon: XCircle, color: COLORS.danger, bgDim: 'rgba(239,68,68,0.12)', integer: true },
    { label: 'Msg. Entrantes', value: stats.mensajes_entrantes, icon: Inbox, color: COLORS.purple, bgDim: 'rgba(167,139,250,0.12)', integer: true },
    { label: 'Msg. Salientes', value: stats.mensajes_salientes, icon: Send, color: COLORS.info, bgDim: 'rgba(56,189,248,0.12)', integer: true },
    { label: 'Entrantes Resp.', value: stats.mensajes_entrantes_respondidos, icon: CheckCircle2, color: COLORS.accent, bgDim: 'rgba(6,214,160,0.12)', integer: true },
    { label: 'Salientes Resp.', value: stats.mensajes_salientes_respondidos, icon: CheckCircle2, color: COLORS.info, bgDim: 'rgba(56,189,248,0.12)', integer: true },
    { label: 'Tasa Resp. Inbound', value: stats.tasa_respuesta_inbound, icon: TrendingUp, color: COLORS.orange, bgDim: 'rgba(251,146,60,0.12)', format: (v) => `${v.toFixed(1)}%` },
    { label: 'Tasa Resp. Outbound', value: stats.tasa_respuesta_outbound, icon: Activity, color: COLORS.warning, bgDim: 'rgba(251,191,36,0.12)', format: (v) => `${v.toFixed(1)}%` },
    { label: 'Productividad Entr.', value: stats.productividad_entrante, icon: BarChart3, color: COLORS.purple, bgDim: 'rgba(167,139,250,0.12)', format: (v) => v.toFixed(2) },
    { label: 'Productividad Sal.', value: stats.productividad_saliente, icon: BarChart3, color: COLORS.accent, bgDim: 'rgba(6,214,160,0.12)', format: (v) => v.toFixed(2) },
    { label: 'FRT Promedio', value: stats.frt_minutos, icon: Timer, color: COLORS.info, bgDim: 'rgba(56,189,248,0.12)', format: (v) => formatMinutes(v) },
    { label: 'Links de Pago', value: stats.links_pago_enviados, icon: Link, color: COLORS.purple, bgDim: 'rgba(167,139,250,0.12)', integer: true },
    { label: 'Agentes con Chats', value: rankingAsesores.filter(a => a.name !== 'Sin asignar').length, icon: Users, color: COLORS.warning, bgDim: 'rgba(251,191,36,0.12)', integer: true },
    { label: 'Ratio Msg/Chat', value: parseFloat(ratioMsgChat), icon: Activity, color: COLORS.orange, bgDim: 'rgba(251,146,60,0.12)', format: (v) => v.toFixed(2) },
    { label: 'Chats/Agente', value: ratioChatsAgente, icon: Users, color: COLORS.info, bgDim: 'rgba(56,189,248,0.12)', integer: true },
    { label: 'Tasa Efectividad', value: parseFloat(tasaEfectividad), icon: TrendingUp, color: COLORS.accent, bgDim: 'rgba(6,214,160,0.12)', format: (v) => `${v.toFixed(1)}%` },
    { label: 'Tasa Conversión', value: parseFloat(tasaConversion), icon: CheckCircle2, color: COLORS.purple, bgDim: 'rgba(167,139,250,0.12)', format: (v) => `${v.toFixed(1)}%` },
    { label: '% Sin Gestionar', value: parseFloat(pctSinGestionar), icon: Timer, color: COLORS.danger, bgDim: 'rgba(239,68,68,0.12)', format: (v) => `${v.toFixed(1)}%` },
  ];

  const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
  const MedalIcon = [Crown, Medal, Trophy];

  return (
    <div className="min-h-full relative" style={{ background: 'linear-gradient(135deg, #f8f9fe 0%, #f1f5f9 50%, #f5f3ff 100%)' }}>
      {loading && (
        <div className="absolute top-3 right-3 z-50 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-violet-100">
          <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
          <span className="text-xs text-violet-600 font-medium">Actualizando...</span>
        </div>
      )}
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
              <p className="text-xs text-muted-foreground">Métricas y rendimiento del módulo de mensajería</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />
                <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="h-10 w-full sm:w-[170px] rounded-xl border border-violet-200 bg-white pl-10 pr-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
              </div>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />
                <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="h-10 w-full sm:w-[170px] rounded-xl border border-violet-200 bg-white pl-10 pr-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setFechaInicio(''); setFechaFin(''); }} className="h-10 gap-2 rounded-xl border-violet-200 px-4 text-violet-600 hover:bg-violet-50 hover:border-violet-300 transition-all duration-200">
              Limpiar
            </Button>
            <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="h-10 gap-2 rounded-xl border-violet-200 px-4 text-violet-600 hover:bg-violet-50 hover:border-violet-300 transition-all duration-200">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />{error}
          </div>
        )}

        {!kpisData && !loading && !error && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-violet-200 bg-white/60 py-16 text-center">
            <div className="mb-4 h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center shadow-lg">
              <MessageCircle className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-base font-semibold text-slate-700">Sin datos cargados</h3>
            <p className="mt-1 text-sm text-slate-400">Selecciona un rango de fechas y presiona <span className="font-medium text-violet-600">Actualizar</span>.</p>
          </div>
        )}

        {kpisData && (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {kpis.map((kpi, i) => (
                <KpiCard key={kpi.label} {...kpi} index={i} />
              ))}
            </div>

            <SectionSeparator label="Embudo de conversión" />

            {/* Embudo Masivos */}
            <GlassCard>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">Embudo de Mensajería Masiva</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Desde el envío masivo hasta el link de pago generado</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <FunnelEmbudo masivos={stats.mensajes_salientes} respondieron={stats.mensajes_salientes_respondidos} links={stats.links_pago_enviados} />
              </CardContent>
            </GlassCard>

            {/* Embudo Equivalencias */}
            {equivalencias.length > 0 && (
              <GlassCard className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-lg">
                      <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">Embudo de Tipificaciones</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">Flujo completo por equivalencia de tipificación</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-2 pb-4 px-3 sm:px-4 md:px-6">
                  <EquivalenciasTree equivalencias={equivalencias} />
                </CardContent>
              </GlassCard>
            )}

            <SectionSeparator label="Ranking de Asesores" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ranking por chats */}
              <GlassCard>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                      <Crown className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">Ranking por Chats Asignados</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">Asesores con mayor volumen de chats</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {rankingAsesores.map((asesor, i) => {
                      const pct = totalChatsAsesores > 0 ? (asesor.chats / totalChatsAsesores) * 100 : 0;
                      const MIcon = i < 3 ? MedalIcon[i] : null;
                      return (
                        <div key={asesor.name} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3 hover:bg-slate-100/70 transition-colors">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: i < 3 ? `${medalColors[i]}20` : '#f1f5f9', color: i < 3 ? medalColors[i] : '#64748b' }}>
                            {MIcon ? <MIcon className="h-4 w-4" /> : i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-700 truncate">{asesor.name}</p>
                            <div className="w-full h-1.5 rounded-full bg-slate-200 mt-1 overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: i === 0 ? COLORS.accent : i === 1 ? COLORS.info : i === 2 ? COLORS.purple : '#94a3b8' }} />
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold font-mono text-slate-800">{asesor.chats.toLocaleString()}</p>
                            <p className="text-[10px] text-muted-foreground">{pct.toFixed(1)}%</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </GlassCard>

              {/* Distribución de carga - Donut */}
              <GlassCard>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">Distribución de Carga</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">Porcentaje de chats por asesor</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={rankingAsesores} dataKey="chats" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2}>
                          {rankingAsesores.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center mt-2">
                    {rankingAsesores.map((a, i) => (
                      <div key={a.name} className="flex items-center gap-1.5 text-[11px]">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-slate-600">{a.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </GlassCard>
            </div>

            <SectionSeparator label="Análisis por Tiempo" />

            {/* Volumen por hora */}
            <GlassCard className="lg:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">Volumen por Hora</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Distribución horaria de chats gestionados</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={volumenPorHora} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradChats" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.purple} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={COLORS.purple} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                      <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="chats" name="Chats" stroke={COLORS.purple} fill="url(#gradChats)" strokeWidth={2.5} dot={{ r: 4, fill: COLORS.purple }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </GlassCard>

            {/* Heatmap asesor x hora */}
            {heatmapData.asesores.length > 0 && (
              <GlassCard>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                      <Activity className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">Mapa de Calor: Asesor × Hora</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">Intensidad de chats por asesor y franja horaria</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase px-2 py-1 sticky left-0 bg-white">Asesor</th>
                          {Array.from({ length: 24 }, (_, i) => (
                            <th key={i} className="text-center text-[9px] font-medium text-muted-foreground px-0.5 py-1 min-w-[28px]">{String(i).padStart(2, '0')}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {heatmapData.asesores.map(asesor => (
                          <tr key={asesor}>
                            <td className="text-[11px] font-medium text-slate-700 px-2 py-1 sticky left-0 bg-white truncate max-w-[100px]">{asesor}</td>
                            {Array.from({ length: 24 }, (_, h) => {
                              const val = heatmapData.map[`${asesor}-${h}`] || 0;
                              const intensity = heatmapData.maxVal > 0 ? val / heatmapData.maxVal : 0;
                              return (
                                <td key={h} className="px-0.5 py-1">
                                  <div
                                    className="w-full h-6 rounded-sm flex items-center justify-center text-[8px] font-mono transition-all"
                                    style={{
                                      background: val > 0 ? `rgba(139, 92, 246, ${0.1 + intensity * 0.8})` : '#f8fafc',
                                      color: intensity > 0.5 ? 'white' : intensity > 0.2 ? '#6d28d9' : '#94a3b8',
                                    }}
                                    title={`${asesor} - ${h}:00 → ${val} chats`}
                                  >
                                    {val > 0 ? val : ''}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </GlassCard>
            )}

            <SectionSeparator label="Tipificaciones" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top 10 Tipificaciones - Bar horizontal */}
              {top10Tipificaciones.length > 0 && (
                <GlassCard>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
                        <BarChart3 className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold">Top 10 Tipificaciones</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">Excluyendo &quot;No contesta&quot; y &quot;Sin tipificar&quot;</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={top10Tipificaciones} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                          <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} stroke="#94a3b8" width={140} />
                          <RechartsTooltip content={<CustomTooltip />} />
                          <Bar dataKey="value" name="Cantidad" radius={[0, 6, 6, 0]}>
                            {top10Tipificaciones.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </GlassCard>
              )}

              {/* Donut Equivalencias */}
              {equivalenciasDonut.length > 0 && (
                <GlassCard>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                        <Activity className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold">Distribución por Equivalencia</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">Clasificación de contactos por resultado</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={equivalenciasDonut} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2}>
                            {equivalenciasDonut.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <RechartsTooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-1.5 mt-3">
                      {equivalenciasDonut.map((entry, i) => (
                        <div key={entry.name} className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="text-slate-600">{entry.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold font-mono text-slate-800">{entry.value.toLocaleString()}</span>
                            <span className="text-muted-foreground">{totalEquiv > 0 ? ((entry.value / totalEquiv) * 100).toFixed(1) : 0}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </GlassCard>
              )}
            </div>

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
                      <p className="text-xs text-muted-foreground mt-0.5">Resumen de chats entrantes y salientes</p>
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
                      <p className="text-xs text-muted-foreground mt-0.5">Tasas, productividad y tiempos</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <MetricRow label="Tasa respuesta inbound" value={`${stats.tasa_respuesta_inbound.toFixed(1)}%`} color={COLORS.orange} />
                  <MetricRow label="Tasa respuesta outbound" value={`${stats.tasa_respuesta_outbound.toFixed(1)}%`} color={COLORS.warning} />
                  <MetricRow label="Productividad entrante" value={stats.productividad_entrante.toFixed(2)} color={COLORS.purple} />
                  <MetricRow label="Productividad saliente" value={stats.productividad_saliente.toFixed(2)} color={COLORS.accent} />
                  <MetricRow label="FRT promedio" value={formatMinutes(stats.frt_minutos)} color={COLORS.info} />
                  <MetricRow label="Tasa efectividad" value={`${tasaEfectividad}%`} color={COLORS.accent} />
                  <MetricRow label="Tasa conversión" value={`${tasaConversion}%`} color={COLORS.purple} />
                  <MetricRow label="% Sin gestionar" value={`${pctSinGestionar}%`} color={COLORS.danger} />
                  <MetricRow label="Ratio msg/chat" value={ratioMsgChat} color={COLORS.orange} />
                  <MetricRow label="Chats por agente" value={ratioChatsAgente.toLocaleString()} color={COLORS.info} />
                </CardContent>
              </GlassCard>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
