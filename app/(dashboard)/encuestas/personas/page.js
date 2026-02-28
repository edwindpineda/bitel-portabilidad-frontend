'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

// Formatear numero con separacion de miles
const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString('es-PE');
};

// Formatear telefono en formato celular (XXX XXX XXXX o formato similar)
const formatTelefono = (telefono) => {
  if (!telefono) return '-';
  const tel = String(telefono).replace(/\D/g, ''); // Solo numeros

  // Si tiene 9 digitos (formato Peru): XXX XXX XXX
  if (tel.length === 9) {
    return `${tel.slice(0, 3)} ${tel.slice(3, 6)} ${tel.slice(6)}`;
  }
  // Si tiene 10 digitos: XXX XXX XXXX
  if (tel.length === 10) {
    return `${tel.slice(0, 3)} ${tel.slice(3, 6)} ${tel.slice(6)}`;
  }
  // Si tiene 11 digitos (con codigo pais): X XXX XXX XXXX
  if (tel.length === 11) {
    return `${tel.slice(0, 1)} ${tel.slice(1, 4)} ${tel.slice(4, 7)} ${tel.slice(7)}`;
  }
  // Si tiene 12 digitos (codigo pais 2 digitos): XX XXX XXX XXXX
  if (tel.length === 12) {
    return `${tel.slice(0, 2)} ${tel.slice(2, 5)} ${tel.slice(5, 8)} ${tel.slice(8)}`;
  }
  // Otro formato: devolver tal cual
  return telefono;
};

