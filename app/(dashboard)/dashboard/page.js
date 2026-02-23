'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  CheckCircle2,
  UserPlus,
  TrendingUp,
  RefreshCw,
  ArrowRight,
  BarChart3,
  Loader2,
  Zap,
  Target,
  Activity,
  Filter,
  Sparkles,
} from 'lucide-react';

const COLOR_MAP = {
  'rojo': '#EF4444',
  'naranja': '#F97316',
  'amarillo': '#EAB308',
  'verde': '#22C55E',
  'azul': '#3B82F6',
  'indigo': '#6366F1',
  'cyan': '#06B6D4',
  'teal': '#14B8A6',
  'gris': '#6B7280',
  'morado': '#A855F7',
  'rosa': '#EC4899',
};

const getColorHex = (color) => {
  if (!color) return '#6B7280';
  if (color.startsWith('#')) return color;
  return COLOR_MAP[color.toLowerCase()] || '#6B7280';
};

const STAT_CONFIG = [
  {
    key: 'totalLeads',
    name: 'Total Leads',
    subtitle: 'Personas registradas',
    icon: Users,
    from: '#3b82f6',
    to: '#2563eb',
  },
  {
    key: 'interesados',
    name: 'Interesados',
    subtitle: 'Line1 + Line2',
    icon: CheckCircle2,
    from: '#10b981',
    to: '#059669',
  },
  {
    key: 'leadsSemana',
    name: 'Leads Semana',
    subtitle: 'Últimos 7 días',
    icon: UserPlus,
    from: '#8b5cf6',
    to: '#7c3aed',
  },
  {
    key: 'tasaConversion',
    name: 'Conversión',
    subtitle: 'Interesados / Total',
    icon: TrendingUp,
    from: '#f59e0b',
    to: '#f97316',
    format: (val) => `${val || 0}%`,
  },
];

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
// Animated stat card (matches Resumen/Auto/Speech)
// ============================
function StatCard({ config, value, subtitle, index }) {
  const Icon = config.icon;
  const numericValue = String(value).replace(/[^0-9.]/g, '');
  const animated = useAnimatedValue(numericValue);
  const isPercent = String(value).includes('%');
  const displayVal = isPercent ? `${animated}%` : animated.toLocaleString();

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-white/60 bg-white p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Gradient accent top */}
      <div
        className="absolute top-0 left-0 right-0 h-1 opacity-80"
        style={{ background: `linear-gradient(90deg, ${config.from}, ${config.to})` }}
      />
      {/* Background glow on hover */}
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl"
        style={{ background: config.from }}
      />

      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{config.name}</p>
          <p className="text-3xl font-bold tracking-tight">{displayVal}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div
          className="h-11 w-11 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300"
          style={{ background: `linear-gradient(135deg, ${config.from}, ${config.to})` }}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

// ============================
// Premium card wrapper (matches others)
// ============================
function GlassCard({ children, className = '' }) {
  return (
    <Card className={`relative overflow-hidden border-white/60 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-shadow duration-300 ${className}`}>
      {children}
    </Card>
  );
}

