'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

export default function PeriodicidadesRecordatorioPage() {
  const [periodicidades, setPeriodicidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPeriodicidad, setEditingPeriodicidad] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    cada_horas: 1
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/crm/periodicidades-recordatorio');
      setPeriodicidades(response.data || []);
    } catch (error) {
      console.error('Error al cargar periodicidades:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPeriodicidad) {
        await apiClient.put(`/crm/periodicidades-recordatorio/${editingPeriodicidad.id}`, formData);
      } else {
        await apiClient.post('/crm/periodicidades-recordatorio', formData);
      }
      setShowModal(false);
      setEditingPeriodicidad(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error al guardar periodicidad:', error);
      alert(error.msg || 'Error al guardar periodicidad');
    }
  };

  const handleEdit = (periodicidad) => {
    setEditingPeriodicidad(periodicidad);
    setFormData({
      nombre: periodicidad.nombre || '',
      cada_horas: periodicidad.cada_horas || 1
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Esta seguro de eliminar esta periodicidad?')) {
      try {
        await apiClient.delete(`/crm/periodicidades-recordatorio/${id}`);
        loadData();
      } catch (error) {
        console.error('Error al eliminar periodicidad:', error);
        alert('No se puede eliminar la periodicidad');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      cada_horas: 1
    });
  };

  const openNewModal = () => {
    setEditingPeriodicidad(null);
    resetForm();
    setShowModal(true);
  };

  const formatHoras = (horas) => {
    if (horas === 1) return '1 hora';
    if (horas < 24) return `${horas} horas`;
    if (horas === 24) return '1 dia';
    const dias = Math.floor(horas / 24);
    const horasRestantes = horas % 24;
    if (horasRestantes === 0) {
      return dias === 1 ? '1 dia' : `${dias} dias`;
    }
    return `${dias} dia${dias > 1 ? 's' : ''} y ${horasRestantes} hora${horasRestantes > 1 ? 's' : ''}`;
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
            <span className="text-gray-900">Periodicidades de Recordatorio</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Periodicidades de Recordatorio</h1>
          <p className="text-gray-600 mt-1">Configura los intervalos de tiempo para recordatorios</p>
        </div>
        <button
          onClick={openNewModal}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Nueva Periodicidad</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 uppercase">
            <div className="col-span-4">Nombre</div>
            <div className="col-span-3">Intervalo (horas)</div>
            <div className="col-span-3">Equivalente</div>
            <div className="col-span-2 text-right">Acciones</div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {periodicidades.map((periodicidad) => (
            <div
              key={periodicidad.id}
              className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-gray-50"
            >
              <div className="col-span-4 flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-900">{periodicidad.nombre}</span>
              </div>

              <div className="col-span-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {periodicidad.cada_horas} {periodicidad.cada_horas === 1 ? 'hora' : 'horas'}
                </span>
              </div>

              <div className="col-span-3">
                <span className="text-sm text-gray-600">{formatHoras(periodicidad.cada_horas)}</span>
              </div>

              <div className="col-span-2 flex items-center justify-end space-x-2">
                <button
                  onClick={() => handleEdit(periodicidad)}
                  className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  title="Editar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(periodicidad.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {periodicidades.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay periodicidades de recordatorio registradas
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingPeriodicidad ? 'Editar Periodicidad' : 'Nueva Periodicidad'}
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
                  placeholder="Ej: Cada 6 horas, Diario, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Intervalo en horas *</label>
                <input
                  type="number"
                  min="1"
                  value={formData.cada_horas}
                  onChange={(e) => setFormData({ ...formData, cada_horas: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Equivalente: {formatHoras(formData.cada_horas)}
                </p>
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
                  {editingPeriodicidad ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