export default function PersonasPage() {
  const { data: session } = useSession();
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [progressInfo, setProgressInfo] = useState({ total: 0, procesados: 0, nuevos: 0, omitidos: 0, mensaje: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [prioridadFilter, setPrioridadFilter] = useState('todos');
  const [stats, setStats] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPersona, setNewPersona] = useState({ telefono: '', nombre: '', apellido: '', departamento: '', municipio: '', referente: '' });
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const itemsPerPage = 50;
  const fileInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Descargar plantilla Excel
  const downloadTemplate = (format) => {
    const headers = 'nombre,apellido,tel,departamento,municipio,referente';
    const ejemplo1 = 'Juan,Perez,999888777,Lima,Miraflores,Pedro Gomez';
    const ejemplo2 = 'Maria,Garcia,988777666,Arequipa,Cercado,Ana Lopez';
    const csvContent = `${headers}\n${ejemplo1}\n${ejemplo2}`;

    if (format === 'csv') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'plantilla_personas.csv';
      link.click();
      URL.revokeObjectURL(link.href);
    } else {
      const blob = new Blob(['\ufeff' + csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'plantilla_personas.xls';
      link.click();
      URL.revokeObjectURL(link.href);
    }
    toast.success(`Plantilla ${format.toUpperCase()} descargada`);
  };

  // Cargar personas con paginación del servidor
  const fetchPersonas = async (page = currentPage, estado = estadoFilter, search = searchTerm, prioridad = prioridadFilter) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', itemsPerPage);
      if (estado && estado !== 'todos') {
        params.append('estado', estado);
      }
      if (prioridad && prioridad !== 'todos') {
        params.append('prioridad', prioridad);
      }
      if (search && search.trim()) {
        params.append('search', search.trim());
      }

      const response = await apiClient.get(`/crm/tools/encuesta/personas?${params.toString()}`);
      setPersonas(response.data || []);
      setPagination(response.pagination || { page: 1, limit: itemsPerPage, total: 0, totalPages: 0 });
    } catch (error) {
      console.error('Error al cargar personas:', error);
      toast.error('Error al cargar personas');
    } finally {
      setLoading(false);
    }
  };

  // Cargar estadisticas
  const fetchStats = async (prioridad = prioridadFilter) => {
    try {
      const params = new URLSearchParams();
      if (prioridad && prioridad !== 'todos') {
        params.append('prioridad', prioridad);
      }
      const url = params.toString() ? `/crm/tools/encuesta/personas/stats?${params.toString()}` : '/crm/tools/encuesta/personas/stats';
      const response = await apiClient.get(url);
      setStats(response.data || null);
    } catch (error) {
      console.error('Error al cargar estadisticas:', error);
    }
  };

  useEffect(() => {
    fetchPersonas(1, estadoFilter, searchTerm, prioridadFilter);
    fetchStats();
  }, []);

  // Recargar cuando cambia el filtro de estado o prioridad
  useEffect(() => {
    setCurrentPage(1);
    fetchPersonas(1, estadoFilter, searchTerm, prioridadFilter);
    fetchStats(prioridadFilter);
  }, [estadoFilter, prioridadFilter]);

  // Recargar cuando cambia la búsqueda (con debounce)
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
      fetchPersonas(1, estadoFilter, searchTerm, prioridadFilter);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Recargar cuando cambia la página
  useEffect(() => {
    fetchPersonas(currentPage, estadoFilter, searchTerm, prioridadFilter);
  }, [currentPage]);

  // Subir archivo con SSE para progreso en tiempo real
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (!['xlsx', 'xls', 'csv'].includes(fileExtension)) {
      toast.error('Solo se permiten archivos Excel (.xlsx, .xls) o CSV');
      return;
    }

    const formData = new FormData();
    formData.append('archivo', file);

    // AbortController para timeout de 30 minutos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1800000); // 30 minutos

    try {
      setUploading(true);
      setUploadProgress(0);
      setProgressInfo({ total: 0, procesados: 0, nuevos: 0, omitidos: 0, mensaje: 'Subiendo archivo...' });

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3020/api';

      const response = await fetch(`${API_URL}/crm/tools/encuesta/personas/upload`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`
        }
      });

      clearTimeout(timeoutId);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Procesar eventos SSE
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.tipo === 'inicio') {
                setProgressInfo(prev => ({ ...prev, mensaje: data.mensaje }));
              } else if (data.tipo === 'progreso') {
                setProgressInfo({
                  total: data.total || 0,
                  procesados: data.procesados || 0,
                  nuevos: data.nuevos || 0,
                  omitidos: data.omitidos || 0,
                  mensaje: data.mensaje || 'Procesando...'
                });
                if (data.porcentaje !== undefined) {
                  setUploadProgress(data.porcentaje);
                } else if (data.total > 0) {
                  setUploadProgress(Math.round((data.procesados / data.total) * 100));
                }
              } else if (data.tipo === 'completado') {
                setUploadResult({
                  exito: data.exito,
                  nuevos: data.data?.nuevos || 0,
                  omitidos: data.data?.omitidos || 0,
                  errores_validacion: data.data?.errores_validacion || 0,
                  errores_bd: data.data?.errores_bd || 0,
                  total_filas: data.data?.total_filas || 0,
                  lotes_procesados: data.data?.lotes_procesados,
                  total_lotes: data.data?.total_lotes,
                  error_fatal: data.error_fatal
                });

                if (data.exito) {
                  toast.success(`Carga completada: ${data.data?.nuevos || 0} nuevos, ${data.data?.omitidos || 0} ya existentes`);
                } else {
                  toast.error(`Error en la carga`);
                }

                fetchPersonas();
                fetchStats();
              } else if (data.tipo === 'error') {
                toast.error(data.mensaje);
                setUploadResult({
                  exito: false,
                  error_fatal: data.mensaje
                });
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error al subir archivo:', error);
      toast.error('Error al procesar el archivo');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setProgressInfo({ total: 0, procesados: 0, nuevos: 0, omitidos: 0, mensaje: '' });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Crear persona manual
  const handleCreatePersona = async (e) => {
    e.preventDefault();
    if (!newPersona.telefono.trim()) {
      toast.error('El telefono es requerido');
      return;
    }

    try {
      setSaving(true);
      await apiClient.post('/crm/tools/encuesta/personas', {
        telefono: newPersona.telefono.trim(),
        nombre: newPersona.nombre.trim() || null,
        apellido: newPersona.apellido.trim() || null,
        departamento: newPersona.departamento.trim() || null,
        municipio: newPersona.municipio.trim() || null,
        referente: newPersona.referente.trim() || null
      });
      toast.success('Persona agregada exitosamente');
      setNewPersona({ telefono: '', nombre: '', apellido: '', departamento: '', municipio: '', referente: '' });
      setShowAddModal(false);
      fetchPersonas();
      fetchStats();
    } catch (error) {
      console.error('Error al crear persona:', error);
      toast.error(error.response?.data?.msg || 'Error al agregar persona');
    } finally {
      setSaving(false);
    }
  };

  // Eliminar persona
  const handleDelete = async (id) => {
    if (!confirm('¿Esta seguro de eliminar esta persona?')) return;

    try {
      await apiClient.delete(`/crm/tools/encuesta/personas/${id}`);
      toast.success('Persona eliminada');
      fetchPersonas();
      fetchStats();
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast.error('Error al eliminar persona');
    }
  };

  // Calcular índice inicial para correlativo
  const startIndex = (currentPage - 1) * itemsPerPage;

  const getEstadoLabel = (estado) => {
    switch (estado) {
      case 0: return { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' };
      case 1: return { label: 'Ejecutando', color: 'bg-blue-100 text-blue-800' };
      case 2: return { label: 'Buzon', color: 'bg-orange-100 text-orange-800' };
      case 3: return { label: 'Completado', color: 'bg-green-100 text-green-800' };
      default: return { label: 'Pendiente', color: 'bg-gray-100 text-gray-800' };
    }
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-4">
        <nav className="flex items-center space-x-2 text-sm text-gray-500">
          <Link href="/encuestas" className="hover:text-gray-700">Encuestas</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Personas</span>
        </nav>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personas</h1>
          <p className="text-gray-600 mt-1">Gestiona las personas para las encuestas</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => { fetchPersonas(); fetchStats(); }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Actualizar</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Agregar Persona</span>
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Importar Excel/CSV</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-700">Indicadores</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">{formatNumber(stats.total)}</div>
            <div className="text-sm text-gray-500">Total Personas</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-yellow-600">{formatNumber(stats.pendientes)}</div>
            <div className="text-sm text-gray-500">Pendientes</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-blue-600">{formatNumber(stats.ejecutados)}</div>
            <div className="text-sm text-gray-500">Ejecutados</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-orange-600">{formatNumber(stats.buzon)}</div>
            <div className="text-sm text-gray-500">Buzon</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-green-600">{formatNumber(stats.completados)}</div>
            <div className="text-sm text-gray-500">Completados</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-indigo-600">
              {stats.total > 0 ? ((stats.ejecutados / stats.total) * 100).toFixed(1) : 0}%
            </div>
            <div className="text-sm text-gray-500">% Ejec/Total</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-purple-600">
              {stats.ejecutados > 0 ? ((stats.completados / stats.ejecutados) * 100).toFixed(1) : 0}%
            </div>
            <div className="text-sm text-gray-500">% Comp/Ejec</div>
          </div>
          </div>
        </div>
      )}

      {/* Tabla de personas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar por nombre o telefono..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todos los estados</option>
              <option value="0">Pendiente</option>
              <option value="1">Ejecutando</option>
              <option value="2">Buzon</option>
              <option value="3">Completado</option>
            </select>
            <select
              value={prioridadFilter}
              onChange={(e) => setPrioridadFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todas las prioridades</option>
              <option value="1">Prioridad 1</option>
              <option value="2">Prioridad 2</option>
              <option value="3">Prioridad 3</option>
            </select>
            <button
              onClick={() => fetchPersonas()}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Actualizar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefono</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Apellido</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departamento</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Municipio</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Intentos</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : personas.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-lg font-medium">No hay personas registradas</p>
                    <p className="text-sm">Importa un archivo Excel o CSV para comenzar</p>
                  </td>
                </tr>
              ) : (
                personas.map((persona, index) => {
                  const estado = getEstadoLabel(persona.estado_llamada);
                  const correlativo = startIndex + index + 1;
                  return (
                    <tr key={persona.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">{formatNumber(correlativo)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatTelefono(persona.telefono)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{persona.nombre || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{persona.apellido || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{persona.departamento || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{persona.municipio || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{persona.referente || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{persona.intentos || 0}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${estado.color}`}>
                          {estado.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => handleDelete(persona.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginacion */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, pagination.total)} de {formatNumber(pagination.total)} personas
          </p>
          {pagination.totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-600">
                Pagina {formatNumber(currentPage)} de {formatNumber(pagination.totalPages)}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
                disabled={currentPage === pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de carga */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Importar Personas</h3>
              <button
                onClick={() => { setShowUploadModal(false); setUploadResult(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Mostrar resultado de la carga */}
            {uploadResult && (
              <div className={`mb-4 p-4 rounded-lg ${uploadResult.exito ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center mb-2">
                  {uploadResult.exito ? (
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                  <span className={`font-medium ${uploadResult.exito ? 'text-green-800' : 'text-red-800'}`}>
                    {uploadResult.exito ? 'Carga completada' : 'Error en la carga'}
                  </span>
                </div>

                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total filas en archivo:</span>
                    <span className="font-medium">{formatNumber(uploadResult.total_filas)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600">Nuevos registros insertados:</span>
                    <span className="font-medium text-green-700">{formatNumber(uploadResult.nuevos)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-600">Ya existentes (omitidos):</span>
                    <span className="font-medium text-yellow-700">{formatNumber(uploadResult.omitidos)}</span>
                  </div>
                  {uploadResult.errores_validacion > 0 && (
                    <div className="flex justify-between">
                      <span className="text-orange-600">Errores de validacion:</span>
                      <span className="font-medium text-orange-700">{formatNumber(uploadResult.errores_validacion)}</span>
                    </div>
                  )}
                  {uploadResult.errores_bd > 0 && (
                    <div className="flex justify-between">
                      <span className="text-red-600">Errores de base de datos:</span>
                      <span className="font-medium text-red-700">{formatNumber(uploadResult.errores_bd)}</span>
                    </div>
                  )}
                  {!uploadResult.exito && uploadResult.error_fatal && (
                    <div className="mt-2 pt-2 border-t border-red-200">
                      <p className="text-red-700 text-xs">Error: {uploadResult.error_fatal}</p>
                      <p className="text-red-600 text-xs mt-1">
                        Lotes procesados: {uploadResult.lotes_procesados} de {uploadResult.total_lotes}
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setUploadResult(null)}
                  className="mt-3 w-full px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                >
                  Cargar otro archivo
                </button>
              </div>
            )}

            {/* Formulario de carga - solo mostrar si no hay resultado */}
            {!uploadResult && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  Sube un archivo Excel (.xlsx, .xls) o CSV con las columnas:
                </p>
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-sm font-medium text-gray-700">Columnas:</p>
                  <ul className="text-sm text-gray-600 mt-1 list-disc list-inside">
                    <li><strong>tel</strong> <span className="text-red-500">*</span></li>
                    <li><strong>nombre</strong> <span className="text-red-500">*</span></li>
                    <li><strong>apellido</strong> (opcional)</li>
                    <li><strong>departamento</strong> (opcional)</li>
                    <li><strong>municipio</strong> (opcional)</li>
                    <li><strong>referente</strong> (opcional)</li>
                  </ul>
                  <p className="text-xs text-red-500 mt-1">* Campos obligatorios</p>
                  <p className="text-xs text-gray-500 mt-1">Los numeros que ya existen seran omitidos</p>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Descargar plantilla:</p>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={() => downloadTemplate('excel')}
                        className="px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors flex items-center space-x-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Excel</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadTemplate('csv')}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors flex items-center space-x-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>CSV</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="file-upload"
                    className={`cursor-pointer ${uploading ? '' : ''}`}
                  >
                    {uploading ? (
                      <div className="flex flex-col items-center w-full">
                        {/* Barra de progreso */}
                        <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
                          <div
                            className="bg-emerald-600 h-4 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>

                        {/* Mensaje de estado */}
                        <span className="text-sm font-medium text-gray-700 mb-2">
                          {progressInfo.mensaje}
                        </span>

                        {/* Estadisticas en tiempo real */}
                        {progressInfo.total > 0 && (
                          <div className="w-full bg-gray-50 rounded-lg p-3 mt-2">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Total registros:</span>
                                <span className="font-medium text-gray-700">{formatNumber(progressInfo.total)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Procesados:</span>
                                <span className="font-medium text-blue-600">{formatNumber(progressInfo.procesados)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Nuevos:</span>
                                <span className="font-medium text-green-600">{formatNumber(progressInfo.nuevos)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Omitidos:</span>
                                <span className="font-medium text-yellow-600">{formatNumber(progressInfo.omitidos)}</span>
                              </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-gray-200 text-center">
                              <span className="text-lg font-bold text-emerald-600">{uploadProgress}%</span>
                            </div>
                          </div>
                        )}

                        {/* Spinner cuando no hay total aun */}
                        {progressInfo.total === 0 && (
                          <div className="flex items-center justify-center mt-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600 mr-2"></div>
                            <span className="text-sm text-gray-500">Preparando...</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-sm text-gray-600">
                          Click para seleccionar archivo
                        </span>
                        <p className="text-xs text-gray-400 mt-1">Excel o CSV hasta 50MB</p>
                      </>
                    )}
                  </label>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={() => { setShowUploadModal(false); setUploadResult(null); }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={uploading}
              >
                {uploadResult ? 'Cerrar' : 'Cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de agregar persona */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Agregar Persona</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreatePersona}>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefono <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newPersona.telefono}
                    onChange={(e) => setNewPersona({ ...newPersona, telefono: e.target.value })}
                    placeholder="Ej: 999888777"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newPersona.nombre}
                    onChange={(e) => setNewPersona({ ...newPersona, nombre: e.target.value })}
                    placeholder="Nombre"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Apellido
                  </label>
                  <input
                    type="text"
                    value={newPersona.apellido}
                    onChange={(e) => setNewPersona({ ...newPersona, apellido: e.target.value })}
                    placeholder="Apellido"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Departamento
                  </label>
                  <input
                    type="text"
                    value={newPersona.departamento}
                    onChange={(e) => setNewPersona({ ...newPersona, departamento: e.target.value })}
                    placeholder="Departamento"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Municipio
                  </label>
                  <input
                    type="text"
                    value={newPersona.municipio}
                    onChange={(e) => setNewPersona({ ...newPersona, municipio: e.target.value })}
                    placeholder="Municipio"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Referente
                  </label>
                  <input
                    type="text"
                    value={newPersona.referente}
                    onChange={(e) => setNewPersona({ ...newPersona, referente: e.target.value })}
                    placeholder="Referente"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
