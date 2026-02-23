'use client';

import { useState, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

// Campos fijos de base_numero_detalle
const CAMPOS_FIJOS = [
  { nombre_campo: 'telefono', etiqueta: 'Telefono' },
  { nombre_campo: 'nombre', etiqueta: 'Nombre' },
  { nombre_campo: 'correo', etiqueta: 'Correo' },
  { nombre_campo: 'tipo_documento', etiqueta: 'Tipo Documento' },
  { nombre_campo: 'numero_documento', etiqueta: 'Numero Documento' },
];

export default function PlantillasPage() {
  const [plantillas, setPlantillas] = useState([]);
  const [formatos, setFormatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlantilla, setEditingPlantilla] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [camposFormato, setCamposFormato] = useState([]);
  const [activePromptField, setActivePromptField] = useState(null);

  const promptRefs = {
    prompt_sistema: useRef(null),
    prompt_inicio: useRef(null),
    prompt_flujo: useRef(null),
    prompt_cierre: useRef(null),
    prompt_resultado: useRef(null),
  };

  const [formData, setFormData] = useState({
    id_tipo_plantilla: '',
    nombre: '',
    descripcion: '',
    prompt_sistema: '',
    prompt_inicio: '',
    prompt_flujo: '',
    prompt_cierre: '',
    prompt_resultado: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [plantillasRes, formatosRes] = await Promise.all([
        apiClient.get('/crm/plantillas'),
        apiClient.get('/crm/tipo-plantillas')
      ]);
      setPlantillas(plantillasRes?.data || []);
      setFormatos(formatosRes?.data || []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
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
      const response = await apiClient.get(`/crm/tipo-plantillas/${idFormato}`);
      const campos = response?.data?.campos || [];
      setCamposFormato(campos);
    } catch (error) {
      console.error('Error al cargar campos:', error);
      setCamposFormato([]);
    }
  };

  const handleFormatoChange = (e) => {
    const idFormato = e.target.value;
    setFormData({ ...formData, id_tipo_plantilla: idFormato });
    loadCamposFormato(idFormato);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPlantilla) {
        await apiClient.put(`/crm/plantillas/${editingPlantilla.id}`, formData);
      } else {
        await apiClient.post('/crm/plantillas', formData);
      }
      setEditingPlantilla(null);
      setIsCreating(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error al guardar plantilla:', error);
      alert(error.msg || 'Error al guardar plantilla');
    }
  };

  const handleEdit = async (plantilla) => {
    setEditingPlantilla(plantilla);
    setIsCreating(false);
    setFormData({
      id_tipo_plantilla: plantilla.id_tipo_plantilla || '',
      nombre: plantilla.nombre || '',
      descripcion: plantilla.descripcion || '',
      prompt_sistema: plantilla.prompt_sistema || '',
      prompt_inicio: plantilla.prompt_inicio || '',
      prompt_flujo: plantilla.prompt_flujo || '',
      prompt_cierre: plantilla.prompt_cierre || '',
      prompt_resultado: plantilla.prompt_resultado || ''
    });
    await loadCamposFormato(plantilla.id_tipo_plantilla);
  };

  const handleDelete = async (id) => {
    if (confirm('¿Está seguro de eliminar esta plantilla?')) {
      try {
        await apiClient.delete(`/crm/plantillas/${id}`);
        if (editingPlantilla?.id === id) {
          setEditingPlantilla(null);
          resetForm();
        }
        loadData();
      } catch (error) {
        console.error('Error al eliminar plantilla:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      id_tipo_plantilla: '',
      nombre: '',
      descripcion: '',
      prompt_sistema: '',
      prompt_inicio: '',
      prompt_flujo: '',
      prompt_cierre: '',
      prompt_resultado: ''
    });
    setCamposFormato([]);
    setActivePromptField(null);
  };

  const handleNewPlantilla = () => {
    setEditingPlantilla(null);
    setIsCreating(true);
    resetForm();
  };

  const handleCancel = () => {
    setEditingPlantilla(null);
    setIsCreating(false);
    resetForm();
  };

  // Insertar campo en el prompt activo
  const insertCampo = (campo) => {
    if (!activePromptField) return;

    const ref = promptRefs[activePromptField];
    const textarea = ref?.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData[activePromptField];
    const variable = `{{${campo.nombre_campo}}}`;

    const newText = text.substring(0, start) + variable + text.substring(end);
    setFormData({ ...formData, [activePromptField]: newText });

    // Restaurar foco y posicion del cursor
    setTimeout(() => {
      textarea.focus();
      const newPos = start + variable.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  // Todos los campos disponibles (fijos + formato)
  const allCampos = [...CAMPOS_FIJOS, ...camposFormato];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const showEditor = isCreating || editingPlantilla;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
            <Link href="/configuracion" className="hover:text-primary-600">Configuración</Link>
            <span>/</span>
            <span className="text-gray-900">Plantillas</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Plantillas de Prompts</h1>
          <p className="text-gray-600 mt-1">Gestiona las plantillas de prompts para campañas</p>
        </div>
        {!showEditor && (
          <button
            onClick={handleNewPlantilla}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Nueva Plantilla</span>
          </button>
        )}
      </div>

      {showEditor ? (
        /* Vista de edicion inline */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {editingPlantilla ? 'Editar Plantilla' : 'Nueva Plantilla'}
            </h2>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Columna izquierda: Datos basicos */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Formato *</label>
                  <select
                    value={formData.id_tipo_plantilla}
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

                {/* Campos disponibles */}
                {formData.id_tipo_plantilla && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Campos disponibles
                      <span className="text-xs text-gray-400 ml-1">(click para insertar)</span>
                    </label>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs text-gray-500 mb-2">Selecciona un campo de prompt y luego haz click en un campo:</p>

                      {/* Campos fijos */}
                      <div className="mb-2">
                        <span className="text-xs text-blue-600 font-medium">Campos base:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {CAMPOS_FIJOS.map((campo) => (
                            <button
                              key={campo.nombre_campo}
                              type="button"
                              onClick={() => insertCampo(campo)}
                              disabled={!activePromptField}
                              className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                                activePromptField
                                  ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 cursor-pointer'
                                  : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              {`{{${campo.nombre_campo}}}`}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Campos del formato */}
                      {camposFormato.length > 0 && (
                        <div>
                          <span className="text-xs text-purple-600 font-medium">Campos del formato:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {camposFormato.map((campo) => (
                              <button
                                key={campo.id}
                                type="button"
                                onClick={() => insertCampo(campo)}
                                disabled={!activePromptField}
                                className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                                  activePromptField
                                    ? 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 cursor-pointer'
                                    : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                              >
                                {`{{${campo.nombre_campo}}}`}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Columna derecha: Prompts (2 columnas en pantallas grandes) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Prompt Sistema */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prompt Sistema *
                      {activePromptField === 'prompt_sistema' && (
                        <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">Activo</span>
                      )}
                    </label>
                    <textarea
                      ref={promptRefs.prompt_sistema}
                      value={formData.prompt_sistema}
                      onChange={(e) => setFormData({ ...formData, prompt_sistema: e.target.value })}
                      onFocus={() => setActivePromptField('prompt_sistema')}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500 font-mono text-sm ${
                        activePromptField === 'prompt_sistema' ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-300'
                      }`}
                      rows={6}
                      placeholder="Define el rol y comportamiento del asistente..."
                      required
                    />
                  </div>

                  {/* Prompt Inicio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prompt Inicio *
                      {activePromptField === 'prompt_inicio' && (
                        <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">Activo</span>
                      )}
                    </label>
                    <textarea
                      ref={promptRefs.prompt_inicio}
                      value={formData.prompt_inicio}
                      onChange={(e) => setFormData({ ...formData, prompt_inicio: e.target.value })}
                      onFocus={() => setActivePromptField('prompt_inicio')}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500 font-mono text-sm ${
                        activePromptField === 'prompt_inicio' ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-300'
                      }`}
                      rows={6}
                      placeholder="Mensaje inicial de bienvenida..."
                      required
                    />
                  </div>

                  {/* Prompt Flujo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prompt Flujo *
                      {activePromptField === 'prompt_flujo' && (
                        <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">Activo</span>
                      )}
                    </label>
                    <textarea
                      ref={promptRefs.prompt_flujo}
                      value={formData.prompt_flujo}
                      onChange={(e) => setFormData({ ...formData, prompt_flujo: e.target.value })}
                      onFocus={() => setActivePromptField('prompt_flujo')}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500 font-mono text-sm ${
                        activePromptField === 'prompt_flujo' ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-300'
                      }`}
                      rows={6}
                      placeholder="Instrucciones para el flujo de la conversación..."
                      required
                    />
                  </div>

                  {/* Prompt Cierre */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prompt Cierre
                      {activePromptField === 'prompt_cierre' && (
                        <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">Activo</span>
                      )}
                    </label>
                    <textarea
                      ref={promptRefs.prompt_cierre}
                      value={formData.prompt_cierre}
                      onChange={(e) => setFormData({ ...formData, prompt_cierre: e.target.value })}
                      onFocus={() => setActivePromptField('prompt_cierre')}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500 font-mono text-sm ${
                        activePromptField === 'prompt_cierre' ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-300'
                      }`}
                      rows={6}
                      placeholder="Mensaje de cierre o despedida (opcional)..."
                    />
                  </div>
                </div>

                {/* Prompt Resultado - ancho completo */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prompt Resultado
                    {activePromptField === 'prompt_resultado' && (
                      <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">Activo</span>
                    )}
                    <span className="ml-2 text-xs text-gray-400">(Instrucciones para extraer/formatear el resultado de la conversación)</span>
                  </label>
                  <textarea
                    ref={promptRefs.prompt_resultado}
                    value={formData.prompt_resultado}
                    onChange={(e) => setFormData({ ...formData, prompt_resultado: e.target.value })}
                    onFocus={() => setActivePromptField('prompt_resultado')}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-primary-500 focus:border-primary-500 font-mono text-sm ${
                      activePromptField === 'prompt_resultado' ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-300'
                    }`}
                    rows={4}
                    placeholder="Instrucciones para procesar o extraer el resultado de la conversación (opcional)..."
                  />
                </div>

                {/* Botones de accion */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    {editingPlantilla ? 'Actualizar' : 'Crear'} Plantilla
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      ) : (
        /* Vista de lista */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Formato</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {plantillas.map((plantilla) => (
                <tr key={plantilla.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{plantilla.nombre}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500 max-w-xs truncate">{plantilla.descripcion || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {plantilla.tipoPlantilla?.nombre || 'Sin tipo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {plantilla.fecha_registro ? new Date(plantilla.fecha_registro).toLocaleDateString() : '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(plantilla)}
                      className="text-primary-600 hover:text-primary-900 mr-3"
                      title="Editar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(plantilla.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Eliminar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {plantillas.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay plantillas registradas. Crea una nueva plantilla para comenzar.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
