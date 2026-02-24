'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  Users,
  UsersRound,
  Building2,
  HelpCircle,
  Tags,
  MessageCircle,
  Clock,
  Phone,
  LayoutTemplate,
  ChevronRight,
  Shield,
  Package,
  Truck,
  Monitor,
  ClipboardList,
  FileText,
  FileUp,
  MessageSquare,
  Database,
} from 'lucide-react';

const gestionUsuario = [
  { title: 'Usuarios', description: 'Gestionar usuarios del sistema', href: '/configuracion/usuarios', icon: Users, gradient: 'from-blue-500 to-indigo-500', glow: 'rgba(59,130,246,0.15)' },
  { title: 'Equipos', description: 'Ver coordinadores y sus asesores', href: '/configuracion/equipos', icon: UsersRound, gradient: 'from-amber-500 to-orange-500', glow: 'rgba(245,158,11,0.15)' },
  { title: 'Sucursales', description: 'Gestionar sucursales', href: '/configuracion/sucursales', icon: Building2, gradient: 'from-orange-500 to-red-500', glow: 'rgba(249,115,22,0.15)' },
  { title: 'Proveedores', description: 'Gestionar proveedores', href: '/configuracion/proveedores', icon: Truck, gradient: 'from-cyan-500 to-blue-500', glow: 'rgba(6,182,212,0.15)' },
];

const gestionWhatsApp = [
  { title: 'Catálogo', description: 'Gestionar catálogo de planes y precios', href: '/configuracion/catalogo', icon: Package, gradient: 'from-indigo-500 to-purple-500', glow: 'rgba(99,102,241,0.15)' },
  { title: 'Preguntas Frecuentes', description: 'Gestionar FAQs del sistema', href: '/configuracion/faqs', icon: HelpCircle, gradient: 'from-pink-500 to-rose-500', glow: 'rgba(236,72,153,0.15)' },
  { title: 'Tipificaciones', description: 'Gestionar tipificaciones de leads', href: '/configuracion/tipificaciones', icon: Tags, gradient: 'from-rose-500 to-red-500', glow: 'rgba(244,63,94,0.15)' },
  { title: 'WhatsApp', description: 'Escanear QR y conectar WhatsApp', href: '/configuracion/whatsapp', icon: MessageCircle, gradient: 'from-green-500 to-emerald-500', glow: 'rgba(34,197,94,0.15)' },
  { title: 'Prompt del Bot', description: 'Configurar prompt del asistente', href: '/configuracion/prompt-bot', icon: Monitor, gradient: 'from-teal-500 to-cyan-500', glow: 'rgba(20,184,166,0.15)' },
  { title: 'Preguntas Perfilamiento', description: 'Gestionar preguntas de perfilamiento', href: '/configuracion/preguntas-perfilamiento', icon: ClipboardList, gradient: 'from-violet-500 to-purple-500', glow: 'rgba(139,92,246,0.15)' },
  { title: 'Argumentos de Venta', description: 'Gestionar argumentos de venta', href: '/configuracion/argumentos-venta', icon: FileText, gradient: 'from-emerald-500 to-green-500', glow: 'rgba(16,185,129,0.15)' },
  { title: 'Periodicidades Recordatorio', description: 'Configurar intervalos de recordatorios', href: '/configuracion/periodicidades-recordatorio', icon: Clock, gradient: 'from-sky-500 to-blue-500', glow: 'rgba(14,165,233,0.15)' },
];

const gestionLlamadas = [
  { title: 'Formatos', description: 'Gestionar formatos de datos y campos', href: '/configuracion/formatos', icon: Database, gradient: 'from-amber-500 to-yellow-500', glow: 'rgba(245,158,11,0.15)' },
  { title: 'Base de Números', description: 'Cargar y gestionar bases de números', href: '/configuracion/bases-numeros', icon: FileUp, gradient: 'from-lime-500 to-green-500', glow: 'rgba(132,204,22,0.15)' },
  { title: 'Plantillas', description: 'Gestionar plantillas de prompts para campañas', href: '/configuracion/plantillas', icon: LayoutTemplate, gradient: 'from-fuchsia-500 to-pink-500', glow: 'rgba(217,70,239,0.15)' },
];

const sections = [
  {
    id: 'usuarios',
    title: 'Gestión de Usuario',
    description: 'Usuarios, equipos, roles, módulos, sucursales y proveedores',
    icon: Shield,
    gradient: 'from-blue-500 to-indigo-500',
    items: gestionUsuario,
  },
  {
    id: 'whatsapp',
    title: 'Gestión de Mensajes WhatsApp',
    description: 'Configuración de mensajería, planes, FAQs y tipificaciones',
    icon: MessageCircle,
    gradient: 'from-green-500 to-emerald-500',
    items: gestionWhatsApp,
  },
  {
    id: 'llamadas',
    title: 'Gestión de Llamada de Voz',
    description: 'Formatos, bases de números, plantillas y campañas',
    icon: Phone,
    gradient: 'from-purple-500 to-violet-500',
    items: gestionLlamadas,
  },
];

export default function ConfiguracionPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3 animate-fade-in">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-lg">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gradient">Configuración</h1>
          <p className="text-sm text-muted-foreground">Administra la configuración del sistema</p>
        </div>
      </div>

      {/* Sections */}
      {sections.map((section, sIdx) => (
        <div key={section.id} className="space-y-4 animate-fade-in" style={{ animationDelay: `${sIdx * 100}ms` }}>
          {/* Section Header */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className={`h-1 bg-gradient-to-r ${section.gradient}`} />
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${section.gradient} flex items-center justify-center text-white shadow-md`}>
                  <section.icon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">{section.title}</h2>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{section.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Config Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {section.items.map((config, idx) => (
              <Link key={config.href} href={config.href}>
                <Card
                  className="border-0 shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer animate-scale-in overflow-hidden h-full"
                  style={{ animationDelay: `${(sIdx * 100) + (idx * 60)}ms` }}
                >
                  <CardContent className="p-4 relative">
                    {/* Glow on hover */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: `radial-gradient(circle at 20% 50%, ${config.glow}, transparent 70%)` }}
                    />
                    <div className="relative flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white shadow-md flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                        <config.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-semibold text-foreground truncate">{config.title}</h3>
                          <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{config.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
