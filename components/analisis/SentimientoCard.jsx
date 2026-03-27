'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, TrendingDown, Minus, MessageCircleQuestion, Tag, Loader2 } from 'lucide-react';

const SENTIMIENTO_CONFIG = {
  positivo: { color: '#22C55E', bg: '#22C55E12', border: '#22C55E55', icon: TrendingUp, label: 'Positivo' },
  negativo: { color: '#EF4444', bg: '#EF444412', border: '#EF444455', icon: TrendingDown, label: 'Negativo' },
  neutro: { color: '#6B7280', bg: '#6B728012', border: '#6B728055', icon: Minus, label: 'Neutro' },
};

const EMOCION_LABELS = {
  frustracion: 'Frustracion',
  enojo: 'Enojo',
  confusion: 'Confusion',
  ansiedad: 'Ansiedad',
  desconfianza: 'Desconfianza',
  decepcion: 'Decepcion',
  satisfaccion: 'Satisfaccion',
  gratitud: 'Gratitud',
  neutral: 'Neutral',
};

export default function SentimientoCard({ analisis, sentimiento, preguntas, loading }) {
  if (loading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!sentimiento) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-violet-500" />
            Analisis de Sentimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Brain className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">Sin analisis disponible</p>
            <p className="text-xs text-muted-foreground/60 mt-1">El analisis se genera automaticamente</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const config = SENTIMIENTO_CONFIG[sentimiento.sentimiento] || SENTIMIENTO_CONFIG.neutro;
  const SentIcon = config.icon;
  const scorePercent = sentimiento.score_sentimiento != null
    ? Math.round((sentimiento.score_sentimiento + 1) * 50)
    : null;

  const temas = preguntas?.filter(p => p.tipo === 'tema') || [];
  const preguntasList = preguntas?.filter(p => p.tipo === 'pregunta') || [];
  const palabras = preguntas?.filter(p => p.tipo === 'palabra') || [];

  return (
    <div className="space-y-5">
      {/* Sentimiento principal */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-4 w-4 text-violet-500" />
            Analisis de Sentimiento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Badge de sentimiento */}
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className="text-sm font-medium border px-3 py-1 gap-1.5"
              style={{ color: config.color, borderColor: config.border, backgroundColor: config.bg }}
            >
              <SentIcon className="h-4 w-4" />
              {config.label}
            </Badge>
            {scorePercent != null && (
              <span className="text-xs text-muted-foreground">
                Score: {sentimiento.score_sentimiento?.toFixed(2)}
              </span>
            )}
          </div>

          {/* Barra de score */}
          {scorePercent != null && (
            <div className="space-y-1">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${scorePercent}%`, backgroundColor: config.color }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Negativo</span>
                <span>Neutro</span>
                <span>Positivo</span>
              </div>
            </div>
          )}

          {/* Emocion */}
          {sentimiento.emocion_principal && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Emocion principal</p>
              <p className="text-sm font-medium">
                {EMOCION_LABELS[sentimiento.emocion_principal] || sentimiento.emocion_principal}
              </p>
              {sentimiento.score_emocion != null && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Confianza: {(sentimiento.score_emocion * 100).toFixed(0)}%
                </p>
              )}
            </div>
          )}

          {/* Resumen */}
          {analisis?.resumen && (
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Resumen</p>
              <p className="text-sm">{analisis.resumen}</p>
            </div>
          )}

          {/* Metricas */}
          {analisis && (
            <div className="grid grid-cols-2 gap-3">
              {analisis.total_palabras != null && (
                <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                  <p className="text-lg font-bold">{analisis.total_palabras}</p>
                  <p className="text-[10px] text-muted-foreground">Palabras</p>
                </div>
              )}
              {analisis.cumplimiento_protocolo != null && (
                <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                  <p className="text-lg font-bold">{analisis.cumplimiento_protocolo.toFixed(0)}%</p>
                  <p className="text-[10px] text-muted-foreground">Protocolo</p>
                </div>
              )}
              {analisis.fcr != null && (
                <div className="bg-muted/50 rounded-lg p-2.5 text-center">
                  <p className="text-lg font-bold">{analisis.fcr ? 'Si' : 'No'}</p>
                  <p className="text-[10px] text-muted-foreground">FCR</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Temas y Preguntas */}
      {(temas.length > 0 || preguntasList.length > 0 || palabras.length > 0) && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircleQuestion className="h-4 w-4 text-amber-500" />
              Temas y Preguntas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {temas.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Temas detectados</p>
                <div className="flex flex-wrap gap-1.5">
                  {temas.map((t, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {t.contenido}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {preguntasList.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Preguntas del cliente</p>
                <ul className="space-y-1">
                  {preguntasList.map((p, i) => (
                    <li key={i} className="text-xs bg-muted/50 rounded px-2 py-1.5">{p.contenido}</li>
                  ))}
                </ul>
              </div>
            )}
            {palabras.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Palabras clave</p>
                <div className="flex flex-wrap gap-1">
                  {palabras.map((p, i) => (
                    <span key={i} className="text-[10px] bg-violet-100 text-violet-700 rounded-full px-2 py-0.5">
                      {p.contenido}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
