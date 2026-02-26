'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/api';
import useChatWebSocket from '@/hooks/useChatWebSocket';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Search,
  Filter,
  X,
  ChevronDown,
  Send,
  MoreVertical,
  Bot,
  Phone,
  Loader2,
  MessageSquare,
  Eye,
  Pencil,
  CheckCheck,
  Smile,
  Paperclip,
  Mic,
  ArrowLeft,
  Wifi,
  WifiOff,
  Lock,
} from 'lucide-react';

const CONTACTS_PER_PAGE = 20;
const SEARCH_DEBOUNCE_MS = 500;

// WhatsApp wallpaper doodle pattern as inline SVG data URI
const WA_WALLPAPER_SVG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 303 172'%3E%3Crect fill='%23f0ece4' width='303' height='172'/%3E%3Cg opacity='0.06' fill='%23e4dcd4'%3E%3Ccircle cx='58' cy='42' r='4'/%3E%3Ccircle cx='130' cy='28' r='3'/%3E%3Ccircle cx='195' cy='32' r='5'/%3E%3Ccircle cx='260' cy='38' r='3'/%3E%3Ccircle cx='42' cy='82' r='4'/%3E%3Ccircle cx='108' cy='88' r='3'/%3E%3Ccircle cx='170' cy='78' r='5'/%3E%3Ccircle cx='240' cy='80' r='4'/%3E%3Ccircle cx='20' cy='130' r='3'/%3E%3Ccircle cx='86' cy='132' r='4'/%3E%3Ccircle cx='150' cy='128' r='3'/%3E%3Ccircle cx='218' cy='126' r='5'/%3E%3Ccircle cx='280' cy='130' r='3'/%3E%3Cpath d='M26.4 38.6a3.1 3.1 0 01-2.2-.9l-2-2a3.1 3.1 0 010-4.4l2-2a3.1 3.1 0 014.4 0l2 2a3.1 3.1 0 010 4.4l-2 2a3.1 3.1 0 01-2.2.9z'/%3E%3Cpath d='M160 35l4-7h-8z'/%3E%3Cpath d='M290 30l3 6h-6z'/%3E%3Cpath d='M140 80l4-7h-8z'/%3E%3Cpath d='M270 76l3 6h-6z'/%3E%3Cpath d='M118 126l4-7h-8z'/%3E%3Cpath d='M248 124l3 6h-6z'/%3E%3C/g%3E%3C/svg%3E";
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
  if (diffMins < 60) return `${diffMins} min`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', timeZone: "America/Lima" });
};

