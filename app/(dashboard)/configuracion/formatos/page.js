'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import * as XLSX from 'xlsx';

// Campos fijos de base_numero_detalle (no se guardan en formato_campo)
const CAMPOS_FIJOS = [
  { nombre_campo: 'telefono', etiqueta: 'Telefono', tipo_dato: 'phone', requerido: true, orden: 0, es_fijo: true },
  { nombre_campo: 'nombre', etiqueta: 'Nombre', tipo_dato: 'string', requerido: false, orden: 0, es_fijo: true },
  { nombre_campo: 'correo', etiqueta: 'Correo', tipo_dato: 'email', requerido: false, orden: 0, es_fijo: true },
  { nombre_campo: 'tipo_documento', etiqueta: 'Tipo Documento', tipo_dato: 'string', requerido: false, orden: 0, es_fijo: true },
  { nombre_campo: 'numero_documento', etiqueta: 'Numero Documento', tipo_dato: 'string', requerido: false, orden: 0, es_fijo: true },
];

const TIPOS_DATO = [
  { value: 'string', label: 'Texto' },
  { value: 'integer', label: 'Entero' },
  { value: 'decimal', label: 'Decimal' },
  { value: 'boolean', label: 'Booleano' },
  { value: 'date', label: 'Fecha' },
  { value: 'datetime', label: 'Fecha y Hora' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Telefono' },
];

export default function FormatosPage() {
  const [formatos, setFormatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCamposModal, setShowCamposModal] = useState(false);
  const [editingFormato, setEditingFormato] = useState(null);
  const [selectedFormato, setSelectedFormato] = useState(null);
  const [campos, setCampos] = useState([]);
  const [showCampoModal, setShowCampoModal] = useState(false);
  const [editingCampo, setEditingCampo] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: ''
  });

  const [campoFormData, setCampoFormData] = useState({
    nombre_campo: '',
    etiqueta: '',
    tipo_dato: 'string',
    longitud: '',
    requerido: false,
    unico: false,
    orden: 1,
    placeholder: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/crm/formatos');
      setFormatos(response?.data || []);
    } catch (error) {
      console.error('Error al cargar formatos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFormato) {
        await apiClient.put(`/crm/formatos/${editingFormato.id}`, formData);
      } else {
        const id_empresa = localStorage.getItem('id_empresa') || 1;
        await apiClient.post('/crm/formatos', { ...formData, id_empresa: parseInt(id_empresa) });
      }
      setShowModal(false);
      setEditingFormato(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error al guardar formato:', error);
      alert(error.msg || 'Error al guardar formato');
    }
  };

  const handleEdit = (formato) => {
    setEditingFormato(formato);
    setFormData({
      nombre: formato.nombre || '',
      descripcion: formato.descripcion || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Esta seguro de eliminar este formato?')) {
      try {
        await apiClient.delete(`/crm/formatos/${id}`);
        loadData();
      } catch (error) {
        console.error('Error al eliminar formato:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: ''
    });
  };

  const openNewModal = () => {
    setEditingFormato(null);
    resetForm();
    setShowModal(true);
  };

  // Descargar plantilla Excel con campos fijos
  const downloadPlantilla = () => {
    // Crear headers con campos fijos
    const headers = CAMPOS_FIJOS.map(c => c.nombre_campo);

    // Crear un libro con una hoja vacia con solo headers
    const ws = XLSX.utils.aoa_to_array ?
      XLSX.utils.aoa_to_sheet([headers]) :
      XLSX.utils.json_to_sheet([], { header: headers });

    // Agregar headers si json_to_sheet no los agrego
    if (!ws['A1']) {
      XLSX.utils.sheet_add_aoa(ws, [headers], { origin: 'A1' });
    }

    // Configurar ancho de columnas
    ws['!cols'] = headers.map(() => ({ wch: 20 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');

    // Descargar
    XLSX.writeFile(wb, 'plantilla_base_numeros.xlsx');
  };

  // Descargar plantilla con campos fijos + campos del formato actual (desde modal)
  const downloadPlantillaFormato = () => {
    if (!selectedFormato) return;

    // Combinar campos fijos + campos personalizados
    const headers = [
      ...CAMPOS_FIJOS.map(c => c.nombre_campo),
      ...campos.map(c => c.nombre_campo)
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers]);
    ws['!cols'] = headers.map(() => ({ wch: 20 }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');

    XLSX.writeFile(wb, `plantilla_${selectedFormato.nombre.replace(/\s+/g, '_').toLowerCase()}.xlsx`);
  };

  // Descargar plantilla para un formato específico (desde tabla principal)
  const downloadPlantillaForFormato = async (formato) => {
    try {
      // Obtener campos del formato
      const response = await apiClient.get(`/crm/formatos/${formato.id}`);
      const camposFormato = response?.data?.campos || [];

      // Combinar campos fijos + campos personalizados
      const headers = [
        ...CAMPOS_FIJOS.map(c => c.nombre_campo),
        ...camposFormato.map(c => c.nombre_campo)
      ];

      const ws = XLSX.utils.aoa_to_sheet([headers]);
      ws['!cols'] = headers.map(() => ({ wch: 20 }));

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');

      XLSX.writeFile(wb, `plantilla_${formato.nombre.replace(/\s+/g, '_').toLowerCase()}.xlsx`);
    } catch (error) {
      console.error('Error al descargar plantilla:', error);
      alert('Error al descargar la plantilla');
    }
  };

  // Campos
  const handleViewCampos = async (formato) => {
    setSelectedFormato(formato);
    try {
      const response = await apiClient.get(`/crm/formatos/${formato.id}`);
      setCampos(response?.data?.campos || []);
      setShowCamposModal(true);
    } catch (error) {
      console.error('Error al cargar campos:', error);
    }
  };

  const handleCampoSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...campoFormData,
        id_formato: selectedFormato.id,
        longitud: campoFormData.longitud ? parseInt(campoFormData.longitud) : null
      };

      if (editingCampo) {
        await apiClient.put(`/crm/formato-campos/${editingCampo.id}`, data);
      } else {
        await apiClient.post('/crm/formato-campos', data);
      }
      setShowCampoModal(false);
      setEditingCampo(null);
      resetCampoForm();
      // Recargar campos
      const response = await apiClient.get(`/crm/formatos/${selectedFormato.id}`);
      setCampos(response?.data?.campos || []);
      loadData(); // Recargar formatos para actualizar contador
    } catch (error) {
      console.error('Error al guardar campo:', error);
      alert(error.msg || 'Error al guardar campo');
    }
  };

  const handleEditCampo = (campo) => {
    setEditingCampo(campo);
    setCampoFormData({
      nombre_campo: campo.nombre_campo || '',
      etiqueta: campo.etiqueta || '',
      tipo_dato: campo.tipo_dato || 'string',
      longitud: campo.longitud || '',
      requerido: campo.requerido === 1,
      unico: campo.unico === 1,
      orden: campo.orden || 1,
      placeholder: campo.placeholder || ''
    });
    setShowCampoModal(true);
  };

  const handleDeleteCampo = async (id) => {
    if (confirm('Esta seguro de eliminar este campo?')) {
      try {
        await apiClient.delete(`/crm/formato-campos/${id}`);
        const response = await apiClient.get(`/crm/formatos/${selectedFormato.id}`);
        setCampos(response?.data?.campos || []);
        loadData();
      } catch (error) {
        console.error('Error al eliminar campo:', error);
      }
    }
  };

  const resetCampoForm = () => {
    setCampoFormData({
      nombre_campo: '',
      etiqueta: '',
      tipo_dato: 'string',
      longitud: '',
      requerido: false,
      unico: false,
      orden: campos.length + 1,
      placeholder: ''
    });
  };

  const openNewCampoModal = () => {
    setEditingCampo(null);
    resetCampoForm();
    setShowCampoModal(true);
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
            <span className="text-gray-900">Formatos</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Formatos</h1>
          <p className="text-gray-600 mt-1">Gestiona los formatos de datos y sus campos</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={downloadPlantilla}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
            title="Descargar plantilla Excel con campos base"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Descargar Plantilla</span>
          </button>
          <button
            onClick={openNewModal}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Nuevo Formato</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripcion</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campos</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {formatos.map((formato) => (
              <tr key={formato.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{formato.nombre}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500 max-w-xs truncate">{formato.descripcion || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleViewCampos(formato)}
                    className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    {formato.total_campos || 0} campos
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => downloadPlantillaForFormato(formato)}
                    className="text-green-600 hover:text-green-900 mr-3"
                    title="Descargar plantilla Excel"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                  <button onClick={() => handleEdit(formato)} className="text-primary-600 hover:text-primary-900 mr-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(formato.id)} className="text-red-600 hover:text-red-900">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {formatos.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay formatos registrados
          </div>
        )}
      </div>

      {/* Modal Formato */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingFormato ? 'Editar Formato' : 'Nuevo Formato'}
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
                  {editingFormato ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Campos */}
      {showCamposModal && selectedFormato && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Campos del Formato</h2>
                <p className="text-sm text-gray-500">{selectedFormato.nombre}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={downloadPlantillaFormato}
                  className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 flex items-center space-x-1 text-sm"
                  title="Descargar plantilla Excel con todos los campos"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Descargar Plantilla</span>
                </button>
                <button
                  onClick={openNewCampoModal}
                  className="bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 flex items-center space-x-1 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Agregar Campo</span>
                </button>
                <button
                  onClick={() => setShowCamposModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Orden</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre Campo</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Etiqueta</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Requerido</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unico</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Campos fijos (base_numero_detalle) */}
                {CAMPOS_FIJOS.map((campo, idx) => (
                  <tr key={`fijo-${idx}`} className="bg-blue-50">
                    <td className="px-4 py-2 text-sm text-blue-500">-</td>
                    <td className="px-4 py-2 text-sm font-medium text-blue-700">
                      {campo.nombre_campo}
                      <span className="ml-2 px-1.5 py-0.5 bg-blue-200 text-blue-700 text-xs rounded">Base</span>
                    </td>
                    <td className="px-4 py-2 text-sm text-blue-600">{campo.etiqueta}</td>
                    <td className="px-4 py-2 text-sm text-blue-500">
                      <span className="px-2 py-0.5 bg-blue-100 rounded text-xs">
                        {TIPOS_DATO.find(t => t.value === campo.tipo_dato)?.label || campo.tipo_dato}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {campo.requerido ? (
                        <span className="text-green-600 font-medium">Si</span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-400">-</td>
                    <td className="px-4 py-2 text-right text-xs text-blue-500 italic">
                      Campo fijo
                    </td>
                  </tr>
                ))}
                {/* Separador visual */}
                {campos.length > 0 && (
                  <tr className="bg-gray-100">
                    <td colSpan="7" className="px-4 py-1 text-xs text-gray-500 font-medium">
                      Campos personalizados del formato
                    </td>
                  </tr>
                )}
                {/* Campos personalizados del formato */}
                {campos.map((campo) => (
                  <tr key={campo.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-500">{campo.orden}</td>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">{campo.nombre_campo}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{campo.etiqueta || '-'}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                        {TIPOS_DATO.find(t => t.value === campo.tipo_dato)?.label || campo.tipo_dato}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {campo.requerido ? (
                        <span className="text-green-600">Si</span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {campo.unico ? (
                        <span className="text-blue-600">Si</span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button onClick={() => handleEditCampo(campo)} className="text-primary-600 hover:text-primary-900 mr-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => handleDeleteCampo(campo.id)} className="text-red-600 hover:text-red-900">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {campos.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                Solo se usaran los campos base. Agrega campos personalizados si necesitas mas columnas.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Campo */}
      {showCampoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingCampo ? 'Editar Campo' : 'Nuevo Campo'}
            </h2>
            <form onSubmit={handleCampoSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Campo *</label>
                  <input
                    type="text"
                    value={campoFormData.nombre_campo}
                    onChange={(e) => setCampoFormData({ ...campoFormData, nombre_campo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="ej: telefono, nombre"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Etiqueta</label>
                  <input
                    type="text"
                    value={campoFormData.etiqueta}
                    onChange={(e) => setCampoFormData({ ...campoFormData, etiqueta: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="ej: Telefono, Nombre Completo"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Dato *</label>
                  <select
                    value={campoFormData.tipo_dato}
                    onChange={(e) => setCampoFormData({ ...campoFormData, tipo_dato: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    {TIPOS_DATO.map((tipo) => (
                      <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Longitud</label>
                  <input
                    type="number"
                    value={campoFormData.longitud}
                    onChange={(e) => setCampoFormData({ ...campoFormData, longitud: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="ej: 100"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Orden</label>
                  <input
                    type="number"
                    value={campoFormData.orden}
                    onChange={(e) => setCampoFormData({ ...campoFormData, orden: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder</label>
                  <input
                    type="text"
                    value={campoFormData.placeholder}
                    onChange={(e) => setCampoFormData({ ...campoFormData, placeholder: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Texto de ayuda"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="requerido"
                    checked={campoFormData.requerido}
                    onChange={(e) => setCampoFormData({ ...campoFormData, requerido: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="requerido" className="text-sm text-gray-700">Requerido</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="unico"
                    checked={campoFormData.unico}
                    onChange={(e) => setCampoFormData({ ...campoFormData, unico: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="unico" className="text-sm text-gray-700">Valor unico</label>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCampoModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  {editingCampo ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
