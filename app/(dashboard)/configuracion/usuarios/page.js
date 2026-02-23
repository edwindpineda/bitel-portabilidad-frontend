'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { Users, Plus, Pencil, Trash2, Search, ChevronRight, Shield, UserCircle } from 'lucide-react';
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

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [supervisores, setSupervisores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    usuario: '',
    password: '',
    id_rol: '',
    id_sucursal: '',
    id_padre: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usuariosRes, rolesRes, sucursalesRes, supervisoresRes] = await Promise.all([
        apiClient.get('/crm/usuarios'),
        apiClient.get('/crm/roles'),
        apiClient.get('/crm/sucursales'),
        apiClient.get('/crm/usuarios/rol/2')
      ]);
      setUsuarios(usuariosRes.data || []);
      setRoles(rolesRes.data || []);
      setSucursales(sucursalesRes.data || []);
      setSupervisores(supervisoresRes.data || []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (String(formData.id_rol) === '3' && !formData.id_padre) {
      alert('Debe seleccionar un coordinador para el rol Asesor');
      return;
    }

    try {
      if (editingUser) {
        await apiClient.put(`/crm/usuarios/${editingUser.id}`, formData);
      } else {
        await apiClient.post('/crm/usuarios', formData);
      }
      setShowModal(false);
      setEditingUser(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      alert(error.msg || 'Error al guardar usuario');
    }
  };

  const handleEdit = (usuario) => {
    setEditingUser(usuario);
    setFormData({
      usuario: usuario.usuario || '',
      password: '',
      id_rol: usuario.id_rol || '',
      id_sucursal: usuario.id_sucursal || '',
      id_padre: usuario.id_padre || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Está seguro de eliminar este usuario?')) {
      try {
        await apiClient.delete(`/crm/usuarios/${id}`);
        loadData();
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      usuario: '',
      password: '',
      id_rol: '',
      id_sucursal: '',
      id_padre: ''
    });
  };

  const handleRolChange = (e) => {
    const newRol = e.target.value;
    setFormData({
      ...formData,
      id_rol: newRol,
      id_sucursal: newRol === '3' ? formData.id_sucursal : '',
      id_padre: newRol === '3' ? formData.id_padre : ''
    });
  };

  const openNewModal = () => {
    setEditingUser(null);
    resetForm();
    setShowModal(true);
  };

  const filteredUsuarios = usuarios.filter((u) =>
    u.usuario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.rol?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.sucursal?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRolBadge = (rolNombre) => {
    const rolLower = rolNombre?.toLowerCase() || '';
    if (rolLower.includes('admin')) return <Badge>{rolNombre}</Badge>;
    if (rolLower.includes('coordinador') || rolLower.includes('supervisor')) return <Badge variant="secondary">{rolNombre}</Badge>;
    return <Badge variant="outline">{rolNombre}</Badge>;
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
            <span className="text-foreground font-medium">Usuarios</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
              <p className="text-muted-foreground">Gestiona los usuarios del sistema</p>
            </div>
            <Button onClick={openNewModal}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Button>
          </div>
        </div>

        <Separator />

        {/* Stats + Search */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {usuarios.length} {usuarios.length === 1 ? 'usuario' : 'usuarios'}
            </Badge>
          </div>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Table */}
        {filteredUsuarios.length > 0 ? (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[220px]">Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Sucursal</TableHead>
                  <TableHead>Coordinador</TableHead>
                  <TableHead className="text-right w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                          <UserCircle className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="font-medium">@{usuario.usuario}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getRolBadge(usuario.rol?.nombre)}
                    </TableCell>
                    <TableCell>
                      {usuario.sucursal?.nombre ? (
                        <span>{usuario.sucursal.nombre}</span>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {usuario.padre?.usuario ? (
                        <span className="text-muted-foreground">@{usuario.padre.usuario}</span>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {usuario.id_rol !== 1 ? (
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(usuario)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(usuario.id)} className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Eliminar</TooltipContent>
                          </Tooltip>
                        </div>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="inline-flex">
                              <Badge variant="outline" className="gap-1 text-muted-foreground">
                                <Shield className="h-3 w-3" />
                                Protegido
                              </Badge>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>Este usuario no puede ser modificado</TooltipContent>
                        </Tooltip>
                      )}
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
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">
                {searchTerm ? 'No se encontraron resultados' : 'No hay usuarios registrados'}
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {searchTerm ? 'Intenta con otro término de búsqueda' : 'Crea un nuevo usuario para comenzar'}
              </p>
              {!searchTerm && (
                <Button onClick={openNewModal} variant="outline" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Usuario
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Dialog for create/edit */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
              <DialogDescription>
                {editingUser
                  ? 'Modifica los datos del usuario'
                  : 'Completa los datos para crear un nuevo usuario'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Username *</label>
                <Input
                  value={formData.usuario}
                  onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                  placeholder="nombre de usuario"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {editingUser ? 'Nueva Contraseña (dejar vacío para mantener)' : 'Contraseña *'}
                </label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  required={!editingUser}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Rol *</label>
                <select
                  value={formData.id_rol}
                  onChange={handleRolChange}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                >
                  <option value="">Seleccionar rol</option>
                  {roles.map((rol) => (
                    <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                  ))}
                </select>
              </div>
              {String(formData.id_rol) === '3' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sucursal</label>
                    <select
                      value={formData.id_sucursal}
                      onChange={(e) => setFormData({ ...formData, id_sucursal: e.target.value })}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">Seleccionar sucursal</option>
                      {sucursales.map((sucursal) => (
                        <option key={sucursal.id} value={sucursal.id}>{sucursal.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Coordinador *</label>
                    <select
                      value={formData.id_padre}
                      onChange={(e) => setFormData({ ...formData, id_padre: e.target.value })}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      required
                    >
                      <option value="">Seleccionar coordinador</option>
                      {supervisores.map((supervisor) => (
                        <option key={supervisor.id} value={supervisor.id}>{supervisor.usuario}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingUser ? 'Actualizar' : 'Crear'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
