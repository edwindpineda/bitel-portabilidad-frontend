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
} from 'lucide-react';

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

// Helper para formatear fecha y hora con AM/PM
const formatearFechaHora = (fecha) => {
  if (!fecha) return '-';
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return '-';
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const anio = d.getFullYear();
  let horas = d.getHours();
  const minutos = String(d.getMinutes()).padStart(2, '0');
  const segundos = String(d.getSeconds()).padStart(2, '0');
  const ampm = horas >= 12 ? 'PM' : 'AM';
  horas = horas % 12;
  horas = horas ? horas : 12; // 0 debe ser 12
  const horasStr = String(horas).padStart(2, '0');
  return `${dia}/${mes}/${anio} ${horasStr}:${minutos}:${segundos} ${ampm}`;
};

export default function LlamadasEjecucionPage() {
  const params = useParams();
  const router = useRouter();
  const campaniaId = params.id;
  const ejecucionId = params.ejecucionId;

  const [ejecucion, setEjecucion] = useState(null);
  const [llamadas, setLlamadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  // Ordenamiento
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  // Modal de audio
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [selectedAudioLlamada, setSelectedAudioLlamada] = useState(null);

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

  const handlePlayAudio = (llamada) => {
    setSelectedAudioLlamada(llamada);
    setShowAudioModal(true);
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

  // Ordenar llamadas
  const sortedLlamadas = [...llamadas].sort((a, b) => {
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
        aVal = calcularDuracionSegundos(a.fecha_inicio, a.fecha_fin) ?? -1;
        bVal = calcularDuracionSegundos(b.fecha_inicio, b.fecha_fin) ?? -1;
        break;
      case 'fecha':
        aVal = a.fecha_inicio ? new Date(a.fecha_inicio).getTime() : 0;
        bVal = b.fecha_inicio ? new Date(b.fecha_inicio).getTime() : 0;
        break;
      case 'fechaFin':
        aVal = a.fecha_fin ? new Date(a.fecha_fin).getTime() : 0;
        bVal = b.fecha_fin ? new Date(b.fecha_fin).getTime() : 0;
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
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg animate-pulse">
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
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Phone className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Llamadas de Ejecucion #{ejecucionId}</h1>
              <p className="text-sm text-muted-foreground">{ejecucion?.base_nombre || 'Cargando...'}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-600" />
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tipificadas</p>
                <p className="text-3xl font-bold tracking-tight">{llamadas.filter(l => l.tipificacion_llamada_nombre).length}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Megaphone className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Llamadas */}
      <Card>
        <CardContent className="p-6">
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
                        {formatearDuracion(calcularDuracionSegundos(llamada.fecha_inicio, llamada.fecha_fin))}
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
    </div>
  );
}
