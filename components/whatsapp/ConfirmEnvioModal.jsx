'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Send, AlertTriangle, Loader2, Users, FileText, CheckCircle2, XCircle } from 'lucide-react';

export default function ConfirmEnvioModal({
  open,
  onOpenChange,
  envio,
  onConfirm,
  enviando = false,
  progreso = { enviados: 0, total: 0, errores: 0 },
}) {
  if (!envio) return null;

  const porcentaje = progreso.total > 0 ? (progreso.enviados / progreso.total) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={enviando ? undefined : onOpenChange}>
      <DialogContent className="max-w-md p-0">
        <div className="bg-gradient-to-r from-[#25D366] to-[#128C7E] px-6 py-4 rounded-t-lg">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center space-x-2">
              <Send className="w-5 h-5" />
              <span>Confirmar Envio</span>
            </DialogTitle>
            <DialogDescription className="text-white/80">
              Esta accion no se puede deshacer
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-5">
          <Card className="bg-muted/30">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">Plantilla:</span>
                </div>
                <span className="text-sm font-medium">{envio.plantilla_nombre || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">Destinatarios:</span>
                </div>
                <span className="text-sm font-semibold text-[#25D366] bg-green-50 px-3 py-0.5 rounded-full">
                  {envio.cantidad || 0} personas
                </span>
              </div>
            </CardContent>
          </Card>

          {enviando && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#25D366]" />
                    <span className="text-sm font-medium text-[#25D366]">Enviando mensajes...</span>
                  </div>
                  <span className="text-sm font-semibold text-[#25D366]">
                    {progreso.enviados} / {progreso.total}
                  </span>
                </div>
                <Progress value={porcentaje} className="h-2" />
                <div className="flex items-center justify-center space-x-6 pt-1">
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-green-600 font-medium">
                      {progreso.enviados - progreso.errores} exitosos
                    </span>
                  </div>
                  {progreso.errores > 0 && (
                    <div className="flex items-center space-x-1.5">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-xs text-red-600 font-medium">
                        {progreso.errores} fallidos
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {!enviando && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700">
                    Se enviaran <strong>{envio.cantidad || 0}</strong> mensajes de WhatsApp.
                    Esta accion consumira creditos de tu cuenta de Meta.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="px-6 py-4 border-t bg-muted/20 flex justify-end space-x-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={enviando}>
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={enviando}
            className="bg-[#25D366] hover:bg-[#128C7E] text-white"
          >
            {enviando ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando...</>
            ) : (
              <><Send className="w-4 h-4 mr-2" />Enviar Ahora</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
