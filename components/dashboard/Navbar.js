'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Shield,
} from 'lucide-react';

const USER_STORAGE_KEY = 'crm_user_data';

export default function Navbar() {
  const { data: session, status } = useSession();
  const [user, setUser] = useState({
    username: 'Usuario',
    rol_nombre: 'Sin rol',
    email: '',
  });

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const userData = {
        username: session.user.username || session.user.name || 'Usuario',
        rol_nombre: session.user.rol_nombre || 'Sin rol',
        email: session.user.email || '',
      };
      setUser(userData);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    } else if (status === 'loading') {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch (e) {
          console.error('Error parsing stored user data');
        }
      }
    }
  }, [session, status]);

  const handleLogout = () => {
    localStorage.removeItem(USER_STORAGE_KEY);
    signOut({ callbackUrl: '/login' });
  };

  return (
    <header
      className="h-16 flex items-center justify-between px-6 relative z-10"
      style={{
        background: 'linear-gradient(135deg, #0f0e1a 0%, #1a1830 50%, #1e1b3a 100%)',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 4px 20px -2px rgba(99, 102, 241, 0.08)',
      }}
    >
      {/* Search Bar */}
      <div className="flex-1 max-w-lg">
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-400/60 group-focus-within:text-cyan-400 transition-colors" />
          <input
            type="search"
            placeholder="Buscar conversaciones, clientes..."
            className="block w-full pl-10 pr-4 py-2 bg-white/[0.06] border border-white/[0.08] rounded-xl text-sm text-white/90 placeholder-indigo-300/40 focus:outline-none focus:bg-white/[0.1] focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all duration-200"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 ml-6">
        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-xl text-indigo-300/60 hover:text-white hover:bg-white/[0.08] transition-all duration-200"
        >
          <Bell className="h-[18px] w-[18px]" />
        </Button>

        {/* Separator */}
        <div className="h-6 w-px bg-white/[0.08] mx-1" />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2.5 pl-1.5 pr-2 py-1.5 h-auto rounded-xl hover:bg-white/[0.08] transition-all duration-200"
            >
              <Avatar className="h-8 w-8 rounded-lg ring-2 ring-white/[0.1]">
                <AvatarFallback
                  className="rounded-lg text-white font-semibold text-xs"
                  style={{ background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)' }}
                >
                  {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-left hidden md:block">
                <p className="text-[13px] font-medium text-white/90 leading-tight">{user.username}</p>
                <p className="text-[11px] text-indigo-300/50 leading-tight">{user.rol_nombre}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-indigo-300/40 hidden md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 p-1.5" sideOffset={8}>
            <div className="px-3 py-3 mb-1">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 rounded-lg">
                  <AvatarFallback
                    className="rounded-lg text-white font-semibold text-sm"
                    style={{ background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)' }}
                  >
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{user.username}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
              <Badge variant="secondary" className="mt-2.5 text-[11px] gap-1">
                <Shield className="h-3 w-3" />
                {user.rol_nombre}
              </Badge>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="rounded-lg py-2.5 px-3 cursor-pointer">
              <Link href="/perfil" className="flex items-center gap-2.5">
                <User className="h-4 w-4 text-muted-foreground" />
                Mi Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-lg py-2.5 px-3 cursor-pointer">
              <Link href="/configuracion" className="flex items-center gap-2.5">
                <Settings className="h-4 w-4 text-muted-foreground" />
                Configuracion
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="rounded-lg py-2.5 px-3 text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
            >
              <LogOut className="h-4 w-4 mr-2.5" />
              Cerrar Sesion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
