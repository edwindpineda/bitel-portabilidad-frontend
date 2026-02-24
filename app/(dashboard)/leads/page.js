'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/api';
import * as XLSX from 'xlsx';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
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
  Search,
  Users,
  UserCheck,
  AlertCircle,
  ClipboardList,
  FileDown,
  UserPlus,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Pencil,
  Loader2,
  Check,
  ChevronRight as ChevronRightSmall,
  Calendar,
  Hash,
  Phone,
  MapPin,
  User,
  Tag,
  Briefcase,
  MessageSquare,
  Clock,
  ArrowUpDown,
  MoreHorizontal,
  RefreshCw,
  Download,
  UserCog,
  XCircle,
  CheckCircle2,
  FileText,
  Sparkles,
  TrendingUp,
  Filter,
  Zap,
  Shield,
  CloudDownload,
  UserCheck2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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

const DATE_RANGES = [
  { label: 'Todos', value: 'all' },
  { label: 'Hoy', value: 'today' },
  { label: 'Ultima semana', value: '7d' },
  { label: 'Ultimo mes', value: '1m' },
  { label: '3 meses', value: '3m' },
  { label: '6 meses', value: '6m' },
  { label: '12 meses', value: '12m' },
  { label: 'Personalizado', value: 'custom' },
];

const ITEMS_PER_PAGE = 50;

