'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Plus, Search, Pencil, Trash2, Loader2, Send, Eye, Database,
  CheckCircle2, Clock, MessageSquare, Users,
} from 'lucide-react';

import CreateEditEnvioModal from '@/components/whatsapp/CreateEditEnvioModal';
import EnvioDetailModal from '@/components/whatsapp/EnvioDetailModal';
import ConfirmEnvioModal from '@/components/whatsapp/ConfirmEnvioModal';

const ESTADO_STYLES = {
  pendiente: { className: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500 animate-pulse', label: 'Pendiente' },
  en_proceso: { className: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500 animate-pulse', label: 'En Proceso' },
  enviado: { className: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500', label: 'Enviado' },
  entregado: { className: 'bg-green-100 text-green-800', dot: 'bg-green-500', label: 'Entregado' },
  cancelado: { className: 'bg-gray-100 text-gray-800', dot: 'bg-gray-500', label: 'Cancelado' },
};

export default function EnviosMasivosPage() {
  const [envios, setEnvios] = useState([]);
  const [plantillas, setPlantillas] = useState([]);
  const [bases, setBases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingEnvio, setEditingEnvio] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    id_plantilla: '',
  });
  const [selectedBases, setSelectedBases] = useState([]);

  // Detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEnvio, setSelectedEnvio] = useState(null);
  const [envioBases, setEnvioBases] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Confirm envio modal
  const [showConfirmEnvio, setShowConfirmEnvio] = useState(false);
  const [envioParaEnviar, setEnvioParaEnviar] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [progresoEnvio, setProgresoEnvio] = useState({ enviados: 0, total: 0, errores: 0 });

  useEffect(() => {
    loadData();
  }, []);

  // Polling: recargar datos cada 3s si hay envíos en proceso
  useEffect(() => {
    const hayEnProceso = envios.some(e => e.estado_envio === 'en_proceso');
    if (!hayEnProceso) return;

    const interval = setInterval(() => {
      loadData(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [envios]);

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [enviosRes, plantillasRes, basesRes] = await Promise.all([
        apiClient.get('/crm/envio-masivo-whatsapp').catch(() => ({ data: [] })),
        apiClient.get('/crm/plantillas-whatsapp').catch(() => ({ data: { templates: [] } })),
        apiClient.get('/crm/bases-numeros').catch(() => ({ data: [] })),
      ]);
      setEnvios(enviosRes?.data || []);
      const allPlantillas = plantillasRes?.data?.templates || plantillasRes?.data || [];
      setPlantillas(allPlantillas.filter(p => p.status === 'APPROVED'));
      setBases(basesRes?.data || []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const filteredEnvios = envios.filter(e =>
    e.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingEnvio(null);
    setFormData({ titulo: '', descripcion: '', id_plantilla: '' });
    setSelectedBases([]);
    setShowModal(true);
  };

  const openEditModal = async (envio) => {
    setEditingEnvio(envio);
    // Convert timestamp to datetime-local format (YYYY-MM-DDTHH:mm)
    let fechaFormateada = '';
    if (envio.fecha_envio) {
      const d = new Date(envio.fecha_envio);
      if (!isNaN(d.getTime())) {
        fechaFormateada = d.toISOString().slice(0, 16);
      }
    }
    setFormData({
      titulo: envio.titulo || '',
      descripcion: envio.descripcion || '',
      id_plantilla: envio.id_plantilla || '',
      fecha_envio: fechaFormateada,
    });

    // Cargar envio_base del envio para edicion
    // id_base ahora apunta a base_numero_detalle, extraer los base_numero IDs unicos
    try {
      const response = await apiClient.get(`/crm/envio-base/envio-masivo/${envio.id}`);
      const envioBaseRecords = response?.data || [];
      const baseNumeroIds = [...new Set(envioBaseRecords.map(eb => eb.id_base_numero).filter(Boolean))];
      setSelectedBases(baseNumeroIds);
    } catch (error) {
      console.error('Error al cargar envio_base del envio:', error);
      setSelectedBases([]);
    }

    setShowModal(true);
  };

  const handleSave = async (datosEnvio = {}) => {
    if (!formData.titulo || !formData.id_plantilla) {
      toast.error('Titulo y plantilla son requeridos');
      return;
    }

    if (selectedBases.length === 0) {
      toast.error('Debe seleccionar al menos una base');
      return;
    }

    setSaving(true);
    try {
      // Resolver las bases seleccionadas a detalles individuales (base_numero_detalle)
      let allDetalleIds = [];
      for (const baseId of selectedBases) {
        try {
          const res = await apiClient.get(`/crm/bases-numeros/${baseId}/detalles?page=1&limit=999999`);
          const detalles = res.data || [];
          allDetalleIds = allDetalleIds.concat(detalles.map(d => d.id));
        } catch (err) {
          console.error(`Error al obtener detalles de base ${baseId}:`, err);
        }
      }

      if (allDetalleIds.length === 0) {
        toast.error('Las bases seleccionadas no contienen registros');
        setSaving(false);
        return;
      }

      if (editingEnvio) {
        await apiClient.put(`/crm/envio-masivo-whatsapp/${editingEnvio.id}`, {
          id_plantilla: parseInt(formData.id_plantilla),
          titulo: formData.titulo,
          descripcion: formData.descripcion,
          cantidad: allDetalleIds.length,
          fecha_envio: datosEnvio.fechaEnvio || null,
        });

        // Sincronizar envio_base con los nuevos detalle IDs
        await apiClient.put(`/crm/envio-base/sync/${editingEnvio.id}`, {
          bases: allDetalleIds.map(id_base => ({ id_base })),
        });

        toast.success('Envio masivo actualizado');
      } else {
        // Paso 1: Crear el envio masivo
        const envioRes = await apiClient.post('/crm/envio-masivo-whatsapp', {
          id_plantilla: parseInt(formData.id_plantilla),
          titulo: formData.titulo,
          descripcion: formData.descripcion,
          cantidad: allDetalleIds.length,
          fecha_envio: datosEnvio.fechaEnvio || null,
          estado_envio: 'pendiente',
        });

        const envioId = envioRes?.data?.id;

        // Paso 2: Crear los envio_base con IDs de base_numero_detalle
        if (envioId && allDetalleIds.length > 0) {
          await apiClient.post('/crm/envio-base/bulk', {
            id_envio_masivo: envioId,
            bases: allDetalleIds.map(id_base => ({ id_base })),
          });
        }

        toast.success('Envio masivo creado exitosamente');

        // Si es envío instantáneo, ejecutar el envío inmediatamente
        if (datosEnvio.envioInstantaneo && envioId) {
          try {
            const envioRes2 = await apiClient.post(`/crm/envio-masivo-whatsapp/${envioId}/enviar`);
            const { cantidadExitosos, cantidadFallidos } = envioRes2?.data || {};
            toast.success(`Envio completado: ${cantidadExitosos || 0} exitosos, ${cantidadFallidos || 0} fallidos`);
          } catch (envioError) {
            console.error('Error al ejecutar envio instantaneo:', envioError);
            toast.error(envioError?.msg || 'Error al ejecutar el envio instantaneo');
          }
        }
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.error(error?.msg || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (envio) => {
    if (!confirm(`¿Eliminar el envio masivo "${envio.titulo}"?`)) return;

    try {
      await apiClient.delete(`/crm/envio-masivo-whatsapp/${envio.id}`);
      toast.success('Envio eliminado');
      loadData();
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast.error('Error al eliminar');
    }
  };

  // Usa el endpoint de envio-base para cargar el detalle
  const handleViewDetail = async (envio) => {
    setSelectedEnvio(envio);
    setShowDetailModal(true);
    setLoadingDetail(true);
    try {
      const response = await apiClient.get(`/crm/envio-base/envio-masivo/${envio.id}`);
      setEnvioBases(response?.data || []);
    } catch (error) {
      console.error('Error al cargar detalle:', error);
      setEnvioBases([]);
    } finally {
      setLoadingDetail(false);
    }
  };

  const toggleBaseSelection = (id) => {
    setSelectedBases(prev =>
      prev.includes(id) ? prev.filter(bid => bid !== id) : [...prev, id]
    );
  };

  const handleAbrirConfirmEnvio = (envio) => {
    setEnvioParaEnviar(envio);
    setProgresoEnvio({ enviados: 0, total: envio.cantidad || 0, errores: 0 });
    setShowConfirmEnvio(true);
  };

  const handleConfirmarEnvio = async () => {
    if (!envioParaEnviar) return;

    setEnviando(true);
    try {
      await apiClient.post(`/crm/envio-masivo-whatsapp/${envioParaEnviar.id}/enviar`);
      toast.success('Envío masivo iniciado. El progreso se actualizará automáticamente.');
      setShowConfirmEnvio(false);
      setEnvioParaEnviar(null);
      loadData();
    } catch (error) {
      console.error('Error al ejecutar envio:', error);
      toast.error(error?.msg || 'Error al ejecutar el envio');
    } finally {
      setEnviando(false);
    }
  };

  const handleCerrarConfirmEnvio = () => {
    if (!enviando) {
      setShowConfirmEnvio(false);
      setEnvioParaEnviar(null);
      setProgresoEnvio({ enviados: 0, total: 0, errores: 0 });
    }
  };

  // Stats
  const totalEnvios = envios.length;
  const totalPendientes = envios.filter(e => e.estado_envio === 'pendiente').length;
  const totalEntregados = envios.filter(e => e.estado_envio === 'entregado').length;
  const totalBasesCount = envios.reduce((sum, e) => sum + (e.cantidad || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Envios Masivos WhatsApp</h1>
          <p className="text-muted-foreground mt-1">Gestiona tus envios masivos de plantillas</p>
        </div>
        <Button onClick={openCreateModal} className="bg-[#25D366] hover:bg-[#128C7E] text-white">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Envio
        </Button>
      </div>

      <Separator />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-[#25D366]/90 to-[#128C7E] text-white border-0">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/80">Total Envios</p>
                <p className="text-3xl font-bold mt-1">{totalEnvios}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <Send className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md hover:border-yellow-200 transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse" />
                  <p className="text-sm text-muted-foreground">Pendientes</p>
                </div>
                <p className="text-3xl font-bold text-yellow-600 mt-1">{totalPendientes}</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-xl">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md hover:border-green-200 transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  <p className="text-sm text-muted-foreground">Entregados</p>
                </div>
                <p className="text-3xl font-bold text-green-600 mt-1">{totalEntregados}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md hover:border-blue-200 transition-all">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <p className="text-sm text-muted-foreground">Bases</p>
                </div>
                <p className="text-3xl font-bold text-blue-600 mt-1">{totalBasesCount}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Database className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por titulo o descripcion..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="outline" className="gap-1">
              <Send className="h-3 w-3" />
              {filteredEnvios.length} envio{filteredEnvios.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-xs font-bold uppercase w-10 text-center">#</TableHead>
              <TableHead className="text-xs font-bold uppercase">Titulo</TableHead>
              <TableHead className="text-xs font-bold uppercase">Plantilla</TableHead>
              <TableHead className="text-xs font-bold uppercase text-center">Bases</TableHead>
              <TableHead className="text-xs font-bold uppercase text-center">Exitosos</TableHead>
              <TableHead className="text-xs font-bold uppercase text-center">Fallidos</TableHead>
              <TableHead className="text-xs font-bold uppercase">Estado</TableHead>
              <TableHead className="text-xs font-bold uppercase">Fecha Envio</TableHead>
              <TableHead className="text-xs font-bold uppercase text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEnvios.map((envio, index) => {
              const estadoStyle = ESTADO_STYLES[envio.estado_envio] || ESTADO_STYLES.pendiente;
              return (
                <TableRow key={envio.id} className="group hover:bg-muted/50">
                  <TableCell className="text-center">
                    <span className="text-xs font-medium text-muted-foreground">{index + 1}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#25D366]/10 to-[#128C7E]/10 flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-[#25D366]" />
                      </div>
                      <div>
                        <span className="font-semibold text-sm">{envio.titulo}</span>
                        {envio.descripcion && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{envio.descripcion}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 border border-green-200/50">
                      {envio.plantilla_nombre || '-'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm font-medium">{envio.cantidad || 0}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm font-medium text-green-600">{envio.cantidad_exitosos || 0}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm font-medium text-red-600">{envio.cantidad_fallidos || 0}</span>
                  </TableCell>
                  <TableCell>
                    <Badge className={estadoStyle.className}>
                      <span className={`w-1.5 h-1.5 rounded-full ${estadoStyle.dot} mr-1.5`} />
                      {estadoStyle.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {envio.fecha_envio
                        ? new Date(envio.fecha_envio).toLocaleString('es-PE', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })
                        : '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <TooltipProvider delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-lg hover:bg-blue-50 text-blue-500 hover:text-blue-700"
                              onClick={() => handleViewDetail(envio)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Ver Detalle</TooltipContent>
                        </Tooltip>
                        {envio.estado_envio !== 'entregado' && (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg hover:bg-green-50 text-[#25D366] hover:text-[#128C7E]"
                                  onClick={() => handleAbrirConfirmEnvio(envio)}
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Enviar Ahora</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg hover:bg-amber-50 text-amber-500 hover:text-amber-700"
                                  onClick={() => openEditModal(envio)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Editar</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600"
                                  onClick={() => handleDelete(envio)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Eliminar</TooltipContent>
                            </Tooltip>
                          </>
                        )}
                      </TooltipProvider>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {filteredEnvios.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#25D366]/10 to-[#128C7E]/10 flex items-center justify-center mb-4">
              <Send className="h-8 w-8 text-[#25D366]/50" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              {searchTerm ? 'Sin resultados' : 'No hay envios masivos'}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              {searchTerm ? 'Intenta con otro termino' : 'Crea tu primer envio masivo'}
            </p>
          </div>
        )}
      </Card>

      {/* Modals */}
      <CreateEditEnvioModal
        open={showModal}
        onOpenChange={setShowModal}
        editingEnvio={editingEnvio}
        formData={formData}
        setFormData={setFormData}
        plantillas={plantillas}
        bases={bases}
        selectedBases={selectedBases}
        onToggleBase={toggleBaseSelection}
        onSelectAllBases={setSelectedBases}
        onSave={handleSave}
        saving={saving}
      />

      <EnvioDetailModal
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        envio={selectedEnvio}
        bases={envioBases}
        loading={loadingDetail}
      />

      <ConfirmEnvioModal
        open={showConfirmEnvio}
        onOpenChange={handleCerrarConfirmEnvio}
        envio={envioParaEnviar}
        onConfirm={handleConfirmarEnvio}
        enviando={enviando}
        progreso={progresoEnvio}
      />
    </div>
  );
}
