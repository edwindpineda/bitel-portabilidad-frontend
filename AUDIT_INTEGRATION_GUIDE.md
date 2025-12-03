// GUÍA DE INTEGRACIÓN - TABLA AUDITORÍA
// 
// Cuando tu API backend esté lista, reemplaza los datos mock con el endpoint real.
// 
// OPCIONES DE INTEGRACIÓN:

// OPCIÓN 1: Endpoint GET simple
// ============================================
// const fetchAuditoryData = async () => {
//   try {
//     setLoading(true);
//     const response = await apiClient.get('/auditoria');
//     setAuditoryData(response.data);
//     if (response.data.length > 0) {
//       setSelectedPhone(response.data[0].phone);
//     }
//   } catch (err) {
//     setError('Error al cargar el historial de auditoría');
//     console.error(err);
//   } finally {
//     setLoading(false);
//   }
// };


// OPCIÓN 2: Con paginación y filtros
// ============================================
// const fetchAuditoryData = async (page = 1, limit = 50, phone = '', tipoUsuario = '') => {
//   try {
//     setLoading(true);
//     const params = new URLSearchParams();
//     if (page) params.append('page', page);
//     if (limit) params.append('limit', limit);
//     if (phone) params.append('phone', phone);
//     if (tipoUsuario) params.append('tipo_usuario', tipoUsuario);
//     
//     const response = await apiClient.get(`/auditoria?${params.toString()}`);
//     setAuditoryData(response.data);
//   } catch (err) {
//     setError('Error al cargar el historial de auditoría');
//     console.error(err);
//   } finally {
//     setLoading(false);
//   }
// };


// OPCIÓN 3: Endpoint POST con body
// ============================================
// const fetchAuditoryData = async (filters = {}) => {
//   try {
//     setLoading(true);
//     const response = await apiClient.post('/auditoria/search', {
//       phone: filters.phone || null,
//       tipo_usuario: filters.tipo_usuario || null,
//       date_from: filters.date_from || null,
//       date_to: filters.date_to || null,
//       limit: filters.limit || 50,
//       page: filters.page || 1,
//     });
//     setAuditoryData(response.data);
//   } catch (err) {
//     setError('Error al cargar el historial de auditoría');
//     console.error(err);
//   } finally {
//     setLoading(false);
//   }
// };


// ESTRUCTURA ESPERADA DE LA RESPUESTA
// ============================================
// La API debe retornar datos en el siguiente formato:
//
// {
//   "data": [
//     {
//       "id": 1,
//       "phone": "987654321",
//       "question": "¿Cuál es el plan de S/34.90?",
//       "respuesta_api": { 
//         "message": "Plan S/34.90 incluye...",
//         "status": "success"
//       },
//       "created_at": "2025-12-03T14:25:30Z",
//       "tipo_usuario": "user",
//       "fecha_ingreso": "2025-12-03",
//       "id_contacto": 1
//     }
//   ],
//   "pagination": {
//     "total": 150,
//     "page": 1,
//     "limit": 50,
//     "pages": 3
//   }
// }


// NOTAS IMPORTANTES
// ============================================
// 1. Asegúrate que el token JWT esté en localStorage (se añade automáticamente via interceptor)
// 2. La respuesta_api es JSON, se formatea automáticamente en la UI
// 3. Los timestamps se formatean según locale 'es-ES'
// 4. Los filtros de búsqueda son opcionales
// 5. La paginación es recomendada para grandes volúmenes de datos
//
// CAMPOS OBLIGATORIOS MÍNIMOS:
// - id
// - phone
// - question
// - created_at
// - respuesta_api (puede ser null)
// 
// CAMPOS OPCIONALES:
// - tipo_usuario
// - fecha_ingreso
// - id_contacto
// - id_cliente_rest

export const AUDIT_API_CONFIG = {
  // Reemplaza esto con tu endpoint real
  endpoint: '/auditoria',
  
  // Método HTTP
  method: 'GET',
  
  // Parámetros de query soportados
  queryParams: ['page', 'limit', 'phone', 'tipo_usuario', 'date_from', 'date_to'],
  
  // Datos mock para desarrollo (eliminar cuando API esté lista)
  mockDataEnabled: true,
};

