'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

const COLORES_PREDEFINIDOS = [
  { nombre: 'Rojo', valor: '#EF4444' },
  { nombre: 'Naranja', valor: '#F97316' },
  { nombre: 'Amarillo', valor: '#EAB308' },
  { nombre: 'Verde', valor: '#22C55E' },
  { nombre: 'Azul', valor: '#3B82F6' },
  { nombre: 'Indigo', valor: '#6366F1' },
  { nombre: 'Purpura', valor: '#A855F7' },
  { nombre: 'Rosa', valor: '#EC4899' },
  { nombre: 'Gris', valor: '#6B7280' },
];

export default function TipificacionesPage() {
  const [tipificaciones, setTipificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTipificacion, setEditingTipificacion] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    definicion: '',
    orden: 0,
    color: '#3B82F6'
  });
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const [savingOrder, setSavingOrder] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/crm/tipificaciones');
      setTipificaciones(response.data || []);
    } catch (error) {
      console.error('Error al cargar tipificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTipificacion) {
        await apiClient.put(`/crm/tipificaciones/${editingTipificacion.id}`, formData);
      } else {
        // Asignar el siguiente orden disponible
        const maxOrden = tipificaciones.length > 0
          ? Math.max(...tipificaciones.map(t => t.orden || 0))
          : -1;
        await apiClient.post('/crm/tipificaciones', { ...formData, orden: maxOrden + 1 });
      }
      setShowModal(false);
      setEditingTipificacion(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error al guardar tipificacion:', error);
      alert(error.msg || 'Error al guardar tipificacion');
    }
  };

  const handleEdit = (tipificacion) => {
    setEditingTipificacion(tipificacion);
    setFormData({
      nombre: tipificacion.nombre || '',
      definicion: tipificacion.definicion || '',
      orden: tipificacion.orden || 0,
      color: tipificacion.color || '#3B82F6'
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Esta seguro de eliminar esta tipificacion?')) {
      try {
        await apiClient.delete(`/crm/tipificaciones/${id}`);
        loadData();
      } catch (error) {
        console.error('Error al eliminar tipificacion:', error);
        alert('No se puede eliminar la tipificacion porque esta en uso');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      definicion: '',
      orden: 0,
      color: '#3B82F6'
    });
  };

  const openNewModal = () => {
    setEditingTipificacion(null);
    resetForm();
    setShowModal(true);
  };

  // Drag and Drop handlers
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItem === null) return;
    if (index !== dragOverItem) {
      setDragOverItem(index);
    }
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === dropIndex) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    // Reordenar localmente
    const newTipificaciones = [...tipificaciones];
    const draggedItemData = newTipificaciones[draggedItem];
    newTipificaciones.splice(draggedItem, 1);
    newTipificaciones.splice(dropIndex, 0, draggedItemData);

    // Actualizar orden en el estado local
    const updatedTipificaciones = newTipificaciones.map((item, index) => ({
      ...item,
      orden: index
    }));

    setTipificaciones(updatedTipificaciones);
    setDraggedItem(null);
    setDragOverItem(null);

    // Guardar nuevo orden en el backend
    await saveNewOrder(updatedTipificaciones);
  };

  const saveNewOrder = async (items) => {
    setSavingOrder(true);
    try {
      // Actualizar cada tipificacion con su nuevo orden
      const promises = items.map((item, index) =>
        apiClient.put(`/crm/tipificaciones/${item.id}`, {
          nombre: item.nombre,
          definicion: item.definicion,
          orden: index,
          color: item.color
        })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('Error al guardar orden:', error);
      // Recargar datos si hay error
      loadData();
    } finally {
      setSavingOrder(false);
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
            <span className="text-gray-900">Tipificaciones</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Tipificaciones</h1>
          <p className="text-gray-600 mt-1">Arrastra para cambiar el orden de las tipificaciones</p>
        </div>
        <button
          onClick={openNewModal}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Nueva Tipificacion</span>
        </button>
      </div>

      {savingOrder && (
        <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm">Guardando orden...</span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 uppercase">
            <div className="col-span-1"></div>
            <div className="col-span-1">#</div>
            <div className="col-span-3">Nombre</div>
            <div className="col-span-4">Definicion</div>
            <div className="col-span-1">Color</div>
            <div className="col-span-2 text-right">Acciones</div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {tipificaciones.map((tipificacion, index) => (
            <div
              key={tipificacion.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              className={`grid grid-cols-12 gap-4 px-4 py-3 items-center transition-all cursor-move hover:bg-gray-50 ${
                dragOverItem === index ? 'bg-primary-50 border-t-2 border-primary-500' : ''
              } ${draggedItem === index ? 'opacity-50' : ''}`}
            >
              {/* Drag Handle */}
              <div className="col-span-1 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
              </div>

              {/* Orden */}
              <div className="col-span-1">
                <span className="text-sm font-medium text-gray-500">{index + 1}</span>
              </div>

              {/* Nombre */}
              <div className="col-span-3 flex items-center space-x-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: tipificacion.color || '#3B82F6' }}
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-900 truncate">{tipificacion.nombre}</span>
              </div>

              {/* Definicion */}
              <div className="col-span-4">
                <p className="text-sm text-gray-600 truncate">
                  {tipificacion.definicion || <span className="text-gray-400 italic">Sin definicion</span>}
                </p>
              </div>

              {/* Color */}
              <div className="col-span-1 flex items-center space-x-2">
                <div
                  className="w-6 h-6 rounded-full border border-gray-300"
                  style={{ backgroundColor: tipificacion.color || '#3B82F6' }}
                ></div>
              </div>

              {/* Acciones */}
              <div className="col-span-2 flex items-center justify-end space-x-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleEdit(tipificacion); }}
                  className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  title="Editar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(tipificacion.id); }}
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

        {tipificaciones.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay tipificaciones registradas
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingTipificacion ? 'Editar Tipificacion' : 'Nueva Tipificacion'}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Definicion</label>
                <textarea
                  value={formData.definicion}
                  onChange={(e) => setFormData({ ...formData, definicion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder="Descripcion o definicion del motivo..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="#3B82F6"
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {COLORES_PREDEFINIDOS.map((color) => (
                    <button
                      key={color.valor}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.valor })}
                      className={`w-8 h-8 rounded-full border-2 ${formData.color === color.valor ? 'border-gray-900' : 'border-transparent'}`}
                      style={{ backgroundColor: color.valor }}
                      title={color.nombre}
                    />
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
                  {editingTipificacion ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
