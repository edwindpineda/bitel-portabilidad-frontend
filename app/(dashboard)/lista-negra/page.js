'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/api';
import * as XLSX from 'xlsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Search,
  ShieldOff,
  ShieldCheck,
  FileDown,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Phone,
  Calendar,
  User,
  AlertTriangle,
} from 'lucide-react';

const COLOR_MAP = {
  'rojo': '#EF4444',
  'naranja': '#F97316',
  'amarillo': '#EAB308',
  'verde': '#22C55E',
  'azul': '#3B82F6',
  'indigo': '#14B8A6',
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

const PAGE_SIZE = 50;

export default function ListaNegraPage() {
  const { data: session } = useSession();
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/crm/persona/lista-negra');
      setPersonas(response.data || []);
    } catch (error) {
      console.error('Error al cargar lista negra:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let list = [...personas];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        (p.nombre_completo || '').toLowerCase().includes(q) ||
        (p.celular || '').includes(q) ||
        (p.dni || '').includes(q)
      );
    }
    return list;
  }, [personas, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => { setCurrentPage(1); }, [search]);

  const handleRemoveFromListaNegra = async () => {
    if (!selectedPersona) return;
    try {
      setRemoving(true);
      await apiClient.put(`/crm/persona/${selectedPersona.id}`, { lista_negra: false });
      setShowConfirmModal(false);
      setSelectedPersona(null);
      loadData();
    } catch (error) {
      console.error('Error al quitar de lista negra:', error);
      alert('Error al quitar de lista negra');
    } finally {
      setRemoving(false);
    }
  };

  const handleExport = () => {
    const data = filtered.map(p => ({
      'Nombre': p.nombre_completo || '-',
      'Celular': p.celular || '-',
      'DNI': p.dni || '-',
      'Direccion': p.direccion || '-',
      'Estado': p.estado_nombre || '-',
      'Asesor': p.asesor_nombre || '-',
      'Fecha Registro': p.fecha_registro ? new Date(p.fecha_registro).toLocaleDateString('es-PE') : '-',
      'Fecha Actualizacion': p.fecha_actualizacion ? new Date(p.fecha_actualizacion).toLocaleDateString('es-PE') : '-',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Lista Negra');
    XLSX.writeFile(wb, 'lista_negra.xlsx');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const stats = useMemo(() => {
    const total = personas.length;
    const conNombre = personas.filter(p => p.nombre_completo).length;
    const conDni = personas.filter(p => p.dni).length;
    return { total, conNombre, conDni };
  }, [personas]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Lista Negra</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {personas.length} personas en lista negra
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} disabled={personas.length === 0}>
            <FileDown className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center">
                <ShieldOff className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total en lista negra</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.conNombre}</p>
                <p className="text-xs text-muted-foreground">Con nombre registrado</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Search className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{filtered.length}</p>
                <p className="text-xs text-muted-foreground">Resultados filtrados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Table */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nombre, celular o DNI..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-4 rounded-lg bg-muted/40 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:bg-background transition-colors"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {filtered.length} de {personas.length} registros
            </p>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : paginated.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <ShieldOff className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No se encontraron registros</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Intenta con otro criterio de busqueda</p>
            </div>
          ) : (
            <div className="rounded-xl border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs">Nombre</TableHead>
                    <TableHead className="text-xs">Celular</TableHead>
                    <TableHead className="text-xs">DNI</TableHead>
                    <TableHead className="text-xs">Direccion</TableHead>
                    <TableHead className="text-xs">Estado</TableHead>
                    <TableHead className="text-xs">Asesor</TableHead>
                    <TableHead className="text-xs">Registro</TableHead>
                    <TableHead className="text-xs w-24 text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((persona) => (
                    <TableRow key={persona.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                            <ShieldOff className="h-3.5 w-3.5 text-red-600" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{persona.nombre_completo || <span className="text-muted-foreground italic">Sin nombre</span>}</span>
                            <span className="text-[10px] text-red-500 font-medium">Lista negra</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          {persona.celular || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{persona.dni || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{persona.direccion || '-'}</TableCell>
                      <TableCell>
                        {persona.estado_nombre ? (
                          <Badge
                            variant="outline"
                            className="text-xs font-medium border"
                            style={{
                              color: getColorHex(persona.estado_color),
                              borderColor: getColorHex(persona.estado_color) + '55',
                              backgroundColor: getColorHex(persona.estado_color) + '12',
                            }}
                          >
                            {persona.estado_nombre}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <User className="h-3.5 w-3.5 shrink-0" />
                          {persona.asesor_nombre || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          {formatDate(persona.fecha_registro)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          onClick={() => { setSelectedPersona(persona); setShowConfirmModal(true); }}
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Quitar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-muted-foreground">
                Pagina {currentPage} de {totalPages} ({filtered.length} registros)
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                  <ChevronsLeft className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                  <ChevronsRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Remove Modal */}
      <Dialog open={showConfirmModal} onOpenChange={(open) => { if (!open) { setShowConfirmModal(false); setSelectedPersona(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Quitar de lista negra
            </DialogTitle>
            <DialogDescription>
              Esta accion quitara a esta persona de la lista negra.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <ShieldOff className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium">{selectedPersona?.nombre_completo || 'Sin nombre'}</p>
                <p className="text-xs text-muted-foreground">{selectedPersona?.celular || 'Sin celular'} {selectedPersona?.dni ? `| DNI: ${selectedPersona.dni}` : ''}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowConfirmModal(false); setSelectedPersona(null); }}>
              Cancelar
            </Button>
            <Button onClick={handleRemoveFromListaNegra} disabled={removing} className="bg-red-600 hover:bg-red-700">
              {removing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
