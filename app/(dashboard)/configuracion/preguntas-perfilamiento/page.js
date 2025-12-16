'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

export default function PreguntasPerfilamientoPage() {
  const [preguntas, setPreguntas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPregunta, setEditingPregunta] = useState(null);
  const [formData, setFormData] = useState({
    pregunta: '',
    orden: 0
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
      const response = await apiClient.get('/crm/preguntas-perfilamiento');
      setPreguntas(response.data || []);
    } catch (error) {
      console.error('Error al cargar preguntas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPregunta) {
        await apiClient.put(`/crm/preguntas-perfilamiento/${editingPregunta.id}`, formData);
      } else {
        const maxOrden = preguntas.length > 0
          ? Math.max(...preguntas.map(p => p.orden || 0))
          : -1;
        await apiClient.post('/crm/preguntas-perfilamiento', { ...formData, orden: maxOrden + 1 });
      }
      setShowModal(false);
      setEditingPregunta(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error al guardar pregunta:', error);
      alert(error.msg || 'Error al guardar pregunta');
    }
  };

  const handleEdit = (pregunta) => {
    setEditingPregunta(pregunta);
    setFormData({
      pregunta: pregunta.pregunta || '',
      orden: pregunta.orden || 0
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Esta seguro de eliminar esta pregunta?')) {
      try {
        await apiClient.delete(`/crm/preguntas-perfilamiento/${id}`);
        loadData();
      } catch (error) {
        console.error('Error al eliminar pregunta:', error);
        alert('No se puede eliminar la pregunta');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      pregunta: '',
      orden: 0
    });
  };

  const openNewModal = () => {
    setEditingPregunta(null);
    resetForm();
    setShowModal(true);
  };

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

    const newPreguntas = [...preguntas];
    const draggedItemData = newPreguntas[draggedItem];
    newPreguntas.splice(draggedItem, 1);
    newPreguntas.splice(dropIndex, 0, draggedItemData);

    const updatedPreguntas = newPreguntas.map((item, index) => ({
      ...item,
      orden: index
    }));

    setPreguntas(updatedPreguntas);
    setDraggedItem(null);
    setDragOverItem(null);

    await saveNewOrder(updatedPreguntas);
  };

  const saveNewOrder = async (items) => {
    setSavingOrder(true);
    try {
      const promises = items.map((item, index) =>
        apiClient.put(`/crm/preguntas-perfilamiento/${item.id}`, {
          pregunta: item.pregunta,
          orden: index
        })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('Error al guardar orden:', error);
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
            <span className="text-gray-900">Preguntas de Perfilamiento</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Preguntas de Perfilamiento</h1>
          <p className="text-gray-600 mt-1">Arrastra para cambiar el orden de las preguntas</p>
        </div>
        <button
          onClick={openNewModal}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Nueva Pregunta</span>
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
            <div className="col-span-8">Pregunta</div>
            <div className="col-span-2 text-right">Acciones</div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {preguntas.map((pregunta, index) => (
            <div
              key={pregunta.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              className={`grid grid-cols-12 gap-4 px-4 py-3 items-center transition-all cursor-move hover:bg-gray-50 ${
                dragOverItem === index ? 'bg-primary-50 border-t-2 border-primary-500' : ''
              } ${draggedItem === index ? 'opacity-50' : ''}`}
            >
              <div className="col-span-1 flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
              </div>

              <div className="col-span-1">
                <span className="text-sm font-medium text-gray-500">{index + 1}</span>
              </div>

              <div className="col-span-8">
                <p className="text-sm text-gray-900">{pregunta.pregunta}</p>
              </div>

              <div className="col-span-2 flex items-center justify-end space-x-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleEdit(pregunta); }}
                  className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  title="Editar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(pregunta.id); }}
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

        {preguntas.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay preguntas de perfilamiento registradas
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingPregunta ? 'Editar Pregunta' : 'Nueva Pregunta'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pregunta *</label>
                <textarea
                  value={formData.pregunta}
                  onChange={(e) => setFormData({ ...formData, pregunta: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  required
                  placeholder="Escribe la pregunta de perfilamiento..."
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
                  {editingPregunta ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
