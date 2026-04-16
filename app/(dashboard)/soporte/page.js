'use client';

import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  Clock,
  Circle,
  ArrowLeft,
  Filter,
  User,
  Building2,
  Calendar,
  Tag,
  MessageSquare,
  Monitor,
  LayoutGrid,
  List,
  Download,
  Activity,
  RefreshCw,
  Table as TableIcon,
  ChevronUp,
  ArrowUpDown
} from 'lucide-react';

// CORRECCIÓN: Limpiamos cualquier offset erróneo del backend y forzamos UTC puro
// El backend devuelve timestamps como string hora Lima sin zona (ej: "2026-04-15 21:27:35")
// Los parseamos sin agregar ni restar nada — el valor ya es hora Lima
const parseFechaUTC = (dateString) => {
  if (!dateString) return null;
  if (dateString instanceof Date) return isNaN(dateString.getTime()) ? null : dateString;
  let s = String(dateString).replace(' ', 'T');
  // Quitar cualquier offset que venga (por si acaso)
  s = s.replace(/(Z|[+-]\d{2}:?\d{2})$/, '');
  // Parsear como local (hora Lima) — no agregar Z
  const date = new Date(s);
  return isNaN(date.getTime()) ? null : date;
};

const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const date = parseFechaUTC(dateString);
  if (!date) return '';
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
  const d = toLima(date);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
};

const parseFecha = parseFechaUTC;

// La BD guarda hora UTC (5h adelantada respecto a Lima). Restamos 5h para mostrar hora Lima.
const toLima = (date) => new Date(date.getTime() - (5 * 60 * 60 * 1000));

const formatDateTime = (dateString) => {
  const date = parseFecha(dateString);
  if (!date) return '';
  const d = toLima(date);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = d.getHours();
  const min = String(d.getMinutes()).padStart(2, '0');
  const ampm = hh >= 12 ? 'p. m.' : 'a. m.';
  const hh12 = String(hh % 12 || 12).padStart(2, '0');
  return `${dd}/${mm}/${yyyy}, ${hh12}:${min} ${ampm}`;
};

