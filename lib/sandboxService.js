import { apiClient } from './api';

const extractData = (response) => {
  if (response && typeof response === 'object' && 'data' in response) {
    return response.data;
  }

  return response;
};

const extractFirstItem = (response) => {
  const data = extractData(response);

  if (Array.isArray(data)) {
    return data[0] || null;
  }

  return data;
};

// ==================== Configuración ====================

export const getConfiguracion = async () => {
  const response = await apiClient.get('/sandbox/configuracion');
  return extractFirstItem(response);
};

export const saveConfiguracion = async (data) => {
  const response = await apiClient.post('/sandbox/configuracion', data);
  return extractFirstItem(response);
};

export const updateConfiguracion = async (id, data) => {
  const response = await apiClient.put(`/sandbox/configuracion/${id}`, data);
  return extractFirstItem(response);
};

// ==================== Chats ====================

export const getChats = async (canal) => {
  const response = await apiClient.get('/sandbox/chats', { params: { canal } });
  const data = extractData(response);
  return Array.isArray(data) ? data : [];
};

export const createChat = async (data) => {
  const response = await apiClient.post('/sandbox/chats', data);
  return extractFirstItem(response);
};

export const deleteChat = async (id) => {
  return apiClient.delete(`/sandbox/chats/${id}`);
};

// ==================== Mensajes ====================

export const getMessages = async (idChat) => {
  const response = await apiClient.get(`/sandbox/chats/${idChat}/messages`);
  const data = extractData(response);
  return Array.isArray(data) ? data : [];
};

export const sendMessage = async (idChat, data) => {
  return apiClient.post(`/sandbox/chats/${idChat}/messages`, data);
};
