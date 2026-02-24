'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  UserCheck,
  Star,
  RefreshCw,
  X,
  Filter,
  Calendar,
  ArrowRight,
  Loader2,
  Phone,
  PhoneCall,
  PhoneOff,
  PhoneMissed,
  MessageSquare,
  Clock,
  Percent,
  UserCog,
  Headphones,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Zap,
  Target,
  ArrowDownRight,
  Megaphone,
  Play,
  FileText,
} from 'lucide-react';

const FUNNEL_COLORS = [
  { bg: 'from-blue-500 to-indigo-600', text: 'text-white', light: 'bg-blue-500/10', textColor: 'text-blue-600', border: 'border-blue-200', glow: 'rgba(59,130,246,0.2)' },
  { bg: 'from-emerald-500 to-green-600', text: 'text-white', light: 'bg-emerald-500/10', textColor: 'text-emerald-600', border: 'border-emerald-200', glow: 'rgba(16,185,129,0.2)' },
  { bg: 'from-amber-500 to-yellow-600', text: 'text-white', light: 'bg-amber-500/10', textColor: 'text-amber-600', border: 'border-amber-200', glow: 'rgba(234,179,8,0.2)' },
];

const DATE_RANGES = [
  { label: 'Todos', value: 'all' },
  { label: 'Hoy', value: 'today' },
  { label: 'Ultima semana', value: '7d' },
  { label: 'Ultimo mes', value: '1m' },
  { label: '3 meses', value: '3m' },
  { label: '6 meses', value: '6m' },
  { label: '12 meses', value: '12m' },
  { label: 'Personalizado', value: 'custom' },
];

