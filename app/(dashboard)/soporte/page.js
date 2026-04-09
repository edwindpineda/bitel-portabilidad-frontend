'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { ticketService } from '@/lib/ticketService';
import {
  Search,
  Plus,
  Send,
  Paperclip,
  Loader2,
  X,
  ChevronDown,
  Lock,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Circle,
  ArrowLeft,
  Filter,
  User,
  Building2,
  Calendar,
  Tag,
  MessageSquare,
} from 'lucide-react';

const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(String(dateString).replace(' ', 'T'));
  if (isNaN(date.getTime())) return '';
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `${diffMins} min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' });
};

const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(String(dateString).replace(' ', 'T'));
  if (isNaN(date.getTime())) return '';
  return date.toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const PrioridadBadge = ({ nombre, color }) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-white" style={{ backgroundColor: color || '#6B7280' }}>
    {nombre}
  </span>
);

const EstadoBadge = ({ nombre, color }) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border" style={{ borderColor: color || '#6B7280', color: color || '#6B7280', backgroundColor: `${color}15` }}>
    <Circle className="h-2 w-2 fill-current" />
    {nombre}
  </span>
);

export default function SoportePage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const rolId = session?.user?.id_rol;
  const idEmpresa = session?.user?.id_empresa;
  const isSuperAdmin = rolId === 1 && (idEmpresa === 0 || idEmpresa === '0');
  const isAdmin = rolId === 1;
  const isCoordinador = rolId === 2;
  const canManage = rolId <= 2;

  // State
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [comentarios, setComentarios] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [loadingComentarios, setLoadingComentarios] = useState(false);
  const [catalogos, setCatalogos] = useState({ estados: [], prioridades: [], categorias: [] });
  const [usuarios, setUsuarios] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [filterPrioridad, setFilterPrioridad] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // New comment
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [isInternal, setIsInternal] = useState(false);
  const fileInputRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const messagesEndRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Create ticket modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ asunto: '', descripcion: '', id_categoria_soporte: '', id_prioridad_ticket: '' });
  const [creating, setCreating] = useState(false);

  // Stats
  const [stats, setStats] = useState([]);

  // Estado/asignar dropdowns
  const [showEstadoDropdown, setShowEstadoDropdown] = useState(false);
  const [showAsignarDropdown, setShowAsignarDropdown] = useState(false);

  // Mobile view
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  // Load initial data
  useEffect(() => {
    if (session?.accessToken) {
      loadCatalogos();
      loadTickets();
      loadStats();
      if (canManage) loadUsuarios();
    }
  }, [session?.accessToken]);

  const loadCatalogos = async () => {
    try {
      const res = await ticketService.getCatalogos();
      setCatalogos(res?.data || { estados: [], prioridades: [], categorias: [] });
    } catch (err) { console.error('Error cargando catalogos:', err); }
  };

  const loadStats = async () => {
    try {
      const res = await ticketService.getStats();
      setStats(res?.data || []);
    } catch (err) { console.error('Error cargando stats:', err); }
  };

  const loadUsuarios = async () => {
    try {
      const res = await ticketService.getUsuarios();
      setUsuarios(res?.data || []);
    } catch (err) { console.error('Error cargando usuarios:', err); }
  };

  const loadTickets = async (page = 1) => {
    try {
      setLoading(true);
      const res = await ticketService.getAll({
        page, limit: 20,
        estado: filterEstado, prioridad: filterPrioridad, categoria: filterCategoria, search: searchQuery
      });
      setTickets(res?.data || []);
      setPagination(res?.pagination || { total: 0, page: 1, totalPages: 1 });
    } catch (err) { console.error('Error cargando tickets:', err); }
    finally { setLoading(false); }
  };

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => { loadTickets(); }, 400);
    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchQuery, filterEstado, filterPrioridad, filterCategoria]);

  const selectTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setMobileShowDetail(true);
    setLoadingComentarios(true);
    try {
      const [detailRes, comentariosRes, historialRes] = await Promise.all([
        ticketService.getById(ticket.id),
        ticketService.getComentarios(ticket.id),
        ticketService.getHistorial(ticket.id)
      ]);
      setSelectedTicket(detailRes?.data || ticket);
      setComentarios(comentariosRes?.data || []);
      setHistorial(historialRes?.data || []);
      ticketService.markAsRead(ticket.id).catch(() => {});
    } catch (err) { console.error('Error cargando detalle:', err); }
    finally { setLoadingComentarios(false); }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comentarios, historial]);

  // Create ticket
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!createForm.asunto || !createForm.descripcion || !createForm.id_categoria_soporte || !createForm.id_prioridad_ticket) return;
    try {
      setCreating(true);
      await ticketService.create(createForm);
      setShowCreateModal(false);
      setCreateForm({ asunto: '', descripcion: '', id_categoria_soporte: '', id_prioridad_ticket: '' });
      loadTickets();
      loadStats();
    } catch (err) { console.error('Error creando ticket:', err); }
    finally { setCreating(false); }
  };

  // Send comment
  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() && selectedFiles.length === 0) return;
    try {
      setSendingComment(true);
      const formData = new FormData();
      if (newComment.trim()) formData.append('contenido', newComment.trim());
      formData.append('es_interno', isInternal.toString());
      selectedFiles.forEach(f => formData.append('archivos', f));

      await ticketService.createComentario(selectedTicket.id, formData);
      setNewComment('');
      setSelectedFiles([]);
      setIsInternal(false);

      // Reload comments
      const comentariosRes = await ticketService.getComentarios(selectedTicket.id);
      setComentarios(comentariosRes?.data || []);
    } catch (err) { console.error('Error enviando comentario:', err); }
    finally { setSendingComment(false); }
  };

  // Change estado
  const handleChangeEstado = async (nuevoEstadoId) => {
    try {
      await ticketService.updateEstado(selectedTicket.id, { id_estado_ticket: nuevoEstadoId });
      setShowEstadoDropdown(false);
      const [detailRes, historialRes] = await Promise.all([
        ticketService.getById(selectedTicket.id),
        ticketService.getHistorial(selectedTicket.id)
      ]);
      setSelectedTicket(detailRes?.data || selectedTicket);
      setHistorial(historialRes?.data || []);
      loadTickets(pagination.page);
      loadStats();
    } catch (err) { console.error('Error cambiando estado:', err); }
  };

  // Assign user
  const handleAssignUser = async (nuevoUsuarioId) => {
    try {
      await ticketService.assignUser(selectedTicket.id, { id_usuario_asignado: nuevoUsuarioId });
      setShowAsignarDropdown(false);
      const [detailRes, historialRes] = await Promise.all([
        ticketService.getById(selectedTicket.id),
        ticketService.getHistorial(selectedTicket.id)
      ]);
      setSelectedTicket(detailRes?.data || selectedTicket);
      setHistorial(historialRes?.data || []);
      loadTickets(pagination.page);
    } catch (err) { console.error('Error asignando usuario:', err); }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
    e.target.value = '';
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Build timeline: merge comments + historial
  const buildTimeline = () => {
    const items = [];
    comentarios.forEach(c => items.push({ ...c, _type: 'comentario', _date: c.fecha_registro }));
    historial.forEach(h => items.push({ ...h, _type: 'historial', _date: h.fecha_registro }));
    items.sort((a, b) => new Date(a._date) - new Date(b._date));
    return items;
  };

  const timeline = selectedTicket ? buildTimeline() : [];

  return (
    <div className="flex h-[calc(100vh-64px)] bg-background">
      {/* LEFT PANEL - Ticket List */}
      <div className={`w-full md:w-[420px] md:min-w-[380px] border-r border-border flex flex-col bg-card ${mobileShowDetail ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold text-foreground">Tickets de Soporte</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              Nuevo
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar tickets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-9 py-2 bg-secondary rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Filter className="h-3 w-3" />
            Filtros
            <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* Filters */}
          {showFilters && (
            <div className="mt-2 flex gap-2 flex-wrap">
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className="px-2 py-1 text-xs bg-secondary rounded-md border border-border text-foreground focus:outline-none"
              >
                <option value="">Todos los estados</option>
                {catalogos.estados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </select>
              <select
                value={filterPrioridad}
                onChange={(e) => setFilterPrioridad(e.target.value)}
                className="px-2 py-1 text-xs bg-secondary rounded-md border border-border text-foreground focus:outline-none"
              >
                <option value="">Todas las prioridades</option>
                {catalogos.prioridades.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </select>
              <select
                value={filterCategoria}
                onChange={(e) => setFilterCategoria(e.target.value)}
                className="px-2 py-1 text-xs bg-secondary rounded-md border border-border text-foreground focus:outline-none"
              >
                <option value="">Todas las categorias</option>
                {catalogos.categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Stats Summary */}
        {stats.length > 0 && (
          <div className="flex-shrink-0 px-4 py-2 border-b border-border flex gap-2 overflow-x-auto">
            {stats.map(s => (
              <div key={s.id} className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs whitespace-nowrap" style={{ backgroundColor: `${s.color}15`, color: s.color }}>
                <Circle className="h-2 w-2 fill-current" />
                {s.nombre}: <span className="font-semibold">{s.total}</span>
              </div>
            ))}
          </div>
        )}

        {/* Ticket List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">No hay tickets</p>
            </div>
          ) : (
            <>
              {tickets.map(ticket => (
                <div
                  key={ticket.id}
                  onClick={() => selectTicket(ticket)}
                  className={`px-4 py-3 border-b border-border cursor-pointer hover:bg-secondary/50 transition-colors ${selectedTicket?.id === ticket.id ? 'bg-secondary' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-mono text-muted-foreground">{ticket.numero_ticket}</span>
                        <PrioridadBadge nombre={ticket.prioridad_nombre} color={ticket.prioridad_color} />
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">{ticket.asunto}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <EstadoBadge nombre={ticket.estado_nombre} color={ticket.estado_color} />
                        <span className="text-[11px] text-muted-foreground">{ticket.categoria_nombre}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-[11px] text-muted-foreground">{formatRelativeTime(ticket.fecha_registro)}</span>
                      {ticket.asignado_username && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {ticket.asignado_username}
                        </span>
                      )}
                    </div>
                  </div>
                  {isSuperAdmin && ticket.empresa_nombre && (
                    <div className="flex items-center gap-1 mt-1">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{ticket.empresa_nombre}</span>
                    </div>
                  )}
                </div>
              ))}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 py-3">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => loadTickets(pagination.page - 1)}
                    className="px-3 py-1 text-xs bg-secondary rounded-md disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <span className="text-xs text-muted-foreground">{pagination.page} / {pagination.totalPages}</span>
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => loadTickets(pagination.page + 1)}
                    className="px-3 py-1 text-xs bg-secondary rounded-md disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* RIGHT PANEL - Ticket Detail */}
      <div className={`flex-1 flex flex-col bg-card ${!mobileShowDetail ? 'hidden md:flex' : 'flex'}`}>
        {selectedTicket ? (
          <>
            {/* Header */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-border">
              <div className="flex items-center gap-3">
                <button onClick={() => { setMobileShowDetail(false); setSelectedTicket(null); }} className="md:hidden">
                  <ArrowLeft className="h-5 w-5 text-foreground" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-muted-foreground">{selectedTicket.numero_ticket}</span>
                    <EstadoBadge nombre={selectedTicket.estado_nombre} color={selectedTicket.estado_color} />
                    <PrioridadBadge nombre={selectedTicket.prioridad_nombre} color={selectedTicket.prioridad_color} />
                  </div>
                  <h2 className="text-base font-semibold text-foreground truncate mt-0.5">{selectedTicket.asunto}</h2>
                </div>

                {/* Actions */}
                {canManage && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Change Estado */}
                    <div className="relative">
                      <button
                        onClick={() => { setShowEstadoDropdown(!showEstadoDropdown); setShowAsignarDropdown(false); }}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-border rounded-lg hover:bg-secondary transition-colors"
                      >
                        Estado <ChevronDown className="h-3 w-3" />
                      </button>
                      {showEstadoDropdown && (
                        <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-20 min-w-[160px]">
                          {catalogos.estados.map(e => (
                            <button
                              key={e.id}
                              onClick={() => handleChangeEstado(e.id)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-secondary flex items-center gap-2 first:rounded-t-lg last:rounded-b-lg"
                            >
                              <Circle className="h-2.5 w-2.5" style={{ color: e.color, fill: e.color }} />
                              {e.nombre}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Assign User */}
                    <div className="relative">
                      <button
                        onClick={() => { setShowAsignarDropdown(!showAsignarDropdown); setShowEstadoDropdown(false); }}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-border rounded-lg hover:bg-secondary transition-colors"
                      >
                        <User className="h-3 w-3" />
                        Asignar <ChevronDown className="h-3 w-3" />
                      </button>
                      {showAsignarDropdown && (
                        <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-20 min-w-[200px] max-h-[240px] overflow-y-auto">
                          {usuarios.map(u => (
                            <button
                              key={u.id}
                              onClick={() => handleAssignUser(u.id)}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-secondary flex items-center gap-2 first:rounded-t-lg last:rounded-b-lg ${selectedTicket.id_usuario_asignado == u.id ? 'bg-primary/10 text-primary font-medium' : ''}`}
                            >
                              <User className="h-3.5 w-3.5" />
                              {u.username}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Ticket Info Row */}
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1"><Tag className="h-3 w-3" />{selectedTicket.categoria_nombre}</span>
                <span className="flex items-center gap-1"><User className="h-3 w-3" />Reporta: {selectedTicket.reporta_username}</span>
                {selectedTicket.asignado_username && <span className="flex items-center gap-1"><User className="h-3 w-3" />Asignado: {selectedTicket.asignado_username}</span>}
                {isSuperAdmin && selectedTicket.empresa_nombre && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{selectedTicket.empresa_nombre}</span>}
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDateTime(selectedTicket.fecha_registro)}</span>
              </div>

              {/* Description */}
              {selectedTicket.descripcion && (
                <div className="mt-2 p-2.5 bg-secondary/50 rounded-lg text-sm text-foreground">
                  {selectedTicket.descripcion}
                </div>
              )}
            </div>

            {/* Chat / Timeline Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4 bg-secondary/20" onClick={() => { setShowEstadoDropdown(false); setShowAsignarDropdown(false); }}>
              {loadingComentarios ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : timeline.length > 0 ? (
                <div className="space-y-2">
                  {timeline.map((item, idx) => {
                    if (item._type === 'historial') {
                      let text = '';
                      if (item.id_usuario_nuevo && item.id_usuario_nuevo !== item.id_usuario_anterior) {
                        text = `${item.username || 'Sistema'} asigno a ${item.usuario_nuevo_username || 'usuario'}`;
                      } else {
                        text = `${item.username || 'Sistema'} cambio estado a ${item.estado_nuevo_nombre || ''}`;
                      }
                      if (item.comentario && item.comentario !== 'Ticket creado' && item.comentario !== 'Usuario asignado') {
                        text += ` - ${item.comentario}`;
                      }
                      if (item.comentario === 'Ticket creado') {
                        text = `${item.username || 'Sistema'} creo el ticket`;
                      }
                      return (
                        <div key={`h-${item.id}`} className="flex justify-center my-3">
                          <div className="bg-muted/80 rounded-full px-4 py-1 flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[11px] text-muted-foreground">{text}</span>
                            <span className="text-[10px] text-muted-foreground/60 ml-1">{formatRelativeTime(item._date)}</span>
                          </div>
                        </div>
                      );
                    }

                    const isOwn = item.id_usuario == userId;
                    const isInternalNote = item.es_interno;

                    return (
                      <div key={`c-${item.id}`} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-2 max-w-[65%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                          {/* Avatar */}
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white mt-1 ${isOwn ? 'bg-primary' : 'bg-slate-400'}`}>
                            {(item.username || '?')[0].toUpperCase()}
                          </div>

                          {/* Bubble */}
                          <div
                            className={`rounded-2xl px-4 py-2.5 shadow-sm relative ${
                              isInternalNote
                                ? 'bg-amber-50 border border-amber-200 rounded-tl-sm'
                                : isOwn
                                  ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                  : 'bg-card border border-border rounded-tl-sm'
                            }`}
                          >
                            {/* Author */}
                            <div className="flex items-center gap-1.5 mb-0.5">
                              {isInternalNote && <Lock className="h-3 w-3 text-amber-600" />}
                              <span className={`text-[12px] font-semibold ${
                                isInternalNote ? 'text-amber-700' : isOwn ? 'text-primary-foreground/90' : 'text-primary'
                              }`}>
                                {item.username}
                              </span>
                              {isInternalNote && <span className="text-[10px] text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full font-medium">Nota interna</span>}
                              {item.es_respuesta_agente && !isInternalNote && !isOwn && (
                                <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">Agente</span>
                              )}
                            </div>

                            {/* Attachments */}
                            {item.adjuntos && item.adjuntos.length > 0 && (
                              <div className="mb-1.5 space-y-1.5">
                                {item.adjuntos.map(adj => {
                                  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(adj.nombre_original) || adj.tipo_archivo?.startsWith('image/');
                                  return isImage ? (
                                    <a key={adj.id} href={adj.ruta_archivo} target="_blank" rel="noopener noreferrer" className="block">
                                      <img src={adj.ruta_archivo} alt={adj.nombre_original} className="max-w-full rounded-lg max-h-[250px] object-cover cursor-pointer" />
                                    </a>
                                  ) : (
                                    <a key={adj.id} href={adj.ruta_archivo} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isOwn ? 'bg-white/15 hover:bg-white/25' : 'bg-secondary hover:bg-secondary/80'}`}>
                                      <Paperclip className={`h-3.5 w-3.5 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`} />
                                      <span className={`text-xs underline truncate ${isOwn ? 'text-primary-foreground' : 'text-primary'}`}>{adj.nombre_original}</span>
                                    </a>
                                  );
                                })}
                              </div>
                            )}

                            {/* Content */}
                            {item.contenido && (
                              <p className={`text-[14px] leading-relaxed whitespace-pre-wrap break-words ${
                                isInternalNote ? 'text-amber-900' : isOwn ? 'text-primary-foreground' : 'text-foreground'
                              }`}>{item.contenido}</p>
                            )}

                            {/* Timestamp */}
                            <div className="flex justify-end mt-1">
                              <span className={`text-[10px] ${isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>{formatDateTime(item._date)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">No hay comentarios aun</p>
                </div>
              )}
            </div>

            {/* Comment Input */}
            <div className="flex-shrink-0 px-4 py-3 border-t border-border bg-card">
              {/* Selected files preview */}
              {selectedFiles.length > 0 && (
                <div className="flex gap-2 mb-2 flex-wrap">
                  {selectedFiles.map((file, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-secondary rounded-md text-xs">
                      <Paperclip className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate max-w-[120px]">{file.name}</span>
                      <button onClick={() => removeFile(i)}><X className="h-3 w-3 text-muted-foreground hover:text-destructive" /></button>
                    </div>
                  ))}
                </div>
              )}

              {/* Internal note toggle */}
              {canManage && (
                <div className="flex items-center gap-2 mb-2">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                    />
                    <Lock className="h-3 w-3" />
                    Nota interna
                  </label>
                </div>
              )}

              <form onSubmit={handleSendComment} className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
                  multiple
                  onChange={handleFileSelect}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
                >
                  <Paperclip className="h-5 w-5 text-muted-foreground" />
                </button>
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={isInternal ? "Escribe una nota interna..." : "Escribe un comentario..."}
                  disabled={sendingComment}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 ${isInternal ? 'bg-amber-50 border border-amber-200 placeholder-amber-400' : 'bg-secondary text-foreground placeholder-muted-foreground'}`}
                />
                <button
                  type="submit"
                  disabled={sendingComment || (!newComment.trim() && selectedFiles.length === 0)}
                  className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {sendingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
            <h3 className="text-lg font-medium mb-1">Tickets de Soporte</h3>
            <p className="text-sm">Selecciona un ticket para ver los detalles</p>
          </div>
        )}
      </div>

      {/* CREATE TICKET MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-base font-semibold text-foreground">Nuevo Ticket</h3>
              <button onClick={() => setShowCreateModal(false)}><X className="h-5 w-5 text-muted-foreground hover:text-foreground" /></button>
            </div>
            <form onSubmit={handleCreateTicket} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Asunto *</label>
                <input
                  type="text"
                  value={createForm.asunto}
                  onChange={(e) => setCreateForm({ ...createForm, asunto: e.target.value })}
                  placeholder="Describe brevemente el problema"
                  required
                  className="w-full px-3 py-2 bg-secondary rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Descripcion *</label>
                <textarea
                  value={createForm.descripcion}
                  onChange={(e) => setCreateForm({ ...createForm, descripcion: e.target.value })}
                  placeholder="Detalla el problema o consulta"
                  required
                  rows={4}
                  className="w-full px-3 py-2 bg-secondary rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Categoria *</label>
                  <select
                    value={createForm.id_categoria_soporte}
                    onChange={(e) => setCreateForm({ ...createForm, id_categoria_soporte: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-secondary rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Seleccionar</option>
                    {catalogos.categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Prioridad *</label>
                  <select
                    value={createForm.id_prioridad_ticket}
                    onChange={(e) => setCreateForm({ ...createForm, id_prioridad_ticket: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-secondary rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Seleccionar</option>
                    {catalogos.prioridades.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Crear Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
