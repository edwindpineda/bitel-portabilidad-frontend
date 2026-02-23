'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { HelpCircle, Plus, Pencil, Trash2, Search, ChevronRight, Filter } from 'lucide-react';
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

const PROCESOS = [
  'Contacto',
  'Toma de datos',
  'Oferta',
  'Cierre de ventas',
  'Cierre de ventas (Contrato)',
  'Aceptación'
];

const PROCESO_COLORS = {
  'Contacto': 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  'Toma de datos': 'bg-purple-100 text-purple-700 hover:bg-purple-100',
  'Oferta': 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100',
  'Cierre de ventas': 'bg-green-100 text-green-700 hover:bg-green-100',
  'Cierre de ventas (Contrato)': 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  'Aceptación': 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100'
};

export default function FaqsPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [filtroProceso, setFiltroProceso] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    numero: '',
    pregunta: '',
    proceso: 'Contacto',
    respuesta: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/crm/faqs');
      setFaqs(response.data || []);
    } catch (error) {
      console.error('Error al cargar FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        numero: parseInt(formData.numero) || 0,
      };

      if (editingFaq) {
        await apiClient.put(`/crm/faqs/${editingFaq.id}`, dataToSend);
      } else {
        await apiClient.post('/crm/faqs', dataToSend);
      }
      setShowModal(false);
      setEditingFaq(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error al guardar FAQ:', error);
      alert(error.msg || 'Error al guardar pregunta frecuente');
    }
  };

  const handleEdit = (faq) => {
    setEditingFaq(faq);
    setFormData({
      numero: faq.numero || '',
      pregunta: faq.pregunta || '',
      proceso: faq.proceso || 'Contacto',
      respuesta: faq.respuesta || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Está seguro de eliminar esta pregunta frecuente?')) {
      try {
        await apiClient.delete(`/crm/faqs/${id}`);
        loadData();
      } catch (error) {
        console.error('Error al eliminar FAQ:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      numero: '',
      pregunta: '',
      proceso: 'Contacto',
      respuesta: '',
    });
  };

  const openNewModal = () => {
    setEditingFaq(null);
    resetForm();
    setShowModal(true);
  };

  const filteredFaqs = faqs.filter((faq) => {
    const matchesProceso = filtroProceso ? faq.proceso === filtroProceso : true;
    const matchesSearch = searchTerm
      ? faq.pregunta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.respuesta?.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    return matchesProceso && matchesSearch;
  });

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
            <span className="text-foreground font-medium">Preguntas Frecuentes</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Preguntas Frecuentes</h1>
              <p className="text-muted-foreground">Gestiona las preguntas frecuentes del sistema</p>
            </div>
            <Button onClick={openNewModal}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva FAQ
            </Button>
          </div>
        </div>

        <Separator />

        {/* Filters */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {faqs.length} {faqs.length === 1 ? 'pregunta' : 'preguntas'}
            </Badge>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={filtroProceso}
                onChange={(e) => setFiltroProceso(e.target.value)}
                className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Todos los procesos</option>
                {PROCESOS.map((proceso) => (
                  <option key={proceso} value={proceso}>{proceso}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar pregunta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Table */}
        {filteredFaqs.length > 0 ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">#</TableHead>
                  <TableHead>Pregunta</TableHead>
                  <TableHead className="w-[200px]">Proceso</TableHead>
                  <TableHead className="text-right w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFaqs.map((faq) => (
                  <TableRow key={faq.id}>
                    <TableCell>
                      <span className="font-mono text-muted-foreground">{faq.numero}</span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium line-clamp-1">{faq.pregunta}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{faq.respuesta}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={PROCESO_COLORS[faq.proceso] || 'bg-gray-100 text-gray-700'}>
                        {faq.proceso}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(faq)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(faq.id)} className="text-destructive hover:text-destructive">
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
                <HelpCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">
                {searchTerm || filtroProceso ? 'No se encontraron resultados' : 'No hay preguntas frecuentes registradas'}
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {searchTerm || filtroProceso ? 'Intenta con otros filtros de búsqueda' : 'Crea una nueva FAQ para comenzar'}
              </p>
              {!searchTerm && !filtroProceso && (
                <Button onClick={openNewModal} variant="outline" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva FAQ
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingFaq ? 'Editar Pregunta Frecuente' : 'Nueva Pregunta Frecuente'}</DialogTitle>
              <DialogDescription>
                {editingFaq
                  ? 'Modifica los datos de la pregunta frecuente'
                  : 'Completa los datos para crear una nueva FAQ'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Número *</label>
                  <Input
                    type="number"
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    placeholder="1"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Proceso *</label>
                  <select
                    value={formData.proceso}
                    onChange={(e) => setFormData({ ...formData, proceso: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    required
                  >
                    {PROCESOS.map((proceso) => (
                      <option key={proceso} value={proceso}>{proceso}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Pregunta *</label>
                <textarea
                  value={formData.pregunta}
                  onChange={(e) => setFormData({ ...formData, pregunta: e.target.value })}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  rows={3}
                  placeholder="Escribe la pregunta..."
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Respuesta *</label>
                <textarea
                  value={formData.respuesta}
                  onChange={(e) => setFormData({ ...formData, respuesta: e.target.value })}
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  rows={5}
                  placeholder="Escribe la respuesta..."
                  required
                />
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingFaq ? 'Actualizar' : 'Crear'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
