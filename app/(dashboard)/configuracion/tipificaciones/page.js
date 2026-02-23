'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

export default function TipificacionesPage() {
  const [tipificaciones, setTipificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/crm/tipificaciones');
      setTipificaciones(response.data || []);
    } catch (error) {
      console.error('Error al cargar tipificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Está seguro de eliminar esta tipificación?')) {
      try {
        await apiClient.delete(`/crm/tipificaciones/${id}`);
        loadData();
      } catch (error) {
        console.error('Error al eliminar tipificación:', error);
        alert('No se puede eliminar la tipificación porque está en uso');
      }
    }
  };

  const filteredTipificaciones = tipificaciones.filter(t => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (t.nombre || '').toLowerCase().includes(s) ||
      (t.tipo || '').toLowerCase().includes(s) ||
      (t.prospecto?.nombre_completo || '').toLowerCase().includes(s) ||
      (t.proyecto?.nombre || '').toLowerCase().includes(s) ||
      (t.resumen || '').toLowerCase().includes(s)
    );
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString('es-PE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === 0) return '-';
    return `S/ ${Number(value).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
            <Link href="/configuracion" className="hover:text-primary-600">Configuración</Link>
            <span>/</span>
            <span className="text-gray-900">Tipificaciones</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Tipificaciones</h1>
          <p className="text-gray-600 mt-1">Gestiona las tipificaciones del sistema.</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          {filteredTipificaciones.length} {filteredTipificaciones.length === 1 ? 'tipificación' : 'tipificaciones'}
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-3">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre, tipo, prospecto, proyecto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Prospecto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Proyecto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Teléfono</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Correo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fecha Cita</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTipificaciones.map((tip) => (
                <>
                  <tr
                    key={tip.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedRow(expandedRow === tip.id ? null : tip.id)}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{tip.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {tip.tipo || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{tip.prospecto?.nombre_completo || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{tip.proyecto?.nombre || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{tip.telefono || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{tip.correo || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(tip.fecha_hora_cita)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setExpandedRow(expandedRow === tip.id ? null : tip.id); }}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Ver detalle"
                        >
                          <svg className={`w-4 h-4 transition-transform ${expandedRow === tip.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(tip.id); }}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRow === tip.id && (
                    <tr key={`${tip.id}-detail`} className="bg-gray-50">
                      <td colSpan={8} className="px-4 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 font-medium">Habitaciones:</span>
                            <p className="text-gray-900">{tip.num_habitaciones || 0}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 font-medium">Piso Referidos:</span>
                            <p className="text-gray-900">{tip.piso_referidos || 0}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 font-medium">Precio Indicado:</span>
                            <p className="text-gray-900">{formatCurrency(tip.precio_indicado)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 font-medium">Descuento:</span>
                            <p className="text-gray-900">{formatCurrency(tip.descuento)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 font-medium">Cuota Crediticia:</span>
                            <p className="text-gray-900">{formatCurrency(tip.cuota_crediticia)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 font-medium">Score Crediticio:</span>
                            <p className="text-gray-900">{tip.score_crediticio || 0}</p>
                          </div>
                          <div className="col-span-2">
                            <span className="text-gray-500 font-medium">Resumen:</span>
                            <p className="text-gray-900">{tip.resumen || '-'}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTipificaciones.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {search ? 'No se encontraron tipificaciones con ese criterio' : 'No hay tipificaciones registradas'}
          </div>
        )}
      </div>
    </div>
  );
}
