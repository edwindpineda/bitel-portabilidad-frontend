'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Send, Loader2, FileText, Check, ChevronLeft, ChevronRight, Database, Search, Zap, Calendar, Eye, X, Users } from 'lucide-react';
import PlantillaPreview from './PlantillaPreview';
import api from '@/lib/api';

const PASOS = [
  { num: 1, titulo: 'Plantilla', icon: FileText },
  { num: 2, titulo: 'Bases', icon: Database },
  { num: 3, titulo: 'Confirmar', icon: Send },
];

export default function CreateEditEnvioModal({
  open,
  onOpenChange,
  editingEnvio,
  formData,
  setFormData,
  plantillas,
  bases,
  selectedBases,
  onToggleBase,
  onSelectAllBases,
  onSave,
  saving,
}) {
  const isEditing = !!editingEnvio;
  const [pasoActual, setPasoActual] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [envioInstantaneo, setEnvioInstantaneo] = useState(true);
  const [fechaEnvio, setFechaEnvio] = useState('');

  // Estado para detalle de base
  const [detalleBase, setDetalleBase] = useState(null);
  const [detalleData, setDetalleData] = useState([]);
  const [detallePage, setDetallePage] = useState(1);
  const [detalleTotalPages, setDetalleTotalPages] = useState(1);
  const [detalleTotal, setDetalleTotal] = useState(0);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  useEffect(() => {
    if (open) {
      setPasoActual(1);
      setSearchTerm('');
      setDetalleBase(null);
      if (editingEnvio && formData.fecha_envio) {
        setEnvioInstantaneo(false);
        setFechaEnvio(formData.fecha_envio);
      } else {
        setEnvioInstantaneo(true);
        setFechaEnvio('');
      }
    }
  }, [open, editingEnvio, formData.fecha_envio]);

  const fetchDetalleBase = async (base, page = 1) => {
    setDetalleBase(base);
    setDetallePage(page);
    setLoadingDetalle(true);
    try {
      const res = await api.get(`/crm/bases-numeros/${base.id}/detalles?page=${page}&limit=20`);
      setDetalleData(res.data || []);
      setDetalleTotal(res.total || 0);
      setDetalleTotalPages(res.totalPages || 1);
    } catch (error) {
      console.error('Error al obtener detalle de base:', error);
      setDetalleData([]);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const cerrarDetalle = () => {
    setDetalleBase(null);
    setDetalleData([]);
    setDetallePage(1);
  };

  const filteredBases = bases.filter(b =>
    b.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.formato_nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const puedeAvanzar = () => {
    switch (pasoActual) {
      case 1: return formData.titulo && formData.id_plantilla;
      case 2: return isEditing || selectedBases.length > 0;
      case 3: return true;
      default: return false;
    }
  };

  const getPlantillaSeleccionada = () => {
    if (!formData.id_plantilla) return null;
    return plantillas.find(p => (p.id_local || p.id) == formData.id_plantilla);
  };

  const handleSelectAll = () => {
    if (selectedBases.length === filteredBases.length) {
      onSelectAllBases([]);
    } else {
      onSelectAllBases(filteredBases.map(b => b.id));
    }
  };

  const handleSave = () => {
    const datosEnvio = {
      envioInstantaneo,
      fechaEnvio: envioInstantaneo
        ? new Date().toISOString().slice(0, 19).replace('T', ' ')
        : fechaEnvio ? fechaEnvio.replace('T', ' ') + ':00' : null,
    };
    onSave(datosEnvio);
  };

  const renderIndicadorPasos = () => (
    <div className="flex justify-center gap-4 mb-6">
      {PASOS.map((paso, index) => {
        const Icon = paso.icon;
        const isCompleted = pasoActual > paso.num;
        const isCurrent = pasoActual === paso.num;
        return (
          <div key={paso.num} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={`
                w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm transition-all
                ${isCompleted ? 'bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white' : ''}
                ${isCurrent ? 'bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white ring-4 ring-[#25D366]/20' : ''}
                ${!isCompleted && !isCurrent ? 'bg-muted text-muted-foreground' : ''}
              `}>
                {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={`text-sm font-medium ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                {paso.titulo}
              </span>
            </div>
            {index < PASOS.length - 1 && (
              <div className={`w-12 h-0.5 mx-3 transition-all ${isCompleted ? 'bg-[#25D366]' : 'bg-muted'}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  const renderPaso1 = () => {
    const plantillaSeleccionada = getPlantillaSeleccionada();
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Titulo del envio *</label>
            <Input
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Ej: Promocion Febrero 2024"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Descripcion</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm resize-none focus:ring-2 focus:ring-ring"
              placeholder="Descripcion opcional del envio..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Plantilla WhatsApp *</label>
            <select
              value={formData.id_plantilla}
              onChange={(e) => setFormData({ ...formData, id_plantilla: e.target.value })}
              className="w-full h-10 px-3 border border-input rounded-md bg-background text-sm focus:ring-2 focus:ring-ring"
            >
              <option value="">Seleccionar plantilla...</option>
              {plantillas.map((p) => (
                <option key={p.id || p.id_local} value={p.id_local || p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">Solo plantillas aprobadas por Meta</p>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Vista previa</label>
          <PlantillaPreview plantilla={plantillaSeleccionada} />
        </div>
      </div>
    );
  };

  const renderPaso2 = () => (
    <div className="space-y-4">
      {detalleBase ? (
        // Vista de detalle de una base
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={cerrarDetalle} className="gap-1 px-2">
                <ChevronLeft className="w-4 h-4" />
                Volver
              </Button>
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#25D366]" />
                  {detalleBase.nombre}
                </h3>
                <p className="text-xs text-muted-foreground">{detalleTotal} registro{detalleTotal !== 1 ? 's' : ''} en esta base</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={cerrarDetalle} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="border rounded-lg max-h-[320px] overflow-y-auto">
            {loadingDetalle ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[#25D366]" />
                <span className="ml-2 text-sm text-muted-foreground">Cargando registros...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs">Telefono</TableHead>
                    <TableHead className="text-xs">Nombre</TableHead>
                    <TableHead className="text-xs">Correo</TableHead>
                    <TableHead className="text-xs">Documento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detalleData.map((detalle) => (
                    <TableRow key={detalle.id} className="hover:bg-muted/50">
                      <TableCell className="text-sm font-mono">{detalle.telefono || '-'}</TableCell>
                      <TableCell className="text-sm">{detalle.nombre || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{detalle.correo || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {detalle.numero_documento ? `${detalle.tipo_documento || ''} ${detalle.numero_documento}` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {detalleData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-sm text-muted-foreground">
                        No hay registros en esta base
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>

          {detalleTotalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Pagina {detallePage} de {detalleTotalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={detallePage <= 1}
                  onClick={() => fetchDetalleBase(detalleBase, detallePage - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={detallePage >= detalleTotalPages}
                  onClick={() => fetchDetalleBase(detalleBase, detallePage + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Vista de seleccion de bases
        <>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Seleccionar Bases de Numeros *</label>
            <Badge variant="secondary" className="bg-[#25D366]/10 text-[#25D366]">
              {selectedBases.length} seleccionada{selectedBases.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, descripcion o formato..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedBases.length === filteredBases.length && filteredBases.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm font-medium">Seleccionar todos</span>
            </label>
            <span className="text-xs text-muted-foreground">{filteredBases.length} bases encontradas</span>
          </div>
          <div className="border rounded-lg max-h-[300px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-10" />
                  <TableHead className="text-xs">Nombre</TableHead>
                  <TableHead className="text-xs">Formato</TableHead>
                  <TableHead className="text-xs text-center">Registros</TableHead>
                  <TableHead className="text-xs">Fecha</TableHead>
                  <TableHead className="text-xs w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBases.map((base) => (
                  <TableRow
                    key={base.id}
                    className={`cursor-pointer hover:bg-muted/50 ${selectedBases.includes(base.id) ? 'bg-[#25D366]/5' : ''}`}
                    onClick={() => onToggleBase(base.id)}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedBases.includes(base.id)}
                        onCheckedChange={() => onToggleBase(base.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="text-sm font-medium">{base.nombre}</span>
                        {base.descripcion && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{base.descripcion}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border border-blue-200/50">
                        {base.formato_nombre || 'Sin formato'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-medium">{base.total_registros || 0}</span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {base.fecha_registro ? new Date(base.fecha_registro).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-[#25D366]"
                        title="Ver personas de esta base"
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchDetalleBase(base);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredBases.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8">
                <Database className="h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No hay bases de numeros</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  const renderPaso3 = () => {
    const plantilla = getPlantillaSeleccionada();
    return (
      <div className="space-y-6">
        <div
          className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${envioInstantaneo ? 'bg-[#25D366]/5 border-[#25D366]' : 'bg-muted/30 border-muted hover:border-muted-foreground/30'}`}
          onClick={() => setEnvioInstantaneo(!envioInstantaneo)}
        >
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox checked={envioInstantaneo} onCheckedChange={setEnvioInstantaneo} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Zap className={`w-4 h-4 ${envioInstantaneo ? 'text-[#25D366]' : 'text-muted-foreground'}`} />
                <span className="font-semibold text-sm">Envio instantaneo</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Los mensajes se enviaran inmediatamente al guardar</p>
            </div>
          </label>
        </div>
        {!envioInstantaneo && (
          <div className="p-4 bg-muted/30 rounded-xl">
            <label className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Fecha y hora de envio programado</span>
            </label>
            <Input
              type="datetime-local"
              value={fechaEnvio}
              onChange={(e) => setFechaEnvio(e.target.value)}
              className="max-w-xs"
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>
        )}
        <Card className="bg-muted/30">
          <CardContent className="p-5">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Resumen del envio
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Titulo:</span>
                <span className="text-sm font-medium">{formData.titulo || 'Sin titulo'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Plantilla:</span>
                <Badge variant="secondary" className="bg-green-50 text-green-700 border border-green-200/50">
                  {plantilla?.name || 'No seleccionada'}
                </Badge>
              </div>
              {formData.descripcion && (
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Descripcion:</span>
                  <span className="text-sm font-medium truncate max-w-[200px]">{formData.descripcion}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Bases seleccionadas:</span>
                <Badge className="bg-[#25D366] text-white">
                  {isEditing ? (editingEnvio?.cantidad || 0) : selectedBases.length} base{(isEditing ? (editingEnvio?.cantidad || 0) : selectedBases.length) !== 1 ? 's' : ''}
                </Badge>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Tipo de envio:</span>
                <span className={`text-sm font-medium ${envioInstantaneo ? 'text-[#25D366]' : 'text-muted-foreground'}`}>
                  {envioInstantaneo ? 'Instantaneo' : 'Programado'}
                </span>
              </div>
              {!envioInstantaneo && fechaEnvio && (
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">Fecha y hora:</span>
                  <span className="text-sm font-medium">
                    {new Date(fechaEnvio).toLocaleString('es-PE', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderPasoActual = () => {
    switch (pasoActual) {
      case 1: return renderPaso1();
      case 2: return renderPaso2();
      case 3: return renderPaso3();
      default: return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <div className="bg-gradient-to-r from-[#25D366] to-[#128C7E] px-6 py-4">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center space-x-2">
              <Send className="w-5 h-5" />
              <span>{isEditing ? 'Editar Envio Masivo' : 'Nuevo Envio Masivo'}</span>
            </DialogTitle>
            <DialogDescription className="text-white/80">
              {isEditing ? 'Modifica los datos del envio' : 'Configura tu envio masivo de WhatsApp'}
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {renderIndicadorPasos()}
          {renderPasoActual()}
        </div>
        <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between">
          <div>
            {pasoActual > 1 && (
              <Button variant="ghost" onClick={() => setPasoActual(p => p - 1)} className="gap-2">
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
            {pasoActual < 3 ? (
              <Button
                onClick={() => setPasoActual(p => p + 1)}
                disabled={!puedeAvanzar()}
                className="bg-[#25D366] hover:bg-[#128C7E] text-white gap-2"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={saving || !puedeAvanzar()}
                className="bg-[#25D366] hover:bg-[#128C7E] text-white"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" />{isEditing ? 'Actualizar' : 'Crear Envio'}</>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
