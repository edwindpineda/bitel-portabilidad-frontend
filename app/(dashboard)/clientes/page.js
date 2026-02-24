'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/api';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Users,
  UserCheck,
  UserCheck2,
  TrendingUp,
  FileDown,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Phone,
  Calendar,
  User,
  Briefcase,
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

const PAGE_SIZE = 20;

export default function ClientesPage() {
  const { data: session } = useSession();
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterOrigen, setFilterOrigen] = useState('todos'); // 'todos' | 'prospecto' | 'directo'
  const [currentPage, setCurrentPage] = useState(1);

  const loadClientes = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/crm/clientes');
      setClientes(res.data || []);
    } catch (err) {
      console.error('Error al cargar clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.accessToken) {
      loadClientes();
    }
  }, [session?.accessToken]);

  // Filtrado
  const filtered = useMemo(() => {
    let list = clientes;

    if (filterOrigen === 'prospecto') {
      list = list.filter(c => c.fue_prospecto === 1);
    } else if (filterOrigen === 'directo') {
      list = list.filter(c => !c.fue_prospecto || c.fue_prospecto === 0);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(c =>
        c.nombre_completo?.toLowerCase().includes(q) ||
        c.celular?.includes(q) ||
        c.dni?.includes(q) ||
        c.asesor_nombre?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [clientes, search, filterOrigen]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setCurrentPage(1); }, [search, filterOrigen]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = clientes.length;
    const convertidos = clientes.filter(c => c.fue_prospecto === 1).length;
    const directos = total - convertidos;
    return { total, convertidos, directos };
  }, [clientes]);

  const handleExport = () => {
    const data = filtered.map(c => ({
      'Nombre': c.nombre_completo || '-',
      'Celular': c.celular || '-',
      'DNI': c.dni || '-',
      'Asesor': c.asesor_nombre || '-',
      'Plan': c.plan_nombre || '-',
      'Estado': c.estado_nombre || '-',
      'Origen': c.fue_prospecto ? 'Prospecto convertido' : 'Cliente directo',
      'Fecha registro': c.fecha_registro ? new Date(c.fecha_registro).toLocaleDateString('es-PE') : '-',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
    XLSX.writeFile(wb, 'clientes.xlsx');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Personas con tipo de persona = Cliente (convertidos o directos)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadClientes} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={loading || filtered.length === 0}>
            <FileDown className="h-4 w-4 mr-1.5" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-700">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total clientes</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{stats.convertidos}</p>
              <p className="text-xs text-muted-foreground">Prospectos convertidos</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-violet-50 to-white">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <UserCheck className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-violet-700">{stats.directos}</p>
              <p className="text-xs text-muted-foreground">Clientes directos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y tabla */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-4">
          {/* Barra de filtros */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar nombre, celular, DNI..."
                className="pl-9 h-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Filtro por origen */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50 border">
              {[
                { key: 'todos', label: 'Todos' },
                { key: 'prospecto', label: 'Convertidos' },
                { key: 'directo', label: 'Directos' },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setFilterOrigen(opt.key)}
                  className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all ${
                    filterOrigen === opt.key
                      ? 'bg-white shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <span className="text-xs text-muted-foreground ml-auto">
              {filtered.length} cliente{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Tabla */}
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Cargando clientes...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <UserCheck2 className="h-10 w-10 opacity-30" />
              <p className="text-sm">No se encontraron clientes</p>
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs">Nombre</TableHead>
                    <TableHead className="text-xs">Celular</TableHead>
                    <TableHead className="text-xs">DNI</TableHead>
                    <TableHead className="text-xs">Asesor</TableHead>
                    <TableHead className="text-xs">Plan</TableHead>
                    <TableHead className="text-xs">Estado</TableHead>
                    <TableHead className="text-xs">Origen</TableHead>
                    <TableHead className="text-xs">Registro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((cliente) => (
                    <TableRow key={cliente.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <User className="h-3.5 w-3.5 text-emerald-600" />
                          </div>
                          <span className="text-sm font-medium">{cliente.nombre_completo || <span className="text-muted-foreground italic">Sin nombre</span>}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          {cliente.celular || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{cliente.dni || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <User className="h-3.5 w-3.5 shrink-0" />
                          {cliente.asesor_nombre || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {cliente.plan_nombre ? (
                          <div className="flex items-center gap-1.5 text-sm">
                            <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            {cliente.plan_nombre}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {cliente.estado_nombre ? (
                          <Badge
                            variant="outline"
                            className="text-xs font-medium border"
                            style={{
                              color: getColorHex(cliente.estado_color),
                              borderColor: getColorHex(cliente.estado_color) + '55',
                              backgroundColor: getColorHex(cliente.estado_color) + '12',
                            }}
                          >
                            {cliente.estado_nombre}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {cliente.fue_prospecto === 1 ? (
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0 text-xs gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Convertido
                          </Badge>
                        ) : (
                          <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100 border-0 text-xs gap-1">
                            <UserCheck className="h-3 w-3" />
                            Directo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          {formatDate(cliente.fecha_registro)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Paginación */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                  <ChevronsLeft className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                  <ChevronsRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
