'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { Tags, Plus, Pencil, Trash2, ChevronRight, Check, X, TreePine } from 'lucide-react';
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

export default function TipificacionesPage() {
  const [tipificaciones, setTipificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTipificacion, setEditingTipificacion] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [isAsesor, setIsAsesor] = useState(false);
  const [isBot, setIsBot] = useState(false);
  const [nivelesSeleccionados, setNivelesSeleccionados] = useState([]);
  const [formData, setFormData] = useState({
    nombre: '',
    definicion: '',
    orden: 0,
    color: '#3B82F6',
    flag_asesor: false,
    flag_bot: false,
    id_padre: null
  });

  const tipificacionesPadre = tipificaciones.filter(t => !t.id_padre);

  const getHijosDePadre = (idPadre) => {
    return tipificaciones.filter(t => t.id_padre === idPadre);
  };

  const construirNiveles = () => {
    const niveles = [{ opciones: tipificacionesPadre, seleccionado: nivelesSeleccionados[0] || null }];
    for (let i = 0; i < nivelesSeleccionados.length; i++) {
      const hijos = getHijosDePadre(nivelesSeleccionados[i]);
      if (hijos.length > 0) {
        niveles.push({ opciones: hijos, seleccionado: nivelesSeleccionados[i + 1] || null });
      } else {
        break;
      }
    }
    return niveles;
  };

  const nivelesDropdown = construirNiveles();

  const handleNivelChange = (nivelIndex, value) => {
    const nuevoValor = value ? parseInt(value) : null;
    const nuevosNiveles = nivelesSeleccionados.slice(0, nivelIndex);
    if (nuevoValor) {
      nuevosNiveles.push(nuevoValor);
    }
    setNivelesSeleccionados(nuevosNiveles);
    const ultimoNivel = nuevosNiveles.length > 0 ? nuevosNiveles[nuevosNiveles.length - 1] : null;
    setFormData(prev => ({ ...prev, id_padre: ultimoNivel }));
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/crm/tipificaciones');
      setTipificaciones(response.data || []);
    } catch (error) {
      console.error('Error al cargar tipificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTipificacion) {
        await apiClient.put(`/crm/tipificaciones/${editingTipificacion.id}`, { ...formData, flag_asesor: isAsesor, flag_bot: isBot });
      } else {
        const maxOrden = tipificaciones.length > 0
          ? Math.max(...tipificaciones.map(t => t.orden || 0))
          : -1;
        await apiClient.post('/crm/tipificaciones', { ...formData, orden: maxOrden + 1, flag_asesor: isAsesor, flag_bot: isBot });
      }
      setIsAsesor(false);
      setIsBot(false);
      setShowModal(false);
      setEditingTipificacion(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error al guardar tipificacion:', error);
      alert(error.msg || 'Error al guardar tipificacion');
    }
  };

  const handleEdit = (tipificacion) => {
    setEditingTipificacion(tipificacion);
    setIsAsesor(tipificacion.flag_asesor || false);
    setIsBot(tipificacion.flag_bot || false);

    const niveles = [];
    if (tipificacion.id_padre) {
      let currentId = tipificacion.id_padre;
      while (currentId) {
        niveles.unshift(currentId);
        const current = tipificaciones.find(t => t.id === currentId);
        currentId = current?.id_padre || null;
      }
    }
    setNivelesSeleccionados(niveles);

    setFormData({
      nombre: tipificacion.nombre || '',
      definicion: tipificacion.definicion || '',
      orden: tipificacion.orden || 0,
      color: tipificacion.color || '#3B82F6',
      flag_asesor: tipificacion.flag_asesor || false,
      flag_bot: tipificacion.flag_bot || false,
      id_padre: tipificacion.id_padre || null
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Está seguro de eliminar esta tipificación?')) {
      try {
        await apiClient.delete(`/crm/tipificaciones/${id}`);
        loadData();
      } catch (error) {
        console.error('Error al eliminar tipificacion:', error);
        alert('No se puede eliminar la tipificación porque está en uso');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      definicion: '',
      orden: 0,
      color: '#3B82F6',
      id_padre: null
    });
    setNivelesSeleccionados([]);
  };

  const openNewModal = () => {
    setEditingTipificacion(null);
    setIsAsesor(false);
    setIsBot(false);
    resetForm();
    setShowModal(true);
  };

  // Drag and Drop
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItem === null) return;
    if (index !== dragOverItem) {
      setDragOverItem(index);
    }
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === dropIndex) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    const newTipificaciones = [...tipificaciones];
    const draggedItemData = newTipificaciones[draggedItem];
    newTipificaciones.splice(draggedItem, 1);
    newTipificaciones.splice(dropIndex, 0, draggedItemData);

    const updatedTipificaciones = newTipificaciones.map((item, index) => ({
      ...item,
      orden: index
    }));

    setTipificaciones(updatedTipificaciones);
    setDraggedItem(null);
    setDragOverItem(null);

    await saveNewOrder(updatedTipificaciones);
  };

  const saveNewOrder = async (items) => {
    setSavingOrder(true);
    try {
      const promises = items.map((item, index) =>
        apiClient.put(`/crm/tipificaciones/${item.id}`, {
          nombre: item.nombre,
          definicion: item.definicion,
          orden: index,
          color: item.color,
          flag_asesor: item.flag_asesor,
          flag_bot: item.flag_bot,
          id_padre: item.id_padre
        })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('Error al guardar orden:', error);
      loadData();
    } finally {
      setSavingOrder(false);
    }
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
            <Link href="/configuracion" className="hover:text-foreground transition-colors">Configuración</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">Tipificaciones</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Tipificaciones</h1>
              <p className="text-muted-foreground">Arrastra para cambiar el orden de las tipificaciones</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/configuracion/tipificaciones/arbol">
                  <TreePine className="h-4 w-4 mr-2" />
                  Vista Árbol
                </Link>
              </Button>
              <Button onClick={openNewModal}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Tipificación
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {tipificaciones.length} {tipificaciones.length === 1 ? 'tipificación' : 'tipificaciones'}
          </Badge>
          {savingOrder && (
            <Badge variant="outline" className="gap-1 animate-pulse">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
              Guardando orden...
            </Badge>
          )}
        </div>

        {/* Table */}
        {tipificaciones.length > 0 ? (
          <Card>
            <div className="px-4 py-3 border-b bg-muted/40 rounded-t-lg">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div className="col-span-1 text-center">#</div>
                <div className="col-span-2">Nombre</div>
                <div className="col-span-2">Padre</div>
                <div className="col-span-2">Definición</div>
                <div className="col-span-1 text-center">Color</div>
                <div className="col-span-1 text-center">Asesor</div>
                <div className="col-span-1 text-center">Bot</div>
                <div className="col-span-2 text-center">Acciones</div>
              </div>
            </div>

            <div className="divide-y">
              {tipificaciones.map((tipificacion, index) => (
                <div
                  key={tipificacion.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`grid grid-cols-12 gap-4 px-4 py-4 items-center transition-all cursor-move hover:bg-muted/30 ${
                    dragOverItem === index ? 'bg-primary/5 border-t-2 border-primary' : ''
                  } ${draggedItem === index ? 'opacity-50' : ''}`}
                >
                  <div className="col-span-1">
                    <p className="text-sm font-mono text-muted-foreground text-center">{index + 1}</p>
                  </div>

                  <div className="col-span-2 flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: tipificacion.color || '#3B82F6' }}
                    >
                      <Tags className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium truncate">{tipificacion.nombre}</span>
                  </div>

                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground truncate">
                      {tipificacion.id_padre
                        ? tipificaciones.find(t => t.id === tipificacion.id_padre)?.nombre || '-'
                        : <span className="italic text-muted-foreground/50">Principal</span>
                      }
                    </p>
                  </div>

                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground truncate">
                      {tipificacion.definicion || <span className="italic text-muted-foreground/50">Sin definición</span>}
                    </p>
                  </div>

                  <div className="col-span-1 flex items-center justify-center">
                    <div
                      className="w-6 h-6 rounded-full border"
                      style={{ backgroundColor: tipificacion.color || '#3B82F6' }}
                    />
                  </div>

                  <div className="col-span-1 flex items-center justify-center">
                    {tipificacion.flag_asesor ? (
                      <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      </span>
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      </span>
                    )}
                  </div>

                  <div className="col-span-1 flex items-center justify-center">
                    {tipificacion.flag_bot ? (
                      <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                        <Check className="h-3.5 w-3.5 text-green-600" />
                      </span>
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      </span>
                    )}
                  </div>

                  <div className="col-span-2 flex items-center justify-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleEdit(tipificacion); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Editar</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(tipificacion.id); }}>
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
                <Tags className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">No hay tipificaciones registradas</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Crea una nueva tipificación para comenzar</p>
              <Button onClick={openNewModal} variant="outline" className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Tipificación
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTipificacion ? 'Editar Tipificación' : 'Nueva Tipificación'}</DialogTitle>
              <DialogDescription>
                {editingTipificacion
                  ? 'Modifica los datos de la tipificación'
                  : 'Completa los datos para crear una nueva tipificación'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre *</label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre de la tipificación"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Definición</label>
                <textarea
                  value={formData.definicion}
                  onChange={(e) => setFormData({ ...formData, definicion: e.target.value })}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  rows={3}
                  placeholder="Descripción o definición del motivo..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Jerarquía de Padre</label>
                <div className="flex flex-wrap gap-2 items-center">
                  {nivelesDropdown.map((nivel, index) => (
                    <div key={index} className="flex items-center gap-1">
                      {index > 0 && <span className="text-muted-foreground text-lg">/</span>}
                      <select
                        value={nivel.seleccionado || ''}
                        onChange={(e) => handleNivelChange(index, e.target.value)}
                        className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-w-[120px]"
                      >
                        <option value="">{index === 0 ? 'Sin padre' : 'Seleccionar...'}</option>
                        {nivel.opciones
                          .filter(t => !editingTipificacion || t.id !== editingTipificacion.id)
                          .map((t) => (
                            <option key={t.id} value={t.id}>{t.nombre}</option>
                          ))
                        }
                      </select>
                    </div>
                  ))}
                </div>
                {formData.id_padre && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Padre seleccionado: {tipificaciones.find(t => t.id === formData.id_padre)?.nombre}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Habilitar para:</label>
                <div className="flex flex-col gap-3 py-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isAsesor}
                      onChange={(e) => setIsAsesor(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                      id="asesor"
                    />
                    <label htmlFor="asesor" className="text-sm cursor-pointer">Asesor</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isBot}
                      onChange={(e) => setIsBot(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                      id="bot"
                    />
                    <label htmlFor="bot" className="text-sm cursor-pointer">Bot</label>
                  </div>
                </div>
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
                <Button type="submit">
                  {editingTipificacion ? 'Actualizar' : 'Crear'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
