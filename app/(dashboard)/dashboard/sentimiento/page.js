'use client';

import { useState, useEffect } from 'react';
import { analisisService } from '@/lib/analisisService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Brain, MessageSquare, SmilePlus, HelpCircle,
  TrendingUp, TrendingDown, Minus, Loader2, RefreshCw, Phone,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  AreaChart, Area, LineChart, Line,
} from 'recharts';

const TABS = [
  { id: 'conversacion', label: 'Conversacion', icon: MessageSquare },
  { id: 'sentimiento', label: 'Sentimiento', icon: SmilePlus },
  { id: 'preguntas', label: 'Preguntas frecuentes', icon: HelpCircle },
];

const SENTIMENT_COLORS = { Positivo: '#10b981', Negativo: '#f43f5e', Neutro: '#94a3b8' };

function StatCard({ icon: Icon, label, value, color, bgFrom }) {
  return (
    <Card className="border-0 shadow-sm" style={{ background: `linear-gradient(135deg, ${bgFrom} 0%, white 100%)` }}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: color + '20' }}>
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ToggleCard({ title, icon: Icon, iconColor, children, evoChildren }) {
  const [view, setView] = useState('static');
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Icon className="h-4 w-4" style={{ color: iconColor }} />
            {title}
          </CardTitle>
          {evoChildren && (
            <div className="flex gap-1">
              <Button size="sm" variant={view === 'static' ? 'default' : 'outline'} className="h-7 text-xs px-2" onClick={() => setView('static')}>Actual</Button>
              <Button size="sm" variant={view === 'evolution' ? 'default' : 'outline'} className="h-7 text-xs px-2" onClick={() => setView('evolution')}>Evolucion</Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {view === 'static' ? children : evoChildren}
      </CardContent>
    </Card>
  );
}

function WordCloud({ palabras }) {
  if (!palabras || palabras.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>;
  const maxSize = Math.max(...palabras.map(p => p.size));
  return (
    <div className="flex flex-wrap gap-2 justify-center py-4">
      {palabras.map((p, i) => {
        const scale = 0.75 + (p.size / maxSize) * 1.0;
        return (
          <span
            key={i}
            className="bg-violet-100 text-violet-700 rounded-full px-3 py-1 font-medium cursor-default hover:bg-violet-200 transition-colors"
            style={{ fontSize: `${scale}rem` }}
            title={`${p.text}: ${p.size}`}
          >
            {p.text}
          </span>
        );
      })}
    </div>
  );
}

export default function SpeechAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('conversacion');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await analisisService.getDashboard();
      setData(res.data);
    } catch (err) {
      console.error('Error cargando speech analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const convPorHora = data?.convPorHora || [];
  const fcr = data?.fcr || { donut: [], porcentaje: 0, total: 0 };
  const evoFcr = data?.evoFcr || [];
  const sentimiento = data?.sentimiento || { donut: [], totales: {} };
  const evoSentimiento = data?.evoSentimiento || [];
  const emociones = data?.emociones || [];
  const evoEmociones = data?.evoEmociones || [];
  const preguntas = data?.preguntas || [];
  const temas = data?.temas || [];
  const palabras = data?.palabras || [];

  // Promedio convs por hora
  const totalConvs = convPorHora.reduce((a, c) => a + c.value, 0);
  const horasActivas = convPorHora.filter(c => c.value > 0).length;
  const promedioConvHora = horasActivas > 0 ? (totalConvs / horasActivas).toFixed(1) : '0';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analisis de Voz</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Analisis de voz y conversaciones</p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                isActive ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ==================== TAB: Conversacion ==================== */}
      {activeTab === 'conversacion' && (
        <div className="space-y-5">
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard icon={Phone} label="Llamadas por hora (promedio)" value={promedioConvHora} color="#6366f1" bgFrom="#eef2ff" />
            <StatCard icon={TrendingUp} label="FCR (First Call Resolution)" value={`${fcr.porcentaje}%`} color="#10b981" bgFrom="#ecfdf5" />
          </div>

          {/* Conversaciones por hora */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Phone className="h-4 w-4 text-indigo-500" />
                Llamadas por hora del dia
              </CardTitle>
            </CardHeader>
            <CardContent>
              {convPorHora.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={convPorHora}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hora" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} name="Llamadas" />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* FCR Donut */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">FCR (First Call Resolution)</CardTitle>
              </CardHeader>
              <CardContent>
                {fcr.total > 0 ? (
                  <div className="relative">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={fcr.donut} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                          {fcr.donut.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <RechartsTooltip formatter={(v) => [`${v}%`]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold">{fcr.porcentaje}%</span>
                    </div>
                  </div>
                ) : <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>}
                <div className="flex justify-center gap-4 mt-2">
                  {fcr.donut.map((d, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                      <span>{d.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Evolución FCR */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Evolucion FCR</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={evoFcr}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} />
                    <RechartsTooltip formatter={(v) => [`${v}%`]} />
                    <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} name="FCR %" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ==================== TAB: Sentimiento ==================== */}
      {activeTab === 'sentimiento' && (
        <div className="space-y-5">
          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard icon={TrendingUp} label="Positivo" value={`${sentimiento.donut.find(d => d.name === 'Positivo')?.value || 0}%`} color="#10b981" bgFrom="#ecfdf5" />
            <StatCard icon={TrendingDown} label="Negativo" value={`${sentimiento.donut.find(d => d.name === 'Negativo')?.value || 0}%`} color="#f43f5e" bgFrom="#fef2f2" />
            <StatCard icon={Minus} label="Neutro" value={`${sentimiento.donut.find(d => d.name === 'Neutro')?.value || 0}%`} color="#94a3b8" bgFrom="#f8fafc" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Sentimiento toggle */}
            <ToggleCard title="Tipos de sentimiento" icon={Brain} iconColor="#6366f1"
              evoChildren={
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={evoSentimiento}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis />
                    <RechartsTooltip />
                    <Area type="monotone" dataKey="Positivo" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                    <Area type="monotone" dataKey="Neutro" stackId="1" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.4} />
                    <Area type="monotone" dataKey="Negativo" stackId="1" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.4} />
                  </AreaChart>
                </ResponsiveContainer>
              }
            >
              {sentimiento.donut.some(d => d.value > 0) ? (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={sentimiento.donut} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                        {sentimiento.donut.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <RechartsTooltip formatter={(v) => [`${v}%`]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 mt-1">
                    {sentimiento.donut.map((d, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                        <span>{d.name}: {d.value}%</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>}
            </ToggleCard>

            {/* Emociones toggle */}
            <ToggleCard title="Tipos de emociones" icon={SmilePlus} iconColor="#f43f5e"
              evoChildren={
                evoEmociones.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={evoEmociones}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <RechartsTooltip />
                      {emociones.slice(0, 6).map((e, i) => (
                        <Area key={i} type="monotone" dataKey={e.name} stackId="1" stroke={e.color} fill={e.color} fillOpacity={0.4} />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
              }
            >
              {emociones.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={emociones.slice(0, 6)} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                        {emociones.slice(0, 6).map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-3 mt-1">
                    {emociones.slice(0, 6).map((e, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: e.color }} />
                        <span>{e.name}: {e.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>}
            </ToggleCard>
          </div>
        </div>
      )}

      {/* ==================== TAB: Preguntas frecuentes ==================== */}
      {activeTab === 'preguntas' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Preguntas */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-amber-500" />
                  Preguntas frecuentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {preguntas.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={preguntas} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="pregunta" width={180} tick={{ fontSize: 11 }} />
                      <RechartsTooltip />
                      <Bar dataKey="value" fill="#f59e0b" radius={[0, 6, 6, 0]} name="Frecuencia" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground text-center py-8">Sin preguntas detectadas</p>}
              </CardContent>
            </Card>

            {/* Temas */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-emerald-500" />
                  Temas frecuentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {temas.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={temas} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" />
                      <YAxis type="category" dataKey="tema" width={150} tick={{ fontSize: 11 }} />
                      <RechartsTooltip />
                      <Bar dataKey="value" fill="#10b981" radius={[0, 6, 6, 0]} name="Frecuencia" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground text-center py-8">Sin temas detectados</p>}
              </CardContent>
            </Card>
          </div>

          {/* Palabras clave - Word Cloud */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="h-4 w-4 text-violet-500" />
                Palabras frecuentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WordCloud palabras={palabras} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
