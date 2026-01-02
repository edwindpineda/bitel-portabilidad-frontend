'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

const ESTADOS_EJECUCION = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  en_proceso: { label: 'En Proceso', color: 'bg-blue-100 text-blue-800' },
  ejecutado: { label: 'Ejecutado', color: 'bg-green-100 text-green-800' },
  fallido: { label: 'Fallido', color: 'bg-red-100 text-red-800' },
  cancelado: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800' },
};

export default function CampaniasPage() {
  const [campanias, setCampanias] = useState([]);
  const [basesDisponibles, setBasesDisponibles] = useState([]);
  const [formatos, setFormatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBasesModal, setShowBasesModal] = useState(false);
  const [showEjecucionesModal, setShowEjecucionesModal] = useState(false);
  const [editingCampania, setEditingCampania] = useState(null);
  const [selectedCampania, setSelectedCampania] = useState(null);
  const [basesAsignadas, setBasesAsignadas] = useState([]);
  const [ejecuciones, setEjecuciones] = useState([]);
  const [ejecutando, setEjecutando] = useState(false);

  // Estados para el modal de crear/editar
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    id_formato: ''
  });
  const [basesSeleccionadas, setBasesSeleccionadas] = useState([]);
  const [searchBase, setSearchBase] = useState('');
  const [showBaseDropdown, setShowBaseDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowBaseDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [campaniasRes, basesRes, formatosRes] = await Promise.all([
        apiClient.get('/crm/campanias'),
        apiClient.get('/crm/bases-numeros'),
        apiClient.get('/crm/formatos')
      ]);
      setCampanias(campaniasRes?.data || []);
      setBasesDisponibles(basesRes?.data || []);
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
      let campaniaId;
      if (editingCampania) {
        await apiClient.put(`/crm/campanias/${editingCampania.id}`, {
          nombre: formData.nombre,
          descripcion: formData.descripcion
        });
        campaniaId = editingCampania.id;
      } else {
        const response = await apiClient.post('/crm/campanias', {
          nombre: formData.nombre,
          descripcion: formData.descripcion
        });
        campaniaId = response.data?.id;
      }

      // Agregar bases seleccionadas si es nueva campania
      if (!editingCampania && campaniaId && basesSeleccionadas.length > 0) {
        for (const base of basesSeleccionadas) {
          try {
            await apiClient.post('/crm/campania-bases', {
              id_campania: campaniaId,
              id_base_numero: base.id
            });
          } catch (err) {
            console.error(`Error al agregar base ${base.nombre}:`, err);
          }
        }
      }

      setShowModal(false);
      setEditingCampania(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error al guardar campaña:', error);
      alert(error.msg || 'Error al guardar campaña');
    }
  };

  const handleEdit = (campania) => {
    setEditingCampania(campania);
    setFormData({
      nombre: campania.nombre || '',
      descripcion: campania.descripcion || '',
      id_formato: ''
    });
    setBasesSeleccionadas([]);
    setSearchBase('');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Está seguro de eliminar esta campaña?')) {
      try {
        await apiClient.delete(`/crm/campanias/${id}`);
        loadData();
      } catch (error) {
        console.error('Error al eliminar campaña:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      id_formato: ''
    });
    setBasesSeleccionadas([]);
    setSearchBase('');
    setShowBaseDropdown(false);
  };

  const openNewModal = () => {
    setEditingCampania(null);
    resetForm();
    setShowModal(true);
  };

  // Filtrar bases por formato seleccionado y texto de busqueda
  const basesFiltradas = basesDisponibles.filter(base => {
    const matchFormato = formData.id_formato ? base.id_formato === parseInt(formData.id_formato) : true;
    const matchSearch = base.nombre.toLowerCase().includes(searchBase.toLowerCase());
    const noSeleccionada = !basesSeleccionadas.some(bs => bs.id === base.id);
    return matchFormato && matchSearch && noSeleccionada;
  });

  // Agregar base a la seleccion
  const handleAddBaseToSelection = (base) => {
    setBasesSeleccionadas([...basesSeleccionadas, base]);
    setSearchBase('');
    setShowBaseDropdown(false);
  };

  // Quitar base de la seleccion
  const handleRemoveBaseFromSelection = (baseId) => {
    setBasesSeleccionadas(basesSeleccionadas.filter(b => b.id !== baseId));
  };

  // Gestionar bases de campania (modal separado)
  const handleViewBases = async (campania) => {
    setSelectedCampania(campania);
    try {
      const response = await apiClient.get(`/crm/campanias/${campania.id}/bases`);
      setBasesAsignadas(response?.data || []);
      setShowBasesModal(true);
    } catch (error) {
      console.error('Error al cargar bases:', error);
    }
  };

  const handleAddBase = async (id_base_numero) => {
    try {
      await apiClient.post('/crm/campania-bases', {
        id_campania: selectedCampania.id,
        id_base_numero
      });
      const response = await apiClient.get(`/crm/campanias/${selectedCampania.id}/bases`);
      setBasesAsignadas(response?.data || []);
      loadData();
    } catch (error) {
      console.error('Error al agregar base:', error);
      alert(error.msg || 'Error al agregar base');
    }
  };

  const handleRemoveBase = async (id) => {
    if (confirm('¿Está seguro de quitar esta base de la campaña?')) {
      try {
        await apiClient.delete(`/crm/campania-bases/${id}`);
        const response = await apiClient.get(`/crm/campanias/${selectedCampania.id}/bases`);
        setBasesAsignadas(response?.data || []);
        loadData();
      } catch (error) {
        console.error('Error al quitar base:', error);
      }
    }
  };

  // Ver ejecuciones
  const handleViewEjecuciones = async (campania) => {
    setSelectedCampania(campania);
    try {
      const response = await apiClient.get(`/crm/campanias/${campania.id}/ejecuciones`);
      setEjecuciones(response?.data || []);
      setShowEjecucionesModal(true);
    } catch (error) {
      console.error('Error al cargar ejecuciones:', error);
    }
  };

  // Ejecutar campania
  const handleEjecutar = async (campania) => {
    if (!confirm(`¿Está seguro de ejecutar la campaña "${campania.nombre}"? Esto creará ejecuciones pendientes para todas las bases asignadas.`)) {
      return;
    }

    setEjecutando(true);
    try {
      const response = await apiClient.post('/crm/campania-ejecuciones/ejecutar', {
        id_campania: campania.id
      });
      alert(`Ejecución iniciada: ${response.data?.total_bases || 0} bases programadas`);
      loadData();
    } catch (error) {
      console.error('Error al ejecutar campaña:', error);
      alert(error.msg || 'Error al ejecutar campaña');
    } finally {
      setEjecutando(false);
    }
  };

  // Obtener bases no asignadas para el modal de gestion
  const basesNoAsignadas = basesDisponibles.filter(
    base => !basesAsignadas.some(ba => ba.id_base_numero === base.id)
  );

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
<h1 className="text-2xl font-bold text-gray-900">Campañas de Llamadas</h1>
          <p className="text-gray-600 mt-1">Gestiona las campañas y sus bases de números</p>
        </div>
        <button
          onClick={openNewModal}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Nueva Campaña</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripcion</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bases</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ejecuciones</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {campanias.map((campania) => (
              <tr key={campania.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{campania.nombre}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500 max-w-xs truncate">{campania.descripcion || '-'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleViewBases(campania)}
                    className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                    {campania.total_bases || 0} bases
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleViewEjecuciones(campania)}
                    className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {campania.total_ejecuciones || 0}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEjecutar(campania)}
                    disabled={ejecutando || campania.total_bases === 0}
                    className={`mr-2 px-3 py-1.5 text-xs font-medium rounded ${
                      campania.total_bases > 0
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                    title={campania.total_bases === 0 ? 'Asigna bases primero' : 'Ejecutar campaña'}
                  >
                    <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Ejecutar
                  </button>
                  <button
                    onClick={() => handleEdit(campania)}
                    className="text-primary-600 hover:text-primary-900 mr-3"
                    title="Editar"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(campania.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Eliminar"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {campanias.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay campañas registradas
          </div>
        )}
      </div>

      {/* Modal Campania */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingCampania ? 'Editar Campaña' : 'Nueva Campaña'}
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
                  rows={2}
                />
              </div>

              {/* Seccion de seleccion de bases (solo para nueva campania) */}
              {!editingCampania && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Formato (filtro)</label>
                    <select
                      value={formData.id_formato}
                      onChange={(e) => setFormData({ ...formData, id_formato: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Todos los formatos</option>
                      {formatos.map((formato) => (
                        <option key={formato.id} value={formato.id}>{formato.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div className="relative" ref={dropdownRef}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Agregar Bases</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchBase}
                        onChange={(e) => {
                          setSearchBase(e.target.value);
                          setShowBaseDropdown(true);
                        }}
                        onFocus={() => setShowBaseDropdown(true)}
                        placeholder="Buscar base por nombre..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                      />
                      <svg className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>

                    {/* Dropdown de bases */}
                    {showBaseDropdown && basesFiltradas.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {basesFiltradas.map((base) => (
                          <button
                            key={base.id}
                            type="button"
                            onClick={() => handleAddBaseToSelection(base)}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center justify-between"
                          >
                            <span className="text-sm text-gray-900">{base.nombre}</span>
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                              {formatos.find(f => f.id === base.id_formato)?.nombre || 'Sin formato'}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {showBaseDropdown && searchBase && basesFiltradas.length === 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-center text-gray-500 text-sm">
                        No se encontraron bases
                      </div>
                    )}
                  </div>

                  {/* Bases seleccionadas */}
                  {basesSeleccionadas.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bases seleccionadas ({basesSeleccionadas.length})
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {basesSeleccionadas.map((base) => (
                          <span
                            key={base.id}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                          >
                            {base.nombre}
                            <button
                              type="button"
                              onClick={() => handleRemoveBaseFromSelection(base.id)}
                              className="ml-2 text-primary-600 hover:text-primary-900"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

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
                  {editingCampania ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Bases */}
      {showBasesModal && selectedCampania && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Bases de la Campaña</h2>
                <p className="text-sm text-gray-500">{selectedCampania.nombre}</p>
              </div>
              <button
                onClick={() => setShowBasesModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Agregar nueva base */}
            {basesNoAsignadas.length > 0 && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">Agregar base</label>
                <div className="flex space-x-2">
                  <select
                    id="addBaseSelect"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    defaultValue=""
                  >
                    <option value="" disabled>Seleccionar base...</option>
                    {basesNoAsignadas.map((base) => (
                      <option key={base.id} value={base.id}>
                        {base.nombre} - {formatos.find(f => f.id === base.id_formato)?.nombre || 'Sin formato'}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const select = document.getElementById('addBaseSelect');
                      if (select.value) {
                        handleAddBase(parseInt(select.value));
                        select.value = '';
                      }
                    }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Agregar
                  </button>
                </div>
              </div>
            )}

            {/* Lista de bases asignadas */}
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Base</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Formato</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Numeros</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Accion</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {basesAsignadas.map((base) => (
                  <tr key={base.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{base.base_nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {base.formato_nombre || 'Sin formato'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{base.total_numeros || 0}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRemoveBase(base.id)}
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

            {basesAsignadas.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                No hay bases asignadas a esta campaña
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Ejecuciones */}
      {showEjecucionesModal && selectedCampania && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Ejecuciones de Campaña</h2>
                <p className="text-sm text-gray-500">{selectedCampania.nombre}</p>
              </div>
              <button
                onClick={() => setShowEjecucionesModal(false)}
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
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Base</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Resultado</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha Registro</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha Inicio</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha Fin</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ejecuciones.map((ejecucion) => (
                  <tr key={ejecucion.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">#{ejecucion.id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{ejecucion.base_nombre}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${ESTADOS_EJECUCION[ejecucion.estado_ejecucion]?.color || 'bg-gray-100 text-gray-800'}`}>
                        {ESTADOS_EJECUCION[ejecucion.estado_ejecucion]?.label || ejecucion.estado_ejecucion}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{ejecucion.resultado || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {ejecucion.fecha_registro ? new Date(ejecucion.fecha_registro).toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {ejecucion.fecha_inicio ? new Date(ejecucion.fecha_inicio).toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {ejecucion.fecha_fin ? new Date(ejecucion.fecha_fin).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {ejecuciones.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-sm">
                No hay ejecuciones registradas para esta campaña
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
