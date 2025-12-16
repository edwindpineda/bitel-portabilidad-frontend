'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const WHATSAPP_API_URL = 'https://bitel-baileys.xylure.easypanel.host/session/bitel/qr';
const WHATSAPP_DISCONNECT_URL = 'https://bitel-baileys.xylure.easypanel.host/session/bitel/disconnect';
const WHATSAPP_TOKEN = 'f39a8c1d7b264fb19ce2a1d0b7441e98c4f7ba3ef1cd9a0e5d2c8f03b7a5e961';

export default function WhatsAppPage() {
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState(null);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  const fetchQRCode = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(WHATSAPP_API_URL, {
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al obtener el codigo QR');
      }

      const data = await response.json();
      setSessionData(data);
    } catch (err) {
      console.error('Error fetching QR:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQRCode();
  }, [fetchQRCode]);

  useEffect(() => {
    if (!autoRefresh || sessionData?.connected) return;

    const interval = setInterval(() => {
      fetchQRCode();
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh, sessionData?.connected, fetchQRCode]);

  const handleRefresh = () => {
    setLoading(true);
    fetchQRCode();
  };

  const handleDisconnect = async () => {
    if (!confirm('¿Estas seguro de que deseas desconectar la sesion de WhatsApp?')) {
      return;
    }

    try {
      setDisconnecting(true);
      setError(null);

      const response = await fetch(WHATSAPP_DISCONNECT_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al desconectar la sesion');
      }

      // Actualizar el estado despues de desconectar
      await fetchQRCode();
    } catch (err) {
      console.error('Error disconnecting:', err);
      setError(err.message);
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading && !sessionData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
          <Link href="/configuracion" className="hover:text-primary-600">Configuracion</Link>
          <span>/</span>
          <span className="text-gray-900">WhatsApp</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Conexion WhatsApp</h1>
        <p className="text-gray-600 mt-1">Escanea el codigo QR para conectar WhatsApp</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Status Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full ${sessionData?.connected ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></div>
              <span className={`font-semibold ${sessionData?.connected ? 'text-green-700' : 'text-yellow-700'}`}>
                {sessionData?.connected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span>Auto-refrescar</span>
              </label>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-green-600 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Actualizar</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2 text-red-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          {sessionData?.connected ? (
            /* Connected State */
            <div className="text-center py-8">
              <div className="w-24 h-24 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">WhatsApp Conectado</h2>
              <p className="text-gray-600 mb-4">La sesion de WhatsApp esta activa y funcionando correctamente.</p>

              {sessionData?.phoneNumber && (
                <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-50 rounded-lg text-green-700">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  <span className="font-medium">{sessionData.phoneNumber}</span>
                </div>
              )}

              <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left">
                <h3 className="font-medium text-gray-900 mb-2">Informacion de la sesion:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li><span className="font-medium">Session ID:</span> {sessionData?.sessionId || 'bitel'}</li>
                  <li><span className="font-medium">Estado:</span> Conectado</li>
                  {sessionData?.message && <li><span className="font-medium">Mensaje:</span> {sessionData.message}</li>}
                </ul>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {disconnecting ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Desconectando...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Desconectar Sesion</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* QR Code State */
            <div className="text-center">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Escanea el codigo QR</h2>
                <p className="text-sm text-gray-600">{sessionData?.message || 'Abre WhatsApp en tu telefono y escanea el codigo'}</p>
              </div>

              {sessionData?.qr ? (
                <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-xl shadow-sm">
                  <img
                    src={sessionData.qr}
                    alt="WhatsApp QR Code"
                    className="w-64 h-64 object-contain"
                  />
                </div>
              ) : (
                <div className="w-64 h-64 mx-auto bg-gray-100 rounded-xl flex items-center justify-center">
                  <span className="text-gray-500">Codigo QR no disponible</span>
                </div>
              )}

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>El codigo se actualiza automaticamente cada 10 segundos</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg text-left">
                <h3 className="font-medium text-blue-900 mb-2">Como escanear:</h3>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Abre WhatsApp en tu telefono</li>
                  <li>Toca Menu o Configuracion y selecciona Dispositivos vinculados</li>
                  <li>Toca en Vincular un dispositivo</li>
                  <li>Apunta tu telefono hacia esta pantalla para escanear el codigo</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Session Info */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Informacion tecnica:</h3>
          <div className="text-xs text-gray-500 space-y-1">
            <p><span className="font-medium">Session ID:</span> {sessionData?.sessionId || 'bitel'}</p>
            <p><span className="font-medium">Estado:</span> {sessionData?.connected ? 'Conectado' : 'Esperando conexion'}</p>
            <p><span className="font-medium">Auto-refresh:</span> {autoRefresh ? 'Activado (10s)' : 'Desactivado'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
