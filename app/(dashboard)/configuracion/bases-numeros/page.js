'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

export default function BasesNumerosPage() {
  const [bases, setBases] = useState([]);
  const [formatos, setFormatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDetallesModal, setShowDetallesModal] = useState(false);
  const [editingBase, setEditingBase] = useState(null);
  const [selectedBase, setSelectedBase] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [detallesPagination, setDetallesPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    id_formato: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [basesRes, formatosRes] = await Promise.all([
        apiClient.get('/crm/bases-numeros'),
        apiClient.get('/crm/formatos')
      ]);
      setBases(basesRes?.data || []);
      setFormatos(formatosRes?.data || []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const id_empresa = localStorage.getItem('id_empresa') || 1;
      const payload = {
        ...formData,
        id_empresa: parseInt(id_empresa),
        id_formato: parseInt(formData.id_formato)
      };

      if (editingBase) {
        await apiClient.put(`/crm/bases-numeros/${editingBase.id}`, payload);
      } else {
        await apiClient.post('/crm/bases-numeros', payload);
      }
      setShowModal(false);
      setEditingBase(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error al guardar base:', error);
      alert(error.msg || 'Error al guardar base de numeros');
    }
  };

  const handleEdit = (base) => {
    setEditingBase(base);
    setFormData({
      nombre: base.nombre || '',
      descripcion: base.descripcion || '',
      id_formato: base.id_formato || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Esta seguro de eliminar esta base de numeros?')) {
      try {
        await apiClient.delete(`/crm/bases-numeros/${id}`);
        loadData();
      } catch (error) {
        console.error('Error al eliminar base:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      id_formato: ''
    });
  };

  const openNewModal = () => {
    setEditingBase(null);
    resetForm();
    setShowModal(true);
  };

  // Detalles
  const handleViewDetalles = async (base, page = 1) => {
    setSelectedBase(base);
    try {
      const response = await apiClient.get(`/crm/bases-numeros/${base.id}/detalles?page=${page}&limit=50`);
      setDetalles(response?.data || []);
      setDetallesPagination({
        page: response?.page || 1,
        totalPages: response?.totalPages || 1,
        total: response?.total || 0
      });
      setShowDetallesModal(true);
    } catch (error) {
      console.error('Error al cargar detalles:', error);
    }
  };

  const handleDeleteDetalle = async (id) => {
    if (confirm('Esta seguro de eliminar este registro?')) {
      try {
        await apiClient.delete(`/crm/base-numero-detalles/${id}`);
        handleViewDetalles(selectedBase, detallesPagination.page);
        loadData();
      } catch (error) {
        console.error('Error al eliminar detalle:', error);
      }
    }
  };

  // Upload
  const openUploadModal = (base) => {
    setSelectedBase(base);
    setUploadResult(null);
    setShowUploadModal(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('archivo', file);
      formDataUpload.append('id_base_numero', selectedBase.id);

      const response = await apiClient.upload('/crm/bases-numeros/upload', formDataUpload);

      setUploadResult(response.data);
      loadData();
    } catch (error) {
      console.error('Error al subir archivo:', error);
      // Capturar toda la respuesta de error incluyendo detalles de estructura
      if (error && typeof error === 'object') {
        setUploadResult({
          error: error.error || 'error',
          msg: error.msg || 'Error al procesar el archivo',
          columnasFaltantes: error.columnasFaltantes,
          columnasSobrantes: error.columnasSobrantes,
          columnasEsperadas: error.columnasEsperadas,
          columnasArchivo: error.columnasArchivo
        });
      } else {
        setUploadResult({ error: 'Error al procesar el archivo' });
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
            <Link href="/configuracion" className="hover:text-primary-600">Configuracion</Link>
            <span>/</span>
            <span className="text-gray-900">Base de Numeros</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Base de Numeros</h1>
          <p className="text-gray-600 mt-1">Gestiona las bases de numeros para campanias</p>
        </div>
        <button
          onClick={openNewModal}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Nueva Base</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Formato</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registros</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bases.map((base) => (
              <tr key={base.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{base.nombre}</div>
                  {base.descripcion && (
                    <div className="text-xs text-gray-500 max-w-xs truncate">{base.descripcion}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {base.formato_nombre || 'Sin formato'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleViewDetalles(base)}
                    className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {base.total_registros || 0} registros
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {base.fecha_registro ? new Date(base.fecha_registro).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => openUploadModal(base)}
                    className="text-green-600 hover:text-green-900 mr-3"
                    title="Cargar archivo"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </button>
                  <button onClick={() => handleEdit(base)} className="text-primary-600 hover:text-primary-900 mr-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(base.id)} className="text-red-600 hover:text-red-900">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {bases.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay bases de numeros registradas
          </div>
        )}
      </div>

      {/* Modal Base */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingBase ? 'Editar Base' : 'Nueva Base de Numeros'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Formato *</label>
                <select
                  value={formData.id_formato}
                  onChange={(e) => setFormData({ ...formData, id_formato: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Seleccionar formato</option>
                  {formatos.map((formato) => (
                    <option key={formato.id} value={formato.id}>{formato.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {editingBase ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Upload */}
      {showUploadModal && selectedBase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Cargar Archivo</h2>
                <p className="text-sm text-gray-500">{selectedBase.nombre}</p>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                  Selecciona un archivo Excel (.xlsx, .xls) o CSV
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="mt-4"
                  disabled={uploading}
                />
              </div>

              {uploading && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  <span className="ml-2 text-gray-600">Procesando archivo...</span>
                </div>
              )}

              {uploadResult && !uploadResult.error && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">Carga completada</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>Total procesados: {uploadResult.totalProcesados}</li>
                    <li>Insertados: {uploadResult.insertados}</li>
                    {uploadResult.erroresValidacion > 0 && (
                      <li className="text-yellow-700">Errores de validacion: {uploadResult.erroresValidacion}</li>
                    )}
                    {uploadResult.erroresDuplicados > 0 && (
                      <li className="text-yellow-700">Duplicados: {uploadResult.erroresDuplicados}</li>
                    )}
                  </ul>

                  {uploadResult.detalleErroresValidacion?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-yellow-700">Errores de validacion:</p>
                      <ul className="text-xs text-yellow-600 mt-1 max-h-32 overflow-y-auto">
                        {uploadResult.detalleErroresValidacion.map((err, idx) => (
                          <li key={idx}>Fila {err.fila}: {err.errores.join(', ')}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {uploadResult?.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="font-medium text-red-800 mb-2">{uploadResult.msg || uploadResult.error}</p>

                  {uploadResult.columnasFaltantes?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-red-700">Columnas faltantes (requeridas):</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {uploadResult.columnasFaltantes.map((col, idx) => (
                          <span key={idx} className="text-xs px-2 py-0.5 rounded bg-red-200 text-red-800">
                            {col}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {uploadResult.columnasSobrantes?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-orange-700">Columnas no reconocidas (sobrantes):</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {uploadResult.columnasSobrantes.map((col, idx) => (
                          <span key={idx} className="text-xs px-2 py-0.5 rounded bg-orange-200 text-orange-800">
                            {col}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {uploadResult.columnasEsperadas?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-red-200">
                      <p className="text-sm font-medium text-red-700">Estructura esperada del formato:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {uploadResult.columnasEsperadas.map((col, idx) => (
                          <span
                            key={idx}
                            className={`text-xs px-2 py-0.5 rounded ${col.requerido ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-700'}`}
                          >
                            {col.nombre}{col.requerido ? ' *' : ''}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-red-500 mt-1">* Columnas requeridas</p>
                    </div>
                  )}

                  {uploadResult.columnasArchivo?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-red-200">
                      <p className="text-sm font-medium text-gray-700">Columnas en tu archivo:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {uploadResult.columnasArchivo.map((col, idx) => {
                          const esFaltante = uploadResult.columnasFaltantes?.includes(col.toLowerCase());
                          const esSobrante = uploadResult.columnasSobrantes?.includes(col.toLowerCase());
                          let className = "text-xs px-2 py-0.5 rounded ";
                          if (esSobrante) {
                            className += "bg-orange-100 text-orange-700 line-through";
                          } else {
                            className += "bg-green-100 text-green-700";
                          }
                          return (
                            <span key={idx} className={className}>
                              {col}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Formato esperado</h4>
                <p className="text-sm text-blue-700">
                  El archivo debe contener una columna <strong>telefono</strong> (requerido).
                  Opcionalmente puede incluir: nombre, correo, tipo_documento, numero_documento.
                </p>
                <p className="text-sm text-blue-700 mt-2">
                  Los campos adicionales se validan segun el formato seleccionado: <strong>{selectedBase.formato_nombre}</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalles */}
      {showDetallesModal && selectedBase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Registros de la Base</h2>
                <p className="text-sm text-gray-500">{selectedBase.nombre} - {detallesPagination.total} registros</p>
              </div>
              <button
                onClick={() => setShowDetallesModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Telefono</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Correo</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Adicional</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {detalles.map((detalle) => (
                  <tr key={detalle.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">{detalle.telefono}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{detalle.nombre || '-'}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{detalle.correo || '-'}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {detalle.tipo_documento && detalle.numero_documento
                        ? `${detalle.tipo_documento}: ${detalle.numero_documento}`
                        : '-'}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {detalle.json_adicional ? (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(typeof detalle.json_adicional === 'string' ? JSON.parse(detalle.json_adicional) : detalle.json_adicional).map(([key, value]) => (
                            <span key={key} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                              <strong>{key}:</strong> {value || '-'}
                            </span>
                          ))}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => handleDeleteDetalle(detalle.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {detalles.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No hay registros en esta base
              </div>
            )}

            {/* Paginacion */}
            {detallesPagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-gray-500">
                  Pagina {detallesPagination.page} de {detallesPagination.totalPages}
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewDetalles(selectedBase, detallesPagination.page - 1)}
                    disabled={detallesPagination.page === 1}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => handleViewDetalles(selectedBase, detallesPagination.page + 1)}
                    disabled={detallesPagination.page === detallesPagination.totalPages}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
