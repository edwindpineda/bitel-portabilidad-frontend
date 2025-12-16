'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/api';

export default function PerfilPage() {
  const { data: session } = useSession();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [userData, setUserData] = useState({
    username: '',
    rol_nombre: '',
  });

  useEffect(() => {
    if (session?.user) {
      setUserData({
        username: session.user.username || '',
        rol_nombre: session.user.rol_nombre || '',
      });
    }
  }, [session]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('Todos los campos son obligatorios');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return;
    }

    try {
      const userId = session?.user?.id;
      if (!userId) {
        setPasswordError('No se pudo identificar al usuario');
        return;
      }

      await apiClient.put(`/crm/usuarios/${userId}/password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setPasswordSuccess('Contraseña actualizada correctamente');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });

      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (error) {
      setPasswordError(error.msg || 'Error al cambiar la contraseña');
    }
  };

  const openPasswordModal = () => {
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPasswordError('');
    setPasswordSuccess('');
    setShowPasswordModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-600 mt-2">Información de tu cuenta</p>
        </div>

        {/* Card Principal */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Avatar y nombre */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-3xl font-bold text-blue-600">
                {userData.username?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-2xl font-bold">@{userData.username || 'Usuario'}</h2>
                <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-sm">
                  {userData.rol_nombre || 'Sin rol'}
                </span>
              </div>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">Usuario</span>
                <span className="font-medium text-gray-900">@{userData.username}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-600">Rol</span>
                <span className="font-medium text-gray-900">{userData.rol_nombre}</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={openPasswordModal}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Cambiar contraseña
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Cambiar Contraseña */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Cambiar Contraseña</h2>

            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {passwordSuccess}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña Actual *
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingresa tu contraseña actual"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nueva Contraseña *
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Nueva Contraseña *
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Repite la nueva contraseña"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Cambiar Contraseña
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
