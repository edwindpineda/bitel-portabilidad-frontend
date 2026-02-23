'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  User,
  Mail,
  Building2,
  ShieldCheck,
  KeyRound,
  Pencil,
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  Users,
  Settings,
  ChevronRight,
  Zap,
  Shield,
  Monitor,
  Palette,
  Clock,
  LogIn,
  LayoutGrid,
  Lock,
  Sparkles,
  Camera,
  TrendingUp,
  Activity,
} from 'lucide-react';

const GRADIENT_CONFIG = {
  presets: {
    purple: {
      name: 'Púrpura',
      header: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #6B8DD6 100%)',
      avatar: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
      badge: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    },
    blue: {
      name: 'Azul',
      header: 'linear-gradient(135deg, #0093E9 0%, #80D0C7 100%)',
      avatar: 'linear-gradient(135deg, #0093E9 0%, #2563eb 50%, #3b82f6 100%)',
      badge: 'linear-gradient(135deg, #0093E9 0%, #2563eb 100%)',
    },
    green: {
      name: 'Verde',
      header: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      avatar: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
      badge: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
    },
    orange: {
      name: 'Naranja',
      header: 'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #f093fb 100%)',
      avatar: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #dc2626 100%)',
      badge: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    },
    dark: {
      name: 'Oscuro',
      header: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      avatar: 'linear-gradient(135deg, #374151 0%, #1f2937 50%, #111827 100%)',
      badge: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)',
    },
    sunset: {
      name: 'Atardecer',
      header: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      avatar: 'linear-gradient(135deg, #f472b6 0%, #fb923c 50%, #facc15 100%)',
      badge: 'linear-gradient(135deg, #f472b6 0%, #fb923c 100%)',
    },
    ocean: {
      name: 'Océano',
      header: 'linear-gradient(135deg, #2E3192 0%, #1BFFFF 100%)',
      avatar: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 50%, #14b8a6 100%)',
      badge: 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
    },
    rose: {
      name: 'Rosa',
      header: 'linear-gradient(135deg, #ee9ca7 0%, #ffdde1 100%)',
      avatar: 'linear-gradient(135deg, #ec4899 0%, #f472b6 50%, #fb7185 100%)',
      badge: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
    },
  },
  default: 'purple',
};

