'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';

const FUNNEL_COLORS = ['#3B82F6', '#22C55E', '#EAB308'];

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

export default function ReportesPage() {
  const [funnelData, setFunnelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Calcular fechas segun el rango seleccionado
  const getDateParams = useCallback(() => {
    const now = new Date();
    let fromDate = null;
    let toDate = now.toISOString().split('T')[0];

    switch (dateRange) {
      case 'today':
        fromDate = toDate;
        break;
      case '7d':
        fromDate = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
        break;
      case '1m':
        fromDate = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
        break;
      case '3m':
        fromDate = new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0];
        break;
      case '6m':
        fromDate = new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0];
        break;
      case '12m':
        fromDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0];
        break;
      case 'custom':
        fromDate = dateFrom || null;
        toDate = dateTo || new Date().toISOString().split('T')[0];
        break;
      default:
        return {};
    }

    const params = {};
    if (fromDate) params.dateFrom = fromDate;
    if (toDate && dateRange !== 'all') params.dateTo = toDate;
    return params;
  }, [dateRange, dateFrom, dateTo]);

  const loadFunnelData = useCallback(async () => {
    try {
      setLoading(true);
      const params = getDateParams();
      const queryString = new URLSearchParams(params).toString();
      const url = queryString ? `/crm/reportes/funnel?${queryString}` : '/crm/reportes/funnel';
      const response = await apiClient.get(url);
      setFunnelData(response.data);
    } catch (error) {
      console.error('Error al cargar datos del embudo:', error);
    } finally {
      setLoading(false);
    }
  }, [getDateParams]);

  useEffect(() => {
    loadFunnelData();
  }, [loadFunnelData]);

  const handleDateRangeChange = (value) => {
    setDateRange(value);
    if (value !== 'custom') {
      setDateFrom('');
      setDateTo('');
    }
  };

  const clearFilters = () => {
    setDateRange('all');
    setDateFrom('');
    setDateTo('');
  };

  const hasActiveFilters = dateRange !== 'all';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const funnelStages = funnelData ? [
    funnelData.totalLeads,
    funnelData.contactados,
    funnelData.interesados
  ] : [];

  const maxValue = funnelStages.length > 0 ? funnelStages[0].valor : 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        <p className="text-gray-600 mt-1">Visualiza el rendimiento del proceso de ventas</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Rango de fecha */}
          <div className="min-w-[180px]">
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

          {/* Botón actualizar */}
          <button
            onClick={loadFunnelData}
            className="flex items-center space-x-2 px-4 py-2 text-sm text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Actualizar</span>
          </button>
        </div>

        {/* Indicador de filtros activos */}
        {hasActiveFilters && (
          <div className="mt-3 pt-3 border-t border-gray-200 flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span>
              Filtro aplicado: {DATE_RANGES.find(r => r.value === dateRange)?.label}
              {dateRange === 'custom' && dateFrom && dateTo && ` (${dateFrom} - ${dateTo})`}
            </span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Embudo de Ventas</h2>
        </div>

        {funnelData && (
          <div className="space-y-6">
            {/* Funnel Chart */}
            <div className="flex flex-col items-center py-8">
              {funnelStages.map((stage, index) => {
                const widthPercentage = maxValue > 0 ? (stage.valor / maxValue) * 100 : 0;
                const minWidth = 30;
                const calculatedWidth = Math.max(widthPercentage, minWidth);

                return (
                  <div
                    key={stage.nombre}
                    className="relative flex items-center justify-center transition-all duration-300 hover:scale-105"
                    style={{
                      width: `${calculatedWidth}%`,
                      minWidth: '200px',
                      maxWidth: '100%',
                      backgroundColor: FUNNEL_COLORS[index],
                      height: '80px',
                      clipPath: index === funnelStages.length - 1
                        ? 'polygon(5% 0%, 95% 0%, 90% 100%, 10% 100%)'
                        : 'polygon(0% 0%, 100% 0%, 95% 100%, 5% 100%)',
                      marginTop: index === 0 ? '0' : '-8px',
                    }}
                  >
                    <div className="text-white text-center z-10">
                      <div className="text-lg font-bold">{stage.valor.toLocaleString()}</div>
                      <div className="text-sm opacity-90">{stage.nombre}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              {funnelStages.map((stage, index) => (
                <div
                  key={stage.nombre}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: FUNNEL_COLORS[index] }}
                    ></div>
                    <span className="text-sm font-medium text-gray-600">{stage.nombre}</span>
                  </div>
                  <div className="mt-2 flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {stage.valor.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({stage.porcentaje}%)
                    </span>
                  </div>
                  {index > 0 && (
                    <div className="mt-1 text-xs text-gray-500">
                      Conversion desde Total: {stage.porcentaje}%
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Conversion Rates */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-800 mb-3">Tasas de Conversion</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700">Total Leads → Contactados</span>
                  <span className="font-semibold text-blue-900">
                    {funnelData.contactados.porcentaje}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700">Total Leads → Interesados</span>
                  <span className="font-semibold text-blue-900">
                    {funnelData.interesados.porcentaje}%
                  </span>
                </div>
                {funnelData.contactados.valor > 0 && (
                  <div className="flex items-center justify-between md:col-span-2">
                    <span className="text-sm text-blue-700">Contactados → Interesados</span>
                    <span className="font-semibold text-blue-900">
                      {Math.round((funnelData.interesados.valor / funnelData.contactados.valor) * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!funnelData && (
          <div className="text-center py-8 text-gray-500">
            No hay datos disponibles para mostrar
          </div>
        )}
      </div>
    </div>
  );
}
