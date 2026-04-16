import { apiClient } from '@/lib/api';

export const ticketService = {
  getCatalogos: () => apiClient.get('/crm/tickets/catalogos'),
  getStats: () => apiClient.get('/crm/tickets/stats'),
  getAll: (params = {}) => {
    const filtered = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined));
    const query = new URLSearchParams(filtered).toString();
    return apiClient.get(`/crm/tickets${query ? '?' + query : ''}`);
  },
  getById: (id) => apiClient.get(`/crm/tickets/${id}`),
  create: (data) => apiClient.post('/crm/tickets', data),
  update: (id, data) => apiClient.put(`/crm/tickets/${id}`, data),
  updateEstado: (id, data) => apiClient.patch(`/crm/tickets/${id}/estado`, data),
  assignUser: (id, data) => apiClient.patch(`/crm/tickets/${id}/asignar`, data),
  getComentarios: (id) => apiClient.get(`/crm/tickets/${id}/comentarios`),
  createComentario: (id, formData) => apiClient.upload(`/crm/tickets/${id}/comentarios`, formData),
  getHistorial: (id) => apiClient.get(`/crm/tickets/${id}/historial`),
  getParticipantes: (id) => apiClient.get(`/crm/tickets/${id}/participantes`),
  addParticipante: (id, data) => apiClient.post(`/crm/tickets/${id}/participantes`, data),
  markAsRead: (id) => apiClient.post(`/crm/tickets/${id}/mark-read`),
  getUsuarios: () => apiClient.get('/crm/tickets/usuarios'),
  getHistorialTodos: (params = {}) => {
    const filtered = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined));
    const query = new URLSearchParams(filtered).toString();
    return apiClient.get(`/crm/tickets/historial/todos${query ? '?' + query : ''}`);
  },
};