export default function PerfilPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('info');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(GRADIENT_CONFIG.default);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userData, setUserData] = useState({
    id: '',
    username: '',
    email: '',
    rol_nombre: '',
    id_empresa: '',
    modulos: [],
  });
  const [stats, setStats] = useState({
    conversaciones: 0,
    leads: 0,
    mensajes: 0,
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem('profile_theme');
    if (savedTheme && GRADIENT_CONFIG.presets[savedTheme]) {
      setSelectedTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      setUserData({
        id: session.user.id || '',
        username: session.user.username || '',
        email: session.user.email || '',
        rol_nombre: session.user.rol_nombre || '',
        id_empresa: session.user.id_empresa || '',
        modulos: session.user.modulos || [],
      });
      fetchStats();
    }
  }, [session]);

  const fetchStats = async () => {
    try {
      const [convRes, leadsRes] = await Promise.allSettled([
        apiClient.get('/crm/conversaciones?limit=1'),
        apiClient.get('/crm/leads?limit=1'),
      ]);
      setStats({
        conversaciones: convRes.status === 'fulfilled' ? (convRes.value?.total || convRes.value?.data?.length || 0) : 0,
        leads: leadsRes.status === 'fulfilled' ? (leadsRes.value?.total || leadsRes.value?.data?.length || 0) : 0,
        mensajes: 0,
      });
    } catch (error) {
      console.log('No se pudieron cargar las estadísticas');
    }
  };

  const currentGradient = GRADIENT_CONFIG.presets[selectedTheme];

  const handleThemeChange = (themeKey) => {
    setSelectedTheme(themeKey);
    localStorage.setItem('profile_theme', themeKey);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('Todos los campos son obligatorios');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }

    try {
      const userId = session?.user?.id;
      if (!userId) {
        setPasswordError('No se pudo identificar al usuario');
        return;
      }
      await apiClient.put(`/crm/usuarios/${userId}/password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordSuccess('Contraseña actualizada correctamente');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (error) {
      setPasswordError(error.msg || 'Error al cambiar la contraseña');
    }
  };

  const openPasswordModal = () => {
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordError('');
    setPasswordSuccess('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setShowPasswordModal(true);
  };

  const getPasswordStrength = (password) => {
    if (!password) return { level: 0, text: '', color: 'bg-gray-200' };
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) return { level: strength, text: 'Débil', color: 'bg-red-500' };
    if (strength <= 3) return { level: strength, text: 'Media', color: 'bg-yellow-500' };
    return { level: strength, text: 'Fuerte', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);

  const tabs = [
    { id: 'info', label: 'Información', icon: User },
    { id: 'security', label: 'Seguridad', icon: Lock },
    { id: 'access', label: 'Accesos', icon: Shield },
  ];

  const quickActions = [
    { label: 'Ver Conversaciones', href: '/conversaciones', icon: MessageSquare, gradient: 'from-blue-500 to-indigo-500' },
    { label: 'Gestionar Leads', href: '/leads', icon: Users, gradient: 'from-emerald-500 to-green-500' },
    { label: 'Configuración', href: '/configuracion', icon: Settings, gradient: 'from-purple-500 to-violet-500' },
  ];

  const statCards = [
    { label: 'Conversaciones', value: stats.conversaciones, icon: MessageSquare, gradient: 'from-blue-500 to-indigo-500', glow: 'rgba(59,130,246,0.2)' },
    { label: 'Leads', value: stats.leads, icon: TrendingUp, gradient: 'from-emerald-500 to-green-500', glow: 'rgba(16,185,129,0.2)' },
  ];

  return (
    <div className="space-y-6">
      {/* ========== HERO PROFILE CARD ========== */}
      <Card className="border-0 shadow-lg overflow-hidden animate-fade-in relative">
        {/* Large gradient banner */}
        <div className="h-52 relative overflow-hidden" style={{ background: currentGradient.header }}>
          {/* Decorative overlay pattern */}
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px), radial-gradient(circle at 50% 50%, white 1px, transparent 1px)',
              backgroundSize: '60px 60px, 80px 80px, 100px 100px',
            }}
          />
          {/* Glass shimmer */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0" />
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/80 to-transparent" />

          {/* Theme button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 h-9 px-3 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/20 shadow-lg gap-2"
            onClick={() => setShowThemeModal(true)}
          >
            <Palette className="w-4 h-4" />
            <span className="text-xs font-medium hidden sm:inline">Personalizar</span>
          </Button>
        </div>

        <CardContent className="relative px-8 pb-8 -mt-24">
          <div className="flex flex-col lg:flex-row lg:items-end gap-6">
            {/* Avatar with glow */}
            <div className="relative flex-shrink-0 group">
              <div
                className="absolute inset-0 rounded-2xl blur-xl opacity-50 scale-110 group-hover:opacity-70 transition-opacity"
                style={{ background: currentGradient.avatar }}
              />
              <div
                className="relative w-32 h-32 rounded-2xl flex items-center justify-center text-5xl font-bold text-white shadow-2xl border-4 border-white ring-4 ring-white/50"
                style={{ background: currentGradient.avatar }}
              >
                {userData.username?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              {/* Verified badge */}
              <div className="absolute -bottom-2 -right-2 w-9 h-9 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl border-[3px] border-white flex items-center justify-center shadow-lg">
                <Check className="w-5 h-5 text-white" />
              </div>
              {/* Camera overlay on hover */}
              <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer border-4 border-transparent">
                <Camera className="w-6 h-6 text-white drop-shadow-lg" />
              </div>
            </div>

            {/* User info */}
            <div className="flex-1 lg:pb-2">
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
                @{userData.username || 'Usuario'}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">{userData.email || 'Sin correo registrado'}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge
                  className="text-white border-0 gap-1.5 px-3.5 py-1.5 text-xs font-semibold shadow-md"
                  style={{ background: currentGradient.badge }}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {userData.rol_nombre || 'Sin rol'}
                </Badge>
                <Badge variant="outline" className="gap-1.5 bg-white shadow-sm border-border/50 px-3 py-1.5">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                  Empresa #{userData.id_empresa || '—'}
                </Badge>
                <Badge className="gap-1.5 bg-emerald-500/10 text-emerald-600 border-0 px-3 py-1.5">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  En línea
                </Badge>
              </div>
            </div>

            {/* Stat cards - elevated */}
            <div className="flex gap-4 lg:pb-2">
              {statCards.map((stat, idx) => (
                <Card
                  key={idx}
                  className="border-0 shadow-lg overflow-hidden min-w-[140px] animate-scale-in group hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className={`h-1 bg-gradient-to-r ${stat.gradient}`} />
                  <CardContent className="p-4 text-center relative">
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: `radial-gradient(circle at 50% 50%, ${stat.glow}, transparent 70%)` }}
                    />
                    <div className={`w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-sm relative`}>
                      <stat.icon className="w-4 h-4" />
                    </div>
                    <p className="text-3xl font-bold text-foreground relative animate-count-up">{stat.value}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest relative mt-1">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========== MAIN CONTENT GRID ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ---- LEFT COLUMN ---- */}
        <div className="lg:col-span-1 space-y-5">

          {/* Quick Actions Card */}
          <Card className="border-0 shadow-md overflow-hidden animate-fade-in hover:shadow-lg transition-shadow" style={{ animationDelay: '100ms' }}>
            <div className="h-1 bg-gradient-to-r from-indigo-500 to-cyan-500" />
            <CardContent className="p-5">
              <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-white" />
                </div>
                Acciones rápidas
              </h3>
              <div className="space-y-2">
                {quickActions.map((action, index) => (
                  <Link key={index} href={action.href}>
                    <div className="flex items-center gap-3 p-3.5 rounded-xl hover:bg-muted/60 transition-all group cursor-pointer border border-transparent hover:border-border/50 hover:shadow-sm">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center text-white shadow-md group-hover:scale-110 group-hover:shadow-lg transition-all`}>
                        <action.icon className="w-4.5 h-4.5" />
                      </div>
                      <span className="font-semibold text-sm text-foreground">{action.label}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/40 ml-auto group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Account Status Card */}
          <Card className="border-0 shadow-md overflow-hidden animate-fade-in hover:shadow-lg transition-shadow" style={{ animationDelay: '200ms' }}>
            <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
            <CardContent className="p-5">
              <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-white" />
                </div>
                Estado de la cuenta
              </h3>
              <div className="space-y-0">
                {[
                  {
                    label: 'Estado',
                    render: (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-0 gap-1.5 shadow-sm">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                        Activo
                      </Badge>
                    ),
                  },
                  {
                    label: 'Verificación',
                    render: (
                      <Badge className="bg-blue-500/10 text-blue-600 border-0 gap-1.5 shadow-sm">
                        <ShieldCheck className="w-3 h-3" />
                        Verificado
                      </Badge>
                    ),
                  },
                  {
                    label: 'Sesión',
                    render: <span className="text-xs font-medium text-emerald-600">Activa ahora</span>,
                  },
                  {
                    label: 'Tema',
                    render: (
                      <button
                        onClick={() => setShowThemeModal(true)}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                      >
                        <div className="w-5 h-5 rounded-full shadow-sm border-2 border-white ring-1 ring-border" style={{ background: currentGradient.badge }} />
                        <span className="text-xs font-semibold text-foreground">{currentGradient.name}</span>
                      </button>
                    ),
                  },
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between py-3.5">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      {item.render}
                    </div>
                    {idx < 3 && <Separator />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Customization Card */}
          <Card className="border-0 shadow-md overflow-hidden animate-fade-in hover:shadow-lg transition-shadow" style={{ animationDelay: '300ms' }}>
            <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
            <CardContent className="p-5">
              <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Palette className="w-3.5 h-3.5 text-white" />
                </div>
                Personalización
              </h3>
              <button
                onClick={() => setShowThemeModal(true)}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-purple-200 hover:bg-purple-50/30 transition-all group shadow-sm hover:shadow-md"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform"
                  style={{ background: currentGradient.badge }}
                >
                  <Palette className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-sm text-foreground">Cambiar tema</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Personaliza los colores de tu perfil</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground/40 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
              </button>
            </CardContent>
          </Card>
        </div>

        {/* ---- RIGHT COLUMN - TABS ---- */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-md overflow-hidden animate-fade-in hover:shadow-lg transition-shadow" style={{ animationDelay: '150ms' }}>
            {/* Tab Navigation */}
            <div className="border-b border-border bg-muted/20">
              <nav className="flex">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2.5 px-4 py-4.5 text-sm font-semibold transition-all relative ${
                      activeTab === tab.id
                        ? 'text-indigo-600'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-4 right-4 h-[3px] bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-t-full" />
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <CardContent className="p-7">
              {/* Tab: Info */}
              {activeTab === 'info' && (
                <div className="space-y-7 animate-fade-in">
                  <div>
                    <h3 className="text-sm font-bold text-foreground mb-5 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-white" />
                      </div>
                      Datos de la cuenta
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: 'Usuario', value: `@${userData.username}`, icon: User, color: 'from-indigo-500 to-violet-500', glow: 'rgba(99,102,241,0.1)' },
                        { label: 'Correo', value: userData.email || 'No registrado', icon: Mail, color: 'from-purple-500 to-pink-500', glow: 'rgba(168,85,247,0.1)' },
                        { label: 'ID Empresa', value: userData.id_empresa || 'No asignado', icon: Building2, color: 'from-blue-500 to-cyan-500', glow: 'rgba(59,130,246,0.1)' },
                        { label: 'Rol', value: userData.rol_nombre || 'Sin rol', icon: ShieldCheck, color: 'from-emerald-500 to-green-500', glow: 'rgba(16,185,129,0.1)' },
                      ].map((field, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-4 p-4.5 bg-muted/30 rounded-xl group hover:bg-muted/50 transition-all border border-transparent hover:border-border/50 hover:shadow-sm"
                          style={{ animationDelay: `${idx * 50}ms` }}
                        >
                          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${field.color} flex items-center justify-center text-white shadow-md flex-shrink-0 group-hover:scale-105 transition-transform`}>
                            <field.icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{field.label}</p>
                            <p className="font-semibold text-foreground truncate text-[15px] mt-0.5">{field.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Recent activity */}
                  <div>
                    <h3 className="text-sm font-bold text-foreground mb-5 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                        <Activity className="w-3.5 h-3.5 text-white" />
                      </div>
                      Actividad reciente
                    </h3>
                    <div className="flex items-start gap-4 p-4.5 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-xl border border-emerald-200/50">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <LogIn className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">Inicio de sesión exitoso</p>
                        <p className="text-[12px] text-muted-foreground mt-0.5">Sesión actual activa</p>
                      </div>
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-[11px] font-semibold">Ahora</Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Security */}
              {activeTab === 'security' && (
                <div className="space-y-7 animate-fade-in">
                  <div>
                    <h3 className="text-sm font-bold text-foreground mb-5 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                        <Lock className="w-3.5 h-3.5 text-white" />
                      </div>
                      Seguridad de la cuenta
                    </h3>

                    <Card className="border-0 shadow-md overflow-hidden bg-gradient-to-br from-indigo-500/5 via-purple-500/5 to-pink-500/5">
                      <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                      <CardContent className="p-6">
                        <div className="flex items-start gap-5">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                            <KeyRound className="w-7 h-7" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-foreground text-base">Contraseña</h4>
                            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                              Mantén tu cuenta segura actualizando tu contraseña regularmente.
                            </p>
                            <Button
                              onClick={openPasswordModal}
                              className="mt-5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-md hover:shadow-lg transition-all"
                              size="lg"
                            >
                              <Pencil className="w-4 h-4 mr-2" />
                              Cambiar contraseña
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="mt-5 border-amber-200/70 bg-gradient-to-r from-amber-50 to-orange-50/50 shadow-sm">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                            <AlertCircle className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-amber-800 text-sm">Recomendaciones de seguridad</h4>
                            <ul className="mt-3 text-sm text-amber-700 space-y-2">
                              {['Usa al menos 8 caracteres', 'Incluye mayúsculas y minúsculas', 'Añade números y símbolos especiales'].map((rec, i) => (
                                <li key={i} className="flex items-center gap-2.5">
                                  <span className="w-2 h-2 bg-amber-400 rounded-full flex-shrink-0" />
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Separator className="my-7" />

                    <div>
                      <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                          <Monitor className="w-3.5 h-3.5 text-white" />
                        </div>
                        Sesión actual
                      </h4>
                      <div className="flex items-center gap-4 p-5 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-xl border border-emerald-200/50">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md">
                          <Monitor className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">Este dispositivo</p>
                          <p className="text-[12px] text-muted-foreground mt-0.5">Navegador web · Activa ahora</p>
                        </div>
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-0 gap-1.5 shadow-sm px-3 py-1.5">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                          Activa
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Access */}
              {activeTab === 'access' && (
                <div className="space-y-7 animate-fade-in">
                  <div>
                    <h3 className="text-sm font-bold text-foreground mb-5 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                        <LayoutGrid className="w-3.5 h-3.5 text-white" />
                      </div>
                      Módulos habilitados
                    </h3>

                    {userData.modulos && userData.modulos.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {userData.modulos.map((modulo, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-4 p-4.5 bg-gradient-to-r from-emerald-500/5 to-green-500/5 rounded-xl border border-emerald-200/50 hover:border-emerald-300 hover:shadow-sm transition-all group"
                          >
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center text-white shadow-md flex-shrink-0 group-hover:scale-105 transition-transform">
                              <Check className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground truncate text-[15px]">{modulo.nombre || modulo}</p>
                              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Acceso habilitado</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 bg-muted/20 rounded-xl border border-dashed border-border">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 flex items-center justify-center shadow-sm">
                          <LayoutGrid className="w-8 h-8 text-indigo-400" />
                        </div>
                        <p className="text-foreground font-semibold text-base">No hay módulos asignados</p>
                        <p className="text-sm text-muted-foreground mt-2">Contacta al administrador para obtener accesos</p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
                        <KeyRound className="w-3.5 h-3.5 text-white" />
                      </div>
                      Tu rol: {userData.rol_nombre || 'Sin rol'}
                    </h4>
                    <Card className="border-indigo-200/50 bg-gradient-to-r from-indigo-500/5 to-cyan-500/5 shadow-sm overflow-hidden">
                      <div className="h-0.5 bg-gradient-to-r from-indigo-500 to-cyan-500" />
                      <CardContent className="p-5">
                        <p className="text-sm text-indigo-700 leading-relaxed">
                          Los permisos y accesos están determinados por tu rol asignado. Si necesitas permisos adicionales, contacta al administrador del sistema.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ===== MODAL: Theme Selector ===== */}
      <Dialog open={showThemeModal} onOpenChange={setShowThemeModal}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
          <div className="p-6 text-white relative overflow-hidden" style={{ background: currentGradient.header }}>
            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'radial-gradient(circle at 30% 70%, white 1px, transparent 1px), radial-gradient(circle at 70% 30%, white 1px, transparent 1px)',
                backgroundSize: '40px 40px, 60px 60px',
              }}
            />
            <DialogHeader className="relative">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/20">
                  <Palette className="w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className="text-white text-xl font-bold">Personalizar tema</DialogTitle>
                  <DialogDescription className="text-white/70">Elige los colores de tu perfil</DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(GRADIENT_CONFIG.presets).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => handleThemeChange(key)}
                  className={`relative p-3 rounded-xl border-2 transition-all hover:shadow-md ${
                    selectedTheme === key
                      ? 'border-indigo-500 ring-2 ring-indigo-200 shadow-md'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <div className="w-full h-16 rounded-lg mb-2 shadow-sm" style={{ background: preset.header }} />
                  <p className="text-xs font-semibold text-foreground">{preset.name}</p>
                  {selectedTheme === key && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-md">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <DialogFooter className="mt-6 pt-4 border-t border-border">
              <Button
                className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white shadow-md hover:shadow-lg transition-all"
                size="lg"
                onClick={() => setShowThemeModal(false)}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Aplicar tema
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== MODAL: Change Password ===== */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <div className="p-6 text-white relative overflow-hidden" style={{ background: currentGradient.header }}>
            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'radial-gradient(circle at 30% 70%, white 1px, transparent 1px), radial-gradient(circle at 70% 30%, white 1px, transparent 1px)',
                backgroundSize: '40px 40px, 60px 60px',
              }}
            />
            <DialogHeader className="relative">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/20">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className="text-white text-xl font-bold">Cambiar Contraseña</DialogTitle>
                  <DialogDescription className="text-white/70">Actualiza tu contraseña de acceso</DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="p-6">
            {passwordError && (
              <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2.5 shadow-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="mb-4 p-3.5 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-2.5 shadow-sm">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                {passwordSuccess}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-5">
              {/* Current password */}
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    Contraseña Actual
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-4 py-3 pr-12 bg-muted/40 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white border border-transparent focus:border-indigo-200 transition-all"
                    placeholder="Ingresa tu contraseña actual"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-muted"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* New password */}
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                    Nueva Contraseña
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-4 py-3 pr-12 bg-muted/40 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white border border-transparent focus:border-indigo-200 transition-all"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-muted"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {passwordData.newPassword && (
                  <div className="mt-2.5 flex items-center gap-2.5">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all rounded-full ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.level / 5) * 100}%` }}
                      />
                    </div>
                    <span className={`text-[11px] font-bold ${
                      passwordStrength.level <= 2 ? 'text-red-600' :
                      passwordStrength.level <= 3 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {passwordStrength.text}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2 block">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    Confirmar Nueva Contraseña
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 pr-12 bg-muted/40 rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white border border-transparent focus:border-indigo-200 transition-all"
                    placeholder="Repite la nueva contraseña"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-muted"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {passwordData.confirmPassword && (
                  <div className="mt-2.5 flex items-center gap-2.5">
                    {passwordData.newPassword === passwordData.confirmPassword ? (
                      <>
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-[11px] font-semibold text-green-600">Las contraseñas coinciden</span>
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4 text-red-500" />
                        <span className="text-[11px] font-semibold text-red-600">Las contraseñas no coinciden</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <DialogFooter className="pt-5 gap-3 sm:gap-3">
                <Button type="button" variant="outline" className="flex-1 shadow-sm" onClick={() => setShowPasswordModal(false)}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white shadow-md hover:shadow-lg transition-all"
                >
                  Guardar cambios
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