const formatDateTimeLima = (dateString) => {
  const date = parseFecha(dateString);
  if (!date) return '';
  const d = toLima(date);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy}, ${hh}:${min}:${ss}`;
};

const downloadXlsx = (sheetData, filename) => {
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  const colWidths = sheetData[0].map((_, ci) => ({
    wch: Math.min(60, Math.max(12, ...sheetData.map(row => String(row[ci] ?? '').length)))
  }));
  ws['!cols'] = colWidths;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Datos');
  XLSX.writeFile(wb, filename);
};

// ── Funciones de dibujo de gráficas para Excel ──
const CHART_COLORS = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#06B6D4','#84CC16','#F97316','#6366F1'];

const drawBarChart = (title, labels, values, colors = CHART_COLORS) => {
  const canvas = document.createElement('canvas');
  canvas.width = 900; canvas.height = Math.max(350, labels.length * 45 + 120);
  const ctx = canvas.getContext('2d');
  const pad = { top: 60, right: 60, bottom: 30, left: 180 };
  const cw = canvas.width - pad.left - pad.right;
  const ch = canvas.height - pad.top - pad.bottom;

  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#111827'; ctx.font = 'bold 17px Arial'; ctx.textAlign = 'center';
  ctx.fillText(title, canvas.width / 2, 35);

  const maxVal = Math.max(...values, 1);
  const barH = Math.min(32, ch / labels.length - 8);
  const gap = ch / labels.length;

  // Grid lines
  for (let i = 0; i <= 5; i++) {
    const x = pad.left + (cw / 5) * i;
    ctx.strokeStyle = '#E5E7EB'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, pad.top); ctx.lineTo(x, pad.top + ch); ctx.stroke();
    ctx.fillStyle = '#9CA3AF'; ctx.font = '11px Arial'; ctx.textAlign = 'center';
    ctx.fillText(String(Math.round((maxVal / 5) * i)), x, pad.top + ch + 18);
  }

  labels.forEach((label, i) => {
    const y = pad.top + i * gap + (gap - barH) / 2;
    const bw = (values[i] / maxVal) * cw;
    // Bar with rounded right end
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    const radius = Math.min(6, barH / 2);
    ctx.roundRect(pad.left, y, Math.max(bw, 2), barH, [0, radius, radius, 0]);
    ctx.fill();
    // Label
    ctx.fillStyle = '#374151'; ctx.font = '13px Arial'; ctx.textAlign = 'right';
    ctx.fillText(label.length > 22 ? label.slice(0, 22) + '…' : label, pad.left - 10, y + barH / 2 + 5);
    // Value
    ctx.fillStyle = '#111827'; ctx.font = 'bold 13px Arial'; ctx.textAlign = 'left';
    ctx.fillText(String(values[i]), pad.left + bw + 8, y + barH / 2 + 5);
  });
  return canvas.toDataURL('image/png').split(',')[1];
};

const drawPieChart = (title, labels, values, colors = CHART_COLORS) => {
  const canvas = document.createElement('canvas');
  canvas.width = 800; canvas.height = 500;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, 800, 500);
  ctx.fillStyle = '#111827'; ctx.font = 'bold 17px Arial'; ctx.textAlign = 'center';
  ctx.fillText(title, 400, 35);

  const total = values.reduce((a, b) => a + b, 0);
  if (total === 0) return canvas.toDataURL('image/png').split(',')[1];

  const cx = 280, cy = 280, r = 180;
  let angle = -Math.PI / 2;
  values.forEach((val, i) => {
    const slice = (val / total) * 2 * Math.PI;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + slice);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length]; ctx.fill();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2.5; ctx.stroke();
    // Label inside slice if big enough
    if (slice > 0.3) {
      const mid = angle + slice / 2;
      const lx = cx + Math.cos(mid) * (r * 0.65);
      const ly = cy + Math.sin(mid) * (r * 0.65);
      ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center';
      ctx.fillText(((val / total) * 100).toFixed(0) + '%', lx, ly + 5);
    }
    angle += slice;
  });
  // Legend
  let ly = 80;
  labels.forEach((label, i) => {
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath(); ctx.roundRect(560, ly, 18, 18, 3); ctx.fill();
    ctx.fillStyle = '#374151'; ctx.font = '13px Arial'; ctx.textAlign = 'left';
    ctx.fillText(`${label}: ${values[i]}`, 586, ly + 14);
    ly += 30;
  });
  return canvas.toDataURL('image/png').split(',')[1];
};

const PrioridadBadge = ({ nombre, color }) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-white shadow-sm" style={{ backgroundColor: color || '#6B7280' }}>
    {nombre}
  </span>
);

const EstadoBadge = ({ nombre, color }) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border bg-white" style={{ borderColor: color || '#6B7280', color: color || '#6B7280' }}>
    <Circle className="h-2 w-2 fill-current" />
    {nombre}
  </span>
);

export default function SoportePage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const rolId = session?.user?.id_rol;
  const idEmpresa = session?.user?.id_empresa;
  const isAdminCentral = (rolId === 1 || rolId === 2) && (idEmpresa === 0 || idEmpresa === '0');
  const isSuperAdmin = rolId === 1 && (idEmpresa === 0 || idEmpresa === '0');
  const canManage = rolId <= 2;

  // State
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'kanban' | 'table'
  const [tableSortCol, setTableSortCol] = useState('fecha_registro');
  const [tableSortDir, setTableSortDir] = useState('desc');
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, setLoadingDetail] = useState(false);
  const [updatingTicketId, setUpdatingTicketId] = useState(null);
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
  const [filterEmpresa, setFilterEmpresa] = useState('');
  const [filterPlataforma] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // New comment
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [isInternal, setIsInternal] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
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
  const [dragOverColumn, setDragOverColumn] = useState(null);

  // Export modal
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFilters, setExportFilters] = useState({ empresa: '', categoria: '', prioridad: '', estado: '', fechaDesde: '', fechaHasta: '' });
  const [exporting, setExporting] = useState(false);
  const [exportTab, setExportTab] = useState('datos');

  // Auditoría modal
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditData, setAuditData] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditFilterUsuario, setAuditFilterUsuario] = useState('');
  const [auditFilterFechaDesde, setAuditFilterFechaDesde] = useState('');
  const [auditFilterFechaHasta, setAuditFilterFechaHasta] = useState('');
  const [auditFilterTicket, setAuditFilterTicket] = useState('');

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
      setCatalogos(res?.data || { estados: [], prioridades: [], categorias: [], empresas: [], plataformas: [] });
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

  const loadTickets = async (page = 1, silent = false) => {
    try {
      if (!silent) setLoading(true);
      // filterEmpresa puede ser "id:plataforma" compuesto
      const [empresaId, plataformaFromEmpresa] = filterEmpresa ? filterEmpresa.split(':') : ['', ''];
      const res = await ticketService.getAll({
        page, limit: 100,
        estado: filterEstado, prioridad: filterPrioridad, categoria: filterCategoria, search: searchQuery,
        empresa: empresaId || '', plataforma: plataformaFromEmpresa || filterPlataforma
      });
      setTickets(res?.data || []);
      setPagination(res?.pagination || { total: 0, page: 1, totalPages: 1 });
    } catch (err) { console.error('Error cargando tickets:', err); }
    finally { if (!silent) setLoading(false); }
  };

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => { loadTickets(); }, 400);
    return () => clearTimeout(searchTimeoutRef.current);
  }, [searchQuery, filterEstado, filterPrioridad, filterCategoria, filterEmpresa, filterPlataforma]);

  const selectTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setMobileShowDetail(true);
    setLoadingComentarios(true);
    setNewComment('');
    setSelectedFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = '44px';
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
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
      }
    };
    
    scrollToBottom();
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [comentarios, historial, selectedTicket?.id]);

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
      if (textareaRef.current) textareaRef.current.style.height = '44px';

      const comentariosRes = await ticketService.getComentarios(selectedTicket.id);
      setComentarios(comentariosRes?.data || []);
    } catch (err) { console.error('Error enviando comentario:', err); }
    finally { setSendingComment(false); }
  };

  // Change estado con Actualización Optimista + Estado de Bloqueo Correcto
  const handleChangeEstado = async (nuevoEstadoId, ticketId = null) => {
    const idToUpdate = ticketId || selectedTicket?.id;
    if (!idToUpdate) return;
    
    try {
      setUpdatingTicketId(idToUpdate);
      const estadoDestino = catalogos.estados.find(e => String(e.id) === String(nuevoEstadoId));
      
      setTickets(prev => prev.map(t => 
        String(t.id) === String(idToUpdate) 
          ? { ...t, id_estado_ticket: nuevoEstadoId, estado_nombre: estadoDestino?.nombre || t.estado_nombre, estado_color: estadoDestino?.color || t.estado_color } 
          : t
      ));

      setShowEstadoDropdown(false);

      await ticketService.updateEstado(idToUpdate, { id_estado_ticket: nuevoEstadoId });
      
      if (selectedTicket && String(idToUpdate) === String(selectedTicket.id)) {
        const [detailRes, historialRes] = await Promise.all([
          ticketService.getById(selectedTicket.id),
          ticketService.getHistorial(selectedTicket.id)
        ]);
        setSelectedTicket(detailRes?.data || selectedTicket);
        setHistorial(historialRes?.data || []);
      }
      
      await loadTickets(pagination.page, true); 
      loadStats();
    } catch (err) { 
      console.error('Error cambiando estado:', err); 
      await loadTickets(pagination.page, true); 
    } finally {
      setUpdatingTicketId(null);
    }
  };

  // Kanban Drag & Drop
  const handleDragStart = (e, ticketId) => {
    if (String(updatingTicketId) === String(ticketId)) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('ticketId', ticketId.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, estadoId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(estadoId);
  };

  const handleDragLeave = (e, estadoId) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e, nuevoEstadoId) => {
    e.preventDefault();
    setDragOverColumn(null);
    const ticketId = e.dataTransfer.getData('ticketId');
    if (ticketId) {
      handleChangeEstado(nuevoEstadoId, ticketId);
    }
  };

  // Exportar tickets a Excel (ExcelJS con gráficas embebidas)
  const handleExportExcel = async () => {
    try {
      setExporting(true);

      // Aplicar filtros del modal
      let filtered = [...tickets];
      const ef = exportFilters;
      if (ef.empresa) filtered = filtered.filter(t => t.empresa_nombre === ef.empresa);
      if (ef.categoria) filtered = filtered.filter(t => t.categoria_nombre === ef.categoria);
      if (ef.prioridad) filtered = filtered.filter(t => t.prioridad_nombre === ef.prioridad);
      if (ef.estado) filtered = filtered.filter(t => t.estado_nombre === ef.estado);
      if (ef.fechaDesde) { const d = new Date(ef.fechaDesde); filtered = filtered.filter(t => { const f = parseFecha(t.fecha_registro); return f && f >= d; }); }
      if (ef.fechaHasta) { const d = new Date(ef.fechaHasta + 'T23:59:59'); filtered = filtered.filter(t => { const f = parseFecha(t.fecha_registro); return f && f <= d; }); }

      const wb = new ExcelJS.Workbook();
      wb.creator = 'Sistema de Soporte';
      wb.created = new Date();

      const headerStyle = { font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } }, alignment: { horizontal: 'center', vertical: 'middle' }, border: { bottom: { style: 'thin', color: { argb: 'FF374151' } } } };
      const applyHeaders = (ws) => {
        const row = ws.getRow(1);
        row.eachCell(cell => { Object.assign(cell, headerStyle); });
        row.height = 28;
        ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: ws.rowCount, column: ws.columnCount } };
      };

      // ── HOJA 1: Tickets ──
      const wsTickets = wb.addWorksheet('Tickets', { views: [{ state: 'frozen', ySplit: 1 }] });
      wsTickets.columns = [
        { header: 'Número', key: 'num', width: 20 },
        { header: 'Fecha Creación', key: 'fc', width: 22 },
        { header: 'Fecha Actualización', key: 'fa', width: 22 },
        { header: 'Fecha Resolución', key: 'fr', width: 22 },
        { header: 'Días Resolución', key: 'dias', width: 16 },
        { header: 'Estado Resolución', key: 'er', width: 16 },
        { header: 'Asunto', key: 'asunto', width: 40 },
        { header: 'Descripción', key: 'desc', width: 50 },
        { header: 'Categoría', key: 'cat', width: 20 },
        { header: 'Reportado Por', key: 'reporta', width: 18 },
        { header: 'Asignado A', key: 'asignado', width: 18 },
        { header: 'Prioridad', key: 'prio', width: 14 },
        { header: 'Estado', key: 'estado', width: 20 },
        { header: 'Empresa', key: 'empresa', width: 25 },
        { header: 'Plataforma', key: 'plat', width: 16 },
      ];
      filtered.forEach(t => {
        const fCreacion = parseFecha(t.fecha_registro);
        const fResolucion = parseFecha(t.fecha_resolucion);
        let dias = '', er = '';
        if (fCreacion && fResolucion) { dias = Math.ceil((fResolucion - fCreacion) / 86400000); er = 'Resuelto'; }
        else if (fCreacion) { dias = Math.ceil((new Date() - fCreacion) / 86400000); er = 'Pendiente'; }
        wsTickets.addRow({
          num: t.numero_ticket || '', fc: formatDateTimeLima(t.fecha_registro),
          fa: t.fecha_actualizacion ? formatDateTimeLima(t.fecha_actualizacion) : '',
          fr: fResolucion ? formatDateTimeLima(t.fecha_resolucion) : '',
          dias, er, asunto: t.asunto || '', desc: t.descripcion || '',
          cat: t.categoria_nombre || '', reporta: t.reporta_username || t.usuario_externo_nombre || 'Externo',
          asignado: t.asignado_username || 'Sin asignar', prio: t.prioridad_nombre || '',
          estado: t.estado_nombre || '', empresa: t.empresa_nombre || '', plat: t.plataforma_nombre || ''
        });
      });
      applyHeaders(wsTickets);

      // ── Calcular datos para resúmenes ──
      const catMap = {}, empMap = {}, prioMap = {}, estadoMap = {};
      filtered.forEach(t => {
        const cat = t.categoria_nombre || 'Sin categoría';
        const emp = t.empresa_nombre || 'Sin empresa';
        const prio = t.prioridad_nombre || 'Sin prioridad';
        const est = t.estado_nombre || 'Sin estado';
        const fc = parseFecha(t.fecha_registro);
        const fr = parseFecha(t.fecha_resolucion);
        const dias = fc && fr ? Math.ceil((fr - fc) / 86400000) : null;
        const resuelto = est === 'Resuelto' || est === 'Cerrado';

        if (!catMap[cat]) catMap[cat] = { total: 0, resueltos: 0, diasSum: 0, diasCount: 0 };
        catMap[cat].total++; if (resuelto) catMap[cat].resueltos++;
        if (dias !== null) { catMap[cat].diasSum += dias; catMap[cat].diasCount++; }

        if (!empMap[emp]) empMap[emp] = { total: 0, resueltos: 0, diasSum: 0, diasCount: 0 };
        empMap[emp].total++; if (resuelto) empMap[emp].resueltos++;
        if (dias !== null) { empMap[emp].diasSum += dias; empMap[emp].diasCount++; }

        if (!prioMap[prio]) prioMap[prio] = { total: 0, resueltos: 0, diasSum: 0, diasCount: 0 };
        prioMap[prio].total++; if (resuelto) prioMap[prio].resueltos++;
        if (dias !== null) { prioMap[prio].diasSum += dias; prioMap[prio].diasCount++; }

        if (!estadoMap[est]) estadoMap[est] = 0;
        estadoMap[est]++;
      });

      // ── HOJA 2: Por Categoría ──
      const wsCat = wb.addWorksheet('Por Categoría', { views: [{ state: 'frozen', ySplit: 1 }] });
      wsCat.columns = [
        { header: 'Categoría', key: 'cat', width: 25 }, { header: 'Total Tickets', key: 'total', width: 14 },
        { header: 'Resueltos/Cerrados', key: 'res', width: 18 }, { header: 'Pendientes', key: 'pend', width: 14 },
        { header: '% Resolución', key: 'pct', width: 14 }, { header: 'Prom. Días Resolución', key: 'dias', width: 22 },
      ];
      Object.entries(catMap).sort((a, b) => b[1].total - a[1].total).forEach(([cat, d]) => {
        wsCat.addRow({ cat, total: d.total, res: d.resueltos, pend: d.total - d.resueltos, pct: d.total > 0 ? Math.round((d.resueltos / d.total) * 100) + '%' : '0%', dias: d.diasCount > 0 ? Math.round(d.diasSum / d.diasCount) : 'N/A' });
      });
      const catTotal = Object.values(catMap).reduce((a, d) => ({ total: a.total + d.total, res: a.res + d.resueltos }), { total: 0, res: 0 });
      wsCat.addRow({ cat: 'TOTAL', total: catTotal.total, res: catTotal.res, pend: catTotal.total - catTotal.res, pct: catTotal.total > 0 ? Math.round((catTotal.res / catTotal.total) * 100) + '%' : '0%', dias: '' });
      const catLastRow = wsCat.getRow(wsCat.rowCount);
      catLastRow.eachCell(cell => { cell.font = { bold: true }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }; });
      applyHeaders(wsCat);

      // ── HOJA 3: Por Empresa ──
      const wsEmp = wb.addWorksheet('Por Empresa', { views: [{ state: 'frozen', ySplit: 1 }] });
      wsEmp.columns = [
        { header: 'Empresa', key: 'emp', width: 30 }, { header: 'Total Tickets', key: 'total', width: 14 },
        { header: 'Resueltos/Cerrados', key: 'res', width: 18 }, { header: 'Pendientes', key: 'pend', width: 14 },
        { header: '% Resolución', key: 'pct', width: 14 }, { header: 'Prom. Días Resolución', key: 'dias', width: 22 },
      ];
      Object.entries(empMap).sort((a, b) => b[1].total - a[1].total).forEach(([emp, d]) => {
        wsEmp.addRow({ emp, total: d.total, res: d.resueltos, pend: d.total - d.resueltos, pct: d.total > 0 ? Math.round((d.resueltos / d.total) * 100) + '%' : '0%', dias: d.diasCount > 0 ? Math.round(d.diasSum / d.diasCount) : 'N/A' });
      });
      applyHeaders(wsEmp);

      // ── HOJA 4: Por Prioridad ──
      const wsPrio = wb.addWorksheet('Por Prioridad', { views: [{ state: 'frozen', ySplit: 1 }] });
      wsPrio.columns = [
        { header: 'Prioridad', key: 'prio', width: 18 }, { header: 'Total Tickets', key: 'total', width: 14 },
        { header: 'Resueltos/Cerrados', key: 'res', width: 18 }, { header: 'Pendientes', key: 'pend', width: 14 },
        { header: '% Resolución', key: 'pct', width: 14 }, { header: 'Prom. Días Resolución', key: 'dias', width: 22 },
      ];
      Object.entries(prioMap).forEach(([prio, d]) => {
        wsPrio.addRow({ prio, total: d.total, res: d.resueltos, pend: d.total - d.resueltos, pct: d.total > 0 ? Math.round((d.resueltos / d.total) * 100) + '%' : '0%', dias: d.diasCount > 0 ? Math.round(d.diasSum / d.diasCount) : 'N/A' });
      });
      applyHeaders(wsPrio);

      // ── HOJA 5: Tiempos Resolución ──
      const wsTiempo = wb.addWorksheet('Tiempos Resolución', { views: [{ state: 'frozen', ySplit: 1 }] });
      wsTiempo.columns = [
        { header: 'Número', key: 'num', width: 20 }, { header: 'Asunto', key: 'asunto', width: 35 },
        { header: 'Categoría', key: 'cat', width: 20 }, { header: 'Prioridad', key: 'prio', width: 14 },
        { header: 'Empresa', key: 'emp', width: 25 }, { header: 'Fecha Creación', key: 'fc', width: 22 },
        { header: 'Fecha Resolución', key: 'fr', width: 22 }, { header: 'Días Resolución', key: 'dias', width: 16 },
        { header: 'Estado', key: 'estado', width: 14 },
      ];
      filtered.map(t => {
        const fc = parseFecha(t.fecha_registro); const fr = parseFecha(t.fecha_resolucion);
        let dias = 0, estado = 'Pendiente';
        if (fc && fr) { dias = Math.ceil((fr - fc) / 86400000); estado = 'Resuelto'; }
        else if (fc) { dias = Math.ceil((new Date() - fc) / 86400000); }
        return { t, dias, estado };
      }).sort((a, b) => b.dias - a.dias).forEach(({ t, dias, estado }) => {
        const fr = parseFecha(t.fecha_resolucion);
        wsTiempo.addRow({ num: t.numero_ticket || '', asunto: t.asunto || '', cat: t.categoria_nombre || '', prio: t.prioridad_nombre || '', emp: t.empresa_nombre || '', fc: formatDateTimeLima(t.fecha_registro), fr: fr ? formatDateTimeLima(t.fecha_resolucion) : '', dias, estado });
      });
      applyHeaders(wsTiempo);

      // ── HOJA 6: Gráficas ──
      const wsCharts = wb.addWorksheet('Gráficas');

      // Gráfica 1: Tickets por Categoría (barra)
      const catLabels = Object.keys(catMap).sort((a, b) => catMap[b].total - catMap[a].total);
      const catValues = catLabels.map(c => catMap[c].total);
      const chartCat = drawBarChart('Tickets por Categoría', catLabels, catValues);
      const imgCat = wb.addImage({ base64: chartCat, extension: 'png' });
      wsCharts.addImage(imgCat, { tl: { col: 0, row: 0 }, ext: { width: 900, height: Math.max(350, catLabels.length * 45 + 120) } });

      // Gráfica 2: Distribución por Estado (pie)
      const estLabels = Object.keys(estadoMap);
      const estValues = estLabels.map(e => estadoMap[e]);
      const estadoColors = estLabels.map(e => {
        const est = (catalogos.estados || []).find(s => s.nombre === e);
        return est?.color || CHART_COLORS[estLabels.indexOf(e) % CHART_COLORS.length];
      });
      const chartEst = drawPieChart('Distribución por Estado', estLabels, estValues, estadoColors);
      const imgEst = wb.addImage({ base64: chartEst, extension: 'png' });
      const chart1BottomRow = Math.ceil((Math.max(350, catLabels.length * 45 + 120)) / 20) + 2;
      wsCharts.addImage(imgEst, { tl: { col: 0, row: chart1BottomRow }, ext: { width: 800, height: 500 } });

      // Gráfica 3: Promedio días resolución por categoría (barra)
      const catDiasLabels = catLabels.filter(c => catMap[c].diasCount > 0);
      const catDiasValues = catDiasLabels.map(c => Math.round(catMap[c].diasSum / catMap[c].diasCount));
      if (catDiasLabels.length > 0) {
        const chartDias = drawBarChart('Promedio Días de Resolución por Categoría', catDiasLabels, catDiasValues, ['#EF4444','#F59E0B','#8B5CF6','#3B82F6','#10B981','#EC4899']);
        const imgDias = wb.addImage({ base64: chartDias, extension: 'png' });
        const chart2BottomRow = chart1BottomRow + Math.ceil(500 / 20) + 2;
        wsCharts.addImage(imgDias, { tl: { col: 0, row: chart2BottomRow }, ext: { width: 900, height: Math.max(350, catDiasLabels.length * 45 + 120) } });
      }

      // Descargar
      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const fecha = new Date().toLocaleDateString('es-PE', { timeZone: 'America/Lima' }).replace(/\//g, '-');
      a.href = url; a.download = `Reporte_Tickets_${fecha}.xlsx`; a.click();
      URL.revokeObjectURL(url);
      setShowExportModal(false);
    } catch (err) {
      console.error('Error exportando:', err);
    } finally {
      setExporting(false);
    }
  };

  // Exportar auditoría a Excel
  const handleExportAudit = () => {
    const filtered = getAuditFiltered();
    const headers = ['Ticket', 'Asunto', 'Acción', 'Estado Anterior', 'Estado Nuevo', 'Asignación / Creación', 'Realizado Por', 'Fecha (Lima)'];
    const rows = filtered.map(h => {
      const esCreacion = (h.comentario || '').startsWith('Ticket creado');
      const esReasignacion = !esCreacion && h.id_usuario_nuevo != null && String(h.id_usuario_nuevo) !== String(h.id_usuario_anterior ?? '');
      const accion = esCreacion ? 'Creación' : esReasignacion ? 'Reasignación' : 'Cambio de Estado';
      const nombreExterno = !h.username && h.comentario
        ? (h.comentario.match(/Ticket creado por (.+?) \(externo\)/)?.[1] || null)
        : null;
      const quien = h.username || nombreExterno || 'Sistema';
      const asignacionCol = esCreacion
        ? `Creado por: ${quien}`
        : esReasignacion
          ? `${h.usuario_anterior_username || 'Sin asignar'} → ${h.usuario_nuevo_username || '—'}`
          : '—';
      return [
        h.numero_ticket || '',
        h.asunto || '',
        accion,
        h.estado_anterior_nombre || '—',
        h.estado_nuevo_nombre || '—',
        asignacionCol,
        quien,
        formatDateTimeLima(h.fecha_registro)
      ];
    });
    const fecha = new Date().toLocaleDateString('es-PE', { timeZone: 'America/Lima' }).replace(/\//g, '-');
    downloadXlsx([headers, ...rows], `Auditoria_Tickets_${fecha}.xlsx`);
  };

  // Cargar auditoría — recibe los filtros actuales como parámetro para evitar stale closure
  const loadAudit = async ({ usuario = auditFilterUsuario, desde = auditFilterFechaDesde, hasta = auditFilterFechaHasta, ticket = auditFilterTicket } = {}) => {
    try {
      setLoadingAudit(true);
      const params = {};
      if (usuario) params.id_usuario = usuario;
      if (desde) params.fecha_desde = desde;
      if (hasta) params.fecha_hasta = hasta;
      if (ticket) params.numero_ticket = ticket;
      const res = await ticketService.getHistorialTodos(params);
      setAuditData(res?.data || []);
    } catch (err) {
      console.error('Error cargando auditoría:', err);
      setAuditData([]);
    } finally {
      setLoadingAudit(false);
    }
  };

  // Filtro local solo para búsqueda de texto en tiempo real (sin re-fetch)
  const getAuditFiltered = () => {
    if (!auditFilterTicket) return auditData;
    const q = auditFilterTicket.toLowerCase();
    return auditData.filter(h =>
      (h.numero_ticket || '').toLowerCase().includes(q) ||
      (h.asunto || '').toLowerCase().includes(q)
    );
  };

  const handleApplyAuditFilters = () => {
    loadAudit({
      usuario: auditFilterUsuario,
      desde: auditFilterFechaDesde,
      hasta: auditFilterFechaHasta,
      ticket: auditFilterTicket,
    });
  };

  const openAuditModal = () => {
    setShowAuditModal(true);
    loadAudit({ usuario: '', desde: '', hasta: '', ticket: '' });
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
      loadTickets(pagination.page, true);
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

  const buildTimeline = () => {
    const items = [];
    comentarios.forEach(c => items.push({ ...c, _type: 'comentario', _date: c.fecha_registro }));
    historial.forEach(h => items.push({ ...h, _type: 'historial', _date: h.fecha_registro }));
    items.sort((a, b) => new Date(a._date) - new Date(b._date));
    return items;
  };

  const timeline = selectedTicket ? buildTimeline() : [];

  // Preview data para export modal
  const exportPreview = useMemo(() => {
    if (!showExportModal) return null;
    let filtered = [...tickets];
    const ef = exportFilters;
    if (ef.empresa) filtered = filtered.filter(t => t.empresa_nombre === ef.empresa);
    if (ef.categoria) filtered = filtered.filter(t => t.categoria_nombre === ef.categoria);
    if (ef.prioridad) filtered = filtered.filter(t => t.prioridad_nombre === ef.prioridad);
    if (ef.estado) filtered = filtered.filter(t => t.estado_nombre === ef.estado);
    if (ef.fechaDesde) { const d = new Date(ef.fechaDesde); filtered = filtered.filter(t => { const f = parseFecha(t.fecha_registro); return f && f >= d; }); }
    if (ef.fechaHasta) { const d = new Date(ef.fechaHasta + 'T23:59:59'); filtered = filtered.filter(t => { const f = parseFecha(t.fecha_registro); return f && f <= d; }); }

    const catMap = {}, empMap = {}, estadoMap = {};
    filtered.forEach(t => {
      const cat = t.categoria_nombre || 'Sin categoría';
      const emp = t.empresa_nombre || 'Sin empresa';
      const est = t.estado_nombre || 'Sin estado';
      const fc = parseFecha(t.fecha_registro);
      const fr = parseFecha(t.fecha_resolucion);
      const dias = fc && fr ? Math.ceil((fr - fc) / 86400000) : null;
      const resuelto = est === 'Resuelto' || est === 'Cerrado';

      if (!catMap[cat]) catMap[cat] = { total: 0, resueltos: 0, diasSum: 0, diasCount: 0 };
      catMap[cat].total++; if (resuelto) catMap[cat].resueltos++;
      if (dias !== null) { catMap[cat].diasSum += dias; catMap[cat].diasCount++; }

      if (!empMap[emp]) empMap[emp] = { total: 0, resueltos: 0, diasSum: 0, diasCount: 0 };
      empMap[emp].total++; if (resuelto) empMap[emp].resueltos++;
      if (dias !== null) { empMap[emp].diasSum += dias; empMap[emp].diasCount++; }

      if (!estadoMap[est]) estadoMap[est] = 0;
      estadoMap[est]++;
    });

    // Generar gráficas
    let chartCat = null, chartEstado = null, chartDias = null;
    try {
      const catLabels = Object.keys(catMap).sort((a, b) => catMap[b].total - catMap[a].total);
      const catValues = catLabels.map(c => catMap[c].total);
      if (catLabels.length > 0) chartCat = 'data:image/png;base64,' + drawBarChart('Tickets por Categoría', catLabels, catValues);

      const estLabels = Object.keys(estadoMap);
      const estValues = estLabels.map(e => estadoMap[e]);
      const estColors = estLabels.map(e => {
        const found = (catalogos.estados || []).find(s => s.nombre === e);
        return found?.color || CHART_COLORS[estLabels.indexOf(e) % CHART_COLORS.length];
      });
      if (estLabels.length > 0) chartEstado = 'data:image/png;base64,' + drawPieChart('Distribución por Estado', estLabels, estValues, estColors);

      const catDiasLabels = catLabels.filter(c => catMap[c].diasCount > 0);
      const catDiasValues = catDiasLabels.map(c => Math.round(catMap[c].diasSum / catMap[c].diasCount));
      if (catDiasLabels.length > 0) chartDias = 'data:image/png;base64,' + drawBarChart('Promedio Días de Resolución por Categoría', catDiasLabels, catDiasValues, ['#EF4444','#F59E0B','#8B5CF6','#3B82F6','#10B981','#EC4899']);
    } catch (e) { console.error('Error generando gráficas preview:', e); }

    return { filtered, catMap, empMap, estadoMap, chartCat, chartEstado, chartDias };
  }, [showExportModal, tickets, exportFilters, catalogos.estados]);

  const listWidthClass = viewMode === 'kanban' || viewMode === 'table'
    ? `flex-1 min-w-0 flex-col ${mobileShowDetail ? 'hidden lg:flex' : 'flex'}`
    : `flex-1 md:flex-none md:w-[420px] md:min-w-[380px] md:flex-shrink-0 flex-col ${mobileShowDetail ? 'hidden md:flex' : 'flex'}`;

  const rightPanelClasses = viewMode === 'kanban' || viewMode === 'table'
    ? (selectedTicket ? `w-full lg:w-[500px] lg:flex-shrink-0 flex-col bg-card border-l border-border ${mobileShowDetail ? 'flex' : 'hidden lg:flex'}` : 'hidden')
    : `flex-1 flex-col bg-card border-l border-border ${mobileShowDetail ? 'flex' : 'hidden md:flex'}`;

  return (
    <div className="flex h-[calc(100vh-64px)] bg-background overflow-hidden relative">
      
      {/* LEFT PANEL */}
      <div className={`${listWidthClass} border-r border-border bg-card`}>
        <div className="flex-shrink-0 px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold text-foreground">Tickets de Soporte</h1>
              {isSuperAdmin && (
                <div className="flex items-center bg-secondary rounded-lg p-0.5 border border-border/50">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    title="Vista de Lista"
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('kanban')}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'kanban' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    title="Vista de Tablero Kanban"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    title="Vista de Tabla"
                  >
                    <TableIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isSuperAdmin && (
                <>
                  <button
                    onClick={openAuditModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors border border-border"
                    title="Ver actividad del equipo"
                  >
                    <Activity className="h-4 w-4" />
                    <span className="hidden sm:inline">Actividad</span>
                  </button>
                  <button
                    onClick={() => setShowExportModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors border border-border"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Exportar</span>
                  </button>
                </>
              )}
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nuevo Ticket</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar tickets (asunto, detalle, número)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2 bg-secondary rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring border border-transparent focus:border-border"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between mt-1">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                <Filter className="h-3 w-3" />
                Filtros Avanzados
                <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
              <span className="text-xs text-muted-foreground">{pagination.total} resultados</span>
            </div>

            {showFilters && (
              <div className="pt-2 flex gap-2 flex-wrap">
                <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} className="px-2 py-1.5 text-xs bg-secondary rounded-md border border-border text-foreground focus:outline-none">
                  <option value="">Todos los estados</option>
                  {catalogos.estados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
                <select value={filterPrioridad} onChange={(e) => setFilterPrioridad(e.target.value)} className="px-2 py-1.5 text-xs bg-secondary rounded-md border border-border text-foreground focus:outline-none">
                  <option value="">Todas las prioridades</option>
                  {catalogos.prioridades.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                <select value={filterCategoria} onChange={(e) => setFilterCategoria(e.target.value)} className="px-2 py-1.5 text-xs bg-secondary rounded-md border border-border text-foreground focus:outline-none">
                  <option value="">Todas las categorias</option>
                  {catalogos.categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                {isAdminCentral && catalogos.empresas?.length > 0 && (
                  <select value={filterEmpresa} onChange={(e) => setFilterEmpresa(e.target.value)} className="px-2 py-1.5 text-xs bg-secondary rounded-md border border-border text-foreground focus:outline-none">
                    <option value="">Todas las empresas</option>
                    {catalogos.empresas.map(e => <option key={`${e.id}_${e.id_plataforma}`} value={`${e.id}:${e.id_plataforma}`}>{e.razon_social}</option>)}
                  </select>
                )}
              </div>
            )}
          </div>
        </div>

        {stats.length > 0 && viewMode === 'list' && (
          <div className="flex-shrink-0 px-4 py-2 border-b border-border flex gap-2 overflow-x-auto bg-card">
            {stats.map(s => (
              <div key={s.id} className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs whitespace-nowrap font-medium" style={{ backgroundColor: `${s.color}15`, color: s.color }}>
                <Circle className="h-2 w-2 fill-current" />
                {s.nombre}: {s.total}
              </div>
            ))}
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-secondary/10">
          {loading ? (
            <div className="flex items-center justify-center py-12 h-full">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 h-full text-muted-foreground">
              <MessageSquare className="h-10 w-10 mb-2 opacity-50" />
              <p className="text-sm">No hay tickets que coincidan</p>
            </div>
          ) : viewMode === 'table' ? (
            (() => {
              const tableCols = [
                { key: 'numero_ticket', label: '#Ticket', width: 'w-[130px]' },
                { key: 'asunto', label: 'Asunto', width: 'w-auto' },
                { key: 'estado_nombre', label: 'Estado', width: 'w-[160px]' },
                { key: 'prioridad_nombre', label: 'Prioridad', width: 'w-[110px]' },
                { key: 'categoria_nombre', label: 'Categoría', width: 'w-[140px]' },
                ...(isAdminCentral ? [{ key: 'empresa_nombre', label: 'Empresa', width: 'w-[160px]' }] : []),
                { key: 'asignado_username', label: 'Asignado a', width: 'w-[130px]' },
                { key: 'fecha_registro', label: 'Creado', width: 'w-[155px]' },
                { key: 'fecha_actualizacion', label: 'Actualizado', width: 'w-[155px]' },
              ];

              const sorted = [...tickets].sort((a, b) => {
                let va = a[tableSortCol] ?? '';
                let vb = b[tableSortCol] ?? '';
                if (tableSortCol.startsWith('fecha_')) {
                  va = parseFechaUTC(va)?.getTime() ?? 0;
                  vb = parseFechaUTC(vb)?.getTime() ?? 0;
                  return tableSortDir === 'asc' ? va - vb : vb - va;
                }
                va = String(va).toLowerCase();
                vb = String(vb).toLowerCase();
                return tableSortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
              });

              const handleTableSort = (key) => {
                if (tableSortCol === key) setTableSortDir(d => d === 'asc' ? 'desc' : 'asc');
                else { setTableSortCol(key); setTableSortDir('asc'); }
              };

              return (
                <div className="flex-1 overflow-auto bg-card">
                  <table className="w-full text-sm border-collapse" style={{ minWidth: 900 }}>
                    <thead className="sticky top-0 z-10 bg-card border-b-2 border-border shadow-sm">
                      <tr>
                        {tableCols.map(col => (
                          <th
                            key={col.key}
                            onClick={() => handleTableSort(col.key)}
                            className={`px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground hover:bg-secondary/50 select-none whitespace-nowrap transition-colors ${col.width}`}
                          >
                            <span className="flex items-center gap-1">
                              {col.label}
                              {tableSortCol === col.key
                                ? tableSortDir === 'asc'
                                  ? <ChevronUp className="h-3 w-3 text-primary" />
                                  : <ChevronDown className="h-3 w-3 text-primary" />
                                : <ArrowUpDown className="h-3 w-3 opacity-30" />}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {sorted.map(ticket => {
                        const isUpdating = String(updatingTicketId) === String(ticket.id);
                        const isSelected = selectedTicket?.id === ticket.id && !isUpdating;
                        return (
                          <tr
                            key={ticket.id}
                            onClick={() => !isUpdating && selectTicket(ticket)}
                            className={`transition-colors
                              ${isUpdating ? 'opacity-50 pointer-events-none animate-pulse' : 'cursor-pointer hover:bg-secondary/40'}
                              ${isSelected ? 'bg-primary/5 border-l-[3px] border-l-primary' : 'border-l-[3px] border-l-transparent'}`}
                          >
                            {/* # Ticket */}
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <span className="text-[11px] font-mono font-semibold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                                {isUpdating && <Loader2 className="h-2.5 w-2.5 animate-spin text-primary" />}
                                {ticket.numero_ticket}
                              </span>
                            </td>
                            {/* Asunto */}
                            <td className="px-3 py-2.5 max-w-[300px]">
                              <p className="text-sm font-medium text-foreground truncate">{ticket.asunto}</p>
                              {ticket.descripcion && (
                                <p className="text-[11px] text-muted-foreground truncate mt-0.5 max-w-[280px]">{ticket.descripcion}</p>
                              )}
                            </td>
                            {/* Estado */}
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <EstadoBadge nombre={ticket.estado_nombre} color={ticket.estado_color} />
                            </td>
                            {/* Prioridad */}
                            <td className="px-3 py-2.5 whitespace-nowrap">
                              <PrioridadBadge nombre={ticket.prioridad_nombre} color={ticket.prioridad_color} />
                            </td>
                            {/* Categoría */}
                            <td className="px-3 py-2.5 whitespace-nowrap text-xs text-muted-foreground">
                              {ticket.categoria_nombre || '—'}
                            </td>
                            {/* Empresa (solo admins) */}
                            {isAdminCentral && (
                              <td className="px-3 py-2.5 whitespace-nowrap text-xs text-muted-foreground">
                                {ticket.empresa_nombre
                                  ? <span className="flex items-center gap-1"><Building2 className="h-3 w-3 flex-shrink-0" />{ticket.empresa_nombre}</span>
                                  : '—'}
                              </td>
                            )}
                            {/* Asignado */}
                            <td className="px-3 py-2.5 whitespace-nowrap text-xs text-muted-foreground">
                              {ticket.asignado_username
                                ? <span className="flex items-center gap-1 bg-primary/5 border border-primary/10 px-1.5 py-0.5 rounded text-primary/80"><User className="h-3 w-3" />{ticket.asignado_username}</span>
                                : <span className="italic opacity-50">Sin asignar</span>}
                            </td>
                            {/* Fecha creación */}
                            <td className="px-3 py-2.5 whitespace-nowrap text-xs text-muted-foreground">
                              {formatDateTime(ticket.fecha_registro)}
                            </td>
                            {/* Fecha actualización */}
                            <td className="px-3 py-2.5 whitespace-nowrap text-xs text-muted-foreground">
                              {ticket.fecha_actualizacion ? formatDateTime(ticket.fecha_actualizacion) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 py-4 border-t border-border bg-card sticky bottom-0">
                      <button disabled={pagination.page <= 1} onClick={() => loadTickets(pagination.page - 1)} className="px-3 py-1.5 text-xs font-medium bg-secondary hover:bg-secondary/80 rounded-md disabled:opacity-50 transition-colors">
                        Anterior
                      </button>
                      <span className="text-xs font-medium text-muted-foreground px-2">{pagination.page} de {pagination.totalPages}</span>
                      <button disabled={pagination.page >= pagination.totalPages} onClick={() => loadTickets(pagination.page + 1)} className="px-3 py-1.5 text-xs font-medium bg-secondary hover:bg-secondary/80 rounded-md disabled:opacity-50 transition-colors">
                        Siguiente
                      </button>
                    </div>
                  )}
                </div>
              );
            })()
          ) : viewMode === 'kanban' ? (
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-3 flex gap-3 h-full items-stretch">
              {catalogos.estados.map(estado => {
                const columnTickets = tickets.filter(t => String(t.id_estado_ticket) === String(estado.id) || t.estado_nombre === estado.nombre);
                const isDragOver = dragOverColumn === estado.id;

                return (
                  <div
                    key={estado.id}
                    className={`min-w-[280px] flex-1 max-w-[360px] flex flex-col rounded-xl border transition-all duration-200 ${isDragOver ? 'border-primary/50 bg-primary/5 shadow-lg scale-[1.01]' : 'border-border bg-secondary/20'}`}
                    onDragOver={(e) => handleDragOver(e, estado.id)}
                    onDragLeave={(e) => handleDragLeave(e, estado.id)}
                    onDrop={(e) => handleDrop(e, estado.id)}
                  >
                    <div className="px-3 py-2.5 border-b border-border/70 flex items-center justify-between bg-card/80 rounded-t-xl backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: estado.color }} />
                        <h3 className="font-semibold text-[13px] text-foreground">{estado.nombre}</h3>
                      </div>
                      <span className="text-[11px] font-bold min-w-[24px] h-[24px] flex items-center justify-center rounded-full text-white shadow-sm" style={{ backgroundColor: estado.color }}>
                        {columnTickets.length}
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin">
                      {columnTickets.map(ticket => {
                        const isUpdating = String(updatingTicketId) === String(ticket.id);
                        const isSelected = selectedTicket?.id === ticket.id && !isUpdating;

                        return (
                          <div
                            key={ticket.id}
                            draggable={!isUpdating}
                            onDragStart={(e) => handleDragStart(e, ticket.id)}
                            onClick={() => !isUpdating && selectTicket(ticket)}
                            className={`bg-card p-2.5 rounded-lg border shadow-sm transition-all duration-150
                              ${isUpdating ? 'opacity-50 pointer-events-none animate-pulse' : 'cursor-grab active:cursor-grabbing hover:shadow-md hover:-translate-y-0.5'}
                              ${isSelected ? 'ring-2 ring-primary border-primary shadow-primary/10' : 'border-border/80 hover:border-primary/40'}`}
                          >
                            <div className="flex justify-between items-center mb-1.5 gap-1">
                              <span className="text-[10px] font-mono text-muted-foreground font-medium bg-secondary/80 px-1.5 py-0.5 rounded flex items-center gap-1">
                                {isUpdating && <Loader2 className="h-2.5 w-2.5 animate-spin text-primary" />}
                                {ticket.numero_ticket}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <PrioridadBadge nombre={ticket.prioridad_nombre} color={ticket.prioridad_color} />
                                <span className="text-[10px] text-muted-foreground/70 flex items-center gap-0.5">
                                  <Clock className="h-2.5 w-2.5" />
                                  {formatRelativeTime(ticket.fecha_registro)}
                                </span>
                              </div>
                            </div>

                            <p className="text-[13px] font-medium text-foreground leading-snug mb-2 line-clamp-2">
                              {ticket.asunto}
                            </p>

                            <div className="flex items-center justify-between pt-2 border-t border-border/40">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-[10px] text-muted-foreground bg-secondary/60 px-1.5 py-0.5 rounded truncate max-w-[90px]">
                                  {ticket.categoria_nombre}
                                </span>
                                <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5 whitespace-nowrap">
                                  <Calendar className="h-2.5 w-2.5" />
                                  {(() => { const d = parseFecha(ticket.fecha_registro); if (!d) return ''; const l = toLima(d); return `${String(l.getDate()).padStart(2,'0')}/${String(l.getMonth()+1).padStart(2,'0')}/${l.getFullYear()}`; })()}
                                </span>
                              </div>

                              {ticket.asignado_username ? (
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10">
                                  <User className="h-2.5 w-2.5 text-primary/70" />
                                  <span className="truncate max-w-[70px]">{ticket.asignado_username}</span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-muted-foreground/50 italic">Sin asignar</span>
                              )}
                            </div>

                            {isAdminCentral && ticket.empresa_nombre && (
                              <div className="mt-1.5 pt-1.5 border-t border-border/30">
                                <span className="flex items-center gap-1 text-[10px] text-muted-foreground/70">
                                  <Building2 className="h-2.5 w-2.5" /> {ticket.empresa_nombre}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {columnTickets.length === 0 && (
                        <div className={`h-28 flex flex-col items-center justify-center border-2 border-dashed rounded-lg text-xs transition-colors ${isDragOver ? 'border-primary/40 text-primary bg-primary/5' : 'border-border/60 text-muted-foreground/50'}`}>
                          <MessageSquare className="h-5 w-5 mb-1 opacity-40" />
                          Arrastra tickets aquí
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto bg-card">
              {tickets.map(ticket => {
                const isUpdating = String(updatingTicketId) === String(ticket.id);
                
                return (
                  <div
                    key={ticket.id}
                    onClick={() => !isUpdating && selectTicket(ticket)}
                    className={`px-4 py-3 border-b border-border transition-all
                      ${isUpdating ? 'opacity-50 pointer-events-none animate-pulse bg-secondary/20' : 'cursor-pointer hover:bg-secondary/50'} 
                      ${selectedTicket?.id === ticket.id && !isUpdating ? 'bg-secondary border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-mono font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded flex items-center gap-1">
                            {isUpdating && <Loader2 className="h-2.5 w-2.5 animate-spin text-primary" />}
                            {ticket.numero_ticket}
                          </span>
                          <PrioridadBadge nombre={ticket.prioridad_nombre} color={ticket.prioridad_color} />
                        </div>
                        <p className="text-sm font-medium text-foreground truncate pr-4">{ticket.asunto}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <EstadoBadge nombre={ticket.estado_nombre} color={ticket.estado_color} />
                          <span className="text-[11px] text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded-md">{ticket.categoria_nombre}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3"/> {formatRelativeTime(ticket.fecha_registro)}</span>
                        {ticket.asignado_username && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1 bg-primary/5 px-1.5 py-0.5 rounded-md border border-primary/10">
                            <User className="h-3 w-3 text-primary/70" />
                            {ticket.asignado_username}
                          </span>
                        )}
                      </div>
                    </div>
                    {isAdminCentral && (ticket.empresa_nombre || ticket.plataforma_nombre) && (
                      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/50">
                        {ticket.empresa_nombre && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                            <Building2 className="h-3 w-3" /> {ticket.empresa_nombre}
                          </span>
                        )}
                        {ticket.plataforma_nombre && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                            <Monitor className="h-3 w-3" /> {ticket.plataforma_nombre}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 py-4 border-t border-border bg-card sticky bottom-0">
                  <button disabled={pagination.page <= 1} onClick={() => loadTickets(pagination.page - 1)} className="px-3 py-1.5 text-xs font-medium bg-secondary hover:bg-secondary/80 rounded-md disabled:opacity-50 transition-colors">
                    Anterior
                  </button>
                  <span className="text-xs font-medium text-muted-foreground px-2">{pagination.page} de {pagination.totalPages}</span>
                  <button disabled={pagination.page >= pagination.totalPages} onClick={() => loadTickets(pagination.page + 1)} className="px-3 py-1.5 text-xs font-medium bg-secondary hover:bg-secondary/80 rounded-md disabled:opacity-50 transition-colors">
                    Siguiente
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL - Ticket Detail */}
      <div className={rightPanelClasses}>
        {selectedTicket ? (
          <>
            <div className="flex-shrink-0 px-5 py-4 border-b border-border bg-card shadow-sm z-10">
              <div className="flex items-start gap-3">
                <button
                  onClick={() => { setMobileShowDetail(false); setSelectedTicket(null); }}
                  className={`${viewMode === 'list' ? 'md:hidden' : 'flex lg:hidden'} p-1.5 -ml-2 rounded-md hover:bg-secondary transition-colors`}
                  title="Cerrar detalle"
                >
                  <ArrowLeft className="h-5 w-5 text-foreground" />
                </button>
                {(viewMode === 'kanban' || viewMode === 'table') && (
                  <button
                    onClick={() => { setMobileShowDetail(false); setSelectedTicket(null); }}
                    className="hidden lg:flex p-1.5 -ml-2 rounded-md hover:bg-secondary transition-colors"
                    title="Cerrar detalle"
                  >
                    <X className="h-5 w-5 text-foreground" />
                  </button>
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">{selectedTicket.numero_ticket}</span>
                      <EstadoBadge nombre={selectedTicket.estado_nombre} color={selectedTicket.estado_color} />
                      <PrioridadBadge nombre={selectedTicket.prioridad_nombre} color={selectedTicket.prioridad_color} />
                    </div>

                    {isAdminCentral && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="relative">
                          <button
                            onClick={() => { setShowEstadoDropdown(!showEstadoDropdown); setShowAsignarDropdown(false); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-secondary transition-colors"
                          >
                            Mover a... <ChevronDown className="h-3 w-3" />
                          </button>
                          {showEstadoDropdown && (
                            <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-xl z-20 min-w-[180px] overflow-hidden">
                              {catalogos.estados.map(e => (
                                <button key={e.id} onClick={() => handleChangeEstado(e.id)} className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary flex items-center gap-2 transition-colors border-b border-border/50 last:border-0">
                                  <Circle className="h-2.5 w-2.5" style={{ color: e.color, fill: e.color }} />
                                  {e.nombre}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="relative">
                          <button
                            onClick={() => { setShowAsignarDropdown(!showAsignarDropdown); setShowEstadoDropdown(false); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-primary/20 bg-primary/5 text-primary rounded-lg hover:bg-primary/10 transition-colors"
                          >
                            <User className="h-3.5 w-3.5" />
                            {selectedTicket.asignado_username ? 'Reasignar' : 'Asignar'} <ChevronDown className="h-3 w-3" />
                          </button>
                          {showAsignarDropdown && (
                            <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-xl z-20 min-w-[220px] max-h-[280px] overflow-y-auto">
                              <div className="px-3 py-2 border-b border-border bg-secondary/50">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Asignar a</span>
                              </div>
                              {usuarios.map(u => (
                                <button key={u.id} onClick={() => handleAssignUser(u.id)} className={`w-full text-left px-4 py-2.5 text-sm hover:bg-secondary flex items-center gap-2 transition-colors border-b border-border/30 last:border-0 ${selectedTicket.id_usuario_asignado == u.id ? 'bg-primary/10 text-primary font-medium' : ''}`}>
                                  <User className="h-4 w-4 opacity-70" />
                                  <span className="truncate">{u.username}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <h2 className="text-lg font-bold text-foreground leading-tight">{selectedTicket.asunto}</h2>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4 p-3 bg-secondary/30 rounded-lg border border-border">
                    <div>
                      <span className="block text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Categoría</span>
                      <span className="text-xs font-medium flex items-center gap-1.5"><Tag className="h-3 w-3 text-primary/70"/> {selectedTicket.categoria_nombre}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Reportado por</span>
                      <span className="text-xs font-medium flex items-center gap-1.5"><User className="h-3 w-3 text-primary/70"/> {selectedTicket.reporta_username || selectedTicket.usuario_externo_nombre || 'Externo'}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Asignado a</span>
                      <span className="text-xs font-medium flex items-center gap-1.5">
                        <User className="h-3 w-3 text-primary/70"/> 
                        {selectedTicket.asignado_username || <span className="text-muted-foreground italic">Sin asignar</span>}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Fecha</span>
                      <span className="text-xs font-medium flex items-center gap-1.5"><Calendar className="h-3 w-3 text-primary/70"/> {formatDateTime(selectedTicket.fecha_registro)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedTicket.descripcion && (
                <div className="mt-4 p-4 bg-secondary/50 rounded-xl text-sm text-foreground border border-border/50 shadow-inner">
                  <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                    <LayoutGrid className="h-3 w-3"/> Descripción original
                  </h4>
                  <p className="whitespace-pre-wrap leading-relaxed">{selectedTicket.descripcion}</p>
                </div>
              )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 bg-[url('/chat-bg-pattern.png')] bg-secondary/10 bg-repeat bg-fixed" onClick={() => { setShowEstadoDropdown(false); setShowAsignarDropdown(false); }}>
               {loadingComentarios ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              ) : timeline.length > 0 ? (
                <div className="space-y-4">
                  {timeline.map((item, idx) => {
                    if (item._type === 'historial') {
                      let text = '';
                      if (item.id_usuario_nuevo && item.id_usuario_nuevo !== item.id_usuario_anterior) {
                        text = `${item.username || 'Sistema'} asignó a ${item.usuario_nuevo_username || 'usuario'}`;
                      } else {
                        text = `${item.username || 'Sistema'} cambió estado a ${item.estado_nuevo_nombre || ''}`;
                      }
                      if (item.comentario && item.comentario !== 'Ticket creado' && item.comentario !== 'Usuario asignado') {
                        text += ` - ${item.comentario}`;
                      }
                      if (item.comentario === 'Ticket creado') {
                        text = `${item.username || 'Sistema'} creó el ticket`;
                      }
                      return (
                        <div key={`h-${item.id}`} className="flex justify-center my-4 relative">
                          <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-border/50"></div>
                          </div>
                          <div className="relative bg-background border border-border/50 rounded-full px-4 py-1.5 flex items-center gap-2 shadow-sm">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[11px] font-medium text-muted-foreground">{text}</span>
                            <span className="text-[10px] text-muted-foreground/50 ml-1">{formatRelativeTime(item._date)}</span>
                          </div>
                        </div>
                      );
                    }

                    const isOwn = item.id_usuario == userId;
                    const isInternalNote = item.es_interno;

                    return (
                      <div key={`c-${item.id}`} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-3 max-w-[80%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white mt-auto shadow-sm ${isOwn ? 'bg-primary' : 'bg-slate-400'}`}>
                            {(item.username || item.usuario_externo_nombre || '?')[0].toUpperCase()}
                          </div>

                          <div className={`rounded-2xl px-5 py-3 shadow-sm relative ${isInternalNote ? 'bg-amber-50 border border-amber-200 rounded-bl-sm' : isOwn ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card border border-border rounded-bl-sm'}`}>
                            <div className="flex items-center gap-2 mb-1.5">
                              {isInternalNote && <Lock className="h-3 w-3 text-amber-600" />}
                              <span className={`text-[12px] font-semibold ${isInternalNote ? 'text-amber-700' : isOwn ? 'text-primary-foreground/90' : 'text-primary'}`}>
                                {item.username || item.usuario_externo_nombre}
                              </span>
                              {isInternalNote && <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 font-semibold uppercase tracking-wider">Interno</span>}
                            </div>

                            {item.adjuntos && item.adjuntos.length > 0 && (
                              <div className="mb-2 space-y-2">
                                {item.adjuntos.map(adj => {
                                  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(adj.nombre_original) || adj.tipo_archivo?.startsWith('image/');
                                  return isImage ? (
                                    <a key={adj.id} href={adj.ruta_archivo} target="_blank" rel="noopener noreferrer" className="block border border-black/10 rounded-lg overflow-hidden bg-white/50">
                                      <img src={adj.ruta_archivo} alt={adj.nombre_original} className="max-w-full max-h-[300px] object-contain hover:opacity-90 transition-opacity" />
                                    </a>
                                  ) : (
                                    <a key={adj.id} href={adj.ruta_archivo} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors border ${isOwn ? 'bg-white/10 hover:bg-white/20 border-white/20' : 'bg-secondary hover:bg-secondary/80 border-border'}`}>
                                      <Paperclip className={`h-4 w-4 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`} />
                                      <span className={`text-xs underline truncate font-medium ${isOwn ? 'text-primary-foreground' : 'text-primary'}`}>{adj.nombre_original}</span>
                                    </a>
                                  );
                                })}
                              </div>
                            )}

                            {item.contenido && (
                              <p className={`text-[14px] leading-relaxed whitespace-pre-wrap break-words ${isInternalNote ? 'text-amber-900' : isOwn ? 'text-primary-foreground' : 'text-foreground'}`}>
                                {item.contenido}
                              </p>
                            )}

                            <div className="flex justify-end mt-2 pt-1 border-t border-black/5">
                              <span className={`text-[10px] font-medium ${isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground/70'}`}>{formatDateTime(item._date)}</span>
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
                  <MessageSquare className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-sm">Inicia la conversación agregando un comentario</p>
                </div>
              )}
            </div>

            <div className="flex-shrink-0 px-5 py-4 border-t border-border bg-card shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.05)] relative z-20">
              {selectedFiles.length > 0 && (
                <div className="flex gap-2 mb-3 flex-wrap bg-secondary/50 p-2 rounded-lg border border-border">
                  {selectedFiles.map((file, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-background border border-border shadow-sm rounded-md text-xs font-medium">
                      <Paperclip className="h-3 w-3 text-primary" />
                      <span className="truncate max-w-[150px]">{file.name}</span>
                      <button type="button" onClick={() => removeFile(i)} className="ml-1 p-0.5 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              )}

              {isAdminCentral && (
                <div className="flex items-center gap-2 mb-2">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground select-none">
                    <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} className="rounded border-border text-amber-500 focus:ring-amber-500 h-3.5 w-3.5" />
                    <Lock className={`h-3 w-3 ${isInternal ? 'text-amber-500' : ''}`} />
                    Nota Interna (Solo administradores)
                  </label>
                </div>
              )}

              <form onSubmit={handleSendComment} className="flex items-end gap-2">
                <input ref={fileInputRef} type="file" className="hidden" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip" multiple onChange={handleFileSelect} />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="h-11 w-11 flex-shrink-0 flex items-center justify-center rounded-xl bg-secondary hover:bg-secondary/80 border border-border transition-colors text-muted-foreground hover:text-foreground">
                  <Paperclip className="h-5 w-5" />
                </button>
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={isInternal ? "Escribe una nota interna confidencial..." : "Responde al ticket..."}
                    disabled={sendingComment}
                    rows={1}
                    onInput={(e) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = (e.target.scrollHeight < 120 ? e.target.scrollHeight : 120) + 'px';
                    }}
                    className={`w-full py-3 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none overflow-y-auto disabled:opacity-50 transition-colors border ${isInternal ? 'bg-amber-50/50 border-amber-200 placeholder-amber-400 focus:border-amber-400' : 'bg-background border-border text-foreground placeholder-muted-foreground'}`}
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                  />
                </div>
                <button type="submit" disabled={sendingComment || (!newComment.trim() && selectedFiles.length === 0)} className="h-11 w-11 flex-shrink-0 flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:opacity-90 shadow-sm transition-opacity disabled:opacity-50 disabled:shadow-none">
                  {sendingComment ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 ml-0.5" />}
                </button>
              </form>
            </div>
          </>
        ) : (
          viewMode === 'list' && ( 
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-secondary/5">
              <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4 border border-border shadow-sm">
                <LayoutGrid className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">Detalle del Ticket</h3>
              <p className="text-sm">Selecciona un ticket en el panel lateral para ver más información</p>
            </div>
          )
        )}
      </div>

      {/* MODAL AUDITORÍA */}
      {showAuditModal && (() => {
        const auditItems = getAuditFiltered();
        const totalCreaciones = auditItems.filter(h => (h.comentario || '').startsWith('Ticket creado')).length;
        const totalReasignaciones = auditItems.filter(h => h.comentario !== 'Ticket creado' && h.id_usuario_nuevo != null && String(h.id_usuario_nuevo) !== String(h.id_usuario_anterior ?? '')).length;
        const totalEstados = auditItems.length - totalCreaciones - totalReasignaciones;

        return (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-3xl border border-border flex flex-col" style={{ maxHeight: '92vh' }}>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Actividad del Equipo</h3>
                    <p className="text-[11px] text-muted-foreground">Historial de cambios en tickets</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportAudit}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-foreground rounded-lg text-xs font-medium hover:bg-secondary/80 transition-colors border border-border"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Exportar Excel
                  </button>
                  <button onClick={() => setShowAuditModal(false)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Filtros */}
              <div className="px-6 py-3 border-b border-border bg-secondary/10 flex-shrink-0">
                <div className="flex gap-2 flex-wrap items-center">
                  <div className="relative flex-1 min-w-[160px]">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Buscar ticket o asunto..."
                      value={auditFilterTicket}
                      onChange={(e) => setAuditFilterTicket(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-background rounded-lg border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <select
                    value={auditFilterUsuario}
                    onChange={(e) => setAuditFilterUsuario(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-background rounded-lg border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Todos los usuarios</option>
                    {usuarios.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                  </select>
                  <input
                    type="date"
                    value={auditFilterFechaDesde}
                    onChange={(e) => setAuditFilterFechaDesde(e.target.value)}
                    title="Desde"
                    className="px-3 py-1.5 text-xs bg-background rounded-lg border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <span className="text-xs text-muted-foreground">—</span>
                  <input
                    type="date"
                    value={auditFilterFechaHasta}
                    onChange={(e) => setAuditFilterFechaHasta(e.target.value)}
                    title="Hasta"
                    className="px-3 py-1.5 text-xs bg-background rounded-lg border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    onClick={handleApplyAuditFilters}
                    disabled={loadingAudit}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3 w-3 ${loadingAudit ? 'animate-spin' : ''}`} />
                    Buscar
                  </button>
                  {(auditFilterUsuario || auditFilterFechaDesde || auditFilterFechaHasta || auditFilterTicket) && (
                    <button
                      onClick={() => {
                        setAuditFilterUsuario('');
                        setAuditFilterFechaDesde('');
                        setAuditFilterFechaHasta('');
                        setAuditFilterTicket('');
                        loadAudit({ usuario: '', desde: '', hasta: '', ticket: '' });
                      }}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                    >
                      <X className="h-3 w-3" /> Limpiar
                    </button>
                  )}
                </div>
              </div>

              {/* Stats rápidas */}
              {!loadingAudit && auditItems.length > 0 && (
                <div className="flex gap-3 px-6 py-2.5 border-b border-border bg-secondary/5 flex-shrink-0">
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0"></span>
                    <span className="text-muted-foreground">{totalCreaciones} creaciones</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-purple-500 flex-shrink-0"></span>
                    <span className="text-muted-foreground">{totalReasignaciones} reasignaciones</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"></span>
                    <span className="text-muted-foreground">{totalEstados} cambios de estado</span>
                  </div>
                  <span className="ml-auto text-xs text-muted-foreground font-medium">{auditItems.length} registros</span>
                </div>
              )}

              {/* Feed de actividad */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {loadingAudit ? (
                  <div className="flex flex-col items-center justify-center h-48 gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">Cargando actividad...</span>
                  </div>
                ) : auditItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                    <Activity className="h-10 w-10 mb-2 opacity-20" />
                    <p className="text-sm font-medium">Sin registros</p>
                    <p className="text-xs">Ajusta los filtros e intenta de nuevo</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {auditItems.map((h, i) => {
                      const esCreacion = h.comentario === 'Ticket creado' || (h.comentario || '').startsWith('Ticket creado por');
                      const esReasignacion = !esCreacion && h.id_usuario_nuevo != null && String(h.id_usuario_nuevo) !== String(h.id_usuario_anterior ?? '');

                      // Si no hay username, es externo — el nombre viene dentro del comentario "Ticket creado por X (externo)"
                      const nombreExterno = !h.username && h.comentario
                        ? (h.comentario.match(/Ticket creado por (.+?) \(externo\)/)?.[1] || null)
                        : null;
                      const quien = h.username || nombreExterno || 'Sistema';
                      const ticket = h.numero_ticket || `#${h.id_ticket_soporte}`;
                      const asunto = h.asunto || '';

                      // Colores por tipo
                      const dotColor = esCreacion ? 'bg-blue-500' : esReasignacion ? 'bg-purple-500' : 'bg-amber-500';
                      const avatarBg = esCreacion ? 'bg-blue-100 text-blue-700' : esReasignacion ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700';
                      const tagBg = esCreacion ? 'bg-blue-50 text-blue-600 border-blue-200' : esReasignacion ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-amber-50 text-amber-600 border-amber-200';
                      const tagLabel = esCreacion ? 'Creación' : esReasignacion ? 'Reasignación' : 'Cambio de estado';

                      // Frase de actividad
                      let descripcion = null;
                      if (esCreacion) {
                        descripcion = (
                          <span>creó el ticket <span className="font-semibold text-foreground">{ticket}</span></span>
                        );
                      } else if (esReasignacion) {
                        descripcion = (
                          <span>
                            asignó <span className="font-semibold text-foreground">{ticket}</span> a{' '}
                            <span className="font-semibold text-purple-700">{h.usuario_nuevo_username || '—'}</span>
                            {h.usuario_anterior_username ? <span className="text-muted-foreground"> (antes: {h.usuario_anterior_username})</span> : null}
                          </span>
                        );
                      } else {
                        descripcion = (
                          <span>
                            cambió estado de <span className="font-semibold text-foreground">{ticket}</span>
                            {h.estado_anterior_nombre ? <span className="text-muted-foreground"> de <span className="font-medium text-foreground">{h.estado_anterior_nombre}</span></span> : null}
                            {h.estado_nuevo_nombre ? <span> → <span className="font-semibold text-green-700">{h.estado_nuevo_nombre}</span></span> : null}
                          </span>
                        );
                      }

                      return (
                        <div key={h.id} className="flex gap-3 py-2.5 px-3 rounded-xl hover:bg-secondary/40 transition-colors group">
                          {/* Avatar */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarBg}`}>
                            {quien[0].toUpperCase()}
                          </div>

                          {/* Contenido */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-muted-foreground leading-snug">
                                  <span className="font-semibold text-foreground">{quien}</span>{' '}
                                  {descripcion}
                                </p>
                                {asunto && (
                                  <p className="text-[11px] text-muted-foreground/70 mt-0.5 truncate" title={asunto}>{asunto}</p>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${tagBg}`}>{tagLabel}</span>
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatDateTime(h.fecha_registro)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {showCreateModal && (
         <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
           <div className="bg-card rounded-xl shadow-xl w-full max-w-lg border border-border">
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
                   className="w-full px-3 py-2 bg-secondary/50 rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 border border-border"
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
                   className="w-full px-3 py-2 bg-secondary/50 rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 border border-border resize-none"
                 />
               </div>
               <div className="grid grid-cols-2 gap-3">
                 <div>
                   <label className="block text-sm font-medium text-foreground mb-1">Categoria *</label>
                   <select
                     value={createForm.id_categoria_soporte}
                     onChange={(e) => setCreateForm({ ...createForm, id_categoria_soporte: e.target.value })}
                     required
                     className="w-full px-3 py-2 bg-secondary/50 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 border border-border"
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
                     className="w-full px-3 py-2 bg-secondary/50 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 border border-border"
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

      {/* MODAL EXPORTAR CON PREVIEW */}
      {showExportModal && exportPreview && (() => {
        const { filtered, catMap, empMap, estadoMap, chartCat, chartEstado, chartDias } = exportPreview;
        const tabs = [
          { id: 'datos', label: 'Datos', icon: List },
          { id: 'resumen', label: 'Resúmenes', icon: LayoutGrid },
          { id: 'graficas', label: 'Gráficas', icon: Activity },
        ];
        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-3">
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-6xl border border-border flex flex-col" style={{ maxHeight: '94vh' }}>

              {/* Header con filtros */}
              <div className="flex-shrink-0 px-5 py-3 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Download className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Exportar Reporte</h3>
                      <p className="text-[11px] text-muted-foreground">{filtered.length} tickets para exportar</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setExportFilters({ empresa: '', categoria: '', prioridad: '', estado: '', fechaDesde: '', fechaHasta: '' }); }} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 px-2 py-1 rounded-md hover:bg-secondary">
                      <RefreshCw className="h-3 w-3" /> Limpiar
                    </button>
                    <button onClick={handleExportExcel} disabled={exporting} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm">
                      {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      {exporting ? 'Generando...' : 'Exportar Excel'}
                    </button>
                    <button onClick={() => setShowExportModal(false)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                {/* Filtros en una fila */}
                <div className="flex gap-2 flex-wrap items-end">
                  {isAdminCentral && catalogos.empresas?.length > 0 && (
                    <div className="min-w-[140px]">
                      <label className="block text-[10px] font-medium text-muted-foreground mb-0.5 uppercase tracking-wider">Empresa</label>
                      <select value={exportFilters.empresa} onChange={(e) => setExportFilters(p => ({ ...p, empresa: e.target.value }))} className="w-full px-2 py-1.5 text-xs bg-secondary rounded-md border border-border focus:outline-none focus:ring-1 focus:ring-primary/50">
                        <option value="">Todas</option>
                        {(catalogos.empresas || []).map(e => <option key={`${e.id}_${e.id_plataforma}`} value={e.razon_social}>{e.razon_social}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="min-w-[120px]">
                    <label className="block text-[10px] font-medium text-muted-foreground mb-0.5 uppercase tracking-wider">Categoría</label>
                    <select value={exportFilters.categoria} onChange={(e) => setExportFilters(p => ({ ...p, categoria: e.target.value }))} className="w-full px-2 py-1.5 text-xs bg-secondary rounded-md border border-border focus:outline-none focus:ring-1 focus:ring-primary/50">
                      <option value="">Todas</option>
                      {catalogos.categorias.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                    </select>
                  </div>
                  <div className="min-w-[100px]">
                    <label className="block text-[10px] font-medium text-muted-foreground mb-0.5 uppercase tracking-wider">Prioridad</label>
                    <select value={exportFilters.prioridad} onChange={(e) => setExportFilters(p => ({ ...p, prioridad: e.target.value }))} className="w-full px-2 py-1.5 text-xs bg-secondary rounded-md border border-border focus:outline-none focus:ring-1 focus:ring-primary/50">
                      <option value="">Todas</option>
                      {catalogos.prioridades.map(p => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                    </select>
                  </div>
                  <div className="min-w-[120px]">
                    <label className="block text-[10px] font-medium text-muted-foreground mb-0.5 uppercase tracking-wider">Estado</label>
                    <select value={exportFilters.estado} onChange={(e) => setExportFilters(p => ({ ...p, estado: e.target.value }))} className="w-full px-2 py-1.5 text-xs bg-secondary rounded-md border border-border focus:outline-none focus:ring-1 focus:ring-primary/50">
                      <option value="">Todos</option>
                      {catalogos.estados.map(e => <option key={e.id} value={e.nombre}>{e.nombre}</option>)}
                    </select>
                  </div>
                  <div className="min-w-[120px]">
                    <label className="block text-[10px] font-medium text-muted-foreground mb-0.5 uppercase tracking-wider">Desde</label>
                    <input type="date" value={exportFilters.fechaDesde} onChange={(e) => setExportFilters(p => ({ ...p, fechaDesde: e.target.value }))} className="w-full px-2 py-1.5 text-xs bg-secondary rounded-md border border-border focus:outline-none focus:ring-1 focus:ring-primary/50" />
                  </div>
                  <div className="min-w-[120px]">
                    <label className="block text-[10px] font-medium text-muted-foreground mb-0.5 uppercase tracking-wider">Hasta</label>
                    <input type="date" value={exportFilters.fechaHasta} onChange={(e) => setExportFilters(p => ({ ...p, fechaHasta: e.target.value }))} className="w-full px-2 py-1.5 text-xs bg-secondary rounded-md border border-border focus:outline-none focus:ring-1 focus:ring-primary/50" />
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex-shrink-0 flex border-b border-border bg-secondary/10 px-5">
                {tabs.map(tab => (
                  <button key={tab.id} onClick={() => setExportTab(tab.id)} className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors -mb-px ${exportTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Contenido */}
              <div className="flex-1 overflow-y-auto">

                {/* TAB: Datos */}
                {exportTab === 'datos' && (
                  <div className="p-4">
                    {filtered.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                        <MessageSquare className="h-10 w-10 mb-2 opacity-30" />
                        <p className="text-sm">No hay tickets con estos filtros</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-border rounded-lg">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-secondary/80">
                              <th className="px-3 py-2 text-left font-semibold text-foreground">Número</th>
                              <th className="px-3 py-2 text-left font-semibold text-foreground">Fecha Creación</th>
                              <th className="px-3 py-2 text-left font-semibold text-foreground">Asunto</th>
                              <th className="px-3 py-2 text-left font-semibold text-foreground">Categoría</th>
                              <th className="px-3 py-2 text-left font-semibold text-foreground">Prioridad</th>
                              <th className="px-3 py-2 text-left font-semibold text-foreground">Estado</th>
                              <th className="px-3 py-2 text-left font-semibold text-foreground">Asignado</th>
                              <th className="px-3 py-2 text-left font-semibold text-foreground">Empresa</th>
                              <th className="px-3 py-2 text-right font-semibold text-foreground">Días</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filtered.map(t => {
                              const fc = parseFecha(t.fecha_registro);
                              const fr = parseFecha(t.fecha_resolucion);
                              const dias = fc && fr ? Math.ceil((fr - fc) / 86400000) : fc ? Math.ceil((new Date() - fc) / 86400000) : '';
                              return (
                                <tr key={t.id} className="border-t border-border/50 hover:bg-secondary/30 transition-colors">
                                  <td className="px-3 py-2 font-mono text-muted-foreground">{t.numero_ticket}</td>
                                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{formatDateTimeLima(t.fecha_registro)}</td>
                                  <td className="px-3 py-2 font-medium text-foreground max-w-[250px] truncate">{t.asunto}</td>
                                  <td className="px-3 py-2 text-muted-foreground">{t.categoria_nombre}</td>
                                  <td className="px-3 py-2"><PrioridadBadge nombre={t.prioridad_nombre} color={t.prioridad_color} /></td>
                                  <td className="px-3 py-2"><EstadoBadge nombre={t.estado_nombre} color={t.estado_color} /></td>
                                  <td className="px-3 py-2 text-muted-foreground">{t.asignado_username || '—'}</td>
                                  <td className="px-3 py-2 text-muted-foreground">{t.empresa_nombre || '—'}</td>
                                  <td className="px-3 py-2 text-right font-medium">
                                    <span className={fr ? 'text-green-600' : 'text-amber-600'}>{dias}{!fr && dias ? 'd' : ''}</span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: Resúmenes */}
                {exportTab === 'resumen' && (
                  <div className="p-4 space-y-5">
                    {/* Por Categoría */}
                    <div>
                      <h4 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider flex items-center gap-1.5"><Tag className="h-3.5 w-3.5 text-primary" /> Por Categoría</h4>
                      <div className="overflow-x-auto border border-border rounded-lg">
                        <table className="w-full text-xs">
                          <thead><tr className="bg-secondary/80">
                            <th className="px-3 py-2 text-left font-semibold">Categoría</th>
                            <th className="px-3 py-2 text-right font-semibold">Total</th>
                            <th className="px-3 py-2 text-right font-semibold">Resueltos</th>
                            <th className="px-3 py-2 text-right font-semibold">Pendientes</th>
                            <th className="px-3 py-2 text-right font-semibold">% Resolución</th>
                            <th className="px-3 py-2 text-right font-semibold">Prom. Días</th>
                          </tr></thead>
                          <tbody>
                            {Object.entries(catMap).sort((a, b) => b[1].total - a[1].total).map(([cat, d]) => (
                              <tr key={cat} className="border-t border-border/50 hover:bg-secondary/30">
                                <td className="px-3 py-2 font-medium">{cat}</td>
                                <td className="px-3 py-2 text-right">{d.total}</td>
                                <td className="px-3 py-2 text-right text-green-600">{d.resueltos}</td>
                                <td className="px-3 py-2 text-right text-amber-600">{d.total - d.resueltos}</td>
                                <td className="px-3 py-2 text-right font-medium">{d.total > 0 ? Math.round((d.resueltos / d.total) * 100) : 0}%</td>
                                <td className="px-3 py-2 text-right">{d.diasCount > 0 ? Math.round(d.diasSum / d.diasCount) + 'd' : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Por Empresa */}
                    <div>
                      <h4 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-primary" /> Por Empresa</h4>
                      <div className="overflow-x-auto border border-border rounded-lg">
                        <table className="w-full text-xs">
                          <thead><tr className="bg-secondary/80">
                            <th className="px-3 py-2 text-left font-semibold">Empresa</th>
                            <th className="px-3 py-2 text-right font-semibold">Total</th>
                            <th className="px-3 py-2 text-right font-semibold">Resueltos</th>
                            <th className="px-3 py-2 text-right font-semibold">Pendientes</th>
                            <th className="px-3 py-2 text-right font-semibold">% Resolución</th>
                            <th className="px-3 py-2 text-right font-semibold">Prom. Días</th>
                          </tr></thead>
                          <tbody>
                            {Object.entries(empMap).sort((a, b) => b[1].total - a[1].total).map(([emp, d]) => (
                              <tr key={emp} className="border-t border-border/50 hover:bg-secondary/30">
                                <td className="px-3 py-2 font-medium">{emp}</td>
                                <td className="px-3 py-2 text-right">{d.total}</td>
                                <td className="px-3 py-2 text-right text-green-600">{d.resueltos}</td>
                                <td className="px-3 py-2 text-right text-amber-600">{d.total - d.resueltos}</td>
                                <td className="px-3 py-2 text-right font-medium">{d.total > 0 ? Math.round((d.resueltos / d.total) * 100) : 0}%</td>
                                <td className="px-3 py-2 text-right">{d.diasCount > 0 ? Math.round(d.diasSum / d.diasCount) + 'd' : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Por Estado */}
                    <div>
                      <h4 className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wider flex items-center gap-1.5"><Circle className="h-3.5 w-3.5 text-primary" /> Por Estado</h4>
                      <div className="flex gap-3 flex-wrap">
                        {Object.entries(estadoMap).map(([est, count]) => {
                          const found = (catalogos.estados || []).find(s => s.nombre === est);
                          return (
                            <div key={est} className="flex items-center gap-2 px-4 py-3 rounded-lg border border-border bg-secondary/20 min-w-[140px]">
                              <Circle className="h-3 w-3 flex-shrink-0" style={{ fill: found?.color || '#6B7280', color: found?.color || '#6B7280' }} />
                              <div>
                                <p className="text-xs font-medium text-foreground">{est}</p>
                                <p className="text-lg font-bold text-foreground">{count}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: Gráficas */}
                {exportTab === 'graficas' && (
                  <div className="p-4 space-y-6">
                    {filtered.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                        <Activity className="h-10 w-10 mb-2 opacity-30" />
                        <p className="text-sm">No hay datos para graficar</p>
                      </div>
                    ) : (
                      <>
                        {chartCat && (
                          <div className="border border-border rounded-xl p-3 bg-white">
                            <img src={chartCat} alt="Tickets por Categoría" className="w-full max-w-[900px] mx-auto" />
                          </div>
                        )}
                        {chartEstado && (
                          <div className="border border-border rounded-xl p-3 bg-white">
                            <img src={chartEstado} alt="Distribución por Estado" className="w-full max-w-[800px] mx-auto" />
                          </div>
                        )}
                        {chartDias && (
                          <div className="border border-border rounded-xl p-3 bg-white">
                            <img src={chartDias} alt="Promedio Días de Resolución" className="w-full max-w-[900px] mx-auto" />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}