'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Phone,
  Loader2,
  Volume2,
  Eye,
  Download,
  X,
  ChevronLeft,
  Megaphone,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  FileDown,
  FileText,
  FileSpreadsheet,
  RefreshCcw,
  CircleDot,
  Tag,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Helper para obtener URL de audio
const getAudioUrl = (archivoLlamada) => {
  if (!archivoLlamada) return null;
  if (archivoLlamada.startsWith('http')) return archivoLlamada;
  return `${process.env.NEXT_PUBLIC_API_URL || ''}/uploads/llamadas/${archivoLlamada}`;
};

// Helper para calcular duracion en segundos
const calcularDuracionSegundos = (fechaInicio, fechaFin) => {
  if (!fechaInicio || !fechaFin) return null;
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) return null;
  const diffMs = fin - inicio;
  if (diffMs < 0) return null;
  return Math.floor(diffMs / 1000);
};

// Helper para formatear duracion
const formatearDuracion = (segundos) => {
  if (segundos === null || segundos === undefined) return '-';
  if (segundos < 60) return `${segundos}s`;
  const minutos = Math.floor(segundos / 60);
  const segs = segundos % 60;
  if (minutos < 60) return `${minutos}m ${segs}s`;
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  return `${horas}h ${mins}m ${segs}s`;
};

// Helper para formatear fecha y hora con AM/PM (zona horaria Lima/Perú)
const formatearFechaHora = (fecha) => {
  if (!fecha) return '-';
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).replace(',', '');
};

