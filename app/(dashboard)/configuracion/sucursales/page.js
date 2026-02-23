'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { Building2, Plus, Pencil, Trash2, Search, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function SucursalesPage() {
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSucursal, setEditingSucursal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    definicion: '',
    color: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/crm/sucursales');
      setSucursales(response.data || []);
    } catch (error) {
      console.error('Error al cargar sucursales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSucursal) {
        await apiClient.put(`/crm/sucursales/${editingSucursal.id}`, formData);
      } else {
        await apiClient.post('/crm/sucursales', formData);
      }
      setShowModal(false);
      setEditingSucursal(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error al guardar sucursal:', error);
      alert(error.msg || 'Error al guardar sucursal');
    }
  };

  const handleEdit = (sucursal) => {
    setEditingSucursal(sucursal);
    setFormData({
      nombre: sucursal.nombre || '',
      definicion: sucursal.definicion || '',
      color: sucursal.color || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Está seguro de eliminar esta sucursal?')) {
      try {
        await apiClient.delete(`/crm/sucursales/${id}`);
        loadData();
      } catch (error) {
        console.error('Error al eliminar sucursal:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      definicion: '',
      color: ''
    });
  };

  const openNewModal = () => {
    setEditingSucursal(null);
    resetForm();
    setShowModal(true);
  };

  const filteredSucursales = sucursales.filter((s) =>
    s.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.definicion?.toLowerCase().includes(searchTerm.toLowerCase())
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
            <span className="text-foreground font-medium">Sucursales</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Sucursales</h1>
              <p className="text-muted-foreground">Gestiona las sucursales de la empresa</p>
            </div>
            <Button onClick={openNewModal}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Sucursal
            </Button>
          </div>
        </div>

        <Separator />

        {/* Stats + Search */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {sucursales.length} {sucursales.length === 1 ? 'sucursal' : 'sucursales'}
            </Badge>
          </div>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar sucursal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Table view */}
        {filteredSucursales.length > 0 ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Nombre</TableHead>
                  <TableHead>Definición</TableHead>
                  <TableHead className="w-[80px]">Color</TableHead>
                  <TableHead className="text-right w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSucursales.map((sucursal) => (
                  <TableRow key={sucursal.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                          <Building2 className="h-4 w-4 text-orange-600" />
                        </div>
                        <span className="font-medium">{sucursal.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {sucursal.definicion ? (
                        <span className="text-muted-foreground">{sucursal.definicion}</span>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {sucursal.color ? (
                        <div className="flex items-center gap-2">
                          <div className="h-5 w-5 rounded-full border" style={{ backgroundColor: sucursal.color }} />
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(sucursal)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(sucursal.id)} className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Eliminar</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">
                {searchTerm ? 'No se encontraron resultados' : 'No hay sucursales registradas'}
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {searchTerm ? 'Intenta con otro término de búsqueda' : 'Crea una nueva sucursal para comenzar'}
              </p>
              {!searchTerm && (
                <Button onClick={openNewModal} variant="outline" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Sucursal
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Dialog for create/edit */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSucursal ? 'Editar Sucursal' : 'Nueva Sucursal'}</DialogTitle>
              <DialogDescription>
                {editingSucursal
                  ? 'Modifica los datos de la sucursal'
                  : 'Completa los datos para crear una nueva sucursal'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre *</label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Nombre de la sucursal"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Definición</label>
                <Input
                  value={formData.definicion}
                  onChange={(e) => setFormData({ ...formData, definicion: e.target.value })}
                  placeholder="Descripción breve"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.color || '#6366f1'}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-9 w-12 rounded border cursor-pointer"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="#6366f1"
                    className="flex-1"
                  />
                </div>
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingSucursal ? 'Actualizar' : 'Crear'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
