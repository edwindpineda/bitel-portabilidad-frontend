'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

// Formatear numero con separacion de miles
const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString('es-PE');
};

// Formatear telefono en formato celular
const formatTelefono = (telefono) => {
  if (!telefono) return '-';
  const tel = String(telefono).replace(/\D/g, '');

  if (tel.length === 9) {
    return `${tel.slice(0, 3)} ${tel.slice(3, 6)} ${tel.slice(6)}`;
  }
  if (tel.length === 10) {
    return `${tel.slice(0, 3)} ${tel.slice(3, 6)} ${tel.slice(6)}`;
  }
  if (tel.length === 11) {
    return `${tel.slice(0, 1)} ${tel.slice(1, 4)} ${tel.slice(4, 7)} ${tel.slice(7)}`;
  }
  if (tel.length === 12) {
    return `${tel.slice(0, 2)} ${tel.slice(2, 5)} ${tel.slice(5, 8)} ${tel.slice(8)}`;
  }
  return telefono;
};

export default function EncuestasListPage() {
  const [encuestas, setEncuestas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [participacionFilter, setParticipacionFilter] = useState('todos');
  const [intencionVotoFilter, setIntencionVotoFilter] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [showNotasModal, setShowNotasModal] = useState(false);
  const [notasSeleccionadas, setNotasSeleccionadas] = useState({ nombre: '', notas: '' });
  const [showObservacionesModal, setShowObservacionesModal] = useState(false);
  const [observacionesSeleccionadas, setObservacionesSeleccionadas] = useState({ nombre: '', observaciones: '' });
  const itemsPerPage = 50;

  const fetchEncuestas = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/crm/tools/encuesta');
      setEncuestas(response.data?.encuestas || []);
    } catch (error) {
      console.error('Error al cargar encuestas:', error);
      toast.error('Error al cargar encuestas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEncuestas();
  }, []);

  const filteredEncuestas = encuestas.filter(e => {
    // Filtro de búsqueda
    const matchSearch = (e.nombre_contacto?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (e.whatsapp_contacto?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    // Filtro de participación
    let matchParticipacion = true;
    if (participacionFilter !== 'todos') {
      const participacion = String(e.participacion || '').toLowerCase();
      if (participacionFilter === 'acepto') {
        matchParticipacion = participacion.includes('acept');
      } else if (participacionFilter === 'rechazo') {
        matchParticipacion = participacion.includes('rechaz') || participacion.includes('no');
      } else if (participacionFilter === 'sin_respuesta') {
        matchParticipacion = !participacion.includes('acept') && !participacion.includes('rechaz') && !participacion.includes('no');
      }
    }

    // Filtro de intención de voto
    let matchIntencionVoto = true;
    if (intencionVotoFilter !== 'todos') {
      const intencion = String(e.p2_intencion_voto || '');
      matchIntencionVoto = intencion.startsWith(intencionVotoFilter + ':');
    }

    return matchSearch && matchParticipacion && matchIntencionVoto;
  });

  // Paginacion
  const totalPages = Math.ceil(filteredEncuestas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEncuestas = filteredEncuestas.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, participacionFilter, intencionVotoFilter]);

  const getParticipacionLabel = (participacion) => {
    const valor = String(participacion || '').toLowerCase();
    if (valor.includes('acept')) {
      return { label: 'Acepto', color: 'bg-green-100 text-green-800' };
    } else if (valor.includes('rechaz') || valor.includes('no')) {
      return { label: 'Rechazo', color: 'bg-red-100 text-red-800' };
    }
    return { label: 'Sin respuesta', color: 'bg-gray-100 text-gray-800' };
  };

  const getVotoLabel = (voto) => {
    if (!voto) return '-';
    const valor = limpiarCodigo(voto).toLowerCase();
    if (valor.includes('sí') || valor === 'si') {
      return 'Si';
    } else if (valor === 'no') {
      return 'No';
    } else if (valor.includes('no sabe')) {
      return 'No sabe';
    }
    return limpiarCodigo(voto);
  };

  const limpiarCodigo = (valor) => {
    if (!valor) return '-';
    // Quitar prefijos como "1: ", "2: ", "3: ", etc.
    return String(valor).replace(/^\d+:\s*/, '');
  };

  const getAutorizaLabel = (autoriza) => {
    if (!autoriza) return { text: '-', color: 'text-gray-500' };
    const valor = limpiarCodigo(autoriza).toLowerCase();
    if (valor.includes('sí') || valor === 'si') {
      return { text: 'Si', color: 'text-green-600' };
    } else if (valor === 'no') {
      return { text: 'No', color: 'text-red-600' };
    }
    return { text: limpiarCodigo(autoriza), color: 'text-gray-500' };
  };

  const getEstadoLlamadaLabel = (estado) => {
    switch (estado) {
      case 0:
        return { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' };
      case 1:
        return { label: 'Ejecutando', color: 'bg-blue-100 text-blue-800' };
      case 2:
        return { label: 'Buzon', color: 'bg-orange-100 text-orange-800' };
      case 3:
        return { label: 'Completado', color: 'bg-green-100 text-green-800' };
      default:
        return { label: '-', color: 'bg-gray-100 text-gray-800' };
    }
  };

  // Exportar a Excel/CSV
  const exportToExcel = (exportAll = true) => {
    const dataToExport = exportAll ? encuestas : filteredEncuestas;

    if (dataToExport.length === 0) {
      toast.error('No hay datos para exportar');
      return;
    }

    // Cabeceras
    const headers = [
      '#',
      'Estado Llamada',
      'Nombre Contacto',
      'Participacion',
      'Piensa Votar',
      'Intencion Voto',
      'Observaciones',
      'Sabe Como Votar',
      'Refuerzo Pedagogico',
      'Conoce Candidato',
      'WhatsApp',
      'Autoriza mensaje WhatsApp',
      'Notas Adicionales'
    ];

    // Helper para estado llamada
    const getEstadoTexto = (estado) => {
      switch (estado) {
        case 0: return 'Pendiente';
        case 1: return 'Ejecutando';
        case 2: return 'Buzon';
        case 3: return 'Completado';
        default: return '-';
      }
    };

    // Filas de datos
    const rows = dataToExport.map((e, index) => [
      index + 1,
      getEstadoTexto(e.estado_llamada),
      e.nombre_contacto || '',
      e.participacion || '',
      e.p1_piensa_votar || '',
      e.p2_intencion_voto || '',
      e.p2_observaciones || '',
      e.p3a_sabe_como_votar || '',
      e.p3a_refuerzo_pedagogico || '',
      e.p3b_conoce_candidato || '',
      e.whatsapp_contacto || '',
      e.p4_autoriza_whatsapp || '',
      e.notas_adicionales || ''
    ]);

    // Construir CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // Descargar
    const blob = new Blob(['\ufeff' + csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    const fecha = new Date().toISOString().split('T')[0];
    link.href = URL.createObjectURL(blob);
    link.download = `encuestas_${exportAll ? 'todos' : 'filtrados'}_${fecha}.xls`;
    link.click();
    URL.revokeObjectURL(link.href);

    toast.success(`${dataToExport.length} encuestas exportadas`);
  };

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-4">
        <nav className="flex items-center space-x-2 text-sm text-gray-500">
          <Link href="/encuestas" className="hover:text-gray-700">Encuestas</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Lista de Encuestas</span>
        </nav>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Encuestas Realizadas</h1>
          <p className="text-gray-600 mt-1">Registro de encuestas completadas</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => exportToExcel(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Exportar Todo</span>
          </button>
          {searchTerm && filteredEncuestas.length !== encuestas.length && (
            <button
              onClick={() => exportToExcel(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Exportar Filtrados ({filteredEncuestas.length})</span>
            </button>
          )}
          <button
            onClick={() => fetchEncuestas()}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{formatNumber(encuestas.length)}</div>
          <div className="text-sm text-gray-500">Total Encuestas</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-600">
            {formatNumber(encuestas.filter(e => String(e.participacion || '').toLowerCase().includes('acept')).length)}
          </div>
          <div className="text-sm text-gray-500">Aceptaron</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-red-600">
            {formatNumber(encuestas.filter(e => String(e.participacion || '').toLowerCase().includes('rechaz')).length)}
          </div>
          <div className="text-sm text-gray-500">Rechazaron</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="text-2xl font-bold text-blue-600">
            {formatNumber(encuestas.filter(e => String(e.p2_intencion_voto || '').startsWith('1:')).length)}
          </div>
          <div className="text-sm text-gray-500">Intencion Wilder</div>
        </div>
      </div>

      {/* Tabla de encuestas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar por nombre o WhatsApp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <select
              value={participacionFilter}
              onChange={(e) => setParticipacionFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="todos">Todas las participaciones</option>
              <option value="acepto">Acepto</option>
              <option value="rechazo">Rechazo</option>
              <option value="sin_respuesta">Sin respuesta</option>
            </select>
            <select
              value={intencionVotoFilter}
              onChange={(e) => setIntencionVotoFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="todos">Todas las intenciones</option>
              <option value="1">Wilder Escobar</option>
              <option value="2">Otro candidato</option>
              <option value="3">Voto en blanco</option>
              <option value="4">No sabe</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado Llamada</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Participacion</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Piensa Votar</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Intencion Voto</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Observaciones</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sabe Votar</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Refuerzo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conoce Candidato</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WhatsApp</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Autoriza mensaje WhatsApp</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="13" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                    </div>
                  </td>
                </tr>
              ) : paginatedEncuestas.length === 0 ? (
                <tr>
                  <td colSpan="13" className="px-6 py-12 text-center text-gray-500">
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <p className="text-lg font-medium">No hay encuestas registradas</p>
                    <p className="text-sm">Las encuestas apareceran aqui cuando se registren</p>
                  </td>
                </tr>
              ) : (
                paginatedEncuestas.map((encuesta, index) => {
                  const participacion = getParticipacionLabel(encuesta.participacion);
                  const correlativo = startIndex + index + 1;
                  return (
                    <tr key={encuesta.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">{formatNumber(correlativo)}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {(() => {
                          const estado = getEstadoLlamadaLabel(encuesta.estado_llamada);
                          return (
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${estado.color}`}>
                              {estado.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{encuesta.nombre_contacto || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${participacion.color}`}>
                          {participacion.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{getVotoLabel(encuesta.p1_piensa_votar)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{limpiarCodigo(encuesta.p2_intencion_voto)}</td>
                      <td className="px-4 py-4 text-sm text-gray-500 max-w-[150px]">
                        {encuesta.p2_observaciones ? (
                          <button
                            onClick={() => {
                              setObservacionesSeleccionadas({ nombre: encuesta.nombre_contacto || 'Sin nombre', observaciones: encuesta.p2_observaciones });
                              setShowObservacionesModal(true);
                            }}
                            className="text-left truncate block w-full text-blue-600 hover:text-blue-800 hover:underline"
                            title="Click para ver completo"
                          >
                            {encuesta.p2_observaciones}
                          </button>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{limpiarCodigo(encuesta.p3a_sabe_como_votar)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{limpiarCodigo(encuesta.p3a_refuerzo_pedagogico)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{limpiarCodigo(encuesta.p3b_conoce_candidato)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{formatTelefono(encuesta.whatsapp_contacto)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(() => {
                          const autoriza = getAutorizaLabel(encuesta.p4_autoriza_whatsapp);
                          return <span className={autoriza.color}>{autoriza.text}</span>;
                        })()}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 max-w-[150px]">
                        {encuesta.notas_adicionales ? (
                          <button
                            onClick={() => {
                              setNotasSeleccionadas({ nombre: encuesta.nombre_contacto || 'Sin nombre', notas: encuesta.notas_adicionales });
                              setShowNotasModal(true);
                            }}
                            className="text-left truncate block w-full text-blue-600 hover:text-blue-800 hover:underline"
                            title="Click para ver completo"
                          >
                            {encuesta.notas_adicionales}
                          </button>
                        ) : '-'}
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
            Mostrando {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredEncuestas.length)} de {filteredEncuestas.length} encuestas
          </p>
          {totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-600">
                Pagina {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Observaciones */}
      {showObservacionesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Observaciones</h3>
              <button
                onClick={() => setShowObservacionesModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-500 mb-2">Contacto: <span className="font-medium text-gray-900">{observacionesSeleccionadas.nombre}</span></p>
              <div className="bg-gray-50 rounded-lg p-4 max-h-[300px] overflow-y-auto">
                <p className="text-gray-700 whitespace-pre-wrap">{observacionesSeleccionadas.observaciones}</p>
              </div>
            </div>
            <div className="flex justify-end p-4 border-t border-gray-200">
              <button
                onClick={() => setShowObservacionesModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Notas */}
      {showNotasModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Notas Adicionales</h3>
              <button
                onClick={() => setShowNotasModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-500 mb-2">Contacto: <span className="font-medium text-gray-900">{notasSeleccionadas.nombre}</span></p>
              <div className="bg-gray-50 rounded-lg p-4 max-h-[300px] overflow-y-auto">
                <p className="text-gray-700 whitespace-pre-wrap">{notasSeleccionadas.notas}</p>
              </div>
            </div>
            <div className="flex justify-end p-4 border-t border-gray-200">
              <button
                onClick={() => setShowNotasModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
