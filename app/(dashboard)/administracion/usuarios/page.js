'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

export default function UsuariosAdminPage() {
  const { data: session } = useSession();
  const [usuarios, setUsuarios] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    id_empresa: '',
    id_rol: '1',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmpresa, setFilterEmpresa] = useState('');

  // Estados para el searchable select de empresa
  const [empresaSearchTerm, setEmpresaSearchTerm] = useState('');
  const [showEmpresaDropdown, setShowEmpresaDropdown] = useState(false);
  const empresaDropdownRef = useRef(null);

  useEffect(() => {
    if (session?.accessToken) {
      fetchData();
    }
  }, [session?.accessToken]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (empresaDropdownRef.current && !empresaDropdownRef.current.contains(event.target)) {
        setShowEmpresaDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usuariosRes, empresasRes, rolesRes] = await Promise.all([
        apiClient.get('/crm/admin/usuarios'),
        apiClient.get('/crm/admin/empresas'),
        apiClient.get('/crm/roles')
      ]);
      setUsuarios(usuariosRes?.data || []);
      // Solo empresas activas para el select
      setEmpresas((empresasRes?.data || []).filter(e => e.estado_registro == 1));
      setRoles((rolesRes?.data || []).filter(r => r.estado_registro == 1));
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
        await apiClient.put(`/crm/admin/usuarios/${editingUsuario.id}`, {
          username: formData.username,
          password: formData.password || null,
          id_empresa: formData.id_empresa ? parseInt(formData.id_empresa) : 0,
          id_rol: formData.id_rol ? parseInt(formData.id_rol) : 1
        });
        setSuccess('Usuario actualizado correctamente');
      } else {
        if (!formData.password) {
          setError('La contraseña es requerida para nuevos usuarios');
          return;
        }
        await apiClient.post('/crm/admin/usuarios', {
          username: formData.username,
          password: formData.password,
          id_empresa: formData.id_empresa ? parseInt(formData.id_empresa) : 0,
          id_rol: formData.id_rol ? parseInt(formData.id_rol) : 1
        });
        setSuccess('Usuario creado correctamente');
      }
      setShowModal(false);
      setEditingUsuario(null);
      setFormData({ username: '', password: '', id_empresa: '', id_rol: '1' });
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
      id_empresa: usuario.id_empresa === 0 || usuario.id_empresa === '0' ? '' : (usuario.id_empresa?.toString() || ''),
      id_rol: usuario.id_rol?.toString() || '1',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estas seguro de eliminar este usuario?')) return;

    try {
      await apiClient.delete(`/crm/admin/usuarios/${id}`);
      setSuccess('Usuario eliminado correctamente');
      fetchData();
    } catch (error) {
      setError(error?.message || 'Error al eliminar usuario');
    }
  };

  const openNewModal = () => {
    setEditingUsuario(null);
    setFormData({ username: '', password: '', id_empresa: '', id_rol: '1' });
    setShowModal(true);
  };

  const getEmpresaNombre = (usuario) => {
    if (usuario.empresa_nombre) return usuario.empresa_nombre;
    if (!usuario.id_empresa || usuario.id_empresa === 0) return 'Administración Central';
    const empresa = empresas.find(e => e.id === usuario.id_empresa);
    return empresa?.nombre || 'Desconocida';
  };

  const getRolNombre = (usuario) => {
    if (usuario.rol_nombre) return usuario.rol_nombre;
    if (!usuario.id_rol) return 'Sin rol';
    const rol = roles.find(r => r.id === usuario.id_rol);
    return rol?.nombre || 'Desconocido';
  };

  // Obtener nombre de la empresa seleccionada para el filtro
  const getSelectedEmpresaName = () => {
    if (!filterEmpresa) return '';
    if (filterEmpresa === 'sin_empresa') return 'Administración Central';
    const empresa = empresas.find(e => e.id === parseInt(filterEmpresa));
    return empresa?.nombre || '';
  };

  // Filtrar empresas según búsqueda
  const filteredEmpresas = empresas.filter(empresa =>
    empresa.nombre?.toLowerCase().includes(empresaSearchTerm.toLowerCase())
  );

  // Seleccionar empresa del dropdown
  const handleSelectEmpresa = (value, nombre = '') => {
    setFilterEmpresa(value);
    setEmpresaSearchTerm(nombre);
    setShowEmpresaDropdown(false);
  };

  // Limpiar filtro de empresa
  const handleClearEmpresa = () => {
    setFilterEmpresa('');
    setEmpresaSearchTerm('');
  };

  // Filtrar usuarios: solo activos + busqueda + filtro por empresa
  const filteredUsuarios = usuarios.filter(usuario => {
    // Solo usuarios activos (comparación flexible para string o number)
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
            <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
            <p className="text-gray-600">Gestiona los usuarios del sistema</p>
          </div>
        </div>
        <button
          onClick={openNewModal}
          className="flex items-center space-x-2 px-4 py-2 text-white rounded-xl transition-all"
          style={{ background: 'linear-gradient(135deg, #14B8A6 0%, #06b6d4 100%)' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Nuevo Usuario</span>
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
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <div className="relative min-w-[250px]" ref={empresaDropdownRef}>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar empresa..."
            value={filterEmpresa ? getSelectedEmpresaName() : empresaSearchTerm}
            onChange={(e) => {
              setEmpresaSearchTerm(e.target.value);
              setFilterEmpresa('');
              setShowEmpresaDropdown(true);
            }}
            onFocus={() => setShowEmpresaDropdown(true)}
            className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
          />
          {filterEmpresa ? (
            <button
              type="button"
              onClick={handleClearEmpresa}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          )}
          {showEmpresaDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-auto">
              <button
                type="button"
                onClick={() => handleSelectEmpresa('', '')}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 text-gray-700"
              >
                Todas las empresas
              </button>
              <button
                type="button"
                onClick={() => handleSelectEmpresa('sin_empresa', 'Administración Central')}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 text-gray-600"
              >
                Administración Central
              </button>
              {filteredEmpresas.length > 0 ? (
                filteredEmpresas.map((empresa) => (
                  <button
                    key={empresa.id}
                    type="button"
                    onClick={() => handleSelectEmpresa(empresa.id.toString(), empresa.nombre)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 text-gray-900"
                  >
                    {empresa.nombre}
                  </button>
                ))
              ) : (
                <div className="px-4 py-2 text-gray-500 text-sm">No se encontraron empresas</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : filteredUsuarios.length === 0 ? (
          <div className="text-center p-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p className="text-gray-500">
              {searchTerm || filterEmpresa ? 'No se encontraron usuarios con esos filtros' : 'No hay usuarios registrados'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Usuario</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Rol</th>
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
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm" style={{ background: 'linear-gradient(135deg, #14B8A6 0%, #06b6d4 100%)' }}>
                        {usuario.username?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-900">{usuario.username}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                      {getRolNombre(usuario)}
                    </span>
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
                        className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
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
                {editingUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required={!editingUsuario}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                <select
                  value={formData.id_rol}
                  onChange={(e) => setFormData({ ...formData, id_rol: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                >
                  {roles
                    .filter((rol) => formData.id_empresa ? true : [1, 2].includes(rol.id))
                    .map((rol) => (
                      <option key={rol.id} value={rol.id}>
                        {rol.nombre}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                <select
                  value={formData.id_empresa}
                  onChange={(e) => setFormData({ ...formData, id_empresa: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                >
                  <option value="">Administración Central</option>
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
                  style={{ background: 'linear-gradient(135deg, #14B8A6 0%, #06b6d4 100%)' }}
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
