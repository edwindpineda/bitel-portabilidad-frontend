'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

export default function ConversacionesPage() {
  const [contactos, setContactos] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Cargar datos desde la API
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Cargar contactos desde el endpoint /crm/contactos
        // Devuelve: { data: [{ celular: "51901248887" }, ...] }
        const response = await apiClient.get('/crm/contactos');
        
        // Extraer el array de contactos
        const contactosArray = response.data || response || [];
        
        console.log('Contactos cargados:', contactosArray);
        
        // Almacenar respuesta directa en estado contactos
        setContactos(contactosArray);
        
      } catch (err) {
        console.error('Error al cargar conversaciones:', err);
        setError('No se pudo cargar los contactos');
        setContactos([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadConversations();
  }, []);

  // Cargar mensajes del chat seleccionado
  const handleSelectChat = async (contacto) => {
    setSelectedChat(contacto);
    setLoadingMessages(true);
    setChatMessages([]);
    
    try {
      // Cargar mensajes del endpoint /crm/chats/{celular}
      const response = await apiClient.get(`/crm/chats/${contacto.celular}`);
      const messagesData = response.data || response || [];
      
      // Transformar mensajes a formato de chat
      const messages = messagesData.map(msg => [
        {
          id: msg.id || Math.random(),
          type: 'client',
          text: msg.question,
          timestamp: new Date(msg.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        },
        {
          id: (msg.id || Math.random()) + '_response',
          type: 'ai',
          text: msg.respuesta_api?.answer || 'Sin respuesta',
          timestamp: new Date(msg.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        }
      ]).flat();
      
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
          <div className="bg-primary-50 px-4 py-3 rounded-lg border-2 border-primary-200">
            <p className="text-xs text-primary-600 font-semibold uppercase tracking-wide">Total de Contactos</p>
            <p className="text-3xl font-bold text-primary-700">{contactos.length}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[calc(100%-5rem)] flex">
        {/* Left Panel - Lista de Conversaciones */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          {/* Lista de Conversaciones */}
          <div className="flex-1 overflow-y-auto">
            {contactos.length > 0 ? (
              contactos.map((contacto) => (
                <div
                  key={contacto.celular}
                  onClick={() => handleSelectChat(contacto)}
                  className={`p-4 border-b border-gray-200 cursor-pointer transition-colors ${
                    selectedChat?.celular === (contacto.celular)
                      ? 'bg-primary-50 border-l-4 border-l-primary-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {(contacto.celular || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{contacto.celular}</h3>
                        <p className="text-xs text-gray-500">{contacto.celular || ''}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{contacto.timestamp || 'hace poco'}</span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{'Sin mensajes'}</p>
                  {contacto.unread > 0 && (
                    <div className="mt-2">
                      <span className="inline-block px-2 py-0.5 bg-danger-500 text-white text-xs font-semibold rounded-full">
                        {contacto.unread} nuevo{contacto.unread > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                <p className="text-sm">No hay contactos disponibles</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Conversación Activa */}
        {selectedChat ? (
          <div className="flex-1 flex flex-col">
            {/* Header del Chat */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {selectedChat.celular.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedChat.celular}</h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>{selectedChat.celular}</span>
                    <span>•</span>
                    <span>Contacto</span>
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
              <h3 className="text-lg font-medium text-gray-900 mb-1">Selecciona una conversación</h3>
              <p className="text-gray-600">Elige una conversación de la lista para comenzar a chatear</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
