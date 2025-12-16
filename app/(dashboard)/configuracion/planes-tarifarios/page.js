'use client';

import { useState, useEffect } from 'react';
import { apiClient, API_BASE_URL } from '@/lib/api';
import Link from 'next/link';

// Helper para construir URL completa de imagen
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL}${url}`;
};

export default function PlanesTarifariosPage() {
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    precio_regular: '',
    precio_promocional: '',
    descripcion: '',
    principal: 1,
    imagen_url: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/crm/planes-tarifarios');
      setPlanes(response.data || []);
    } catch (error) {
      console.error('Error al cargar planes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Crear FormData para enviar archivo
      const submitData = new FormData();
      submitData.append('nombre', formData.nombre);
      submitData.append('precio_regular', parseFloat(formData.precio_regular));
      if (formData.precio_promocional) {
        submitData.append('precio_promocional', parseFloat(formData.precio_promocional));
      }
      if (formData.descripcion) {
        submitData.append('descripcion', formData.descripcion);
      }
      submitData.append('principal', formData.principal ? 1 : 0);

      // Si hay archivo seleccionado, agregarlo
      if (selectedFile) {
        submitData.append('imagen', selectedFile);
      } else if (formData.imagen_url) {
        submitData.append('imagen_url', formData.imagen_url);
      }

      if (editingPlan) {
        await apiClient.put(`/crm/planes-tarifarios/${editingPlan.id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await apiClient.post('/crm/planes-tarifarios', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setShowModal(false);
      setEditingPlan(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error al guardar plan:', error);
      alert(error.msg || 'Error al guardar plan');
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      nombre: plan.nombre || '',
      precio_regular: plan.precio_regular || '',
      precio_promocional: plan.precio_promocional || '',
      descripcion: plan.descripcion || '',
      principal: plan.principal ? 1 : 0,
      imagen_url: plan.imagen_url || ''
    });
    setSelectedFile(null);
    setFilePreview(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Está seguro de eliminar este plan tarifario?')) {
      try {
        await apiClient.delete(`/crm/planes-tarifarios/${id}`);
        loadData();
      } catch (error) {
        console.error('Error al eliminar plan:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      precio_regular: '',
      precio_promocional: '',
      descripcion: '',
      principal: 1,
      imagen_url: ''
    });
    setSelectedFile(null);
    setFilePreview(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const openNewModal = () => {
    setEditingPlan(null);
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
            <span className="text-gray-900">Planes Tarifarios</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Planes Tarifarios</h1>
          <p className="text-gray-600 mt-1">Gestiona los planes y precios de Bitel</p>
        </div>
        <button
          onClick={openNewModal}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Nuevo Plan</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {planes.map((plan) => (
          <div key={plan.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Imagen del plan */}
            {plan.imagen_url ? (
              <div
                className="w-full h-40 bg-gray-100 cursor-pointer relative group"
                onClick={() => setImagePreview({ url: getImageUrl(plan.imagen_url), nombre: plan.nombre })}
              >
                <img
                  src={getImageUrl(plan.imagen_url)}
                  alt={plan.nombre}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden w-full h-full items-center justify-center bg-gray-100">
                  <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                {/* Overlay con icono de expandir */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </div>
            ) : (
              <div className="w-full h-40 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <svg className="w-16 h-16 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            )}

            <div className="p-5">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{plan.nombre}</h3>
                <div className="flex space-x-1">
                  <button onClick={() => handleEdit(plan)} className="p-1 text-gray-400 hover:text-primary-600 rounded">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(plan.id)} className="p-1 text-gray-400 hover:text-red-600 rounded">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex items-baseline space-x-2 mb-2">
                <span className="text-2xl font-bold text-primary-600">S/ {parseFloat(plan.precio_regular).toFixed(2)}</span>
                {plan.precio_promocional && (
                  <span className="text-sm text-green-600 font-medium">S/ {parseFloat(plan.precio_promocional).toFixed(2)} promo</span>
                )}
              </div>
              {plan.descripcion && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{plan.descripcion}</p>
              )}
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${plan.principal ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {plan.principal ? 'Plan Principal' : 'Plan Secundario'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {planes.length === 0 && (
        <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-gray-200">
          No hay planes tarifarios registrados
        </div>
      )}

      {/* Modal para ver imagen completa */}
      {imagePreview && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setImagePreview(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            {/* Boton cerrar */}
            <button
              onClick={() => setImagePreview(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {/* Titulo */}
            <h3 className="text-white text-lg font-medium mb-3">{imagePreview.nombre}</h3>
            {/* Imagen */}
            <img
              src={imagePreview.url}
              alt={imagePreview.nombre}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingPlan ? 'Editar Plan Tarifario' : 'Nuevo Plan Tarifario'}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio Regular (S/) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.precio_regular}
                    onChange={(e) => setFormData({ ...formData, precio_regular: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio Promocional (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.precio_promocional}
                    onChange={(e) => setFormData({ ...formData, precio_promocional: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imagen del Plan</label>

                {/* Preview de imagen */}
                {(filePreview || (editingPlan && formData.imagen_url)) && (
                  <div className="mb-3 relative">
                    <img
                      src={filePreview || getImageUrl(formData.imagen_url)}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setFilePreview(null);
                        setFormData({ ...formData, imagen_url: '' });
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Input de archivo */}
                <div className="flex items-center space-x-2">
                  <label className="flex-1 cursor-pointer">
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 flex items-center justify-center space-x-2">
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-gray-600">
                        {selectedFile ? selectedFile.name : 'Examinar...'}
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">Formatos: JPG, PNG, GIF, WEBP. Máx: 5MB</p>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="principal"
                  checked={formData.principal}
                  onChange={(e) => setFormData({ ...formData, principal: e.target.checked ? 1 : 0 })}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="principal" className="text-sm text-gray-700">Plan principal</label>
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
                  {editingPlan ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
