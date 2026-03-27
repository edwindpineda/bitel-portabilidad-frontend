import { apiClient } from '@/lib/api';

export const analisisService = {
  getByLlamada: (idLlamada) => apiClient.get(`/crm/analisis/llamada/${idLlamada}`),
  getByChat: (idChat) => apiClient.get(`/crm/analisis/chat/${idChat}`),
  getDashboard: (params = {}) => {
    const query = new URLSearchParams();
    if (params.fecha_inicio) query.set('fecha_inicio', params.fecha_inicio);
    if (params.fecha_fin) query.set('fecha_fin', params.fecha_fin);
    const qs = query.toString();
    return apiClient.get(`/crm/analisis/dashboard${qs ? '?' + qs : ''}`);
  },
};
