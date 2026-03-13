'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { Phone, Plus, Pencil, Trash2, ChevronRight, ChevronDown, FolderTree } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const MAX_NIVELES = 5;

// Componente recursivo para renderizar nodos del arbol
function TreeNode({ node, level, onEdit, onDelete, onAddChild, expandedNodes, toggleExpand, allTipificaciones }) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);
  const canAddChild = level < MAX_NIVELES;
  const paddingLeft = level * 24;

  return (
    <>
      <div
        className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-muted/30 transition-colors border-b"
        style={{ paddingLeft: `${paddingLeft + 16}px` }}
      >
        <div className="col-span-4 flex items-center gap-2">
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(node.id)}
              className="p-0.5 hover:bg-muted rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          ) : (
            <span className="w-5" />
          )}
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: node.color || '#3B82F6' }}
          >
            <Phone className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-medium truncate">{node.nombre}</span>
          <Badge variant="outline" className="text-xs ml-1">
            Nv {node.nivel || level}
          </Badge>
        </div>

        <div className="col-span-4">
          <p className="text-sm text-muted-foreground truncate">
            {node.descripcion || <span className="italic text-muted-foreground/50">Sin descripcion</span>}
          </p>
        </div>

        <div className="col-span-1 flex items-center justify-center">
          <div
            className="w-5 h-5 rounded-full border"
            style={{ backgroundColor: node.color || '#3B82F6' }}
          />
        </div>

        <div className="col-span-1">
          <p className="text-sm text-muted-foreground text-center">{node.orden ?? '-'}</p>
        </div>

        <div className="col-span-2 flex items-center justify-center gap-1">
          {canAddChild && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddChild(node)}>
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Agregar sub-tipificacion</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(node)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Editar</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(node)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Eliminar</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              expandedNodes={expandedNodes}
              toggleExpand={toggleExpand}
              allTipificaciones={allTipificaciones}
            />
          ))}
        </>
      )}
    </>
  );
}

// Funcion para aplanar el arbol y obtener opciones para select de padre
function flattenTree(nodes, result = [], level = 1) {
  for (const node of nodes) {
    result.push({ ...node, displayLevel: level });
    if (node.children && node.children.length > 0) {
      flattenTree(node.children, result, level + 1);
    }
  }
  return result;
}

// Funcion para contar total de nodos
function countNodes(nodes) {
  let count = 0;
  for (const node of nodes) {
    count++;
    if (node.children && node.children.length > 0) {
      count += countNodes(node.children);
    }
  }
  return count;
}

