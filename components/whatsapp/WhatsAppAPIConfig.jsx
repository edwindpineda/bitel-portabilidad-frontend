'use client';

/**
 * WhatsAppAPIConfig Component
 *
 * Componente para configurar WhatsApp Business API oficial
 * con soporte para Embedded Signup (Coexistence) de Meta.
 *
 * Funcionalidades:
 * - Embedded Signup con Facebook para vincular cuenta
 * - Soporte para modo Coexistence
 * - Visualizacion de estado de conexion
 * - Desvinculacion de cuenta
 */

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Loader2,
  AlertCircle,
  LogOut,
  Smartphone,
  Building2,
  Zap,
  Info,
  AlertTriangle,
} from 'lucide-react';
import { whatsappEmbeddedService } from '@/lib/whatsappService';

// ============================================
// CONFIGURACION
// ============================================
const FACEBOOK_APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '1132169025568098';

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function WhatsAppAPIConfig() {
  // Estado del Embedded Signup
  const [embeddedState, setEmbeddedState] = useState({
    loading: true,
    connected: false,
    phoneNumber: null,
    wabaId: null,
    phoneNumberId: null,
    businessName: null,
    error: null,
    // Campos de Coexistence
    accountMode: null,
    isCoexistence: false,
    canSendMessages: true,
    throughputLimit: 80,
  });

  // ============================================
  // CARGAR CONFIGURACION EXISTENTE
  // ============================================
  const cargarConfiguracion = useCallback(async () => {
    try {
      setEmbeddedState(prev => ({ ...prev, loading: true, error: null }));
      const response = await whatsappEmbeddedService.obtenerConfiguracion(2);

      if (response.success && response.connected) {
        setEmbeddedState({
          loading: false,
          connected: true,
          phoneNumber: response.data?.phone_number,
          wabaId: response.data?.waba_id,
          phoneNumberId: response.data?.phone_number_id,
          businessName: response.data?.business_name,
          accountMode: response.data?.account_mode,
          isCoexistence: response.data?.is_coexistence || false,
          canSendMessages: response.data?.can_send_messages !== false,
          throughputLimit: response.data?.throughput_limit || 80,
          error: null,
        });
      } else {
        setEmbeddedState(prev => ({
          ...prev,
          loading: false,
          connected: false,
        }));
      }
    } catch (error) {
      console.error('Error al cargar configuracion embedded:', error);
      setEmbeddedState(prev => ({
        ...prev,
        loading: false,
        error: 'Error al cargar la configuracion',
      }));
    }
  }, []);

  useEffect(() => {
    cargarConfiguracion();
  }, [cargarConfiguracion]);

  // ============================================
  // FUNCIONES DE FACEBOOK SDK
  // ============================================

  // Inicializar y lanzar login de Facebook
  const handleLaunchEmbeddedSignup = () => {
    setEmbeddedState(prev => ({ ...prev, loading: true, error: null }));

    const initAndLogin = () => {
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: 'v21.0',
      });
      window.fbSDKInitialized = true;
      launchFacebookLogin();
    };

    // Si el SDK ya esta cargado e inicializado
    if (window.FB && window.fbSDKInitialized) {
      launchFacebookLogin();
      return;
    }

    // Si el SDK esta cargado pero no inicializado
    if (window.FB && !window.fbSDKInitialized) {
      initAndLogin();
      return;
    }

    // SDK no cargado - cargar dinamicamente
    window.fbAsyncInit = function () {
      initAndLogin();
    };

    // Verificar si el script ya esta en el DOM
    if (!document.getElementById('facebook-jssdk')) {
      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      script.onerror = () => {
        setEmbeddedState(prev => ({
          ...prev,
          loading: false,
          error: 'Error al cargar el SDK de Facebook',
        }));
      };
      document.body.appendChild(script);
    }
  };

  // Lanzar el flujo de Facebook Login con permisos de WhatsApp
  const launchFacebookLogin = () => {
    window.FB.login(
      (response) => {
        (async () => {
          if (response.authResponse) {
            const accessToken = response.authResponse.accessToken;
            console.log('[Embedded Signup] Token obtenido');

            try {
              // Detectar el tipo de evento desde la respuesta
              // FINISH = Embedded Signup estandar
              // FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING = Coexistence
              const eventType = response.authResponse.code ? 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING' : 'FINISH';

              // Enviar token al backend para procesar
              const result = await whatsappEmbeddedService.procesarToken(
                accessToken,
                eventType,
                2
              );

              if (result.success) {
                setEmbeddedState({
                  loading: false,
                  connected: true,
                  phoneNumber: result.data?.phone_number,
                  wabaId: result.data?.waba_id,
                  phoneNumberId: result.data?.phone_number_id,
                  businessName: result.data?.business_name,
                  accountMode: result.data?.account_mode,
                  isCoexistence: result.data?.is_coexistence || false,
                  throughputLimit: result.data?.throughput_limit || 80,
                  canSendMessages: true,
                  error: null,
                });
              } else {
                setEmbeddedState(prev => ({
                  ...prev,
                  loading: false,
                  error: result.msg || 'Error al procesar el registro',
                }));
              }
            } catch (error) {
              console.error('Error procesando embedded signup:', error);
              setEmbeddedState(prev => ({
                ...prev,
                loading: false,
                error: 'Error al conectar con el servidor',
              }));
            }
          } else {
            setEmbeddedState(prev => ({
              ...prev,
              loading: false,
              error: 'No se completo la autorizacion con Facebook',
            }));
          }
        })();
      },
      {
        config_id: '1234567890', // Reemplazar con el config_id real de Meta
        response_type: 'code',
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: '',
          sessionInfoVersion: '3',
        },
      }
    );
  };

  // Desconectar cuenta
  const handleDesconectar = async () => {
    if (!confirm('Estas seguro de que deseas desvincular la cuenta de WhatsApp Business?')) {
      return;
    }

    setEmbeddedState(prev => ({ ...prev, loading: true }));

    try {
      const response = await whatsappEmbeddedService.desconectar(2);

      if (response.success) {
        setEmbeddedState({
          loading: false,
          connected: false,
          phoneNumber: null,
          wabaId: null,
          phoneNumberId: null,
          businessName: null,
          error: null,
          accountMode: null,
          isCoexistence: false,
          canSendMessages: true,
          throughputLimit: 80,
        });
      } else {
        setEmbeddedState(prev => ({
          ...prev,
          loading: false,
          error: response.msg || 'Error al desvincular',
        }));
      }
    } catch (error) {
      console.error('Error al desconectar:', error);
      setEmbeddedState(prev => ({
        ...prev,
        loading: false,
        error: 'Error al conectar con el servidor',
      }));
    }
  };

  // ============================================
  // RENDER: LOADING
  // ============================================
  if (embeddedState.loading && !embeddedState.connected && !embeddedState.error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  // ============================================
  // RENDER: ESTADO CONECTADO
  // ============================================
  if (embeddedState.connected) {
    return (
      <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-0">
        <CardContent className="p-8 text-center">
          {/* Icono de exito */}
          <div className="w-20 h-20 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h2 className="text-xl font-bold mb-2">WhatsApp Business Vinculado</h2>
          <p className="text-blue-100 mb-4">
            Tu cuenta esta conectada via Embedded Signup
          </p>

          {/* Numero de telefono */}
          {embeddedState.phoneNumber && (
            <Badge variant="secondary" className="px-4 py-2 bg-white/20 text-white border-0 mb-3">
              <Smartphone className="w-4 h-4 mr-2" />
              {embeddedState.phoneNumber}
            </Badge>
          )}

          {/* Nombre del negocio */}
          {embeddedState.businessName && (
            <div className="flex items-center justify-center gap-2 text-blue-100 mb-4">
              <Building2 className="w-4 h-4" />
              {embeddedState.businessName}
            </div>
          )}

          {/* Informacion de Coexistence */}
          {embeddedState.accountMode && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              embeddedState.isCoexistence
                ? 'bg-yellow-500/30'
                : 'bg-green-500/30'
            }`}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Zap className="w-4 h-4" />
                <strong>
                  Modo: {embeddedState.accountMode}
                  {embeddedState.isCoexistence && ' (Coexistence)'}
                </strong>
              </div>
              <div className="text-blue-100">
                Throughput: {embeddedState.throughputLimit} msg/seg
              </div>
            </div>
          )}

          {/* Boton de desconectar */}
          <Button
            variant="outline"
            className="w-full mt-6 bg-white/10 border-white/50 text-white hover:bg-white/20"
            onClick={handleDesconectar}
            disabled={embeddedState.loading}
          >
            {embeddedState.loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Desvinculando...
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4 mr-2" />
                Desvincular Cuenta
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ============================================
  // RENDER: ESTADO NO CONECTADO
  // ============================================
  return (
    <div className="space-y-4">
      {/* Card principal de conexion */}
      <Card>
        <CardContent className="p-8 text-center">
          {/* Icono de Facebook */}
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </div>

          <h2 className="text-xl font-bold text-foreground mb-2">
            Vincula tu WhatsApp Business
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Conecta tu cuenta de WhatsApp Business oficial usando el proceso de
            Embedded Signup de Meta. Este metodo permite coexistencia con otros proveedores.
          </p>

          {/* Boton de conexion */}
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
            onClick={handleLaunchEmbeddedSignup}
            disabled={embeddedState.loading}
          >
            {embeddedState.loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Continuar con Facebook
              </>
            )}
          </Button>

          {/* Mensaje de error */}
          {embeddedState.error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{embeddedState.error}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card informativa: Que es Embedded Signup */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h3 className="font-semibold text-blue-900 flex items-center gap-2 mb-2">
            <Info className="w-4 h-4" />
            Que es Embedded Signup?
          </h3>
          <ul className="text-sm text-blue-800 space-y-1 ml-6 list-disc">
            <li><strong>Integracion oficial:</strong> Conecta directamente con la API de WhatsApp Cloud de Meta.</li>
            <li><strong>Coexistencia:</strong> Permite que multiples proveedores administren tu cuenta simultaneamente.</li>
            <li><strong>Seguro:</strong> El proceso de autorizacion se realiza directamente con Meta.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Card informativa: Requisitos */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <h3 className="font-semibold text-yellow-900 flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4" />
            Requisitos
          </h3>
          <ul className="text-sm text-yellow-800 space-y-1 ml-6 list-disc">
            <li>Tener una cuenta de Facebook Business</li>
            <li>Tener una cuenta de WhatsApp Business verificada</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
