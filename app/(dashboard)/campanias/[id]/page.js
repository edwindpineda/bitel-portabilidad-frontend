'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Megaphone,
  ArrowLeft,
  Play,
  Database,
  ClipboardList,
  Loader2,
  Zap,
  Tag,
  Users,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Search,
  X,
  Settings,
  Phone,
  Save,
  Eye,
  CheckCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCcw,
  RotateCcw,
} from 'lucide-react';

const ESTADOS_EJECUCION = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  en_proceso: { label: 'En Proceso', color: 'bg-blue-100 text-blue-800' },
  ejecutado: { label: 'Ejecutado', color: 'bg-green-100 text-green-800' },
  fallido: { label: 'Fallido', color: 'bg-red-100 text-red-800' },
  cancelado: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800' },
};

// Función para convertir hora 24h a formato AM/PM
const formatHora24ToAMPM = (hora24) => {
  if (!hora24) return '';
  const [hours, minutes] = hora24.split(':');
  const h = parseInt(hours, 10);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${minutes} ${period}`;
};

// Función para formatear horario completo (ej: "09:00-18:00" -> "9:00 AM - 6:00 PM")
const formatHorarioAMPM = (horario) => {
  if (!horario) return '';
  const [inicio, fin] = horario.split('-');
  return `${formatHora24ToAMPM(inicio)} - ${formatHora24ToAMPM(fin)}`;
};

// Helper para formatear fecha y hora con AM/PM (zona horaria Lima/Perú)
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

// Funcion para formatear el resultado JSON de ejecucion
const formatResultado = (resultado) => {
  if (!resultado) return null;
  try {
    const data = typeof resultado === 'string' ? JSON.parse(resultado) : resultado;
    return (
      <div className="flex items-center gap-2">
        {data.total !== undefined && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
            Total: {data.total}
          </span>
        )}
        {data.completadas !== undefined && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-green-100 text-green-700 text-[11px] font-medium">
            Completadas: {data.completadas}
          </span>
        )}
        {data.fallidas !== undefined && data.fallidas > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[11px] font-medium">
            Fallidas: {data.fallidas}
          </span>
        )}
      </div>
    );
  } catch {
    return <span className="text-muted-foreground">{resultado}</span>;
  }
};

export default function CampaniaDetallePage() {
  const params = useParams();
  const router = useRouter();
  const campaniaId = params.id;

  const [campania, setCampania] = useState(null);
  const [basesAsignadas, setBasesAsignadas] = useState([]);
  const [basesDisponibles, setBasesDisponibles] = useState([]);
  const [formatos, setFormatos] = useState([]);
  const [ejecuciones, setEjecuciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ejecutando, setEjecutando] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [basesSeleccionadasIds, setBasesSeleccionadasIds] = useState([]);

  // Modal de personas
  const [showPersonasModal, setShowPersonasModal] = useState(false);
  const [selectedEjecucion, setSelectedEjecucion] = useState(null);
  const [personasResultados, setPersonasResultados] = useState([]);
  const [loadingBusqueda, setLoadingBusqueda] = useState(false);
  const [searchPersona, setSearchPersona] = useState('');
  const [filtroTipoPersona, setFiltroTipoPersona] = useState('todos');
  const [personasPagination, setPersonasPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [personasSeleccionadasIds, setPersonasSeleccionadasIds] = useState([]);

  // Busqueda de bases
  const [searchBase, setSearchBase] = useState('');
  const [showBaseDropdown, setShowBaseDropdown] = useState(false);
  const [searchBaseAsignada, setSearchBaseAsignada] = useState('');

  // Modal detalle de base
  const [showDetalleBase, setShowDetalleBase] = useState(false);
  const [selectedBase, setSelectedBase] = useState(null);
  const [detalleBaseNumeros, setDetalleBaseNumeros] = useState([]);
  const [loadingDetalleBase, setLoadingDetalleBase] = useState(false);
  const [detalleBasePage, setDetalleBasePage] = useState(1);
  const [detalleBasePagination, setDetalleBasePagination] = useState({ total: 0, totalPages: 1 });
  const [searchDetalleBase, setSearchDetalleBase] = useState('');

  // Paginación de bases y ejecuciones
  const [basesPage, setBasesPage] = useState(1);
  const [ejecucionesPage, setEjecucionesPage] = useState(1);
  const ITEMS_PER_PAGE = 50;


  // Configuracion de llamadas
  const [showConfigLlamadas, setShowConfigLlamadas] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [tieneConfigLlamadas, setTieneConfigLlamadas] = useState(false);

  // Modal de reprocesar
  const [showReprocesarModal, setShowReprocesarModal] = useState(false);
  const [tipificaciones, setTipificaciones] = useState([]);
  const [reprocesarConfig, setReprocesarConfig] = useState({
    tipo: 'todos', // 'todos' | 'tipificacion'
    tipificaciones_seleccionadas: [],
  });
  const [reprocesando, setReprocesando] = useState(false);

  // Modal de confirmación de ejecución
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Modal de confirmación de reprocesar
  const [showConfirmReprocesarModal, setShowConfirmReprocesarModal] = useState(false);

  // Números pendientes para el modal de confirmación
  const [numerosPendientes, setNumerosPendientes] = useState(null);
  const [loadingPendientes, setLoadingPendientes] = useState(false);

  // Modal de resultado
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultModal, setResultModal] = useState({ type: 'success', title: '', message: '' });

  const [configLlamadas, setConfigLlamadas] = useState({
    lunes_horario: '09:00-18:00',
    martes_horario: '09:00-18:00',
    miercoles_horario: '09:00-18:00',
    jueves_horario: '09:00-18:00',
    viernes_horario: '09:00-18:00',
    sabado_horario: '09:00-18:00',
    domingo_horario: '09:00-18:00',
    max_intentos: 3,
  });

  useEffect(() => {
    if (campaniaId) {
      loadCampania();
    }
  }, [campaniaId]);

  const loadCampania = async () => {
    try {
      setLoading(true);
      const [campaniaRes, basesRes, basesDispRes, formatosRes, ejecucionesRes] = await Promise.all([
        apiClient.get(`/crm/campanias/${campaniaId}`),
        apiClient.get(`/crm/campanias/${campaniaId}/bases`),
        apiClient.get('/crm/bases-numeros'),
        apiClient.get('/crm/formatos'),
        apiClient.get(`/crm/campanias/${campaniaId}/ejecuciones`),
      ]);
      setCampania(campaniaRes?.data);
      setBasesAsignadas(basesRes?.data || []);
      setBasesDisponibles(basesDispRes?.data || []);
      setFormatos(formatosRes?.data || []);
      setEjecuciones(ejecucionesRes?.data || []);

      // Cargar config de llamadas si es tipo llamadas
      if (campaniaRes?.data?.tipo_campania_nombre?.toLowerCase() === 'llamadas') {
        loadConfigLlamadas();
      }
    } catch (error) {
      console.error('Error al cargar campaña:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const [campaniaRes, basesRes, basesDispRes, formatosRes, ejecucionesRes] = await Promise.all([
        apiClient.get(`/crm/campanias/${campaniaId}`),
        apiClient.get(`/crm/campanias/${campaniaId}/bases`),
        apiClient.get('/crm/bases-numeros'),
        apiClient.get('/crm/formatos'),
        apiClient.get(`/crm/campanias/${campaniaId}/ejecuciones`),
      ]);
      setCampania(campaniaRes?.data);
      setBasesAsignadas(basesRes?.data || []);
      setBasesDisponibles(basesDispRes?.data || []);
      setFormatos(formatosRes?.data || []);
      setEjecuciones(ejecucionesRes?.data || []);
      if (campaniaRes?.data?.tipo_campania_nombre?.toLowerCase() === 'llamadas') {
        loadConfigLlamadas();
      }
    } catch (error) {
      console.error('Error al actualizar campaña:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadConfigLlamadas = async () => {
    try {
      const res = await apiClient.get(`/crm/campanias/${campaniaId}/config-llamadas`);
      const config = res?.data;
      // Valores por defecto: Lunes a Domingo de 9am a 6pm
      const defaultHorario = '09:00-18:00';

      // Verificar si existe configuración guardada en BD
      const existeConfig = config && config.id;
      setTieneConfigLlamadas(existeConfig);

      setConfigLlamadas({
        lunes_horario: config?.lunes_horario || defaultHorario,
        martes_horario: config?.martes_horario || defaultHorario,
        miercoles_horario: config?.miercoles_horario || defaultHorario,
        jueves_horario: config?.jueves_horario || defaultHorario,
        viernes_horario: config?.viernes_horario || defaultHorario,
        sabado_horario: config?.sabado_horario || defaultHorario,
        domingo_horario: config?.domingo_horario || defaultHorario,
        max_intentos: existeConfig ? (config?.max_intentos || 3) : 1,
      });
    } catch (error) {
      console.error('Error al cargar config llamadas:', error);
      setTieneConfigLlamadas(false);
    }
  };

  const handleSaveConfigLlamadas = async () => {
    try {
      setSavingConfig(true);

      // Validar que al menos un día tenga horario
      const tieneAlgunDia = configLlamadas.lunes_horario || configLlamadas.martes_horario ||
                           configLlamadas.miercoles_horario || configLlamadas.jueves_horario ||
                           configLlamadas.viernes_horario || configLlamadas.sabado_horario ||
                           configLlamadas.domingo_horario;

      if (!tieneAlgunDia) {
        alert('Debe configurar al menos un día');
        setSavingConfig(false);
        return;
      }

      await apiClient.post(`/crm/campanias/${campaniaId}/config-llamadas`, {
        max_intentos: configLlamadas.max_intentos,
        lunes_horario: configLlamadas.lunes_horario,
        martes_horario: configLlamadas.martes_horario,
        miercoles_horario: configLlamadas.miercoles_horario,
        jueves_horario: configLlamadas.jueves_horario,
        viernes_horario: configLlamadas.viernes_horario,
        sabado_horario: configLlamadas.sabado_horario,
        domingo_horario: configLlamadas.domingo_horario,
      });
      setShowConfigLlamadas(false);
      setTieneConfigLlamadas(true);
      alert('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error al guardar config:', error);
      alert(error.msg || 'Error al guardar configuración');
    } finally {
      setSavingConfig(false);
    }
  };

  // Cargar tipificaciones para reprocesar
  const loadTipificaciones = async () => {
    try {
      const res = await apiClient.get('/crm/tipificaciones');
      setTipificaciones(res?.data || []);
    } catch (error) {
      console.error('Error al cargar tipificaciones:', error);
    }
  };

  // Abrir modal de reprocesar
  const handleOpenReprocesar = () => {
    loadTipificaciones();
    setReprocesarConfig({
      tipo: 'todos',
      tipificaciones_seleccionadas: [],
    });
    setShowReprocesarModal(true);
  };

  // Ejecutar reprocesamiento
  const handleReprocesar = async () => {
    try {
      setReprocesando(true);

      const payload = {
        id_campania: parseInt(campaniaId),
        tipo: reprocesarConfig.tipo,
        tipificaciones: reprocesarConfig.tipo === 'tipificacion'
          ? reprocesarConfig.tipificaciones_seleccionadas
          : [],
      };

      await apiClient.post('/crm/campanias/reprocesar', payload);

      setShowReprocesarModal(false);
      setResultModal({
        type: 'success',
        title: 'Reprocesamiento iniciado',
        message: reprocesarConfig.tipo === 'todos'
          ? 'Se han marcado todos los números para volver a llamar.'
          : `Se han marcado los números con las tipificaciones seleccionadas para volver a llamar.`
      });
      setShowResultModal(true);
      loadCampania();
    } catch (error) {
      console.error('Error al reprocesar:', error);
      alert(error.msg || 'Error al reprocesar campaña');
    } finally {
      setReprocesando(false);
    }
  };

  const handleAddBase = async (id_base_numero) => {
    try {
      await apiClient.post('/crm/campania-bases', {
        id_campania: parseInt(campaniaId),
        id_base_numero
      });
      loadCampania();
    } catch (error) {
      console.error('Error al agregar base:', error);
      alert(error.msg || 'Error al agregar base');
    }
  };

  const handleRemoveBase = async (id) => {
    if (confirm('¿Está seguro de quitar esta base de la campaña?')) {
      try {
        await apiClient.delete(`/crm/campania-bases/${id}`);
        loadCampania();
      } catch (error) {
        console.error('Error al quitar base:', error);
      }
    }
  };

  const handleToggleActivo = async (id) => {
    try {
      const response = await apiClient.patch(`/crm/campania-bases/${id}/toggle-activo`);
      // Actualizar el estado local
      setBasesAsignadas(prev =>
        prev.map(base =>
          base.id === id ? { ...base, activo: response.data.activo } : base
        )
      );
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert(error.msg || 'Error al cambiar estado de la base');
    }
  };

  const handleVerDetalleBase = async (base, page = 1) => {
    setSelectedBase(base);
    setShowDetalleBase(true);
    setLoadingDetalleBase(true);
    setDetalleBasePage(page);

    try {
      const response = await apiClient.get(`/crm/bases-numeros/${base.id_base_numero}/detalles?page=${page}&limit=20`);
      setDetalleBaseNumeros(response.data || []);
      setDetalleBasePagination({
        total: response.total || 0,
        totalPages: response.totalPages || 1
      });
    } catch (error) {
      console.error('Error al cargar detalle:', error);
      setDetalleBaseNumeros([]);
    } finally {
      setLoadingDetalleBase(false);
    }
  };

  const handleEjecutar = async () => {
    setLoadingPendientes(true);
    setShowConfirmModal(true);
    try {
      const response = await apiClient.get(`/crm/campanias/${campaniaId}/numeros-pendientes`);
      setNumerosPendientes(response.data?.total_pendientes ?? null);
    } catch (error) {
      console.error('Error al cargar números pendientes:', error);
      setNumerosPendientes(null);
    } finally {
      setLoadingPendientes(false);
    }
  };

  const confirmarEjecucion = async () => {
    setShowConfirmModal(false);
    setEjecutando(true);
    try {
      const idsToSend = basesSeleccionadasIds.length > 0
        ? basesSeleccionadasIds
        : basesAsignadas.map(b => b.id_base_numero);
      const response = await apiClient.post('/crm/campania-ejecuciones/ejecutar', {
        id_campania: parseInt(campaniaId),
        ids_base_numero: idsToSend
      });
      setResultModal({
        type: 'success',
        title: 'Ejecución Iniciada',
        message: `Se han programado ${response.data?.total_bases || 0} bases para ejecutar. Las llamadas se procesarán en segundo plano.`
      });
      setShowResultModal(true);
      loadCampania();
    } catch (error) {
      console.error('Error al ejecutar campaña:', error);
      setResultModal({
        type: 'error',
        title: 'Error al Ejecutar',
        message: error.msg || 'Ocurrió un error al ejecutar la campaña. Por favor intente nuevamente.'
      });
      setShowResultModal(true);
    } finally {
      setEjecutando(false);
    }
  };

  // ===== BUSQUEDA DE PERSONAS =====
  const cargarPersonas = async (page = 1, search = '', tipo = '') => {
    try {
      setLoadingBusqueda(true);
      const tipoParam = tipo === 'prospecto' ? '1' : tipo === 'cliente' ? '2' : '';
      const params = new URLSearchParams({ page, limit: 50, search, tipo: tipoParam });
      const res = await apiClient.get(`/crm/personas?${params}`);
      // apiClient ya devuelve response.data, entonces res es { data: [], pagination: {} }
      const data = res?.data || [];
      const pagination = res?.pagination || { page: 1, totalPages: 1, total: 0 };
      setPersonasResultados(data);
      setPersonasPagination(pagination);
    } catch (error) {
      console.error('Error al cargar personas:', error);
    } finally {
      setLoadingBusqueda(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= personasPagination.totalPages) {
      cargarPersonas(newPage, searchPersona, filtroTipoPersona);
    }
  };

  const handleVerPersonas = (ejecucion) => {
    setSelectedEjecucion(ejecucion);
    setSearchPersona('');
    setPersonasResultados([]);
    setFiltroTipoPersona('todos');
    setPersonasPagination({ page: 1, totalPages: 1, total: 0 });
    setPersonasSeleccionadasIds([]);
    cargarPersonas(1, '', 'todos');
    setShowPersonasModal(true);
  };



  const basesNoAsignadas = basesDisponibles.filter(
    base => !basesAsignadas.some(ba => ba.id_base_numero === base.id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg animate-pulse">
              <Megaphone className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-medium">Cargando campaña...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!campania) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-muted-foreground">Campaña no encontrada</p>
        <Button variant="outline" onClick={() => router.push('/campanias')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>
    );
  }

  const STATS = [
    {
      label: 'Bases Asignadas',
      value: basesAsignadas.length,
      icon: Database,
      gradient: 'from-cyan-500 to-cyan-600',
      glow: 'rgba(6, 182, 212, 0.15)',
    },
    {
      label: 'Ejecuciones',
      value: ejecuciones.length,
      icon: Zap,
      gradient: 'from-amber-500 to-orange-500',
      glow: 'rgba(245, 158, 11, 0.15)',
    },
    {
      label: 'Total Números',
      value: basesAsignadas.reduce((sum, b) => sum + (b.total_numeros || 0), 0),
      icon: Users,
      gradient: 'from-emerald-500 to-emerald-600',
      glow: 'rgba(16, 185, 129, 0.15)',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/campanias')}
            className="h-10 w-10 rounded-xl"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Megaphone className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{campania.nombre}</h1>
              {campania.tipo_campania_nombre && (
                <Badge variant="secondary" className="text-xs bg-violet-50 text-violet-700 border border-violet-200/50 gap-1">
                  <Tag className="h-3 w-3" />
                  {campania.tipo_campania_nombre}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{campania.descripcion || 'Sin descripción'}</p>
          </div>
        </div>
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
      </div>

      {/* Barra de Acciones */}
      <TooltipProvider delayDuration={200}>
        <Card className="border-dashed">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="h-4 w-4" />
                <span>Acciones de campaña</span>
              </div>
              <div className="flex items-center gap-2">
                {campania.tipo_campania_nombre?.toLowerCase() === 'llamadas' && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={showConfigLlamadas ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setShowConfigLlamadas(!showConfigLlamadas)}
                        className={showConfigLlamadas ? 'bg-blue-600 hover:bg-blue-700 text-white gap-2' : 'gap-2'}
                      >
                        <Settings className="h-4 w-4" />
                        Configuración
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Configura horarios de llamada e intentos por contacto</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {ejecuciones.length > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleOpenReprocesar}
                        disabled={reprocesando || ejecuciones.some(e => e.estado_ejecucion === 'en_proceso')}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <RefreshCcw className="h-4 w-4" />
                        Volver a llamar
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Crea una nueva ejecución para llamar todos los números o por tipificación</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleEjecutar}
                      disabled={ejecutando || basesAsignadas.length === 0 || ejecuciones.some(e => e.estado_ejecucion === 'en_proceso')}
                      size="sm"
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white gap-2"
                    >
                      {ejecutando ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Ejecutando...
                        </>
                      ) : ejecuciones.some(e => e.estado_ejecucion === 'en_proceso') ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          En Ejecución
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          Ejecutar
                        </>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Inicia las llamadas a los números pendientes de las bases activas</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardContent>
        </Card>
      </TooltipProvider>

      {/* Detalle de la Campaña */}
      <Card>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Tipo de Campaña</p>
              <p className="text-sm font-medium">
                {campania.tipo_campania_nombre || <span className="text-muted-foreground">No definido</span>}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Estado</p>
              {ejecuciones.some(e => e.estado_ejecucion === 'en_proceso') ? (
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  En Ejecución
                </Badge>
              ) : ejecuciones.length === 0 ? (
                <Badge variant="secondary" className="text-muted-foreground">
                  Sin ejecutar
                </Badge>
              ) : (
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                  Disponible
                </Badge>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Formato</p>
              <p className="text-sm font-medium">
                {campania.formato_nombre || <span className="text-muted-foreground">No definido</span>}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Plantilla</p>
              <p className="text-sm font-medium">
                {campania.plantilla_nombre || <span className="text-muted-foreground">No definida</span>}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Voz del Agente</p>
              <p className="text-sm font-medium">
                {campania.voz_nacionalidad && campania.voz_genero
                  ? `${campania.voz_nacionalidad} - ${campania.voz_genero}`
                  : <span className="text-muted-foreground">No definida</span>
                }
              </p>
            </div>
            {campania.tipo_campania_nombre?.toLowerCase() === 'llamadas' && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Config. Llamadas</p>
                {tieneConfigLlamadas ? (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Configurado ({configLlamadas.max_intentos} intentos)
                  </Badge>
                ) : (
                  <button
                    onClick={() => setShowConfigLlamadas(true)}
                    className="flex items-center gap-1"
                  >
                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 gap-1 cursor-pointer">
                      <AlertCircle className="h-3 w-3" />
                      Sin configurar
                    </Badge>
                  </button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {STATS.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`} />
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                    <p className="text-3xl font-bold tracking-tight">{stat.value.toLocaleString()}</p>
                  </div>
                  <div
                    className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}
                    style={{ boxShadow: `0 8px 24px -4px ${stat.glow}` }}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Configuracion de Llamadas - Solo para tipo "llamadas" cuando se activa */}
      {campania.tipo_campania_nombre?.toLowerCase() === 'llamadas' && showConfigLlamadas && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Phone className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Configuración de Llamadas</h2>
                <p className="text-xs text-muted-foreground">Horarios por día e intentos por contacto</p>
              </div>
            </div>

            {/* Tabla de horarios por día */}
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">Horarios por día de la semana</label>
              <p className="text-xs text-muted-foreground mb-3">Seleccione hora de inicio y fin para cada día. Deje vacío para desactivar el día.</p>
              <div className="rounded-xl border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-teal-500/70 w-24">Día</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-teal-500/70">Hora Inicio</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-teal-500/70">Hora Fin</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-teal-500/70 w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { key: 'lunes_horario', label: 'Lunes' },
                      { key: 'martes_horario', label: 'Martes' },
                      { key: 'miercoles_horario', label: 'Miércoles' },
                      { key: 'jueves_horario', label: 'Jueves' },
                      { key: 'viernes_horario', label: 'Viernes' },
                      { key: 'sabado_horario', label: 'Sábado' },
                      { key: 'domingo_horario', label: 'Domingo' },
                    ].map(d => {
                      const horario = configLlamadas[d.key] || '';
                      const [horaInicio, horaFin] = horario ? horario.split('-') : ['', ''];

                      const handleHorarioChange = (tipo, valor) => {
                        const inicio = tipo === 'inicio' ? valor : horaInicio;
                        const fin = tipo === 'fin' ? valor : horaFin;
                        // Guardar horario parcial o completo
                        let nuevoHorario = null;
                        if (inicio && fin) {
                          nuevoHorario = `${inicio}-${fin}`;
                        } else if (inicio) {
                          nuevoHorario = `${inicio}-`;
                        } else if (fin) {
                          nuevoHorario = `-${fin}`;
                        }
                        setConfigLlamadas(prev => ({
                          ...prev,
                          [d.key]: nuevoHorario
                        }));
                      };

                      const opcionesHoras = [
                        { value: '06:00', label: '6:00 AM' },
                        { value: '07:00', label: '7:00 AM' },
                        { value: '08:00', label: '8:00 AM' },
                        { value: '09:00', label: '9:00 AM' },
                        { value: '10:00', label: '10:00 AM' },
                        { value: '11:00', label: '11:00 AM' },
                        { value: '12:00', label: '12:00 PM' },
                        { value: '13:00', label: '1:00 PM' },
                        { value: '14:00', label: '2:00 PM' },
                        { value: '15:00', label: '3:00 PM' },
                        { value: '16:00', label: '4:00 PM' },
                        { value: '17:00', label: '5:00 PM' },
                        { value: '18:00', label: '6:00 PM' },
                        { value: '19:00', label: '7:00 PM' },
                        { value: '20:00', label: '8:00 PM' },
                        { value: '21:00', label: '9:00 PM' },
                        { value: '22:00', label: '10:00 PM' },
                      ];

                      return (
                        <TableRow key={d.key} className={configLlamadas[d.key] ? 'bg-teal-50/50' : ''}>
                          <TableCell className="font-medium text-sm">{d.label}</TableCell>
                          <TableCell>
                            <select
                              value={horaInicio}
                              onChange={e => handleHorarioChange('inicio', e.target.value)}
                              className="h-9 w-28 px-2 rounded-lg bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:bg-background transition-colors cursor-pointer"
                            >
                              <option value="">--:--</option>
                              {opcionesHoras.map(hora => (
                                <option key={hora.value} value={hora.value}>{hora.label}</option>
                              ))}
                            </select>
                          </TableCell>
                          <TableCell>
                            <select
                              value={horaFin}
                              onChange={e => handleHorarioChange('fin', e.target.value)}
                              className="h-9 w-28 px-2 rounded-lg bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:bg-background transition-colors cursor-pointer"
                            >
                              <option value="">--:--</option>
                              {opcionesHoras.map(hora => (
                                <option key={hora.value} value={hora.value}>{hora.label}</option>
                              ))}
                            </select>
                          </TableCell>
                          <TableCell>
                            {configLlamadas[d.key] && (
                              <button
                                onClick={() => setConfigLlamadas(prev => ({ ...prev, [d.key]: null }))}
                                className="text-xs text-red-500 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Intentos */}
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">Intentos por contacto</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 p-1 rounded-xl bg-muted/30 border">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => setConfigLlamadas(prev => ({ ...prev, max_intentos: n }))}
                      className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                        configLlamadas.max_intentos === n
                          ? 'bg-teal-600 text-white shadow-md shadow-teal-500/25'
                          : 'text-muted-foreground hover:bg-muted/60'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">intentos máximos</span>
              </div>
            </div>

            {/* Resumen */}
            <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-100">
              <p className="text-xs font-medium text-teal-800 mb-1">Resumen de configuración</p>
              <div className="text-xs text-teal-600 space-y-0.5">
                {configLlamadas.lunes_horario && <p><span className="font-medium">Lunes</span>: {formatHorarioAMPM(configLlamadas.lunes_horario)}</p>}
                {configLlamadas.martes_horario && <p><span className="font-medium">Martes</span>: {formatHorarioAMPM(configLlamadas.martes_horario)}</p>}
                {configLlamadas.miercoles_horario && <p><span className="font-medium">Miércoles</span>: {formatHorarioAMPM(configLlamadas.miercoles_horario)}</p>}
                {configLlamadas.jueves_horario && <p><span className="font-medium">Jueves</span>: {formatHorarioAMPM(configLlamadas.jueves_horario)}</p>}
                {configLlamadas.viernes_horario && <p><span className="font-medium">Viernes</span>: {formatHorarioAMPM(configLlamadas.viernes_horario)}</p>}
                {configLlamadas.sabado_horario && <p><span className="font-medium">Sábado</span>: {formatHorarioAMPM(configLlamadas.sabado_horario)}</p>}
                {configLlamadas.domingo_horario && <p><span className="font-medium">Domingo</span>: {formatHorarioAMPM(configLlamadas.domingo_horario)}</p>}
                {!configLlamadas.lunes_horario && !configLlamadas.martes_horario && !configLlamadas.miercoles_horario &&
                 !configLlamadas.jueves_horario && !configLlamadas.viernes_horario && !configLlamadas.sabado_horario &&
                 !configLlamadas.domingo_horario && (
                  <p className="text-amber-600">Sin días configurados</p>
                )}
                <p className="mt-2 pt-2 border-t border-teal-200">
                  {configLlamadas.max_intentos} intento{configLlamadas.max_intentos !== 1 ? 's' : ''} máximo{configLlamadas.max_intentos !== 1 ? 's' : ''} por contacto
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSaveConfigLlamadas}
                disabled={savingConfig}
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
              >
                {savingConfig ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {savingConfig ? 'Guardando...' : 'Guardar Configuración'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bases Asignadas */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Database className="h-5 w-5 text-cyan-500" />
              Bases Asignadas
            </h2>
            {basesNoAsignadas.length > 0 && (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar base para agregar..."
                    value={searchBase}
                    onChange={(e) => {
                      setSearchBase(e.target.value);
                      setShowBaseDropdown(true);
                    }}
                    onFocus={() => setShowBaseDropdown(true)}
                    className="h-9 w-64 pl-9 pr-3 text-sm rounded-lg bg-muted/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 border border-border"
                  />
                  {searchBase && (
                    <button
                      onClick={() => { setSearchBase(''); setShowBaseDropdown(false); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20"
                    >
                      <X className="h-2.5 w-2.5 text-muted-foreground" />
                    </button>
                  )}
                </div>
                {showBaseDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {basesNoAsignadas
                      .filter(base => base.nombre.toLowerCase().includes(searchBase.toLowerCase()))
                      .map((base) => (
                        <button
                          key={base.id}
                          type="button"
                          onClick={() => {
                            handleAddBase(base.id);
                            setSearchBase('');
                            setShowBaseDropdown(false);
                          }}
                          className="w-full px-4 py-2.5 text-left hover:bg-muted/50 flex items-center justify-between transition-colors first:rounded-t-lg last:rounded-b-lg text-sm"
                        >
                          <span>{base.nombre}</span>
                          <Plus className="h-3.5 w-3.5 text-cyan-500" />
                        </button>
                      ))}
                    {basesNoAsignadas.filter(base => base.nombre.toLowerCase().includes(searchBase.toLowerCase())).length === 0 && (
                      <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                        No se encontraron bases
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Buscador de bases asignadas */}
          {basesAsignadas.length > 5 && (
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar base asignada..."
                value={searchBaseAsignada}
                onChange={(e) => setSearchBaseAsignada(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          )}

          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/70 w-12">#</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/70">Base</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/70">Formato</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/70 text-center">Números</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/70 text-center">Ejecuciones</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/70 text-center w-20">Activo</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/70 text-center w-24">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {basesAsignadas
                  .filter(base => base.base_nombre.toLowerCase().includes(searchBaseAsignada.toLowerCase()))
                  .slice((basesPage - 1) * ITEMS_PER_PAGE, basesPage * ITEMS_PER_PAGE)
                  .map((base, index) => (
                  <TableRow key={base.id}>
                    <TableCell className="text-muted-foreground font-mono text-xs">{(basesPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                    <TableCell className="font-medium">{base.base_nombre}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">
                        {base.formato_nombre || 'Sin formato'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">{base.total_numeros || 0}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-xs">
                        {base.total_ejecuciones || 0}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={base.activo === 1 || base.activo === true}
                        onCheckedChange={() => handleToggleActivo(base.id)}
                        className="data-[state=checked]:bg-cyan-500"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-cyan-500 hover:text-cyan-700 hover:bg-cyan-50"
                          onClick={() => handleVerDetalleBase(base)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={`h-7 w-7 ${ejecuciones.length > 0 ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:text-red-700 hover:bg-red-50'}`}
                                  onClick={() => handleRemoveBase(base.id)}
                                  disabled={ejecuciones.length > 0}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            {ejecuciones.length > 0 && (
                              <TooltipContent side="top">
                                <p>No se puede eliminar porque ya existen ejecuciones</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {basesAsignadas.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <Database className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No hay bases asignadas</p>
              </div>
            )}
                        {/* Paginación Bases */}
            {basesAsignadas.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
                <span className="text-xs text-muted-foreground">
                  Página {basesPage} de {Math.ceil(basesAsignadas.length / ITEMS_PER_PAGE)} · {basesAsignadas.length} bases
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setBasesPage(p => Math.max(1, p - 1))}
                    disabled={basesPage <= 1}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: Math.min(5, Math.ceil(basesAsignadas.length / ITEMS_PER_PAGE)) }, (_, i) => {
                    const totalPages = Math.ceil(basesAsignadas.length / ITEMS_PER_PAGE);
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (basesPage <= 3) {
                      pageNum = i + 1;
                    } else if (basesPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = basesPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setBasesPage(pageNum)}
                        className={`h-8 w-8 rounded-lg text-xs font-semibold transition-colors ${
                          basesPage === pageNum
                            ? 'bg-cyan-500 text-white'
                            : 'text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setBasesPage(p => Math.min(Math.ceil(basesAsignadas.length / ITEMS_PER_PAGE), p + 1))}
                    disabled={basesPage >= Math.ceil(basesAsignadas.length / ITEMS_PER_PAGE)}
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

      {/* Ejecuciones */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Historial de Ejecuciones
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-1.5 h-8"
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>

          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-amber-500/70 w-16">#</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-amber-500/70">ID Ejecución</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-amber-500/70">Base</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-amber-500/70">Estado</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-amber-500/70">Resultado</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-amber-500/70">Fecha</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-amber-500/70">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ejecuciones
                  .slice((ejecucionesPage - 1) * ITEMS_PER_PAGE, ejecucionesPage * ITEMS_PER_PAGE)
                  .map((ejecucion, index) => (
                  <TableRow key={ejecucion.id} className="group">
                    <TableCell className="text-muted-foreground font-mono text-xs">{(ejecucionesPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-xs">{ejecucion.id}</TableCell>
                    <TableCell className="font-medium">{ejecucion.base_nombre}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-semibold ${ESTADOS_EJECUCION[ejecucion.estado_ejecucion]?.color || 'bg-gray-100 text-gray-800'}`}
                      >
                        {ESTADOS_EJECUCION[ejecucion.estado_ejecucion]?.label || ejecucion.estado_ejecucion}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {ejecucion.total_llamadas > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium">
                            Total: {ejecucion.total_llamadas}
                          </span>
                          {ejecucion.llamadas_exitosas > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-green-100 text-green-700 text-[11px] font-medium">
                              Completadas: {ejecucion.llamadas_exitosas}
                            </span>
                          )}
                          {ejecucion.llamadas_fallidas > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[11px] font-medium">
                              Fallidas: {ejecucion.llamadas_fallidas}
                            </span>
                          )}
                          {ejecucion.llamadas_pendientes > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-yellow-100 text-yellow-700 text-[11px] font-medium">
                              En proceso: {ejecucion.llamadas_pendientes}
                            </span>
                          )}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-mono">
                      {formatFechaAmPm(ejecucion.fecha_registro)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/campanias/${campaniaId}/ejecuciones/${ejecucion.id}/llamadas`)}
                        className="h-8 text-purple-500 hover:text-purple-600 hover:bg-purple-50 gap-1"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        Llamadas
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {ejecuciones.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <ClipboardList className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No hay ejecuciones registradas</p>
              </div>
            )}
            {/* Paginación Ejecuciones */}
            {ejecuciones.length > ITEMS_PER_PAGE && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
                <span className="text-xs text-muted-foreground">
                  Página {ejecucionesPage} de {Math.ceil(ejecuciones.length / ITEMS_PER_PAGE)} · {ejecuciones.length} ejecuciones
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setEjecucionesPage(p => Math.max(1, p - 1))}
                    disabled={ejecucionesPage <= 1}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {Array.from({ length: Math.min(5, Math.ceil(ejecuciones.length / ITEMS_PER_PAGE)) }, (_, i) => {
                    const totalPages = Math.ceil(ejecuciones.length / ITEMS_PER_PAGE);
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (ejecucionesPage <= 3) {
                      pageNum = i + 1;
                    } else if (ejecucionesPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = ejecucionesPage - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setEjecucionesPage(pageNum)}
                        className={`h-8 w-8 rounded-lg text-xs font-semibold transition-colors ${
                          ejecucionesPage === pageNum
                            ? 'bg-amber-500 text-white'
                            : 'text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setEjecucionesPage(p => Math.min(Math.ceil(ejecuciones.length / ITEMS_PER_PAGE), p + 1))}
                    disabled={ejecucionesPage >= Math.ceil(ejecuciones.length / ITEMS_PER_PAGE)}
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

      {/* Modal Detalle de Base */}
      <Dialog open={showDetalleBase} onOpenChange={setShowDetalleBase}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                <Database className="h-4 w-4 text-white" />
              </div>
              {selectedBase?.base_nombre}
            </DialogTitle>
            <DialogDescription>
              {detalleBasePagination.total} números en esta base · Formato: {selectedBase?.formato_nombre || 'Sin formato'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Buscador */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por teléfono o nombre..."
                value={searchDetalleBase}
                onChange={(e) => setSearchDetalleBase(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            {/* Tabla de números */}
            {loadingDetalleBase ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/70 w-12">#</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/70">Teléfono</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/70">Nombre</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/70">Documento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detalleBaseNumeros
                      .filter(n =>
                        n.telefono?.toLowerCase().includes(searchDetalleBase.toLowerCase()) ||
                        n.nombre?.toLowerCase().includes(searchDetalleBase.toLowerCase())
                      )
                      .map((numero, index) => (
                      <TableRow key={numero.id}>
                        <TableCell className="text-muted-foreground font-mono text-xs">{(detalleBasePage - 1) * 20 + index + 1}</TableCell>
                        <TableCell className="font-mono text-sm">{numero.telefono}</TableCell>
                        <TableCell className="text-sm">{numero.nombre || <span className="text-muted-foreground">—</span>}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{numero.numero_documento || '—'}</TableCell>
                      </TableRow>
                    ))}
                    {detalleBaseNumeros.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No hay números en esta base
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Paginación */}
            {detalleBasePagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-muted-foreground">
                  Página {detalleBasePage} de {detalleBasePagination.totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVerDetalleBase(selectedBase, detalleBasePage - 1)}
                    disabled={detalleBasePage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVerDetalleBase(selectedBase, detalleBasePage + 1)}
                    disabled={detalleBasePage >= detalleBasePagination.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Personas - Solo búsqueda con paginación */}
      <Dialog open={showPersonasModal} onOpenChange={setShowPersonasModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
              Personas — Ejecución #{selectedEjecucion?.id}
            </DialogTitle>
            <DialogDescription>
              {selectedEjecucion?.base_nombre} · {personasPagination.total} personas en total
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Buscador */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Search className="h-3 w-3" />
                Buscar persona
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                    <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    placeholder="Filtrar por nombre, celular o DNI..."
                    value={searchPersona}
                    onChange={(e) => setSearchPersona(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') cargarPersonas(1, searchPersona, filtroTipoPersona); }}
                    className="w-full h-10 pl-10 pr-20 text-sm rounded-xl bg-muted/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-background transition-colors"
                  />
                  <button
                    onClick={() => cargarPersonas(1, searchPersona, filtroTipoPersona)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] font-semibold bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    Buscar
                  </button>
                </div>
                <div className="flex rounded-xl overflow-hidden border bg-muted/30 text-[11px] font-semibold shrink-0">
                  {[
                    { key: 'todos', label: 'Todos' },
                    { key: 'prospecto', label: 'Prospectos' },
                    { key: 'cliente', label: 'Clientes' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => { setFiltroTipoPersona(key); cargarPersonas(1, searchPersona, key); }}
                      className={`px-3 h-10 transition-colors ${filtroTipoPersona === key ? 'bg-emerald-500 text-white' : 'text-muted-foreground hover:bg-muted/60'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lista personas */}
              {loadingBusqueda ? (
                <div className="flex items-center justify-center py-6 gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                  <span className="text-xs text-muted-foreground">Cargando personas...</span>
                </div>
              ) : personasResultados.length > 0 ? (
                <div className="border rounded-xl overflow-hidden">
                  {/* Header con Seleccionar Todo */}
                  <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/30 border-b">
                    <Checkbox
                      checked={personasResultados.length > 0 && personasResultados.every(p => personasSeleccionadasIds.includes(p.id))}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          const newIds = [...new Set([...personasSeleccionadasIds, ...personasResultados.map(p => p.id)])];
                          setPersonasSeleccionadasIds(newIds);
                        } else {
                          setPersonasSeleccionadasIds(prev => prev.filter(id => !personasResultados.some(p => p.id === id)));
                        }
                      }}
                      className="h-4 w-4"
                    />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/70">Seleccionar página</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {personasResultados.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setPersonasSeleccionadasIds(prev =>
                            prev.includes(p.id)
                              ? prev.filter(id => id !== p.id)
                              : [...prev, p.id]
                          );
                        }}
                        className={`flex items-center justify-between px-4 py-2.5 hover:bg-muted/40 transition-colors border-b last:border-b-0 cursor-pointer ${personasSeleccionadasIds.includes(p.id) ? 'bg-emerald-50/50' : ''}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Checkbox
                            checked={personasSeleccionadasIds.includes(p.id)}
                            onCheckedChange={(checked) => {
                              setPersonasSeleccionadasIds(prev =>
                                checked
                                  ? [...prev, p.id]
                                  : prev.filter(id => id !== p.id)
                              );
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4"
                          />
                          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-bold text-emerald-600">{p.nombre_completo ? p.nombre_completo.charAt(0).toUpperCase() : '?'}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{p.nombre_completo || 'Sin nombre'}</p>
                            <p className="text-[11px] text-muted-foreground">{p.celular || p.dni || '--'}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className={`text-[10px] ${p.id_tipo_persona === 2 ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                          {p.tipo_persona_nombre || (p.id_tipo_persona === 2 ? 'Cliente' : 'Prospecto')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  {/* Barra de información de selección */}
                  {personasSeleccionadasIds.length > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t bg-emerald-50/50">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-emerald-700">
                          {personasSeleccionadasIds.length} persona{personasSeleccionadasIds.length !== 1 ? 's' : ''} seleccionada{personasSeleccionadasIds.length !== 1 ? 's' : ''}
                        </span>
                        <button
                          onClick={() => setPersonasSeleccionadasIds([])}
                          className="text-[10px] text-emerald-600 hover:text-emerald-800 underline transition-colors"
                        >
                          Limpiar selección
                        </button>
                      </div>
                    </div>
                  )}
                  {/* Paginación */}
                  {personasPagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/20">
                      <span className="text-xs text-muted-foreground">
                        Página {personasPagination.page} de {personasPagination.totalPages}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handlePageChange(personasPagination.page - 1)}
                          disabled={personasPagination.page <= 1}
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        {Array.from({ length: Math.min(5, personasPagination.totalPages) }, (_, i) => {
                          let pageNum;
                          if (personasPagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (personasPagination.page <= 3) {
                            pageNum = i + 1;
                          } else if (personasPagination.page >= personasPagination.totalPages - 2) {
                            pageNum = personasPagination.totalPages - 4 + i;
                          } else {
                            pageNum = personasPagination.page - 2 + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`h-8 w-8 rounded-lg text-xs font-semibold transition-colors ${
                                personasPagination.page === pageNum
                                  ? 'bg-emerald-500 text-white'
                                  : 'text-muted-foreground hover:bg-muted'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => handlePageChange(personasPagination.page + 1)}
                          disabled={personasPagination.page >= personasPagination.totalPages}
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft className="h-4 w-4 rotate-180" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 border rounded-xl">
                  <Users className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No se encontraron personas</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Play className="h-5 w-5 text-amber-600" />
              </div>
              <span>Confirmar Ejecución</span>
            </DialogTitle>
            <DialogDescription className="pt-2">
              {loadingPendientes ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Calculando números pendientes...
                </span>
              ) : (
                <>
                  ¿Está seguro de ejecutar la campaña <strong>"{campania?.nombre}"</strong>?
                  <span className="block mt-2 text-sm">
                    Se llamarán <strong>{numerosPendientes ?? 0}</strong> número(s) pendiente(s) de <strong>{basesSeleccionadasIds.length > 0 ? basesSeleccionadasIds.length : basesAsignadas.length}</strong> base(s).
                  </span>
                  {numerosPendientes === 0 && (
                    <span className="block mt-2 text-sm text-red-500">
                      No hay números pendientes para llamar.
                    </span>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmarEjecucion}
              disabled={loadingPendientes || numerosPendientes === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Ejecutar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación de Reprocesar */}
      <Dialog open={showConfirmReprocesarModal} onOpenChange={setShowConfirmReprocesarModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <RotateCcw className="h-5 w-5 text-amber-600" />
              </div>
              <span>Confirmar Rellamada</span>
            </DialogTitle>
            <DialogDescription className="pt-2">
              {(() => {
                const totalNumeros = basesAsignadas.reduce((sum, b) => sum + (b.total_numeros || 0), 0);
                const esTipificacion = reprocesarConfig.tipo === 'tipificacion';
                return (
                  <>
                    ¿Está seguro de volver a llamar a la campaña <strong>"{campania?.nombre}"</strong>?
                    <span className="block mt-2 text-sm">
                      {esTipificacion ? (
                        <>Se llamarán los números con <strong>{reprocesarConfig.tipificaciones_seleccionadas.length}</strong> tipificación(es) seleccionada(s).</>
                      ) : (
                        <>Se llamarán <strong>{totalNumeros}</strong> número(s) de <strong>{basesAsignadas.length}</strong> base(s).</>
                      )}
                    </span>
                    {!esTipificacion && totalNumeros === 0 && (
                      <span className="block mt-2 text-sm text-red-500">
                        No hay números para llamar en las bases asignadas.
                      </span>
                    )}
                  </>
                );
              })()}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowConfirmReprocesarModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setShowConfirmReprocesarModal(false);
                handleReprocesar();
              }}
              disabled={
                reprocesando ||
                (reprocesarConfig.tipo === 'todos' && basesAsignadas.reduce((sum, b) => sum + (b.total_numeros || 0), 0) === 0)
              }
              className="bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50 disabled:cursor-not-allowed gap-2"
            >
              {reprocesando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Iniciando...
                </>
              ) : (
                <>
                  <Phone className="h-4 w-4" />
                  Confirmar
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Resultado */}
      <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {resultModal.type === 'success' ? (
                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              ) : (
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
              )}
              <span>{resultModal.title}</span>
            </DialogTitle>
            <DialogDescription className="pt-2">
              {resultModal.message}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end pt-4">
            <Button
              onClick={() => setShowResultModal(false)}
              className={resultModal.type === 'success'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'}
            >
              Aceptar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Volver a Llamar */}
      <Dialog open={showReprocesarModal} onOpenChange={setShowReprocesarModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Phone className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <span>Volver a Llamar</span>
                <p className="text-xs text-muted-foreground font-normal mt-0.5">Crear nueva ejecución para rellamar números</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Opción: Todos */}
            <div
              onClick={() => setReprocesarConfig({ ...reprocesarConfig, tipo: 'todos', tipificaciones_seleccionadas: [] })}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                reprocesarConfig.tipo === 'todos'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-border hover:border-amber-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                  reprocesarConfig.tipo === 'todos' ? 'border-amber-500' : 'border-muted-foreground'
                }`}>
                  {reprocesarConfig.tipo === 'todos' && (
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-sm">Todos los números ({basesAsignadas.reduce((sum, b) => sum + (b.total_numeros || 0), 0)})</p>
                  <p className="text-xs text-muted-foreground">Llama a todos los números de la campaña</p>
                </div>
              </div>
            </div>

            {/* Opción: Por tipificación */}
            <div
              onClick={() => setReprocesarConfig({ ...reprocesarConfig, tipo: 'tipificacion' })}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                reprocesarConfig.tipo === 'tipificacion'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-border hover:border-amber-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                  reprocesarConfig.tipo === 'tipificacion' ? 'border-amber-500' : 'border-muted-foreground'
                }`}>
                  {reprocesarConfig.tipo === 'tipificacion' && (
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-sm">Por tipificación</p>
                  <p className="text-xs text-muted-foreground">Solo los números con tipificaciones específicas</p>
                </div>
              </div>
            </div>

            {/* Selector de tipificaciones */}
            {reprocesarConfig.tipo === 'tipificacion' && (
              <div className="pl-8 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Seleccione las tipificaciones a reprocesar:
                </p>
                <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-2">
                  {tipificaciones.filter(t => !t.id_padre).map(tipPadre => (
                    <div key={tipPadre.id} className="space-y-1">
                      <label className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer">
                        <Checkbox
                          checked={reprocesarConfig.tipificaciones_seleccionadas.includes(tipPadre.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setReprocesarConfig(prev => ({
                                ...prev,
                                tipificaciones_seleccionadas: [...prev.tipificaciones_seleccionadas, tipPadre.id]
                              }));
                            } else {
                              setReprocesarConfig(prev => ({
                                ...prev,
                                tipificaciones_seleccionadas: prev.tipificaciones_seleccionadas.filter(id => id !== tipPadre.id)
                              }));
                            }
                          }}
                        />
                        <span className="text-sm font-medium">{tipPadre.nombre}</span>
                      </label>
                      {/* Tipificaciones hijas */}
                      {tipificaciones.filter(t => t.id_padre === tipPadre.id).map(tipHija => (
                        <label key={tipHija.id} className="flex items-center gap-2 p-2 pl-8 rounded hover:bg-muted/50 cursor-pointer">
                          <Checkbox
                            checked={reprocesarConfig.tipificaciones_seleccionadas.includes(tipHija.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setReprocesarConfig(prev => ({
                                  ...prev,
                                  tipificaciones_seleccionadas: [...prev.tipificaciones_seleccionadas, tipHija.id]
                                }));
                              } else {
                                setReprocesarConfig(prev => ({
                                  ...prev,
                                  tipificaciones_seleccionadas: prev.tipificaciones_seleccionadas.filter(id => id !== tipHija.id)
                                }));
                              }
                            }}
                          />
                          <span className="text-sm text-muted-foreground">{tipHija.nombre}</span>
                        </label>
                      ))}
                    </div>
                  ))}
                  {tipificaciones.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay tipificaciones disponibles
                    </p>
                  )}
                </div>
                {reprocesarConfig.tipificaciones_seleccionadas.length > 0 && (
                  <p className="text-xs text-amber-600">
                    {reprocesarConfig.tipificaciones_seleccionadas.length} tipificación(es) seleccionada(s)
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setShowReprocesarModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => setShowConfirmReprocesarModal(true)}
              disabled={reprocesarConfig.tipo === 'tipificacion' && reprocesarConfig.tipificaciones_seleccionadas.length === 0}
              className="bg-amber-600 hover:bg-amber-700 text-white gap-2"
            >
              <Phone className="h-4 w-4" />
              Volver a Llamar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
