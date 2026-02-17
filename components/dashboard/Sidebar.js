'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { apiClient } from '@/lib/api';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: session, status } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

  // Validar que la sesión tenga id_empresa
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Si la sesión no tiene id_empresa definido (no es 0 ni un número válido), redirigir a login
      const idEmpresa = session.user.id_empresa;
      if (idEmpresa === undefined || idEmpresa === null || idEmpresa === '') {
        console.error('Sesión inválida: id_empresa no encontrado, redirigiendo a login');
        signOut({ callbackUrl: '/login' });
      }
    }
  }, [session, status]);

  // Cargar conteo de mensajes no leidos
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
      // Actualizar cada 30 segundos
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [session?.accessToken]);

  // Menú para Super Admin (id_rol=1 y id_empresa=0)
  const superAdminMenuItems = [
    {
      name: 'Administración',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      path: '/administracion',
      badge: null,
    },
  ];

  // Menú normal para usuarios de empresa
  const menuItems = [
    {
      name: 'Dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      path: '/dashboard',
      badge: null,
    },
    {
      name: 'Conversaciones',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      path: '/conversaciones',
      badge: unreadCount > 0 ? unreadCount : null,
    },
    {
      name: 'Leads',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      path: '/leads',
      badge: null,
    },
    {
      name: 'Reportes',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      path: '/reportes',
      badge: null,
    },
    {
      name: 'Campañas',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
      path: '/campanias',
      badge: null,
    },
    {
      name: 'Configuración',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      path: '/configuracion',
      badge: null,
    },
  ];

  // Menú exclusivo para id_empresa = 3 (Encuestas)
  const encuestasMenuItem = {
    name: 'Encuestas',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    path: '/encuestas',
    badge: null,
  };

  // Verificar si es Super Admin (id_rol=1 y id_empresa=0 explícitamente)
  const isSuperAdmin = session?.user?.id_rol === 1 && (session?.user?.id_empresa === 0 || session?.user?.id_empresa === '0');

  // Debug logs
  console.log('=== SIDEBAR DEBUG ===');
  console.log('Session:', session);
  console.log('Session User:', session?.user);
  console.log('id_rol:', session?.user?.id_rol, 'tipo:', typeof session?.user?.id_rol);
  console.log('id_empresa:', session?.user?.id_empresa, 'tipo:', typeof session?.user?.id_empresa);
  console.log('isSuperAdmin:', isSuperAdmin);
  console.log('=====================');

  // Verificar si es empresa con acceso a Encuestas (id_empresa = 3)
  const isEncuestasEmpresa = session?.user?.id_empresa === 3 || session?.user?.id_empresa === '3';

  // Menú exclusivo para empresa de Encuestas (id_empresa = 3)
  const encuestasMenuItems = [encuestasMenuItem];

  // Filtrar menu items basado en los módulos del usuario
  const filteredMenuItems = useMemo(() => {
    if (!session?.user) return menuItems;

    // Si es Super Admin (id_rol=1 y id_empresa=0), solo mostrar Administración
    if (isSuperAdmin) {
      return superAdminMenuItems;
    }

    // Si es empresa de Encuestas (id_empresa = 3), solo mostrar Encuestas
    if (isEncuestasEmpresa) {
      return encuestasMenuItems;
    }

    // Si es administrador de empresa (rol 1 con id_empresa > 0), mostrar todo
    if (session.user.id_rol === 1) {
      return menuItems;
    }

    // Para otros roles, filtrar por módulos permitidos
    const userModulos = session.user.modulos || [];
    const allowedRoutes = userModulos.map(m => m.ruta);

    return menuItems.filter(item => allowedRoutes.includes(item.path));
  }, [session?.user, menuItems, isSuperAdmin, superAdminMenuItems, isEncuestasEmpresa, encuestasMenuItems]);

  return (
    <aside
      className={`transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
      style={{ background: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 50%, #3730a3 100%)' }}
    >
      {/* Logo y Toggle */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-700/50" style={{ background: 'linear-gradient(135deg, rgb(17, 19, 26), rgb(27, 30, 39))' }}>
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)' }}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white">AI-YOU</span>
          </div>
        )}
        {isCollapsed && (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto shadow-lg" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)' }}>
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
        )}
        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-indigo-200 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Botón expandir cuando está colapsado */}
      {isCollapsed && (
        <div className="flex justify-center py-3 border-b border-indigo-700/50">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-indigo-200 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Menu Items */}
      <nav className="p-3 space-y-1">
        {filteredMenuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${
                isActive
                  ? 'bg-white/20 text-white font-medium shadow-lg backdrop-blur-sm'
                  : 'text-indigo-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'space-x-3'}`}>
                <span className={isActive ? 'text-cyan-300' : 'text-indigo-300'}>
                  {item.icon}
                </span>
                {!isCollapsed && <span>{item.name}</span>}
              </div>
              {!isCollapsed && item.badge && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-cyan-500 text-white rounded-full shadow-md">
                  {item.badge}
                </span>
              )}
              {isCollapsed && item.badge && (
                <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs font-semibold bg-cyan-500 text-white rounded-full shadow-md">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

    </aside>
  );
}
