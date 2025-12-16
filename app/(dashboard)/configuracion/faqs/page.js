'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

const PROCESOS = [
  'Contacto',
  'Toma de datos',
  'Oferta',
  'Cierre de ventas',
  'Cierre de ventas (Contrato)',
  'Aceptación'
];

export default function FaqsPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [filtroProces, setFiltroProceso] = useState('');
  const [formData, setFormData] = useState({
    numero: '',
    pregunta: '',
    proceso: 'Contacto',
    respuesta: '',
    activo: 1
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/crm/faqs');
      setFaqs(response.data || []);
    } catch (error) {
      console.error('Error al cargar FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        numero: parseInt(formData.numero) || 0,
        activo: formData.activo ? 1 : 0
      };

      if (editingFaq) {
        await apiClient.put(`/crm/faqs/${editingFaq.id}`, dataToSend);
      } else {
        await apiClient.post('/crm/faqs', dataToSend);
      }
      setShowModal(false);
      setEditingFaq(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error al guardar FAQ:', error);
      alert(error.msg || 'Error al guardar pregunta frecuente');
    }
  };

  const handleEdit = (faq) => {
    setEditingFaq(faq);
    setFormData({
      numero: faq.numero || '',
      pregunta: faq.pregunta || '',
      proceso: faq.proceso || 'Contacto',
      respuesta: faq.respuesta || '',
      activo: faq.activo ? 1 : 0
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Está seguro de eliminar esta pregunta frecuente?')) {
      try {
        await apiClient.delete(`/crm/faqs/${id}`);
        loadData();
      } catch (error) {
        console.error('Error al eliminar FAQ:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      numero: '',
      pregunta: '',
      proceso: 'Contacto',
      respuesta: '',
      activo: 1
    });
  };

  const openNewModal = () => {
    setEditingFaq(null);
    resetForm();
    setShowModal(true);
  };

  const filteredFaqs = filtroProces
    ? faqs.filter(faq => faq.proceso === filtroProces)
    : faqs;

  const getProcesoColor = (proceso) => {
    const colors = {
      'Contacto': 'bg-blue-100 text-blue-800',
      'Toma de datos': 'bg-purple-100 text-purple-800',
      'Oferta': 'bg-yellow-100 text-yellow-800',
      'Cierre de ventas': 'bg-green-100 text-green-800',
      'Cierre de ventas (Contrato)': 'bg-emerald-100 text-emerald-800',
      'Aceptación': 'bg-indigo-100 text-indigo-800'
    };
    return colors[proceso] || 'bg-gray-100 text-gray-800';
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
            <span className="text-gray-900">Preguntas Frecuentes</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Preguntas Frecuentes</h1>
          <p className="text-gray-600 mt-1">Gestiona las FAQs de portabilidad Bitel</p>
        </div>
        <button
          onClick={openNewModal}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Nueva FAQ</span>
        </button>
      </div>

      {/* Filtro por proceso */}
      <div className="mb-4">
        <select
          value={filtroProces}
          onChange={(e) => setFiltroProceso(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">Todos los procesos</option>
          {PROCESOS.map((proceso) => (
            <option key={proceso} value={proceso}>{proceso}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pregunta</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proceso</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredFaqs.map((faq) => (
              <tr key={faq.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{faq.numero}</td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 line-clamp-2">{faq.pregunta}</div>
                  <div className="text-sm text-gray-500 line-clamp-1 mt-1">{faq.respuesta}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getProcesoColor(faq.proceso)}`}>
                    {faq.proceso}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${faq.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {faq.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleEdit(faq)} className="text-primary-600 hover:text-primary-900 mr-3">
                    Editar
                  </button>
                  <button onClick={() => handleDelete(faq.id)} className="text-red-600 hover:text-red-900">
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredFaqs.length === 0 && (
        <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-gray-200 mt-4">
          No hay preguntas frecuentes registradas
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingFaq ? 'Editar Pregunta Frecuente' : 'Nueva Pregunta Frecuente'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número *</label>
                  <input
                    type="number"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proceso *</label>
                  <select
                    value={formData.proceso}
                    onChange={(e) => setFormData({ ...formData, proceso: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    {PROCESOS.map((proceso) => (
                      <option key={proceso} value={proceso}>{proceso}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pregunta *</label>
                <textarea
                  value={formData.pregunta}
                  onChange={(e) => setFormData({ ...formData, pregunta: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Respuesta *</label>
                <textarea
                  value={formData.respuesta}
                  onChange={(e) => setFormData({ ...formData, respuesta: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  rows={5}
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="activo"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked ? 1 : 0 })}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="activo" className="text-sm text-gray-700">FAQ activa</label>
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
                  {editingFaq ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