export default function LlamadasEjecucionPage() {
  const params = useParams();
  const router = useRouter();
  const campaniaId = params.id;
  const ejecucionId = params.ejecucionId;

  const [ejecucion, setEjecucion] = useState(null);
  const [llamadas, setLlamadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  // Ordenamiento
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  // Filtro de busqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGrabacion, setFilterGrabacion] = useState('todos');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterTipificacion, setFilterTipificacion] = useState('todos');

  // Modal de audio
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [selectedAudioLlamada, setSelectedAudioLlamada] = useState(null);

  // Modal de transcripcion
  const [showTranscripcionModal, setShowTranscripcionModal] = useState(false);
  const [selectedTranscripcionLlamada, setSelectedTranscripcionLlamada] = useState(null);
  const [transcripciones, setTranscripciones] = useState([]);
  const [loadingTranscripcion, setLoadingTranscripcion] = useState(false);

  useEffect(() => {
    if (ejecucionId) {
      loadData();
    }
  }, [ejecucionId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ejecucionesRes, llamadasRes] = await Promise.all([
        apiClient.get(`/crm/campanias/${campaniaId}/ejecuciones`),
        apiClient.get(`/crm/llamadas/ejecucion/${ejecucionId}`),
      ]);

      // Buscar la ejecucion actual
      const ejecucionActual = (ejecucionesRes?.data || []).find(e => e.id === parseInt(ejecucionId));
      setEjecucion(ejecucionActual);
      setLlamadas(llamadasRes?.data || []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const [ejecucionesRes, llamadasRes] = await Promise.all([
        apiClient.get(`/crm/campanias/${campaniaId}/ejecuciones`),
        apiClient.get(`/crm/llamadas/ejecucion/${ejecucionId}`),
      ]);
      const ejecucionActual = (ejecucionesRes?.data || []).find(e => e.id === parseInt(ejecucionId));
      setEjecucion(ejecucionActual);
      setLlamadas(llamadasRes?.data || []);
    } catch (error) {
      console.error('Error al actualizar datos:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handlePlayAudio = (llamada) => {
    setSelectedAudioLlamada(llamada);
    setShowAudioModal(true);
  };

  const handleShowTranscripcion = async (llamada) => {
    setSelectedTranscripcionLlamada(llamada);
    setShowTranscripcionModal(true);
    setLoadingTranscripcion(true);
    setTranscripciones([]);
    try {
      const response = await apiClient.get(`/crm/transcripciones/llamada/${llamada.id}`);
      setTranscripciones(response?.data || []);
    } catch (error) {
      console.error('Error al cargar transcripciones:', error);
      setTranscripciones([]);
    } finally {
      setLoadingTranscripcion(false);
    }
  };

  const handleDownloadAudio = () => {
    if (!selectedAudioLlamada?.archivo_llamada) return;
    const url = getAudioUrl(selectedAudioLlamada.archivo_llamada);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedAudioLlamada.archivo_llamada;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exportar a CSV
  const exportToCSV = () => {
    const headers = ['Codigo', 'Contacto', 'Telefono', 'Tipificacion', 'Estado', 'Fecha Inicio', 'Fecha Fin', 'Duracion (seg)', 'Grabacion'];
    const data = filteredLlamadas.map((llamada) => [
      llamada.codigo_llamada || llamada.id || '',
      llamada.contacto_nombre || '',
      llamada.telefono || '',
      llamada.tipificacion_llamada_nombre || '',
      llamada.estado_llamada_nombre || '',
      formatearFechaHora(llamada.fecha_inicio),
      formatearFechaHora(llamada.fecha_fin),
      llamada.duracion_seg ?? '-',
      llamada.archivo_llamada ? 'Si' : 'No',
    ]);

    const csvContent = [headers, ...data]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `llamadas_ejecucion_${ejecucionId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Exportar a Excel (formato XLSX simple usando CSV con extension xlsx)
  const exportToExcel = () => {
    const headers = ['Codigo', 'Contacto', 'Telefono', 'Tipificacion', 'Estado', 'Fecha Inicio', 'Fecha Fin', 'Duracion (seg)', 'Grabacion'];
    const data = filteredLlamadas.map((llamada) => [
      llamada.codigo_llamada || llamada.id || '',
      llamada.contacto_nombre || '',
      llamada.telefono || '',
      llamada.tipificacion_llamada_nombre || '',
      llamada.estado_llamada_nombre || '',
      formatearFechaHora(llamada.fecha_inicio),
      formatearFechaHora(llamada.fecha_fin),
      llamada.duracion_seg ?? '-',
      llamada.archivo_llamada ? 'Si' : 'No',
    ]);

    // Crear contenido en formato tab-separated (compatible con Excel)
    const xlsContent = [headers, ...data]
      .map((row) => row.join('\t'))
      .join('\n');

    const blob = new Blob(['\ufeff' + xlsContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `llamadas_ejecucion_${ejecucionId}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Exportar a PDF
  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const tableRows = filteredLlamadas
      .map(
        (llamada) => `
        <tr>
          <td>${llamada.codigo_llamada || llamada.id || ''}</td>
          <td>${llamada.contacto_nombre || ''}</td>
          <td>${llamada.telefono || ''}</td>
          <td>${llamada.tipificacion_llamada_nombre || ''}</td>
          <td>${llamada.estado_llamada_nombre || ''}</td>
          <td>${formatearFechaHora(llamada.fecha_inicio)}</td>
          <td>${formatearFechaHora(llamada.fecha_fin)}</td>
          <td>${llamada.duracion_seg ?? '-'} seg</td>
          <td>${llamada.archivo_llamada ? 'Si' : 'No'}</td>
        </tr>
      `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Llamadas - Ejecucion #${ejecucionId}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
          h1 { color: #14B8A6; font-size: 18px; margin-bottom: 5px; }
          .subtitle { color: #666; font-size: 12px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #14B8A6; color: white; padding: 8px; text-align: left; font-size: 10px; }
          td { padding: 6px 8px; border-bottom: 1px solid #ddd; font-size: 10px; }
          tr:nth-child(even) { background: #f9f9f9; }
          .footer { margin-top: 20px; font-size: 10px; color: #999; }
        </style>
      </head>
      <body>
        <h1>Llamadas de Ejecucion #${ejecucionId}</h1>
        <p class="subtitle">${ejecucion?.base_nombre || ''} - Total: ${filteredLlamadas.length} llamadas</p>
        <table>
          <thead>
            <tr>
              <th>Codigo</th>
              <th>Contacto</th>
              <th>Telefono</th>
              <th>Tipificacion</th>
              <th>Estado</th>
              <th>Fecha Inicio</th>
              <th>Fecha Fin</th>
              <th>Duracion</th>
              <th>Grabacion</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <p class="footer">Generado el ${new Date().toLocaleString('es-PE')}</p>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  // Ordenamiento
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setPage(1);
  };

  const getSortIcon = (column) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  // Obtener valores unicos de estados y tipificaciones
  const estadosUnicos = [...new Set(llamadas.map(l => l.estado_llamada_nombre).filter(Boolean))].sort();
  const tipificacionesUnicas = [...new Set(llamadas.map(l => l.tipificacion_llamada_nombre).filter(Boolean))].sort();

  // Filtrar llamadas
  const filteredLlamadas = llamadas.filter((llamada) => {
    // Filtro por grabacion
    if (filterGrabacion === 'con' && !llamada.archivo_llamada) return false;
    if (filterGrabacion === 'sin' && llamada.archivo_llamada) return false;

    // Filtro por estado
    if (filterEstado !== 'todos' && llamada.estado_llamada_nombre !== filterEstado) return false;

    // Filtro por tipificacion
    if (filterTipificacion !== 'todos') {
      if (filterTipificacion === 'sin_tipificar') {
        if (llamada.tipificacion_llamada_nombre) return false;
      } else if (llamada.tipificacion_llamada_nombre !== filterTipificacion) {
        return false;
      }
    }

    // Filtro por busqueda
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const codigo = String(llamada.codigo_llamada || llamada.id || '').toLowerCase();
    const contacto = (llamada.contacto_nombre || '').toLowerCase();
    const telefono = (llamada.telefono || '').toLowerCase();
    const tipificacion = (llamada.tipificacion_llamada_nombre || '').toLowerCase();
    const estadoLlamada = (llamada.estado_llamada_nombre || '').toLowerCase();
    const fechaInicio = formatearFechaHora(llamada.fecha_inicio).toLowerCase();
    const fechaFin = formatearFechaHora(llamada.fecha_fin).toLowerCase();
    return (
      codigo.includes(term) ||
      contacto.includes(term) ||
      telefono.includes(term) ||
      tipificacion.includes(term) ||
      estadoLlamada.includes(term) ||
      fechaInicio.includes(term) ||
      fechaFin.includes(term)
    );
  });

  // Ordenar llamadas
  const sortedLlamadas = [...filteredLlamadas].sort((a, b) => {
    if (!sortColumn) return 0;

    let aVal, bVal;

    switch (sortColumn) {
      case 'codigo':
        aVal = a.codigo_llamada || a.id || 0;
        bVal = b.codigo_llamada || b.id || 0;
        break;
      case 'contacto':
        aVal = (a.contacto_nombre || '').toLowerCase();
        bVal = (b.contacto_nombre || '').toLowerCase();
        break;
      case 'telefono':
        aVal = a.telefono || '';
        bVal = b.telefono || '';
        break;
      case 'tipificacion':
        aVal = (a.tipificacion_llamada_nombre || '').toLowerCase();
        bVal = (b.tipificacion_llamada_nombre || '').toLowerCase();
        break;
      case 'grabacion':
        aVal = a.archivo_llamada ? 1 : 0;
        bVal = b.archivo_llamada ? 1 : 0;
        break;
      case 'duracion':
        aVal = a.duracion_seg ?? -1;
        bVal = b.duracion_seg ?? -1;
        break;
      case 'fecha':
        aVal = a.fecha_inicio ? new Date(a.fecha_inicio).getTime() : 0;
        bVal = b.fecha_inicio ? new Date(b.fecha_inicio).getTime() : 0;
        break;
      case 'fechaFin':
        aVal = a.fecha_fin ? new Date(a.fecha_fin).getTime() : 0;
        bVal = b.fecha_fin ? new Date(b.fecha_fin).getTime() : 0;
        break;
      case 'estadoLlamada':
        aVal = (a.estado_llamada_nombre || '').toLowerCase();
        bVal = (b.estado_llamada_nombre || '').toLowerCase();
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginacion
  const totalPages = Math.ceil(sortedLlamadas.length / ITEMS_PER_PAGE);
  const paginatedLlamadas = sortedLlamadas.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-teal-500 flex items-center justify-center shadow-lg animate-pulse">
              <Phone className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">Cargando llamadas...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/campanias/${campaniaId}`)}
              className="h-10 w-10 rounded-xl"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-teal-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Phone className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Llamadas de Ejecucion #{ejecucionId}</h1>
              <p className="text-sm text-muted-foreground">{ejecucion?.base_nombre || 'Cargando...'}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </Button>
          <Badge variant="secondary" className="text-xs bg-purple-50 text-purple-700 border border-purple-200/50 gap-1">
            <Phone className="h-3 w-3" />
            {llamadas.length} llamada{llamadas.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-purple-600" />
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Llamadas</p>
                <p className="text-3xl font-bold tracking-tight">{llamadas.length}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Phone className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-green-600" />
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Con Audio</p>
                <p className="text-3xl font-bold tracking-tight">{llamadas.filter(l => l.archivo_llamada).length}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                <Volume2 className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-teal-600" />
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipificadas</p>
                <p className="text-3xl font-bold tracking-tight">{llamadas.filter(l => l.tipificacion_llamada_nombre).length}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg">
                <Megaphone className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Llamadas */}
      <Card>
        <CardContent className="p-6">
          {/* Filtro de busqueda y Exportar */}
          <div className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex flex-wrap gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar por codigo, contacto, telefono, tipificacion, fecha..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9 h-10 w-full sm:w-80"
                />
              </div>
              <Select
                value={filterGrabacion}
                onValueChange={(value) => {
                  setFilterGrabacion(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-10 w-full sm:w-44">
                  <Volume2 className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Grabacion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas las llamadas</SelectItem>
                  <SelectItem value="con">Con grabacion</SelectItem>
                  <SelectItem value="sin">Sin grabacion</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filterEstado}
                onValueChange={(value) => {
                  setFilterEstado(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-10 w-full sm:w-44">
                  <CircleDot className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  {estadosUnicos.map((estado) => (
                    <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filterTipificacion}
                onValueChange={(value) => {
                  setFilterTipificacion(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-10 w-full sm:w-48">
                  <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Tipificacion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas las tipificaciones</SelectItem>
                  <SelectItem value="sin_tipificar">Sin tipificar</SelectItem>
                  {tipificacionesUnicas.map((tip) => (
                    <SelectItem key={tip} value={tip}>{tip}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              {(searchTerm || filterGrabacion !== 'todos' || filterEstado !== 'todos' || filterTipificacion !== 'todos') && (
                <p className="text-xs text-muted-foreground">
                  {filteredLlamadas.length} resultado{filteredLlamadas.length !== 1 ? 's' : ''}
                </p>
              )}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <FileDown className="h-4 w-4" />
                    Exportar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={exportToPDF} className="gap-2 cursor-pointer">
                    <FileText className="h-4 w-4 text-red-500" />
                    Exportar a PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToExcel} className="gap-2 cursor-pointer">
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    Exportar a Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToCSV} className="gap-2 cursor-pointer">
                    <FileDown className="h-4 w-4 text-blue-500" />
                    Exportar a CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead
                    className="text-[10px] font-bold uppercase tracking-widest text-purple-500/70 cursor-pointer hover:bg-muted/50 transition-colors select-none"
                    onClick={() => handleSort('codigo')}
                  >
                    <div className="flex items-center">
                      Codigo
                      {getSortIcon('codigo')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-[10px] font-bold uppercase tracking-widest text-purple-500/70 cursor-pointer hover:bg-muted/50 transition-colors select-none"
                    onClick={() => handleSort('contacto')}
                  >
                    <div className="flex items-center">
                      Contacto
                      {getSortIcon('contacto')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-[10px] font-bold uppercase tracking-widest text-purple-500/70 cursor-pointer hover:bg-muted/50 transition-colors select-none"
                    onClick={() => handleSort('telefono')}
                  >
                    <div className="flex items-center">
                      Telefono
                      {getSortIcon('telefono')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-[10px] font-bold uppercase tracking-widest text-purple-500/70 cursor-pointer hover:bg-muted/50 transition-colors select-none"
                    onClick={() => handleSort('tipificacion')}
                  >
                    <div className="flex items-center">
                      Tipificacion
                      {getSortIcon('tipificacion')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-[10px] font-bold uppercase tracking-widest text-purple-500/70 cursor-pointer hover:bg-muted/50 transition-colors select-none"
                    onClick={() => handleSort('estadoLlamada')}
                  >
                    <div className="flex items-center">
                      Estado
                      {getSortIcon('estadoLlamada')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-[10px] font-bold uppercase tracking-widest text-purple-500/70 cursor-pointer hover:bg-muted/50 transition-colors select-none text-center"
                    onClick={() => handleSort('fecha')}
                  >
                    <div className="flex items-center justify-center">
                      Fecha Inicio
                      {getSortIcon('fecha')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-[10px] font-bold uppercase tracking-widest text-purple-500/70 cursor-pointer hover:bg-muted/50 transition-colors select-none text-center"
                    onClick={() => handleSort('fechaFin')}
                  >
                    <div className="flex items-center justify-center">
                      Fecha Fin
                      {getSortIcon('fechaFin')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-[10px] font-bold uppercase tracking-widest text-purple-500/70 cursor-pointer hover:bg-muted/50 transition-colors select-none text-center"
                    onClick={() => handleSort('duracion')}
                  >
                    <div className="flex items-center justify-center">
                      Duracion
                      {getSortIcon('duracion')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-[10px] font-bold uppercase tracking-widest text-purple-500/70 cursor-pointer hover:bg-muted/50 transition-colors select-none text-center"
                    onClick={() => handleSort('grabacion')}
                  >
                    <div className="flex items-center justify-center">
                      Grabacion
                      {getSortIcon('grabacion')}
                    </div>
                  </TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-purple-500/70 text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLlamadas.map((llamada) => (
                  <TableRow key={llamada.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono text-xs text-purple-600 font-semibold">
                      #{llamada.codigo_llamada || llamada.id}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-purple-600">
                            {llamada.contacto_nombre ? llamada.contacto_nombre.charAt(0).toUpperCase() : '?'}
                          </span>
                        </div>
                        <span className="text-sm font-medium">{llamada.contacto_nombre || 'Sin nombre'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {llamada.telefono || '-'}
                    </TableCell>
                    <TableCell>
                      {llamada.tipificacion_llamada_nombre ? (
                        <Badge variant="secondary" className="text-[10px]">
                          {llamada.tipificacion_llamada_nombre}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin tipificar</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {llamada.estado_llamada_nombre ? (
                        <Badge
                          variant="secondary"
                          className="text-[10px]"
                          style={{
                            backgroundColor: llamada.estado_llamada_color ? `${llamada.estado_llamada_color}20` : undefined,
                            color: llamada.estado_llamada_color || undefined,
                            borderColor: llamada.estado_llamada_color ? `${llamada.estado_llamada_color}40` : undefined,
                          }}
                        >
                          {llamada.estado_llamada_nombre}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-[10px] font-mono text-gray-700">
                        {formatearFechaHora(llamada.fecha_inicio)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-[10px] font-mono text-gray-700">
                        {formatearFechaHora(llamada.fecha_fin)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-xs font-mono text-muted-foreground">
                        {llamada.duracion_seg ?? '-'} seg
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {llamada.archivo_llamada ? (
                        <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700 border-green-200">
                          Si
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] bg-gray-100 text-gray-500 border-gray-200">
                          No
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-7 w-7 ${!llamada.archivo_llamada ? 'opacity-40 cursor-not-allowed' : ''}`}
                          onClick={() => handlePlayAudio(llamada)}
                          disabled={!llamada.archivo_llamada}
                          title={llamada.archivo_llamada ? "Escuchar audio" : "Sin audio"}
                        >
                          <Volume2 className={`h-3.5 w-3.5 ${llamada.archivo_llamada ? 'text-purple-500' : 'text-muted-foreground'}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-7 w-7 ${!llamada.tiene_transcripcion ? 'opacity-40 cursor-not-allowed' : 'text-teal-500 hover:text-teal-700 hover:bg-teal-50'}`}
                          onClick={() => handleShowTranscripcion(llamada)}
                          disabled={!llamada.tiene_transcripcion}
                          title={llamada.tiene_transcripcion ? "Ver transcripcion" : "Sin transcripcion"}
                        >
                          <FileText className={`h-3.5 w-3.5 ${llamada.tiene_transcripcion ? 'text-teal-500' : 'text-muted-foreground'}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/llamadas/${llamada.id}`)}
                          className="h-7 w-7 text-purple-500 hover:text-purple-700 hover:bg-purple-50"
                          title="Ver detalle"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {llamadas.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <Phone className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No hay llamadas registradas</p>
              </div>
            )}
            {/* Paginacion */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
                <span className="text-xs text-muted-foreground">
                  Pagina {page} de {totalPages} · {llamadas.length} llamadas
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`h-8 w-8 rounded-lg text-xs font-semibold transition-colors ${
                          page === pageNum
                            ? 'bg-purple-500 text-white'
                            : 'text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4 rotate-180" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal Reproductor de Audio */}
      {showAudioModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/80"
            onClick={() => { setShowAudioModal(false); setSelectedAudioLlamada(null); }}
          />
          {/* Modal */}
          <div
            className="relative z-[101] bg-background border rounded-xl shadow-lg p-6 pointer-events-auto"
            style={{ width: '90%', maxWidth: '600px' }}
          >
            {/* Close button */}
            <button
              onClick={() => { setShowAudioModal(false); setSelectedAudioLlamada(null); }}
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
                <h2 className="text-lg font-semibold">Audio de Llamada #{selectedAudioLlamada?.codigo_llamada || selectedAudioLlamada?.id}</h2>
                <p className="text-xs text-muted-foreground">Reproducir grabacion de llamada</p>
              </div>
            </div>

            {selectedAudioLlamada && (
              <div className="space-y-4">
                {/* Info de la llamada */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Contacto</p>
                    <p className="font-medium">{selectedAudioLlamada.contacto_nombre || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Telefono</p>
                    <p className="font-medium">{selectedAudioLlamada.telefono || '-'}</p>
                  </div>
                </div>

                {/* Archivo info */}
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Archivo</p>
                  <p className="text-xs font-mono truncate">{selectedAudioLlamada.archivo_llamada}</p>
                </div>

                {/* Reproductor de audio */}
                <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-4 border">
                  <audio
                    controls
                    style={{ width: '100%' }}
                    src={getAudioUrl(selectedAudioLlamada.archivo_llamada)}
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

      {/* Modal Transcripcion */}
      {showTranscripcionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/80"
            onClick={() => { setShowTranscripcionModal(false); setSelectedTranscripcionLlamada(null); }}
          />
          {/* Modal */}
          <div
            className="relative z-[101] bg-background border rounded-xl shadow-lg p-6 pointer-events-auto"
            style={{ width: '90%', maxWidth: '700px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
          >
            {/* Close button */}
            <button
              onClick={() => { setShowTranscripcionModal(false); setSelectedTranscripcionLlamada(null); }}
              className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-teal-100 flex items-center justify-center">
                <FileText className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Transcripcion de Llamada #{selectedTranscripcionLlamada?.codigo_llamada || selectedTranscripcionLlamada?.id}</h2>
                <p className="text-xs text-muted-foreground">Texto transcrito de la llamada</p>
              </div>
            </div>

            {selectedTranscripcionLlamada && (
              <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                {/* Info de la llamada */}
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Contacto</p>
                    <p className="font-medium">{selectedTranscripcionLlamada.contacto_nombre || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Telefono</p>
                    <p className="font-medium">{selectedTranscripcionLlamada.telefono || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Duracion</p>
                    <p className="font-medium">{selectedTranscripcionLlamada.duracion_seg ?? '-'} seg</p>
                  </div>
                </div>

                {/* Transcripcion */}
                <div className="flex-1 overflow-auto bg-gradient-to-br from-teal-50 to-white rounded-xl p-4 border">
                  {loadingTranscripcion ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-teal-500" />
                      <span className="ml-2 text-sm text-muted-foreground">Cargando transcripcion...</span>
                    </div>
                  ) : transcripciones.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <FileText className="h-10 w-10 text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">Sin transcripcion disponible</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {transcripciones.map((t, index) => {
                        const isAI = t.speaker === 'ai';
                        const isSistema = t.speaker === 'sistema';
                        const speakerLabel = isAI ? 'Agente IA' : isSistema ? 'Sistema' : 'Usuario';

                        // Intentar parsear JSON si el texto parece ser JSON
                        let contenido = t.texto;
                        let esResumen = false;
                        try {
                          if (t.texto && (t.texto.trim().startsWith('{') || t.texto.trim().startsWith('['))) {
                            const parsed = JSON.parse(t.texto);
                            if (parsed.reason) {
                              contenido = parsed.reason;
                              esResumen = true;
                            }
                          }
                        } catch (e) {
                          // No es JSON válido, usar el texto original
                        }

                        return (
                          <div
                            key={t.id || index}
                            className={`flex ${isAI || isSistema ? 'justify-start' : 'justify-end'}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-xl px-4 py-2 ${
                                esResumen
                                  ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-800'
                                  : isSistema
                                    ? 'bg-gray-100 border border-gray-200 text-gray-600'
                                    : isAI
                                      ? 'bg-white border border-teal-200 text-gray-800'
                                      : 'bg-teal-500 text-white'
                              }`}
                            >
                              <p className={`text-[10px] font-semibold mb-1 ${
                                esResumen ? 'text-emerald-600' : isSistema ? 'text-gray-500' : isAI ? 'text-teal-600' : 'text-teal-100'
                              }`}>
                                {esResumen ? 'Resumen de la llamada' : speakerLabel}
                              </p>
                              <p className="text-sm leading-relaxed">{contenido}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