// ============================
// Separator (matches others)
// ============================
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

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/crm/reportes/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Error al cargar estadisticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center h-64 gap-3" style={{ background: 'linear-gradient(135deg, #f8f9fe 0%, #f1f5f9 50%, #f5f3ff 100%)' }}>
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        <p className="text-sm text-muted-foreground">Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full" style={{ background: 'linear-gradient(135deg, #f8f9fe 0%, #f1f5f9 50%, #f5f3ff 100%)' }}>
      <div className="space-y-7">

        {/* Breadcrumb */}
        <div className="text-sm text-muted-foreground">
          Dashboard <span className="mx-1.5 text-gray-300">/</span>
          <span className="text-foreground font-medium">General</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">General</h1>
              <p className="text-xs text-muted-foreground">Seguimiento de personas y tasa de conversión</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadDashboardStats}
              className="gap-2 rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200"
            >
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Historial de cambios
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STAT_CONFIG.map((stat, index) => {
            const value = stat.format
              ? stat.format(stats?.[stat.key])
              : stats?.[stat.key]?.toLocaleString() || '0';
            const subtitle = stat.key === 'tasaConversion'
              ? `${stats?.interesados || 0} de ${stats?.totalLeads || 0}`
              : stat.subtitle;

            return (
              <StatCard
                key={stat.key}
                config={stat}
                value={value}
                subtitle={subtitle}
                index={index}
              />
            );
          })}
        </div>

        {/* Pipeline Section */}
        {stats?.pipeline && stats.pipeline.length > 0 && (
          <>
            <SectionSeparator label="Pipeline" />

            <GlassCard>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                      <Activity className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">Pipeline por Estado</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{stats.totalLeads} leads en total</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    {stats.pipeline.length} etapas
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Pipeline bars */}
                <div className="space-y-4">
                  {stats.pipeline.map((stage) => {
                    const colorHex = getColorHex(stage.color);
                    const percentage = stats.totalLeads > 0
                      ? Math.round((stage.total / stats.totalLeads) * 100)
                      : 0;
                    return (
                      <div key={stage.nombre} className="group">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div
                              className="h-3 w-3 rounded-full shadow-sm"
                              style={{ backgroundColor: colorHex }}
                            />
                            <span className="text-sm font-medium capitalize">{stage.nombre}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold">{stage.total}</span>
                            <Badge variant="outline" className="text-xs tabular-nums">
                              {percentage}%
                            </Badge>
                          </div>
                        </div>
                        <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700 ease-out"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: colorHex,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Conversion summary */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-cyan-50 mt-6">
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="text-sm font-medium">Tasa de Conversión</p>
                      <p className="text-xs text-muted-foreground">Interesados sobre total</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-emerald-600">{stats.tasaConversion}%</p>
                    <p className="text-xs text-muted-foreground">{stats.interesados} de {stats.totalLeads}</p>
                  </div>
                </div>
              </CardContent>
            </GlassCard>
          </>
        )}

        <SectionSeparator label="Análisis detallado" />

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conversion Funnel */}
          <GlassCard className="lg:col-span-2">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">Embudo de Conversión</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Flujo de personas</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {/* Total Leads */}
                <div className="relative p-5 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <Users className="h-5 w-5 mb-3 opacity-80" />
                  <p className="text-3xl font-bold">{stats?.totalLeads?.toLocaleString() || 0}</p>
                  <p className="text-sm text-blue-100 mt-1">Total Leads</p>
                  <p className="text-xs text-blue-200 mt-0.5">100% del pipeline</p>
                </div>

                {/* Contactados */}
                <div className="relative p-5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <Zap className="h-5 w-5 mb-3 opacity-80" />
                  <p className="text-3xl font-bold">{stats?.contactados?.toLocaleString() || 0}</p>
                  <p className="text-sm text-amber-100 mt-1">Contactados</p>
                  <p className="text-xs text-amber-200 mt-0.5">Tiene mensaje</p>
                </div>

                {/* Interesados */}
                <div className="relative p-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <CheckCircle2 className="h-5 w-5 mb-3 opacity-80" />
                  <p className="text-3xl font-bold">{stats?.interesados?.toLocaleString() || 0}</p>
                  <p className="text-sm text-emerald-100 mt-1">Interesados</p>
                  <p className="text-xs text-emerald-200 mt-0.5">Line1 + Line2</p>
                </div>
              </div>

              {/* Conversion arrows */}
              <div className="flex items-center justify-center gap-2 mt-5 py-3 px-4 rounded-xl bg-gray-50/80">
                <span className="text-sm text-muted-foreground">Fórmula:</span>
                <span className="text-sm font-medium">Interesados / Total Leads</span>
                <span className="text-sm text-muted-foreground">=</span>
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">
                  {stats?.tasaConversion || 0}% conversión
                </Badge>
              </div>
            </CardContent>
          </GlassCard>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Interesados Highlight */}
            <GlassCard className="overflow-hidden">
              <div className="bg-gradient-to-br from-emerald-500 to-cyan-500 p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-emerald-100">Interesados</p>
                  <CheckCircle2 className="h-6 w-6 text-emerald-200" />
                </div>
                <p className="text-4xl font-bold">{stats?.interesados?.toLocaleString() || 0}</p>
                <p className="text-sm text-emerald-100 mt-1">Personas interesadas</p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge className="bg-white/20 text-white border-0 hover:bg-white/30">Line1 + Line2</Badge>
                  <Badge className="bg-white/20 text-white border-0 hover:bg-white/30">{stats?.tasaConversion || 0}%</Badge>
                </div>
              </div>
            </GlassCard>

            {/* Quick Actions */}
            <GlassCard>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-between rounded-xl" asChild>
                  <a href="/leads">
                    Ver Leads
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-between rounded-xl" asChild>
                  <a href="/reportes">
                    Ver Reportes
                    <BarChart3 className="h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </GlassCard>

            {/* Conversion Rate */}
            <GlassCard>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Tasa de Conversión</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Interesados / Total</span>
                    <span className="font-bold text-emerald-600">{stats?.tasaConversion || 0}%</span>
                  </div>
                  <Progress value={stats?.tasaConversion || 0} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {stats?.interesados || 0} de {stats?.totalLeads || 0} personas
                  </p>
                </div>
                <div className="border-t border-gray-200/60 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Leads esta semana</p>
                      <p className="text-xs text-muted-foreground">Últimos 7 días</p>
                    </div>
                    <Badge variant="outline" className="text-base font-bold px-3 py-1">
                      +{stats?.leadsSemana || 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
