'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

// Funcion para aplicar highlighting al texto
const highlightText = (text) => {
  if (!text) return '';

  // Escapar HTML
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Aplicar highlighting (orden importante para evitar conflictos)
  let highlighted = escaped;

  // 1. Texto entre comillas dobles "" - naranja (PRIMERO, antes de agregar spans)
  highlighted = highlighted.replace(/"([^"]*)"/g, '<span class="text-orange-500">"$1"</span>');

  // 2. JSON estructuras [ ] - morado
  highlighted = highlighted.replace(/(\[|\])/g, '<span class="text-purple-600 font-bold">$1</span>');

  // 3. Placeholders {{...}} - verde (después de comillas para no afectar atributos class)
  highlighted = highlighted.replace(/\{\{(\w+)\}\}/g, '<span class="text-emerald-600 font-semibold">{{$1}}</span>');

  // 4. Lineas que contienen # - azul (procesar por lineas)
  highlighted = highlighted.split('\n').map(line => {
    if (line.match(/#{1,6}\s/)) {
      return '<span class="text-blue-600 font-bold">' + line + '</span>';
    }
    return line;
  }).join('\n');

  return highlighted;
};

export default function PromptBotPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [promptSistema, setPromptSistema] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [originalPrompt, setOriginalPrompt] = useState('');
  const textareaRef = useRef(null);
  const highlightRef = useRef(null);

  useEffect(() => {
    fetchPrompt();
  }, []);

  const fetchPrompt = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/crm/prompt-asistente');
      if (response.data) {
        setPromptSistema(response.data.prompt_sistema || '');
        setOriginalPrompt(response.data.prompt_sistema || '');
      }
    } catch (error) {
      console.error('Error al cargar prompt:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePromptChange = (e) => {
    const newValue = e.target.value;
    setPromptSistema(newValue);
    setHasChanges(newValue !== originalPrompt);
  };

  // Sincronizar scroll entre textarea y highlight
  const handleScroll = useCallback(() => {
    if (highlightRef.current && textareaRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  const handleSave = async () => {
    if (!promptSistema.trim()) {
      toast.error('El prompt no puede estar vacio');
      return;
    }

    try {
      setSaving(true);
      await apiClient.post('/crm/prompt-asistente', {
        prompt_sistema: promptSistema
      });
      toast.success('Prompt guardado exitosamente');
      setOriginalPrompt(promptSistema);
      setHasChanges(false);
    } catch (error) {
      console.error('Error al guardar prompt:', error);
      toast.error(error.msg || 'Error al guardar el prompt');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPromptSistema(originalPrompt);
    setHasChanges(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div className="mb-4 flex-shrink-0">
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
          <Link href="/configuracion" className="hover:text-primary-600">Configuracion</Link>
          <span>/</span>
          <span className="text-gray-900">Prompt del Bot</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuracion del Bot WhatsApp</h1>
            <p className="text-gray-600 mt-1">Configura el prompt del asistente de conversaciones</p>
          </div>
          <div className="flex items-center space-x-3">
            {hasChanges && (
              <button
                onClick={handleReset}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Descartar cambios
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Guardar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden min-h-0">
        {/* Info bar */}
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex items-center flex-wrap gap-2 text-sm">
              <span className="text-blue-800 font-medium">Placeholders:</span>
              <code className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-mono">{'{{catalogo_principal}}'}</code>
              <code className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-mono">{'{{catalogo}}'}</code>
              <code className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-mono">{'{{faqs}}'}</code>
              <code className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-mono">{'{{Tipo_tipificaciones}}'}</code>
              <code className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-mono">{'{{preguntas_perfilamiento}}'}</code>
            </div>
          </div>
        </div>

        {/* Editor con highlighting */}
        <div className="flex-1 relative min-h-0">
          {/* Capa de highlighting (debajo) */}
          <pre
            ref={highlightRef}
            className="absolute inset-0 p-4 font-mono text-sm whitespace-pre-wrap break-words overflow-auto pointer-events-none m-0 bg-gray-50"
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
              lineHeight: '1.5',
              tabSize: 2
            }}
            dangerouslySetInnerHTML={{ __html: highlightText(promptSistema) + '\n' }}
          />
          {/* Textarea transparente (encima) */}
          <textarea
            ref={textareaRef}
            value={promptSistema}
            onChange={handlePromptChange}
            onScroll={handleScroll}
            placeholder="Escribe aqui el prompt del sistema para el bot de WhatsApp..."
            className="absolute inset-0 w-full h-full p-4 font-mono text-sm resize-none bg-transparent text-transparent caret-gray-900 focus:outline-none"
            style={{
              fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
              lineHeight: '1.5',
              tabSize: 2,
              WebkitTextFillColor: 'transparent'
            }}
            spellCheck="false"
          />
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span>{promptSistema.length} caracteres</span>
              <span className="text-blue-600 font-medium"># Titulo</span>
              <span className="text-emerald-600 font-medium">{'{{placeholder}}'}</span>
              {hasChanges && (
                <span className="flex items-center space-x-1 text-amber-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Cambios sin guardar</span>
                </span>
              )}
            </div>
            <span>El prompt se aplicara a las nuevas conversaciones</span>
          </div>
        </div>
      </div>
    </div>
  );
}
