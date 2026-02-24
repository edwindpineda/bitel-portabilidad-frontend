'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

export default function ArgumentosVentaPage() {
  const [argumentos, setArgumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingArgumento, setEditingArgumento] = useState(null);
  const [formData, setFormData] = useState({
    titulo: '',
    argumento: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/crm/argumentos-venta');
      setArgumentos(response.data || []);
    } catch (error) {
      console.error('Error al cargar argumentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingArgumento) {
        await apiClient.put(`/crm/argumentos-venta/${editingArgumento.id}`, formData);
      } else {
        await apiClient.post('/crm/argumentos-venta', formData);
      }
      setShowModal(false);
      setEditingArgumento(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error al guardar argumento:', error);
      alert(error.msg || 'Error al guardar argumento');
    }
  };

  const handleEdit = (argumento) => {
    setEditingArgumento(argumento);
    setFormData({
      titulo: argumento.titulo || '',
      argumento: argumento.argumento || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Esta seguro de eliminar este argumento de venta?')) {
      try {
        await apiClient.delete(`/crm/argumentos-venta/${id}`);
        loadData();
      } catch (error) {
        console.error('Error al eliminar argumento:', error);
        alert('No se puede eliminar el argumento');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      argumento: ''
    });
  };

  const openNewModal = () => {
    setEditingArgumento(null);
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
            <Link href="/configuracion" className="hover:text-primary-600">Configuracion</Link>
            <span>/</span>
            <span className="text-gray-900">Argumentos de Venta</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Argumentos de Venta</h1>
          <p className="text-gray-600 mt-1">Gestiona los argumentos de venta para los asesores</p>
        </div>
        <button
          onClick={openNewModal}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Nuevo Argumento</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 uppercase">
            <div className="col-span-3">Titulo</div>
            <div className="col-span-7">Argumento</div>
            <div className="col-span-2 text-right">Acciones</div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {argumentos.map((argumento) => (
            <div
              key={argumento.id}
              className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-gray-50"
            >
              <div className="col-span-3">
                <span className="text-sm font-medium text-gray-900">{argumento.titulo}</span>
              </div>

              <div className="col-span-7">
                <p className="text-sm text-gray-600 line-clamp-2">{argumento.argumento}</p>
              </div>

              <div className="col-span-2 flex items-center justify-end space-x-2">
                <button
                  onClick={() => handleEdit(argumento)}
                  className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  title="Editar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(argumento.id)}
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

        {argumentos.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay argumentos de venta registrados
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingArgumento ? 'Editar Argumento' : 'Nuevo Argumento'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titulo *</label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  required
                  placeholder="Titulo corto del argumento..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Argumento *</label>
                <textarea
                  value={formData.argumento}
                  onChange={(e) => setFormData({ ...formData, argumento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  rows={5}
                  required
                  placeholder="Texto completo del argumento de venta..."
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
                  {editingArgumento ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
