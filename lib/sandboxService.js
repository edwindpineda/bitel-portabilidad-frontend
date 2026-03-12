import { apiClient } from './api';

// ==================== Configuración ====================

export const getConfiguracion = async () => {
  return apiClient.get('/sandbox/configuracion');
};

export const saveConfiguracion = async (data) => {
  return apiClient.post('/sandbox/configuracion', data);
};

export const updateConfiguracion = async (id, data) => {
  return apiClient.put(`/sandbox/configuracion/${id}`, data);
};

// ==================== Chats ====================

export const getChats = async (canal) => {
  return apiClient.get('/sandbox/chats', { params: { canal } });
};

export const createChat = async (data) => {
  return apiClient.post('/sandbox/chats', data);
};

export const deleteChat = async (id) => {
  return apiClient.delete(`/sandbox/chats/${id}`);
};

// ==================== Mensajes ====================

export const getMessages = async (idChat) => {
  return apiClient.get(`/sandbox/chats/${idChat}/messages`);
};

export const sendMessage = async (idChat, data) => {
  return apiClient.post(`/sandbox/chats/${idChat}/messages`, data);
};
