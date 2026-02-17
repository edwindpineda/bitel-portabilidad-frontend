'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

export default function UsuariosAdminPage() {
  const { data: session } = useSession();
  const [usuarios, setUsuarios] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    id_empresa: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmpresa, setFilterEmpresa] = useState('');

  useEffect(() => {
    if (session?.accessToken) {
      fetchData();
    }
  }, [session?.accessToken]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usuariosRes, empresasRes] = await Promise.all([
        apiClient.get('/admin/usuarios'),
        apiClient.get('/admin/empresas')
      ]);
      setUsuarios(usuariosRes?.data || []);
      // Solo empresas activas para el select
      setEmpresas((empresasRes?.data || []).filter(e => e.estado_registro === 1));
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingUsuario) {
        await apiClient.put(`/admin/usuarios/${editingUsuario.id}`, {
          username: formData.username,
          password: formData.password || null,
          id_empresa: formData.id_empresa ? parseInt(formData.id_empresa) : null
        });
        setSuccess('Usuario actualizado correctamente');
      } else {
        if (!formData.password) {
          setError('La contraseña es requerida para nuevos usuarios');
          return;
        }
        await apiClient.post('/admin/usuarios', {
          username: formData.username,
          password: formData.password,
          id_empresa: formData.id_empresa ? parseInt(formData.id_empresa) : null
        });
        setSuccess('Usuario creado correctamente');
      }
      setShowModal(false);
      setEditingUsuario(null);
      setFormData({ username: '', password: '', id_empresa: '' });
      fetchData();
    } catch (error) {
      setError(error?.message || 'Error al guardar usuario');
    }
  };

  const handleEdit = (usuario) => {
    setEditingUsuario(usuario);
    setFormData({
      username: usuario.username || '',
      password: '',
      id_empresa: usuario.id_empresa?.toString() || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estas seguro de eliminar este usuario?')) return;

    try {
      await apiClient.delete(`/admin/usuarios/${id}`);
      setSuccess('Usuario eliminado correctamente');
      fetchData();
    } catch (error) {
      setError(error?.message || 'Error al eliminar usuario');
    }
  };

  const openNewModal = () => {
    setEditingUsuario(null);
    setFormData({ username: '', password: '', id_empresa: '' });
    setShowModal(true);
  };

  const getEmpresaNombre = (usuario) => {
    if (usuario.empresa_nombre) return usuario.empresa_nombre;
    if (!usuario.id_empresa) return 'Sin empresa';
    const empresa = empresas.find(e => e.id === usuario.id_empresa);
    return empresa?.nombre || 'Desconocida';
  };

  // Filtrar usuarios: solo activos + busqueda + filtro por empresa
  const filteredUsuarios = usuarios.filter(usuario => {
    // Solo usuarios activos (comparar como string y numero)
    if (usuario.estado_registro != 1) return false;

    // Filtro por busqueda de texto
    if (searchTerm && !usuario.username?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }

    // Filtro por empresa
    if (filterEmpresa) {
      if (filterEmpresa === 'sin_empresa') {
        if (usuario.id_empresa) return false;
      } else {
        if (usuario.id_empresa !== parseInt(filterEmpresa)) return false;
      }
    }

    return true;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Link href="/administracion" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Administradores</h1>
            <p className="text-gray-600">Gestiona los administradores de empresas</p>
          </div>
        </div>
        <button
          onClick={openNewModal}
          className="flex items-center space-x-2 px-4 py-2 text-white rounded-xl transition-all"
          style={{ background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Nuevo Administrador</span>
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
          {success}
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar por username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterEmpresa}
          onChange={(e) => setFilterEmpresa(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white min-w-[200px]"
        >
          <option value="">Todas las empresas</option>
          <option value="sin_empresa">Sin empresa</option>
          {empresas.map((empresa) => (
            <option key={empresa.id} value={empresa.id}>
              {empresa.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredUsuarios.length === 0 ? (
          <div className="text-center p-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className="text-gray-500">
              {searchTerm || filterEmpresa ? 'No se encontraron administradores con esos filtros' : 'No hay administradores registrados'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Usuario</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Empresa</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsuarios.map((usuario) => (
                <tr key={usuario.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{usuario.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)' }}>
                        {usuario.username?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-900">{usuario.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      usuario.id_empresa
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {getEmpresaNombre(usuario)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(usuario)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(usuario.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editingUsuario ? 'Editar Administrador' : 'Nuevo Administrador'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña {editingUsuario ? '(dejar vacio para mantener)' : '*'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required={!editingUsuario}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                <select
                  value={formData.id_empresa}
                  onChange={(e) => setFormData({ ...formData, id_empresa: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Sin empresa asignada</option>
                  {empresas.map((empresa) => (
                    <option key={empresa.id} value={empresa.id}>
                      {empresa.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-white rounded-xl transition-all"
                  style={{ background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)' }}
                >
                  {editingUsuario ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
