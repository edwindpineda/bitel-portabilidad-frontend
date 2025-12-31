'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import useChatWebSocket from '@/hooks/useChatWebSocket';

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
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', timeZone: "America/Lima" });
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
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [togglingBot, setTogglingBot] = useState(false);

  // Estados y tipificaciones para filtros
  const [estados, setEstados] = useState([]);
  const [tipificaciones, setTipificaciones] = useState([]);
  const [selectedEstado, setSelectedEstado] = useState('');
  const [selectedTipificacion, setSelectedTipificacion] = useState('');
  const [selectedTipificacionAsesor, setSelectedTipificacionAsesor] = useState('');

  // Estados para menu y edicion de prospecto
  const [showMenu, setShowMenu] = useState(false);
  const [showEditProspectoModal, setShowEditProspectoModal] = useState(false);
  const [editingProspecto, setEditingProspecto] = useState(null);
  const [proveedores, setProveedores] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [savingProspecto, setSavingProspecto] = useState(false);

  // Estados para modal de detalle de prospecto
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [perfilamientoData, setPerfilamientoData] = useState([]);
  const [loadingPerfilamiento, setLoadingPerfilamiento] = useState(false);

  // Estado para mostrar/ocultar filtros desplegables
  const [showFilters, setShowFilters] = useState(false);

  // Ref para el contenedor de mensajes y el final de mensajes
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Ref para mantener siempre el valor actualizado de selectedChat
  const selectedChatRef = useRef(selectedChat);
  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  // Callback para manejar nuevos mensajes entrantes por WebSocket
  const handleNuevoMensaje = useCallback((mensaje) => {
    const currentSelectedChat = selectedChatRef.current;

    // Solo agregar si es del chat seleccionado
    if (currentSelectedChat && mensaje.id_contacto === currentSelectedChat.id) {
      const newMsg = {
        id: mensaje.id || Date.now(),
        type: mensaje.direccion === 'in' ? 'client' : 'ai',
        text: mensaje.contenido || '',
        file: mensaje.contenido_archivo || null,
        timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: "America/Lima" })
      };
      setChatMessages(prev => [...prev, newMsg]);
    }

    // Actualizar contador de no leidos en la lista
    if (!currentSelectedChat || mensaje.id_contacto !== currentSelectedChat.id) {
      setContactos(prev => prev.map(c =>
        c.id === mensaje.id_contacto
          ? { ...c, mensajes_no_leidos: (c.mensajes_no_leidos || 0) + 1 }
          : c
      ));
    }
  }, []);

  // Callback para confirmar mensaje enviado
  const handleMensajeEnviado = useCallback((data) => {
    console.log('Mensaje enviado confirmado:', data);
  }, []);

  // Hook de WebSocket
  const {
    isConnected: wsConnected,
    enviando: wsEnviando,
    enviarMensaje: wsEnviarMensaje,
    error: wsError,
    connectionStatus
  } = useChatWebSocket(selectedChat?.id, handleNuevoMensaje, handleMensajeEnviado);

  // Funcion para hacer scroll al final
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  };

  // Scroll al final cuando cambian los mensajes y terminan de cargar
  useEffect(() => {
    if (chatMessages.length > 0 && !loadingMessages) {
      // Ejecutar scroll con delays para asegurar que el DOM esté actualizado
      const timer1 = setTimeout(scrollToBottom, 50);
      const timer2 = setTimeout(scrollToBottom, 150);
      const timer3 = setTimeout(scrollToBottom, 300);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [chatMessages, loadingMessages]);

  // Construir query params para filtros
  const buildFilterParams = (estadoId, tipificacionId, tipificacionAsesorId) => {
    const params = new URLSearchParams();
    if (estadoId) params.append('id_estado', estadoId);
    if (tipificacionId) params.append('id_tipificacion', tipificacionId);
    if (tipificacionAsesorId) params.append('id_tipificacion_asesor', tipificacionAsesorId);
    return params.toString() ? `?${params.toString()}` : '';
  };

  // Cargar datos desde la API
  const loadConversations = async (currentOffset = 0, append = false, estadoId = selectedEstado, tipificacionId = selectedTipificacion, tipificacionAsesorId = selectedTipificacionAsesor) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const filterParams = buildFilterParams(estadoId, tipificacionId, tipificacionAsesorId);
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

    // Cargar proveedores
    try {
      const response = await fetch(`${API_URL}/crm/leads/proveedores`, { headers });
      if (response.ok) {
        const data = await response.json();
        setProveedores(data.data || []);
      }
    } catch (err) {
      console.error('Error al cargar proveedores:', err);
    }

    // Cargar planes
    try {
      const response = await fetch(`${API_URL}/crm/leads/planes`, { headers });
      if (response.ok) {
        const data = await response.json();
        setPlanes(data.data || []);
      }
    } catch (err) {
      console.error('Error al cargar planes:', err);
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
  const searchContacts = async (query, currentOffset = 0, append = false, estadoId = selectedEstado, tipificacionId = selectedTipificacion, tipificacionAsesorId = selectedTipificacionAsesor) => {
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
      if (tipificacionAsesorId) url += `&id_tipificacion_asesor=${tipificacionAsesorId}`;

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
    const newTipificacionAsesor = filterType === 'tipificacionAsesor' ? value : selectedTipificacionAsesor;

    if (filterType === 'estado') {
      setSelectedEstado(value);
    } else if (filterType === 'tipificacion') {
      setSelectedTipificacion(value);
    } else if (filterType === 'tipificacionAsesor') {
      setSelectedTipificacionAsesor(value);
    }

    if (searchQuery.trim()) {
      searchContacts(searchQuery.trim(), 0, false, newEstado, newTipificacion, newTipificacionAsesor);
    } else {
      loadConversations(0, false, newEstado, newTipificacion, newTipificacionAsesor);
    }
  };

  // Limpiar todos los filtros
  const clearFilters = () => {
    setSelectedEstado('');
    setSelectedTipificacion('');
    setSelectedTipificacionAsesor('');
    setSearchQuery('');
    setOffset(0);
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    loadConversations(0, false, '', '', '');
  };

  // Cargar mensajes del chat seleccionado desde tabla mensaje
  const handleSelectChat = async (contacto) => {
    setSelectedChat(contacto);
    setLoadingMessages(true);
    setChatMessages([]);
    setNewMessage('');

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
          ? new Date(msg.fecha_registro + "Z").toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: "America/Lima" })
          : ''
      }));

      setChatMessages(messages);
      console.log('Mensajes cargados:', messages);

      // Marcar ultimo mensaje como visto
      if (messages.length > 0) {
        const lastMessageId = Math.max(...messages.map(m => m.id));
        try {
          await apiClient.post(`/crm/contacto/${contacto.id}/mark-read`, {
            idMensaje: lastMessageId
          });
          // Actualizar el contador de mensajes no leidos en la lista de contactos
          setContactos(prev => prev.map(c =>
            c.id === contacto.id ? { ...c, mensajes_no_leidos: 0 } : c
          ));
        } catch (markErr) {
          console.error('Error al marcar mensaje como visto:', markErr);
        }
      }
    } catch (err) {
      console.error('Error al cargar mensajes:', err);
      setChatMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Enviar mensaje (usa WebSocket si esta conectado, sino API)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || sendingMessage || wsEnviando) return;

    setSendingMessage(true);
    const messageContent = newMessage.trim();

    try {
      let success = false;

      // Intentar enviar por WebSocket primero
      if (wsConnected) {
        success = await wsEnviarMensaje(messageContent, selectedChat.celular);
      }

      // Si WebSocket falla o no esta conectado, usar API
      if (!success) {
        await apiClient.post(`/crm/contacto/${selectedChat.id}/mensajes`, {
          contenido: messageContent
        });
        success = true;
      }

      if (success) {
        // Agregar mensaje al chat local
        const newMsg = {
          id: Date.now(),
          type: 'ai',
          text: messageContent,
          timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: "America/Lima" })
        };
        setChatMessages(prev => [...prev, newMsg]);
        setNewMessage('');
      }
    } catch (err) {
      console.error('Error al enviar mensaje:', err);
      alert('Error al enviar el mensaje');
    } finally {
      setSendingMessage(false);
    }
  };

  // Toggle bot activo
  const handleToggleBot = async () => {
    if (!selectedChat || togglingBot) return;

    setTogglingBot(true);
    try {
      const response = await apiClient.patch(`/crm/contacto/${selectedChat.id}/toggle-bot`);
      const newBotActivo = response.data?.bot_activo;

      // Actualizar el estado local del chat seleccionado
      setSelectedChat(prev => ({ ...prev, bot_activo: newBotActivo }));

      // Actualizar en la lista de contactos
      setContactos(prev => prev.map(c =>
        c.id === selectedChat.id ? { ...c, bot_activo: newBotActivo } : c
      ));
    } catch (err) {
      console.error('Error al cambiar estado del bot:', err);
      alert('Error al cambiar estado del bot');
    } finally {
      setTogglingBot(false);
    }
  };

  // Abrir modal de edicion de prospecto
  const handleOpenEditProspecto = () => {
    if (!selectedChat) return;
    setEditingProspecto({
      id: selectedChat.id_prospecto || selectedChat.id,
      nombre_completo: selectedChat.nombre_completo || '',
      dni: selectedChat.dni || '',
      celular: selectedChat.celular || '',
      direccion: selectedChat.direccion || '',
      id_estado: selectedChat.id_estado || '',
      id_provedor: selectedChat.id_provedor || '',
      id_plan: selectedChat.id_plan || '',
      id_tipificacion: selectedChat.id_tipificacion || ''
    });
    setShowEditProspectoModal(true);
    setShowMenu(false);
  };

  // Abrir modal de detalle del prospecto
  const handleOpenDetailModal = async () => {
    if (!selectedChat) return;
    setShowDetailModal(true);
    setShowMenu(false);
    setPerfilamientoData([]);
    setLoadingPerfilamiento(true);
    try {
      const prospectoId = selectedChat.id_prospecto || selectedChat.id;
      const response = await apiClient.get(`/crm/leads/${prospectoId}/perfilamiento`);
      setPerfilamientoData(response.data || []);
    } catch (error) {
      console.error('Error al cargar perfilamiento:', error);
    } finally {
      setLoadingPerfilamiento(false);
    }
  };

  // Manejar cambios en el formulario de edicion
  const handleEditProspectoChange = (field, value) => {
    setEditingProspecto(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Guardar cambios del prospecto
  const handleSaveProspecto = async () => {
    if (!editingProspecto) return;

    setSavingProspecto(true);
    try {
      await apiClient.put(`/crm/leads/${editingProspecto.id}`, editingProspecto);

      // Actualizar el chat seleccionado con los nuevos datos
      const updatedChat = {
        ...selectedChat,
        nombre_completo: editingProspecto.nombre_completo,
        dni: editingProspecto.dni,
        celular: editingProspecto.celular,
        direccion: editingProspecto.direccion,
        id_estado: editingProspecto.id_estado,
        id_provedor: editingProspecto.id_provedor,
        id_plan: editingProspecto.id_plan,
        id_tipificacion: editingProspecto.id_tipificacion,
        estado_nombre: estados.find(e => e.id == editingProspecto.id_estado)?.nombre || selectedChat.estado_nombre,
        estado_color: estados.find(e => e.id == editingProspecto.id_estado)?.color || selectedChat.estado_color,
        tipificacion_nombre: tipificaciones.find(t => t.id == editingProspecto.id_tipificacion)?.nombre || selectedChat.tipificacion_nombre,
        tipificacion_color: tipificaciones.find(t => t.id == editingProspecto.id_tipificacion)?.color || selectedChat.tipificacion_color
      };

      setSelectedChat(updatedChat);

      // Actualizar en la lista de contactos
      setContactos(prev => prev.map(c =>
        c.id === selectedChat.id ? updatedChat : c
      ));

      setShowEditProspectoModal(false);
      setEditingProspecto(null);
    } catch (err) {
      console.error('Error al guardar prospecto:', err);
      alert('Error al guardar los cambios');
    } finally {
      setSavingProspecto(false);
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

            {/* Boton de Filtros Desplegable */}
            <div className="mt-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  (selectedEstado || selectedTipificacion || selectedTipificacionAsesor)
                    ? 'bg-primary-50 text-primary-700 border border-primary-200'
                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span>Filtros</span>
                  {(selectedEstado || selectedTipificacion || selectedTipificacionAsesor) && (
                    <span className="px-1.5 py-0.5 bg-primary-600 text-white text-xs rounded-full">
                      {[selectedEstado, selectedTipificacion, selectedTipificacionAsesor].filter(Boolean).length}
                    </span>
                  )}
                </div>
                <svg
                  className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Panel de Filtros Desplegable */}
              {showFilters && (
                <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
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
                  <select
                    value={selectedTipificacionAsesor}
                    onChange={(e) => handleFilterChange('tipificacionAsesor', e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white truncate"
                  >
                    <option value="">Tipif. Asesor: Todas</option>
                    {tipificaciones.map((tipificacion) => (
                      <option key={tipificacion.id} value={tipificacion.id}>
                        {tipificacion.nombre}
                      </option>
                    ))}
                  </select>

                  {/* Boton limpiar filtros dentro del panel */}
                  {(selectedEstado || selectedTipificacion || selectedTipificacionAsesor) && (
                    <button
                      onClick={clearFilters}
                      className="w-full px-2 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1 border border-red-200"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Limpiar filtros
                    </button>
                  )}
                </div>
              )}
            </div>
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
                        : contacto.mensajes_no_leidos > 0
                        ? 'bg-blue-50/60 hover:bg-blue-100/60'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {(contacto.nombre_completo || contacto.celular || '?').charAt(0).toUpperCase()}
                          </div>
                          {/* Indicador de mensajes no leidos con conteo */}
                          {contacto.mensajes_no_leidos > 0 && (
                            <div
                              className="absolute -top-1 -right-1 min-w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center"
                              title={`${contacto.mensajes_no_leidos} mensaje${contacto.mensajes_no_leidos > 1 ? 's' : ''} no leído${contacto.mensajes_no_leidos > 1 ? 's' : ''}`}
                            >
                              <span className="text-xs font-bold text-white px-1">
                                {contacto.mensajes_no_leidos > 99 ? '99+' : contacto.mensajes_no_leidos}
                              </span>
                            </div>
                          )}
                          {/* Indicador Bot Activo/Inactivo */}
                          <div
                            className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
                              contacto.bot_activo ? 'bg-green-500' : 'bg-red-500'
                            }`}
                            title={contacto.bot_activo ? 'Bot activo' : 'Bot inactivo'}
                          >
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                            </svg>
                          </div>
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
              <div className="flex items-center space-x-2">
                {/* Indicador de estado WebSocket */}
                <div
                  className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                    wsConnected
                      ? 'bg-green-100 text-green-700'
                      : wsError
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                  title={wsError ? wsError.message : connectionStatus}
                >
                  <div className={`w-2 h-2 rounded-full ${
                    wsConnected ? 'bg-green-500' : wsError ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
                  }`} />
                  <span>{connectionStatus}</span>
                </div>

                {/* Boton Toggle Bot */}
                <button
                  onClick={handleToggleBot}
                  disabled={togglingBot}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedChat.bot_activo
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={selectedChat.bot_activo ? 'Bot activo - Click para desactivar' : 'Bot inactivo - Click para activar'}
                >
                  {togglingBot ? (
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  )}
                  <span>{selectedChat.bot_activo ? 'Bot Activo' : 'Bot Inactivo'}</span>
                </button>

                {/* Boton Menu con Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Opciones"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {showMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowMenu(false)}
                      />
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                        <button
                          onClick={handleOpenDetailModal}
                          className="w-full flex items-center space-x-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>Ver Detalle</span>
                        </button>
                        <button
                          onClick={handleOpenEditProspecto}
                          className="w-full flex items-center space-x-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Editar Prospecto</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Mensajes */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Cargando mensajes...</p>
                  </div>
                </div>
              ) : chatMessages.length > 0 ? (
                <>
                  {chatMessages.map((message) => (
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
                  ))}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <p className="text-sm">No hay mensajes en este chat</p>
                  </div>
                </div>
              )}
            </div>

            {/* Input para enviar mensaje */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 bg-white">
              {selectedChat.bot_activo ? (
                <div className="flex items-center justify-center space-x-2 py-2 px-4 bg-green-50 border border-green-200 rounded-lg">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                  <span className="text-green-700 font-medium">Bot activo - Desactiva el bot para enviar mensajes manualmente</span>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    disabled={sendingMessage}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim() || sendingMessage}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {sendingMessage ? (
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                    <span>{sendingMessage ? 'Enviando...' : 'Enviar'}</span>
                  </button>
                </div>
              )}
            </form>
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

      {/* Modal Editar Prospecto */}
      {showEditProspectoModal && editingProspecto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Editar Prospecto</h2>
              <button
                onClick={() => {
                  setShowEditProspectoModal(false);
                  setEditingProspecto(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    value={editingProspecto.nombre_completo || ''}
                    onChange={(e) => handleEditProspectoChange('nombre_completo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
                  <input
                    type="text"
                    value={editingProspecto.dni || ''}
                    onChange={(e) => handleEditProspectoChange('dni', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Celular</label>
                  <input
                    type="text"
                    value={editingProspecto.celular || ''}
                    onChange={(e) => handleEditProspectoChange('celular', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Direccion</label>
                  <input
                    type="text"
                    value={editingProspecto.direccion || ''}
                    onChange={(e) => handleEditProspectoChange('direccion', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select
                    value={editingProspecto.id_estado || ''}
                    onChange={(e) => handleEditProspectoChange('id_estado', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  >
                    <option value="">Seleccionar estado</option>
                    {estados.map(estado => (
                      <option key={estado.id} value={estado.id}>{estado.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipificacion</label>
                  <select
                    value={editingProspecto.id_tipificacion || ''}
                    onChange={(e) => handleEditProspectoChange('id_tipificacion', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  >
                    <option value="">Seleccionar tipificacion</option>
                    {tipificaciones.map(tipificacion => (
                      <option key={tipificacion.id} value={tipificacion.id}>{tipificacion.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                  <select
                    value={editingProspecto.id_provedor || ''}
                    onChange={(e) => handleEditProspectoChange('id_provedor', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  >
                    <option value="">Seleccionar proveedor</option>
                    {proveedores.map(proveedor => (
                      <option key={proveedor.id} value={proveedor.id}>{proveedor.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
                  <select
                    value={editingProspecto.id_plan || ''}
                    onChange={(e) => handleEditProspectoChange('id_plan', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  >
                    <option value="">Seleccionar plan</option>
                    {planes.map(plan => (
                      <option key={plan.id} value={plan.id}>{plan.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowEditProspectoModal(false);
                  setEditingProspecto(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProspecto}
                disabled={savingProspecto}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {savingProspecto ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Guardar Cambios</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle del Prospecto */}
      {showDetailModal && selectedChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">
                Detalle del Prospecto
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Nombre Completo */}
              <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500">Nombre Completo</span>
                <span className="col-span-2 text-sm text-gray-900">{selectedChat.nombre_completo || '-'}</span>
              </div>

              {/* DNI */}
              <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500">DNI</span>
                <span className="col-span-2 text-sm text-gray-900">{selectedChat.dni || '-'}</span>
              </div>

              {/* Celular */}
              <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500">Celular</span>
                <span className="col-span-2 text-sm text-gray-900">{selectedChat.celular || '-'}</span>
              </div>

              {/* Direccion */}
              <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500">Direccion</span>
                <span className="col-span-2 text-sm text-gray-900">{selectedChat.direccion || '-'}</span>
              </div>

              {/* Estado */}
              <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500">Estado</span>
                <div className="col-span-2">
                  {selectedChat.estado_nombre ? (
                    <span
                      className="px-3 py-1 text-xs font-semibold rounded-full text-white"
                      style={{ backgroundColor: selectedChat.estado_color || '#6B7280' }}
                    >
                      {selectedChat.estado_nombre}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </div>
              </div>

              {/* Tipificacion */}
              <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500">Tipificacion</span>
                <div className="col-span-2">
                  {selectedChat.tipificacion_nombre ? (
                    <span
                      className="px-3 py-1 text-xs font-semibold rounded-full text-white"
                      style={{ backgroundColor: selectedChat.tipificacion_color || '#6B7280' }}
                    >
                      {selectedChat.tipificacion_nombre}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </div>
              </div>

              {/* Proveedor */}
              <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500">Proveedor</span>
                <span className="col-span-2 text-sm text-gray-900">
                  {proveedores.find(p => p.id == selectedChat.id_provedor)?.nombre || '-'}
                </span>
              </div>

              {/* Plan */}
              <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500">Plan Tarifario</span>
                <span className="col-span-2 text-sm text-gray-900">
                  {planes.find(p => p.id == selectedChat.id_plan)?.nombre || '-'}
                </span>
              </div>

              {/* Bot Activo */}
              <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100">
                <span className="text-sm font-medium text-gray-500">Bot Activo</span>
                <div className="col-span-2">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    selectedChat.bot_activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {selectedChat.bot_activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>

              {/* Seccion de Perfilamiento */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Preguntas de Perfilamiento</h4>
                {loadingPerfilamiento ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                    <span className="ml-2 text-sm text-gray-500">Cargando...</span>
                  </div>
                ) : perfilamientoData.length > 0 ? (
                  <div className="space-y-3">
                    {perfilamientoData.map((item, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm font-medium text-gray-700">{item.pregunta}</p>
                        <p className="text-sm text-gray-900 mt-1">{item.respuesta || '-'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic py-2">Sin respuestas de perfilamiento</p>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-3 p-4 border-t sticky bottom-0 bg-white">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
