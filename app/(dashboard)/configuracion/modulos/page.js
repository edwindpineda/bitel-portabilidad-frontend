'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

export default function ModulosPage() {
  const [modulos, setModulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingModulo, setEditingModulo] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    ruta: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/crm/modulos');
      setModulos(response.data || []);
    } catch (error) {
      console.error('Error al cargar módulos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingModulo) {
        await apiClient.put(`/crm/modulos/${editingModulo.id}`, formData);
      } else {
        await apiClient.post('/crm/modulos', formData);
      }
      setShowModal(false);
      setEditingModulo(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error al guardar módulo:', error);
      alert(error.msg || 'Error al guardar módulo');
    }
  };

  const handleEdit = (modulo) => {
    setEditingModulo(modulo);
    setFormData({
      nombre: modulo.nombre || '',
      ruta: modulo.ruta || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Está seguro de eliminar este módulo?')) {
      try {
        await apiClient.delete(`/crm/modulos/${id}`);
        loadData();
      } catch (error) {
        console.error('Error al eliminar módulo:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      ruta: ''
    });
  };

  const openNewModal = () => {
    setEditingModulo(null);
    resetForm();
    setShowModal(true);
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
            <Link href="/configuracion" className="hover:text-primary-600">Configuración</Link>
            <span>/</span>
            <span className="text-gray-900">Módulos</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Módulos</h1>
          <p className="text-gray-600 mt-1">Gestiona los módulos del sistema</p>
        </div>
        <button
          onClick={openNewModal}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Nuevo Módulo</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ruta</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {modulos.map((modulo) => (
              <tr key={modulo.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{modulo.nombre}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{modulo.ruta || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleEdit(modulo)} className="text-primary-600 hover:text-primary-900 mr-3">Editar</button>
                  <button onClick={() => handleDelete(modulo.id)} className="text-red-600 hover:text-red-900">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {modulos.length === 0 && (
          <div className="text-center py-8 text-gray-500">No hay módulos registrados</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingModulo ? 'Editar Módulo' : 'Nuevo Módulo'}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Ruta</label>
                <input
                  type="text"
                  value={formData.ruta}
                  onChange={(e) => setFormData({ ...formData, ruta: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="ej: /dashboard/usuarios"
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
                  {editingModulo ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
