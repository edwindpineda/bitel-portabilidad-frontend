import axios from 'axios';
import { getSession } from 'next-auth/react';

// Base URL de la API (usando endpoints de maravia)
const API_BASE_URL = 'https://api.maravia.pe/servicio';

// Crear instancia de axios para las peticiones
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  async (config) => {
    if (typeof window !== 'undefined') {
      const session = await getSession();
      if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
      }
      // Inyectar id_empresa en peticiones POST
      if (config.method === 'post' && config.data && session?.user?.id_empresa) {
        if (!config.data.id_empresa) {
          config.data.id_empresa = session.user.id_empresa;
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Helper para obtener datos del usuario
const getUserData = async () => {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('No hay sesión activa');
  }
  return {
    id: session.user.id,
    id_empresa: session.user.id_empresa,
  };
};

/**
 * Servicio de Sesiones QR de WhatsApp
 * Endpoints: /ws_whatsapp_qr.php
 */
export const whatsappQRService = {
  /**
   * Lista todas las sesiones QR
   */
  listar: async () => {
    try {
      const response = await api.post('/ws_whatsapp_qr.php', {
        codOpe: 'LISTAR',
      });
      return response.data;
    } catch (error) {
      console.error('Error al listar sesiones:', error);
      throw error;
    }
  },

  /**
   * Obtiene una sesión específica
   */
  obtener: async (id) => {
    try {
      const response = await api.post('/ws_whatsapp_qr.php', {
        codOpe: 'OBTENER',
        id,
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener sesión:', error);
      throw error;
    }
  },

  /**
   * Crea una nueva sesión
   */
  crear: async (data) => {
    try {
      const response = await api.post('/ws_whatsapp_qr.php', {
        codOpe: 'CREAR',
        titulo: data.titulo,
        session_id: data.session_id,
      });
      return response.data;
    } catch (error) {
      console.error('Error al crear sesión:', error);
      throw error;
    }
  },

  /**
   * Actualiza una sesión existente
   */
  actualizar: async (data) => {
    try {
      const response = await api.post('/ws_whatsapp_qr.php', {
        codOpe: 'ACTUALIZAR',
        id: data.id,
        titulo: data.titulo,
        session_id: data.session_id,
      });
      return response.data;
    } catch (error) {
      console.error('Error al actualizar sesión:', error);
      throw error;
    }
  },

  /**
   * Elimina una sesión
   */
  eliminar: async (id) => {
    try {
      const response = await api.post('/ws_whatsapp_qr.php', {
        codOpe: 'ELIMINAR',
        id,
      });
      return response.data;
    } catch (error) {
      console.error('Error al eliminar sesión:', error);
      throw error;
    }
  },

  /**
   * Obtiene el código QR de una sesión
   */
  obtenerQR: async (session_id) => {
    try {
      const response = await api.post('/ws_whatsapp_qr.php', {
        codOpe: 'OBTENER_QR',
        session_id,
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener QR:', error);
      throw error;
    }
  },

  /**
   * Obtiene los estados de todas las sesiones
   */
  obtenerEstados: async () => {
    try {
      const response = await api.post('/ws_whatsapp_qr.php', {
        codOpe: 'OBTENER_ESTADOS',
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener estados:', error);
      throw error;
    }
  },
};

/**
 * Servicio principal de WhatsApp
 * Endpoints: /ws_whatsapp.php
 */
export const whatsappService = {
  /**
   * Obtiene el código QR para escanear
   */
  obtenerQR: async () => {
    try {
      const user = await getUserData();
      const response = await api.post('/ws_whatsapp.php', {
        codOpe: 'OBTENER_QR_WHATSAPP',
        usuario_id: user.id,
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener QR:', error);
      throw error;
    }
  },

  /**
   * Desconecta la sesión de WhatsApp
   */
  desconectar: async () => {
    try {
      const user = await getUserData();
      const response = await api.post('/ws_whatsapp.php', {
        codOpe: 'DESCONECTAR_WHATSAPP',
        usuario_id: user.id,
      });
      return response.data;
    } catch (error) {
      console.error('Error al desconectar:', error);
      throw error;
    }
  },

  /**
   * Reinicia la sesión de WhatsApp
   */
  reiniciar: async () => {
    try {
      const user = await getUserData();
      const response = await api.post('/ws_whatsapp.php', {
        codOpe: 'REINICIAR_SESION_WHATSAPP',
        usuario_id: user.id,
      });
      return response.data;
    } catch (error) {
      console.error('Error al reiniciar:', error);
      throw error;
    }
  },

  /**
   * Elimina la sesión de WhatsApp
   */
  eliminar: async () => {
    try {
      const user = await getUserData();
      const response = await api.post('/ws_whatsapp.php', {
        codOpe: 'ELIMINAR_SESION_WHATSAPP',
        usuario_id: user.id,
      });
      return response.data;
    } catch (error) {
      console.error('Error al eliminar:', error);
      throw error;
    }
  },
};

/**
 * Servicio de Plantillas de WhatsApp
 * Endpoints: /n8n/ws_whatsapp_services.php
 */
export const whatsappTemplatesService = {
  /**
   * Lista las plantillas de WhatsApp
   */
  listar: async (status = null, limit = 100) => {
    try {
      const user = await getUserData();
      const response = await api.post('/n8n/ws_whatsapp_services.php', {
        codOpe: 'LISTAR_PLANTILLAS',
        id_empresa: user.id_empresa,
        status,
        limit,
      });
      return response.data;
    } catch (error) {
      console.error('Error al listar plantillas:', error);
      throw error;
    }
  },

  /**
   * Envía una plantilla a un número
   */
  enviar: async (phone, templateName, language = 'es', components = []) => {
    try {
      const user = await getUserData();
      const response = await api.post('/n8n/ws_whatsapp_services.php', {
        codOpe: 'ENVIAR_PLANTILLA',
        id_empresa: user.id_empresa,
        phone,
        template_name: templateName,
        language,
        components,
      });
      return response.data;
    } catch (error) {
      console.error('Error al enviar plantilla:', error);
      throw error;
    }
  },

  /**
   * Envía un mensaje directo (WhatsApp Oficial)
   */
  enviarMensaje: async (phone, message) => {
    try {
      const user = await getUserData();
      const response = await api.post('/n8n/ws_send_whatsapp_oficial.php', {
        id_empresa: user.id_empresa,
        phone,
        message,
      });
      return response.data;
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      throw error;
    }
  },
};

/**
 * Servicio de Campañas CRM
 * Endpoints: /ws_configuracion.php
 */
export const whatsappCampaignsService = {
  /**
   * Lista las campañas CRM
   */
  listar: async () => {
    try {
      const user = await getUserData();
      const response = await api.post('/ws_configuracion.php', {
        codOpe: 'LISTAR_CAMPANIAS_CRM',
        id_empresa: user.id_empresa,
        id_usuario: user.id,
      });
      return response.data;
    } catch (error) {
      console.error('Error al listar campañas:', error);
      throw error;
    }
  },

  /**
   * Crea una nueva campaña
   */
  crear: async (data) => {
    try {
      const user = await getUserData();
      const response = await api.post('/ws_configuracion.php', {
        codOpe: 'CREAR_CAMPANIA_CRM',
        nombre_campana: data.nombre,
        descripcion: data.descripcion,
        id_usuario: user.id,
        ...data,
      });
      return response.data;
    } catch (error) {
      console.error('Error al crear campaña:', error);
      throw error;
    }
  },

  /**
   * Actualiza una campaña existente
   */
  actualizar: async (data) => {
    try {
      const user = await getUserData();
      const response = await api.post('/ws_configuracion.php', {
        codOpe: 'ACTUALIZAR_CAMPANIA_CRM',
        id: data.id,
        nombre_campana: data.nombre,
        descripcion: data.descripcion,
        id_usuario: user.id,
        ...data,
      });
      return response.data;
    } catch (error) {
      console.error('Error al actualizar campaña:', error);
      throw error;
    }
  },

  /**
   * Elimina una campaña
   */
  eliminar: async (id) => {
    try {
      const user = await getUserData();
      const response = await api.post('/ws_configuracion.php', {
        codOpe: 'ELIMINAR_CAMPANIA_CRM',
        id,
        id_usuario: user.id,
      });
      return response.data;
    } catch (error) {
      console.error('Error al eliminar campaña:', error);
      throw error;
    }
  },
};

/**
 * Servicio de Chatbot/Mensajería
 * Endpoints: /ws_chatbot.php
 */
export const chatbotService = {
  /**
   * Lista los contactos del chatbot
   */
  listarContactos: async (pagina = 1, limite = 50, busqueda = '', plataforma = '') => {
    try {
      const params = new URLSearchParams({
        accion: 'listarContactos',
        pagina,
        limite,
        busqueda,
        plataforma,
      });
      const response = await api.get(`/ws_chatbot.php?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error al listar contactos:', error);
      throw error;
    }
  },

  /**
   * Obtiene un contacto específico
   */
  obtenerContacto: async (id) => {
    try {
      const user = await getUserData();
      const response = await api.post('/ws_chatbot.php', {
        accion: 'obtenerContacto',
        id,
        usuario_id: user.id,
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener contacto:', error);
      throw error;
    }
  },

  /**
   * Lista los mensajes de un contacto
   */
  listarMensajes: async (id_contacto, pagina = 1, limite = 100) => {
    try {
      const response = await api.post('/ws_chatbot.php', {
        accion: 'listarMensajes',
        id_contacto,
        pagina,
        limite,
      });
      return response.data;
    } catch (error) {
      console.error('Error al listar mensajes:', error);
      throw error;
    }
  },

  /**
   * Envía un mensaje saliente
   */
  enviarMensaje: async (id_contacto, mensaje) => {
    try {
      const user = await getUserData();
      const response = await api.post('/ws_chatbot.php', {
        accion: 'enviarMensajeSalida',
        usuario_id: user.id,
        empresa_id: user.id_empresa,
        id_contacto,
        mensaje,
      });
      return response.data;
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      throw error;
    }
  },

  /**
   * Envía un archivo (imagen, video, documento)
   */
  enviarArchivo: async (id_contacto, tipo, url, filename = '', caption = '') => {
    try {
      const user = await getUserData();
      const response = await api.post('/ws_chatbot.php', {
        accion: 'enviarArchivoSalida',
        usuario_id: user.id,
        empresa_id: user.id_empresa,
        id_contacto,
        tipo, // 'image' | 'video' | 'document'
        url,
        filename,
        caption,
      });
      return response.data;
    } catch (error) {
      console.error('Error al enviar archivo:', error);
      throw error;
    }
  },

  /**
   * Obtiene estadísticas del chatbot
   */
  estadisticas: async () => {
    try {
      const user = await getUserData();
      const response = await api.post('/ws_chatbot.php', {
        accion: 'estadisticasChatbot',
        usuario_id: user.id,
        empresa_id: user.id_empresa,
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      throw error;
    }
  },
};

/**
 * Servicio de WhatsApp Embedded (Coexistence)
 * Endpoints: viva-api /crm/whatsapp-embedded/*
 * Usa la API de viva (localhost:3020/api/crm) en lugar de Maravia
 */
import { apiClient } from './api';

export const whatsappEmbeddedService = {
  /**
   * Procesa el token del Embedded Signup de Facebook
   * POST /crm/whatsapp-embedded/procesar-token
   */
  procesarToken: async (accessToken, eventType = 'FINISH', idPlataforma = 2) => {
    try {
      const response = await apiClient.post('/crm/whatsapp-embedded/procesar-token', {
        access_token: accessToken,
        event_type: eventType,
        id_plataforma: idPlataforma,
      });
      return response;
    } catch (error) {
      console.error('Error al procesar token:', error);
      throw error;
    }
  },

  /**
   * Obtiene la configuracion del Embedded Signup
   * GET /crm/whatsapp-embedded/configuracion
   */
  obtenerConfiguracion: async (idPlataforma = 2) => {
    try {
      const response = await apiClient.get('/crm/whatsapp-embedded/configuracion', {
        params: { id_plataforma: idPlataforma },
      });
      return response;
    } catch (error) {
      console.error('Error al obtener configuracion:', error);
      throw error;
    }
  },

  /**
   * Desconecta el Embedded Signup
   * POST /crm/whatsapp-embedded/desconectar
   */
  desconectar: async (idPlataforma = 2) => {
    try {
      const response = await apiClient.post('/crm/whatsapp-embedded/desconectar', {
        id_plataforma: idPlataforma,
      });
      return response;
    } catch (error) {
      console.error('Error al desconectar:', error);
      throw error;
    }
  },

  /**
   * Verifica el estado de la conexion
   * GET /crm/whatsapp-embedded/estado
   */
  verificarEstado: async (idPlataforma = 2) => {
    try {
      const response = await apiClient.get('/crm/whatsapp-embedded/estado', {
        params: { id_plataforma: idPlataforma },
      });
      return response;
    } catch (error) {
      console.error('Error al verificar estado:', error);
      throw error;
    }
  },

  /**
   * Suscribe el WABA a webhooks
   * POST /crm/whatsapp-embedded/suscribir-webhook
   */
  suscribirWebhook: async (idPlataforma = 2) => {
    try {
      const response = await apiClient.post('/crm/whatsapp-embedded/suscribir-webhook', {
        id_plataforma: idPlataforma,
      });
      return response;
    } catch (error) {
      console.error('Error al suscribir webhook:', error);
      throw error;
    }
  },

  /**
   * Suscribe webhooks para Coexistence
   * POST /crm/whatsapp-embedded/suscribir-coexistence
   */
  suscribirCoexistence: async (idPlataforma = 2) => {
    try {
      const response = await apiClient.post('/crm/whatsapp-embedded/suscribir-coexistence', {
        id_plataforma: idPlataforma,
      });
      return response;
    } catch (error) {
      console.error('Error al suscribir coexistence:', error);
      throw error;
    }
  },

  /**
   * Sincroniza datos SMB (contactos e historial)
   * POST /crm/whatsapp-embedded/sincronizar-smb
   */
  sincronizarSMB: async (idPlataforma = 2, syncType = 'all') => {
    try {
      const response = await apiClient.post('/crm/whatsapp-embedded/sincronizar-smb', {
        id_plataforma: idPlataforma,
        sync_type: syncType,
      });
      return response;
    } catch (error) {
      console.error('Error al sincronizar SMB:', error);
      throw error;
    }
  },
};

export default {
  whatsappService,
  whatsappQRService,
  whatsappTemplatesService,
  whatsappCampaignsService,
  chatbotService,
  whatsappEmbeddedService,
};
