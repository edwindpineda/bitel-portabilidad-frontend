'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

const COLORES_PREDEFINIDOS = [
  { nombre: 'Rojo', valor: '#EF4444' },
  { nombre: 'Naranja', valor: '#F97316' },
  { nombre: 'Amarillo', valor: '#EAB308' },
  { nombre: 'Verde', valor: '#22C55E' },
  { nombre: 'Azul', valor: '#3B82F6' },
  { nombre: 'Indigo', valor: '#6366F1' },
  { nombre: 'Cyan', valor: '#06B6D4' },
  { nombre: 'Teal', valor: '#14B8A6' },
  { nombre: 'Gris', valor: '#6B7280' },
];

// Mapeo de nombres de colores a códigos hex
const COLOR_MAP = {
  'rojo': '#EF4444',
  'naranja': '#F97316',
  'amarillo': '#EAB308',
  'verde': '#22C55E',
  'azul': '#3B82F6',
  'indigo': '#6366F1',
  'cyan': '#06B6D4',
  'teal': '#14B8A6',
  'gris': '#6B7280',
  'morado': '#A855F7',
  'rosa': '#EC4899',
};

// Función para obtener el color hex (soporta nombres y códigos hex)
const getColorHex = (color) => {
  if (!color) return '#6B7280';
  if (color.startsWith('#')) return color;
  return COLOR_MAP[color.toLowerCase()] || '#6B7280';
};

export default function EstadosPage() {
  const [estados, setEstados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEstado, setEditingEstado] = useState(null);
  const [selectedColor, setSelectedColor] = useState('#3B82F6');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/crm/estados');
      setEstados(response.data || []);
    } catch (error) {
      console.error('Error al cargar estados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.patch(`/crm/estados/${editingEstado.id}/color`, { color: selectedColor });
      setShowModal(false);
      setEditingEstado(null);
      loadData();
    } catch (error) {
      console.error('Error al actualizar color:', error);
      alert(error.msg || 'Error al actualizar color');
    }
  };

  const handleEditColor = (estado) => {
    setEditingEstado(estado);
    setSelectedColor(getColorHex(estado.color));
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
      <div className="mb-6">
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
          <Link href="/configuracion" className="hover:text-primary-600">Configuracion</Link>
          <span>/</span>
          <span className="text-gray-900">Estados</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Estados</h1>
        <p className="text-gray-600 mt-1">Configura los colores de los estados del sistema</p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm text-yellow-800">
              <strong>Nota:</strong> Solo puedes editar el color de los estados. No es posible agregar o eliminar estados del sistema.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {estados.map((estado) => (
          <div key={estado.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: getColorHex(estado.color) }}
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <button
                onClick={() => handleEditColor(estado)}
                className="text-gray-400 hover:text-primary-600 flex items-center space-x-1"
                title="Editar color"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                <span className="text-sm">Color</span>
              </button>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{estado.nombre}</h3>
            <div className="flex items-center space-x-2">
              <div
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: getColorHex(estado.color) }}
              ></div>
              <span className="text-sm text-gray-500">{estado.color || 'Sin color'}</span>
            </div>
          </div>
        ))}
      </div>

      {estados.length === 0 && (
        <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-gray-200">
          No hay estados registrados
        </div>
      )}

      {showModal && editingEstado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Editar Color - {editingEstado.nombre}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    placeholder="#3B82F6"
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {COLORES_PREDEFINIDOS.map((color) => (
                    <button
                      key={color.valor}
                      type="button"
                      onClick={() => setSelectedColor(color.valor)}
                      className={`w-8 h-8 rounded-full border-2 ${selectedColor === color.valor ? 'border-gray-900' : 'border-transparent'}`}
                      style={{ backgroundColor: color.valor }}
                      title={color.nombre}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Vista previa:</p>
                <span
                  className="px-3 py-1 text-sm font-semibold rounded-full text-white"
                  style={{ backgroundColor: selectedColor }}
                >
                  {editingEstado.nombre}
                </span>
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
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