export default function TipificacionesLlamadaPage() {
  const [tipificaciones, setTipificaciones] = useState([]);
  const [flatList, setFlatList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTipificacion, setEditingTipificacion] = useState(null);
  const [parentTipificacion, setParentTipificacion] = useState(null);
  const [saving, setSaving] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    orden: 0,
    color: '#3B82F6',
    id_padre: null,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/crm/tipificacion-llamada/tree');
      const tree = response.data || [];
      setTipificaciones(tree);
      setFlatList(flattenTree(tree));
      // Expandir todos los nodos por defecto
      const allIds = new Set();
      const collectIds = (nodes) => {
        for (const node of nodes) {
          allIds.add(node.id);
          if (node.children) collectIds(node.children);
        }
      };
      collectIds(tree);
      setExpandedNodes(allIds);
    } catch (error) {
      console.error('Error al cargar tipificaciones de llamada:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    try {
      setSaving(true);
      const dataToSend = {
        ...formData,
        id_padre: formData.id_padre || null
      };

      if (editingTipificacion) {
        await apiClient.put(`/crm/tipificacion-llamada/${editingTipificacion.id}`, dataToSend);
      } else {
        await apiClient.post('/crm/tipificacion-llamada', dataToSend);
      }
      setShowModal(false);
      setEditingTipificacion(null);
      setParentTipificacion(null);
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
    setParentTipificacion(null);
    setFormData({
      nombre: tipificacion.nombre || '',
      descripcion: tipificacion.descripcion || '',
      orden: tipificacion.orden || 0,
      color: tipificacion.color || '#3B82F6',
      id_padre: tipificacion.id_padre || null,
    });
    setShowModal(true);
  };

  const handleAddChild = (parentNode) => {
    setEditingTipificacion(null);
    setParentTipificacion(parentNode);
    setFormData({
      nombre: '',
      descripcion: '',
      orden: 0,
      color: parentNode.color || '#3B82F6',
      id_padre: parentNode.id,
    });
    setShowModal(true);
  };

  const handleDelete = async (tipificacion) => {
    const hasChildren = tipificacion.children && tipificacion.children.length > 0;
    const message = hasChildren
      ? `¿Esta seguro de eliminar "${tipificacion.nombre}" y todas sus sub-tipificaciones?`
      : `¿Esta seguro de eliminar "${tipificacion.nombre}"?`;

    if (confirm(message)) {
      try {
        await apiClient.delete(`/crm/tipificacion-llamada/${tipificacion.id}`);
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
      id_padre: null,
    });
  };

  const openNewModal = () => {
    setEditingTipificacion(null);
    setParentTipificacion(null);
    resetForm();
    setShowModal(true);
  };

  // Obtener opciones validas para el select de padre (excluir el nodo actual y sus descendientes)
  const getValidParentOptions = () => {
    if (!editingTipificacion) {
      // Si es nuevo, filtrar solo por nivel < 5
      return flatList.filter(t => (t.nivel || t.displayLevel) < MAX_NIVELES);
    }

    // Si estamos editando, excluir el nodo actual y sus descendientes
    const excludeIds = new Set([editingTipificacion.id]);
    const collectDescendantIds = (nodes) => {
      for (const node of nodes) {
        if (excludeIds.has(node.id_padre)) {
          excludeIds.add(node.id);
        }
        if (node.children) collectDescendantIds(node.children);
      }
    };
    collectDescendantIds(tipificaciones);

    return flatList.filter(t => !excludeIds.has(t.id) && (t.nivel || t.displayLevel) < MAX_NIVELES);
  };

  const totalCount = countNodes(tipificaciones);

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
              <p className="text-muted-foreground">Gestiona las tipificaciones en estructura de arbol (max {MAX_NIVELES} niveles)</p>
            </div>
            <Button onClick={openNewModal}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Tipificacion
            </Button>
          </div>
        </div>

        <Separator />

        <Badge variant="secondary" className="text-sm px-3 py-1">
          {totalCount} {totalCount === 1 ? 'tipificacion' : 'tipificaciones'}
        </Badge>

        {/* Tree Table */}
        {tipificaciones.length > 0 ? (
          <Card>
            <div className="px-4 py-3 border-b bg-muted/40 rounded-t-lg">
              <div className="grid grid-cols-12 gap-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <div className="col-span-4 pl-6">Nombre</div>
                <div className="col-span-4">Descripcion</div>
                <div className="col-span-1 text-center">Color</div>
                <div className="col-span-1 text-center">Orden</div>
                <div className="col-span-2 text-center">Acciones</div>
              </div>
            </div>

            <div>
              {tipificaciones.map((tipificacion) => (
                <TreeNode
                  key={tipificacion.id}
                  node={tipificacion}
                  level={1}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onAddChild={handleAddChild}
                  expandedNodes={expandedNodes}
                  toggleExpand={toggleExpand}
                  allTipificaciones={flatList}
                />
              ))}
            </div>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <FolderTree className="h-6 w-6 text-muted-foreground" />
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
              <DialogTitle>
                {editingTipificacion
                  ? 'Editar Tipificacion'
                  : parentTipificacion
                    ? `Nueva Sub-tipificacion de "${parentTipificacion.nombre}"`
                    : 'Nueva Tipificacion'}
              </DialogTitle>
              <DialogDescription>
                {editingTipificacion
                  ? 'Modifica los datos de la tipificacion de llamada'
                  : parentTipificacion
                    ? `Esta tipificacion sera nivel ${(parentTipificacion.nivel || 1) + 1}`
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

              {!parentTipificacion && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipificacion Padre</label>
                  <Select
                    value={formData.id_padre?.toString() || 'none'}
                    onValueChange={(value) => setFormData({ ...formData, id_padre: value === 'none' ? null : parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin padre (raiz)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin padre (raiz)</SelectItem>
                      {getValidParentOptions().map((t) => (
                        <SelectItem key={t.id} value={t.id.toString()}>
                          {'—'.repeat(t.displayLevel - 1)} {t.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Solo se muestran tipificaciones hasta nivel {MAX_NIVELES - 1}</p>
                </div>
              )}

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
                <label className="text-sm font-medium">Orden</label>
                <Input
                  type="number"
                  value={formData.orden}
                  onChange={(e) => setFormData({ ...formData, orden: parseInt(e.target.value) || 0 })}
                  placeholder="0"
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
