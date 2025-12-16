'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import * as XLSX from 'xlsx';

// Mapeo de nombres de colores a códigos hex
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

// Rangos de fecha predefinidos
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
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [leadsRes, estadosRes, tipificacionesRes] = await Promise.all([
        apiClient.get('/crm/leads'),
        apiClient.get('/crm/estados'),
        apiClient.get('/crm/tipificaciones')
      ]);
      setLeads(leadsRes.data || []);
      setEstados(estadosRes.data || []);
      setTipificaciones(tipificacionesRes.data || []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular fecha desde según el rango seleccionado
  const getDateRangeFilter = () => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    let fromDate = null;
    let toDate = new Date(now);

    switch (dateRange) {
      case 'today':
        fromDate = new Date(now);
        fromDate.setHours(0, 0, 0, 0);
        break;
      case '7d':
        fromDate = new Date(now);
        fromDate.setDate(fromDate.getDate() - 7);
        break;
      case '1m':
        fromDate = new Date(now);
        fromDate.setMonth(fromDate.getMonth() - 1);
        break;
      case '3m':
        fromDate = new Date(now);
        fromDate.setMonth(fromDate.getMonth() - 3);
        break;
      case '6m':
        fromDate = new Date(now);
        fromDate.setMonth(fromDate.getMonth() - 6);
        break;
      case '12m':
        fromDate = new Date(now);
        fromDate.setFullYear(fromDate.getFullYear() - 1);
        break;
      case 'custom':
        if (dateFrom) fromDate = new Date(dateFrom + 'T00:00:00');
        if (dateTo) toDate = new Date(dateTo + 'T23:59:59');
        break;
      default:
        return { fromDate: null, toDate: null };
    }

    return { fromDate, toDate };
  };

  const filteredLeads = leads.filter(lead => {
    // Filtro de búsqueda
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || (
      (lead.nombre_completo && lead.nombre_completo.toLowerCase().includes(searchLower)) ||
      (lead.celular && lead.celular.includes(searchTerm)) ||
      (lead.dni && lead.dni.includes(searchTerm)) ||
      (lead.contacto_celular && lead.contacto_celular.includes(searchTerm))
    );

    // Filtro de fecha
    const { fromDate, toDate } = getDateRangeFilter();
    let matchesDate = true;

    if (fromDate || toDate) {
      const leadDate = new Date(lead.created_at);
      if (fromDate && leadDate < fromDate) matchesDate = false;
      if (toDate && leadDate > toDate) matchesDate = false;
    }

    // Filtro de estado
    const matchesEstado = !selectedEstado || lead.id_estado === parseInt(selectedEstado);

    // Filtro de tipificación
    const matchesTipificacion = !selectedTipificacion || lead.id_tipificacion === parseInt(selectedTipificacion);

    return matchesSearch && matchesDate && matchesEstado && matchesTipificacion;
  });

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDateRangeChange = (value) => {
    setDateRange(value);
    if (value !== 'custom') {
      setDateFrom('');
      setDateTo('');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateRange('all');
    setDateFrom('');
    setDateTo('');
    setSelectedEstado('');
    setSelectedTipificacion('');
    setCurrentPage(1);
  };

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateRange, dateFrom, dateTo, selectedEstado, selectedTipificacion]);

  const hasActiveFilters = searchTerm || dateRange !== 'all' || selectedEstado || selectedTipificacion;

  const handleExportExcel = () => {
    const dataToExport = filteredLeads.map(lead => ({
      'ID': lead.id,
      'Nombre': lead.nombre_completo || '',
      'DNI': lead.dni || '',
      'Celular': lead.celular || lead.contacto_celular || '',
      'Direccion': lead.direccion || '',
      'Estado': lead.estado_nombre || '',
      'Proveedor': lead.proveedor_nombre || '',
      'Plan': lead.plan_nombre || '',
      'Tipificacion': lead.tipificacion_nombre || '',
      'Fecha Registro': lead.created_at ? new Date(lead.created_at).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : ''
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');

    const colWidths = [
      { wch: 6 },   // ID
      { wch: 30 },  // Nombre
      { wch: 12 },  // DNI
      { wch: 15 },  // Celular
      { wch: 40 },  // Direccion
      { wch: 15 },  // Estado
      { wch: 15 },  // Proveedor
      { wch: 20 },  // Plan
      { wch: 20 },  // Tipificacion
      { wch: 20 },  // Fecha Registro
    ];
    ws['!cols'] = colWidths;

    const fileName = hasActiveFilters
      ? `leads_filtrados_${new Date().toISOString().slice(0, 10)}.xlsx`
      : `leads_todos_${new Date().toISOString().slice(0, 10)}.xlsx`;

    XLSX.writeFile(wb, fileName);
  };

  // Calcular paginación
  const totalPages = Math.ceil(filteredLeads.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-600 mt-1">Gestiona los prospectos del sistema</p>
        </div>
        <button
          onClick={handleExportExcel}
          disabled={filteredLeads.length === 0}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Exportar Excel</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Búsqueda */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Nombre, celular o DNI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              />
              <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Rango de fecha */}
          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Periodo</label>
            <select
              value={dateRange}
              onChange={(e) => handleDateRangeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            >
              {DATE_RANGES.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro de Estado */}
          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Todos</option>
              {estados.map((estado) => (
                <option key={estado.id} value={estado.id}>
                  {estado.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro de Tipificación */}
          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipificacion</label>
            <select
              value={selectedTipificacion}
              onChange={(e) => setSelectedTipificacion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Todas</option>
              {tipificaciones.map((tip) => (
                <option key={tip.id} value={tip.id}>
                  {tip.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Fechas personalizadas */}
          {dateRange === 'custom' && (
            <>
              <div className="min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="min-w-[150px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </>
          )}

          {/* Botón limpiar */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Limpiar</span>
            </button>
          )}
        </div>

        {/* Indicador de filtros activos */}
        {hasActiveFilters && (
          <div className="mt-3 pt-3 border-t border-gray-200 flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span>
              Mostrando {filteredLeads.length} de {leads.length} leads
              {dateRange !== 'all' && dateRange !== 'custom' && ` (${DATE_RANGES.find(r => r.value === dateRange)?.label})`}
              {dateRange === 'custom' && dateFrom && dateTo && ` (${dateFrom} - ${dateTo})`}
            </span>
          </div>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Leads</p>
          <p className="text-2xl font-bold text-gray-900">{filteredLeads.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Con datos completos</p>
          <p className="text-2xl font-bold text-green-600">
            {filteredLeads.filter(l => l.nombre_completo && l.dni).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Sin datos</p>
          <p className="text-2xl font-bold text-yellow-600">
            {filteredLeads.filter(l => !l.nombre_completo).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Con plan asignado</p>
          <p className="text-2xl font-bold text-blue-600">
            {filteredLeads.filter(l => l.id_plan).length}
          </p>
        </div>
      </div>

      {/* Tabla de leads */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DNI</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Celular</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipificacion</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    #{lead.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {lead.nombre_completo || <span className="text-gray-400 italic">Sin nombre</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lead.dni || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lead.celular || lead.contacto_celular || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {lead.estado_nombre ? (
                      <span
                        className="px-3 py-1 text-xs font-semibold rounded-full text-white"
                        style={{
                          backgroundColor: getColorHex(lead.estado_color)
                        }}
                      >
                        {lead.estado_nombre}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lead.proveedor_nombre || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lead.plan_nombre || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {lead.tipificacion_nombre ? (
                      <span
                        className="px-3 py-1 text-xs font-semibold rounded-full text-white"
                        style={{
                          backgroundColor: getColorHex(lead.tipificacion_color)
                        }}
                      >
                        {lead.tipificacion_nombre}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(lead.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {paginatedLeads.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {hasActiveFilters ? 'No se encontraron leads con los filtros aplicados' : 'No hay leads registrados'}
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Mostrando {startIndex + 1} - {Math.min(endIndex, filteredLeads.length)} de {filteredLeads.length} registros
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Números de página */}
              {(() => {
                const pages = [];
                const maxVisiblePages = 5;
                let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                if (endPage - startPage + 1 < maxVisiblePages) {
                  startPage = Math.max(1, endPage - maxVisiblePages + 1);
                }

                for (let i = startPage; i <= endPage; i++) {
                  pages.push(
                    <button
                      key={i}
                      onClick={() => goToPage(i)}
                      className={`px-3 py-1 text-sm border rounded ${
                        currentPage === i
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {i}
                    </button>
                  );
                }
                return pages;
              })()}

              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
