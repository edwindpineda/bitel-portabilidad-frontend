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

  // Estados para el modal de crear/editar
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    id_formato: ''
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
      const [campaniasRes, basesRes, formatosRes, plantillasRes] = await Promise.all([
        apiClient.get('/crm/campanias'),
        apiClient.get('/crm/bases-numeros'),
        apiClient.get('/crm/formatos'),
        apiClient.get('/crm/plantillas')
      ]);
      setCampanias(campaniasRes?.data || []);
      setBasesDisponibles(basesRes?.data || []);
      setFormatos(formatosRes?.data || []);
      setPlantillasDisponibles(plantillasRes?.data || []);
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
          descripcion: formData.descripcion
        });
        campaniaId = editingCampania.id;
      } else {
        const response = await apiClient.post('/crm/campanias', {
          nombre: formData.nombre,
          descripcion: formData.descripcion
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
      id_formato: ''
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
      id_formato: ''
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
        const reponse = await apiClient.get(`/crm/bases-numeros/${baseSeleccionada}/detalles`);
        const numeros = reponse?.data;
        if (numeros) {
          // numeros.data.forEach(async (num) => {
          //   const llamada = await apiClient.post("http://64.23.133.231:3302/api/calls/ultravox",
          //     {
          //       destination: "51" + num.telefono,
          //       systemPrompt: plantillaSeleccionada.prompt_sistema + plantillaSeleccionada.prompt_flujo + plantillaSeleccionada.prompt_cierre,
          //       greeting: plantillaSeleccionada.prompt_inicio.replace("{{nombre}}", num.nombre)
          //     }
          //   )
          //   if (llamada?.data.success) {
          //     console.log(`Numero ${num.telefono} realizado con exito`);
          //   }
          //   else {
          //     console.log(`Error al llamar al numero ${num.telefono}`);
          //   }
          // });
          const numero = numeros[0].telefono
          const nombre = numeros[0].nombre
          const dni = numeros[0].numero_documento

          let nuevaPlantilla
          if (nombre) {
            nuevaPlantilla = plantillaSeleccionada.prompt_flujo.replaceAll("{{nombre}}", nombre)
          }
          const llamada = await apiClient.post("http://64.23.133.231:3302/api/calls/ultravox",
            {
              destination: "51" + numero,
              systemPrompt: plantillaSeleccionada.prompt_sistema + nuevaPlantilla.replaceAll("{{telefono}}", numero) + plantillaSeleccionada.prompt_cierre,
              greeting: plantillaSeleccionada.prompt_inicio.replace("{{nombre}}", nombre)
            }
          );
          if (llamada?.data.success) {
            console.log(`Numero ${numero} realizado con exito`);
          }
          else {
            console.log(`Error al llamar al numero ${numero}`);
          }
        }
      }
      catch (err) {
        console.error("Error al realizar las llamadas: ", err);
      }
    }

    setEjecutando(true);
    try {
      const response = await apiClient.post('/crm/campania-ejecuciones/ejecutar', {
        id_campania: campania.id
      });
      alert(`Ejecucion iniciada: ${response.data?.total_bases || 0} bases programadas`);
      loadData();
    } catch (error) {
      console.error('Error al ejecutar campania:', error);
      alert(error.msg || 'Error al ejecutar campania');
    } finally {
      setEjecutando(false);
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
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/70">Descripcion</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/70 text-center">Bases</TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/70 text-center">Plantillas</TableHead>
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
                    onClick={handleViewPlantillas}
                    className="gap-1.5 text-xs font-medium h-8 hover:bg-violet-50 hover:text-violet-700"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {plantillasDisponibles.length} plantillas
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
      <Dialog open={showEjecucionesModal} onOpenChange={setShowEjecucionesModal}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              Ejecuciones de Campania
            </DialogTitle>
            <DialogDescription>
              {selectedCampania?.nombre}
            </DialogDescription>
          </DialogHeader>

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
                </TableRow>
              </TableHeader>
              <TableBody>
                {ejecuciones.map((ejecucion) => (
                  <TableRow key={ejecucion.id} className="table-row-premium">
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
