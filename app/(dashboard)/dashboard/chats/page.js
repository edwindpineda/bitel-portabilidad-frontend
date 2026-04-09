'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  MessageCircle,
  MessageSquare,
  ArrowDownLeft,
  ArrowUpRight,
  Bot,
  UserRound,
  RefreshCw,
  Loader2,
  TrendingUp,
  BarChart3,
  CalendarDays,
  Percent,
  Hash
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

// ─── Colors ───
const COLORS = {
  accent: '#06d6a0',
  info: '#38bdf8',
  warning: '#fbbf24',
  danger: '#ef4444',
  purple: '#a78bfa',
  orange: '#fb923c',
  emerald: '#10b981',
  sky: '#0ea5e9'
};

const PIE_COLORS = ['#06d6a0', '#38bdf8', '#a78bfa', '#fbbf24', '#ef4444', '#fb923c', '#ec4899'];

const RANGOS = [
  { label: 'Hoy', value: 'hoy' },
  { label: 'Últimos 7 días', value: '7d' },
  { label: 'Últimos 30 días', value: '30d' },
  { label: 'Todo', value: 'todo' },
];

function getRangoFechas(rango) {
  const hoy = new Date();
  const formatDate = (d) => d.toISOString().slice(0, 10);
  const fin = formatDate(hoy);

  if (rango === 'hoy') return { fecha_inicio: fin, fecha_fin: fin };
  if (rango === '7d') {
    const inicio = new Date(hoy);
    inicio.setDate(inicio.getDate() - 6);
    return { fecha_inicio: formatDate(inicio), fecha_fin: fin };
  }
  if (rango === '30d') {
    const inicio = new Date(hoy);
    inicio.setDate(inicio.getDate() - 29);
    return { fecha_inicio: formatDate(inicio), fecha_fin: fin };
  }
  return { fecha_inicio: '', fecha_fin: '' };
}

function formatFechaCorta(fecha) {
  if (!fecha) return '';
  const d = new Date(fecha);
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
}

