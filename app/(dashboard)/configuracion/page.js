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
  Tag,
  Layers,
  Megaphone,
} from 'lucide-react';

const gestionUsuario = [
  { title: 'Usuarios', description: 'Gestionar usuarios del sistema', href: '/configuracion/usuarios', icon: Users, gradient: 'from-blue-500 to-indigo-500', glow: 'rgba(59,130,246,0.15)' },
  { title: 'Equipos', description: 'Ver coordinadores y sus asesores', href: '/configuracion/equipos', icon: UsersRound, gradient: 'from-amber-500 to-orange-500', glow: 'rgba(245,158,11,0.15)' },
  { title: 'Sucursales', description: 'Gestionar sucursales', href: '/configuracion/sucursales', icon: Building2, gradient: 'from-orange-500 to-red-500', glow: 'rgba(249,115,22,0.15)' },
];

const gestionWhatsApp = [
  { title: 'Preguntas Frecuentes', description: 'Gestionar FAQs del sistema', href: '/configuracion/faqs', icon: HelpCircle, gradient: 'from-pink-500 to-rose-500', glow: 'rgba(236,72,153,0.15)' },
  { title: 'Tipificaciones', description: 'Gestionar tipificaciones de leads', href: '/configuracion/tipificaciones', icon: Tags, gradient: 'from-rose-500 to-red-500', glow: 'rgba(244,63,94,0.15)' },
  { title: 'WhatsApp', description: 'Escanear QR y conectar WhatsApp', href: '/configuracion/whatsapp', icon: MessageCircle, gradient: 'from-green-500 to-emerald-500', glow: 'rgba(34,197,94,0.15)' },
  { title: 'Periodicidades Recordatorio', description: 'Configurar intervalos de recordatorios', href: '/configuracion/periodicidades-recordatorio', icon: Clock, gradient: 'from-sky-500 to-blue-500', glow: 'rgba(14,165,233,0.15)' },
];

const gestionCampanias = [
  { title: 'Tipos de Campaña', description: 'Configurar tipos de campaña (llamada, whatsapp, etc.)', href: '/configuracion/tipos-campania', icon: Layers, gradient: 'from-indigo-500 to-violet-500', glow: 'rgba(99,102,241,0.15)' },
  { title: 'Estados de Campaña', description: 'Configurar estados disponibles para campañas', href: '/configuracion/estados-campania', icon: Tag, gradient: 'from-emerald-500 to-teal-500', glow: 'rgba(16,185,129,0.15)' },
];

const gestionLlamadas = [
  { title: 'Plantillas', description: 'Gestionar plantillas de prompts para campañas', href: '/configuracion/plantillas', icon: LayoutTemplate, gradient: 'from-fuchsia-500 to-pink-500', glow: 'rgba(217,70,239,0.15)' },
];

const sections = [
  {
    id: 'usuarios',
    title: 'Gestión de Usuario',
    description: 'Usuarios, equipos y sucursales',
    icon: Shield,
    gradient: 'from-blue-500 to-indigo-500',
    items: gestionUsuario,
  },
  {
    id: 'whatsapp',
    title: 'Gestión de Mensajes WhatsApp',
    description: 'FAQs, tipificaciones, WhatsApp y recordatorios',
    icon: MessageCircle,
    gradient: 'from-green-500 to-emerald-500',
    items: gestionWhatsApp,
  },
  {
    id: 'campanias',
    title: 'Gestión de Campañas',
    description: 'Estados y configuración general de campañas',
    icon: Megaphone,
    gradient: 'from-emerald-500 to-teal-500',
    items: gestionCampanias,
  },
  {
    id: 'llamadas',
    title: 'Gestión de Llamada de Voz',
    description: 'Plantillas de prompts para campañas',
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
