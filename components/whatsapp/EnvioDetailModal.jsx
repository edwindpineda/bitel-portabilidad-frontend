'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Eye, Database, Loader2 } from 'lucide-react';

const ESTADO_STYLES = {
  pendiente: { className: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500 animate-pulse', label: 'Pendiente' },
  enviado: { className: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500', label: 'Enviado' },
  entregado: { className: 'bg-green-100 text-green-800', dot: 'bg-green-500', label: 'Entregado' },
  cancelado: { className: 'bg-gray-100 text-gray-800', dot: 'bg-gray-500', label: 'Cancelado' },
};

export default function EnvioDetailModal({
  open,
  onOpenChange,
  envio,
  bases,
  loading,
}) {
  if (!envio) return null;

  const pendientes = (envio.cantidad || 0) - (envio.cantidad_exitosos || 0) - (envio.cantidad_fallidos || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col p-0">
        <div className="flex-shrink-0 bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center space-x-2">
              <Eye className="w-5 h-5" />
              <span>Detalle del Envio</span>
            </DialogTitle>
            <DialogDescription className="text-white/80">
              {envio.titulo}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold">{envio.cantidad || 0}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{envio.cantidad_exitosos || 0}</p>
                  <p className="text-xs text-muted-foreground">Exitosos</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-red-600">{envio.cantidad_fallidos || 0}</p>
                  <p className="text-xs text-muted-foreground">Fallidos</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-yellow-600">{pendientes}</p>
                  <p className="text-xs text-muted-foreground">Pendientes</p>
                </CardContent>
              </Card>
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-3">Registros del Envio</h3>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="border rounded-lg max-h-[350px] overflow-scroll" style={{ scrollbarWidth: 'thin' }}>
                  <table className="min-w-[800px] w-full caption-bottom text-sm">
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-xs">Telefono</TableHead>
                        <TableHead className="text-xs">Nombre</TableHead>
                        <TableHead className="text-xs">Base</TableHead>
                        <TableHead className="text-xs">Estado</TableHead>
                        <TableHead className="text-xs">Fecha Envio</TableHead>
                        <TableHead className="text-xs">Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bases.map((eb) => {
                        const estadoStyle = ESTADO_STYLES[eb.estado] || ESTADO_STYLES.pendiente;
                        return (
                          <TableRow key={eb.id}>
                            <TableCell className="text-sm font-mono">
                              {eb.detalle_telefono || '-'}
                            </TableCell>
                            <TableCell className="text-sm">
                              {eb.detalle_nombre || '-'}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {eb.base_nombre || '-'}
                            </TableCell>
                            <TableCell>
                              <Badge className={estadoStyle.className}>
                                <span className={`w-1.5 h-1.5 rounded-full ${estadoStyle.dot} mr-1.5`} />
                                {estadoStyle.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {eb.fecha_envio ? new Date(eb.fecha_envio).toLocaleString() : '-'}
                            </TableCell>
                            <TableCell className="text-xs text-red-600 whitespace-nowrap">
                              {eb.error_mensaje || '-'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </table>
                  {bases.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Database className="h-8 w-8 text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">No hay registros asignados</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 px-6 py-4 border-t bg-muted/30 flex justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
