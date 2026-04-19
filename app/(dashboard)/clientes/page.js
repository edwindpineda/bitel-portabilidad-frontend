'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/api';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
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
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
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
  UserPlus,
  Pencil,
  MoreHorizontal,
  Eye,
  Tag,
  ShieldOff,
  AlertTriangle,
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

export default function ClientesPage() {
  const { data: session } = useSession();
  const [clientes, setClientes] = useState([]);
  const [estados, setEstados] = useState([]);
  const [tipificaciones, setTipificaciones] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [asesores, setAsesores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterOrigen, setFilterOrigen] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newCliente, setNewCliente] = useState({ nombre_completo: '', celular: '', dni: '', direccion: '', id_estado: '', id_tipificacion_asesor: '', id_plan: '', id_asesor: '' });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editingCliente, setEditingCliente] = useState(null);
  const [filterListaNegra, setFilterListaNegra] = useState(false);
  const [showAddListaNegraModal, setShowAddListaNegraModal] = useState(false);
  const [addListaNegraForm, setAddListaNegraForm] = useState({ nombre_completo: '', celular: '' });
  const [addListaNegraError, setAddListaNegraError] = useState('');
  const [addingListaNegra, setAddingListaNegra] = useState(false);

  const canFilterByAsesor = session?.user?.rolId && session.user.rolId < 3;

  const loadData = async () => {
    try {
      setLoading(true);
      const [clientesRes, estadosRes, tipRes, planesRes] = await Promise.all([
        apiClient.get('/crm/clientes'),
        apiClient.get('/crm/estados'),
        apiClient.get('/crm/tipificaciones'),
        apiClient.get('/crm/catalogo'),
      ]);
      setClientes(clientesRes.data || []);
      setEstados(estadosRes.data || []);
      setTipificaciones(tipRes.data || []);
      setPlanes(planesRes.data || []);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const loadAsesores = async () => {
      if (canFilterByAsesor) {
        try {
          const res = await apiClient.get('/crm/usuarios/rol/3');
          setAsesores(res.data || []);
        } catch (err) {
          console.error('Error al cargar asesores:', err);
        }
      }
    };
    loadAsesores();
  }, [canFilterByAsesor]);

  // Filtrado
  const filtered = useMemo(() => {
    let list = clientes;

    if (filterListaNegra) {
      list = list.filter(c => c.lista_negra === true || c.lista_negra === 1);
    } else {
      if (filterOrigen === 'prospecto') {
        list = list.filter(c => c.fue_prospecto === 1);
      } else if (filterOrigen === 'directo') {
        list = list.filter(c => !c.fue_prospecto || c.fue_prospecto === 0);
      }
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
  }, [clientes, search, filterOrigen, filterListaNegra]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setCurrentPage(1); }, [search, filterOrigen, filterListaNegra]);

  // Estadísticas
  const stats = useMemo(() => {
    const total = clientes.length;
    const convertidos = clientes.filter(c => c.fue_prospecto === 1).length;
    const directos = total - convertidos;
    const listaNegra = clientes.filter(c => c.lista_negra === true || c.lista_negra === 1).length;
    return { total, convertidos, directos, listaNegra };
  }, [clientes]);

  const resetNewCliente = () => setNewCliente({ nombre_completo: '', celular: '', dni: '', direccion: '', id_estado: '', id_tipificacion_asesor: '', id_plan: '', id_asesor: '' });

  const handleCreateCliente = async () => {
    if (!newCliente.celular) return alert('El celular es obligatorio');
    try {
      setCreateLoading(true);
      await apiClient.post('/crm/persona', {
        nombre_completo: newCliente.nombre_completo || null,
        celular: newCliente.celular,
        dni: newCliente.dni || null,
        direccion: newCliente.direccion || null,
        id_estado: newCliente.id_estado ? parseInt(newCliente.id_estado) : 1,
        id_tipificacion_asesor: newCliente.id_tipificacion_asesor ? parseInt(newCliente.id_tipificacion_asesor) : null,
        id_plan: newCliente.id_plan ? parseInt(newCliente.id_plan) : null,
        id_asesor: newCliente.id_asesor ? parseInt(newCliente.id_asesor) : null,
        id_tipo_persona: 2,
      });
      setShowCreateModal(false);
      resetNewCliente();
      loadData();
    } catch (error) {
      console.error('Error al crear cliente:', error);
      alert('Error al crear cliente');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenEdit = (cliente) => {
    setEditingCliente({
      id: cliente.id,
      nombre_completo: cliente.nombre_completo || '',
      celular: cliente.celular || '',
      dni: cliente.dni || '',
      direccion: cliente.direccion || '',
      id_estado: cliente.id_estado ? parseInt(cliente.id_estado) : '',
      id_tipificacion_asesor: cliente.id_tipificacion ? parseInt(cliente.id_tipificacion) : '',
      id_plan: cliente.id_catalogo ? parseInt(cliente.id_catalogo) : '',
      id_asesor: cliente.id_usuario ? parseInt(cliente.id_usuario) : '',
    });
    setShowEditModal(true);
  };

  const handleEditChange = (field, value) => {
    setEditingCliente(prev => ({ ...prev, [field]: value }));
  };

  const openAddListaNegraModal = () => {
    setAddListaNegraForm({ nombre_completo: '', celular: '' });
    setAddListaNegraError('');
    setShowAddListaNegraModal(true);
  };

  const handleAddToListaNegra = async () => {
    const nombre = addListaNegraForm.nombre_completo.trim();
    const celular = addListaNegraForm.celular.trim();
    if (!nombre || !celular) {
      setAddListaNegraError('Nombre completo y celular son requeridos');
      return;
    }
    try {
      setAddingListaNegra(true);
      setAddListaNegraError('');
      await apiClient.post('/crm/persona/lista-negra', { nombre_completo: nombre, celular });
      setShowAddListaNegraModal(false);
      loadData();
    } catch (error) {
      const msg = error?.response?.data?.msg || 'Error al agregar a lista negra';
      setAddListaNegraError(msg);
    } finally {
      setAddingListaNegra(false);
    }
  };

  const handleToggleListaNegra = async (cliente) => {
    try {
      const newValue = !(cliente.lista_negra === true || cliente.lista_negra === 1);
      await apiClient.put(`/crm/persona/${cliente.id}`, { lista_negra: newValue });
      loadData();
    } catch (error) {
      console.error('Error al cambiar lista negra:', error);
      alert('Error al cambiar lista negra');
    }
  };

  const handleEditCliente = async () => {
    if (!editingCliente) return;
    try {
      setEditLoading(true);
      await apiClient.put(`/crm/persona/${editingCliente.id}`, editingCliente);
      setShowEditModal(false);
      setEditingCliente(null);
      loadData();
    } catch (error) {
      console.error('Error al editar cliente:', error);
      alert('Error al editar cliente');
    } finally {
      setEditLoading(false);
    }
  };

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

  const inputClass = "w-full h-10 px-4 rounded-xl bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-background transition-colors";

  // Campos del formulario reutilizable
  const renderFormFields = (data, onChange) => (
    <div className="space-y-6 py-2">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-6 w-6 rounded-lg bg-blue-50 flex items-center justify-center">
            <User className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Datos Personales</p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Nombre Completo</label>
            <input type="text" value={data.nombre_completo} onChange={(e) => onChange('nombre_completo', e.target.value)} className={inputClass} placeholder="Nombre completo" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1.5 block text-muted-foreground">DNI</label>
              <input type="text" value={data.dni} onChange={(e) => onChange('dni', e.target.value)} className={inputClass} placeholder="DNI" maxLength={8} />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Celular *</label>
              <input type="text" value={data.celular} onChange={(e) => onChange('celular', e.target.value)} className={inputClass} placeholder="Celular" maxLength={11} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Direccion</label>
            <input type="text" value={data.direccion} onChange={(e) => onChange('direccion', e.target.value)} className={inputClass} placeholder="Direccion" />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-6 w-6 rounded-lg bg-violet-50 flex items-center justify-center">
            <Tag className="h-3.5 w-3.5 text-violet-600" />
          </div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Clasificacion</p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Estado</label>
            <select value={data.id_estado || ''} onChange={(e) => onChange('id_estado', e.target.value ? parseInt(e.target.value) : null)} className={inputClass}>
              <option value="">Seleccionar</option>
              {estados.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Tipificacion Asesor</label>
            <select value={data.id_tipificacion_asesor ? String(data.id_tipificacion_asesor) : ''} onChange={(e) => onChange('id_tipificacion_asesor', e.target.value ? parseInt(e.target.value) : null)} className={inputClass}>
              <option value="">Seleccionar</option>
              {tipificaciones.filter(t => t.flag_asesor == 1).map((t) => <option key={t.id} value={String(t.id)}>{t.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Plan</label>
            <select value={data.id_plan || ''} onChange={(e) => onChange('id_plan', e.target.value ? parseInt(e.target.value) : null)} className={inputClass}>
              <option value="">Seleccionar</option>
              {planes.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          {canFilterByAsesor && (
            <div>
              <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Asesor</label>
              <select value={data.id_asesor || ''} onChange={(e) => onChange('id_asesor', e.target.value ? parseInt(e.target.value) : null)} className={inputClass}>
                <option value="">Sin asesor</option>
                {asesores.map((a) => <option key={a.id} value={a.id}>{a.username}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );

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
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={loading || filtered.length === 0}>
            <FileDown className="h-4 w-4 mr-1.5" />
            Exportar
          </Button>
          <Button size="sm" onClick={() => setShowCreateModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <UserPlus className="h-4 w-4 mr-1.5" />
            Nuevo Cliente
          </Button>
          <Button size="sm" onClick={openAddListaNegraModal} className="bg-red-600 hover:bg-red-700 text-white">
            <ShieldOff className="h-4 w-4 mr-1.5" />
            Lista negra
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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

        <Card
          className={`border-0 shadow-sm bg-gradient-to-br from-red-50 to-white cursor-pointer transition-all ${filterListaNegra ? 'ring-2 ring-red-400' : 'hover:shadow-md'}`}
          onClick={() => { setFilterListaNegra(v => !v); setFilterOrigen('todos'); }}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${filterListaNegra ? 'bg-red-500' : 'bg-red-100'}`}>
              <ShieldOff className={`h-5 w-5 ${filterListaNegra ? 'text-white' : 'text-red-600'}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700">{stats.listaNegra}</p>
              <p className="text-xs text-muted-foreground">Lista negra</p>
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
            <div className={`flex items-center gap-1 p-1 rounded-lg bg-muted/50 border transition-opacity ${filterListaNegra ? 'opacity-40 pointer-events-none' : ''}`}>
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

            {/* Indicador filtro lista negra activo */}
            {filterListaNegra && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-100 border border-red-200 text-red-700 text-xs font-medium">
                <ShieldOff className="h-3.5 w-3.5" />
                Lista negra activa
                <button onClick={() => setFilterListaNegra(false)} className="ml-1 hover:text-red-900">
                  ×
                </button>
              </div>
            )}

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
            <div className="rounded-xl border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs">Nombre</TableHead>
                    <TableHead className="text-xs">Celular</TableHead>
                    <TableHead className="text-xs">DNI</TableHead>
                    <TableHead className="text-xs">Asesor</TableHead>
                    <TableHead className="text-xs">Plan</TableHead>
                    <TableHead className="text-xs">Estado</TableHead>
                    <TableHead className="text-xs">Tipif. Asesor</TableHead>
                    <TableHead className="text-xs">Origen</TableHead>
                    <TableHead className="text-xs">Registro</TableHead>
                    <TableHead className="text-xs w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((cliente) => (
                    <TableRow key={cliente.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${cliente.lista_negra ? 'bg-red-100' : 'bg-emerald-100'}`}>
                            {cliente.lista_negra
                              ? <ShieldOff className="h-3.5 w-3.5 text-red-600" />
                              : <User className="h-3.5 w-3.5 text-emerald-600" />
                            }
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{cliente.nombre_completo || <span className="text-muted-foreground italic">Sin nombre</span>}</span>
                            {cliente.lista_negra && (
                              <span className="text-[10px] text-red-500 font-medium">Lista negra</span>
                            )}
                          </div>
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
                        {cliente.tipificacion_nombre ? (
                          <Badge
                            variant="outline"
                            className="text-xs font-medium border"
                            style={{
                              color: getColorHex(cliente.tipificacion_color),
                              borderColor: getColorHex(cliente.tipificacion_color) + '55',
                              backgroundColor: getColorHex(cliente.tipificacion_color) + '12',
                            }}
                          >
                            {cliente.tipificacion_nombre}
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
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleOpenEdit(cliente)} className="gap-2 text-xs">
                              <Pencil className="h-3.5 w-3.5" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleListaNegra(cliente)} className="gap-2 text-xs">
                              <ShieldOff className={`h-3.5 w-3.5 ${cliente.lista_negra ? 'text-emerald-600' : 'text-red-600'}`} />
                              {cliente.lista_negra ? 'Quitar de lista negra' : 'Agregar a lista negra'}
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

      {/* Modal Editar Cliente */}
      <Dialog open={showEditModal} onOpenChange={(open) => { if (!open) { setShowEditModal(false); setEditingCliente(null); } }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Pencil className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <span>Editar Cliente #{editingCliente?.id}</span>
                <p className="text-xs font-normal text-muted-foreground mt-0.5">Modificar datos del cliente</p>
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">Formulario para editar un cliente</DialogDescription>
          </DialogHeader>
          {editingCliente && renderFormFields(editingCliente, handleEditChange)}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditModal(false); setEditingCliente(null); }}>
              Cancelar
            </Button>
            <Button onClick={handleEditCliente} disabled={editLoading} className="bg-amber-600 hover:bg-amber-700 text-white gap-2">
              {editLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {editLoading ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Crear Cliente */}
      <Dialog open={showCreateModal} onOpenChange={(open) => { if (!open) { setShowCreateModal(false); resetNewCliente(); } }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <span>Nuevo Cliente</span>
                <p className="text-xs font-normal text-muted-foreground mt-0.5">Se registrara como cliente directo</p>
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">Formulario para crear un nuevo cliente directo</DialogDescription>
          </DialogHeader>
          {renderFormFields(newCliente, (field, value) => setNewCliente(p => ({ ...p, [field]: value })))}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateModal(false); resetNewCliente(); }}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCliente} disabled={createLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              {createLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {createLoading ? 'Creando...' : 'Crear Cliente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddListaNegraModal} onOpenChange={(open) => { if (!open) { setShowAddListaNegraModal(false); setAddListaNegraError(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldOff className="h-5 w-5 text-red-600" />
              Agregar a lista negra
            </DialogTitle>
            <DialogDescription>
              Registra directamente un celular en la lista negra.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nombre completo *</label>
              <input
                type="text"
                value={addListaNegraForm.nombre_completo}
                onChange={(e) => setAddListaNegraForm(f => ({ ...f, nombre_completo: e.target.value }))}
                className="w-full mt-1 h-9 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                placeholder="Nombre y apellido"
                disabled={addingListaNegra}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Celular *</label>
              <input
                type="text"
                value={addListaNegraForm.celular}
                onChange={(e) => setAddListaNegraForm(f => ({ ...f, celular: e.target.value.replace(/\D/g, '') }))}
                className="w-full mt-1 h-9 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                placeholder="9XXXXXXXX"
                maxLength={15}
                disabled={addingListaNegra}
              />
            </div>
            {addListaNegraError && (
              <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 text-red-700 text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {addListaNegraError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddListaNegraModal(false)} disabled={addingListaNegra}>
              Cancelar
            </Button>
            <Button onClick={handleAddToListaNegra} disabled={addingListaNegra} className="bg-red-600 hover:bg-red-700">
              {addingListaNegra ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldOff className="h-4 w-4 mr-2" />}
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
