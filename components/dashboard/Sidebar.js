'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { apiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import {
  Home,
  MessageCircle,
  Users,
  BarChart3,
  Megaphone,
  Building2,
  Package,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Mic,
  LayoutGrid,
} from 'lucide-react';

const WhatsAppIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const SUPER_ADMIN_MENU = [
  { name: 'Administración', icon: Building2, path: '/administracion', badge: null },
];

const ENCUESTAS_MENU = [
  { name: 'Encuestas', icon: BarChart3, path: '/encuestas', badge: null },
];

const BASE_MENU = [
  { name: 'Dashboard', icon: Home, path: '/dashboard', badge: null },
  { name: 'Conversaciones', icon: MessageCircle, path: '/conversaciones', badge: null },
  { name: 'Leads', icon: Users, path: '/leads', badge: null },
  { name: 'Reportes', icon: BarChart3, path: '/reportes', badge: null },
  { name: 'Campañas', icon: Megaphone, path: '/campanias', badge: null },
  { name: 'Configuración', icon: Settings, path: '/configuracion', badge: null },
];

function NavItem({ item, pathname, isCollapsed, isExpanded, onToggleSubmenu }) {
  const Icon = item.icon;
  const isActive = pathname === item.path || (item.submenu && item.submenu.some((sub) => pathname === sub.path));
  const hasSubmenu = item.submenu && item.submenu.length > 0;

  const linkContent = (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-all duration-200 relative',
        isActive
          ? 'bg-white/[0.12] text-white font-medium'
          : 'text-indigo-200/70 hover:bg-white/[0.06] hover:text-white',
        isCollapsed && 'justify-center px-0 py-2.5 mx-1'
      )}
    >
      {isActive && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
          style={{ background: 'linear-gradient(180deg, #06b6d4, #6366f1)' }}
        />
      )}
      <span className={cn('transition-colors', isActive ? 'text-cyan-400' : 'text-indigo-400/50')}>
        <Icon className="h-[18px] w-[18px] shrink-0" />
      </span>
      {!isCollapsed && (
        <>
          <span className="flex-1">{item.name}</span>
          {item.badge && (
            <span className="h-5 min-w-5 flex items-center justify-center text-[10px] font-bold px-1.5 rounded-full bg-cyan-500 text-white shadow-lg shadow-cyan-500/30">
              {item.badge}
            </span>
          )}
        </>
      )}
    </div>
  );

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Link href={item.path} className="relative block">
            {linkContent}
            {item.badge && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center text-[9px] font-bold bg-cyan-500 text-white rounded-full shadow-lg shadow-cyan-500/30">
                {item.badge}
              </span>
            )}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={12}>
          {item.name}
        </TooltipContent>
      </Tooltip>
    );
  }

  if (hasSubmenu) {
    return (
      <Collapsible open={isExpanded} onOpenChange={() => onToggleSubmenu(item.name)}>
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-all duration-200 relative',
              isActive
                ? 'bg-white/[0.12] text-white font-medium'
                : 'text-indigo-200/70 hover:bg-white/[0.06] hover:text-white'
            )}
          >
            {isActive && (
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                style={{ background: 'linear-gradient(180deg, #06b6d4, #6366f1)' }}
              />
            )}
            <span className={cn('transition-colors', isActive ? 'text-cyan-400' : 'text-indigo-400/50')}>
              <Icon className="h-[18px] w-[18px] shrink-0" />
            </span>
            <span className="flex-1 text-left">{item.name}</span>
            <ChevronDown className={cn('h-3.5 w-3.5 text-indigo-400/40 transition-transform duration-200', isExpanded && 'rotate-180')} />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-1 ml-[22px] pl-4 space-y-0.5" style={{ borderLeft: '1px solid rgba(99, 102, 241, 0.15)' }}>
            {item.submenu.map((subItem) => {
              const isSubActive = pathname === subItem.path;
              return (
                <Link
                  key={subItem.path}
                  href={subItem.path}
                  className={cn(
                    'block px-3 py-2 rounded-lg text-[13px] transition-all duration-200',
                    isSubActive
                      ? 'bg-white/[0.1] text-white font-medium'
                      : 'text-indigo-300/50 hover:bg-white/[0.06] hover:text-indigo-100'
                  )}
                >
                  {subItem.name}
                </Link>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return <Link href={item.path}>{linkContent}</Link>;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: session, status } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);
  const [expandedMenus, setExpandedMenus] = useState({});

  // Validar que la sesión tenga id_empresa
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const idEmpresa = session.user.id_empresa;
      if (idEmpresa === undefined || idEmpresa === null || idEmpresa === '') {
        console.error('Sesión inválida: id_empresa no encontrado, redirigiendo a login');
        signOut({ redirect: false }).then(() => {
          window.location.href = '/login';
        });
      }
    }
  }, [session, status]);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await apiClient.get('/crm/contactos/unread/count');
        setUnreadCount(response.data?.data?.unreadCount || 0);
      } catch (error) {
        console.error('Error al cargar conteo de no leidos:', error);
      }
    };

    if (session?.accessToken) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [session?.accessToken]);

  const menuItems = useMemo(() => {
    return BASE_MENU.map(item => {
      if (item.name === 'Conversaciones') {
        return { ...item, badge: unreadCount > 0 ? unreadCount : null };
      }
      return item;
    });
  }, [unreadCount]);

  useEffect(() => {
    menuItems.forEach((item) => {
      if (item.submenu) {
        const isInSubmenu = item.submenu.some((sub) => pathname.startsWith(sub.path));
        if (isInSubmenu) {
          setExpandedMenus((prev) => {
            if (prev[item.name]) return prev;
            return { ...prev, [item.name]: true };
          });
        }
      }
    });
  }, [pathname, menuItems]);

  const toggleSubmenu = useCallback((menuName) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  }, []);

  const isSuperAdmin = session?.user?.id_rol === 1 && (session?.user?.id_empresa === 0 || session?.user?.id_empresa === '0');
  const isEncuestasEmpresa = session?.user?.id_empresa === 3 || session?.user?.id_empresa === '3';

  const filteredMenuItems = useMemo(() => {
    if (!session?.user) return menuItems;

    if (isSuperAdmin) {
      return SUPER_ADMIN_MENU;
    }

    if (isEncuestasEmpresa) {
      return ENCUESTAS_MENU;
    }

    if (session.user.id_rol === 1) {
      return menuItems;
    }

    const userModulos = session.user.modulos || [];
    const allowedRoutes = userModulos.map(m => m.ruta);
    return menuItems.filter(item => allowedRoutes.includes(item.path));
  }, [session?.user, isSuperAdmin, isEncuestasEmpresa, menuItems]);

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'flex flex-col transition-all duration-300 relative',
          isCollapsed ? 'w-[68px]' : 'w-64'
        )}
        style={{
          background: 'linear-gradient(180deg, #13112b 0%, #1e1b4b 40%, #252266 100%)',
        }}
      >
        {/* Subtle glow overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            background: 'radial-gradient(ellipse at top left, rgba(99, 102, 241, 0.15), transparent 60%)',
          }}
        />

        {/* Logo */}
        <div
          className="h-16 flex items-center justify-between px-4 relative z-10"
          style={{
            background: 'linear-gradient(135deg, #0f0e1a 0%, #1a1830 50%, #1e1b3a 100%)',
            boxShadow: '0 1px 0 0 rgba(255, 255, 255, 0.04)',
          }}
        >
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                    boxShadow: '0 4px 12px -2px rgba(99, 102, 241, 0.4)',
                  }}
                >
                  <Mic className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="text-[15px] font-bold text-white tracking-wide">AI-YOU</span>
                  <p className="text-[10px] text-indigo-400/40 leading-none -mt-0.5">CRM Platform</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg text-indigo-400/40 hover:text-white hover:bg-white/[0.08]"
                onClick={() => setIsCollapsed(true)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1 w-full">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                  boxShadow: '0 4px 12px -2px rgba(99, 102, 241, 0.4)',
                }}
              >
                <Mic className="w-4 h-4 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Expand button when collapsed */}
        {isCollapsed && (
          <div className="flex justify-center py-2.5 relative z-10" style={{ boxShadow: '0 1px 0 0 rgba(255, 255, 255, 0.04)' }}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg text-indigo-400/40 hover:text-white hover:bg-white/[0.08]"
              onClick={() => setIsCollapsed(false)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-0.5 relative z-10" style={{ maxHeight: 'calc(100vh - 80px)' }}>
          {!isCollapsed && (
            <p className="text-[10px] font-semibold text-indigo-400/30 uppercase tracking-widest px-3 mb-3">Menu</p>
          )}
          {filteredMenuItems.map((item) => (
            <NavItem
              key={item.path}
              item={item}
              pathname={pathname}
              isCollapsed={isCollapsed}
              isExpanded={expandedMenus[item.name]}
              onToggleSubmenu={toggleSubmenu}
            />
          ))}
        </nav>
      </aside>
    </TooltipProvider>
  );
}
