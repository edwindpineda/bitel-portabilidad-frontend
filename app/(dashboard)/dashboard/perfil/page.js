'use client';

import { useState, useEffect } from 'react';

export default function PerfilPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    empresa: '',
    cargo: '',
  });

  useEffect(() => {
    // Obtener datos del usuario desde localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setFormData({
        nombre: user.nombre || user.username || '',
        email: user.email || '',
        telefono: user.telefono || '',
        empresa: user.empresa || '',
        cargo: user.cargo || '',
      });
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      // Aquí iría la llamada a tu API para actualizar el perfil
      console.log('Perfil actualizado:', formData);
      setIsEditing(false);
      // Mostrar toast de éxito
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-600 mt-2">Gestiona tu información personal</p>
        </div>

        {/* Card Principal */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Avatar y nombre */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-3xl font-bold text-blue-600">
                {formData.nombre?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{formData.nombre || 'Usuario'}</h2>
                <p className="text-blue-100">{formData.email}</p>
              </div>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-8">
            {isEditing ? (
              // Modo edición
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="Tu nombre"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="tu@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="+51 900 000 000"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Empresa
                    </label>
                    <input
                      type="text"
                      name="empresa"
                      value={formData.empresa}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      placeholder="Nombre empresa"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cargo
                    </label>
                    <input
                      type="text"
                      name="cargo"
                      value={formData.cargo}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      placeholder="Tu cargo"
                    />
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSave}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    Guardar cambios
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              // Modo visualización
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Nombre</p>
                    <p className="text-lg font-semibold text-gray-900">{formData.nombre || 'No especificado'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <p className="text-lg font-semibold text-gray-900">{formData.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Teléfono</p>
                    <p className="text-lg font-semibold text-gray-900">{formData.telefono || 'No especificado'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Empresa</p>
                    <p className="text-lg font-semibold text-gray-900">{formData.empresa || 'No especificado'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Cargo</p>
                  <p className="text-lg font-semibold text-gray-900">{formData.cargo || 'No especificado'}</p>
                </div>

                <div className="flex gap-3 pt-4 border-t pt-6">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    Editar perfil
                  </button>
                  <button className="flex-1 bg-red-50 text-red-600 py-2 px-4 rounded-lg hover:bg-red-100 transition font-medium">
                    Cambiar contraseña
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Secciones adicionales */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Seguridad */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                🔒
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Seguridad</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">Última sesión activa hace 2 horas</p>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Ver sesiones activas →
            </button>
          </div>

          {/* Preferencias */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                ⚙️
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Preferencias</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">Notificaciones por email habilitadas</p>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Configurar notificaciones →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

