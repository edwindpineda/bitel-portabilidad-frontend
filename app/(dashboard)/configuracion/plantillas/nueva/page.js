'use client';

import { useState, useEffect, useRef } from 'react';
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

export default function NuevaPlantillaPage() {
  const router = useRouter();
  const [formatos, setFormatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [camposFormato, setCamposFormato] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [formData, setFormData] = useState({
    id_formato: '',
    nombre: '',
    descripcion: '',
    prompt: ''
  });

  const promptTextareaRef = useRef(null);

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

  useEffect(() => {
    loadFormatos();
  }, []);

  const loadFormatos = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/crm/formatos');
      setFormatos(response?.data || []);
    } catch (error) {
      console.error('Error al cargar formatos:', error);
    } finally {
      setLoading(false);
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

            {/* Columna derecha: Editor de Prompt */}
            <div className="lg:col-span-2 flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prompt *
                <span className="ml-2 text-xs text-gray-400">(Instrucciones completas del agente de voz)</span>
              </label>

              {/* Panel de variables clickeables */}
              <div className="bg-gray-800 border border-gray-700 rounded-t-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-400">Variables disponibles</span>
                    <span className="text-xs text-gray-500">(clic para insertar)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFullscreen(true)}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                    title="Pantalla completa"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {CAMPOS_FIJOS.map((campo) => (
                    <button
                      key={campo.nombre_campo}
                      type="button"
                      onClick={() => insertVariable(campo.nombre_campo)}
                      className="px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
                      title={`Insertar {{${campo.nombre_campo}}}`}
                    >
                      {campo.etiqueta}
                    </button>
                  ))}
                  {camposFormato.map((campo) => (
                    <button
                      key={campo.id}
                      type="button"
                      onClick={() => insertVariable(campo.nombre_campo)}
                      className="px-2 py-1 text-xs rounded bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer"
                      title={`Insertar {{${campo.nombre_campo}}}`}
                    >
                      {campo.etiqueta || campo.nombre_campo}
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea estilizado */}
              <textarea
                ref={promptTextareaRef}
                value={formData.prompt}
                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                className="flex-1 min-h-[350px] w-full px-4 py-3 text-sm font-mono bg-gray-900 text-gray-100 border border-gray-700 border-t-0 rounded-b-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                placeholder="Escribe aquí el prompt completo del agente de voz..."
                required
              />

              {/* Modal Fullscreen */}
              {isFullscreen && (
                <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col">
                  {/* Header del modal fullscreen */}
                  <div className="bg-gray-800 border-b border-gray-700 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white">Editor de Prompt</h3>
                      <button
                        type="button"
                        onClick={() => setIsFullscreen(false)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                        title="Cerrar pantalla completa"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {CAMPOS_FIJOS.map((campo) => (
                        <button
                          key={`fs-${campo.nombre_campo}`}
                          type="button"
                          onClick={() => insertVariable(campo.nombre_campo)}
                          className="px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
                          title={`Insertar {{${campo.nombre_campo}}}`}
                        >
                          {campo.etiqueta}
                        </button>
                      ))}
                      {camposFormato.map((campo) => (
                        <button
                          key={`fs-${campo.id}`}
                          type="button"
                          onClick={() => insertVariable(campo.nombre_campo)}
                          className="px-2 py-1 text-xs rounded bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer"
                          title={`Insertar {{${campo.nombre_campo}}}`}
                        >
                          {campo.etiqueta || campo.nombre_campo}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Textarea fullscreen */}
                  <textarea
                    ref={promptTextareaRef}
                    value={formData.prompt}
                    onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                    className="flex-1 w-full px-6 py-4 text-base font-mono bg-gray-900 text-gray-100 focus:outline-none resize-none"
                    placeholder="Escribe aquí el prompt completo del agente de voz..."
                    autoFocus
                  />
                </div>
              )}
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
    </div>
  );
}
