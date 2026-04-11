'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Campos fijos de base_numero_detalle
const CAMPOS_FIJOS = [
  { nombre_campo: 'telefono', etiqueta: 'Telefono' },
  { nombre_campo: 'nombre', etiqueta: 'Nombre' },
  { nombre_campo: 'correo', etiqueta: 'Correo' },
  { nombre_campo: 'tipo_documento', etiqueta: 'Tipo Documento' },
  { nombre_campo: 'numero_documento', etiqueta: 'Numero Documento' },
];


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
  highlighted = highlighted.replace(/\{\{(\w+)\}\}/g, '<span class="text-blue-600 font-semibold">{{$1}}</span>');

  // 4. Lineas que contienen # - azul (procesar por lineas)
  highlighted = highlighted.split('\n').map(line => {
    if (line.match(/#{1,6}\s/)) {
      return '<span class="text-blue-600 font-bold">' + line + '</span>';
    }
    return line;
  }).join('\n');

  return highlighted;
};

export default function NuevaPlantillaPage() {
  const router = useRouter();
  const [formatos, setFormatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [camposFormato, setCamposFormato] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toolsInfo, setToolsInfo] = useState({ category: '', tools: [] });
  const [loadingTools, setLoadingTools] = useState(false);

  const [formData, setFormData] = useState({
    id_formato: '',
    nombre: '',
    descripcion: '',
    prompt: ''
  });

  const promptTextareaRef = useRef(null);
  const highlightRef = useRef(null);
  const fullscreenTextareaRef = useRef(null);
  const fullscreenHighlightRef = useRef(null);

  // Sincronizar scroll entre textarea y highlight
  const handleScroll = useCallback(() => {
    if (highlightRef.current && promptTextareaRef.current) {
      highlightRef.current.scrollTop = promptTextareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = promptTextareaRef.current.scrollLeft;
    }
  }, []);

  // Sincronizar scroll en fullscreen
  const handleFullscreenScroll = useCallback(() => {
    if (fullscreenHighlightRef.current && fullscreenTextareaRef.current) {
      fullscreenHighlightRef.current.scrollTop = fullscreenTextareaRef.current.scrollTop;
      fullscreenHighlightRef.current.scrollLeft = fullscreenTextareaRef.current.scrollLeft;
    }
  }, []);

  // Función para insertar variable en la posición del cursor
  const insertVariable = (nombreCampo) => {
    const textarea = promptTextareaRef.current;
    if (!textarea) return;

    const variable = `{{${nombreCampo}}}`;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.prompt;

    const newText = text.substring(0, start) + variable + text.substring(end);
    setFormData({ ...formData, prompt: newText });

    // Restaurar foco y posición del cursor después de la variable
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + variable.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const handlePromptChange = (e) => {
    setFormData({ ...formData, prompt: e.target.value });
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setLoadingTools(true);
      const [formatosRes, toolsRes] = await Promise.all([
        apiClient.get('/crm/formatos'),
        apiClient.get('/system/tools?category=generica')
      ]);
      setFormatos(formatosRes?.data || []);
      if (toolsRes?.success) {
        setToolsInfo({
          category: toolsRes.category || 'generica',
          tools: toolsRes.tools || []
        });
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
      setLoadingTools(false);
    }
  };

  const loadCamposFormato = async (idFormato) => {
    if (!idFormato) {
      setCamposFormato([]);
      return;
    }
    try {
      const response = await apiClient.get(`/crm/formatos/${idFormato}`);
      const campos = response?.data?.campos || [];
      setCamposFormato(campos);
    } catch (error) {
      console.error('Error al cargar campos:', error);
      setCamposFormato([]);
    }
  };

  const handleFormatoChange = (e) => {
    const idFormato = e.target.value;
    setFormData({ ...formData, id_formato: idFormato });
    loadCamposFormato(idFormato);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await apiClient.post('/crm/plantillas', formData);
      router.push('/configuracion/plantillas');
    } catch (error) {
      console.error('Error al crear plantilla:', error);
      alert(error.msg || 'Error al crear plantilla');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
          <Link href="/configuracion" className="hover:text-primary-600">Configuración</Link>
          <span>/</span>
          <Link href="/configuracion/plantillas" className="hover:text-primary-600">Plantillas</Link>
          <span>/</span>
          <span className="text-gray-900">Nueva</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Nueva Plantilla</h1>
        <p className="text-gray-600 mt-1">Crear una nueva plantilla de prompt</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna izquierda: Datos basicos */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Formato *</label>
                <select
                  value={formData.id_formato}
                  onChange={handleFormatoChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="">Seleccionar formato...</option>
                  {formatos.map((formato) => (
                    <option key={formato.id} value={formato.id}>{formato.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Nombre de la plantilla"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder="Descripción opcional"
                />
              </div>

            </div>

            {/* Columna derecha: Editor de Prompt con highlighting */}
            <div className="lg:col-span-2 flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prompt *
                <span className="ml-2 text-xs text-gray-400">(Instrucciones completas del agente de voz)</span>
              </label>

              {/* Panel de variables clickeables */}
              <div className="px-4 py-2 bg-blue-50 border border-blue-100 rounded-t-lg">
                <div className="flex items-center space-x-3">
                  <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex items-center flex-wrap gap-2 text-sm">
                    <span className="text-blue-800 font-medium">Variables (clic para insertar):</span>
                    {CAMPOS_FIJOS.map((campo) => (
                      <button
                        key={campo.nombre_campo}
                        type="button"
                        onClick={() => insertVariable(campo.nombre_campo)}
                        className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-mono hover:bg-blue-200 transition-colors cursor-pointer"
                      >
                        {`{{${campo.nombre_campo}}}`}
                      </button>
                    ))}
                    {camposFormato.map((campo) => (
                      <button
                        key={campo.id}
                        type="button"
                        onClick={() => insertVariable(campo.nombre_campo)}
                        className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-mono hover:bg-purple-200 transition-colors cursor-pointer"
                      >
                        {`{{${campo.nombre_campo}}}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Panel informativo de funciones disponibles */}
              {toolsInfo.tools.length > 0 && (
                <div className="px-4 py-2 bg-green-50 border border-green-100 border-t-0">
                  <div className="flex items-center space-x-3">
                    <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div className="flex items-center flex-wrap gap-2 text-sm">
                      <span className="text-green-800 font-medium">Tools ({toolsInfo.category.charAt(0).toUpperCase() + toolsInfo.category.slice(1)}):</span>
                      {toolsInfo.tools.map((toolName, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-mono"
                        >
                          {toolName}()
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Editor con highlighting */}
              <div className="flex-1 relative min-h-[350px] border border-gray-200 border-t-0 rounded-b-lg overflow-hidden">
                {/* Capa de highlighting (debajo) */}
                <pre
                  ref={highlightRef}
                  className="absolute inset-0 p-4 font-mono text-sm whitespace-pre-wrap break-words overflow-auto pointer-events-none m-0 bg-gray-50"
                  style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                    lineHeight: '1.5',
                    tabSize: 2
                  }}
                  dangerouslySetInnerHTML={{ __html: highlightText(formData.prompt) + '\n' }}
                />
                {/* Textarea transparente (encima) */}
                <textarea
                  ref={promptTextareaRef}
                  value={formData.prompt}
                  onChange={handlePromptChange}
                  onScroll={handleScroll}
                  placeholder="Escribe aquí el prompt completo del agente de voz..."
                  className="absolute inset-0 w-full h-full p-4 font-mono text-sm resize-none bg-transparent text-transparent caret-gray-900 focus:outline-none"
                  style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                    lineHeight: '1.5',
                    tabSize: 2,
                    WebkitTextFillColor: 'transparent'
                  }}
                  spellCheck="false"
                  required
                />
              </div>

              {/* Footer del editor */}
              <div className="px-4 py-2 bg-gray-50 border border-gray-200 border-t-0 rounded-b-lg">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span>{formData.prompt.length} caracteres</span>
                    <span className="text-blue-600 font-medium"># Titulo</span>
                    <span className="text-blue-600 font-medium">{'{{variable}}'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFullscreen(true)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    title="Pantalla completa"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Botones de accion - abajo del formulario */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
            <Link
              href="/configuracion/plantillas"
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Crear Plantilla'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal Fullscreen - fuera del form para evitar conflictos */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          {/* Header del modal fullscreen */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Editor de Prompt</h3>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Cerrar pantalla completa"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Variables bar fullscreen */}
          <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
            <div className="flex items-center flex-wrap gap-2 text-sm">
              <span className="text-blue-800 font-medium">Variables:</span>
              {CAMPOS_FIJOS.map((campo) => (
                <button
                  key={`fs-${campo.nombre_campo}`}
                  type="button"
                  onClick={() => {
                    const variable = `{{${campo.nombre_campo}}}`;
                    setFormData({ ...formData, prompt: formData.prompt + variable });
                  }}
                  className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-mono hover:bg-blue-200 transition-colors cursor-pointer"
                >
                  {`{{${campo.nombre_campo}}}`}
                </button>
              ))}
              {camposFormato.map((campo) => (
                <button
                  key={`fs-${campo.id}`}
                  type="button"
                  onClick={() => {
                    const variable = `{{${campo.nombre_campo}}}`;
                    setFormData({ ...formData, prompt: formData.prompt + variable });
                  }}
                  className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-mono hover:bg-purple-200 transition-colors cursor-pointer"
                >
                  {`{{${campo.nombre_campo}}}`}
                </button>
              ))}
            </div>
          </div>

          {/* Editor fullscreen con highlighting */}
          <div className="flex-1 relative overflow-hidden">
            <pre
              ref={fullscreenHighlightRef}
              className="absolute inset-0 p-6 font-mono text-sm whitespace-pre-wrap break-words overflow-auto pointer-events-none m-0 bg-gray-50"
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                lineHeight: '1.5',
                tabSize: 2
              }}
              dangerouslySetInnerHTML={{ __html: highlightText(formData.prompt) + '\n' }}
            />
            <textarea
              ref={fullscreenTextareaRef}
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              onScroll={handleFullscreenScroll}
              className="absolute inset-0 w-full h-full p-6 font-mono text-sm resize-none bg-transparent text-transparent caret-gray-900 focus:outline-none overflow-auto"
              style={{
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                lineHeight: '1.5',
                tabSize: 2,
                WebkitTextFillColor: 'transparent'
              }}
              spellCheck="false"
              autoFocus
            />
          </div>

          {/* Footer fullscreen */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{formData.prompt.length} caracteres</span>
              <span>Presiona Esc o el boton X para cerrar</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