export default function LeadsPage() {
  const { data: session } = useSession();
  const [leads, setLeads] = useState([]);
  const [estados, setEstados] = useState([]);
  const [tipificaciones, setTipificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('');
  const [selectedTipificacion, setSelectedTipificacion] = useState('');
  const [selectedTipificacionAsesor, setSelectedTipificacionAsesor] = useState('');
  const [nivelesTipBot, setNivelesTipBot] = useState([]);
  const [nivelesTipAsesor, setNivelesTipAsesor] = useState([]);
  const [selectedAsesorFilter, setSelectedAsesorFilter] = useState('');
  const [asesoresFilter, setAsesoresFilter] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [showAsesorModal, setShowAsesorModal] = useState(false);
  const [asesores, setAsesores] = useState([]);
  const [assigningAsesor, setAssigningAsesor] = useState(false);
  const [selectedAsesorId, setSelectedAsesorId] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [proveedores, setProveedores] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [savingLead, setSavingLead] = useState(false);
  const [showConvertirModal, setShowConvertirModal] = useState(false);
  const [convertingLead, setConvertingLead] = useState(null);
  const [convertingLoading, setConvertingLoading] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLead, setDetailLead] = useState(null);
  const [perfilamientoData, setPerfilamientoData] = useState([]);
  const [loadingPerfilamiento, setLoadingPerfilamiento] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const canFilterByAsesor = session?.user?.id_rol === 1 || session?.user?.id_rol === 2;

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const loadAsesoresFilter = async () => {
      if (canFilterByAsesor) {
        try {
          const response = await apiClient.get('/crm/leads/asesores');
          setAsesoresFilter(response.data || []);
        } catch (error) {
          console.error('Error al cargar asesores para filtro:', error);
        }
      }
    };
    loadAsesoresFilter();
  }, [canFilterByAsesor]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [leadsRes, estadosRes, tipificacionesRes, proveedoresRes, planesRes] = await Promise.all([
        apiClient.get('/crm/leads'),
        apiClient.get('/crm/estados'),
        apiClient.get('/crm/tipificaciones'),
        apiClient.get('/crm/leads/proveedores'),
        apiClient.get('/crm/leads/catalogo')
      ]);
      setLeads(leadsRes.data || []);
      setEstados(estadosRes.data || []);
      setTipificaciones(tipificacionesRes.data || []);
      setProveedores(proveedoresRes.data || []);
      setPlanes(planesRes.data || []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const tipificacionesPadreBot = tipificaciones.filter(t => !t.id_padre && t.flag_bot === 1);
  const tipificacionesPadreAsesor = tipificaciones.filter(t => !t.id_padre && t.flag_asesor === 1);
  const getHijosBot = (idPadre) => tipificaciones.filter(t => t.id_padre === idPadre && t.flag_bot === 1);
  const getHijosAsesor = (idPadre) => tipificaciones.filter(t => t.id_padre === idPadre && t.flag_asesor === 1);

  const construirNivelesBot = () => {
    const niveles = [{ opciones: tipificacionesPadreBot, seleccionado: nivelesTipBot[0] || null }];
    for (let i = 0; i < nivelesTipBot.length; i++) {
      const hijos = getHijosBot(nivelesTipBot[i]);
      if (hijos.length > 0) niveles.push({ opciones: hijos, seleccionado: nivelesTipBot[i + 1] || null });
      else break;
    }
    return niveles;
  };

  const construirNivelesAsesor = () => {
    const niveles = [{ opciones: tipificacionesPadreAsesor, seleccionado: nivelesTipAsesor[0] || null }];
    for (let i = 0; i < nivelesTipAsesor.length; i++) {
      const hijos = getHijosAsesor(nivelesTipAsesor[i]);
      if (hijos.length > 0) niveles.push({ opciones: hijos, seleccionado: nivelesTipAsesor[i + 1] || null });
      else break;
    }
    return niveles;
  };

  const handleNivelBotChange = (nivelIndex, value) => {
    const nuevoValor = value ? parseInt(value) : null;
    const nuevosNiveles = nivelesTipBot.slice(0, nivelIndex);
    if (nuevoValor) nuevosNiveles.push(nuevoValor);
    setNivelesTipBot(nuevosNiveles);
    const ultimoNivel = nuevosNiveles.length > 0 ? nuevosNiveles[nuevosNiveles.length - 1] : null;
    setSelectedTipificacion(ultimoNivel ? String(ultimoNivel) : '');
  };

  const handleNivelAsesorChange = (nivelIndex, value) => {
    const nuevoValor = value ? parseInt(value) : null;
    const nuevosNiveles = nivelesTipAsesor.slice(0, nivelIndex);
    if (nuevoValor) nuevosNiveles.push(nuevoValor);
    setNivelesTipAsesor(nuevosNiveles);
    const ultimoNivel = nuevosNiveles.length > 0 ? nuevosNiveles[nuevosNiveles.length - 1] : null;
    setSelectedTipificacionAsesor(ultimoNivel ? String(ultimoNivel) : '');
  };

  const nivelesDropdownBot = construirNivelesBot();
  const nivelesDropdownAsesor = construirNivelesAsesor();

  const handleOpenDetailModal = async (lead) => {
    setDetailLead(lead);
    setShowDetailModal(true);
    setPerfilamientoData([]);
    setLoadingPerfilamiento(true);
    try {
      const response = await apiClient.get(`/crm/leads/${lead.id}/perfilamiento`);
      setPerfilamientoData(response.data || []);
    } catch (error) {
      console.error('Error al cargar perfilamiento:', error);
    } finally {
      setLoadingPerfilamiento(false);
    }
  };

  const handleOpenEditModal = (lead) => {
    setEditingLead({
      id: lead.id,
      nombre_completo: lead.nombre_completo || '',
      dni: lead.dni || '',
      celular: lead.celular || lead.contacto_celular || '',
      direccion: lead.direccion || '',
      id_estado: lead.id_estado ? parseInt(lead.id_estado) : '',
      id_provedor: lead.id_proveedor ? parseInt(lead.id_proveedor) : (lead.id_provedor ? parseInt(lead.id_provedor) : ''),
      id_plan: lead.id_catalogo ? parseInt(lead.id_catalogo) : (lead.id_plan ? parseInt(lead.id_plan) : ''),
      id_tipificacion: lead.id_tipificacion ? parseInt(lead.id_tipificacion) : '',
      id_tipificacion_asesor: lead.id_tipificacion ? parseInt(lead.id_tipificacion) : '',
      id_tipificacion_bot: lead.id_tipificacion_bot ? parseInt(lead.id_tipificacion_bot) : '',
      id_asesor: lead.id_usuario ? parseInt(lead.id_usuario) : (lead.id_asesor ? parseInt(lead.id_asesor) : '')
    });
    setShowEditModal(true);
  };

  const handleEditChange = (field, value) => {
    setEditingLead(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveLead = async () => {
    if (!editingLead) return;
    try {
      setSavingLead(true);
      await apiClient.put(`/crm/leads/${editingLead.id}`, editingLead);
      alert('Lead actualizado correctamente');
      setShowEditModal(false);
      setEditingLead(null);
      loadData();
    } catch (error) {
      console.error('Error al actualizar lead:', error);
      alert('Error al actualizar lead');
    } finally {
      setSavingLead(false);
    }
  };

  const handleConvertirCliente = async () => {
    if (!convertingLead) return;
    try {
      setConvertingLoading(true);
      await apiClient.put(`/crm/leads/${convertingLead.id}`, {
        tipo: 'cliente',
        fue_prospecto: true,
      });
      setShowConvertirModal(false);
      setConvertingLead(null);
      loadData();
    } catch (error) {
      console.error('Error al convertir a cliente:', error);
      alert('Error al convertir a cliente');
    } finally {
      setConvertingLoading(false);
    }
  };

  const getDateRangeFilter = () => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    let fromDate = null;
    let toDate = new Date(now);
    switch (dateRange) {
      case 'today': fromDate = new Date(now); fromDate.setHours(0, 0, 0, 0); break;
      case '7d': fromDate = new Date(now); fromDate.setDate(fromDate.getDate() - 7); break;
      case '1m': fromDate = new Date(now); fromDate.setMonth(fromDate.getMonth() - 1); break;
      case '3m': fromDate = new Date(now); fromDate.setMonth(fromDate.getMonth() - 3); break;
      case '6m': fromDate = new Date(now); fromDate.setMonth(fromDate.getMonth() - 6); break;
      case '12m': fromDate = new Date(now); fromDate.setFullYear(fromDate.getFullYear() - 1); break;
      case 'custom':
        if (dateFrom) fromDate = new Date(dateFrom + 'T00:00:00');
        if (dateTo) toDate = new Date(dateTo + 'T23:59:59');
        break;
      default: return { fromDate: null, toDate: null };
    }
    return { fromDate, toDate };
  };

  const filteredLeads = leads.filter(lead => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || (
      (lead.nombre_completo && lead.nombre_completo.toLowerCase().includes(searchLower)) ||
      (lead.celular && lead.celular.includes(searchTerm)) ||
      (lead.dni && lead.dni.includes(searchTerm)) ||
      (lead.contacto_celular && lead.contacto_celular.includes(searchTerm))
    );
    const { fromDate, toDate } = getDateRangeFilter();
    let matchesDate = true;
    if (fromDate || toDate) {
      const leadDate = new Date(lead.fecha_registro);
      if (fromDate && leadDate < fromDate) matchesDate = false;
      if (toDate && leadDate > toDate) matchesDate = false;
    }
    const matchesEstado = !selectedEstado || lead.id_estado === parseInt(selectedEstado);
    const matchesTipificacion = !selectedTipificacion || lead.id_tipificacion_bot === parseInt(selectedTipificacion);
    const matchesTipificacionAsesor = !selectedTipificacionAsesor || lead.id_tipificacion === parseInt(selectedTipificacionAsesor);
    const matchesAsesor = !selectedAsesorFilter || lead.id_usuario === parseInt(selectedAsesorFilter);
    return matchesSearch && matchesDate && matchesEstado && matchesTipificacion && matchesTipificacionAsesor && matchesAsesor;
  });

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-PE', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const handleDateRangeChange = (value) => {
    setDateRange(value);
    if (value !== 'custom') { setDateFrom(''); setDateTo(''); }
  };

  const clearFilters = () => {
    setSearchTerm(''); setDateRange('all'); setDateFrom(''); setDateTo('');
    setSelectedEstado(''); setSelectedTipificacion(''); setSelectedTipificacionAsesor('');
    setNivelesTipBot([]); setNivelesTipAsesor([]); setSelectedAsesorFilter(''); setCurrentPage(1);
  };

  const toggleSelectionMode = () => {
    if (selectionMode) setSelectedLeads([]);
    setSelectionMode(!selectionMode);
  };

  const toggleLeadSelection = (leadId) => {
    setSelectedLeads(prev => prev.includes(leadId) ? prev.filter(id => id !== leadId) : [...prev, leadId]);
  };

  const toggleSelectAll = () => {
    setSelectedLeads(selectedLeads.length === paginatedLeads.length ? [] : paginatedLeads.map(lead => lead.id));
  };

  const handleOpenAsesorModal = async () => {
    try {
      const response = await apiClient.get('/crm/leads/asesores');
      setAsesores(response.data || []);
      setSelectedAsesorId('');
      setShowAsesorModal(true);
    } catch (error) {
      console.error('Error al cargar asesores:', error);
      alert('Error al cargar la lista de asesores');
    }
  };

  const handleAssignAsesor = async (asesorId) => {
    if (selectedLeads.length === 0) return;
    try {
      setAssigningAsesor(true);
      await apiClient.post('/crm/leads/bulk-assign', { lead_ids: selectedLeads, id_asesor: asesorId });
      alert(`${selectedLeads.length} leads asignados correctamente`);
      setShowAsesorModal(false);
      setSelectedLeads([]);
      setSelectionMode(false);
      loadData();
    } catch (error) {
      console.error('Error al asignar asesor:', error);
      alert('Error al asignar asesor');
    } finally {
      setAssigningAsesor(false);
    }
  };

  useEffect(() => { setCurrentPage(1); },
    [searchTerm, dateRange, dateFrom, dateTo, selectedEstado, selectedTipificacion, selectedTipificacionAsesor, selectedAsesorFilter]);

  const hasActiveFilters = searchTerm || dateRange !== 'all' || selectedEstado || selectedTipificacion || selectedTipificacionAsesor || selectedAsesorFilter;
  const activeFilterCount = [dateRange !== 'all', selectedEstado, selectedTipificacion, selectedTipificacionAsesor, selectedAsesorFilter].filter(Boolean).length;

  const handleExportExcel = () => {
    const dataToExport = filteredLeads.map(lead => ({
      'ID': lead.id, 'Nombre': lead.nombre_completo || '', 'DNI': lead.dni || '',
      'Celular': lead.celular || lead.contacto_celular || '', 'Direccion': lead.direccion || '',
      'Estado': lead.estado_nombre || '', 'Proveedor': lead.proveedor_nombre || '',
      'Plan': lead.plan_nombre || '', 'Tipificacion': lead.tipificacion_nombre || '',
      'Asesor': lead.asesor_nombre || '',
      'Fecha Registro': lead.fecha_registro ? new Date(lead.fecha_registro).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    ws['!cols'] = [{ wch: 6 }, { wch: 30 }, { wch: 12 }, { wch: 15 }, { wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
    XLSX.writeFile(wb, hasActiveFilters ? `leads_filtrados_${new Date().toISOString().slice(0, 10)}.xlsx` : `leads_todos_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const totalPages = Math.ceil(filteredLeads.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex);
  const goToPage = (page) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));

  const statsData = {
    total: filteredLeads.length,
    completos: filteredLeads.filter(l => l.nombre_completo && l.dni).length,
    sinDatos: filteredLeads.filter(l => !l.nombre_completo).length,
    conPlan: filteredLeads.filter(l => l.id_plan).length,
  };

  const stats = [
    {
      key: 'total', label: 'Total Leads', value: statsData.total,
      icon: Users, gradient: 'from-indigo-600 via-indigo-500 to-blue-500',
      glow: 'rgba(99, 102, 241, 0.35)', iconBg: 'from-indigo-500 to-blue-500',
      ring: 'ring-indigo-500/20', change: '+12%',
    },
    {
      key: 'completos', label: 'Datos Completos', value: statsData.completos,
      icon: CheckCircle2, gradient: 'from-emerald-600 via-emerald-500 to-teal-500',
      glow: 'rgba(16, 185, 129, 0.35)', iconBg: 'from-emerald-500 to-teal-500',
      ring: 'ring-emerald-500/20', change: `${statsData.total ? Math.round((statsData.completos / statsData.total) * 100) : 0}%`,
    },
    {
      key: 'sinDatos', label: 'Sin Datos', value: statsData.sinDatos,
      icon: AlertCircle, gradient: 'from-amber-600 via-amber-500 to-orange-500',
      glow: 'rgba(245, 158, 11, 0.35)', iconBg: 'from-amber-500 to-orange-500',
      ring: 'ring-amber-500/20', change: 'Pendientes',
    },
    {
      key: 'conPlan', label: 'Con Plan', value: statsData.conPlan,
      icon: Zap, gradient: 'from-violet-600 via-violet-500 to-purple-500',
      glow: 'rgba(139, 92, 246, 0.35)', iconBg: 'from-violet-500 to-purple-500',
      ring: 'ring-violet-500/20', change: `${statsData.total ? Math.round((statsData.conPlan / statsData.total) * 100) : 0}%`,
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-indigo-500/25 animate-float">
            <Users className="h-8 w-8 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center">
            <Loader2 className="h-3 w-3 text-white animate-spin" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">Cargando leads</p>
          <p className="text-xs text-muted-foreground mt-0.5">Preparando tu pipeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ========== HERO HEADER ========== */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 animate-scale-in"
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4338ca 60%, #3730a3 100%)',
        }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-cyan-400/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-indigo-400/10 to-transparent rounded-full translate-y-1/2 -translate-x-1/3" />
        <div className="absolute top-6 right-20 w-2 h-2 rounded-full bg-cyan-400/60 animate-float" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-16 right-40 w-1.5 h-1.5 rounded-full bg-indigo-300/40 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-8 right-32 w-1 h-1 rounded-full bg-cyan-300/50 animate-float" style={{ animationDelay: '1.5s' }} />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)',
                boxShadow: '0 8px 32px -4px rgba(6, 182, 212, 0.4)',
              }}
            >
              <Users className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Pipeline de Leads</h1>
              <p className="text-indigo-200/70 text-sm mt-0.5">
                {leads.length.toLocaleString()} personas en tu sistema
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadData}
              className="gap-2 h-9 text-indigo-200 hover:text-white hover:bg-white/10 border border-white/10"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Actualizar
            </Button>
            {selectionMode && selectedLeads.length > 0 ? (
              <Button
                size="sm"
                onClick={handleOpenAsesorModal}
                className="gap-2 h-9 bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/30"
              >
                <Check className="h-3.5 w-3.5" />
                Asignar ({selectedLeads.length})
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={toggleSelectionMode}
                className={`gap-2 h-9 ${selectionMode
                  ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                }`}
              >
                <UserCog className="h-3.5 w-3.5" />
                {selectionMode ? 'Cancelar' : 'Asignar Asesor'}
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleExportExcel}
              disabled={filteredLeads.length === 0}
              className="gap-2 h-9 bg-emerald-500/90 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
            >
              <Download className="h-3.5 w-3.5" />
              Excel
            </Button>
          </div>
        </div>
      </div>

      {/* ========== STATS CARDS ========== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.key}
              className="relative overflow-hidden group hover:shadow-xl transition-all duration-500 animate-scale-in cursor-default"
              style={{ animationDelay: `${(i + 1) * 100}ms` }}
            >
              {/* Gradient top bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`} />
              {/* Glow effect on hover */}
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

      {/* ========== SEARCH & FILTERS BAR ========== */}
      <Card className="overflow-hidden animate-scale-in" style={{ animationDelay: '500ms' }}>
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center gap-3">
            {/* Search - Premium glass style */}
            <div className="relative flex-1 max-w-sm group">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-md bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 flex items-center justify-center">
                <Search className="h-3 w-3 text-indigo-500 group-focus-within:text-cyan-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Buscar nombre, celular, DNI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-11 pr-9 text-sm bg-muted/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-background placeholder:text-muted-foreground/40 transition-all duration-300"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors">
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Date range - Segmented control style */}
            <div className="hidden lg:flex items-center bg-muted/60 p-1 rounded-xl">
              {DATE_RANGES.filter(r => r.value !== 'custom').slice(0, 5).map((range) => (
                <button
                  key={range.value}
                  onClick={() => handleDateRangeChange(range.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                    dateRange === range.value
                      ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/25'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {range.label}
                </button>
              ))}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    ['6m', '12m', 'custom'].includes(dateRange)
                      ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/25'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}>
                    Mas...
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {DATE_RANGES.filter(r => !['all', 'today', '7d', '1m', '3m'].includes(r.value)).map((range) => (
                    <DropdownMenuItem key={range.value} onClick={() => handleDateRangeChange(range.value)}>
                      {range.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Filter toggle - Premium */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={`gap-2 h-9 rounded-xl px-3 transition-all duration-300 ${
                showFilters
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white border-indigo-500 hover:from-indigo-600 hover:to-indigo-700 shadow-lg shadow-indigo-500/25'
                  : hasActiveFilters
                    ? 'border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    : ''
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              Filtros
              {activeFilterCount > 0 && (
                <span className={`h-5 min-w-[20px] flex items-center justify-center text-[10px] font-bold px-1.5 rounded-full ${
                  showFilters ? 'bg-white/25 text-white' : 'bg-indigo-500 text-white'
                }`}>
                  {activeFilterCount}
                </span>
              )}
            </Button>

            {/* Results summary - inline */}
            <div className="hidden md:flex items-center gap-2 ml-auto">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                <span className="font-bold text-foreground tabular-nums">{filteredLeads.length}</span>
                {' '}/{' '}
                <span className="font-bold text-foreground tabular-nums">{leads.length}</span>
                {' '}leads
              </span>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-[11px] font-medium text-muted-foreground hover:text-red-500 flex items-center gap-1 transition-colors">
                  <XCircle className="h-3 w-3" />
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Custom dates */}
          {dateRange === 'custom' && (
            <div className="flex items-center gap-3 px-1 py-2 rounded-xl bg-muted/30">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <Calendar className="h-3.5 w-3.5 text-indigo-500" />
              </div>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                className="h-9 px-3 text-xs rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              <span className="text-xs text-muted-foreground font-medium">hasta</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                className="h-9 px-3 text-xs rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
            </div>
          )}

          {/* Expandable filters */}
          {showFilters && (
            <div className="border-t border-border/40 pt-2.5 animate-slide-up">
              <div className="flex flex-wrap items-end gap-3">

                {/* Estado */}
                <div className="flex flex-col gap-1 min-w-[160px]">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                    Estado
                  </label>
                  <select value={selectedEstado} onChange={(e) => setSelectedEstado(e.target.value)}
                    className="h-8 px-2.5 text-xs rounded-lg bg-muted/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-background transition-colors">
                    <option value="">Todos los estados</option>
                    {estados.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                  </select>
                </div>

                {/* Asesor */}
                {canFilterByAsesor && (
                  <div className="flex flex-col gap-1 min-w-[160px]">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                      Asesor
                    </label>
                    <select value={selectedAsesorFilter} onChange={(e) => setSelectedAsesorFilter(e.target.value)}
                      className="h-8 px-2.5 text-xs rounded-lg bg-muted/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-background transition-colors">
                      <option value="">Todos los asesores</option>
                      {asesoresFilter.map((a) => <option key={a.id} value={a.id}>{a.username}</option>)}
                    </select>
                  </div>
                )}

                {/* Separador vertical */}
                <div className="hidden lg:block h-8 w-px bg-border/60 self-end mb-0.5" />

                {/* Tipificacion Bot */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5" />
                    Tipif. Bot
                  </label>
                  <div className="flex items-center gap-1.5">
                    {nivelesDropdownBot.map((nivel, index) => (
                      <div key={index} className="flex items-center gap-1.5">
                        {index > 0 && <ChevronRightSmall className="h-3 w-3 text-indigo-300" />}
                        <select value={nivel.seleccionado || ''} onChange={(e) => handleNivelBotChange(index, e.target.value)}
                          className="h-8 px-2.5 text-xs rounded-lg bg-muted/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 border-0">
                          <option value="">{index === 0 ? 'Todas' : 'Seleccionar...'}</option>
                          {nivel.opciones.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Separador vertical */}
                <div className="hidden lg:block h-8 w-px bg-border/60 self-end mb-0.5" />

                {/* Tipificacion Asesor */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-violet-500 uppercase tracking-wider flex items-center gap-1">
                    <Shield className="h-2.5 w-2.5" />
                    Tipif. Asesor
                  </label>
                  <div className="flex items-center gap-1.5">
                    {nivelesDropdownAsesor.map((nivel, index) => (
                      <div key={index} className="flex items-center gap-1.5">
                        {index > 0 && <ChevronRightSmall className="h-3 w-3 text-violet-300" />}
                        <select value={nivel.seleccionado || ''} onChange={(e) => handleNivelAsesorChange(index, e.target.value)}
                          className="h-8 px-2.5 text-xs rounded-lg bg-muted/50 focus:outline-none focus:ring-2 focus:ring-violet-500/20 border-0">
                          <option value="">{index === 0 ? 'Todas' : 'Seleccionar...'}</option>
                          {nivel.opciones.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mobile: Periodo */}
                <div className="lg:hidden flex flex-col gap-1 min-w-[140px]">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                    Periodo
                  </label>
                  <select value={dateRange} onChange={(e) => handleDateRangeChange(e.target.value)}
                    className="h-8 px-2.5 text-xs rounded-lg bg-muted/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-background transition-colors">
                    {DATE_RANGES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>

              </div>
            </div>
          )}

        </CardContent>
      </Card>

      {/* ========== DATA TABLE ========== */}
      <Card className="overflow-hidden shadow-lg shadow-black/[0.03] animate-scale-in" style={{ animationDelay: '600ms' }}>
        {/* Selection bar */}
        {selectionMode && selectedLeads.length > 0 && (
          <div
            className="px-5 py-3 flex items-center justify-between"
            style={{
              background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.08) 0%, rgba(6, 182, 212, 0.08) 100%)',
              borderBottom: '1px solid rgba(99, 102, 241, 0.15)',
            }}
          >
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-indigo-700">
                {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} seleccionado{selectedLeads.length > 1 ? 's' : ''}
              </span>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setSelectedLeads([])} className="h-7 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
              Deseleccionar todo
            </Button>
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent" style={{ background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.04) 0%, rgba(6, 182, 212, 0.02) 100%)' }}>
                {selectionMode && (
                  <TableHead className="w-12 pl-5">
                    <Checkbox
                      checked={paginatedLeads.length > 0 && selectedLeads.length === paginatedLeads.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                )}
                <TableHead className="w-16 text-[10px] font-bold uppercase tracking-widest text-indigo-500/70">ID</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/70 min-w-[180px]">Nombre</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/70">DNI</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/70">Celular</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/70">Estado</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/70">Proveedor</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/70">Plan</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/70">Tipif. Bot</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/70">Tipif. Asesor</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/70">Asesor</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-indigo-500/70">Fecha</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLeads.map((lead) => (
                <TableRow
                  key={lead.id}
                  className={`table-row-premium group ${selectedLeads.includes(lead.id) ? 'bg-indigo-50/50' : ''}`}
                >
                  {selectionMode && (
                    <TableCell className="pl-5">
                      <Checkbox checked={selectedLeads.includes(lead.id)} onCheckedChange={() => toggleLeadSelection(lead.id)} />
                    </TableCell>
                  )}
                  <TableCell>
                    <span className="inline-flex items-center justify-center h-6 min-w-[32px] px-1.5 rounded-md bg-muted/60 text-[11px] font-mono font-medium text-muted-foreground">
                      {lead.id}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ring-2 ring-white"
                        style={{
                          background: `linear-gradient(135deg, ${getColorHex(lead.estado_color)}30, ${getColorHex(lead.estado_color)}15)`,
                        }}
                      >
                        <span className="text-xs font-bold" style={{ color: getColorHex(lead.estado_color) }}>
                          {lead.nombre_completo ? lead.nombre_completo.charAt(0).toUpperCase() : '?'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate leading-tight">
                          {lead.nombre_completo || <span className="text-muted-foreground/40 italic font-normal text-xs">Sin nombre</span>}
                        </p>
                        {lead.direccion && (
                          <p className="text-[11px] text-muted-foreground/50 truncate max-w-[200px] leading-tight mt-0.5">{lead.direccion}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm tabular-nums text-muted-foreground font-medium">{lead.dni || <span className="text-muted-foreground/25">--</span>}</TableCell>
                  <TableCell className="text-sm tabular-nums text-muted-foreground font-medium">{lead.celular || lead.contacto_celular || <span className="text-muted-foreground/25">--</span>}</TableCell>
                  <TableCell>
                    {lead.estado_nombre ? (
                      <span
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-sm"
                        style={{
                          backgroundColor: getColorHex(lead.estado_color) + '15',
                          color: getColorHex(lead.estado_color),
                          boxShadow: `0 2px 8px -2px ${getColorHex(lead.estado_color)}30`,
                        }}
                      >
                        <span
                          className="w-2 h-2 rounded-full animate-glow"
                          style={{
                            backgroundColor: getColorHex(lead.estado_color),
                            '--glow-color': getColorHex(lead.estado_color) + '60',
                          }}
                        />
                        {lead.estado_nombre}
                      </span>
                    ) : <span className="text-muted-foreground/25 text-xs">--</span>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{lead.proveedor_nombre || <span className="text-muted-foreground/25">--</span>}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{lead.plan_nombre || <span className="text-muted-foreground/25">--</span>}</TableCell>
                  <TableCell>
                    {lead.tipificacion_bot_nombre ? (
                      <span
                        className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                        style={{
                          backgroundColor: getColorHex(lead.tipificacion_bot_color) + '12',
                          color: getColorHex(lead.tipificacion_bot_color),
                        }}
                      >
                        {lead.tipificacion_bot_nombre}
                      </span>
                    ) : <span className="text-muted-foreground/25 text-xs">--</span>}
                  </TableCell>
                  <TableCell>
                    {lead.tipificacion_asesor_nombre ? (
                      <span
                        className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                        style={{
                          backgroundColor: getColorHex(lead.tipificacion_asesor_color) + '12',
                          color: getColorHex(lead.tipificacion_asesor_color),
                        }}
                      >
                        {lead.tipificacion_asesor_nombre}
                      </span>
                    ) : <span className="text-muted-foreground/25 text-xs">--</span>}
                  </TableCell>
                  <TableCell>
                    {lead.asesor_nombre ? (
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 flex items-center justify-center">
                          <span className="text-[10px] font-bold text-indigo-600">{lead.asesor_nombre.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{lead.asesor_nombre}</span>
                      </div>
                    ) : <span className="text-muted-foreground/25 text-xs">--</span>}
                  </TableCell>
                  <TableCell className="text-[11px] text-muted-foreground/50 tabular-nums whitespace-nowrap">{formatDate(lead.fecha_registro)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 p-1.5">
                        <DropdownMenuItem onClick={() => handleOpenDetailModal(lead)} className="gap-2.5 text-xs rounded-lg py-2.5">
                          <div className="h-6 w-6 rounded-md bg-blue-50 flex items-center justify-center">
                            <Eye className="h-3.5 w-3.5 text-blue-600" />
                          </div>
                          Ver detalle
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenEditModal(lead)} className="gap-2.5 text-xs rounded-lg py-2.5">
                          <div className="h-6 w-6 rounded-md bg-amber-50 flex items-center justify-center">
                            <Pencil className="h-3.5 w-3.5 text-amber-600" />
                          </div>
                          Editar lead
                        </DropdownMenuItem>
                        {lead.tipo !== 'cliente' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => { setConvertingLead(lead); setShowConvertirModal(true); }}
                              className="gap-2.5 text-xs rounded-lg py-2.5"
                            >
                              <div className="h-6 w-6 rounded-md bg-emerald-50 flex items-center justify-center">
                                <UserCheck2 className="h-3.5 w-3.5 text-emerald-600" />
                              </div>
                              Convertir a cliente
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Empty state */}
        {paginatedLeads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div
              className="h-20 w-20 rounded-3xl flex items-center justify-center mb-5 animate-float"
              style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(6, 182, 212, 0.1) 100%)',
              }}
            >
              <Users className="h-9 w-9 text-indigo-400" />
            </div>
            <p className="text-base font-semibold">
              {hasActiveFilters ? 'No se encontraron resultados' : 'Sin leads registrados'}
            </p>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-xs">
              {hasActiveFilters ? 'Intenta ajustar los filtros para encontrar lo que buscas' : 'Las personas del sistema apareceran aqui'}
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                className="mt-5 gap-2 rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                onClick={clearFilters}
              >
                <XCircle className="h-3.5 w-3.5" />
                Limpiar filtros
              </Button>
            )}
          </div>
        )}

        {/* ========== PREMIUM PAGINATION ========== */}
        {totalPages > 1 && (
          <div
            className="px-5 py-4 flex items-center justify-between"
            style={{
              borderTop: '1px solid hsl(var(--border))',
              background: 'linear-gradient(90deg, rgba(99, 102, 241, 0.02) 0%, rgba(6, 182, 212, 0.02) 100%)',
            }}
          >
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">
                <span className="font-bold text-foreground">{startIndex + 1}-{Math.min(endIndex, filteredLeads.length)}</span>
                <span className="mx-1.5">de</span>
                <span className="font-bold text-foreground">{filteredLeads.length}</span>
                <span className="ml-1">leads</span>
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>

              {(() => {
                const pages = [];
                const maxVisible = 5;
                let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                let end = Math.min(totalPages, start + maxVisible - 1);
                if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
                for (let i = start; i <= end; i++) {
                  pages.push(
                    <button
                      key={i}
                      onClick={() => goToPage(i)}
                      className={`h-8 min-w-[32px] px-2 text-xs font-semibold rounded-lg transition-all duration-200 ${
                        currentPage === i
                          ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {i}
                    </button>
                  );
                }
                return pages;
              })()}

              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ===== MODALS ===== */}

      {/* Assign Asesor Modal - Premium */}
      <Dialog open={showAsesorModal} onOpenChange={setShowAsesorModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
                  boxShadow: '0 8px 24px -4px rgba(99, 102, 241, 0.3)',
                }}
              >
                <UserCog className="h-5 w-5 text-white" />
              </div>
              <div>
                <span>Asignar Asesor</span>
                <p className="text-xs font-normal text-muted-foreground mt-0.5">Selecciona el asesor responsable</p>
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">
              {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} seleccionado{selectedLeads.length > 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-indigo-50 mb-4">
              <CheckCircle2 className="h-4 w-4 text-indigo-500" />
              <span className="text-sm font-medium text-indigo-700">
                {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} seleccionado{selectedLeads.length > 1 ? 's' : ''}
              </span>
            </div>
            {asesores.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">No hay asesores disponibles</p>
            ) : (
              <select value={selectedAsesorId} onChange={(e) => setSelectedAsesorId(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-background transition-colors">
                <option value="">Seleccionar asesor...</option>
                {asesores.map((a) => <option key={a.id} value={a.id}>{a.username} - {a.email}</option>)}
              </select>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAsesorModal(false)} className="rounded-xl">Cancelar</Button>
            <Button
              onClick={() => handleAssignAsesor(selectedAsesorId)}
              disabled={!selectedAsesorId || assigningAsesor}
              className="gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-lg shadow-indigo-500/25"
            >
              {assigningAsesor && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {assigningAsesor ? 'Asignando...' : 'Confirmar Asignacion'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Lead Modal - Premium */}
      <Dialog open={showEditModal} onOpenChange={(open) => { if (!open) { setShowEditModal(false); setEditingLead(null); } }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
                  boxShadow: '0 8px 24px -4px rgba(245, 158, 11, 0.3)',
                }}
              >
                <Pencil className="h-5 w-5 text-white" />
              </div>
              <div>
                <span>Editar Lead #{editingLead?.id}</span>
                <p className="text-xs font-normal text-muted-foreground mt-0.5">Modifica la informacion de la persona</p>
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">Modifica la informacion de la persona</DialogDescription>
          </DialogHeader>
          {editingLead && (
            <div className="space-y-6 py-2">
              {/* Personal info section */}
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
                    <input type="text" value={editingLead.nombre_completo} onChange={(e) => handleEditChange('nombre_completo', e.target.value)}
                      className="w-full h-10 px-4 rounded-xl bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-background transition-colors" placeholder="Nombre completo" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1.5 block text-muted-foreground">DNI</label>
                      <input type="text" value={editingLead.dni} onChange={(e) => handleEditChange('dni', e.target.value)}
                        className="w-full h-10 px-4 rounded-xl bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-background transition-colors" placeholder="DNI" maxLength={8} />
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Celular</label>
                      <input type="text" value={editingLead.celular} onChange={(e) => handleEditChange('celular', e.target.value)}
                        className="w-full h-10 px-4 rounded-xl bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-background transition-colors" placeholder="Celular" maxLength={9} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Direccion</label>
                    <input type="text" value={editingLead.direccion} onChange={(e) => handleEditChange('direccion', e.target.value)}
                      className="w-full h-10 px-4 rounded-xl bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-background transition-colors" placeholder="Direccion" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Classification section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-6 w-6 rounded-lg bg-violet-50 flex items-center justify-center">
                    <Tag className="h-3.5 w-3.5 text-violet-600" />
                  </div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Clasificacion</p>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Estado</label>
                      <select value={editingLead.id_estado || ''} onChange={(e) => handleEditChange('id_estado', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full h-10 px-4 rounded-xl bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-background transition-colors">
                        <option value="">Seleccionar</option>
                        {estados.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Tipificacion Bot</label>
                      <select value={editingLead.id_tipificacion_bot ? String(editingLead.id_tipificacion_bot) : ''} onChange={(e) => handleEditChange('id_tipificacion_bot', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full h-10 px-4 rounded-xl bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-background transition-colors">
                        <option value="">Seleccionar</option>
                        {tipificaciones.filter(t => t.flag_bot == 1).map((t) => <option key={t.id} value={String(t.id)}>{t.nombre}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Tipificacion Asesor</label>
                    <select value={editingLead.id_tipificacion_asesor ? String(editingLead.id_tipificacion_asesor) : ''} onChange={(e) => handleEditChange('id_tipificacion_asesor', e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full h-10 px-4 rounded-xl bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-background transition-colors">
                      <option value="">Seleccionar</option>
                      {tipificaciones.filter(t => t.flag_asesor == 1).map((t) => <option key={t.id} value={String(t.id)}>{t.nombre}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Proveedor</label>
                      <select value={editingLead.id_provedor || ''} onChange={(e) => handleEditChange('id_provedor', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full h-10 px-4 rounded-xl bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-background transition-colors">
                        <option value="">Seleccionar</option>
                        {proveedores.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Plan</label>
                      <select value={editingLead.id_plan || ''} onChange={(e) => handleEditChange('id_plan', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full h-10 px-4 rounded-xl bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-background transition-colors">
                        <option value="">Seleccionar</option>
                        {planes.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                      </select>
                    </div>
                  </div>
                  {canFilterByAsesor && (
                    <div>
                      <label className="text-xs font-medium mb-1.5 block text-muted-foreground">Asesor</label>
                      <select value={editingLead.id_asesor || ''} onChange={(e) => handleEditChange('id_asesor', e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full h-10 px-4 rounded-xl bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-background transition-colors">
                        <option value="">Sin asesor</option>
                        {asesoresFilter.map((a) => <option key={a.id} value={a.id}>{a.username}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditModal(false); setEditingLead(null); }} className="rounded-xl">Cancelar</Button>
            <Button
              onClick={handleSaveLead}
              disabled={savingLead}
              className="gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-lg shadow-indigo-500/25"
            >
              {savingLead && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {savingLead ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convertir a Cliente Modal */}
      <Dialog open={showConvertirModal} onOpenChange={(open) => { if (!open) { setShowConvertirModal(false); setConvertingLead(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                  boxShadow: '0 8px 24px -4px rgba(16, 185, 129, 0.3)',
                }}
              >
                <UserCheck2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <span>Convertir a Cliente</span>
                <p className="text-xs font-normal text-muted-foreground mt-0.5">Esta accion cambiara el tipo del prospecto</p>
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">Confirmar conversion de prospecto a cliente</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <UserCheck2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">
                  {convertingLead?.nombre_completo || 'Sin nombre'}
                </p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  {convertingLead?.celular || convertingLead?.contacto_celular || 'Sin celular'}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground px-1">
              Se establecera el tipo a <span className="font-semibold text-foreground">cliente</span> y se activara la flag <span className="font-semibold text-foreground">fue_prospecto</span>. Esta accion no se puede deshacer desde aqui.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowConvertirModal(false); setConvertingLead(null); }} className="rounded-xl">
              Cancelar
            </Button>
            <Button
              onClick={handleConvertirCliente}
              disabled={convertingLoading}
              className="gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/25 text-white"
            >
              {convertingLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {convertingLoading ? 'Convirtiendo...' : 'Confirmar Conversion'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Lead Modal - Premium */}
      <Dialog open={showDetailModal} onOpenChange={(open) => { if (!open) { setShowDetailModal(false); setDetailLead(null); } }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
                  boxShadow: '0 8px 24px -4px rgba(59, 130, 246, 0.3)',
                }}
              >
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <span>Detalle del Lead #{detailLead?.id}</span>
                <p className="text-xs font-normal text-muted-foreground mt-0.5">Informacion completa de la persona</p>
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">Informacion completa de la persona</DialogDescription>
          </DialogHeader>
          {detailLead && (
            <div className="space-y-5 py-2">
              {/* Lead header card - Premium gradient */}
              <div
                className="flex items-center gap-4 p-5 rounded-2xl text-white relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
                }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-cyan-400/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/4" />
                <div
                  className="h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-xl"
                  style={{
                    background: 'linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)',
                    boxShadow: '0 8px 24px -4px rgba(6, 182, 212, 0.4)',
                  }}
                >
                  <span className="text-lg font-bold text-white">
                    {detailLead.nombre_completo ? detailLead.nombre_completo.charAt(0).toUpperCase() : '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0 relative z-10">
                  <p className="text-base font-bold truncate">{detailLead.nombre_completo || 'Sin nombre'}</p>
                  <p className="text-indigo-200 text-sm">{detailLead.celular || detailLead.contacto_celular || 'Sin celular'}</p>
                </div>
                {detailLead.estado_nombre && (
                  <span
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg relative z-10"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getColorHex(detailLead.estado_color) }} />
                    {detailLead.estado_nombre}
                  </span>
                )}
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Hash, label: 'DNI', value: detailLead.dni, color: 'blue' },
                  { icon: Phone, label: 'Celular', value: detailLead.celular || detailLead.contacto_celular, color: 'emerald' },
                  { icon: MapPin, label: 'Direccion', value: detailLead.direccion, color: 'violet' },
                  { icon: Briefcase, label: 'Proveedor', value: detailLead.proveedor_nombre, color: 'amber' },
                  { icon: ClipboardList, label: 'Plan', value: detailLead.plan_nombre, color: 'cyan' },
                  { icon: User, label: 'Asesor', value: detailLead.asesor_nombre, color: 'indigo' },
                  { icon: Clock, label: 'Registro', value: formatDate(detailLead.fecha_registro), color: 'rose' },
                ].map((item) => {
                  const colorMap = { blue: '#3b82f6', emerald: '#10b981', violet: '#8b5cf6', amber: '#f59e0b', cyan: '#06b6d4', indigo: '#6366f1', rose: '#f43f5e' };
                  const c = colorMap[item.color];
                  return (
                    <div key={item.label} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: c + '12' }}>
                        <item.icon className="h-4 w-4" style={{ color: c }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{item.label}</p>
                        <p className="text-sm font-medium truncate mt-0.5">{item.value || <span className="text-muted-foreground/30 font-normal">--</span>}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tipificaciones */}
              <div className="flex flex-wrap gap-3">
                {detailLead.tipificacion_bot_nombre && (
                  <div className="flex items-center gap-2 p-2.5 px-3.5 rounded-xl bg-muted/30">
                    <span className="text-[10px] text-muted-foreground/60 uppercase font-bold tracking-wider">Bot:</span>
                    <span
                      className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-sm"
                      style={{
                        backgroundColor: getColorHex(detailLead.tipificacion_bot_color) + '15',
                        color: getColorHex(detailLead.tipificacion_bot_color),
                        boxShadow: `0 2px 8px -2px ${getColorHex(detailLead.tipificacion_bot_color)}25`,
                      }}
                    >
                      {detailLead.tipificacion_bot_nombre}
                    </span>
                  </div>
                )}
                {detailLead.tipificacion_asesor_nombre && (
                  <div className="flex items-center gap-2 p-2.5 px-3.5 rounded-xl bg-muted/30">
                    <span className="text-[10px] text-muted-foreground/60 uppercase font-bold tracking-wider">Asesor:</span>
                    <span
                      className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-sm"
                      style={{
                        backgroundColor: getColorHex(detailLead.tipificacion_asesor_color) + '15',
                        color: getColorHex(detailLead.tipificacion_asesor_color),
                        boxShadow: `0 2px 8px -2px ${getColorHex(detailLead.tipificacion_asesor_color)}25`,
                      }}
                    >
                      {detailLead.tipificacion_asesor_nombre}
                    </span>
                  </div>
                )}
              </div>

              {/* Perfilamiento */}
              <div>
                <Separator className="mb-4" />
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 flex items-center justify-center">
                    <MessageSquare className="h-3.5 w-3.5 text-indigo-500" />
                  </div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Perfilamiento</p>
                </div>
                {loadingPerfilamiento ? (
                  <div className="flex items-center justify-center py-8 gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                    <span className="text-xs text-muted-foreground">Cargando respuestas...</span>
                  </div>
                ) : perfilamientoData.length > 0 ? (
                  <div className="space-y-2.5">
                    {perfilamientoData.map((item, index) => (
                      <div key={index} className="p-4 rounded-xl bg-gradient-to-r from-muted/40 to-muted/20 hover:from-muted/60 hover:to-muted/30 transition-colors">
                        <p className="text-xs font-semibold text-foreground">{item.pregunta}</p>
                        <p className="text-sm text-muted-foreground mt-1">{item.respuesta || '--'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                      <MessageSquare className="h-5 w-5 text-muted-foreground/30" />
                    </div>
                    <p className="text-xs text-muted-foreground/50">Sin respuestas de perfilamiento</p>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDetailModal(false); setDetailLead(null); }} className="rounded-xl">Cerrar</Button>
            <Button
              onClick={() => { setShowDetailModal(false); handleOpenEditModal(detailLead); }}
              className="gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-lg shadow-indigo-500/25"
            >
              <Pencil className="h-3.5 w-3.5" /> Editar Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