// ═══════════════════════════════════════
export default function IndicadoresChatPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [idEmpresa, setIdEmpresa] = useState('');
  const [rangoActivo, setRangoActivo] = useState('todo');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [empresaInicializada, setEmpresaInicializada] = useState(false);

  useEffect(() => {
    const empresaGuardada =
      localStorage.getItem('id_empresa') ||
      localStorage.getItem('empresa') ||
      '';
    if (empresaGuardada) setIdEmpresa(String(empresaGuardada));
    setEmpresaInicializada(true);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (idEmpresa) params.empresa = idEmpresa;
      if (fechaInicio) params.fecha_inicio = fechaInicio;
      if (fechaFin) params.fecha_fin = fechaFin;

      const res = await apiClient.get('/crm/chat-indicadores', { params });
      const payload = res?.data?.data || res?.data || res;

      // Normalizar tipos de mensaje en frontend
      if (payload?.mensajesPorTipo) {
        const TIPO_MAP = { text: 'Texto', texto: 'Texto', image: 'Imagen', audio: 'Audio', video: 'Video', document: 'Documento', sticker: 'Sticker', location: 'Ubicación', contacts: 'Contacto' };
        const merged = {};
        payload.mensajesPorTipo.forEach(({ name, value }) => {
          const key = TIPO_MAP[name?.toLowerCase()] || TIPO_MAP[name];
          if (!key) return; // excluir unsupported y desconocidos
          merged[key] = (merged[key] || 0) + value;
        });
        payload.mensajesPorTipo = Object.entries(merged)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);
      }

      setData(payload);
    } catch (err) {
      console.error('Error cargando indicadores de chat:', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!empresaInicializada) return;
    loadData();
  }, [empresaInicializada, idEmpresa, fechaInicio, fechaFin]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <Loader2 className="animate-spin h-10 w-10 text-emerald-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-[500px] text-sm text-gray-500">
        No se pudieron cargar los indicadores de chat
      </div>
    );
  }

  const kpis = [
    {
      label: 'Conversaciones creadas',
      value: data.totalChats || 0,
      icon: MessageCircle,
      color: COLORS.accent,
      bgDim: 'rgba(6,214,160,0.12)',
    },
    {
      label: 'Msgs recibidos (clientes)',
      value: data.entrantes || 0,
      icon: ArrowDownLeft,
      color: COLORS.emerald,
      bgDim: 'rgba(16,185,129,0.12)',
    },
    {
      label: 'Msgs enviados (bot)',
      value: data.salientes || 0,
      icon: ArrowUpRight,
      color: COLORS.purple,
      bgDim: 'rgba(167,139,250,0.12)',
    },
    {
      label: 'Clientes respondieron',
      value: `${data.tasaRespuesta || 0}%`,
      icon: Percent,
      color: COLORS.orange,
      bgDim: 'rgba(251,146,60,0.12)',
    },
  ];

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            <span className="text-muted-foreground">Indicadores</span>
            <span className="mx-1">/</span>
            <span className="text-foreground font-medium">Chat</span>
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Indicadores de Chat</h1>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {RANGOS.map((r) => (
            <Button
              key={r.value}
              variant={rangoActivo === r.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setRangoActivo(r.value);
                const { fecha_inicio, fecha_fin } = getRangoFechas(r.value);
                setFechaInicio(fecha_inicio);
                setFechaFin(fecha_fin);
              }}
            >
              {r.label}
            </Button>
          ))}
          <span className="text-xs text-muted-foreground mx-1">|</span>
          <input
            type="date"
            className="border rounded-lg px-3 py-2 text-sm"
            value={fechaInicio}
            onChange={(e) => { setFechaInicio(e.target.value); setRangoActivo(''); }}
          />
          <input
            type="date"
            className="border rounded-lg px-3 py-2 text-sm"
            value={fechaFin}
            onChange={(e) => { setFechaFin(e.target.value); setRangoActivo(''); }}
          />
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-1" /> Actualizar
          </Button>
        </div>
      </div>

      {/* ─── KPIs ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center h-10 w-10 rounded-xl"
                    style={{ background: kpi.bgDim }}
                  >
                    <Icon className="h-5 w-5" style={{ color: kpi.color }} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                      {kpi.label}
                    </p>
                    <p className="text-2xl font-bold" style={{ color: kpi.color }}>
                      {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ─── Row 1: Mensajes por Día + Dirección Pie ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Mensajes por día */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-emerald-500" />
              Mensajes por Día
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {fechaInicio && fechaFin
                ? `${formatFechaCorta(fechaInicio)} — ${formatFechaCorta(fechaFin)}`
                : 'Todo el período'}
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.daily || []}>
                  <defs>
                    <linearGradient id="colorEntrantes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.emerald} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.emerald} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorSalientes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.purple} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.purple} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={formatFechaCorta} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <RechartsTooltip labelFormatter={formatFechaCorta} />
                  <Area type="monotone" dataKey="entrantes" stroke={COLORS.emerald} fillOpacity={1} fill="url(#colorEntrantes)" name="Entrantes" />
                  <Area type="monotone" dataKey="salientes" stroke={COLORS.purple} fillOpacity={1} fill="url(#colorSalientes)" name="Salientes" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Dirección Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-sky-500" />
              Dirección de Mensajes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Entrantes', value: data.entrantes || 0 },
                      { name: 'Salientes', value: data.salientes || 0 }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell fill={COLORS.emerald} />
                    <Cell fill={COLORS.purple} />
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Row 2: Detalle por Día (tabla) + Tipo Mensaje ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Detalle por día */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-amber-500" />
              Detalle por Día
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {fechaInicio && fechaFin
                ? `${formatFechaCorta(fechaInicio)} — ${formatFechaCorta(fechaFin)}`
                : 'Todo el período'}
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-y-auto max-h-[280px] rounded-lg border border-slate-100">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50/95 backdrop-blur">
                  <tr>
                    <th className="text-left py-2.5 px-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Fecha</th>
                    <th className="text-center py-2.5 px-3 font-semibold text-xs uppercase tracking-wider" style={{ color: COLORS.emerald }}>
                      <span className="inline-flex items-center gap-1"><ArrowDownLeft className="h-3 w-3" /> Recibidos</span>
                    </th>
                    <th className="text-center py-2.5 px-3 font-semibold text-xs uppercase tracking-wider" style={{ color: COLORS.purple }}>
                      <span className="inline-flex items-center gap-1"><ArrowUpRight className="h-3 w-3" /> Enviados</span>
                    </th>
                    <th className="text-center py-2.5 px-3 font-semibold text-xs uppercase tracking-wider text-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.daily || []).slice().reverse().map((row, i) => (
                    <tr key={row.day} className={`border-t border-slate-100 hover:bg-slate-50/50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                      <td className="py-2.5 px-3 font-medium">{formatFechaCorta(row.day)}</td>
                      <td className="py-2.5 px-3 text-center tabular-nums" style={{ color: COLORS.emerald }}>{row.entrantes}</td>
                      <td className="py-2.5 px-3 text-center tabular-nums" style={{ color: COLORS.purple }}>{row.salientes}</td>
                      <td className="py-2.5 px-3 text-center font-bold tabular-nums">{row.total}</td>
                    </tr>
                  ))}
                </tbody>
                {(data.daily || []).length > 0 && (
                  <tfoot className="sticky bottom-0 bg-slate-100/95 backdrop-blur">
                    <tr className="font-bold border-t-2 border-slate-200">
                      <td className="py-2.5 px-3 text-xs uppercase tracking-wider">Total</td>
                      <td className="py-2.5 px-3 text-center tabular-nums" style={{ color: COLORS.emerald }}>{data.entrantes}</td>
                      <td className="py-2.5 px-3 text-center tabular-nums" style={{ color: COLORS.purple }}>{data.salientes}</td>
                      <td className="py-2.5 px-3 text-center tabular-nums">{data.totalMensajes}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Tipo de mensaje */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-violet-500" />
              Tipo de Mensaje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 h-[280px]">
              <div className="flex-1 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.mensajesPorTipo || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="value"
                      label={false}
                    >
                      {(data.mensajesPorTipo || []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 min-w-[120px]">
                {(data.mensajesPorTipo || []).map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                    <div className="text-sm">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-muted-foreground ml-1">({item.value})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── Row 3: Rendimiento Semanal + Resumen ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-blue-500" />
              Mensajes por Día de la Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.weekly || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <RechartsTooltip />
                  <Bar dataKey="entrantes" stackId="a" fill={COLORS.emerald} name="Entrantes" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="salientes" stackId="a" fill={COLORS.purple} name="Salientes" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Resumen rápido */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Resumen del Período
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {[
              { label: 'Mensajes enviados + recibidos', value: data.totalMensajes || 0, color: COLORS.info, desc: 'Total de mensajes en el período' },
              { label: 'Mensajes recibidos (cliente)', value: data.entrantes || 0, color: COLORS.emerald, desc: 'Mensajes que enviaron los clientes' },
              { label: 'Mensajes enviados (bot/agente)', value: data.salientes || 0, color: COLORS.purple, desc: 'Respuestas del bot o agente' },
              { label: 'Conversaciones activas', value: data.chatsConMensajes || 0, color: COLORS.warning, desc: 'Chats que tuvieron al menos 1 mensaje' },
              { label: 'Clientes que respondieron', value: `${data.tasaRespuesta || 0}%`, color: COLORS.orange, desc: 'Chats donde el cliente respondió al bot' },
              { label: 'Promedio de mensajes por chat', value: data.promedioMsgPorChat || 0, color: COLORS.sky, desc: 'Mensajes promedio en cada conversación' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                <div>
                  <span className="text-sm text-foreground font-medium">{item.label}</span>
                  <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                </div>
                <span className="text-lg font-bold ml-3 whitespace-nowrap" style={{ color: item.color }}>
                  {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ─── Row 4: Top horas pico (barras horizontales) ─── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-rose-500" />
            Top 6 Horas con Mayor Actividad
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Acumulado {fechaInicio && fechaFin
              ? `del ${formatFechaCorta(fechaInicio)} al ${formatFechaCorta(fechaFin)}`
              : 'de todo el período'}
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(data.hourly || [])
              .sort((a, b) => b.total - a.total)
              .slice(0, 6)
              .map((h) => {
                const maxTotal = Math.max(...(data.hourly || []).map(x => x.total), 1);
                const pctEntrantes = h.total > 0 ? (h.entrantes / h.total) * 100 : 0;
                const pctSalientes = h.total > 0 ? (h.salientes / h.total) * 100 : 0;
                return (
                  <div key={h.hour}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium w-14">{h.hour}</span>
                      <span className="text-xs text-muted-foreground">
                        {h.entrantes} entrantes · {h.salientes} salientes · <strong>{h.total} total</strong>
                      </span>
                    </div>
                    <div className="h-5 rounded-full overflow-hidden bg-slate-100 flex">
                      <div
                        className="h-full rounded-l-full transition-all"
                        style={{
                          width: `${(h.entrantes / maxTotal) * 100}%`,
                          backgroundColor: COLORS.emerald
                        }}
                      />
                      <div
                        className="h-full rounded-r-full transition-all"
                        style={{
                          width: `${(h.salientes / maxTotal) * 100}%`,
                          backgroundColor: COLORS.purple
                        }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.emerald }} />
              Entrantes
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.purple }} />
              Salientes
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
