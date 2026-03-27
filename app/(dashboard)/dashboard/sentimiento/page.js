'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { analisisService } from '@/lib/analisisService';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  AreaChart, Area,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  SmilePlus, BarChart3, Filter,
  MessageSquare, Headphones,
  TrendingDown, ArrowUpRight, Sparkles,
  MessagesSquare, HelpCircle, Brain,
  Loader2,
} from 'lucide-react';

const WORD_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e'];

// ============================
// Animated counter hook
// ============================
function useAnimatedValue(target, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const num = typeof target === 'string' ? parseFloat(target.replace(/[^0-9.]/g, '')) : target;
    if (isNaN(num)) return;
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

// ============================
// Stat Card
// ============================
function StatCard({ config, index }) {
  const Icon = config.icon;
  const numericValue = String(config.value).replace(/[^0-9.]/g, '');
  const animated = useAnimatedValue(numericValue);
  const isPercent = String(config.value).includes('%');
  const displayVal = isPercent ? `${animated}%` : animated.toLocaleString();

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-white/60 bg-white p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="absolute top-0 left-0 right-0 h-1 opacity-80" style={{ background: `linear-gradient(90deg, ${config.from}, ${config.to})` }} />
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl" style={{ background: config.from }} />
      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{config.label}</p>
          <p className="text-3xl font-bold tracking-tight">{displayVal}</p>
        </div>
        <div className="h-11 w-11 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300" style={{ background: `linear-gradient(135deg, ${config.from}, ${config.to})` }}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

// ============================
// Glass Card
// ============================
function GlassCard({ children, className = '' }) {
  return (
    <Card className={`relative overflow-hidden border-white/60 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-shadow duration-300 ${className}`}>
      {children}
    </Card>
  );
}

// ============================
// Separator
// ============================
function Separator({ label }) {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200/60" /></div>
      <div className="relative flex justify-center">
        <span className="bg-[#f5f3ff] px-4 text-xs text-muted-foreground uppercase tracking-widest">{label}</span>
      </div>
    </div>
  );
}

// ============================
// Chart helpers
// ============================
const customTooltipStyle = { borderRadius: '12px', border: 'none', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)', fontSize: '13px', padding: '10px 14px' };

function DonutChart({ data, centerLabel, size = 200 }) {
  return (
    <div className="flex items-center justify-center gap-6 py-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={size * 0.32} outerRadius={size * 0.48} paddingAngle={2} dataKey="value" strokeWidth={0} animationDuration={1200}>
              {data.map((entry, index) => <Cell key={index} fill={entry.color} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {centerLabel && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold bg-gradient-to-br from-indigo-600 to-violet-500 bg-clip-text text-transparent">{centerLabel}</span>
          </div>
        )}
      </div>
      <div className="space-y-3">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-3 group">
            <div className="w-3 h-3 rounded-full shrink-0 ring-2 ring-offset-2 ring-transparent group-hover:ring-current transition-all duration-200" style={{ backgroundColor: item.color, color: item.color }} />
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{item.name}</span>
            <span className="text-sm font-bold ml-auto tabular-nums">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EvolutionAreaChart({ data, keys, colors }) {
  return (
    <div className="py-4">
      <div className="flex items-center gap-4 justify-center mb-4 flex-wrap">
        {keys.map((key, i) => (
          <div key={key} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i] }} />
            <span className="text-sm text-muted-foreground">{key}</span>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#64748b' }} stroke="#cbd5e1" axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#64748b' }} stroke="#cbd5e1" axisLine={false} tickLine={false} width={45} />
          <RechartsTooltip contentStyle={customTooltipStyle} />
          {keys.map((key, i) => (
            <Area key={key} type="monotone" dataKey={key} stroke={colors[i]} strokeWidth={2} fill={colors[i]} fillOpacity={0.06} animationDuration={1500} dot={false} activeDot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Word Cloud
function WordCloud({ words }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(t);
  }, []);

  if (!words || words.length === 0) return <p className="text-center text-muted-foreground py-8">Sin datos</p>;

  const maxSize = Math.max(...words.map((w) => w.size));
  const minFontSize = 14;
  const maxFontSize = 64;

  const positions = words.map((_, i) => {
    const total = words.length;
    const angle = i * 2.4;
    const radius = 12 + (i / total) * 32;
    const x = 50 + Math.cos(angle) * radius;
    const y = 50 + Math.sin(angle) * radius;
    return { x: Math.max(8, Math.min(92, x)), y: Math.max(10, Math.min(90, y)) };
  });

  const floatKeyframes = ['wordFloat1', 'wordFloat2', 'wordFloat3', 'wordFloat4'];

  return (
    <div className="relative overflow-hidden select-none" style={{ height: '300px' }}>
      <style>{`
        @keyframes wordFloat1 { 0%,100% { transform: translate(-50%,-50%) translateY(0px); } 50% { transform: translate(-50%,-50%) translateY(-6px); } }
        @keyframes wordFloat2 { 0%,100% { transform: translate(-50%,-50%) translateX(0px); } 50% { transform: translate(-50%,-50%) translateX(5px); } }
        @keyframes wordFloat3 { 0%,100% { transform: translate(-50%,-50%) translate(0px,0px); } 50% { transform: translate(-50%,-50%) translate(-4px,-5px); } }
        @keyframes wordFloat4 { 0%,100% { transform: translate(-50%,-50%) translate(0px,0px); } 50% { transform: translate(-50%,-50%) translate(4px,3px); } }
      `}</style>
      {words.map((word, i) => {
        const pos = positions[i];
        const sizeRatio = word.size / maxSize;
        const fontSize = minFontSize + sizeRatio * (maxFontSize - minFontSize);
        const baseOpacity = 0.35 + sizeRatio * 0.65;
        const isHovered = hoveredIdx === i;
        const somethingHovered = hoveredIdx !== null;
        const float = floatKeyframes[i % floatKeyframes.length];
        const animDuration = 4 + (i % 5) * 1.2;
        const enterDelay = i * 60;

        return (
          <span
            key={`${word.text}-${i}`}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            className="absolute cursor-default transition-all duration-500 ease-out"
            style={{
              left: `${pos.x}%`, top: `${pos.y}%`,
              fontSize: `${fontSize}px`,
              color: WORD_COLORS[i % WORD_COLORS.length],
              fontWeight: fontSize > 35 ? 700 : fontSize > 25 ? 600 : 400,
              lineHeight: 1, whiteSpace: 'nowrap',
              opacity: ready ? (isHovered ? 1 : somethingHovered ? baseOpacity * 0.4 : baseOpacity) : 0,
              filter: isHovered ? 'brightness(1.15)' : 'none',
              transform: ready ? `translate(-50%, -50%) scale(${isHovered ? 1.18 : 1})` : 'translate(-50%, -50%) scale(0.6)',
              transitionDelay: ready ? '0ms' : `${enterDelay}ms`,
              animation: ready ? `${float} ${animDuration}s ease-in-out infinite` : 'none',
              animationDelay: `${(i * 0.7) % animDuration}s`,
              zIndex: isHovered ? 10 : 1,
            }}
          >
            {word.text}
            {isHovered && (
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-slate-500 whitespace-nowrap bg-white/90 rounded-md px-1.5 py-0.5 shadow-sm border border-slate-100">
                {word.size} menciones
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

// Toggle Card
function ChartCardHeader({ title, icon1: Icon1, icon2: Icon2, view, onToggle }) {
  return (
    <div className="flex items-center justify-between px-6 pt-5 pb-2">
      <h3 className="text-sm font-semibold text-foreground/80">{title}</h3>
      <div className="flex items-center gap-2">
        {Icon1 && (
          <button onClick={() => onToggle('static')} className={`p-2 rounded-lg transition-all duration-200 ${view === 'static' ? 'bg-indigo-50 text-[#3DD9C3] shadow-sm' : 'hover:bg-gray-50 text-gray-400'}`}>
            <Icon1 className="h-4 w-4" />
          </button>
        )}
        {Icon2 && (
          <button onClick={() => onToggle('evolution')} className={`p-2 rounded-lg transition-all duration-200 ${view === 'evolution' ? 'bg-indigo-50 text-[#3DD9C3] shadow-sm' : 'hover:bg-gray-50 text-gray-400'}`}>
            <Icon2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function ToggleCard({ title, evolutionTitle, icon1, icon2, staticContent, evolutionContent }) {
  const [localView, setLocalView] = useState('static');
  return (
    <GlassCard>
      <ChartCardHeader title={localView === 'evolution' ? (evolutionTitle || 'Evolucion') : title} icon1={icon1} icon2={icon2} view={localView} onToggle={setLocalView} />
      <CardContent className="pt-0">{localView === 'static' ? staticContent : evolutionContent}</CardContent>
    </GlassCard>
  );
}

// ============================
// TAB: Conversacion
// ============================
function ConversacionTab({ data }) {
  const convPorHora = data?.convPorHora || [];
  const promedioLlamadasHora = convPorHora.length > 0
    ? Math.round(convPorHora.reduce((sum, h) => sum + h.value, 0) / convPorHora.length * 10) / 10
    : 0;

  const KPI_CONVERSACION = [
    { from: '#6366f1', to: '#8b5cf6', icon: MessageSquare, label: 'Llamadas por hora (prom.)', value: `${promedioLlamadasHora}` },
    { from: '#f59e0b', to: '#f97316', icon: Headphones, label: 'FCR', value: `${data?.fcr?.porcentaje || 0}%` },
  ];

  return (
    <div className="space-y-7">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {KPI_CONVERSACION.map((card, i) => <StatCard key={card.label} config={card} index={i} />)}
      </div>
      <Separator label="Analisis de conversacion" />
      <GlassCard>
        <div className="px-6 pt-5 pb-2"><h3 className="text-sm font-semibold text-foreground/80">Llamadas por hora del dia</h3></div>
        <CardContent className="pt-0">
          {convPorHora.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={convPorHora} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="hora" tick={{ fontSize: 12, fill: '#64748b' }} stroke="#cbd5e1" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} stroke="#cbd5e1" axisLine={false} tickLine={false} width={45} allowDecimals={false} />
                <RechartsTooltip contentStyle={customTooltipStyle} />
                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={28} name="Llamadas" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-muted-foreground py-8">Sin datos de llamadas</p>}
        </CardContent>
      </GlassCard>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <div className="px-6 pt-5 pb-2"><h3 className="text-sm font-semibold text-foreground/80">FCR (First Call Resolution)</h3></div>
          <CardContent className="pt-0">
            <DonutChart data={data?.fcr?.donut || []} centerLabel={`${data?.fcr?.porcentaje || 0}%`} size={220} />
          </CardContent>
        </GlassCard>
        <GlassCard>
          <div className="px-6 pt-5 pb-2"><h3 className="text-sm font-semibold text-foreground/80">Evolucion FCR</h3></div>
          <CardContent className="pt-0 py-4">
            {data?.evoFcr?.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.evoFcr} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#64748b' }} stroke="#cbd5e1" axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} stroke="#cbd5e1" axisLine={false} tickLine={false} width={45} domain={[0, 100]} />
                  <RechartsTooltip contentStyle={customTooltipStyle} formatter={(val) => `${val}%`} />
                  <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4, fill: '#fff', stroke: '#6366f1', strokeWidth: 2 }} activeDot={{ r: 6 }} name="FCR %" />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-8">Sin datos de evolucion</p>}
          </CardContent>
        </GlassCard>
      </div>
    </div>
  );
}

// ============================
// TAB: Sentimiento
// ============================
function SentimientoTab({ data }) {
  const sentData = data?.sentimiento;
  const positivoPct = sentData?.donut?.find(d => d.name === 'Positivo')?.value || 0;
  const negativoPct = sentData?.donut?.find(d => d.name === 'Negativo')?.value || 0;
  const neutroPct = sentData?.donut?.find(d => d.name === 'Neutro')?.value || 0;

  const KPI_SENTIMIENTO = [
    { from: '#10b981', to: '#059669', icon: SmilePlus, label: 'Positivo', value: `${Math.round(positivoPct)}%` },
    { from: '#f43f5e', to: '#e11d48', icon: TrendingDown, label: 'Negativo', value: `${Math.round(negativoPct)}%` },
    { from: '#94a3b8', to: '#64748b', icon: Brain, label: 'Neutro', value: `${Math.round(neutroPct)}%` },
  ];

  const emociones = data?.emociones || [];
  const emocionesTotal = emociones.reduce((a, b) => a + b.value, 0) || 1;
  const emocionesDonut = emociones.slice(0, 6).map(e => ({ ...e, value: Math.round((e.value / emocionesTotal) * 100 * 100) / 100 }));
  const topEmocion = emocionesDonut[0];

  const evoEmociones = data?.evoEmociones || [];
  const emocionKeys = [...new Set(evoEmociones.flatMap(e => Object.keys(e).filter(k => k !== 'mes')))];
  const emocionColors = ['#dc2626', '#f43f5e', '#f97316', '#f59e0b', '#eab308', '#94a3b8', '#10b981', '#059669', '#6366f1', '#8b5cf6', '#06b6d4', '#14b8a6', '#64748b'];

  return (
    <div className="space-y-7">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {KPI_SENTIMIENTO.map((card, i) => <StatCard key={card.label} config={card} index={i} />)}
      </div>
      <Separator label="Analisis de sentimiento" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ToggleCard
          title="Tipos de sentimiento" evolutionTitle="Evolucion de los tipos de sentimiento"
          icon1={SmilePlus} icon2={BarChart3}
          staticContent={<DonutChart data={sentData?.donut || []} size={220} />}
          evolutionContent={<EvolutionAreaChart data={data?.evoSentimiento || []} keys={['Positivo', 'Negativo', 'Neutro']} colors={['#10b981', '#f43f5e', '#94a3b8']} />}
        />
        <ToggleCard
          title="Tipos de emociones" evolutionTitle="Evolucion de las emociones"
          icon1={SmilePlus} icon2={BarChart3}
          staticContent={<DonutChart data={emocionesDonut} centerLabel={topEmocion ? `${topEmocion.value}%` : ''} size={220} />}
          evolutionContent={<EvolutionAreaChart data={evoEmociones} keys={emocionKeys} colors={emocionColors.slice(0, emocionKeys.length)} />}
        />
      </div>
    </div>
  );
}

// ============================
// TAB: Preguntas frecuentes
// ============================
function PreguntasFrecuentesTab({ data }) {
  const preguntas = data?.preguntas || [];
  const temas = data?.temas || [];
  const palabras = data?.palabras || [];

  return (
    <div className="space-y-7">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <div className="px-6 pt-5 pb-2"><h3 className="text-sm font-semibold text-foreground/80">Preguntas frecuentes</h3></div>
          <CardContent className="pt-0">
            {preguntas.length > 0 ? (
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={preguntas} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} stroke="#cbd5e1" axisLine={false} tickLine={false} />
                  <YAxis dataKey="pregunta" type="category" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" width={220} axisLine={false} tickLine={false} />
                  <RechartsTooltip contentStyle={customTooltipStyle} />
                  <Bar dataKey="value" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={20} name="Frecuencia" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-8">Sin datos</p>}
          </CardContent>
        </GlassCard>
        <GlassCard>
          <div className="px-6 pt-5 pb-2"><h3 className="text-sm font-semibold text-foreground/80">Temas frecuentes</h3></div>
          <CardContent className="pt-0">
            {temas.length > 0 ? (
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={temas} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} stroke="#cbd5e1" axisLine={false} tickLine={false} />
                  <YAxis dataKey="tema" type="category" tick={{ fontSize: 11, fill: '#64748b' }} stroke="#cbd5e1" width={200} axisLine={false} tickLine={false} />
                  <RechartsTooltip contentStyle={customTooltipStyle} />
                  <Bar dataKey="value" fill="#06b6d4" radius={[0, 6, 6, 0]} barSize={20} name="Frecuencia" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-8">Sin datos</p>}
          </CardContent>
        </GlassCard>
      </div>
      <GlassCard>
        <div className="px-6 pt-5 pb-2"><h3 className="text-sm font-semibold text-foreground/80">Palabras frecuentes</h3></div>
        <CardContent className="pt-0"><WordCloud words={palabras} /></CardContent>
      </GlassCard>
    </div>
  );
}

// ============================
// TABS config
// ============================
const TABS = [
  { key: 'conversacion', label: 'Conversacion', icon: MessagesSquare },
  { key: 'sentimiento', label: 'Sentimiento', icon: SmilePlus },
  { key: 'preguntas', label: 'Preguntas frecuentes', icon: HelpCircle },
];

// ============================
// Pagina principal
// ============================
export default function AnalisisDeVozPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('conversacion');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) return;
    loadData();
  }, [session]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await analisisService.getDashboard();
      setData(response.data);
    } catch (error) {
      console.error('Error al cargar analisis de voz:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#3DD9C3]" />
      </div>
    );
  }

  return (
    <div className="min-h-full" style={{ background: 'linear-gradient(135deg, #f8f9fe 0%, #f1f5f9 50%, #f5f3ff 100%)' }}>
      <div className="space-y-7">
        <div className="text-sm text-muted-foreground">
          Dashboard <span className="mx-1.5 text-gray-300">/</span>
          <span className="text-foreground font-medium">Analisis de Voz</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#3DD9C3] to-[#2BB5A0] flex items-center justify-center shadow-lg shadow-[#3DD9C3]/25">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#3DD9C3]">Analisis de Voz</h1>
              <p className="text-xs text-muted-foreground">Analisis de conversaciones e inteligencia</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2 rounded-xl border-[#3DD9C3]/30 text-[#3DD9C3] hover:bg-[#3DD9C3]/10 hover:border-[#3DD9C3]/50 transition-all duration-200" onClick={loadData}>
            <Filter className="h-4 w-4" />
            Actualizar
          </Button>
        </div>

        <div className="border-b border-gray-200/60">
          <nav className="flex gap-0">
            {TABS.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`px-6 py-3 text-sm font-medium transition-all duration-200 relative flex items-center gap-2 ${activeTab === tab.key ? 'text-[#3DD9C3]' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <TabIcon className="h-4 w-4" />
                  {tab.label}
                  {activeTab === tab.key && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#3DD9C3] to-[#2BB5A0] rounded-full" />}
                </button>
              );
            })}
          </nav>
        </div>

        {activeTab === 'conversacion' && <ConversacionTab data={data} />}
        {activeTab === 'sentimiento' && <SentimientoTab data={data} />}
        {activeTab === 'preguntas' && <PreguntasFrecuentesTab data={data} />}
      </div>
    </div>
  );
}
