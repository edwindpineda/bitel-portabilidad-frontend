'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Phone,
  ArrowLeft,
  User,
  Clock,
  Calendar,
  Megaphone,
  FileText,
  Volume2,
  Download,
  Loader2,
  AlertCircle,
  Hash,
} from 'lucide-react';

const COLOR_MAP = {
  'rojo': '#EF4444',
  'naranja': '#F97316',
  'amarillo': '#EAB308',
  'verde': '#22C55E',
  'azul': '#3B82F6',
  'indigo': '#6366F1',
  'cyan': '#06B6D4',
  'teal': '#14B8A6',
  'gris': '#6B7280',
  'morado': '#A855F7',
  'rosa': '#EC4899',
};

const getColorHex = (color) => {
  if (!color) return '#6B7280';
  if (color.startsWith('#')) return color;
  return COLOR_MAP[color.toLowerCase()] || '#6B7280';
};

const formatDuration = (seconds) => {
  if (!seconds && seconds !== 0) return '-';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function LlamadaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [llamada, setLlamada] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAudioModal, setShowAudioModal] = useState(false);

  useEffect(() => {
    const loadLlamada = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get(`/crm/llamadas/${params.id}`);
        setLlamada(res.data);
      } catch (err) {
        console.error('Error al cargar llamada:', err);
        setError('No se pudo cargar la informacion de la llamada');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadLlamada();
    }
  }, [params.id]);

  const getAudioUrl = (archivoLlamada) => {
    if (!archivoLlamada) return null;
    if (archivoLlamada.startsWith('http')) return archivoLlamada;
    return `${process.env.NEXT_PUBLIC_API_URL || ''}/uploads/llamadas/${archivoLlamada}`;
  };

  const handleDownloadAudio = () => {
    if (!llamada?.archivo_llamada) return;
    const url = getAudioUrl(llamada.archivo_llamada);
    const link = document.createElement('a');
    link.href = url;
    link.download = llamada.archivo_llamada;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !llamada) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/llamadas">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Detalle de Llamada</h1>
        </div>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 flex flex-col items-center justify-center gap-3">
            <AlertCircle className="h-12 w-12 text-red-400" />
            <p className="text-muted-foreground">{error || 'Llamada no encontrada'}</p>
            <Link href="/llamadas">
              <Button variant="outline" size="sm">Volver al listado</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/llamadas">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Llamada #{llamada.codigo_llamada || llamada.id}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Detalle completo de la llamada
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Informacion Principal */}
        <div className="lg:col-span-2 space-y-5">
          {/* Datos del Contacto */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-blue-500" />
                Datos del Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Nombre</p>
                <p className="text-sm font-medium">{llamada.contacto_nombre || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Telefono</p>
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-sm font-medium">{llamada.telefono || '-'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Documento</p>
                <p className="text-sm font-medium">{llamada.numero_documento || '-'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Datos de la Llamada */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Phone className="h-4 w-4 text-emerald-500" />
                Datos de la Llamada
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Campaña</p>
                <div className="flex items-center gap-1.5">
                  <Megaphone className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-sm font-medium">{llamada.campania_nombre || '-'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Tipificacion</p>
                {llamada.tipificacion_llamada_nombre ? (
                  <Badge
                    variant="outline"
                    className="text-xs font-medium border"
                    style={{
                      color: getColorHex(llamada.tipificacion_llamada_color),
                      borderColor: getColorHex(llamada.tipificacion_llamada_color) + '55',
                      backgroundColor: getColorHex(llamada.tipificacion_llamada_color) + '12',
                    }}
                  >
                    {llamada.tipificacion_llamada_nombre}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    Sin tipificar
                  </Badge>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Duracion</p>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-sm font-medium">{formatDuration(llamada.duracion_seg)}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Fecha Inicio</p>
                <p className="text-sm font-medium">{formatDateTime(llamada.fecha_inicio)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Fecha Fin</p>
                <p className="text-sm font-medium">{formatDateTime(llamada.fecha_fin)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Fecha Registro</p>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-sm font-medium">{formatDateTime(llamada.fecha_registro)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informacion Tecnica */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-500" />
                Informacion Tecnica
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Provider Call ID</p>
                <p className="text-xs font-mono bg-muted/50 px-2 py-1 rounded truncate">
                  {llamada.provider_call_id || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">ID Ejecucion Campaña</p>
                <div className="flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    {llamada.id_campania_ejecucion || llamada.id_campania_ejecucion_rel || '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel Lateral - Audio */}
        <div className="space-y-5">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-purple-500" />
                Audio de Llamada
              </CardTitle>
            </CardHeader>
            <CardContent>
              {llamada.archivo_llamada ? (
                <div className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Archivo</p>
                    <p className="text-xs font-mono truncate">{llamada.archivo_llamada}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowAudioModal(true)}
                      className="flex-1 gap-2"
                      variant="default"
                    >
                      <Volume2 className="h-4 w-4" />
                      Reproducir
                    </Button>
                    <Button
                      onClick={handleDownloadAudio}
                      className="flex-1 gap-2"
                      variant="outline"
                    >
                      <Download className="h-4 w-4" />
                      Descargar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Volume2 className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">Sin audio disponible</p>
                  <Button
                    disabled
                    className="w-full mt-4 gap-2"
                    variant="outline"
                  >
                    <Volume2 className="h-4 w-4" />
                    Reproducir Audio
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats rapidos */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Codigo Llamada</p>
                  <p className="text-xl font-bold text-blue-700">#{llamada.codigo_llamada || llamada.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal Reproductor de Audio */}
      <Dialog open={showAudioModal} onOpenChange={setShowAudioModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Volume2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <span>Audio de Llamada #{llamada.codigo_llamada || llamada.id}</span>
                <p className="text-xs font-normal text-muted-foreground mt-0.5">
                  Reproducir grabacion de llamada
                </p>
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">Reproductor de audio de llamada</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Info de la llamada */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Contacto</p>
                <p className="font-medium">{llamada.contacto_nombre || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Telefono</p>
                <p className="font-medium">{llamada.telefono || '-'}</p>
              </div>
            </div>

            {/* Archivo info */}
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Archivo</p>
              <p className="text-xs font-mono truncate">{llamada.archivo_llamada}</p>
            </div>

            {/* Reproductor de audio */}
            <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-4 border">
              <audio
                controls
                className="w-full"
                src={getAudioUrl(llamada.archivo_llamada)}
              >
                Tu navegador no soporta el elemento de audio.
              </audio>
            </div>

            {/* Boton de descarga */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadAudio}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Descargar audio
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
