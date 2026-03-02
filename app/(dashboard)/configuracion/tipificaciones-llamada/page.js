'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { Phone, Plus, Pencil, Trash2, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const COLORES_PREDEFINIDOS = [
  { nombre: 'Rojo', valor: '#EF4444' },
  { nombre: 'Naranja', valor: '#F97316' },
  { nombre: 'Amarillo', valor: '#EAB308' },
  { nombre: 'Verde', valor: '#22C55E' },
  { nombre: 'Azul', valor: '#3B82F6' },
  { nombre: 'Indigo', valor: '#6366F1' },
  { nombre: 'Purpura', valor: '#A855F7' },
  { nombre: 'Rosa', valor: '#EC4899' },
  { nombre: 'Gris', valor: '#6B7280' },
];

export default function TipificacionesLlamadaPage() {
  const [tipificaciones, setTipificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTipificacion, setEditingTipificacion] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    orden: 0,
    color: '#3B82F6',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/crm/tipificacion-llamada');
      setTipificaciones(response.data || []);
    } catch (error) {
      console.error('Error al cargar tipificaciones de llamada:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    try {
      setSaving(true);
      if (editingTipificacion) {
        await apiClient.put(`/crm/tipificacion-llamada/${editingTipificacion.id}`, formData);
      } else {
        const maxOrden = tipificaciones.length > 0
          ? Math.max(...tipificaciones.map(t => t.orden || 0))
          : -1;
        await apiClient.post('/crm/tipificacion-llamada', { ...formData, orden: maxOrden + 1 });
      }
      setShowModal(false);
      setEditingTipificacion(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error al guardar tipificacion:', error);
      alert(error.msg || 'Error al guardar tipificacion');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (tipificacion) => {
    setEditingTipificacion(tipificacion);
    setFormData({
      nombre: tipificacion.nombre || '',
      descripcion: tipificacion.descripcion || '',
      orden: tipificacion.orden || 0,
      color: tipificacion.color || '#3B82F6',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Esta seguro de eliminar esta tipificacion?')) {
      try {
        await apiClient.delete(`/crm/tipificacion-llamada/${id}`);
        loadData();
      } catch (error) {
        console.error('Error al eliminar tipificacion:', error);
        alert('No se puede eliminar la tipificacion porque esta en uso');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      orden: 0,
      color: '#3B82F6',
    });
  };

  const openNewModal = () => {
    setEditingTipificacion(null);
    resetForm();
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div>
          <div className="flex items-center space-x-1 text-sm text-muted-foreground mb-2">
            <Link href="/configuracion" className="hover:text-foreground transition-colors">Configuracion</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Tipificaciones de Llamada</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Tipificaciones de Llamada</h1>
              <p className="text-muted-foreground">Gestiona las tipificaciones para clasificar las llamadas</p>
            </div>
            <Button onClick={openNewModal}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Tipificacion
            </Button>
          </div>
        </div>

        <Separator />

        <Badge variant="secondary" className="text-sm px-3 py-1">
          {tipificaciones.length} {tipificaciones.length === 1 ? 'tipificacion' : 'tipificaciones'}
        </Badge>

        {/* Table */}
        {tipificaciones.length > 0 ? (
          <Card>
            <div className="px-4 py-3 border-b bg-muted/40 rounded-t-lg">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-3">Nombre</div>
                <div className="col-span-4">Descripcion</div>
                <div className="col-span-1 text-center">Color</div>
                <div className="col-span-1 text-center">Orden</div>
                <div className="col-span-2 text-center">Acciones</div>
              </div>
            </div>

            <div className="divide-y">
              {tipificaciones.map((tipificacion, index) => (
                <div
                  key={tipificacion.id}
                  className="grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-muted/30 transition-colors"
                >
                  <div className="col-span-1">
                    <p className="text-sm font-mono text-muted-foreground text-center">{index + 1}</p>
                  </div>

                  <div className="col-span-3 flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: tipificacion.color || '#3B82F6' }}
                    >
                      <Phone className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium truncate">{tipificacion.nombre}</span>
                  </div>

                  <div className="col-span-4">
                    <p className="text-sm text-muted-foreground truncate">
                      {tipificacion.descripcion || <span className="italic text-muted-foreground/50">Sin descripcion</span>}
                    </p>
                  </div>

                  <div className="col-span-1 flex items-center justify-center">
                    <div
                      className="w-6 h-6 rounded-full border"
                      style={{ backgroundColor: tipificacion.color || '#3B82F6' }}
                    />
                  </div>

                  <div className="col-span-1">
                    <p className="text-sm text-muted-foreground text-center">{tipificacion.orden ?? '-'}</p>
                  </div>

                  <div className="col-span-2 flex items-center justify-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(tipificacion)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Editar</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(tipificacion.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Eliminar</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Phone className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">No hay tipificaciones de llamada registradas</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Crea una nueva tipificacion para comenzar</p>
              <Button onClick={openNewModal} variant="outline" className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Tipificacion
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingTipificacion ? 'Editar Tipificacion' : 'Nueva Tipificacion'}</DialogTitle>
              <DialogDescription>
                {editingTipificacion
                  ? 'Modifica los datos de la tipificacion de llamada'
                  : 'Completa los datos para crear una nueva tipificacion de llamada'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre *</label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre de la tipificacion"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descripcion</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  rows={3}
                  placeholder="Descripcion de la tipificacion..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-9 w-12 rounded border cursor-pointer"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {COLORES_PREDEFINIDOS.map((color) => (
                    <button
                      key={color.valor}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.valor })}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${formData.color === color.valor ? 'border-foreground scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: color.valor }}
                      title={color.nombre}
                    />
                  ))}
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Guardando...' : (editingTipificacion ? 'Actualizar' : 'Crear')}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
