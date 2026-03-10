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
  Plus,
  Trash2,
  Search,
  X,
  Settings,
  Phone,
  Save,
} from 'lucide-react';

const ESTADOS_EJECUCION = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  en_proceso: { label: 'En Proceso', color: 'bg-blue-100 text-blue-800' },
  ejecutado: { label: 'Ejecutado', color: 'bg-green-100 text-green-800' },
  fallido: { label: 'Fallido', color: 'bg-red-100 text-red-800' },
  cancelado: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800' },
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

  // Paginación de bases y ejecuciones
  const [basesPage, setBasesPage] = useState(1);
  const [ejecucionesPage, setEjecucionesPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  // Configuracion de llamadas
  const [showConfigLlamadas, setShowConfigLlamadas] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configLlamadas, setConfigLlamadas] = useState({
    dias: { lun: false, mar: false, mie: false, jue: false, vie: false, sab: false, dom: false },
    hora_inicio: '09:00',
    hora_fin: '18:00',
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

  const loadConfigLlamadas = async () => {
    try {
      const res = await apiClient.get(`/crm/campanias/${campaniaId}/config-llamadas`);
      const config = res?.data;
      if (config) {
        // Convertir dias_llamada string a objeto
        const diasArray = (config.dias_llamada || '').split(',').map(d => d.trim().toLowerCase());
        const diasObj = {
          lun: diasArray.includes('lun'),
          mar: diasArray.includes('mar'),
          mie: diasArray.includes('mie'),
          jue: diasArray.includes('jue'),
          vie: diasArray.includes('vie'),
          sab: diasArray.includes('sab'),
          dom: diasArray.includes('dom'),
        };
        setConfigLlamadas({
          dias: diasObj,
          hora_inicio: config.hora_inicio?.substring(0, 5) || '09:00',
          hora_fin: config.hora_fin?.substring(0, 5) || '18:00',
          max_intentos: config.max_intentos || 3,
        });
      }
    } catch (error) {
      console.error('Error al cargar config llamadas:', error);
    }
  };

  const handleSaveConfigLlamadas = async () => {
    try {
      setSavingConfig(true);
      // Convertir objeto dias a string
      const diasArray = Object.entries(configLlamadas.dias)
        .filter(([, v]) => v)
        .map(([k]) => k);

      if (diasArray.length === 0) {
        alert('Debe seleccionar al menos un día');
        return;
      }

      await apiClient.post(`/crm/campanias/${campaniaId}/config-llamadas`, {
        dias_llamada: diasArray.join(','),
        hora_inicio: configLlamadas.hora_inicio,
        hora_fin: configLlamadas.hora_fin,
        max_intentos: configLlamadas.max_intentos,
      });
      alert('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error al guardar config:', error);
      alert(error.msg || 'Error al guardar configuración');
    } finally {
      setSavingConfig(false);
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

  const handleEjecutar = async () => {
    if (confirm(`¿Está seguro de ejecutar la campaña "${campania?.nombre}"?`)) {
      setEjecutando(true);
      try {
        const response = await apiClient.post('/crm/campania-ejecuciones/ejecutar', {
          id_campania: parseInt(campaniaId),
          ids_base_numero: basesSeleccionadasIds.length > 0 ? basesSeleccionadasIds : undefined
        });
        alert(`Ejecución iniciada: ${response.data?.total_bases || 0} bases programadas`);
        loadCampania();
      } catch (error) {
        console.error('Error al ejecutar campaña:', error);
        alert(error.msg || 'Error al ejecutar campaña');
      } finally {
        setEjecutando(false);
      }
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
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg animate-pulse">
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/campanias')}
              className="h-10 w-10 rounded-xl"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Megaphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{campania.nombre}</h1>
              <p className="text-sm text-muted-foreground">{campania.descripcion || 'Sin descripción'}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {campania.tipo_campania_nombre && (
            <Badge variant="secondary" className="text-xs bg-violet-50 text-violet-700 border border-violet-200/50 gap-1">
              <Tag className="h-3 w-3" />
              {campania.tipo_campania_nombre}
            </Badge>
          )}
          {campania.tipo_campania_nombre?.toLowerCase() === 'llamadas' && (
            <Button
              variant={showConfigLlamadas ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowConfigLlamadas(!showConfigLlamadas)}
              className={showConfigLlamadas ? 'bg-blue-600 hover:bg-blue-700 text-white gap-2' : 'gap-2'}
            >
              <Settings className="h-4 w-4" />
              Config. Llamadas
            </Button>
          )}
          <Button
            onClick={handleEjecutar}
            disabled={ejecutando || basesAsignadas.length === 0}
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white gap-2"
          >
            {ejecutando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Ejecutar Campaña
          </Button>
        </div>
      </div>

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
                <p className="text-xs text-muted-foreground">Días, horario e intentos por contacto</p>
              </div>
            </div>

            {/* Dias */}
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">Días de llamada</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'lun', label: 'Lun' },
                  { key: 'mar', label: 'Mar' },
                  { key: 'mie', label: 'Mié' },
                  { key: 'jue', label: 'Jue' },
                  { key: 'vie', label: 'Vie' },
                  { key: 'sab', label: 'Sáb' },
                  { key: 'dom', label: 'Dom' },
                ].map(d => (
                  <button
                    key={d.key}
                    onClick={() => setConfigLlamadas(prev => ({ ...prev, dias: { ...prev.dias, [d.key]: !prev.dias[d.key] } }))}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                      configLlamadas.dias[d.key]
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25'
                        : 'bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/60'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Horario */}
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">Horario</label>
              <div className="flex items-center gap-3">
                <div className="flex-1 max-w-[150px]">
                  <label className="text-xs text-muted-foreground mb-1.5 block">Hora inicio</label>
                  <input
                    type="time"
                    value={configLlamadas.hora_inicio}
                    onChange={e => setConfigLlamadas(prev => ({ ...prev, hora_inicio: e.target.value }))}
                    className="w-full h-10 px-4 rounded-xl bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-background transition-colors"
                  />
                </div>
                <span className="text-muted-foreground text-sm mt-5">a</span>
                <div className="flex-1 max-w-[150px]">
                  <label className="text-xs text-muted-foreground mb-1.5 block">Hora fin</label>
                  <input
                    type="time"
                    value={configLlamadas.hora_fin}
                    onChange={e => setConfigLlamadas(prev => ({ ...prev, hora_fin: e.target.value }))}
                    className="w-full h-10 px-4 rounded-xl bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-background transition-colors"
                  />
                </div>
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
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
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
            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
              <p className="text-xs font-medium text-blue-800 mb-1">Resumen de configuración</p>
              <p className="text-xs text-blue-600">
                {Object.entries(configLlamadas.dias).filter(([, v]) => v).map(([k]) => k.charAt(0).toUpperCase() + k.slice(1)).join(', ') || 'Sin días seleccionados'}
                {' · '}
                {configLlamadas.hora_inicio} a {configLlamadas.hora_fin}
                {' · '}
                {configLlamadas.max_intentos} intento{configLlamadas.max_intentos !== 1 ? 's' : ''}
              </p>
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

          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/70 w-12">#</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/70">Base</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/70">Formato</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/70 text-center">Números</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {basesAsignadas
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
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleRemoveBase(base.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
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
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-amber-500" />
            Historial de Ejecuciones
          </h2>

          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-amber-500/70 w-16">#</TableHead>
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
                    <TableCell className="text-muted-foreground font-mono">{(ejecucionesPage - 1) * ITEMS_PER_PAGE + index + 1}</TableCell>
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
                      {ejecucion.resultado ? formatResultado(ejecucion.resultado) : '-'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {ejecucion.fecha_registro ? new Date(ejecucion.fecha_registro).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVerPersonas(ejecucion)}
                        className="h-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 gap-1"
                      >
                        <Users className="h-3.5 w-3.5" />
                        Personas
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
    </div>
  );
}
