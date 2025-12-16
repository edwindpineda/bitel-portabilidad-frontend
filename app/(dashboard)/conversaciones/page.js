'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

const CONTACTS_PER_PAGE = 20;
const SEARCH_DEBOUNCE_MS = 500;

// Funcion para formatear fecha relativa
const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins}m`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays < 7) return `Hace ${diffDays}d`;
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
};

export default function ConversacionesPage() {
  const [contactos, setContactos] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [offset, setOffset] = useState(0);
  const [totalContactos, setTotalContactos] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Estados y tipificaciones para filtros
  const [estados, setEstados] = useState([]);
  const [tipificaciones, setTipificaciones] = useState([]);
  const [selectedEstado, setSelectedEstado] = useState('');
  const [selectedTipificacion, setSelectedTipificacion] = useState('');

  // Construir query params para filtros
  const buildFilterParams = (estadoId, tipificacionId) => {
    const params = new URLSearchParams();
    if (estadoId) params.append('id_estado', estadoId);
    if (tipificacionId) params.append('id_tipificacion', tipificacionId);
    return params.toString() ? `?${params.toString()}` : '';
  };

  // Cargar datos desde la API
  const loadConversations = async (currentOffset = 0, append = false, estadoId = selectedEstado, tipificacionId = selectedTipificacion) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const filterParams = buildFilterParams(estadoId, tipificacionId);
      const response = await apiClient.get(`/crm/contactos/${currentOffset}${filterParams}`);

      const contactosArray = response.data || [];
      const total = response.total || 0;

      console.log('Contactos cargados:', contactosArray);

      if (append) {
        setContactos(prev => [...prev, ...contactosArray]);
      } else {
        setContactos(contactosArray);
      }

      setTotalContactos(total);
      setHasMore(currentOffset + contactosArray.length < total);

    } catch (err) {
      console.error('Error al cargar conversaciones:', err);
      setError('No se pudo cargar los contactos');
      if (!append) {
        setContactos([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Cargar estados y tipificaciones (sin usar apiClient para evitar logout en 401)
  const loadFiltersData = async () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3020/api';

    // Obtener el token de la sesión
    let token = null;
    try {
      const { getSession } = await import('next-auth/react');
      const session = await getSession();
      token = session?.accessToken;
    } catch (err) {
      console.error('Error al obtener sesión:', err);
    }

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    // Cargar estados
    try {
      const response = await fetch(`${API_URL}/crm/estados`, { headers });
      if (response.ok) {
        const data = await response.json();
        setEstados(data.data || []);
      }
    } catch (err) {
      console.error('Error al cargar estados:', err);
    }

    // Cargar tipificaciones
    try {
      const response = await fetch(`${API_URL}/crm/tipificaciones`, { headers });
      if (response.ok) {
        const data = await response.json();
        setTipificaciones(data.data || []);
      }
    } catch (err) {
      console.error('Error al cargar tipificaciones:', err);
    }
  };

  useEffect(() => {
    loadFiltersData();
    loadConversations(0);
  }, []);

  // Cargar mas contactos
  const handleLoadMore = () => {
    const newOffset = offset + CONTACTS_PER_PAGE;
    setOffset(newOffset);
    if (searchQuery.trim()) {
      searchContacts(searchQuery, newOffset, true);
    } else {
      loadConversations(newOffset, true);
    }
  };

  // Buscar contactos
  const searchContacts = async (query, currentOffset = 0, append = false, estadoId = selectedEstado, tipificacionId = selectedTipificacion) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setIsSearching(true);
      }
      setError(null);

      let url = `/crm/contactos/buscar/${encodeURIComponent(query)}?offset=${currentOffset}`;
      if (estadoId) url += `&id_estado=${estadoId}`;
      if (tipificacionId) url += `&id_tipificacion=${tipificacionId}`;

      const response = await apiClient.get(url);

      const contactosArray = response.data || [];
      const total = response.total || 0;

      if (append) {
        setContactos(prev => [...prev, ...contactosArray]);
      } else {
        setContactos(contactosArray);
      }

      setTotalContactos(total);
      setHasMore(currentOffset + contactosArray.length < total);

    } catch (err) {
      console.error('Error al buscar contactos:', err);
      setError('No se pudo buscar contactos');
      if (!append) {
        setContactos([]);
      }
    } finally {
      setIsSearching(false);
      setLoadingMore(false);
    }
  };

  // Manejar cambio en busqueda con debounce
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Limpiar timeout anterior
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Nuevo timeout para debounce
    const timeout = setTimeout(() => {
      setOffset(0);
      if (value.trim()) {
        searchContacts(value.trim(), 0);
      } else {
        loadConversations(0);
      }
    }, SEARCH_DEBOUNCE_MS);

    setSearchTimeout(timeout);
  };

  // Limpiar busqueda
  const clearSearch = () => {
    setSearchQuery('');
    setOffset(0);
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    loadConversations(0);
  };

  // Manejar cambio de filtros
  const handleFilterChange = (filterType, value) => {
    setOffset(0);
    const newEstado = filterType === 'estado' ? value : selectedEstado;
    const newTipificacion = filterType === 'tipificacion' ? value : selectedTipificacion;

    if (filterType === 'estado') {
      setSelectedEstado(value);
    } else {
      setSelectedTipificacion(value);
    }

    if (searchQuery.trim()) {
      searchContacts(searchQuery.trim(), 0, false, newEstado, newTipificacion);
    } else {
      loadConversations(0, false, newEstado, newTipificacion);
    }
  };

  // Limpiar todos los filtros
  const clearFilters = () => {
    setSelectedEstado('');
    setSelectedTipificacion('');
    setSearchQuery('');
    setOffset(0);
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    loadConversations(0, false, '', '');
  };

  // Cargar mensajes del chat seleccionado desde tabla mensaje
  const handleSelectChat = async (contacto) => {
    setSelectedChat(contacto);
    setLoadingMessages(true);
    setChatMessages([]);

    try {
      // Cargar mensajes del endpoint /crm/contacto/{id}/mensajes
      const response = await apiClient.get(`/crm/contacto/${contacto.id}/mensajes`);
      const messagesData = response.data || [];

      // Transformar mensajes a formato de chat
      const messages = messagesData.map(msg => ({
        id: msg.id,
        type: msg.direccion === 'in' ? 'client' : 'ai',
        text: msg.contenido || '',
        file: msg.contenido_archivo || null,
        timestamp: msg.fecha_registro
          ? new Date(msg.fecha_registro).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
          : ''
      }));

      setChatMessages(messages);
      console.log('Mensajes cargados:', messages);
    } catch (err) {
      console.error('Error al cargar mensajes:', err);
      setChatMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando conversaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Conversaciones</h1>
            <p className="text-gray-600 mt-1">Gestiona tus conversaciones con clientes</p>
          </div>
          <div className="bg-primary-50 px-4 py-2 rounded-lg border border-primary-200 flex items-center gap-2">
            <span className="text-sm text-primary-600 font-medium">Total:</span>
            <span className="text-xl font-bold text-primary-700">{totalContactos}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[calc(100%-5rem)] flex">
        {/* Left Panel - Lista de Conversaciones */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          {/* Buscador */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar por nombre o celular..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            {isSearching && (
              <div className="flex items-center justify-center mt-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                <span className="ml-2 text-xs text-gray-500">Buscando...</span>
              </div>
            )}
            {searchQuery && !isSearching && (
              <p className="text-xs text-gray-500 mt-2">
                {totalContactos} resultado{totalContactos !== 1 ? 's' : ''} para "{searchQuery}"
              </p>
            )}

            {/* Filtros de Estado y Tipificacion */}
            <div className="flex flex-col gap-2 mt-3">
              <select
                value={selectedEstado}
                onChange={(e) => handleFilterChange('estado', e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white truncate"
              >
                <option value="">Estado: Todos</option>
                {estados.map((estado) => (
                  <option key={estado.id} value={estado.id}>
                    {estado.nombre}
                  </option>
                ))}
              </select>
              <select
                value={selectedTipificacion}
                onChange={(e) => handleFilterChange('tipificacion', e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white truncate"
              >
                <option value="">Tipificacion: Todas</option>
                {tipificaciones.map((tipificacion) => (
                  <option key={tipificacion.id} value={tipificacion.id}>
                    {tipificacion.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Boton limpiar filtros */}
            {(selectedEstado || selectedTipificacion || searchQuery) && (
              <button
                onClick={clearFilters}
                className="w-full mt-2 px-2 py-1.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Limpiar filtros
              </button>
            )}
          </div>
          {/* Lista de Conversaciones */}
          <div className="flex-1 overflow-y-auto">
            {contactos.length > 0 ? (
              <>
                {contactos.map((contacto) => (
                  <div
                    key={contacto.id}
                    onClick={() => handleSelectChat(contacto)}
                    className={`p-3 border-b border-gray-200 cursor-pointer transition-colors ${
                      selectedChat?.id === contacto.id
                        ? 'bg-primary-50 border-l-4 border-l-primary-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                          {(contacto.nombre_completo || contacto.celular || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              {contacto.nombre_completo || contacto.celular}
                            </h3>
                            {contacto.ultimo_mensaje && (
                              <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                                {formatRelativeTime(contacto.ultimo_mensaje)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">{contacto.celular}</p>

                          {/* Badges de Estado y Tipificacion */}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {contacto.estado_nombre && (
                              <span
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium"
                                style={{
                                  backgroundColor: contacto.estado_color ? `${contacto.estado_color}20` : '#e5e7eb',
                                  color: contacto.estado_color || '#374151'
                                }}
                              >
                                {contacto.estado_nombre}
                              </span>
                            )}
                            {contacto.tipificacion_nombre && (
                              <span
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium"
                                style={{
                                  backgroundColor: contacto.tipificacion_color ? `${contacto.tipificacion_color}20` : '#fef3c7',
                                  color: contacto.tipificacion_color || '#92400e'
                                }}
                              >
                                {contacto.tipificacion_nombre}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Boton Cargar Mas */}
                {hasMore && (
                  <div className="p-4 border-t border-gray-200">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingMore ? (
                        <>
                          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Cargando...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          <span>Cargar mas ({totalContactos - contactos.length} restantes)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 text-center text-gray-500">
                <p className="text-sm">No hay contactos disponibles</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Conversacion Activa */}
        {selectedChat ? (
          <div className="flex-1 flex flex-col">
            {/* Header del Chat */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {(selectedChat.nombre_completo || selectedChat.celular).charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedChat.nombre_completo || selectedChat.celular}
                  </h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>{selectedChat.celular}</span>
                  </div>
                  {/* Badges de Estado y Tipificacion en header */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedChat.estado_nombre && (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor: selectedChat.estado_color ? `${selectedChat.estado_color}20` : '#e5e7eb',
                          color: selectedChat.estado_color || '#374151'
                        }}
                      >
                        {selectedChat.estado_nombre}
                      </span>
                    )}
                    {selectedChat.tipificacion_nombre && (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor: selectedChat.tipificacion_color ? `${selectedChat.tipificacion_color}20` : '#fef3c7',
                          color: selectedChat.tipificacion_color || '#92400e'
                        }}
                      >
                        {selectedChat.tipificacion_nombre}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Cargando mensajes...</p>
                  </div>
                </div>
              ) : chatMessages.length > 0 ? (
                chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'ai' ? 'justify-start' : 'justify-end'} mb-2`}
                  >
                    <div className={`flex flex-col ${message.type === 'ai' ? 'items-start' : 'items-end'} max-w-xs lg:max-w-md`}>
                      {/* Badge IA Bot - solo para mensajes de IA */}
                      {message.type === 'ai' && (
                        <div className="flex items-center space-x-1 mb-1 px-3">
                          <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                          </svg>
                          <span className="text-xs font-semibold text-purple-700">AI Bot</span>
                        </div>
                      )}

                      {/* Mensaje */}
                      <div
                        className={`px-4 py-2 rounded-2xl break-words ${
                          message.type === 'ai'
                            ? 'bg-gray-200 text-gray-900 rounded-bl-none'
                            : 'bg-primary-600 text-white rounded-br-none'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.text}</p>
                        {message.file && (
                          <p className="text-xs mt-1 opacity-75">[Archivo adjunto]</p>
                        )}
                      </div>

                      {/* Timestamp */}
                      <span className={`text-xs text-gray-500 mt-1 ${message.type === 'ai' ? 'text-left' : 'text-right'}`}>
                        {message.timestamp}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <p className="text-sm">No hay mensajes en este chat</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Selecciona una conversacion</h3>
              <p className="text-gray-600">Elige una conversacion de la lista para comenzar a chatear</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
