'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/api';
import * as XLSX from 'xlsx';
import { Card, CardContent } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Search,
  Phone,
  PhoneCall,
  PhoneOff,
  PhoneMissed,
  Clock,
  Calendar,
  User,
  FileDown,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  MoreHorizontal,
  Eye,
  Megaphone,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

const formatDuration = (seconds) => {
  if (!seconds && seconds !== 0) return '-';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

export default function LlamadasPage() {
  const { data: session } = useSession();
  const [llamadas, setLlamadas] = useState([]);
  const [tipificaciones, setTipificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTipificacion, setFilterTipificacion] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLlamada, setSelectedLlamada] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [llamadasRes, tipRes] = await Promise.all([
        apiClient.get('/crm/llamadas'),
        apiClient.get('/crm/tipificacion-llamada'),
      ]);
      setLlamadas(llamadasRes.data || []);
      setTipificaciones(tipRes.data || []);
    } catch (err) {
      console.error('Error al cargar llamadas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    let list = llamadas;

    if (filterTipificacion !== 'todos') {
      list = list.filter(l => String(l.id_tipificacion_llamada) === filterTipificacion);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(l =>
        l.contacto_nombre?.toLowerCase().includes(q) ||
        l.telefono?.includes(q) ||
        l.campania_nombre?.toLowerCase().includes(q) ||
        l.tipificacion_llamada_nombre?.toLowerCase().includes(q) ||
        l.provider_call_id?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [llamadas, search, filterTipificacion]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setCurrentPage(1); }, [search, filterTipificacion]);

  const stats = useMemo(() => {
    const total = llamadas.length;
    const conTipificacion = llamadas.filter(l => l.id_tipificacion_llamada).length;
    const sinTipificacion = total - conTipificacion;
    return { total, conTipificacion, sinTipificacion };
  }, [llamadas]);

  const handleExport = () => {
    const data = filtered.map(l => ({
      'ID': l.id,
      'Contacto': l.contacto_nombre || '-',
      'Telefono': l.telefono || '-',
      'Campaña': l.campania_nombre || '-',
      'Tipificacion': l.tipificacion_llamada_nombre || '-',
      'Fecha Inicio': l.fecha_inicio || '-',
      'Fecha Fin': l.fecha_fin || '-',
      'Duracion (seg)': l.duracion_seg ?? '-',
      'Provider Call ID': l.provider_call_id || '-',
      'Fecha Registro': l.fecha_registro ? new Date(l.fecha_registro).toLocaleDateString('es-PE') : '-',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Llamadas');
    XLSX.writeFile(wb, 'llamadas.xlsx');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const handleViewDetail = (llamada) => {
    setSelectedLlamada(llamada);
    setShowDetailModal(true);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Llamadas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Registro de llamadas por empresa
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
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
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Phone className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total llamadas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-white">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <PhoneCall className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-700">{stats.conTipificacion}</p>
              <p className="text-xs text-muted-foreground">Con tipificacion</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-white">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <PhoneMissed className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-700">{stats.sinTipificacion}</p>
              <p className="text-xs text-muted-foreground">Sin tipificacion</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y tabla */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar contacto, teléfono, campaña..."
                className="pl-9 h-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Filtro por tipificacion */}
            <select
              value={filterTipificacion}
              onChange={e => setFilterTipificacion(e.target.value)}
              className="h-9 px-3 rounded-lg border text-xs bg-background"
            >
              <option value="todos">Todas las tipificaciones</option>
              {tipificaciones.map(t => (
                <option key={t.id} value={String(t.id)}>{t.nombre}</option>
              ))}
            </select>

            <span className="text-xs text-muted-foreground ml-auto">
              {filtered.length} llamada{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Tabla */}
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Cargando llamadas...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
              <PhoneOff className="h-10 w-10 opacity-30" />
              <p className="text-sm">No se encontraron llamadas</p>
            </div>
          ) : (
            <div className="rounded-xl border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs">Contacto</TableHead>
                    <TableHead className="text-xs">Telefono</TableHead>
                    <TableHead className="text-xs">Campaña</TableHead>
                    <TableHead className="text-xs">Tipificacion</TableHead>
                    <TableHead className="text-xs">Duracion</TableHead>
                    <TableHead className="text-xs">Fecha Inicio</TableHead>
                    <TableHead className="text-xs">Registro</TableHead>
                    <TableHead className="text-xs w-12">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((llamada) => (
                    <TableRow key={llamada.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                            <User className="h-3.5 w-3.5 text-blue-600" />
                          </div>
                          <div>
                            <span className="text-sm font-medium">{llamada.contacto_nombre || <span className="text-muted-foreground italic">Sin nombre</span>}</span>
                            {llamada.numero_documento && (
                              <p className="text-[10px] text-muted-foreground">{llamada.numero_documento}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          {llamada.telefono || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {llamada.campania_nombre ? (
                          <div className="flex items-center gap-1.5 text-sm">
                            <Megaphone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            {llamada.campania_nombre}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {llamada.tipificacion_llamada_nombre ? (
                          <Badge
                            variant="outline"
                            className="text-xs font-medium border"
                            style={{
                              color: getColorHex(llamada.tipificacion_llamada_color),
                              borderColor: getColorHex(llamada.tipificacion_llamada_color) + '55',
                              backgroundColor: getColorHex(llamada.tipificacion_llamada_color) + '12',
                            }}
                          >
                            {llamada.tipificacion_llamada_nombre}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            Sin tipificar
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 shrink-0" />
                          {formatDuration(llamada.duracion_seg)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          {formatDateTime(llamada.fecha_inicio)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          {formatDate(llamada.fecha_registro)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => handleViewDetail(llamada)} className="gap-2 text-xs">
                              <Eye className="h-3.5 w-3.5" />
                              Ver detalle
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Paginacion */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Pagina {currentPage} de {totalPages}
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

      {/* Modal Detalle */}
      <Dialog open={showDetailModal} onOpenChange={(open) => { if (!open) { setShowDetailModal(false); setSelectedLlamada(null); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Phone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <span>Detalle de Llamada #{selectedLlamada?.id}</span>
                <p className="text-xs font-normal text-muted-foreground mt-0.5">Informacion completa de la llamada</p>
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">Detalle de la llamada</DialogDescription>
          </DialogHeader>
          {selectedLlamada && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Contacto</p>
                  <p className="text-sm font-medium">{selectedLlamada.contacto_nombre || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Telefono</p>
                  <p className="text-sm font-medium">{selectedLlamada.telefono || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Documento</p>
                  <p className="text-sm font-medium">{selectedLlamada.numero_documento || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Campaña</p>
                  <p className="text-sm font-medium">{selectedLlamada.campania_nombre || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tipificacion</p>
                  {selectedLlamada.tipificacion_llamada_nombre ? (
                    <Badge
                      variant="outline"
                      className="text-xs font-medium border"
                      style={{
                        color: getColorHex(selectedLlamada.tipificacion_llamada_color),
                        borderColor: getColorHex(selectedLlamada.tipificacion_llamada_color) + '55',
                        backgroundColor: getColorHex(selectedLlamada.tipificacion_llamada_color) + '12',
                      }}
                    >
                      {selectedLlamada.tipificacion_llamada_nombre}
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">Sin tipificar</span>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Duracion</p>
                  <p className="text-sm font-medium">{formatDuration(selectedLlamada.duracion_seg)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Fecha Inicio</p>
                  <p className="text-sm font-medium">{formatDateTime(selectedLlamada.fecha_inicio)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Fecha Fin</p>
                  <p className="text-sm font-medium">{formatDateTime(selectedLlamada.fecha_fin)}</p>
                </div>
              </div>
              {selectedLlamada.provider_call_id && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Provider Call ID</p>
                  <p className="text-xs font-mono bg-muted/50 px-2 py-1 rounded">{selectedLlamada.provider_call_id}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Fecha Registro</p>
                <p className="text-sm">{formatDateTime(selectedLlamada.fecha_registro)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
