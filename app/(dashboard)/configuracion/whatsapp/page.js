'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronRight, RefreshCw, Wifi, WifiOff, LogOut, QrCode, Smartphone, Clock, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

// Componente para WhatsApp API (Embedded Signup)
import WhatsAppAPIConfig from '@/components/whatsapp/WhatsAppAPIConfig';

const WHATSAPP_BASE_URL = 'https://bitel-baileys.xylure.easypanel.host/session';
const WHATSAPP_TOKEN = 'f39a8c1d7b264fb19ce2a1d0b7441e98c4f7ba3ef1cd9a0e5d2c8f03b7a5e961';

export default function WhatsAppPage() {
  const { data: session } = useSession();

  // Estado para el selector de proveedor (whatsapp-api por defecto)
  const [whatsappProvider, setWhatsappProvider] = useState('whatsapp-api');

  // Estados para Baileys (QR)
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState(null);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  const empresaId = session?.user?.id_empresa || 1;

  const fetchQRCode = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`${WHATSAPP_BASE_URL}/${empresaId}/qr`, {
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
  }, [empresaId]);

  // Solo cargar QR cuando se selecciona Baileys
  useEffect(() => {
    if (whatsappProvider === 'baileys') {
      fetchQRCode();
    }
  }, [fetchQRCode, whatsappProvider]);

  // Auto-refresh solo para Baileys
  useEffect(() => {
    if (whatsappProvider !== 'baileys') return;
    if (!autoRefresh || sessionData?.connected) return;

    const interval = setInterval(() => {
      fetchQRCode();
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh, sessionData?.connected, fetchQRCode, whatsappProvider]);

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

      const response = await fetch(`${WHATSAPP_BASE_URL}/${empresaId}/disconnect`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al desconectar la sesion');
      }

      await fetchQRCode();
    } catch (err) {
      console.error('Error disconnecting:', err);
      setError(err.message);
    } finally {
      setDisconnecting(false);
    }
  };

  // Solo mostrar loading si estamos en Baileys y aun no hay datos
  if (whatsappProvider === 'baileys' && loading && !sessionData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb & Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-1 text-sm text-muted-foreground mb-2">
          <Link href="/configuracion" className="hover:text-primary transition-colors">Configuracion</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">WhatsApp</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Conexion WhatsApp</h1>
            <p className="text-muted-foreground mt-1">
              {whatsappProvider === 'whatsapp-api'
                ? 'Configura WhatsApp Business API oficial'
                : 'Escanea el codigo QR para conectar WhatsApp'
              }
            </p>
          </div>
          {/* Selector de proveedor */}
          <Select value={whatsappProvider} onValueChange={setWhatsappProvider}>
            <SelectTrigger className="w-[180px] bg-gradient-to-r from-green-500 to-green-600 text-white border-0 hover:from-green-600 hover:to-green-700">
              <SelectValue placeholder="Seleccionar proveedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="whatsapp-api">WhatsApp API</SelectItem>
              <SelectItem value="baileys">Baileys</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator className="mb-6" />

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Contenido condicional segun el proveedor */}
        {whatsappProvider === 'whatsapp-api' ? (
          // WhatsApp API (Embedded Signup)
          <WhatsAppAPIConfig />
        ) : (
          // Baileys (QR Code)
          <>
          <Card>
            <CardContent className="p-8">
              {/* Status Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  {sessionData?.connected ? (
                    <Wifi className="w-5 h-5 text-green-500" />
                  ) : (
                    <WifiOff className="w-5 h-5 text-yellow-500" />
                  )}
                  <Badge variant={sessionData?.connected ? 'default' : 'secondary'} className={sessionData?.connected ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'}>
                    {sessionData?.connected ? 'Conectado' : 'Desconectado'}
                  </Badge>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="auto-refresh"
                      checked={autoRefresh}
                      onCheckedChange={(checked) => setAutoRefresh(checked)}
                    />
                    <label htmlFor="auto-refresh" className="text-sm text-muted-foreground cursor-pointer">
                      Auto-refrescar
                    </label>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={loading}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Actualizar
                  </Button>
                </div>
              </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {sessionData?.connected ? (
              /* Connected State */
              <div className="text-center py-8">
                <div className="w-24 h-24 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">WhatsApp Conectado</h2>
                <p className="text-muted-foreground mb-4">La sesion de WhatsApp esta activa y funcionando correctamente.</p>

                {sessionData?.phoneNumber && (
                  <Badge variant="outline" className="px-4 py-2 text-green-700 border-green-200 bg-green-50">
                    <Smartphone className="w-4 h-4 mr-2" />
                    <span className="font-medium">{sessionData.phoneNumber}</span>
                  </Badge>
                )}

                <div className="mt-6 p-4 bg-muted rounded-lg text-left">
                  <h3 className="font-medium text-foreground mb-2">Informacion de la sesion:</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li><span className="font-medium">Session ID:</span> {sessionData?.sessionId || empresaId}</li>
                    <li><span className="font-medium">Estado:</span> Conectado</li>
                    {sessionData?.message && <li><span className="font-medium">Mensaje:</span> {sessionData.message}</li>}
                  </ul>
                </div>

                <div className="mt-6">
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                  >
                    {disconnecting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Desconectando...
                      </>
                    ) : (
                      <>
                        <LogOut className="w-5 h-5 mr-2" />
                        Desconectar Sesion
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              /* QR Code State */
              <div className="text-center">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-foreground mb-2">Escanea el codigo QR</h2>
                  <p className="text-sm text-muted-foreground">{sessionData?.message || 'Abre WhatsApp en tu telefono y escanea el codigo'}</p>
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
                  <div className="w-64 h-64 mx-auto bg-muted rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <QrCode className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                      <span className="text-muted-foreground text-sm">Codigo QR no disponible</span>
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 animate-pulse" />
                    <span>El codigo se actualiza automaticamente cada 10 segundos</span>
                  </div>
                </div>

                <Card className="mt-6 bg-blue-50 border-blue-200">
                  <CardContent className="p-4 text-left">
                    <h3 className="font-medium text-blue-900 mb-2">Como escanear:</h3>
                    <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                      <li>Abre WhatsApp en tu telefono</li>
                      <li>Toca Menu o Configuracion y selecciona Dispositivos vinculados</li>
                      <li>Toca en Vincular un dispositivo</li>
                      <li>Apunta tu telefono hacia esta pantalla para escanear el codigo</li>
                    </ol>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Session Info - Solo para Baileys */}
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium text-foreground mb-2">Informacion tecnica:</h3>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><span className="font-medium">Session ID:</span> {sessionData?.sessionId || empresaId}</p>
              <p><span className="font-medium">Estado:</span> {sessionData?.connected ? 'Conectado' : 'Esperando conexion'}</p>
              <p><span className="font-medium">Auto-refresh:</span> {autoRefresh ? 'Activado (10s)' : 'Desactivado'}</p>
            </div>
          </CardContent>
        </Card>
        </>
        )}
      </div>
    </div>
  );
}
