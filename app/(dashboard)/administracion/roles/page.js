'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRol, setEditingRol] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    modulos: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rolesRes, modulosRes] = await Promise.all([
        apiClient.get('/crm/roles'),
        apiClient.get('/crm/modulos')
      ]);
      setRoles(rolesRes.data || []);
      setModulos(modulosRes.data || []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRol) {
        await apiClient.put(`/crm/roles/${editingRol.id}`, formData);
      } else {
        await apiClient.post('/crm/roles', formData);
      }
      setShowModal(false);
      setEditingRol(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error al guardar rol:', error);
      alert(error.msg || 'Error al guardar rol');
    }
  };

  const handleEdit = async (rol) => {
    try {
      const response = await apiClient.get(`/crm/roles/${rol.id}`);
      const rolData = response.data;
      setEditingRol(rolData);
      setFormData({
        nombre: rolData.nombre || '',
        descripcion: rolData.descripcion || '',
        modulos: rolData.modulos ? rolData.modulos.map(m => m.id) : []
      });
      setShowModal(true);
    } catch (error) {
      console.error('Error al cargar rol:', error);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('¿Está seguro de eliminar este rol?')) {
      try {
        await apiClient.delete(`/crm/roles/${id}`);
        loadData();
      } catch (error) {
        console.error('Error al eliminar rol:', error);
      }
    }
  };

  const toggleModulo = (moduloId) => {
    setFormData(prev => ({
      ...prev,
      modulos: prev.modulos.includes(moduloId)
        ? prev.modulos.filter(id => id !== moduloId)
        : [...prev.modulos, moduloId]
    }));
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      modulos: []
    });
  };

  const openNewModal = () => {
    setEditingRol(null);
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
            <span className="text-gray-900">Roles</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Roles</h1>
          <p className="text-gray-600 mt-1">Gestiona los roles y permisos del sistema</p>
        </div>
        <button
          onClick={openNewModal}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Nuevo Rol</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((rol) => (
          <div key={rol.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              {/* Rol 2 y 3: Solo editar módulos */}
              {[2, 3].includes(rol.id) && (
                <div className="flex space-x-2">
                  <button onClick={() => handleEdit(rol)} className="text-gray-400 hover:text-primary-600" title="Editar módulos">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              )}
              {/* Otros roles: Editar y eliminar */}
              {![1, 2, 3].includes(rol.id) && (
                <div className="flex space-x-2">
                  <button onClick={() => handleEdit(rol)} className="text-gray-400 hover:text-primary-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(rol.id)} className="text-gray-400 hover:text-red-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{rol.nombre}</h3>
            <p className="text-sm text-gray-500">{rol.descripcion || 'Sin descripción'}</p>
          </div>
        ))}
      </div>

      {roles.length === 0 && (
        <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-gray-200">
          No hay roles registrados
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {[2, 3].includes(editingRol?.id) ? 'Editar Módulos del Rol' : editingRol ? 'Editar Rol' : 'Nuevo Rol'}
            </h2>
            {[2, 3].includes(editingRol?.id) && (
              <p className="text-sm text-gray-500 mb-4">Solo puedes modificar los módulos asignados a este rol.</p>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 ${[2, 3].includes(editingRol?.id) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  required
                  disabled={[2, 3].includes(editingRol?.id)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 ${[2, 3].includes(editingRol?.id) ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  rows={3}
                  disabled={[2, 3].includes(editingRol?.id)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Módulos Permitidos</label>
                <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                  {modulos.map((modulo) => (
                    <label key={modulo.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={formData.modulos.includes(modulo.id)}
                        onChange={() => toggleModulo(modulo.id)}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">{modulo.nombre}</span>
                    </label>
                  ))}
                </div>
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
                  {editingRol ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
