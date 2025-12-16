import axios from 'axios';
import { getSession, signOut } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3020/api';
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3020';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para requests - agregar token desde NextAuth
api.interceptors.request.use(
  async (config) => {
    if (typeof window !== 'undefined') {
      const session = await getSession();
      if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para responses - manejo de errores
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Manejo de errores específicos
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // No autorizado - cerrar sesión y redirigir a login
          if (typeof window !== 'undefined') {
            signOut({ callbackUrl: '/login' });
          }
          break;
        case 403:
          // Prohibido - sin permisos
          console.error('No tienes permisos para realizar esta acción');
          break;
        case 404:
          // No encontrado
          console.error('Recurso no encontrado');
          break;
        case 500:
          // Error del servidor
          console.error('Error interno del servidor');
          break;
        default:
          console.error('Error en la petición:', data?.message || error.message);
      }

      return Promise.reject(data || error.message);
    } else if (error.request) {
      // Error de red - no hay respuesta del servidor
      console.error('Error de red - no se pudo conectar con el servidor');
      return Promise.reject('Error de conexión con el servidor');
    } else {
      // Error al configurar la petición
      console.error('Error al configurar la petición:', error.message);
      return Promise.reject(error.message);
    }
  }
);

/**
 * Métodos HTTP simplificados
 */
export const apiClient = {
  get: (url, config) => api.get(url, config),
  post: (url, data, config) => api.post(url, data, config),
  put: (url, data, config) => api.put(url, data, config),
  patch: (url, data, config) => api.patch(url, data, config),
  delete: (url, config) => api.delete(url, config),
};

export default api;
