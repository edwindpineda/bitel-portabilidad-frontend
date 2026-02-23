'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  CheckCircle2,
  UserPlus,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Activity,
  MessageSquare,
  DollarSign,
  Clock,
} from 'lucide-react';

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
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200/60" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-[#f5f3ff] px-4 text-xs text-muted-foreground uppercase tracking-widest">{label}</span>
      </div>
    </div>
  );
}

// Mock data - Métricas del CRM
const stats = [
  {
    name: 'Conversaciones Asignadas',
    value: '100',
    subtitle: 'Total asignadas',
    change: '+15 esta semana',
    icon: Users,
    from: '#3b82f6',
    to: '#2563eb',
  },
  {
    name: 'Ventas Cerradas',
    value: '68',
    subtitle: 'Ya compraron plan',
    change: '+8 esta semana',
    icon: CheckCircle2,
    from: '#10b981',
    to: '#059669',
  },
  {
    name: 'Leads Nuevos',
    value: '15',
    subtitle: 'Esta semana',
    change: '+15 vs semana pasada',
    icon: UserPlus,
    from: '#8b5cf6',
    to: '#7c3aed',
  },
  {
    name: 'Tasa de Conversión',
    value: '68%',
    subtitle: '68 de 100 convertidos',
    change: '+5% vs mes pasado',
    icon: TrendingUp,
    from: '#f59e0b',
    to: '#f97316',
  },
];

const pipeline = [
  { status: 'Nuevo', count: 15, from: '#8b5cf6', to: '#7c3aed', percentage: 15 },
  { status: 'Contactado', count: 12, from: '#3b82f6', to: '#2563eb', percentage: 12 },
  { status: 'Interesado', count: 5, from: '#eab308', to: '#f59e0b', percentage: 5 },
  { status: 'Ganado', count: 68, from: '#10b981', to: '#059669', percentage: 68 },
];

const recentConversations = [
  { id: 1, name: 'Carlos Pérez', status: 'nuevo', time: '5 min', message: 'Quiero información sobre portabilidad' },
  { id: 2, name: 'María López', status: 'interesado', time: '15 min', message: 'Me interesa el plan de 45 soles' },
  { id: 3, name: 'Juan Torres', status: 'contactado', time: '1 hora', message: 'Tengo Claro actualmente' },
  { id: 4, name: 'Ana Gutiérrez', status: 'nuevo', time: '2 horas', message: 'Cuánto cuesta portarme?' },
];

const statusColors = {
  nuevo: 'border-purple-300 text-purple-700',
  contactado: 'border-blue-300 text-blue-700',
  interesado: 'border-yellow-300 text-yellow-700',
  ganado: 'border-green-300 text-green-700',
};

export default function DashboardPage() {
  return (
    <div className="min-h-full" style={{ background: 'linear-gradient(135deg, #f8f9fe 0%, #f1f5f9 50%, #f5f3ff 100%)' }}>
      <div className="space-y-7">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-xs text-muted-foreground">Seguimiento de conversaciones y ventas</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Última actualización</p>
            <p className="text-sm font-medium">Hoy, {new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.name}
                className="group relative overflow-hidden rounded-2xl border border-white/60 bg-white p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1 opacity-80"
                  style={{ background: `linear-gradient(90deg, ${stat.from}, ${stat.to})` }}
                />
                <div
                  className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-2xl"
                  style={{ background: stat.from }}
                />
                <div className="relative flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.name}</p>
                    <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                    <p className="text-xs font-medium text-emerald-600">{stat.change}</p>
                  </div>
                  <div
                    className="h-11 w-11 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300"
                    style={{ background: `linear-gradient(135deg, ${stat.from}, ${stat.to})` }}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <SectionSeparator label="Pipeline" />

        {/* Pipeline de Ventas */}
        <GlassCard>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Pipeline de Ventas</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">100 personas en total</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {pipeline.map((stage) => (
                <div key={stage.status} className="text-center">
                  <div
                    className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-3"
                    style={{ backgroundColor: `${stage.from}20` }}
                  >
                    <span
                      className="text-2xl font-bold"
                      style={{ color: stage.from }}
                    >
                      {stage.count}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{stage.status}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stage.percentage}% del total</p>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200/60">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progreso general</span>
                <span className="font-semibold">68 de 100 convertidos (68%)</span>
              </div>
              <Progress value={68} className="h-3" />
            </div>
          </CardContent>
        </GlassCard>

        <SectionSeparator label="Detalle" />

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Conversations */}
          <GlassCard className="lg:col-span-2">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">Conversaciones Recientes</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Clientes que preguntaron hoy</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="gap-1 text-blue-600 hover:text-blue-700" asChild>
                  <a href="/conversaciones">
                    Ver todas
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {recentConversations.map((conv) => (
                  <div
                    key={conv.id}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50/80 transition-colors cursor-pointer"
                  >
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {conv.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{conv.name}</p>
                        <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">{conv.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">{conv.message}</p>
                      <Badge
                        variant="outline"
                        className={`mt-1.5 text-xs capitalize ${statusColors[conv.status]}`}
                      >
                        {conv.status.charAt(0).toUpperCase() + conv.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </GlassCard>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Ventas de la Semana */}
            <GlassCard className="overflow-hidden">
              <div className="bg-gradient-to-br from-emerald-500 to-cyan-500 p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-emerald-100">Ventas de la Semana</p>
                  <DollarSign className="h-6 w-6 text-emerald-200" />
                </div>
                <p className="text-4xl font-bold">8</p>
                <p className="text-sm text-emerald-100 mt-1">Ventas cerradas</p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge className="bg-white/20 text-white border-0 hover:bg-white/30">+8 vs semana pasada</Badge>
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
                  <a href="/conversaciones">
                    Ver Conversaciones
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-between rounded-xl" asChild>
                  <a href="/configuracion/planes-tarifarios">
                    Ver Planes Tarifarios
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </GlassCard>

            {/* Mi Desempeño Semanal */}
            <GlassCard>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Mi Desempeño Semanal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Tasa de Conversión</span>
                    <span className="font-bold text-emerald-600">68%</span>
                  </div>
                  <Progress value={68} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1.5">68 de 100 convertidos</p>
                </div>
                <div className="border-t border-gray-200/60 pt-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Tiempo de Respuesta</span>
                    <span className="font-bold text-blue-600">Rápido</span>
                  </div>
                  <Progress value={85} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1.5">Promedio: 15 minutos</p>
                </div>
                <div className="border-t border-gray-200/60 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Nuevos Leads</p>
                      <p className="text-xs text-muted-foreground">Esta semana vs semana pasada</p>
                    </div>
                    <Badge variant="outline" className="text-base font-bold px-3 py-1">
                      +15
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
