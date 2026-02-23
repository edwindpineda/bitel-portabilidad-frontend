'use client';

import { useState, useEffect } from 'react';
import { apiClient, API_BASE_URL } from '@/lib/api';
import Link from 'next/link';
import { Package, Plus, Pencil, Trash2, Search, ChevronRight, ImageIcon, X, ZoomIn, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_BASE_URL}${url}`;
};

export default function CatalogoPage() {
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    precio_regular: '',
    precio_promocional: '',
    descripcion: '',
    principal: 1,
    imagen_url: '',
    estado_registro: 1
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/crm/catalogo');
      const planesValidos = response?.data.filter((plan) => plan.estado_registro == 1);
      setPlanes(planesValidos || []);
    } catch (error) {
      console.error('Error al cargar planes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = new FormData();
      submitData.append('nombre', formData.nombre);
      submitData.append('precio_regular', parseFloat(formData.precio_regular));
      if (formData.precio_promocional) {
        submitData.append('precio_promocional', parseFloat(formData.precio_promocional));
      }
      if (formData.descripcion) {
        submitData.append('descripcion', formData.descripcion);
      }
      submitData.append('principal', formData.principal ? 1 : 0);

      if (selectedFile) {
        submitData.append('imagen', selectedFile);
      } else if (formData.imagen_url) {
        submitData.append('imagen_url', formData.imagen_url);
      }

      if (editingPlan) {
        await apiClient.put(`/crm/catalogo/${editingPlan.id}`, submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await apiClient.post('/crm/catalogo', submitData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setShowModal(false);
      setEditingPlan(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error al guardar plan:', error);
      alert(error.msg || 'Error al guardar plan');
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      nombre: plan.nombre || '',
      precio_regular: plan.precio_regular || '',
      precio_promocional: plan.precio_promocional || '',
      descripcion: plan.descripcion || '',
      principal: plan.principal ? 1 : 0,
      imagen_url: plan.imagen_url || ''
    });
    setSelectedFile(null);
    setFilePreview(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Está seguro de eliminar este item del catálogo?')) {
      try {
        await apiClient.delete(`/crm/catalogo/${id}`);
        loadData();
      } catch (error) {
        console.error('Error al eliminar plan:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      precio_regular: '',
      precio_promocional: '',
      descripcion: '',
      principal: 1,
      imagen_url: ''
    });
    setSelectedFile(null);
    setFilePreview(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const openNewModal = () => {
    setEditingPlan(null);
    resetForm();
    setShowModal(true);
  };

  const filteredPlanes = planes.filter((p) =>
    p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <span className="text-foreground font-medium">Catálogo</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Catálogo</h1>
              <p className="text-muted-foreground">Gestiona el catálogo de planes y precios disponibles</p>
            </div>
            <Button onClick={openNewModal}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Item
            </Button>
          </div>
        </div>

        <Separator />

        {/* Stats + Search */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {planes.length} {planes.length === 1 ? 'item' : 'items'}
            </Badge>
          </div>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar en catálogo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Cards grid */}
        {filteredPlanes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlanes.map((plan) => (
              <Card key={plan.id} className="overflow-hidden group">
                {/* Image */}
                {plan.imagen_url ? (
                  <div
                    className="w-full h-40 bg-muted cursor-pointer relative"
                    onClick={() => setImagePreview({ url: getImageUrl(plan.imagen_url), nombre: plan.nombre })}
                  >
                    <img
                      src={getImageUrl(plan.imagen_url)}
                      alt={plan.nombre}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="hidden w-full h-full items-center justify-center bg-muted">
                      <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <ZoomIn className="h-8 w-8 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Package className="h-16 w-16 text-white/50" />
                  </div>
                )}

                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold leading-tight">{plan.nombre}</h3>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(plan)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(plan.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Eliminar</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-2xl font-bold text-primary">S/ {parseFloat(plan.precio_regular).toFixed(2)}</span>
                    {plan.precio_promocional && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 hover:bg-green-100">
                        S/ {parseFloat(plan.precio_promocional).toFixed(2)} promo
                      </Badge>
                    )}
                  </div>
                  {plan.descripcion && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{plan.descripcion}</p>
                  )}
                  <div className="flex items-center gap-2">
                    {plan.principal ? (
                      <Badge className="gap-1">
                        <Star className="h-3 w-3" />
                        Plan Principal
                      </Badge>
                    ) : (
                      <Badge variant="outline">Plan Secundario</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">
                {searchTerm ? 'No se encontraron resultados' : 'No hay items en el catálogo'}
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {searchTerm ? 'Intenta con otro término de búsqueda' : 'Crea un nuevo item para comenzar'}
              </p>
              {!searchTerm && (
                <Button onClick={openNewModal} variant="outline" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Item
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Image preview dialog */}
        {imagePreview && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setImagePreview(null)}
          >
            <div className="relative max-w-4xl w-full max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setImagePreview(null)}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 hover:bg-transparent"
              >
                <X className="h-6 w-6" />
              </Button>
              <h3 className="text-white text-lg font-medium mb-3">{imagePreview.nombre}</h3>
              <img
                src={imagePreview.url}
                alt={imagePreview.nombre}
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPlan ? 'Editar Item' : 'Nuevo Item'}</DialogTitle>
              <DialogDescription>
                {editingPlan
                  ? 'Modifica los datos del item del catálogo'
                  : 'Completa los datos para crear un nuevo item'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre *</label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre del plan"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Precio Regular (S/) *</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.precio_regular}
                    onChange={(e) => setFormData({ ...formData, precio_regular: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Precio Promocional (S/)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.precio_promocional}
                    onChange={(e) => setFormData({ ...formData, precio_promocional: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  rows={3}
                  placeholder="Descripción del plan..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Imagen del Plan</label>
                {(filePreview || (editingPlan && formData.imagen_url)) && (
                  <div className="relative mb-2">
                    <img
                      src={filePreview || getImageUrl(formData.imagen_url)}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-md border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7"
                      onClick={() => {
                        setSelectedFile(null);
                        setFilePreview(null);
                        setFormData({ ...formData, imagen_url: '' });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <label className="cursor-pointer block">
                  <div className="flex items-center justify-center gap-2 w-full px-3 py-2 border border-input rounded-md bg-background hover:bg-accent transition-colors">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {selectedFile ? selectedFile.name : 'Examinar...'}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-muted-foreground">Formatos: JPG, PNG, GIF, WEBP. Máx: 5MB</p>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="principal"
                  checked={!!formData.principal}
                  onCheckedChange={(checked) => setFormData({ ...formData, principal: checked ? 1 : 0 })}
                />
                <label htmlFor="principal" className="text-sm font-medium cursor-pointer">Plan principal</label>
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingPlan ? 'Actualizar' : 'Crear'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