export default function ConversacionesPage() {
  const { data: session } = useSession();
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
  const [nivelesTipBot, setNivelesTipBot] = useState([]);
  const [nivelesTipAsesor, setNivelesTipAsesor] = useState([]);

  // Estados para menu y edicion de persona
  const [showEditPersonaModal, setShowEditPersonaModal] = useState(false);
  const [editingPersona, setEditingPersona] = useState(null);
  const [nivelesEditTipAsesor, setNivelesEditTipAsesor] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [savingPersona, setSavingPersona] = useState(false);

  // Estados para modal de detalle de persona
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [perfilamientoData, setPerfilamientoData] = useState([]);
  const [loadingPerfilamiento, setLoadingPerfilamiento] = useState(false);

  // Estado para mostrar/ocultar filtros desplegables
  const [showFilters, setShowFilters] = useState(false);

  // Estado para busqueda activa en sidebar
  const [searchFocused, setSearchFocused] = useState(false);

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
  } = useChatWebSocket(selectedChat?.id, session?.user?.id_empresa, handleNuevoMensaje, handleMensajeEnviado);

  // Funcion para hacer scroll al final
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  };

  // Scroll al final cuando cambian los mensajes y terminan de cargar
  useEffect(() => {
    if (chatMessages.length > 0 && !loadingMessages) {
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

  // Cargar estados y tipificaciones
  const loadFiltersData = async () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3020/api';

    let token = null;
    try {
      const { getSession } = await import('next-auth/react');
      const session = await getSession();
      token = session?.accessToken;
    } catch (err) {
      console.error('Error al obtener sesión:', err);
    }

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const response = await fetch(`${API_URL}/crm/estados`, { headers });
      if (response.ok) {
        const data = await response.json();
        setEstados(data.data || []);
      }
    } catch (err) {
      console.error('Error al cargar estados:', err);
    }

    try {
      const response = await fetch(`${API_URL}/crm/tipificaciones`, { headers });
      if (response.ok) {
        const data = await response.json();
        setTipificaciones(data.data || []);
      }
    } catch (err) {
      console.error('Error al cargar tipificaciones:', err);
    }

    try {
      const response = await fetch(`${API_URL}/crm/leads/catalogo`, { headers });
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

  const handleLoadMore = () => {
    const newOffset = offset + CONTACTS_PER_PAGE;
    setOffset(newOffset);
    if (searchQuery.trim()) {
      searchContacts(searchQuery, newOffset, true);
    } else {
      loadConversations(newOffset, true);
    }
  };

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

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

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

  const clearSearch = () => {
    setSearchQuery('');
    setOffset(0);
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    loadConversations(0);
  };

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

  const clearFilters = () => {
    setSelectedEstado('');
    setSelectedTipificacion('');
    setSelectedTipificacionAsesor('');
    setNivelesTipBot([]);
    setNivelesTipAsesor([]);
    setSearchQuery('');
    setOffset(0);
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    loadConversations(0, false, '', '', '');
  };

  const tipificacionesPadreBot = tipificaciones.filter(t => !t.id_padre && t.flag_bot === 1);
  const tipificacionesPadreAsesor = tipificaciones.filter(t => !t.id_padre && t.flag_asesor === 1);

  const getHijosBot = (idPadre) => {
    return tipificaciones.filter(t => t.id_padre === idPadre && t.flag_bot === 1);
  };

  const getHijosAsesor = (idPadre) => {
    return tipificaciones.filter(t => t.id_padre === idPadre && t.flag_asesor === 1);
  };

  const construirNivelesBot = () => {
    const niveles = [{ opciones: tipificacionesPadreBot, seleccionado: nivelesTipBot[0] || null }];
    for (let i = 0; i < nivelesTipBot.length; i++) {
      const hijos = getHijosBot(nivelesTipBot[i]);
      if (hijos.length > 0) {
        niveles.push({ opciones: hijos, seleccionado: nivelesTipBot[i + 1] || null });
      } else {
        break;
      }
    }
    return niveles;
  };

  const construirNivelesAsesor = () => {
    const niveles = [{ opciones: tipificacionesPadreAsesor, seleccionado: nivelesTipAsesor[0] || null }];
    for (let i = 0; i < nivelesTipAsesor.length; i++) {
      const hijos = getHijosAsesor(nivelesTipAsesor[i]);
      if (hijos.length > 0) {
        niveles.push({ opciones: hijos, seleccionado: nivelesTipAsesor[i + 1] || null });
      } else {
        break;
      }
    }
    return niveles;
  };

  const handleNivelBotChange = (nivelIndex, value) => {
    const nuevoValor = value ? parseInt(value) : null;
    const nuevosNiveles = nivelesTipBot.slice(0, nivelIndex);
    if (nuevoValor) {
      nuevosNiveles.push(nuevoValor);
    }
    setNivelesTipBot(nuevosNiveles);
    const ultimoNivel = nuevosNiveles.length > 0 ? nuevosNiveles[nuevosNiveles.length - 1] : null;
    const tipId = ultimoNivel ? String(ultimoNivel) : '';
    setSelectedTipificacion(tipId);

    setOffset(0);
    if (searchQuery.trim()) {
      searchContacts(searchQuery.trim(), 0, false, selectedEstado, tipId, selectedTipificacionAsesor);
    } else {
      loadConversations(0, false, selectedEstado, tipId, selectedTipificacionAsesor);
    }
  };

  const handleNivelAsesorChange = (nivelIndex, value) => {
    const nuevoValor = value ? parseInt(value) : null;
    const nuevosNiveles = nivelesTipAsesor.slice(0, nivelIndex);
    if (nuevoValor) {
      nuevosNiveles.push(nuevoValor);
    }
    setNivelesTipAsesor(nuevosNiveles);
    const ultimoNivel = nuevosNiveles.length > 0 ? nuevosNiveles[nuevosNiveles.length - 1] : null;
    const tipId = ultimoNivel ? String(ultimoNivel) : '';
    setSelectedTipificacionAsesor(tipId);

    setOffset(0);
    if (searchQuery.trim()) {
      searchContacts(searchQuery.trim(), 0, false, selectedEstado, selectedTipificacion, tipId);
    } else {
      loadConversations(0, false, selectedEstado, selectedTipificacion, tipId);
    }
  };

  const nivelesDropdownBot = construirNivelesBot();
  const nivelesDropdownAsesor = construirNivelesAsesor();

  const construirNivelesEditAsesor = () => {
    const niveles = [{ opciones: tipificacionesPadreAsesor, seleccionado: nivelesEditTipAsesor[0] || null }];
    for (let i = 0; i < nivelesEditTipAsesor.length; i++) {
      const hijos = getHijosAsesor(nivelesEditTipAsesor[i]);
      if (hijos.length > 0) {
        niveles.push({ opciones: hijos, seleccionado: nivelesEditTipAsesor[i + 1] || null });
      } else {
        break;
      }
    }
    return niveles;
  };

  const handleNivelEditAsesorChange = (nivelIndex, value) => {
    const nuevoValor = value ? parseInt(value) : null;
    const nuevosNiveles = nivelesEditTipAsesor.slice(0, nivelIndex);
    if (nuevoValor) {
      nuevosNiveles.push(nuevoValor);
    }
    setNivelesEditTipAsesor(nuevosNiveles);
    const ultimoNivel = nuevosNiveles.length > 0 ? nuevosNiveles[nuevosNiveles.length - 1] : null;
    handleEditPersonaChange('id_tipificacion_asesor', ultimoNivel);
  };

  const nivelesDropdownEditAsesor = construirNivelesEditAsesor();

  const handleSelectChat = async (contacto) => {
    setSelectedChat(contacto);
    setLoadingMessages(true);
    setChatMessages([]);
    setNewMessage('');

    try {
      const response = await apiClient.get(`/crm/contacto/${contacto.id}/mensajes`);
      const messagesData = response.data || [];

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

      if (messages.length > 0) {
        const lastMessageId = Math.max(...messages.map(m => m.id));
        try {
          await apiClient.post(`/crm/contacto/${contacto.id}/mark-read`, {
            idMensaje: lastMessageId
          });
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || sendingMessage || wsEnviando) return;

    setSendingMessage(true);
    const messageContent = newMessage.trim();

    try {
      let success = false;

      if (wsConnected) {
        success = await wsEnviarMensaje(messageContent, selectedChat.celular);
      }

      if (!success) {
        await apiClient.post(`/crm/contacto/${selectedChat.id}/mensajes`, {
          contenido: messageContent
        });
        success = true;
      }

      if (success) {
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

  const handleToggleBot = async () => {
    if (!selectedChat || togglingBot) return;

    setTogglingBot(true);
    try {
      const response = await apiClient.patch(`/crm/contacto/${selectedChat.id}/toggle-bot`);
      const newBotActivo = response.data?.bot_activo;

      setSelectedChat(prev => ({ ...prev, bot_activo: newBotActivo }));

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

  const handleOpenEditPersona = () => {
    if (!selectedChat) return;
    setEditingPersona({
      id: selectedChat.id_persona || selectedChat.id,
      nombre_completo: selectedChat.nombre_completo || '',
      dni: selectedChat.dni || '',
      celular: selectedChat.celular || '',
      direccion: selectedChat.direccion || '',
      id_estado: selectedChat.id_estado || '',
      id_provedor: selectedChat.id_provedor || '',
      id_plan: selectedChat.id_plan || '',
      id_tipificacion_asesor: selectedChat.id_tipificacion_asesor || null
    });
    if (selectedChat.id_tipificacion_asesor) {
      const buildNivelesFromId = (tipId) => {
        const niveles = [];
        let current = tipificaciones.find(t => t.id === tipId);
        while (current) {
          niveles.unshift(current.id);
          current = current.id_padre ? tipificaciones.find(t => t.id === current.id_padre) : null;
        }
        return niveles;
      };
      setNivelesEditTipAsesor(buildNivelesFromId(selectedChat.id_tipificacion_asesor));
    } else {
      setNivelesEditTipAsesor([]);
    }
    setShowEditPersonaModal(true);
  };

  const handleOpenDetailModal = async () => {
    if (!selectedChat) return;
    setShowDetailModal(true);
    setPerfilamientoData([]);
    setLoadingPerfilamiento(true);
    try {
      const personaId = selectedChat.id_persona || selectedChat.id;
      const response = await apiClient.get(`/crm/leads/${personaId}/perfilamiento`);
      setPerfilamientoData(response.data || []);
    } catch (error) {
      console.error('Error al cargar perfilamiento:', error);
    } finally {
      setLoadingPerfilamiento(false);
    }
  };

  const handleEditPersonaChange = (field, value) => {
    setEditingPersona(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSavePersona = async () => {
    if (!editingPersona) return;

    setSavingPersona(true);
    try {
      await apiClient.put(`/crm/leads/${editingPersona.id}`, editingPersona);

      const tipificacionAsesor = tipificaciones.find(t => t.id == editingPersona.id_tipificacion_asesor);
      const updatedChat = {
        ...selectedChat,
        nombre_completo: editingPersona.nombre_completo,
        dni: editingPersona.dni,
        celular: editingPersona.celular,
        direccion: editingPersona.direccion,
        id_estado: editingPersona.id_estado,
        id_provedor: editingPersona.id_provedor,
        id_plan: editingPersona.id_plan,
        id_tipificacion_asesor: editingPersona.id_tipificacion_asesor,
        estado_nombre: estados.find(e => e.id == editingPersona.id_estado)?.nombre || selectedChat.estado_nombre,
        estado_color: estados.find(e => e.id == editingPersona.id_estado)?.color || selectedChat.estado_color,
        tipificacion_nombre: tipificacionAsesor?.nombre || selectedChat.tipificacion_nombre,
        tipificacion_color: tipificacionAsesor?.color || selectedChat.tipificacion_color
      };

      setSelectedChat(updatedChat);

      setContactos(prev => prev.map(c =>
        c.id === selectedChat.id ? updatedChat : c
      ));

      setShowEditPersonaModal(false);
      setEditingPersona(null);
    } catch (err) {
      console.error('Error al guardar persona:', err);
      alert('Error al guardar los cambios');
    } finally {
      setSavingPersona(false);
    }
  };

  const hasActiveFilters = selectedEstado || selectedTipificacion || selectedTipificacionAsesor;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#00a884] mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Cargando conversaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="-m-6 h-[calc(100vh-4rem)] flex flex-col">
      {/* WhatsApp-style container */}
      <div className="flex-1 flex overflow-hidden bg-[#eae6df]">

        {/* ============================================ */}
        {/* LEFT SIDEBAR - WhatsApp Contact List */}
        {/* ============================================ */}
        <div className={`w-[420px] flex-shrink-0 flex flex-col bg-white border-r border-[#d1d7db] ${selectedChat ? 'hidden lg:flex' : 'flex w-full lg:w-[420px]'}`}>

          {/* Sidebar Header - WhatsApp light style */}
          <div className="h-[60px] flex items-center justify-between px-4 bg-[#f0f2f5] border-b border-[#e9edef]">
            <div className="flex items-center gap-2">
              <span className="text-[#111b21] font-bold text-[20px]">Chats</span>
              <span className="text-[#667781] text-[13px]">({totalContactos})</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="relative">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
                    hasActiveFilters ? 'bg-[#00a884]/10' : 'hover:bg-[#e9edef]'
                  }`}
                >
                  <Filter className="h-5 w-5 text-[#54656f]" />
                </button>
                {hasActiveFilters && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#25d366] text-[10px] text-white font-bold flex items-center justify-center">
                    {[selectedEstado, selectedTipificacion, selectedTipificacionAsesor].filter(Boolean).length}
                  </span>
                )}
              </div>
              <button className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-[#e9edef] transition-colors">
                <MoreVertical className="h-5 w-5 text-[#54656f]" />
              </button>
            </div>
          </div>

          {/* Search Bar - WhatsApp style */}
          <div className="px-2 py-1.5 bg-white">
            <div className={`flex items-center rounded-lg transition-all duration-200 ${
              searchFocused ? 'bg-white shadow-sm border border-[#00a884]' : 'bg-[#f0f2f5]'
            }`}>
              <div className="flex items-center justify-center w-12 h-[35px]">
                {searchFocused || searchQuery ? (
                  <ArrowLeft className="h-[18px] w-[18px] text-[#00a884] cursor-pointer" onClick={() => { setSearchFocused(false); if (searchQuery) clearSearch(); }} />
                ) : (
                  <Search className="h-[18px] w-[18px] text-[#54656f]" />
                )}
              </div>
              <input
                type="text"
                placeholder="Buscar o iniciar un nuevo chat"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => !searchQuery && setSearchFocused(false)}
                className="flex-1 bg-transparent py-[7px] pr-8 text-[13px] text-[#111b21] placeholder-[#667781] focus:outline-none"
              />
              {searchQuery && (
                <button onClick={clearSearch} className="pr-3">
                  <X className="h-4 w-4 text-[#667781]" />
                </button>
              )}
            </div>
            {isSearching && (
              <div className="flex items-center justify-center mt-1.5 pb-1">
                <Loader2 className="h-3 w-3 animate-spin text-[#00a884]" />
                <span className="ml-1.5 text-[11px] text-[#667781]">Buscando...</span>
              </div>
            )}
            {searchQuery && !isSearching && (
              <p className="text-[11px] text-[#667781] mt-1 px-3 pb-1">
                {totalContactos} resultado{totalContactos !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Filters Panel - Collapsible */}
          {showFilters && (
            <div className="px-3 py-2 bg-[#f0f2f5] border-b border-[#e9edef] space-y-2 animate-slide-in">
              {/* Estado filter */}
              <select
                value={selectedEstado}
                onChange={(e) => handleFilterChange('estado', e.target.value)}
                className="w-full px-3 py-1.5 text-[12px] bg-white border border-[#e9edef] rounded-lg focus:outline-none focus:border-[#00a884] text-[#111b21]"
              >
                <option value="">Estado: Todos</option>
                {estados.map((estado) => (
                  <option key={estado.id} value={estado.id}>{estado.nombre}</option>
                ))}
              </select>

              {/* Tipificacion Bot */}
              <div className="bg-white rounded-lg p-2 border border-[#e9edef]">
                <label className="block text-[11px] font-medium text-[#667781] mb-1">Tipificacion Bot</label>
                <div className="flex flex-wrap gap-1 items-center">
                  {nivelesDropdownBot.map((nivel, index) => (
                    <div key={index} className="flex items-center gap-1">
                      {index > 0 && <ChevronDown className="h-3 w-3 text-[#667781] rotate-[-90deg]" />}
                      <select
                        value={nivel.seleccionado || ''}
                        onChange={(e) => handleNivelBotChange(index, e.target.value)}
                        className="px-2 py-1 text-[11px] bg-[#f0f2f5] border border-[#e9edef] rounded focus:outline-none focus:border-[#00a884] text-[#111b21]"
                      >
                        <option value="">{index === 0 ? 'Todas' : 'Selec...'}</option>
                        {nivel.opciones.map((t) => (
                          <option key={t.id} value={t.id}>{t.nombre}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tipificacion Asesor */}
              <div className="bg-white rounded-lg p-2 border border-[#e9edef]">
                <label className="block text-[11px] font-medium text-[#667781] mb-1">Tipificacion Asesor</label>
                <div className="flex flex-wrap gap-1 items-center">
                  {nivelesDropdownAsesor.map((nivel, index) => (
                    <div key={index} className="flex items-center gap-1">
                      {index > 0 && <ChevronDown className="h-3 w-3 text-[#667781] rotate-[-90deg]" />}
                      <select
                        value={nivel.seleccionado || ''}
                        onChange={(e) => handleNivelAsesorChange(index, e.target.value)}
                        className="px-2 py-1 text-[11px] bg-[#f0f2f5] border border-[#e9edef] rounded focus:outline-none focus:border-[#00a884] text-[#111b21]"
                      >
                        <option value="">{index === 0 ? 'Todas' : 'Selec...'}</option>
                        {nivel.opciones.map((t) => (
                          <option key={t.id} value={t.id}>{t.nombre}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="w-full py-1.5 text-[12px] text-[#e74c3c] hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Limpiar filtros
                </button>
              )}
            </div>
          )}

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto">
            {contactos.length > 0 ? (
              <>
                {contactos.map((contacto) => (
                  <div
                    key={contacto.id}
                    onClick={() => handleSelectChat(contacto)}
                    className={`flex items-center px-3 py-[10px] cursor-pointer transition-colors border-b border-[#e9edef] ${
                      selectedChat?.id === contacto.id
                        ? 'bg-[#f0f2f5]'
                        : contacto.mensajes_no_leidos > 0
                        ? 'bg-white hover:bg-[#f5f6f6]'
                        : 'bg-white hover:bg-[#f5f6f6]'
                    }`}
                  >
                    {/* Avatar - WhatsApp default style */}
                    <div className="relative flex-shrink-0 mr-3">
                      <div className="w-[49px] h-[49px] rounded-full bg-[#dfe5e7] flex items-center justify-center overflow-hidden">
                        <svg viewBox="0 0 212 212" className="w-[49px] h-[49px]">
                          <path fill="#c3ccd3" d="M106 0C47.5 0 0 47.5 0 106s47.5 106 106 106 106-47.5 106-106S164.5 0 106 0zm0 28c20.7 0 37.5 16.8 37.5 37.5S126.7 103 106 103 68.5 86.2 68.5 65.5 85.3 28 106 28zm0 154.4c-26.5 0-49.8-13.6-63.4-34.2 0.3-21 42.3-32.5 63.4-32.5s63.1 11.5 63.4 32.5c-13.6 20.6-36.9 34.2-63.4 34.2z"/>
                        </svg>
                      </div>
                      {/* Bot indicator - small dot */}
                      <div
                        className={`absolute bottom-0 right-0 w-[14px] h-[14px] rounded-full border-2 border-white flex items-center justify-center ${
                          contacto.bot_activo ? 'bg-[#25d366]' : 'bg-[#667781]'
                        }`}
                      >
                        <Bot className="h-2 w-2 text-white" />
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-[15px] truncate ${contacto.mensajes_no_leidos > 0 ? 'font-semibold text-[#111b21]' : 'text-[#111b21]'}`}>
                          {contacto.nombre_completo || contacto.celular}
                        </h3>
                        <span className={`text-[12px] flex-shrink-0 ml-2 ${
                          contacto.mensajes_no_leidos > 0 ? 'text-[#25d366] font-medium' : 'text-[#667781]'
                        }`}>
                          {formatRelativeTime(contacto.ultimo_mensaje)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                          {/* Double check for last msg */}
                          <CheckCheck className="h-[16px] w-[16px] text-[#53bdeb] flex-shrink-0" />
                          <p className="text-[13px] text-[#667781] truncate">
                            {contacto.celular}
                          </p>
                        </div>
                        {/* Unread Badge */}
                        {contacto.mensajes_no_leidos > 0 && (
                          <div className="min-w-[20px] h-[20px] bg-[#25d366] rounded-full flex items-center justify-center ml-1.5">
                            <span className="text-[11px] font-bold text-white px-1">
                              {contacto.mensajes_no_leidos > 99 ? '99+' : contacto.mensajes_no_leidos}
                            </span>
                          </div>
                        )}
                      </div>
                      {/* Mini badges for estado/tipificacion */}
                      {(contacto.estado_nombre || contacto.tipificacion_nombre) && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {contacto.estado_nombre && (
                            <span
                              className="inline-flex items-center px-1.5 py-0 rounded text-[10px] font-medium"
                              style={{
                                backgroundColor: contacto.estado_color ? `${contacto.estado_color}15` : '#e9edef',
                                color: contacto.estado_color || '#667781'
                              }}
                            >
                              {contacto.estado_nombre}
                            </span>
                          )}
                          {contacto.tipificacion_nombre && (
                            <span
                              className="inline-flex items-center px-1.5 py-0 rounded text-[10px] font-medium"
                              style={{
                                backgroundColor: contacto.tipificacion_color ? `${contacto.tipificacion_color}15` : '#fef3c7',
                                color: contacto.tipificacion_color || '#92400e'
                              }}
                            >
                              {contacto.tipificacion_nombre}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Load More */}
                {hasMore && (
                  <div className="p-3">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="w-full flex items-center justify-center gap-2 py-2.5 text-[13px] text-[#008069] font-medium rounded-lg hover:bg-[#f0f2f5] transition-colors disabled:opacity-50"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Cargando...</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          <span>Cargar mas ({totalContactos - contactos.length} restantes)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="h-16 w-16 rounded-full bg-[#f0f2f5] flex items-center justify-center mb-4">
                  <MessageSquare className="h-8 w-8 text-[#8696a0]" />
                </div>
                <p className="text-[14px] text-[#667781]">No hay contactos disponibles</p>
              </div>
            )}
          </div>
        </div>

        {/* ============================================ */}
        {/* RIGHT PANEL - WhatsApp Chat Area */}
        {/* ============================================ */}
        {selectedChat ? (
          <div className={`flex-1 flex flex-col bg-[#efeae2] ${selectedChat ? 'flex' : 'hidden lg:flex'}`}>

            {/* Chat Header - WhatsApp light style */}
            <div className="h-[60px] flex items-center justify-between px-4 flex-shrink-0 bg-[#f0f2f5] border-b border-[#e9edef]">
              <div className="flex items-center gap-3">
                {/* Back button (mobile) */}
                <button
                  onClick={() => setSelectedChat(null)}
                  className="lg:hidden h-10 w-10 rounded-full flex items-center justify-center hover:bg-[#e9edef] transition-colors"
                >
                  <ArrowLeft className="h-5 w-5 text-[#54656f]" />
                </button>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-[#dfe5e7] flex items-center justify-center">
                  <svg viewBox="0 0 212 212" className="w-10 h-10">
                    <path fill="#c3ccd3" d="M106 0C47.5 0 0 47.5 0 106s47.5 106 106 106 106-47.5 106-106S164.5 0 106 0zm0 28c20.7 0 37.5 16.8 37.5 37.5S126.7 103 106 103 68.5 86.2 68.5 65.5 85.3 28 106 28zm0 154.4c-26.5 0-49.8-13.6-63.4-34.2 0.3-21 42.3-32.5 63.4-32.5s63.1 11.5 63.4 32.5c-13.6 20.6-36.9 34.2-63.4 34.2z"/>
                  </svg>
                </div>

                {/* Info */}
                <div>
                  <h2 className="text-[16px] font-medium text-[#111b21] leading-tight">
                    {selectedChat.nombre_completo || selectedChat.celular}
                  </h2>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] text-[#667781]">{selectedChat.celular}</span>
                    {selectedChat.estado_nombre && (
                      <>
                        <span className="text-[#667781]">·</span>
                        <span
                          className="text-[11px] font-medium px-1.5 py-0 rounded"
                          style={{
                            backgroundColor: selectedChat.estado_color ? `${selectedChat.estado_color}15` : '#e9edef',
                            color: selectedChat.estado_color || '#667781'
                          }}
                        >
                          {selectedChat.estado_nombre}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right actions */}
              <div className="flex items-center gap-0.5">
                {/* Connection status */}
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium mr-1 ${
                  wsConnected
                    ? 'bg-[#d1f4cc] text-[#008069]'
                    : wsError
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {wsConnected ? (
                    <Wifi className="h-3 w-3" />
                  ) : (
                    <WifiOff className="h-3 w-3" />
                  )}
                  <span className="hidden sm:inline">{connectionStatus}</span>
                </div>

                {/* Bot toggle */}
                <button
                  onClick={handleToggleBot}
                  disabled={togglingBot}
                  className={`h-9 px-3 rounded-full flex items-center gap-1.5 transition-colors text-[12px] font-medium ${
                    selectedChat.bot_activo
                      ? 'bg-[#d1f4cc] text-[#008069] hover:bg-[#b8edb0]'
                      : 'bg-[#e9edef] text-[#667781] hover:bg-[#d1d7db]'
                  } disabled:opacity-50`}
                  title={selectedChat.bot_activo ? 'Bot activo - Click para desactivar' : 'Bot inactivo - Click para activar'}
                >
                  {togglingBot ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{selectedChat.bot_activo ? 'Bot ON' : 'Bot OFF'}</span>
                </button>

                {/* Search icon */}
                <button className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-[#e9edef] transition-colors">
                  <Search className="h-5 w-5 text-[#54656f]" />
                </button>

                {/* Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-[#e9edef] transition-colors">
                      <MoreVertical className="h-5 w-5 text-[#54656f]" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52" sideOffset={4}>
                    <DropdownMenuItem onClick={handleOpenDetailModal} className="cursor-pointer gap-2 py-2.5">
                      <Eye className="h-4 w-4" />
                      Ver Detalle
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleOpenEditPersona} className="cursor-pointer gap-2 py-2.5">
                      <Pencil className="h-4 w-4" />
                      Editar Persona
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Chat Messages Area - WhatsApp wallpaper */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto px-[5%] lg:px-[10%] py-4"
              style={{
                backgroundImage: `url('${WA_WALLPAPER_SVG}')`,
                backgroundSize: '412px 234px',
                backgroundColor: '#efeae2',
              }}
            >
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="bg-white/90 rounded-lg px-5 py-3 shadow-sm flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-[#00a884]" />
                    <span className="text-[13px] text-[#667781]">Cargando mensajes...</span>
                  </div>
                </div>
              ) : chatMessages.length > 0 ? (
                <>
                  {/* Encryption notice */}
                  <div className="flex justify-center mb-4">
                    <div className="bg-[#ffecd2] rounded-lg px-3 py-1.5 shadow-sm flex items-center gap-1.5 max-w-md">
                      <Lock className="h-3 w-3 text-[#8c6e3c] flex-shrink-0" />
                      <span className="text-[11.5px] text-[#8c6e3c] text-center">
                        Los mensajes estan cifrados de extremo a extremo. Ni siquiera nosotros podemos leerlos.
                      </span>
                    </div>
                  </div>

                  {chatMessages.map((message) => {
                    // ai = outgoing (sent by CRM/bot) -> RIGHT side, green bubble
                    // client = incoming (from customer) -> LEFT side, white bubble
                    const isOutgoing = message.type === 'ai';
                    return (
                      <div
                        key={message.id}
                        className={`flex mb-[2px] ${isOutgoing ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`relative max-w-[65%] px-[9px] pt-[6px] pb-[8px] rounded-lg shadow-sm ${
                            isOutgoing
                              ? 'bg-[#d9fdd3] rounded-tr-none'
                              : 'bg-white rounded-tl-none'
                          }`}
                          style={{ minWidth: '80px' }}
                        >
                          {/* Bubble tail */}
                          <div
                            className={`absolute top-0 w-[8px] h-[13px] ${
                              isOutgoing ? '-right-[8px]' : '-left-[8px]'
                            }`}
                            style={{
                              background: isOutgoing ? '#d9fdd3' : 'white',
                              clipPath: isOutgoing
                                ? 'polygon(0 0, 0 100%, 100% 0)'
                                : 'polygon(100% 0, 0 0, 100% 100%)'
                            }}
                          />

                          {/* AI Bot label - on outgoing bot messages */}
                          {isOutgoing && (
                            <div className="flex items-center gap-1 mb-0.5">
                              <Bot className="h-3 w-3 text-[#6366f1]" />
                              <span className="text-[11px] font-semibold text-[#6366f1]">AI Bot</span>
                            </div>
                          )}

                          {/* Message text */}
                          <p className="text-[14.2px] text-[#111b21] leading-[19px] whitespace-pre-wrap break-words">
                            {message.text}
                            {/* Invisible spacer for timestamp */}
                            <span className={`inline-block ${isOutgoing ? 'w-[75px]' : 'w-[52px]'}`} />
                          </p>
                          {message.file && (
                            <div className="flex items-center gap-1 mt-1 px-2 py-1 bg-black/5 rounded text-[12px] text-[#667781]">
                              <Paperclip className="h-3 w-3" />
                              Archivo adjunto
                            </div>
                          )}

                          {/* Timestamp + checks */}
                          <div className="absolute bottom-[5px] right-[7px] flex items-center gap-0.5">
                            <span className={`text-[11px] leading-none ${isOutgoing ? 'text-[#667781]' : 'text-[#667781]'}`}>{message.timestamp}</span>
                            {isOutgoing && (
                              <CheckCheck className="h-[15px] w-[15px] text-[#53bdeb] ml-0.5" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="bg-[#ffecd2] rounded-lg px-5 py-3 shadow-sm text-center">
                    <p className="text-[13px] text-[#8c6e3c]">No hay mensajes en este chat</p>
                  </div>
                </div>
              )}
            </div>

            {/* Message Input - WhatsApp style */}
            <div className="flex-shrink-0 px-3 py-2" style={{ background: '#f0f2f5' }}>
              {selectedChat.bot_activo ? (
                <div className="flex items-center justify-center gap-2 py-3 px-4 bg-[#d1f4cc] rounded-lg">
                  <Bot className="h-5 w-5 text-[#008069]" />
                  <span className="text-[13px] text-[#008069] font-medium">Bot activo - Desactiva el bot para enviar mensajes</span>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="flex items-center gap-[6px]">
                  {/* Plus/attach button */}
                  <button type="button" className="h-[42px] w-[42px] flex-shrink-0 flex items-center justify-center rounded-full hover:bg-[#e9edef] transition-colors">
                    <Paperclip className="h-[24px] w-[24px] text-[#54656f] rotate-45" />
                  </button>
                  {/* Input container */}
                  <div className="flex-1 flex items-center bg-white rounded-[8px]">
                    <button type="button" className="h-[42px] w-[42px] flex items-center justify-center hover:bg-[#f5f6f6] rounded-l-[8px] transition-colors flex-shrink-0">
                      <Smile className="h-[24px] w-[24px] text-[#54656f]" />
                    </button>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Escribe un mensaje"
                      disabled={sendingMessage}
                      className="flex-1 py-[9px] px-1 bg-transparent text-[15px] text-[#111b21] placeholder-[#667781] focus:outline-none disabled:opacity-50"
                    />
                  </div>
                  {/* Send / Mic button */}
                  {newMessage.trim() ? (
                    <button
                      type="submit"
                      disabled={sendingMessage}
                      className="h-[42px] w-[42px] flex-shrink-0 rounded-full flex items-center justify-center hover:bg-[#e9edef] transition-colors disabled:opacity-50"
                    >
                      {sendingMessage ? (
                        <Loader2 className="h-[24px] w-[24px] animate-spin text-[#54656f]" />
                      ) : (
                        <Send className="h-[24px] w-[24px] text-[#54656f]" />
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="h-[42px] w-[42px] flex-shrink-0 rounded-full flex items-center justify-center hover:bg-[#e9edef] transition-colors"
                    >
                      <Mic className="h-[24px] w-[24px] text-[#54656f]" />
                    </button>
                  )}
                </form>
              )}
            </div>
          </div>
        ) : (
          /* Default empty state - WhatsApp style */
          <div className="flex-1 hidden lg:flex flex-col items-center justify-center" style={{ background: '#f0f2f5' }}>
            <div className="text-center max-w-md">
              {/* WhatsApp-style illustration */}
              <div className="relative mx-auto mb-8">
                <div className="h-[260px] w-[260px] mx-auto rounded-full bg-gradient-to-b from-[#00a884]/10 to-transparent flex items-center justify-center">
                  <div className="h-[180px] w-[180px] rounded-full bg-gradient-to-b from-[#00a884]/15 to-transparent flex items-center justify-center">
                    <MessageSquare className="h-20 w-20 text-[#00a884]/40" />
                  </div>
                </div>
              </div>
              <h1 className="text-[28px] font-light text-[#41525d] mb-3">Chat</h1>
              <p className="text-[14px] text-[#667781] leading-relaxed">
                Envia y recibe mensajes de tus clientes.<br />
                Selecciona una conversacion para comenzar.
              </p>
              <div className="flex items-center justify-center gap-1.5 mt-8 text-[12px] text-[#8696a0]">
                <Lock className="h-3 w-3" />
                <span>Conversaciones gestionadas</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* MODAL: Editar Persona */}
      {/* ============================================ */}
      {showEditPersonaModal && editingPersona && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#e9edef]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: '#008069' }}>
                  <Pencil className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-[#111b21]">Editar Persona</h2>
              </div>
              <button
                onClick={() => {
                  setShowEditPersonaModal(false);
                  setEditingPersona(null);
                }}
                className="h-9 w-9 rounded-full hover:bg-[#f0f2f5] flex items-center justify-center transition-colors"
              >
                <X className="h-5 w-5 text-[#54656f]" />
              </button>
            </div>

            {/* Form */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[13px] font-medium text-[#111b21] mb-1.5">Nombre Completo</label>
                  <input
                    type="text"
                    value={editingPersona.nombre_completo || ''}
                    onChange={(e) => handleEditPersonaChange('nombre_completo', e.target.value)}
                    className="w-full px-3 py-2.5 text-[14px] bg-[#f0f2f5] border border-[#e9edef] rounded-lg focus:outline-none focus:border-[#00a884] focus:bg-white transition-all text-[#111b21]"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#111b21] mb-1.5">DNI</label>
                  <input
                    type="text"
                    value={editingPersona.dni || ''}
                    onChange={(e) => handleEditPersonaChange('dni', e.target.value)}
                    className="w-full px-3 py-2.5 text-[14px] bg-[#f0f2f5] border border-[#e9edef] rounded-lg focus:outline-none focus:border-[#00a884] focus:bg-white transition-all text-[#111b21]"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#111b21] mb-1.5">Celular</label>
                  <input
                    type="text"
                    value={editingPersona.celular || ''}
                    onChange={(e) => handleEditPersonaChange('celular', e.target.value)}
                    className="w-full px-3 py-2.5 text-[14px] bg-[#f0f2f5] border border-[#e9edef] rounded-lg focus:outline-none focus:border-[#00a884] focus:bg-white transition-all text-[#111b21]"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#111b21] mb-1.5">Direccion</label>
                  <input
                    type="text"
                    value={editingPersona.direccion || ''}
                    onChange={(e) => handleEditPersonaChange('direccion', e.target.value)}
                    className="w-full px-3 py-2.5 text-[14px] bg-[#f0f2f5] border border-[#e9edef] rounded-lg focus:outline-none focus:border-[#00a884] focus:bg-white transition-all text-[#111b21]"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#111b21] mb-1.5">Estado</label>
                  <select
                    value={editingPersona.id_estado || ''}
                    onChange={(e) => handleEditPersonaChange('id_estado', e.target.value)}
                    className="w-full px-3 py-2.5 text-[14px] bg-[#f0f2f5] border border-[#e9edef] rounded-lg focus:outline-none focus:border-[#00a884] focus:bg-white transition-all text-[#111b21]"
                  >
                    <option value="">Seleccionar estado</option>
                    {estados.map(estado => (
                      <option key={estado.id} value={estado.id}>{estado.nombre}</option>
                    ))}
                  </select>
                </div>
                {/* Tipificacion Asesor */}
                <div className="md:col-span-2">
                  <label className="block text-[13px] font-medium text-[#111b21] mb-1.5">Tipificacion Asesor</label>
                  <div className="flex flex-wrap gap-2 items-center p-2.5 bg-[#f0f2f5] rounded-lg border border-[#e9edef]">
                    {nivelesDropdownEditAsesor.map((nivel, index) => (
                      <div key={index} className="flex items-center gap-2">
                        {index > 0 && <ChevronDown className="h-3 w-3 text-[#667781] rotate-[-90deg]" />}
                        <select
                          value={nivel.seleccionado || ''}
                          onChange={(e) => handleNivelEditAsesorChange(index, e.target.value)}
                          className="px-3 py-2 text-[13px] bg-white border border-[#e9edef] rounded-lg focus:outline-none focus:border-[#00a884] text-[#111b21]"
                        >
                          <option value="">{index === 0 ? 'Seleccionar...' : 'Selec...'}</option>
                          {nivel.opciones.map((t) => (
                            <option key={t.id} value={t.id}>{t.nombre}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                    {nivelesEditTipAsesor.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setNivelesEditTipAsesor([]);
                          handleEditPersonaChange('id_tipificacion_asesor', null);
                        }}
                        className="ml-2 p-1.5 text-[#667781] hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
                        title="Limpiar tipificacion"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-[13px] font-medium text-[#111b21] mb-1.5">Plan</label>
                  <select
                    value={editingPersona.id_plan || ''}
                    onChange={(e) => handleEditPersonaChange('id_plan', e.target.value)}
                    className="w-full px-3 py-2.5 text-[14px] bg-[#f0f2f5] border border-[#e9edef] rounded-lg focus:outline-none focus:border-[#00a884] focus:bg-white transition-all text-[#111b21]"
                  >
                    <option value="">Seleccionar plan</option>
                    {planes.map(plan => (
                      <option key={plan.id} value={plan.id}>{plan.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-[#e9edef]">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowEditPersonaModal(false);
                  setEditingPersona(null);
                }}
                className="text-[#667781] hover:bg-[#f0f2f5]"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSavePersona}
                disabled={savingPersona}
                className="text-white gap-2"
                style={{ background: '#008069' }}
              >
                {savingPersona ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Cambios'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* MODAL: Detalle de la Persona */}
      {/* ============================================ */}
      {showDetailModal && selectedChat && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#e9edef] sticky top-0 bg-white rounded-t-xl z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: '#008069' }}>
                  <Eye className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-[#111b21]">Detalle de la Persona</h3>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="h-9 w-9 rounded-full hover:bg-[#f0f2f5] flex items-center justify-center transition-colors"
              >
                <X className="h-5 w-5 text-[#54656f]" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5">
              {/* Profile header card */}
              <div className="flex items-center gap-4 p-4 rounded-xl mb-5" style={{ background: '#008069' }}>
                <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-semibold">
                  {(selectedChat.nombre_completo || selectedChat.celular || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-white font-semibold text-[16px]">{selectedChat.nombre_completo || '-'}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Phone className="h-3 w-3 text-white/60" />
                    <span className="text-white/70 text-[13px]">{selectedChat.celular || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Info grid */}
              <div className="space-y-0">
                {[
                  { label: 'DNI', value: selectedChat.dni },
                  { label: 'Direccion', value: selectedChat.direccion },
                  { label: 'Plan Tarifario', value: planes.find(p => p.id == selectedChat.id_plan)?.nombre },
                ].map((item, i) => (
                  <div key={i} className="flex items-center py-3 border-b border-[#e9edef]">
                    <span className="w-1/3 text-[13px] text-[#667781]">{item.label}</span>
                    <span className="flex-1 text-[14px] text-[#111b21]">{item.value || '-'}</span>
                  </div>
                ))}

                {/* Estado */}
                <div className="flex items-center py-3 border-b border-[#e9edef]">
                  <span className="w-1/3 text-[13px] text-[#667781]">Estado</span>
                  <div className="flex-1">
                    {selectedChat.estado_nombre ? (
                      <span
                        className="px-3 py-1 text-[11px] font-semibold rounded-full text-white"
                        style={{ backgroundColor: selectedChat.estado_color || '#667781' }}
                      >
                        {selectedChat.estado_nombre}
                      </span>
                    ) : (
                      <span className="text-[14px] text-[#8696a0]">-</span>
                    )}
                  </div>
                </div>

                {/* Tipificacion */}
                <div className="flex items-center py-3 border-b border-[#e9edef]">
                  <span className="w-1/3 text-[13px] text-[#667781]">Tipificacion</span>
                  <div className="flex-1">
                    {selectedChat.tipificacion_nombre ? (
                      <span
                        className="px-3 py-1 text-[11px] font-semibold rounded-full text-white"
                        style={{ backgroundColor: selectedChat.tipificacion_color || '#667781' }}
                      >
                        {selectedChat.tipificacion_nombre}
                      </span>
                    ) : (
                      <span className="text-[14px] text-[#8696a0]">-</span>
                    )}
                  </div>
                </div>

                {/* Bot */}
                <div className="flex items-center py-3 border-b border-[#e9edef]">
                  <span className="w-1/3 text-[13px] text-[#667781]">Bot Activo</span>
                  <div className="flex-1">
                    <Badge variant={selectedChat.bot_activo ? 'default' : 'secondary'}
                      className={selectedChat.bot_activo ? 'bg-[#25d366] hover:bg-[#25d366] text-white' : ''}
                    >
                      {selectedChat.bot_activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Perfilamiento Section */}
              <div className="mt-6">
                <h4 className="text-[14px] font-semibold text-[#111b21] mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-[#00a884]" />
                  Preguntas de Perfilamiento
                </h4>
                {loadingPerfilamiento ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-[#00a884]" />
                    <span className="ml-2 text-[13px] text-[#667781]">Cargando...</span>
                  </div>
                ) : perfilamientoData.length > 0 ? (
                  <div className="space-y-2.5">
                    {perfilamientoData.map((item, index) => (
                      <div key={index} className="bg-[#f0f2f5] rounded-lg p-3">
                        <p className="text-[12px] font-medium text-[#667781]">{item.pregunta}</p>
                        <p className="text-[14px] text-[#111b21] mt-1">{item.respuesta || '-'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] text-[#8696a0] italic py-3">Sin respuestas de perfilamiento</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end p-5 border-t border-[#e9edef] sticky bottom-0 bg-white rounded-b-xl">
              <Button
                variant="ghost"
                onClick={() => setShowDetailModal(false)}
                className="text-[#667781] hover:bg-[#f0f2f5]"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
