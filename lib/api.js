import axios from 'axios';
console.log(process.env.NEXT_PUBLIC_API_URL);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3020/api';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para requests - agregar token
api.interceptors.request.use(
  (config) => {
    // Obtener token del localStorage (cliente) o cookies (servidor)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
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
          // No autorizado - redirigir a login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
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