export default function ReportesPage() {
  const [funnelData, setFunnelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [tipoReporte, setTipoReporte] = useState('mensajes');

  const getDateParams = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    let fromDate = null;
    let toDate = today;

    switch (dateRange) {
      case 'today':
        fromDate = today;
        break;
      case '7d': {
        const d = new Date(); d.setDate(d.getDate() - 7);
        fromDate = d.toISOString().split('T')[0];
        break;
      }
      case '1m': {
        const d = new Date(); d.setMonth(d.getMonth() - 1);
        fromDate = d.toISOString().split('T')[0];
        break;
      }
      case '3m': {
        const d = new Date(); d.setMonth(d.getMonth() - 3);
        fromDate = d.toISOString().split('T')[0];
        break;
      }
      case '6m': {
        const d = new Date(); d.setMonth(d.getMonth() - 6);
        fromDate = d.toISOString().split('T')[0];
        break;
      }
      case '12m': {
        const d = new Date(); d.setFullYear(d.getFullYear() - 1);
        fromDate = d.toISOString().split('T')[0];
        break;
      }
      case 'custom':
        fromDate = dateFrom || null;
        toDate = dateTo || today;
        break;
      default:
        return {};
    }

    const params = {};
    if (fromDate) params.dateFrom = fromDate;
    if (toDate) params.dateTo = toDate;
    return params;
  }, [dateRange, dateFrom, dateTo]);

  const loadFunnelData = useCallback(async () => {
    try {
      setLoading(true);
      const params = getDateParams();
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `/crm/reportes/funnel?${queryString}` : '/crm/reportes/funnel';
      const response = await apiClient.get(url);
      setFunnelData(response.data);
    } catch (error) {
      console.error('Error al cargar datos del embudo:', error);
    } finally {
      setLoading(false);
    }
  }, [getDateParams]);

  useEffect(() => {
    loadFunnelData();
  }, [loadFunnelData]);

  const handleDateRangeChange = (value) => {
    setDateRange(value);
    if (value !== 'custom') {
      setDateFrom('');
      setDateTo('');
    }
  };

  const clearFilters = () => {
    setDateRange('all');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = dateRange !== 'all';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-sm text-muted-foreground">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  const funnelStages = funnelData ? [
    funnelData.totalLeads,
    funnelData.contactados,
    funnelData.interesados
  ] : [];

  const maxValue = funnelStages.length > 0 ? funnelStages[0].valor : 0;

  const mockCampaigns = [
    { id: 1, nombre: 'Migracion', estado: 'En funcionamiento', update_at: '10-01-2025', reglas_activas: 1 }
  ];

  const mockActivas = [
    { id: 1, nombre: 'Migracion', agentes_activos: 5, agentes_libres: 10, llamando: 6, respuestas: 22, no_atendido: 12, fallidas: 1, dropped: 5, porcentaje: '20%' },
    { id: 2, nombre: 'Migracion', agentes_activos: 5, agentes_libres: 10, llamando: 6, respuestas: 22, no_atendido: 12, fallidas: 1, dropped: 5, porcentaje: '20%' },
    { id: 3, nombre: 'Migracion', agentes_activos: 5, agentes_libres: 10, llamando: 6, respuestas: 22, no_atendido: 12, fallidas: 1, dropped: 5, porcentaje: '20%' },
    { id: 4, nombre: 'Migracion', agentes_activos: 5, agentes_libres: 10, llamando: 6, respuestas: 22, no_atendido: 12, fallidas: 1, dropped: 5, porcentaje: '20%' },
  ];

  const mockLlamadas = [
    { id: 1, nombre: 'Migracion', telefono: '992994112', inicio: '00:00:10' },
    { id: 2, nombre: 'Migracion', telefono: '992114112', inicio: '00:00:11' },
  ];

  // Progress bars data for llamadas section
  const progressBars = [
    { label: 'Total llamadas', value: 100, percent: 80, gradient: 'from-emerald-500 to-emerald-600', icon: Phone },
    { label: 'Total no atendidas', value: 100, percent: 60, gradient: 'from-rose-500 to-rose-600', icon: PhoneOff },
    { label: 'Dropped', value: 100, percent: 45, gradient: 'from-orange-500 to-orange-600', icon: AlertTriangle },
    { label: 'Agentes disponibles', value: 100, percent: 70, gradient: 'from-teal-500 to-teal-600', icon: UserCheck },
    { label: 'Agentes hablando', value: 100, percent: 55, gradient: 'from-purple-500 to-purple-600', icon: Headphones },
    { label: 'Agentes en tipificación', value: 100, percent: 35, gradient: 'from-amber-500 to-amber-600', icon: FileText },
    { label: 'Agentes sin trabajar', value: 100, percent: 25, gradient: 'from-slate-500 to-slate-600', icon: UserCog },
  ];

  const statCardsLeft = [
    { value: '00:00:30', label: 'Avg Ready Time', gradient: 'from-blue-500 to-indigo-500', glow: 'rgba(59,130,246,0.15)' },
    { value: '00:00:30', label: 'Avg Talk Time', gradient: 'from-emerald-500 to-teal-500', glow: 'rgba(16,185,129,0.15)' },
    { value: '20%', label: '% atendidas', gradient: 'from-teal-500 to-cyan-500', glow: 'rgba(20,184,166,0.15)' },
    { value: '21', label: 'Agentes conectados', gradient: 'from-indigo-500 to-violet-500', glow: 'rgba(99,102,241,0.15)' },
  ];

  const statCardsRight = [
    { value: '00:00:30', label: 'Medio tiempo llamado', gradient: 'from-purple-500 to-violet-500', glow: 'rgba(168,85,247,0.15)' },
    { value: '00:00:30', label: 'Tiempo medio codificación', gradient: 'from-violet-500 to-fuchsia-500', glow: 'rgba(139,92,246,0.15)' },
    { value: '80%', label: '% no atendidas', gradient: 'from-rose-500 to-pink-500', glow: 'rgba(244,63,94,0.15)' },
    { value: '10', label: 'Exito', gradient: 'from-green-500 to-emerald-500', glow: 'rgba(34,197,94,0.15)' },
  ];

  const STAGE_ICONS = [Users, UserCheck, Star];

  return (
    <div className="space-y-6">
      {/* ========== HEADER ========== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-gradient">Reportes</h1>
          <p className="text-sm text-muted-foreground mt-1">Visualiza el rendimiento del proceso de ventas</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Report type toggle */}
          <div className="flex bg-muted/50 rounded-xl p-1">
            <button
              onClick={() => setTipoReporte('mensajes')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tipoReporte === 'mensajes'
                  ? 'bg-white shadow-md text-indigo-600'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Mensajes
            </button>
            <button
              onClick={() => setTipoReporte('llamadas')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tipoReporte === 'llamadas'
                  ? 'bg-white shadow-md text-indigo-600'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Phone className="w-4 h-4" />
              Llamadas
            </button>
          </div>
        </div>
      </div>

      {/* ========== FILTERS CARD ========== */}
      <Card className="border-0 shadow-md overflow-hidden animate-fade-in" style={{ animationDelay: '50ms' }}>
        <div className="h-1 bg-gradient-to-r from-indigo-500 to-cyan-500" />
        <CardContent className="p-5">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Date range */}
            <div className="min-w-[180px]">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Periodo
              </label>
              <select
                value={dateRange}
                onChange={(e) => handleDateRangeChange(e.target.value)}
                className="w-full px-4 py-2.5 bg-muted/40 rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white border border-transparent focus:border-indigo-200 transition-all cursor-pointer"
              >
                {DATE_RANGES.map((range) => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
            </div>

            {/* Custom dates */}
            {dateRange === 'custom' && (
              <>
                <div className="min-w-[150px]">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                    Desde
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-4 py-2.5 bg-muted/40 rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white border border-transparent focus:border-indigo-200 transition-all"
                  />
                </div>
                <div className="min-w-[150px]">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    Hasta
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-4 py-2.5 bg-muted/40 rounded-xl text-sm text-foreground outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white border border-transparent focus:border-indigo-200 transition-all"
                  />
                </div>
              </>
            )}

            <div className="flex gap-2 ml-auto">
              {/* Clear filters */}
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters} className="gap-2 shadow-sm">
                  <X className="w-4 h-4" />
                  Limpiar
                </Button>
              )}

              {/* Refresh */}
              <Button
                onClick={loadFunnelData}
                className="gap-2 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white shadow-md hover:shadow-lg transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Actualizar
              </Button>
            </div>
          </div>

          {/* Active filter indicator */}
          {hasActiveFilters && (
            <>
              <Separator className="my-4" />
              <div className="flex items-center gap-2 text-sm">
                <Badge className="bg-indigo-500/10 text-indigo-600 border-0 gap-1.5">
                  <Filter className="w-3 h-3" />
                  {DATE_RANGES.find(r => r.value === dateRange)?.label}
                  {dateRange === 'custom' && dateFrom && dateTo && ` (${dateFrom} - ${dateTo})`}
                </Badge>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ========== MENSAJES REPORT ========== */}
      {tipoReporte === 'mensajes' ? (
        <Card className="border-0 shadow-md overflow-hidden animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-amber-500" />
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-md">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Embudo de Ventas</h2>
                <p className="text-[12px] text-muted-foreground">Análisis de conversión por etapas</p>
              </div>
            </div>

            {funnelData && (
              <div className="space-y-8">
                {/* Funnel Chart - Premium redesign */}
                <div className="flex flex-col items-center py-8 gap-3">
                  {funnelStages.map((stage, index) => {
                    const widthPercentage = maxValue > 0 ? (stage.valor / maxValue) * 100 : 0;
                    const minWidth = 30;
                    const calculatedWidth = Math.max(widthPercentage, minWidth);
                    const StageIcon = STAGE_ICONS[index];

                    return (
                      <div
                        key={stage.nombre}
                        className="relative flex items-center justify-center transition-all duration-500 hover:scale-[1.02] group animate-scale-in cursor-default"
                        style={{
                          width: `${calculatedWidth}%`,
                          minWidth: '240px',
                          maxWidth: '100%',
                          animationDelay: `${index * 150}ms`,
                        }}
                      >
                        <div
                          className={`w-full h-20 rounded-2xl bg-gradient-to-r ${FUNNEL_COLORS[index].bg} shadow-lg group-hover:shadow-xl transition-all flex items-center justify-center gap-3 relative overflow-hidden`}
                        >
                          {/* Glass overlay */}
                          <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent rounded-2xl" />
                          {/* Shimmer */}
                          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 rounded-2xl" />
                          <div className="relative flex items-center gap-3">
                            <StageIcon className="w-5 h-5 text-white/80" />
                            <span className="text-2xl font-bold text-white">{stage.valor.toLocaleString()}</span>
                            <span className="text-sm text-white/80 font-medium">{stage.nombre}</span>
                          </div>
                        </div>
                        {/* Connector arrow */}
                        {index < funnelStages.length - 1 && (
                          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-10">
                            <ArrowDownRight className="w-5 h-5 text-muted-foreground/30 rotate-45" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Stats Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {funnelStages.map((stage, index) => {
                    const StageIcon = STAGE_ICONS[index];
                    return (
                      <Card
                        key={stage.nombre}
                        className="border-0 shadow-sm overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 animate-scale-in"
                        style={{ animationDelay: `${(index + 3) * 100}ms` }}
                      >
                        <div className={`h-1 bg-gradient-to-r ${FUNNEL_COLORS[index].bg}`} />
                        <CardContent className="p-5 relative">
                          <div
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            style={{ background: `radial-gradient(circle at 50% 50%, ${FUNNEL_COLORS[index].glow}, transparent 70%)` }}
                          />
                          <div className="relative">
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${FUNNEL_COLORS[index].bg} flex items-center justify-center text-white shadow-sm`}>
                                <StageIcon className="w-4 h-4" />
                              </div>
                              <span className="text-sm font-semibold text-muted-foreground">{stage.nombre}</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-3xl font-bold text-foreground animate-count-up">{stage.valor.toLocaleString()}</span>
                              <Badge className={`${FUNNEL_COLORS[index].light} ${FUNNEL_COLORS[index].textColor} border-0 text-[11px] font-bold`}>
                                {stage.porcentaje}%
                              </Badge>
                            </div>
                            {index > 0 && (
                              <p className="text-[11px] text-muted-foreground mt-2">
                                Conversión desde Total: {stage.porcentaje}%
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Conversion Rates Card */}
                <Card className="border-0 shadow-sm overflow-hidden bg-gradient-to-br from-indigo-500/5 via-blue-500/5 to-cyan-500/5 animate-fade-in">
                  <div className="h-1 bg-gradient-to-r from-indigo-500 to-cyan-500" />
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2.5 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
                        <Target className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="text-sm font-bold text-foreground">Tasas de Conversión</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-500/10 text-blue-600 border-0 text-[10px] font-bold">Total</Badge>
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-[10px] font-bold">Contactados</Badge>
                        </div>
                        <span className="font-bold text-foreground text-lg">{funnelData.contactados.porcentaje}%</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-500/10 text-blue-600 border-0 text-[10px] font-bold">Total</Badge>
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          <Badge className="bg-amber-500/10 text-amber-600 border-0 text-[10px] font-bold">Interesados</Badge>
                        </div>
                        <span className="font-bold text-foreground text-lg">{funnelData.interesados.porcentaje}%</span>
                      </div>
                      {funnelData.contactados.valor > 0 && (
                        <div className="flex items-center justify-between p-3 bg-white/60 rounded-xl md:col-span-2">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-[10px] font-bold">Contactados</Badge>
                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                            <Badge className="bg-amber-500/10 text-amber-600 border-0 text-[10px] font-bold">Interesados</Badge>
                          </div>
                          <span className="font-bold text-foreground text-lg">
                            {Math.round((funnelData.interesados.valor / funnelData.contactados.valor) * 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {!funnelData && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 flex items-center justify-center">
                  <BarChart3 className="w-8 h-8 text-indigo-400" />
                </div>
                <p className="text-foreground font-semibold">No hay datos disponibles</p>
                <p className="text-sm text-muted-foreground mt-1">Intenta con otro rango de fechas</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* ========== LLAMADAS REPORT ========== */
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* ---- LEFT COLUMN ---- */}
          <div className="space-y-6">
            {/* Total de Llamadas Card */}
            <Card className="border-0 shadow-md overflow-hidden animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-md">
                    <PhoneCall className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">Total de Llamadas</h2>
                    <p className="text-[11px] text-muted-foreground">Métricas generales del día</p>
                  </div>
                </div>

                {/* Today stat */}
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-sm font-semibold text-muted-foreground">Llamadas hoy</span>
                  <div className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold text-lg shadow-md">
                    600
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Progress bars */}
                  <div className="flex-1 space-y-4">
                    {progressBars.map((bar, idx) => (
                      <div key={idx} className="animate-scale-in" style={{ animationDelay: `${idx * 50}ms` }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <bar.icon className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-[12px] font-medium text-muted-foreground">{bar.label}</span>
                          </div>
                          <span className="text-[12px] font-bold text-foreground">{bar.value}</span>
                        </div>
                        <div className="relative bg-muted/50 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`absolute top-0 left-0 h-full bg-gradient-to-r ${bar.gradient} rounded-full transition-all duration-1000`}
                            style={{ width: `${bar.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Stat cards grid */}
                  <div className="flex gap-3">
                    <div className="flex flex-col gap-3">
                      {statCardsLeft.map((stat, idx) => (
                        <Card
                          key={idx}
                          className="border-0 shadow-sm overflow-hidden group hover:shadow-md transition-all animate-scale-in"
                          style={{ animationDelay: `${(idx + 7) * 50}ms` }}
                        >
                          <div className={`h-0.5 bg-gradient-to-r ${stat.gradient}`} />
                          <CardContent className="p-3 text-center relative min-w-[120px]">
                            <div
                              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                              style={{ background: `radial-gradient(circle at 50% 50%, ${stat.glow}, transparent 70%)` }}
                            />
                            <p className="text-lg font-bold text-foreground relative">{stat.value}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest relative mt-0.5">{stat.label}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <div className="flex flex-col gap-3">
                      {statCardsRight.map((stat, idx) => (
                        <Card
                          key={idx}
                          className="border-0 shadow-sm overflow-hidden group hover:shadow-md transition-all animate-scale-in"
                          style={{ animationDelay: `${(idx + 11) * 50}ms` }}
                        >
                          <div className={`h-0.5 bg-gradient-to-r ${stat.gradient}`} />
                          <CardContent className="p-3 text-center relative min-w-[120px]">
                            <div
                              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                              style={{ background: `radial-gradient(circle at 50% 50%, ${stat.glow}, transparent 70%)` }}
                            />
                            <p className="text-lg font-bold text-foreground relative">{stat.value}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest relative mt-0.5">{stat.label}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estado de campañas Table */}
            <Card className="border-0 shadow-md overflow-hidden animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <CardContent className="p-0">
                <div className="p-5 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-sm">
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">Estado de campañas</h3>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-border/50">
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/70">Campaña</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/70">Estado</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/70">Última actualización</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/70">Reglas activas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockCampaigns.map((cam) => (
                      <TableRow key={cam.id} className="table-row-premium">
                        <TableCell className="font-semibold text-sm">{cam.nombre}</TableCell>
                        <TableCell>
                          <Badge className="bg-emerald-500/10 text-emerald-600 border-0 gap-1 text-[11px]">
                            <Play className="w-3 h-3" />
                            {cam.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{cam.update_at}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[11px]">{cam.reglas_activas}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* ---- RIGHT COLUMN ---- */}
          <div className="space-y-6">
            {/* Campañas activas Table */}
            <Card className="border-0 shadow-md overflow-hidden animate-fade-in" style={{ animationDelay: '150ms' }}>
              <div className="h-1 bg-gradient-to-r from-purple-500 to-violet-500" />
              <CardContent className="p-0">
                <div className="p-5 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center text-white shadow-sm">
                      <Activity className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">Estado de campañas activas</h3>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-b border-border/50">
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/70">Campaña</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/70">Activos</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/70">Libres</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/70">Llamando</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/70">Respuestas</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/70">No atend.</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/70">Fallidas</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/70">Dropped</TableHead>
                        <TableHead className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/70">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockActivas.map((activa) => (
                        <TableRow key={activa.id} className="table-row-premium">
                          <TableCell className="font-semibold text-sm">{activa.nombre}</TableCell>
                          <TableCell>
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-[11px]">{activa.agentes_activos}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-blue-500/10 text-blue-600 border-0 text-[11px]">{activa.agentes_libres}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">{activa.llamando}</TableCell>
                          <TableCell>
                            <span className="text-sm font-semibold text-emerald-600">{activa.respuestas}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-semibold text-rose-600">{activa.no_atendido}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">{activa.fallidas}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-semibold text-amber-600">{activa.dropped}</span>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-indigo-500/10 text-indigo-600 border-0 text-[11px] font-bold">{activa.porcentaje}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Llamadas realizadas Table */}
            <Card className="border-0 shadow-md overflow-hidden animate-fade-in" style={{ animationDelay: '250ms' }}>
              <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
              <CardContent className="p-0">
                <div className="p-5 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-sm">
                      <Phone className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">Llamadas realizadas</h3>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-border/50">
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/70">Campaña</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/70">Teléfono</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/70">Inicio de llamada</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockLlamadas.map((llamada) => (
                      <TableRow key={llamada.id} className="table-row-premium">
                        <TableCell className="font-semibold text-sm">{llamada.nombre}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-sm font-mono">{llamada.telefono}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-sm font-mono">{llamada.inicio}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
