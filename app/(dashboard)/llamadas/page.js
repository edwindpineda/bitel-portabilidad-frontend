'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
  Volume2,
  Download,
  Play,
  X,
  Eraser,
  CircleDot,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
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
  'indigo': '#14B8A6',
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

// Formatear fecha con zona horaria Lima/Perú
const formatFechaAmPm = (fecha) => {
  if (!fecha) return '-';
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('es-PE', {
    timeZone: 'America/Lima',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).replace(',', '');
};

export default function LlamadasPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const idCampaniaEjecucion = searchParams.get('id_campania_ejecucion');

  const [llamadas, setLlamadas] = useState([]);
  const [tipificaciones, setTipificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTipificacion, setFilterTipificacion] = useState('todos');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterGrabacion, setFilterGrabacion] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState(null);
  const [sortField, setSortField] = useState('fecha_inicio');
  const [sortDirection, setSortDirection] = useState('desc');

  const loadData = async () => {
    try {
      setLoading(true);
      const endpoint = idCampaniaEjecucion
        ? `/crm/llamadas/ejecucion/${idCampaniaEjecucion}`
        : '/crm/llamadas';
      const [llamadasRes, tipRes] = await Promise.all([
        apiClient.get(endpoint),
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
  }, [idCampaniaEjecucion]);

  // Obtener estados unicos
  const estadosUnicos = useMemo(() => {
    return [...new Set(llamadas.map(l => l.estado_llamada_nombre).filter(Boolean))].sort();
  }, [llamadas]);

  const filtered = useMemo(() => {
    let list = llamadas;

    if (filterTipificacion !== 'todos') {
      list = list.filter(l => String(l.id_tipificacion_llamada) === filterTipificacion);
    }

    if (filterEstado !== 'todos') {
      list = list.filter(l => l.estado_llamada_nombre === filterEstado);
    }

    if (filterGrabacion === 'con') {
      list = list.filter(l => l.archivo_llamada);
    } else if (filterGrabacion === 'sin') {
      list = list.filter(l => !l.archivo_llamada);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(l =>
        String(l.codigo_llamada || '').includes(q) ||
        l.contacto_nombre?.toLowerCase().includes(q) ||
        l.telefono?.includes(q) ||
        l.campania_nombre?.toLowerCase().includes(q) ||
        l.tipificacion_llamada_nombre?.toLowerCase().includes(q) ||
        l.provider_call_id?.toLowerCase().includes(q)
      );
    }

    // Ordenamiento
    if (sortField) {
      list = [...list].sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];

        // Manejar valores nulos
        if (aVal == null) aVal = '';
        if (bVal == null) bVal = '';

        // Comparar fechas
        if (sortField.includes('fecha')) {
          aVal = aVal ? new Date(aVal).getTime() : 0;
          bVal = bVal ? new Date(bVal).getTime() : 0;
        }
        // Comparar números
        else if (sortField === 'duracion_seg' || sortField === 'codigo_llamada') {
          aVal = Number(aVal) || 0;
          bVal = Number(bVal) || 0;
        }
        // Comparar strings
        else if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = String(bVal).toLowerCase();
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return list;
  }, [llamadas, search, filterTipificacion, filterEstado, filterGrabacion, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />;
    return sortDirection === 'asc'
      ? <ArrowUp className="h-3 w-3 text-blue-500" />
      : <ArrowDown className="h-3 w-3 text-blue-500" />;
  };

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setCurrentPage(1); }, [search, filterTipificacion, filterEstado, filterGrabacion]);

  const stats = useMemo(() => {
    const total = llamadas.length;
    const conTipificacion = llamadas.filter(l => l.id_tipificacion_llamada).length;
    const sinTipificacion = total - conTipificacion;
    const completadas = llamadas.filter(l => l.id_estado_llamada === 4).length;
    const conGrabacion = llamadas.filter(l => l.archivo_llamada).length;
    return { total, conTipificacion, sinTipificacion, completadas, conGrabacion };
  }, [llamadas]);

  const handleExport = () => {
    const data = filtered.map(l => ({
      'Codigo': l.codigo_llamada || '-',
      'Contacto': l.contacto_nombre || '-',
      'Telefono': l.telefono || '-',
      'Campaña': l.campania_nombre || '-',
      'Estado': l.estado_llamada_nombre || '-',
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

  const handlePlayAudio = (llamada) => {
    setSelectedAudio(llamada);
    setShowAudioModal(true);
  };

  const getAudioUrl = (archivoLlamada) => {
    if (!archivoLlamada) return null;
    if (archivoLlamada.startsWith('http')) return archivoLlamada;
    return `${process.env.NEXT_PUBLIC_API_URL || ''}/uploads/llamadas/${archivoLlamada}`;
  };

  const handleDownloadAudio = () => {
    if (!selectedAudio?.archivo_llamada) return;
    const url = getAudioUrl(selectedAudio.archivo_llamada);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedAudio.archivo_llamada;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Banner filtro por ejecucion */}
      {idCampaniaEjecucion && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50 border border-purple-200">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">
              Mostrando llamadas de la ejecucion #{idCampaniaEjecucion}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/llamadas')}
            className="text-purple-600 hover:text-purple-800 hover:bg-purple-100 gap-1"
          >
            <X className="h-3.5 w-3.5" />
            Ver todas
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Llamadas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {idCampaniaEjecucion ? `Llamadas de ejecucion #${idCampaniaEjecucion}` : 'Registro de llamadas por empresa'}
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
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Phone className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{stats.total.toLocaleString('es-PE')}</p>
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
              <p className="text-2xl font-bold text-emerald-700">{stats.conTipificacion.toLocaleString('es-PE')}</p>
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
              <p className="text-2xl font-bold text-orange-700">{stats.sinTipificacion.toLocaleString('es-PE')}</p>
              <p className="text-xs text-muted-foreground">Sin tipificacion</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
              <CircleDot className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-700">{stats.completadas.toLocaleString('es-PE')}</p>
              <p className="text-xs text-muted-foreground">Completadas</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-white">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Volume2 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-700">{stats.conGrabacion.toLocaleString('es-PE')}</p>
              <p className="text-xs text-muted-foreground">Con grabacion</p>
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

            {/* Filtro por estado */}
            <select
              value={filterEstado}
              onChange={e => setFilterEstado(e.target.value)}
              className="h-9 px-3 rounded-lg border text-xs bg-background"
            >
              <option value="todos">Todos los estados</option>
              {estadosUnicos.map(estado => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </select>

            {/* Filtro por grabacion */}
            <select
              value={filterGrabacion}
              onChange={e => setFilterGrabacion(e.target.value)}
              className="h-9 px-3 rounded-lg border text-xs bg-background"
            >
              <option value="todos">Todas las llamadas</option>
              <option value="con">Con grabacion</option>
              <option value="sin">Sin grabacion</option>
            </select>

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

            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-muted-foreground">
                {filtered.length} llamada{filtered.length !== 1 ? 's' : ''}
              </span>
              {(search || filterTipificacion !== 'todos' || filterEstado !== 'todos' || filterGrabacion !== 'todos') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    setFilterTipificacion('todos');
                    setFilterEstado('todos');
                    setFilterGrabacion('todos');
                  }}
                  className="gap-1.5 h-8 text-xs"
                >
                  <Eraser className="h-3.5 w-3.5" />
                  Limpiar
                </Button>
              )}
            </div>
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
                    <TableHead className="text-xs w-16 uppercase font-semibold" style={{ color: 'rgb(20 184 166 / 0.7)' }}>
                      <button onClick={() => handleSort('codigo_llamada')} className="flex items-center gap-1 hover:opacity-80">
                        CODIGO <SortIcon field="codigo_llamada" />
                      </button>
                    </TableHead>
                    <TableHead className="text-xs uppercase font-semibold" style={{ color: 'rgb(20 184 166 / 0.7)' }}>
                      <button onClick={() => handleSort('contacto_nombre')} className="flex items-center gap-1 hover:opacity-80">
                        CONTACTO <SortIcon field="contacto_nombre" />
                      </button>
                    </TableHead>
                    <TableHead className="text-xs uppercase font-semibold" style={{ color: 'rgb(20 184 166 / 0.7)' }}>
                      <button onClick={() => handleSort('telefono')} className="flex items-center gap-1 hover:opacity-80">
                        TELEFONO <SortIcon field="telefono" />
                      </button>
                    </TableHead>
                    <TableHead className="text-xs uppercase font-semibold" style={{ color: 'rgb(20 184 166 / 0.7)' }}>
                      <button onClick={() => handleSort('campania_nombre')} className="flex items-center gap-1 hover:opacity-80">
                        CAMPAÑA <SortIcon field="campania_nombre" />
                      </button>
                    </TableHead>
                    <TableHead className="text-xs uppercase font-semibold" style={{ color: 'rgb(20 184 166 / 0.7)' }}>
                      <button onClick={() => handleSort('estado_llamada_nombre')} className="flex items-center gap-1 hover:opacity-80">
                        ESTADO <SortIcon field="estado_llamada_nombre" />
                      </button>
                    </TableHead>
                    <TableHead className="text-xs uppercase font-semibold" style={{ color: 'rgb(20 184 166 / 0.7)' }}>
                      <button onClick={() => handleSort('tipificacion_llamada_nombre')} className="flex items-center gap-1 hover:opacity-80">
                        TIPIFICACION <SortIcon field="tipificacion_llamada_nombre" />
                      </button>
                    </TableHead>
                    <TableHead className="text-xs uppercase font-semibold" style={{ color: 'rgb(20 184 166 / 0.7)' }}>
                      <button onClick={() => handleSort('duracion_seg')} className="flex items-center gap-1 hover:opacity-80">
                        DURACION <SortIcon field="duracion_seg" />
                      </button>
                    </TableHead>
                    <TableHead className="text-xs uppercase font-semibold" style={{ color: 'rgb(20 184 166 / 0.7)' }}>
                      <button onClick={() => handleSort('fecha_inicio')} className="flex items-center gap-1 hover:opacity-80">
                        FECHA INICIO <SortIcon field="fecha_inicio" />
                      </button>
                    </TableHead>
                    <TableHead className="text-xs uppercase font-semibold" style={{ color: 'rgb(20 184 166 / 0.7)' }}>
                      <button onClick={() => handleSort('fecha_registro')} className="flex items-center gap-1 hover:opacity-80">
                        REGISTRO <SortIcon field="fecha_registro" />
                      </button>
                    </TableHead>
                    <TableHead className="text-xs w-12 uppercase font-semibold" style={{ color: 'rgb(20 184 166 / 0.7)' }}>ACCIONES</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((llamada) => (
                    <TableRow key={llamada.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell>
                        <span className="text-sm font-semibold text-blue-600">
                          #{llamada.codigo_llamada || '-'}
                        </span>
                      </TableCell>
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
                        {llamada.estado_llamada_nombre ? (
                          <Badge
                            variant="outline"
                            className="text-xs font-medium border"
                            style={{
                              color: getColorHex(llamada.estado_llamada_color),
                              borderColor: getColorHex(llamada.estado_llamada_color) + '55',
                              backgroundColor: getColorHex(llamada.estado_llamada_color) + '12',
                            }}
                          >
                            {llamada.estado_llamada_nombre}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            -
                          </Badge>
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
                          {llamada.duracion_seg ?? '-'} seg
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground font-mono">
                          {formatFechaAmPm(llamada.fecha_inicio)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          {formatDate(llamada.fecha_registro)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Link href={`/llamadas/${llamada.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="Ver detalle"
                            >
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-7 w-7 ${!llamada.archivo_llamada ? 'opacity-40 cursor-not-allowed' : ''}`}
                            onClick={() => handlePlayAudio(llamada)}
                            disabled={!llamada.archivo_llamada}
                            title={llamada.archivo_llamada ? "Escuchar audio" : "Sin audio"}
                          >
                            <Volume2 className={`h-4 w-4 ${llamada.archivo_llamada ? 'text-purple-500' : 'text-muted-foreground'}`} />
                          </Button>
                        </div>
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

      {/* Modal Reproductor de Audio - Custom */}
      {showAudioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/80"
            onClick={() => { setShowAudioModal(false); setSelectedAudio(null); }}
          />
          {/* Modal */}
          <div
            className="relative z-50 bg-background border rounded-xl shadow-lg p-6"
            style={{ width: '90%', maxWidth: '600px' }}
          >
            {/* Close button */}
            <button
              onClick={() => { setShowAudioModal(false); setSelectedAudio(null); }}
              className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Volume2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Audio de Llamada #{selectedAudio?.codigo_llamada || selectedAudio?.id}</h2>
                <p className="text-xs text-muted-foreground">Reproducir grabacion de llamada</p>
              </div>
            </div>

            {selectedAudio && (
              <div className="space-y-4">
                {/* Info de la llamada */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Contacto</p>
                    <p className="font-medium">{selectedAudio.contacto_nombre || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Telefono</p>
                    <p className="font-medium">{selectedAudio.telefono || '-'}</p>
                  </div>
                </div>

                {/* Reproductor de audio */}
                <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-4 border">
                  <audio
                    controls
                    style={{ width: '100%' }}
                    src={getAudioUrl(selectedAudio.archivo_llamada)}
                  >
                    Tu navegador no soporta el elemento de audio.
                  </audio>
                </div>

                {/* Boton de descarga */}
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadAudio}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Descargar audio
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
