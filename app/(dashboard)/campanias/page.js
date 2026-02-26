'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Megaphone,
  Plus,
  Search,
  FileText,
  ClipboardList,
  Play,
  Pencil,
  Trash2,
  X,
  Loader2,
  MoreHorizontal,
  TrendingUp,
  Zap,
  Tag,
  Database,
  Radio,
  Users,
  UserPlus,
  ChevronLeft,
  UserCheck2,
} from 'lucide-react';

const ESTADOS_EJECUCION = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  en_proceso: { label: 'En Proceso', color: 'bg-blue-100 text-blue-800' },
  ejecutado: { label: 'Ejecutado', color: 'bg-green-100 text-green-800' },
  fallido: { label: 'Fallido', color: 'bg-red-100 text-red-800' },
  cancelado: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800' },
};

const numsString = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];

export default function CampaniasPage() {
  const [campanias, setCampanias] = useState([]);
  const [basesDisponibles, setBasesDisponibles] = useState([]);
  const [formatos, setFormatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBasesModal, setShowBasesModal] = useState(false);
  const [showEjecucionesModal, setShowEjecucionesModal] = useState(false);
  const [showPlantillasModal, setShowPlantillasModal] = useState(false);
  const [editingCampania, setEditingCampania] = useState(null);
  const [selectedCampania, setSelectedCampania] = useState(null);
  const [basesAsignadas, setBasesAsignadas] = useState([]);
  const [baseSeleccionada, setBaseSeleccionada] = useState(null);
  const [plantillasDisponibles, setPlantillasDisponibles] = useState([]);
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null);
  const [ejecuciones, setEjecuciones] = useState([]);
  const [ejecutando, setEjecutando] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tiposCampania, setTiposCampania] = useState([]);
  // Personas por ejecucion
  const [selectedEjecucion, setSelectedEjecucion] = useState(null);
  const [personasEjecucion, setPersonasEjecucion] = useState([]);
  const [loadingPersonas, setLoadingPersonas] = useState(false);
  const [searchPersona, setSearchPersona] = useState('');
  const [personasResultados, setPersonasResultados] = useState([]);
  const [loadingBusqueda, setLoadingBusqueda] = useState(false);
  const [filtroTipoPersona, setFiltroTipoPersona] = useState('todos'); // 'todos' | 'prospecto' | 'cliente'
  const [personasSeleccionadas, setPersonasSeleccionadas] = useState([]); // ids seleccionados para agregar en lote
  const [agregandoLote, setAgregandoLote] = useState(false);

  // Estados para el modal de crear/editar
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    id_formato: '',
    id_tipo_campania: ''
  });
  const [basesSeleccionadas, setBasesSeleccionadas] = useState([]);
  const [searchBase, setSearchBase] = useState('');
  const [showBaseDropdown, setShowBaseDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowBaseDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [campaniasRes, basesRes, formatosRes, plantillasRes, tiposRes] = await Promise.all([
        apiClient.get('/crm/campanias'),
        apiClient.get('/crm/bases-numeros'),
        apiClient.get('/crm/formatos'),
        apiClient.get('/crm/plantillas'),
        apiClient.get('/crm/tipos-campania'),
      ]);
      setCampanias(campaniasRes?.data || []);
      setBasesDisponibles(basesRes?.data || []);
      setFormatos(formatosRes?.data || []);
      setPlantillasDisponibles(plantillasRes?.data || []);
      setTiposCampania(tiposRes?.data || []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let campaniaId;
      if (editingCampania) {
        await apiClient.put(`/crm/campanias/${editingCampania.id}`, {
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          id_tipo_campania: formData.id_tipo_campania ? parseInt(formData.id_tipo_campania) : null,
        });
        campaniaId = editingCampania.id;
      } else {
        const response = await apiClient.post('/crm/campanias', {
          nombre: formData.nombre,
          descripcion: formData.descripcion,
          id_tipo_campania: formData.id_tipo_campania ? parseInt(formData.id_tipo_campania) : null,
        });
        campaniaId = response.data?.id;
      }

      // Agregar bases seleccionadas si es nueva campania
      if (!editingCampania && campaniaId && basesSeleccionadas.length > 0) {
        for (const base of basesSeleccionadas) {
          try {
            await apiClient.post('/crm/campania-bases', {
              id_campania: campaniaId,
              id_base_numero: base.id
            });
          } catch (err) {
            console.error(`Error al agregar base ${base.nombre}:`, err);
          }
        }
      }

      setShowModal(false);
      setEditingCampania(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error al guardar campania:', error);
      alert(error.msg || 'Error al guardar campania');
    }
  };

  const handleEdit = (campania) => {
    setEditingCampania(campania);
    setFormData({
      nombre: campania.nombre || '',
      descripcion: campania.descripcion || '',
      id_formato: '',
      id_tipo_campania: campania.id_tipo_campania ? String(campania.id_tipo_campania) : ''
    });
    setBasesSeleccionadas([]);
    setSearchBase('');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Esta seguro de eliminar esta campania?')) {
      try {
        await apiClient.delete(`/crm/campanias/${id}`);
        loadData();
      } catch (error) {
        console.error('Error al eliminar campania:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      id_formato: '',
      id_tipo_campania: ''
    });
    setBasesSeleccionadas([]);
    setSearchBase('');
    setShowBaseDropdown(false);
  };

  const openNewModal = () => {
    setEditingCampania(null);
    resetForm();
    setShowModal(true);
  };

  // Filtrar bases por formato seleccionado y texto de busqueda
  const basesFiltradas = basesDisponibles.filter(base => {
    const matchFormato = formData.id_formato ? base.id_formato === parseInt(formData.id_formato) : true;
    const matchSearch = base.nombre.toLowerCase().includes(searchBase.toLowerCase());
    const noSeleccionada = !basesSeleccionadas.some(bs => bs.id === base.id);
    return matchFormato && matchSearch && noSeleccionada;
  });

  // Agregar base a la seleccion
  const handleAddBaseToSelection = (base) => {
    setBasesSeleccionadas([...basesSeleccionadas, base]);
    setSearchBase('');
    setShowBaseDropdown(false);
  };

  // Quitar base de la seleccion
  const handleRemoveBaseFromSelection = (baseId) => {
    setBasesSeleccionadas(basesSeleccionadas.filter(b => b.id !== baseId));
  };

  // Gestionar bases de campania (modal separado)
  const handleViewBases = async (campania) => {
    setSelectedCampania(campania);
    try {
      const response = await apiClient.get(`/crm/campanias/${campania.id}/bases`);
      const bases = response?.data || [];
      setBasesAsignadas(bases);
      setBaseSeleccionada(bases.length > 0 ? bases[0].id_base_numero : null);
      setShowBasesModal(true);
    } catch (error) {
      console.error('Error al cargar bases:', error);
    }
  };

  const handleAddBase = async (id_base_numero) => {
    try {
      await apiClient.post('/crm/campania-bases', {
        id_campania: selectedCampania.id,
        id_base_numero
      });
      const response = await apiClient.get(`/crm/campanias/${selectedCampania.id}/bases`);
      setBasesAsignadas(response?.data || []);
      loadData();
    } catch (error) {
      console.error('Error al agregar base:', error);
      alert(error.msg || 'Error al agregar base');
    }
  };

  const handleRemoveBase = async (id) => {
    if (confirm('Esta seguro de quitar esta base de la campania?')) {
      try {
        await apiClient.delete(`/crm/campania-bases/${id}`);
        const response = await apiClient.get(`/crm/campanias/${selectedCampania.id}/bases`);
        setBasesAsignadas(response?.data || []);
        loadData();
      } catch (error) {
        console.error('Error al quitar base:', error);
      }
    }
  };

  // Ver ejecuciones
  const handleViewEjecuciones = async (campania) => {
    setSelectedCampania(campania);
    try {
      const response = await apiClient.get(`/crm/campanias/${campania.id}/ejecuciones`);
      setEjecuciones(response?.data || []);
      setShowEjecucionesModal(true);
    } catch (error) {
      console.error('Error al cargar ejecuciones:', error);
    }
  };

  // Ver plantillas
  const handleViewPlantillas = () => {
    setPlantillaSeleccionada(plantillasDisponibles.length > 0 ? plantillasDisponibles[0] : null);
    setShowPlantillasModal(true);
  };

  // Ejecutar campania
  const handleEjecutar = async (campania) => {
    if (confirm(`Esta seguro de ejecutar la campania "${campania.nombre}"? Esto creara ejecuciones pendientes para todas las bases asignadas.`)) {
      try {
        const [response, tipificacionRes] = await Promise.all([
          apiClient.get(`/crm/bases-numeros/${baseSeleccionada}/detalles`),
          apiClient.get('/crm/tipificacion-llamada'),
        ]);
        const numeros = response?.data;
        const tipificaciones = tipificacionRes?.data || [];
        if (numeros) {
          const formatearTelefono = (telefono) => {
            const limpio = String(telefono).replace(/\D/g, '');
            return limpio.startsWith('51') ? limpio : `51${limpio}`;
          };

          const resultados = await Promise.allSettled(
            numeros.data.map(async (num) => {
              const telefonoFormateado = formatearTelefono(num.telefono);
              const personaRes = await apiClient.post('/crm/persona', {
                celular: telefonoFormateado,
                id_estado: 1,
              });
              const body = {
                destination: telefonoFormateado,
                data: {
                  id: personaRes?.data?.id,
                  nombre_completo: num.nombre,
                  celular: telefonoFormateado,
                  ...num.json_adicional
                },
                extras: {
                  voice: "bacfa559-a200-4377-9d0e-fcae7c766a1f",
                  tipificaciones,
                  empresa: {
                    id: num.id_empresa,
                    nombre: num.nombre_comercial
                  }
                }
              };
              return apiClient.post("https://bot.ai-you.io/api/calls/ultravox", body);
            })
          );

          resultados.forEach((resultado, index) => {
            const telefono = numeros[index].telefono;
            if (resultado.success) {
              console.log(`Numero ${telefono} realizado con exito`);
            } else {
              console.log(`Error al llamar al numero ${telefono}`);
            }
          });
        }
      }
      catch (err) {
        console.error("Error al realizar las llamadas: ", err);
      }
    }

    // setEjecutando(true);
    // try {
    //   const response = await apiClient.post('/crm/campania-ejecuciones/ejecutar', {
    //     id_campania: campania.id
    //   });
    //   alert(`Ejecucion iniciada: ${response.data?.total_bases || 0} bases programadas`);
    //   loadData();
    // } catch (error) {
    //   console.error('Error al ejecutar campania:', error);
    //   alert(error.msg || 'Error al ejecutar campania');
    // } finally {
    //   setEjecutando(false);
    // }
  };

  // ===== PERSONAS POR EJECUCION =====
  const loadPersonasEjecucion = async (idEjecucion) => {
    try {
      setLoadingPersonas(true);
      const res = await apiClient.get(`/crm/campania-ejecuciones/${idEjecucion}/personas`);
      setPersonasEjecucion(res?.data || []);
    } catch (error) {
      console.error('Error al cargar personas de ejecucion:', error);
    } finally {
      setLoadingPersonas(false);
    }
  };

  const [todasPersonas, setTodasPersonas] = useState([]);

  const cargarTodasPersonas = async () => {
    try {
      setLoadingBusqueda(true);
      const res = await apiClient.get('/crm/personas');
      const todas = res?.data?.data || res?.data || [];
      setTodasPersonas(todas);
      setPersonasResultados(todas);
    } catch (error) {
      console.error('Error al cargar personas:', error);
    } finally {
      setLoadingBusqueda(false);
    }
  };

  const buscarPersonas = (termino) => {
    if (!termino || termino.trim() === '') {
      setPersonasResultados(todasPersonas);
      return;
    }
    const lower = termino.toLowerCase();
    const filtradas = todasPersonas.filter(p =>
      (p.nombre_completo && p.nombre_completo.toLowerCase().includes(lower)) ||
      (p.celular && p.celular.includes(termino)) ||
      (p.dni && p.dni.includes(termino))
    );
    setPersonasResultados(filtradas);
  };

  const handleAddPersona = async (persona) => {
    if (!selectedEjecucion) return;
    // Validación frontend: no agregar si ya está
    if (personasEjecucion.some(pe => pe.id_persona === persona.id)) return;
    try {
      await apiClient.post(`/crm/campania-ejecuciones/${selectedEjecucion.id}/personas`, {
        persona_ids: [persona.id]
      });
      await loadPersonasEjecucion(selectedEjecucion.id);
    } catch (error) {
      console.error('Error al agregar persona:', error);
      alert(error?.msg || 'Error al agregar persona');
    }
  };

  const handleRemovePersona = async (idCampaniaPersona) => {
    try {
      await apiClient.delete(`/crm/campania-personas/${idCampaniaPersona}`);
      await loadPersonasEjecucion(selectedEjecucion.id);
    } catch (error) {
      console.error('Error al quitar persona:', error);
    }
  };

  const handleVerPersonas = (ejecucion) => {
    setSelectedEjecucion(ejecucion);
    setSearchPersona('');
    setPersonasResultados([]);
    setTodasPersonas([]);
    setFiltroTipoPersona('todos');
    setPersonasSeleccionadas([]);
    loadPersonasEjecucion(ejecucion.id);
    cargarTodasPersonas();
  };

  const handleToggleSeleccion = (persona) => {
    setPersonasSeleccionadas(prev =>
      prev.some(p => p.id === persona.id)
        ? prev.filter(p => p.id !== persona.id)
        : [...prev, persona]
    );
  };

  const handleAgregarLote = async () => {
    if (!selectedEjecucion || personasSeleccionadas.length === 0) return;
    // Filtrar las que ya están asignadas (doble validación frontend)
    const idsNuevas = personasSeleccionadas
      .filter(p => !personasEjecucion.some(pe => pe.id_persona === p.id))
      .map(p => p.id);
    if (idsNuevas.length === 0) {
      setPersonasSeleccionadas([]);
      return;
    }
    try {
      setAgregandoLote(true);
      await apiClient.post(`/crm/campania-ejecuciones/${selectedEjecucion.id}/personas`, {
        persona_ids: idsNuevas
      });
      setPersonasSeleccionadas([]);
      await loadPersonasEjecucion(selectedEjecucion.id);
    } catch (error) {
      console.error('Error al agregar personas:', error);
      alert(error?.msg || 'Error al agregar personas');
    } finally {
      setAgregandoLote(false);
    }
  };

  // Obtener bases no asignadas para el modal de gestion
  const basesNoAsignadas = basesDisponibles.filter(
    base => !basesAsignadas.some(ba => ba.id_base_numero === base.id)
  );

  // Filtrar campanias por busqueda
  const filteredCampanias = campanias.filter(c => {
    return c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalCampanias = campanias.length;
  const totalBases = basesDisponibles.length;
  const totalEjecuciones = campanias.reduce((sum, c) => sum + (c.total_ejecuciones || 0), 0);
  const totalPlantillas = plantillasDisponibles.length;

  const STATS = [
    {
      label: 'Campanias',
      value: totalCampanias,
      icon: Megaphone,
      gradient: 'from-indigo-500 to-indigo-600',
      iconBg: 'from-indigo-500 to-indigo-600',
      glow: 'rgba(99, 102, 241, 0.15)',
      change: 'Total',
    },
    {
      label: 'Bases',
      value: totalBases,
      icon: Database,
      gradient: 'from-cyan-500 to-cyan-600',
      iconBg: 'from-cyan-500 to-teal-500',
      glow: 'rgba(6, 182, 212, 0.15)',
      change: 'Disponibles',
    },
    {
      label: 'Ejecuciones',
      value: totalEjecuciones,
      icon: Zap,
      gradient: 'from-amber-500 to-orange-500',
      iconBg: 'from-amber-500 to-orange-500',
      glow: 'rgba(245, 158, 11, 0.15)',
      change: 'Historico',
    },
    {
      label: 'Plantillas',
      value: totalPlantillas,
      icon: FileText,
      gradient: 'from-violet-500 to-purple-600',
      iconBg: 'from-violet-500 to-purple-600',
      glow: 'rgba(139, 92, 246, 0.15)',
      change: 'Disponibles',
    },
  ];

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
            <span className="text-sm font-medium">Cargando campanias...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ========== HEADER ========== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Megaphone className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gradient">Campanias de Llamadas</h1>
              <p className="text-sm text-muted-foreground">Gestiona las campanias y sus bases de numeros</p>
            </div>
          </div>
        </div>
        <Button
          onClick={openNewModal}
          className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-lg shadow-indigo-500/25 text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          Nueva Campania
        </Button>
      </div>

      {/* ========== STATS ========== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 animate-scale-in"
              style={{ animationDelay: `${(i + 1) * 100}ms` }}
            >
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`} />
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 30% 50%, ${stat.glow}, transparent 70%)`,
                }}
              />
              <CardContent className="p-5 relative z-10">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                    <p className="text-3xl font-bold tracking-tight animate-count-up" style={{ animationDelay: `${(i + 1) * 150}ms` }}>
                      {stat.value.toLocaleString()}
                    </p>
                    <Badge variant="secondary" className="text-[10px] font-semibold gap-1 px-2 py-0.5">
                      <TrendingUp className="h-2.5 w-2.5" />
                      {stat.change}
                    </Badge>
                  </div>
                  <div
                    className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${stat.iconBg} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
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

      {/* ========== SEARCH BAR ========== */}
      <Card className="overflow-hidden animate-scale-in" style={{ animationDelay: '500ms' }}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md group">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-md bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 flex items-center justify-center">
                <Search className="h-3 w-3 text-indigo-500 group-focus-within:text-cyan-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Buscar campania..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-11 pr-9 text-sm bg-muted/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-background placeholder:text-muted-foreground/40 transition-all duration-300"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
                >
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto">
              <Badge variant="outline" className="gap-1 font-normal">
                <Megaphone className="h-3 w-3" />
                {filteredCampanias.length} campania{filteredCampanias.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========== CAMPAIGNS TABLE ========== */}
      <Card className="overflow-hidden animate-scale-in" style={{ animationDelay: '600ms' }}>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/70">Nombre</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/70">Tipo</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/70">Descripcion</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/70 text-center">Bases</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/70 text-center">Ejecuciones</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCampanias.map((campania) => (
              <TableRow
                key={campania.id}
                className="table-row-premium group"
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 flex items-center justify-center group-hover:from-indigo-500/20 group-hover:to-cyan-500/20 transition-colors">
                      <Megaphone className="h-4 w-4 text-indigo-500" />
                    </div>
                    <span className="font-semibold text-sm text-foreground">{campania.nombre}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {campania.tipo_campania_nombre ? (
                    <Badge variant="secondary" className="text-[10px] bg-violet-50 text-violet-700 border border-violet-200/50 gap-1">
                      <Tag className="h-2.5 w-2.5" />
                      {campania.tipo_campania_nombre}
                    </Badge>
                  ) : <span className="text-muted-foreground/30 text-xs">--</span>}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground max-w-[200px] truncate block">
                    {campania.descripcion || '-'}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewBases(campania)}
                    className="gap-1.5 text-xs font-medium h-8 hover:bg-cyan-50 hover:text-cyan-700"
                  >
                    <Database className="h-3.5 w-3.5" />
                    {campania.total_bases || 0} bases
                  </Button>
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewEjecuciones(campania)}
                    className="gap-1.5 text-xs font-medium h-8 hover:bg-amber-50 hover:text-amber-700"
                  >
                    <ClipboardList className="h-3.5 w-3.5" />
                    {campania.total_ejecuciones || 0}
                  </Button>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() => handleEjecutar(campania)}
                        disabled={ejecutando || campania.total_bases === 0}
                        className="gap-2 cursor-pointer"
                      >
                        <Play className="h-4 w-4 text-emerald-500" />
                        <span>Ejecutar</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleViewBases(campania)}
                        className="gap-2 cursor-pointer"
                      >
                        <Database className="h-4 w-4 text-cyan-500" />
                        <span>Ver Bases</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleViewEjecuciones(campania)}
                        className="gap-2 cursor-pointer"
                      >
                        <ClipboardList className="h-4 w-4 text-amber-500" />
                        <span>Ver Ejecuciones</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={handleViewPlantillas}
                        className="gap-2 cursor-pointer"
                      >
                        <FileText className="h-4 w-4 text-violet-500" />
                        <span>Ver Plantillas</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleEdit(campania)}
                        className="gap-2 cursor-pointer"
                      >
                        <Pencil className="h-4 w-4" />
                        <span>Editar</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(campania.id)}
                        className="gap-2 cursor-pointer text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Eliminar</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredCampanias.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 flex items-center justify-center mb-4">
              <Megaphone className="h-8 w-8 text-indigo-400" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              {searchTerm ? 'Sin resultados' : 'No hay campanias'}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              {searchTerm ? 'Intenta con otro termino de busqueda' : 'Crea tu primera campania para comenzar'}
            </p>
            {!searchTerm && (
              <Button onClick={openNewModal} variant="outline" size="sm" className="gap-2">
                <Plus className="h-3.5 w-3.5" />
                Crear Campania
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* ========== MODAL: CREATE/EDIT CAMPAIGN ========== */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
                <Megaphone className="h-4 w-4 text-white" />
              </div>
              {editingCampania ? 'Editar Campania' : 'Nueva Campania'}
            </DialogTitle>
            <DialogDescription>
              {editingCampania ? 'Modifica los datos de la campania' : 'Configura los datos de tu nueva campania'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                Nombre *
              </label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                className="w-full h-10 px-3 text-sm rounded-xl bg-muted/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-background transition-colors border border-transparent focus:border-indigo-200"
                placeholder="Nombre de la campania"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                Descripcion
              </label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full px-3 py-2.5 text-sm rounded-xl bg-muted/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-background transition-colors border border-transparent focus:border-indigo-200 resize-none"
                rows={2}
                placeholder="Descripcion de la campania"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                Tipo de Campania
              </label>
              <select
                value={formData.id_tipo_campania}
                onChange={(e) => setFormData({ ...formData, id_tipo_campania: e.target.value })}
                className="w-full h-10 px-3 text-sm rounded-xl bg-muted/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-background transition-colors"
              >
                <option value="">Sin tipo</option>
                {tiposCampania.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            </div>

            {/* Seccion de seleccion de bases (solo para nueva campania) */}
            {!editingCampania && (
              <>
                <Separator />

                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Formato (filtro)
                  </label>
                  <select
                    value={formData.id_formato}
                    onChange={(e) => setFormData({ ...formData, id_formato: e.target.value })}
                    className="w-full h-10 px-3 text-sm rounded-xl bg-muted/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-background transition-colors"
                  >
                    <option value="">Todos los formatos</option>
                    {formatos.map((formato) => (
                      <option key={formato.id} value={formato.id}>{formato.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="relative space-y-1.5" ref={dropdownRef}>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                    Agregar Bases
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Search className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <input
                      type="text"
                      value={searchBase}
                      onChange={(e) => {
                        setSearchBase(e.target.value);
                        setShowBaseDropdown(true);
                      }}
                      onFocus={() => setShowBaseDropdown(true)}
                      placeholder="Buscar base por nombre..."
                      className="w-full h-10 pl-9 pr-3 text-sm rounded-xl bg-muted/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-background transition-colors border border-transparent focus:border-indigo-200"
                    />
                  </div>

                  {/* Dropdown de bases */}
                  {showBaseDropdown && basesFiltradas.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {basesFiltradas.map((base) => (
                        <button
                          key={base.id}
                          type="button"
                          onClick={() => handleAddBaseToSelection(base)}
                          className="w-full px-4 py-2.5 text-left hover:bg-muted/50 flex items-center justify-between transition-colors first:rounded-t-xl last:rounded-b-xl"
                        >
                          <span className="text-sm text-foreground">{base.nombre}</span>
                          <Badge variant="secondary" className="text-[10px]">
                            {formatos.find(f => f.id === base.id_formato)?.nombre || 'Sin formato'}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}

                  {showBaseDropdown && searchBase && basesFiltradas.length === 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-xl shadow-lg p-3 text-center text-muted-foreground text-sm">
                      No se encontraron bases
                    </div>
                  )}
                </div>

                {/* Bases seleccionadas */}
                {basesSeleccionadas.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Bases seleccionadas ({basesSeleccionadas.length})
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {basesSeleccionadas.map((base) => (
                        <Badge
                          key={base.id}
                          variant="secondary"
                          className="gap-1.5 pl-3 pr-1.5 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200/50"
                        >
                          {base.nombre}
                          <button
                            type="button"
                            onClick={() => handleRemoveBaseFromSelection(base.id)}
                            className="ml-1 h-4 w-4 rounded-full bg-indigo-200/50 hover:bg-indigo-300/50 flex items-center justify-center transition-colors"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white gap-2"
              >
                {editingCampania ? 'Actualizar' : 'Crear Campania'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========== MODAL: BASES DE CAMPANIA ========== */}
      <Dialog open={showBasesModal} onOpenChange={setShowBasesModal}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center">
                <Database className="h-4 w-4 text-white" />
              </div>
              Bases de la Campania
            </DialogTitle>
            <DialogDescription>
              {selectedCampania?.nombre}
            </DialogDescription>
          </DialogHeader>

          {/* Agregar nueva base */}
          {basesNoAsignadas.length > 0 && (
            <Card className="bg-muted/30 border-dashed">
              <CardContent className="p-4">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                  Agregar base
                </label>
                <div className="flex gap-2">
                  <select
                    id="addBaseSelect"
                    className="flex-1 h-10 px-3 text-sm rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-colors border border-border"
                    defaultValue=""
                  >
                    <option value="" disabled>Seleccionar base...</option>
                    {basesNoAsignadas.map((base) => (
                      <option key={base.id} value={base.id}>
                        {base.nombre} - {formatos.find(f => f.id === base.id_formato)?.nombre || 'Sin formato'}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    onClick={() => {
                      const select = document.getElementById('addBaseSelect');
                      if (select.value) {
                        handleAddBase(parseInt(select.value));
                        select.value = '';
                      }
                    }}
                    className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Agregar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de bases asignadas */}
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/70 w-16">Seleccionar</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/70">Base</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/70">Formato</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-cyan-500/70 text-center">Numeros</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {basesAsignadas.map((base) => (
                  <TableRow
                    key={base.id}
                    className={`table-row-premium cursor-pointer ${baseSeleccionada === base.id_base_numero ? 'bg-indigo-50/50' : ''}`}
                    onClick={() => setBaseSeleccionada(base.id_base_numero)}
                  >
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <input
                          type="radio"
                          name="baseSeleccionada"
                          checked={baseSeleccionada === base.id_base_numero}
                          onChange={() => setBaseSeleccionada(base.id_base_numero)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{base.base_nombre}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200/50">
                        {base.formato_nombre || 'Sin formato'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">{base.total_numeros || 0}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveBase(base.id);
                        }}
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
                <p className="text-sm text-muted-foreground">No hay bases asignadas a esta campania</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ========== MODAL: EJECUCIONES ========== */}
      <Dialog open={showEjecucionesModal} onOpenChange={(open) => { if (!open) { setShowEjecucionesModal(false); setSelectedEjecucion(null); setPersonasEjecucion([]); setPersonasResultados([]); setTodasPersonas([]); setSearchPersona(''); setPersonasSeleccionadas([]); setFiltroTipoPersona('todos'); } }}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEjecucion ? (
                <>
                  <button
                    onClick={() => { setSelectedEjecucion(null); setPersonasEjecucion([]); setPersonasResultados([]); setTodasPersonas([]); setSearchPersona(''); setPersonasSeleccionadas([]); setFiltroTipoPersona('todos'); }}
                    className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <span>Personas — Ejecucion #{selectedEjecucion.id}</span>
                </>
              ) : (
                <>
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-white" />
                  </div>
                  Ejecuciones de Campania
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedCampania?.nombre}{selectedEjecucion ? ` · ${selectedEjecucion.base_nombre}` : ''}
            </DialogDescription>
          </DialogHeader>

          {/* ---- VISTA: LISTA DE EJECUCIONES ---- */}
          {!selectedEjecucion && (
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-amber-500/70">ID</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-amber-500/70">Base</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-amber-500/70">Estado</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-amber-500/70">Resultado</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-amber-500/70">Registrado</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-amber-500/70">Inicio</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-amber-500/70">Fin</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ejecuciones.map((ejecucion) => (
                    <TableRow key={ejecucion.id} className="table-row-premium group">
                      <TableCell className="text-sm text-muted-foreground font-mono">#{ejecucion.id}</TableCell>
                      <TableCell className="text-sm font-medium">{ejecucion.base_nombre}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] font-semibold ${ESTADOS_EJECUCION[ejecucion.estado_ejecucion]?.color || 'bg-gray-100 text-gray-800'}`}
                        >
                          {ESTADOS_EJECUCION[ejecucion.estado_ejecucion]?.label || ejecucion.estado_ejecucion}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                        {ejecucion.resultado || '-'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {ejecucion.fecha_registro ? new Date(ejecucion.fecha_registro).toLocaleString() : '-'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {ejecucion.fecha_inicio ? new Date(ejecucion.fecha_inicio).toLocaleString() : '-'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {ejecucion.fecha_fin ? new Date(ejecucion.fecha_fin).toLocaleString() : '-'}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleVerPersonas(ejecucion)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded-lg hover:bg-emerald-50"
                        >
                          <Users className="h-3.5 w-3.5" />
                          Personas
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {ejecuciones.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12">
                  <ClipboardList className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No hay ejecuciones registradas para esta campania</p>
                </div>
              )}
            </div>
          )}

          {/* ---- VISTA: PERSONAS DE LA EJECUCION ---- */}
          {selectedEjecucion && (
            <div className="space-y-4">
              {/* Buscador + Filtro */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <UserPlus className="h-3 w-3" />
                  Buscar y agregar persona
                </label>

                {/* Fila: input + filtro tipo */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                      <Search className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <input
                      type="text"
                      placeholder="Filtrar por nombre, celular o DNI..."
                      value={searchPersona}
                      onChange={(e) => { setSearchPersona(e.target.value); buscarPersonas(e.target.value); }}
                      className="w-full h-10 pl-10 pr-9 text-sm rounded-xl bg-muted/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-background transition-colors"
                    />
                    {searchPersona && (
                      <button onClick={() => { setSearchPersona(''); buscarPersonas(''); setPersonasSeleccionadas([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors">
                        <X className="h-3 w-3 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                  {/* Filtro tipo persona */}
                  <div className="flex rounded-xl overflow-hidden border bg-muted/30 text-[11px] font-semibold shrink-0">
                    {[
                      { key: 'todos', label: 'Todos' },
                      { key: 'prospecto', label: 'Prospectos' },
                      { key: 'cliente', label: 'Clientes' },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setFiltroTipoPersona(key)}
                        className={`px-3 h-10 transition-colors ${filtroTipoPersona === key ? 'bg-emerald-500 text-white' : 'text-muted-foreground hover:bg-muted/60'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lista de personas disponibles */}
                {loadingBusqueda && (
                  <div className="flex items-center justify-center py-6 gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                    <span className="text-xs text-muted-foreground">Cargando personas...</span>
                  </div>
                )}
                {!loadingBusqueda && (() => {
                  const resultadosFiltrados = personasResultados.filter(p => {
                    if (filtroTipoPersona === 'prospecto') return p.id_tipo_persona === 1;
                    if (filtroTipoPersona === 'cliente') return p.id_tipo_persona === 2;
                    return true;
                  });
                  return (
                    <>
                      {resultadosFiltrados.length > 0 && (
                        <div className="border rounded-xl overflow-hidden">
                          <div className="max-h-52 overflow-y-auto">
                            {resultadosFiltrados.map((p) => {
                              const yaAgregada = personasEjecucion.some(pe => pe.id_persona === p.id);
                              const seleccionada = personasSeleccionadas.some(ps => ps.id === p.id);
                              return (
                                <div key={p.id} className={`flex items-center justify-between px-4 py-2.5 hover:bg-muted/40 transition-colors border-b last:border-b-0 ${seleccionada ? 'bg-emerald-50/50' : ''}`}>
                                  <div className="flex items-center gap-3 min-w-0">
                                    {!yaAgregada && (
                                      <Checkbox
                                        checked={seleccionada}
                                        onCheckedChange={() => handleToggleSeleccion(p)}
                                        className="shrink-0 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                                      />
                                    )}
                                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/10 flex items-center justify-center shrink-0">
                                      <span className="text-[10px] font-bold text-emerald-600">{p.nombre_completo ? p.nombre_completo.charAt(0).toUpperCase() : '?'}</span>
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium truncate">{p.nombre_completo || 'Sin nombre'}</p>
                                      <p className="text-[11px] text-muted-foreground">{p.celular || p.dni || '--'}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <Badge variant="secondary" className={`text-[10px] ${p.id_tipo_persona === 2 ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                                      {p.tipo_persona_nombre || (p.id_tipo_persona === 2 ? 'Cliente' : 'Prospecto')}
                                    </Badge>
                                    {yaAgregada ? (
                                      <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1"><UserCheck2 className="h-3 w-3" /> Ya agregado</span>
                                    ) : (
                                      <button onClick={() => { handleAddPersona(p); setPersonasSeleccionadas(prev => prev.filter(ps => ps.id !== p.id)); }} className="h-7 w-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center transition-colors" title="Agregar solo este">
                                        <Plus className="h-3.5 w-3.5 text-emerald-600" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {/* Barra de selección múltiple */}
                          {personasSeleccionadas.length > 0 && (
                            <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-50 border-t">
                              <span className="text-xs font-medium text-emerald-700">
                                {personasSeleccionadas.length} persona{personasSeleccionadas.length !== 1 ? 's' : ''} seleccionada{personasSeleccionadas.length !== 1 ? 's' : ''}
                              </span>
                              <div className="flex items-center gap-2">
                                <button onClick={() => setPersonasSeleccionadas([])} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                                  Deseleccionar
                                </button>
                                <button
                                  onClick={handleAgregarLote}
                                  disabled={agregandoLote}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors disabled:opacity-60"
                                >
                                  {agregandoLote ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserPlus className="h-3 w-3" />}
                                  Agregar {personasSeleccionadas.length}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {!loadingBusqueda && personasResultados.length > 0 && resultadosFiltrados.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-2">No hay personas de este tipo</p>
                      )}
                      {!loadingBusqueda && personasResultados.length === 0 && !loadingBusqueda && (
                        <p className="text-xs text-muted-foreground text-center py-2">No se encontraron personas</p>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Lista de personas ya asignadas */}
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Users className="h-3 w-3" />
                  Personas asignadas ({personasEjecucion.length})
                </label>
                <div className="rounded-xl border overflow-hidden">
                  {loadingPersonas ? (
                    <div className="flex items-center justify-center py-8 gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                      <span className="text-xs text-muted-foreground">Cargando...</span>
                    </div>
                  ) : personasEjecucion.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableHead className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/70">Nombre</TableHead>
                          <TableHead className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/70">Celular</TableHead>
                          <TableHead className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/70">DNI</TableHead>
                          <TableHead className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/70">Tipo</TableHead>
                          <TableHead className="w-10" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {personasEjecucion.map((p) => (
                          <TableRow key={p.id} className="table-row-premium group">
                            <TableCell className="text-sm font-medium">{p.nombre_completo || '-'}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{p.celular || '-'}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{p.dni || '-'}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={`text-[10px] ${p.id_tipo_persona === 2 ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                                {p.tipo_persona_nombre || (p.id_tipo_persona === 2 ? 'Cliente' : 'Prospecto')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <button
                                onClick={() => handleRemovePersona(p.id)}
                                className="opacity-0 group-hover:opacity-100 h-7 w-7 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition-all"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10">
                      <Users className="h-8 w-8 text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">Sin personas asignadas</p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">Usa el buscador para agregar</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========== MODAL: PLANTILLAS ========== */}
      <Dialog open={showPlantillasModal} onOpenChange={setShowPlantillasModal}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <FileText className="h-4 w-4 text-white" />
              </div>
              Seleccionar Plantilla
            </DialogTitle>
            <DialogDescription>
              Elige la plantilla para la ejecucion de la campania
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-violet-500/70 w-16">Seleccionar</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-widest text-violet-500/70">Nombre</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plantillasDisponibles.map((plantilla) => (
                  <TableRow
                    key={plantilla.id}
                    className={`table-row-premium cursor-pointer ${plantillaSeleccionada?.id === plantilla.id ? 'bg-violet-50/50' : ''}`}
                    onClick={() => setPlantillaSeleccionada(plantilla)}
                  >
                    <TableCell>
                      <div className="flex items-center justify-center">
                        <input
                          type="radio"
                          name="plantillaSeleccionada"
                          checked={plantillaSeleccionada?.id === plantilla.id}
                          onChange={() => setPlantillaSeleccionada(plantilla)}
                          className="h-4 w-4 text-violet-600 focus:ring-violet-500 border-gray-300"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-medium">{plantilla.nombre}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {plantillasDisponibles.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No hay plantillas disponibles</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
