'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [supervisores, setSupervisores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    id_rol: '',
    id_sucursal: '',
    id_padre: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usuariosRes, rolesRes, sucursalesRes, supervisoresRes] = await Promise.all([
        apiClient.get('/crm/usuarios'),
        apiClient.get('/crm/roles'),
        apiClient.get('/crm/sucursales'),
        apiClient.get('/crm/usuarios/rol/2')
      ]);
      setUsuarios(usuariosRes.data || []);
      setRoles(rolesRes.data || []);
      setSucursales(sucursalesRes.data || []);
      setSupervisores(supervisoresRes.data || []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validar que si es rol 3 (Asesor), debe tener coordinador
    if (String(formData.id_rol) === '3' && !formData.id_padre) {
      alert('Debe seleccionar un coordinador para el rol Asesor');
      return;
    }

    try {
      if (editingUser) {
        await apiClient.put(`/crm/usuarios/${editingUser.id}`, formData);
      } else {
        await apiClient.post('/crm/usuarios', formData);
      }
      setShowModal(false);
      setEditingUser(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      alert(error.msg || 'Error al guardar usuario');
    }
  };

  const handleEdit = (usuario) => {
    setEditingUser(usuario);
    setFormData({
      username: usuario.username || '',
      password: '',
      id_rol: usuario.id_rol || '',
      id_sucursal: usuario.id_sucursal || '',
      id_padre: usuario.id_padre || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Está seguro de eliminar este usuario?')) {
      try {
        await apiClient.delete(`/crm/usuarios/${id}`);
        loadData();
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      id_rol: '',
      id_sucursal: '',
      id_padre: ''
    });
  };

  const handleRolChange = (e) => {
    const newRol = e.target.value;
    setFormData({
      ...formData,
      id_rol: newRol,
      id_sucursal: newRol === '3' ? formData.id_sucursal : '',
      id_padre: newRol === '3' ? formData.id_padre : ''
    });
  };

  const openNewModal = () => {
    setEditingUser(null);
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
            <span className="text-gray-900">Usuarios</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-600 mt-1">Gestiona los usuarios del sistema</p>
        </div>
        <button
          onClick={openNewModal}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Nuevo Usuario</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sucursal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coordinador</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {usuarios.map((usuario) => (
              <tr key={usuario.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">@{usuario.username}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    {usuario.rol_nombre}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {usuario.sucursal_nombre ? (
                    <span className="text-sm text-gray-900">{usuario.sucursal_nombre}</span>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {usuario.padre_username ? (
                    <span className="text-sm text-gray-900">@{usuario.padre_username}</span>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {usuario.id_rol !== 1 ? (
                    <>
                      <button onClick={() => handleEdit(usuario)} className="text-primary-600 hover:text-primary-900 mr-3">Editar</button>
                      <button onClick={() => handleDelete(usuario.id)} className="text-red-600 hover:text-red-900">Eliminar</button>
                    </>
                  ) : (
                    <span className="text-gray-400 text-xs">Protegido</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {usuarios.length === 0 && (
          <div className="text-center py-8 text-gray-500">No hay usuarios registrados</div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingUser ? 'Nueva Contraseña (dejar vacío para mantener)' : 'Contraseña *'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  required={!editingUser}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                <select
                  value={formData.id_rol}
                  onChange={handleRolChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Seleccionar rol</option>
                  {roles.map((rol) => (
                    <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                  ))}
                </select>
              </div>
              {String(formData.id_rol) === '3' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
                    <select
                      value={formData.id_sucursal}
                      onChange={(e) => setFormData({ ...formData, id_sucursal: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Seleccionar sucursal</option>
                      {sucursales.map((sucursal) => (
                        <option key={sucursal.id} value={sucursal.id}>{sucursal.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Coordinador *</label>
                    <select
                      value={formData.id_padre}
                      onChange={(e) => setFormData({ ...formData, id_padre: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                      required
                    >
                      <option value="">Seleccionar coordinador</option>
                      {supervisores.map((supervisor) => (
                        <option key={supervisor.id} value={supervisor.id}>{supervisor.username}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
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
                  {editingUser ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
