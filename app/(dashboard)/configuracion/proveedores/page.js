'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState(null);
  const [formData, setFormData] = useState({
    nombre: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/crm/proveedores');
      setProveedores(response.data || []);
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProveedor) {
        await apiClient.put(`/crm/proveedores/${editingProveedor.id}`, formData);
      } else {
        await apiClient.post('/crm/proveedores', formData);
      }
      setShowModal(false);
      setEditingProveedor(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error al guardar proveedor:', error);
      alert(error.msg || 'Error al guardar proveedor');
    }
  };

  const handleEdit = (proveedor) => {
    setEditingProveedor(proveedor);
    setFormData({
      nombre: proveedor.nombre || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Está seguro de eliminar este proveedor?')) {
      try {
        await apiClient.delete(`/crm/proveedores/${id}`);
        loadData();
      } catch (error) {
        console.error('Error al eliminar proveedor:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: ''
    });
  };

  const openNewModal = () => {
    setEditingProveedor(null);
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
            <span className="text-gray-900">Proveedores</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
          <p className="text-gray-600 mt-1">Gestiona los proveedores del sistema</p>
        </div>
        <button
          onClick={openNewModal}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Nuevo Proveedor</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Registro</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {proveedores.map((proveedor) => (
              <tr key={proveedor.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{proveedor.nombre}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {proveedor.created_at ? new Date(proveedor.created_at).toLocaleDateString('es-PE') : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleEdit(proveedor)} className="text-primary-600 hover:text-primary-900 mr-3">Editar</button>
                  <button onClick={() => handleDelete(proveedor.id)} className="text-red-600 hover:text-red-900">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {proveedores.length === 0 && (
          <div className="text-center py-8 text-gray-500">No hay proveedores registrados</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
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
                  {editingProveedor ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
