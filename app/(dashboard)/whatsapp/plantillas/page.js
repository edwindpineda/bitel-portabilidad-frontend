'use client';

import { useState, useEffect } from 'react';
import { apiClient, API_BASE_URL } from '@/lib/api';
import toast from 'react-hot-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Plus, Search, Pencil, Trash2, FileText, Eye, Send, Loader2, Check,
  Info, Clock, CheckCircle2, XCircle, Phone, Link2, MessageSquare, Upload, Image, Video, File, X,
} from 'lucide-react';

const STATUS_STYLES = {
  APPROVED: { className: 'bg-green-100 text-green-800 hover:bg-green-100', dot: 'bg-green-500', label: 'Aprobada' },
  PENDING: { className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100', dot: 'bg-yellow-500 animate-pulse', label: 'Pendiente' },
  REJECTED: { className: 'bg-red-100 text-red-800 hover:bg-red-100', dot: 'bg-red-500', label: 'Rechazada' },
};

const CATEGORY_LABELS = {
  MARKETING: 'Marketing',
  UTILITY: 'Utilidad',
  AUTHENTICATION: 'Autenticacion',
};

const EMPTY_FORM = {
  name: '', category: 'MARKETING', language: 'es',
  header_type: 'TEXT', header_text: '', body: '', footer: '', buttons: [],
  id_formato: '',
};

const toUIFormat = (p) => {
  let header = null;
  let body = '';
  let footer = '';
  let buttons = [];

  if (Array.isArray(p.components)) {
    for (const comp of p.components) {
      if (comp.type === 'HEADER') {
        header = { type: comp.format || 'TEXT', text: comp.text || '' };
      } else if (comp.type === 'BODY') {
        body = comp.text || '';
      } else if (comp.type === 'FOOTER') {
        footer = comp.text || '';
      } else if (comp.type === 'BUTTONS') {
        buttons = Array.isArray(comp.buttons) ? comp.buttons : [];
      }
    }
    if (p.header_type_local) {
      if (header) {
        header.type = p.header_type_local;
      } else {
        header = { type: p.header_type_local, text: '' };
      }
    }
  } else {
    const headerType = p.header_type || 'TEXT';
    if (p.header_text || ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerType?.toUpperCase())) {
      header = { type: headerType, text: p.header_text || '' };
    }
    body = p.body || '';
    footer = p.footer || '';
    if (Array.isArray(p.buttons)) {
      buttons = p.buttons;
    } else if (typeof p.buttons === 'string') {
      try { buttons = JSON.parse(p.buttons); } catch { buttons = []; }
    } else {
      buttons = [];
    }
  }

  return {
    id: p.id_local || null,
    meta_id: p.id,
    name: p.name,
    status: p.status,
    category: p.category,
    language: p.language,
    components: { header, body, footer, buttons },
    quality_score: p.quality_score,
    rejected_reason: p.rejected_reason,
    createdAt: p.fecha_registro,
    stats: { enviados: p.stats_enviados || 0, entregados: p.stats_entregados || 0, leidos: p.stats_leidos || 0 },
    url_imagen: p.url_imagen,
    id_formato: p.id_formato || null,
    formato_nombre: p.formato_nombre || null,
  };
};

export default function WhatsAppPlantillasPage() {
  const [plantillas, setPlantillas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPlantilla, setEditingPlantilla] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(null);
  const [showSendModal, setShowSendModal] = useState(null);
  const [sendPhone, setSendPhone] = useState('');
  const [sendVariables, setSendVariables] = useState({});
  const [sending, setSending] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [formatos, setFormatos] = useState([]);
  const [loadingFormatos, setLoadingFormatos] = useState(false);
  const [campos, setCampos] = useState([]);
  const [loadingCampos, setLoadingCampos] = useState(false);
  const [camposSistema, setCamposSistema] = useState([]);
  const [loadingCamposSistema, setLoadingCamposSistema] = useState(false);
  const [variableCampos, setVariableCampos] = useState({});
  const [originalFormData, setOriginalFormData] = useState(null);

  useEffect(() => { loadPlantillas(); }, []);

  const loadFormatos = async () => {
    try {
      setLoadingFormatos(true);
      const res = await apiClient.get('/crm/formatos');
      setFormatos(res?.data || []);
    } catch (error) {
      console.error('Error al cargar formatos:', error);
    } finally {
      setLoadingFormatos(false);
    }
  };

  const loadCamposSistema = async () => {
    try {
      setLoadingCamposSistema(true);
      const res = await apiClient.get('/crm/campos-sistema');
      setCamposSistema(res?.data || []);
    } catch (error) {
      console.error('Error al cargar campos del sistema:', error);
      setCamposSistema([]);
    } finally {
      setLoadingCamposSistema(false);
    }
  };

  const loadCampos = async (idFormato) => {
    if (!idFormato) {
      setCampos([]);
      return;
    }
    try {
      setLoadingCampos(true);
      const res = await apiClient.get(`/crm/formatos/${idFormato}/campos`);
      setCampos(res?.data || []);
    } catch (error) {
      console.error('Error al cargar campos:', error);
      setCampos([]);
    } finally {
      setLoadingCampos(false);
    }
  };

  const loadCamposPlantilla = async (idPlantilla) => {
    if (!idPlantilla) return;
    try {
      const res = await apiClient.get(`/crm/plantillas-whatsapp/${idPlantilla}/campos`);
      const camposPlantilla = res?.data || [];
      const mapping = {};
      camposPlantilla.forEach((cp, idx) => {
        const varNum = String(cp.orden || (idx + 1));
        if (cp.id_campo_sistema) {
          mapping[varNum] = `sistema_${cp.id_campo_sistema}`;
        } else if (cp.id_formato_campo) {
          mapping[varNum] = `formato_${cp.id_formato_campo}`;
        }
      });
      setVariableCampos(mapping);
    } catch (error) {
      console.error('Error al cargar campos de plantilla:', error);
    }
  };

  const loadPlantillas = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/crm/plantillas-whatsapp');
      const templates = res?.data?.templates || res?.data || [];
      setPlantillas(templates.map(toUIFormat));
    } catch (error) {
      console.error('Error al cargar plantillas:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlantillas = plantillas.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.components.body.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || p.status === filterStatus;
    const matchesCategory = !filterCategory || p.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const openCreateModal = () => {
    setEditingPlantilla(null);
    setFormData(EMPTY_FORM);
    setOriginalFormData(null);
    setMediaFile(null);
    setMediaPreview(null);
    setCampos([]);
    setCamposSistema([]);
    setVariableCampos({});
    loadFormatos();
    loadCamposSistema();
    setShowModal(true);
  };

  const openEditModal = (plantilla) => {
    setEditingPlantilla(plantilla);
    const editForm = {
      name: plantilla.name, category: plantilla.category, language: plantilla.language,
      header_type: plantilla.components.header?.type || 'TEXT',
      header_text: plantilla.components.header?.text || '',
      body: plantilla.components.body, footer: plantilla.components.footer || '',
      buttons: plantilla.components.buttons || [],
      id_formato: plantilla.id_formato || '',
    };
    setFormData(editForm);
    setOriginalFormData(editForm);
    loadFormatos();
    loadCamposSistema();
    if (plantilla.id_formato) {
      loadCampos(plantilla.id_formato);
    } else {
      setCampos([]);
    }
    setVariableCampos({});
    if (plantilla.id) {
      loadCamposPlantilla(plantilla.id);
    }
    setMediaFile(null);
    if (plantilla.url_imagen) {
      setMediaPreview(`${API_BASE_URL}${plantilla.url_imagen}`);
    } else {
      setMediaPreview(null);
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    console.log('[handleSave] editingPlantilla:', editingPlantilla);
    if (!formData.name || !formData.body) { toast.error('Completa los campos obligatorios: Nombre y Contenido'); return; }

    const mediaTypes = ['IMAGE', 'VIDEO', 'DOCUMENT'];
    if (mediaTypes.includes(formData.header_type) && !mediaFile && !mediaPreview) {
      toast.error(`Debes subir un archivo para el tipo de encabezado: ${formData.header_type}`);
      return;
    }

    setSaving(true);
    try {
      let plantillaId = editingPlantilla?.id || null;

      // Detectar si solo cambio el mapeo de campos (no el contenido de la plantilla)
      const templateChanged = !editingPlantilla || !originalFormData || !!mediaFile ||
        originalFormData.name !== formData.name ||
        originalFormData.category !== formData.category ||
        originalFormData.language !== formData.language ||
        originalFormData.header_type !== formData.header_type ||
        originalFormData.header_text !== formData.header_text ||
        originalFormData.body !== formData.body ||
        originalFormData.footer !== formData.footer ||
        JSON.stringify(originalFormData.buttons) !== JSON.stringify(formData.buttons) ||
        String(originalFormData.id_formato || '') !== String(formData.id_formato || '');

      // editingPlantilla con id local = PUT (update), sin id local o nuevo = POST (create)
      const isUpdate = editingPlantilla && editingPlantilla.id;

      if (templateChanged) {
        // Contenido de plantilla cambio, guardar en Meta y BD
        if (mediaFile) {
          const formDataToSend = new FormData();
          formDataToSend.append('name', formData.name);
          formDataToSend.append('category', formData.category);
          formDataToSend.append('language', formData.language);
          formDataToSend.append('header_type', formData.header_type);
          formDataToSend.append('header_text', formData.header_text);
          formDataToSend.append('body', formData.body);
          formDataToSend.append('footer', formData.footer);
          formDataToSend.append('buttons', JSON.stringify(formData.buttons));
          if (formData.id_formato) formDataToSend.append('id_formato', formData.id_formato);
          formDataToSend.append('media', mediaFile);

          if (isUpdate) {
            formDataToSend.append('meta_template_id', editingPlantilla.meta_id);
            await apiClient.put(`/crm/plantillas-whatsapp/${editingPlantilla.id}`, formDataToSend, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Plantilla actualizada correctamente');
          } else {
            if (editingPlantilla?.meta_id) formDataToSend.append('meta_template_id', editingPlantilla.meta_id);
            const res = await apiClient.post('/crm/plantillas-whatsapp', formDataToSend, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            plantillaId = res?.data?.id || null;
            toast.success(editingPlantilla ? 'Plantilla actualizada correctamente' : 'Plantilla creada. Pendiente de aprobacion por Meta.');
          }
        } else {
          const payload = {
            name: formData.name, category: formData.category, language: formData.language,
            header_type: formData.header_type, header_text: formData.header_text,
            body: formData.body, footer: formData.footer, buttons: formData.buttons,
            id_formato: formData.id_formato || null,
          };
          if (isUpdate) {
            payload.meta_template_id = editingPlantilla.meta_id;
            await apiClient.put(`/crm/plantillas-whatsapp/${editingPlantilla.id}`, payload);
            toast.success('Plantilla actualizada correctamente');
          } else {
            if (editingPlantilla?.meta_id) payload.meta_template_id = editingPlantilla.meta_id;
            const res = await apiClient.post('/crm/plantillas-whatsapp', payload);
            plantillaId = res?.data?.id || null;
            toast.success(editingPlantilla ? 'Plantilla actualizada correctamente' : 'Plantilla creada. Pendiente de aprobacion por Meta.');
          }
        }
      }

      // Sincronizar mapeo de variables con campos del formato y/o sistema
      if (plantillaId && Object.keys(variableCampos).length > 0) {
        try {
          const variables = extractVariables(formData.body);
          const campoItems = variables
            .map((varNum) => {
              const val = variableCampos[varNum];
              if (!val) return null;
              const orden = Number(varNum);
              if (String(val).startsWith('sistema_')) {
                return { id_campo_sistema: Number(String(val).replace('sistema_', '')), orden };
              }
              if (String(val).startsWith('formato_')) {
                return { id_formato_campo: Number(String(val).replace('formato_', '')), orden };
              }
              return null;
            })
            .filter(Boolean);

          if (campoItems.length > 0) {
            await apiClient.put(`/crm/plantillas-whatsapp/${plantillaId}/campos/sync`, {
              campo_ids: campoItems,
            });
          }
        } catch (syncError) {
          console.error('Error al sincronizar campos:', syncError);
          toast.error('Plantilla guardada, pero hubo un error al guardar el mapeo de campos');
        }
      }

      // Si solo cambio el mapeo y no el template, mostrar feedback
      if (!templateChanged && editingPlantilla) {
        toast.success('Mapeo de campos actualizado');
      }

      setShowModal(false);
      setMediaFile(null);
      setMediaPreview(null);
      loadPlantillas();
    } catch (error) {
      console.error('Error al guardar:', error);
      const errorMsg = typeof error === 'string' ? error : (error?.msg || error?.message || 'Error al guardar la plantilla');
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (plantilla) => {
    if (!plantilla.id) { toast.error('Esta plantilla no tiene registro local'); return; }
    if (!confirm(`¿Estas seguro de eliminar la plantilla "${plantilla.name}"? Esta accion eliminara la plantilla tanto en Meta como en el sistema.`)) return;
    try {
      await apiClient.delete(`/crm/plantillas-whatsapp/${plantilla.id}`);
      toast.success('Plantilla eliminada correctamente');
      loadPlantillas();
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast.error(error?.msg || 'Error al eliminar la plantilla');
    }
  };

  const extractVariables = (text) => {
    const matches = text.match(/\{\{(\d+)\}\}/g) || [];
    return [...new Set(matches)].map((m) => m.replace(/[{}]/g, ''));
  };

  const openSendModal = (plantilla) => {
    const allText = `${plantilla.components.header?.text || ''} ${plantilla.components.body}`;
    const variables = extractVariables(allText);
    const initialVars = {};
    variables.forEach((v) => { initialVars[v] = ''; });
    setSendVariables(initialVars);
    setSendPhone('');
    setShowSendModal(plantilla);
  };

  const handleSend = async () => {
    if (!sendPhone || sendPhone.length < 9) { toast.error('Ingresa un numero de telefono valido'); return; }
    setSending(true);
    try {
      const components = [];
      const bodyParams = Object.keys(sendVariables).map(key => ({
        type: 'text',
        text: sendVariables[key] || `{{${key}}}`
      }));
      if (bodyParams.length > 0) {
        components.push({ type: 'body', parameters: bodyParams });
      }

      await apiClient.post('/crm/plantillas-whatsapp/enviar', {
        phone: sendPhone,
        template_name: showSendModal.name,
        language: showSendModal.language || 'es',
        components: components.length > 0 ? components : undefined
      });
      toast.success(`Mensaje enviado a +51 ${sendPhone}`);
      setShowSendModal(null);
    } catch (error) {
      console.error('Error al enviar:', error);
      toast.error(error?.msg || 'Error al enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  const addButton = () => {
    if (formData.buttons.length < 3) {
      setFormData({ ...formData, buttons: [...formData.buttons, { type: 'QUICK_REPLY', text: '' }] });
    }
  };

  const updateButton = (index, field, value) => {
    const newButtons = [...formData.buttons];
    newButtons[index] = { ...newButtons[index], [field]: value };
    setFormData({ ...formData, buttons: newButtons });
  };

  const removeButton = (index) => {
    setFormData({ ...formData, buttons: formData.buttons.filter((_, i) => i !== index) });
  };

  const renderPreviewMessage = (plantilla) => {
    let body = plantilla.components.body;
    Object.keys(sendVariables).forEach((key) => {
      body = body.replace(`{{${key}}}`, sendVariables[key] || `[Variable ${key}]`);
    });
    return body;
  };

  const getMediaUrl = (urlImagen) => `${API_BASE_URL}${urlImagen}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Plantillas WhatsApp</h1>
            <p className="text-muted-foreground mt-1">Gestiona tus plantillas de mensajes aprobadas por Meta</p>
          </div>
          <Button onClick={openCreateModal}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Plantilla
          </Button>
        </div>

        <Separator />

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/90 to-primary text-white border-0">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/80">Total Plantillas</p>
                  <p className="text-3xl font-bold mt-1">{plantillas.length}</p>
                </div>
                <div className="p-3 bg-white/20 rounded-xl">
                  <FileText className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md hover:border-green-200 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <p className="text-sm text-muted-foreground">Aprobadas</p>
                  </div>
                  <p className="text-3xl font-bold text-green-600 mt-1">{plantillas.filter((p) => p.status === 'APPROVED').length}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-xl">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md hover:border-yellow-200 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 animate-pulse" />
                    <p className="text-sm text-muted-foreground">Pendientes</p>
                  </div>
                  <p className="text-3xl font-bold text-yellow-600 mt-1">{plantillas.filter((p) => p.status === 'PENDING').length}</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-xl">
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md hover:border-red-200 transition-all">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <p className="text-sm text-muted-foreground">Rechazadas</p>
                  </div>
                  <p className="text-3xl font-bold text-red-600 mt-1">{plantillas.filter((p) => p.status === 'REJECTED').length}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-xl">
                  <XCircle className="w-6 h-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o contenido..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-10 px-4 border border-input rounded-md bg-background text-sm focus:ring-2 focus:ring-ring"
              >
                <option value="">Todos los estados</option>
                <option value="APPROVED">Aprobadas</option>
                <option value="PENDING">Pendientes</option>
                <option value="REJECTED">Rechazadas</option>
              </select>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="h-10 px-4 border border-input rounded-md bg-background text-sm focus:ring-2 focus:ring-ring"
              >
                <option value="">Todas las categorias</option>
                <option value="MARKETING">Marketing</option>
                <option value="UTILITY">Utilidad</option>
                <option value="AUTHENTICATION">Autenticacion</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Plantillas Grid */}
        {filteredPlantillas.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">No se encontraron plantillas</h3>
              <p className="text-muted-foreground mb-4">Crea tu primera plantilla o ajusta los filtros</p>
              <Button onClick={openCreateModal}>Crear plantilla</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlantillas.map((plantilla, index) => {
              const statusStyle = STATUS_STYLES[plantilla.status];
              const deliveryRate = plantilla.stats.enviados > 0 ? Math.round((plantilla.stats.entregados / plantilla.stats.enviados) * 100) : 0;
              const readRate = plantilla.stats.entregados > 0 ? Math.round((plantilla.stats.leidos / plantilla.stats.entregados) * 100) : 0;

              return (
                <Card key={`plantilla-${index}`} className="group overflow-hidden hover:shadow-xl hover:border-primary/30 transition-all duration-300">
                  {/* Header */}
                  <div className={`px-5 py-4 ${
                    plantilla.status === 'APPROVED' ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100' :
                    plantilla.status === 'PENDING' ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-b border-yellow-100' :
                    'bg-gradient-to-r from-red-50 to-rose-50 border-b border-red-100'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <div className={`p-1.5 rounded-lg ${
                            plantilla.status === 'APPROVED' ? 'bg-green-100' :
                            plantilla.status === 'PENDING' ? 'bg-yellow-100' : 'bg-red-100'
                          }`}>
                            <FileText className={`w-4 h-4 ${
                              plantilla.status === 'APPROVED' ? 'text-green-600' :
                              plantilla.status === 'PENDING' ? 'text-yellow-600' : 'text-red-600'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-foreground truncate">{plantilla.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              {CATEGORY_LABELS[plantilla.category]} · {plantilla.language?.toUpperCase()}
                              {plantilla.formato_nombre && <> · <span className="text-blue-600">{plantilla.formato_nombre}</span></>}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Badge className={statusStyle?.className}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusStyle?.dot} mr-1.5`} />
                        {statusStyle?.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Preview estilo WhatsApp */}
                  <div className="px-4 py-4" style={{ backgroundColor: '#ECE5DD' }}>
                    <div className="relative">
                      <div className="absolute -right-1 top-0 w-3 h-3 overflow-hidden">
                        <div className="absolute transform rotate-45 bg-[#DCF8C6] w-3 h-3 -left-1.5 top-0"></div>
                      </div>
                      <div className="bg-[#DCF8C6] rounded-lg rounded-tr-none p-3 shadow-sm max-h-36 overflow-hidden">
                        {plantilla.url_imagen && (() => {
                          const headerType = plantilla.components.header?.type?.toUpperCase();
                          const imgUrl = getMediaUrl(plantilla.url_imagen);
                          if (headerType === 'IMAGE') {
                            return <img src={imgUrl} alt="" className="w-full h-16 object-cover rounded mb-2" onError={(e) => e.target.style.display='none'} />;
                          } else if (headerType === 'VIDEO') {
                            return (
                              <div className="relative w-full h-16 bg-gray-800 rounded mb-2 flex items-center justify-center">
                                <Video className="w-6 h-6 text-white" />
                              </div>
                            );
                          } else if (headerType === 'DOCUMENT') {
                            return (
                              <div className="flex items-center space-x-2 bg-white/50 rounded p-1.5 mb-2">
                                <File className="w-5 h-5 text-red-500" />
                                <span className="text-xs text-gray-600 truncate">Documento</span>
                              </div>
                            );
                          }
                          return <img src={imgUrl} alt="" className="w-full h-16 object-cover rounded mb-2" onError={(e) => e.target.style.display='none'} />;
                        })()}
                        {plantilla.components.header && plantilla.components.header.type === 'TEXT' && (
                          <p className="text-sm font-semibold text-gray-900 mb-1 truncate">{plantilla.components.header.text}</p>
                        )}
                        <p className="text-sm text-gray-700 line-clamp-2">{plantilla.components.body}</p>
                        {plantilla.components.buttons && plantilla.components.buttons.length > 0 && (
                          <div className="flex items-center space-x-1 mt-2 pt-2 border-t border-[#c5e8b0]">
                            {plantilla.components.buttons.slice(0, 2).map((btn, idx) => (
                              <span key={idx} className="text-xs text-[#00a884] font-medium truncate">{btn.text}</span>
                            ))}
                            {plantilla.components.buttons.length > 2 && (
                              <span className="text-xs text-gray-400">+{plantilla.components.buttons.length - 2}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="px-5 py-3 bg-muted/50 border-t">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-lg font-bold text-foreground">{plantilla.stats.enviados.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Enviados</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-green-600">{deliveryRate}%</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Entregados</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-blue-600">{readRate}%</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Leidos</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-4 py-3 border-t">
                    <div className="flex items-center justify-between">
                      <Button variant="ghost" size="sm" onClick={() => setShowPreview(plantilla)}>
                        <Eye className="w-4 h-4 mr-1.5" />
                        Ver
                      </Button>
                      <div className="flex items-center space-x-1">
                        {plantilla.status === 'APPROVED' && (
                          <Button size="sm" className="bg-[#25D366] hover:bg-[#128C7E] text-white" onClick={() => openSendModal(plantilla)}>
                            <Send className="w-4 h-4 mr-1.5" />
                            Enviar
                          </Button>
                        )}
                        <Tooltip><TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditModal(plantilla)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger><TooltipContent>Editar</TooltipContent></Tooltip>
                        <Tooltip><TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(plantilla)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger><TooltipContent>Eliminar</TooltipContent></Tooltip>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create/Edit Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
            <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-4">
              <DialogHeader>
                <DialogTitle className="text-white flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>{editingPlantilla ? 'Editar Plantilla' : 'Nueva Plantilla'}</span>
                </DialogTitle>
                <DialogDescription className="text-white/80">Configura tu plantilla de mensaje de WhatsApp</DialogDescription>
              </DialogHeader>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
                {/* Formulario */}
                <div className="lg:col-span-3 p-6 space-y-5 border-r">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Nombre *</label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="bienvenida_lead"
                        disabled={!!editingPlantilla}
                      />
                      <p className="text-xs text-muted-foreground mt-1.5 flex items-center space-x-1">
                        <Info className="w-3 h-3" />
                        <span>{editingPlantilla ? 'El nombre no se puede modificar' : 'Solo letras, numeros y guiones bajos'}</span>
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Categoria</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full h-10 px-4 border border-input rounded-md bg-background text-sm focus:ring-2 focus:ring-ring"
                      >
                        <option value="MARKETING">Marketing</option>
                        <option value="UTILITY">Utilidad</option>
                        <option value="AUTHENTICATION">Autenticacion</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Idioma</label>
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      className="w-full h-10 px-4 border border-input rounded-md bg-background text-sm focus:ring-2 focus:ring-ring"
                      disabled={!!editingPlantilla}
                    >
                      <option value="es">Español</option>
                      <option value="en">Ingles</option>
                      <option value="pt_BR">Portugues</option>
                    </select>
                    {editingPlantilla && (
                      <p className="text-xs text-muted-foreground mt-1.5 flex items-center space-x-1">
                        <Info className="w-3 h-3" />
                        <span>El idioma no se puede modificar</span>
                      </p>
                    )}
                  </div>

                  {/* Formato */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Formato</label>
                    <select
                      value={formData.id_formato}
                      onChange={(e) => {
                        const newId = e.target.value;
                        setFormData({ ...formData, id_formato: newId });
                        setVariableCampos({});
                        loadCampos(newId);
                      }}
                      className="w-full h-10 px-4 border border-input rounded-md bg-background text-sm focus:ring-2 focus:ring-ring"
                      disabled={loadingFormatos}
                    >
                      <option value="">Sin formato</option>
                      {formatos.map((formato) => (
                        <option key={formato.id} value={formato.id}>{formato.nombre}</option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center space-x-1">
                      <Info className="w-3 h-3" />
                      <span>Asocia un formato de datos a esta plantilla</span>
                    </p>
                  </div>

                  {/* Header */}
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <h3 className="text-sm font-semibold text-foreground mb-3">Encabezado (opcional)</h3>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1">Tipo</label>
                          <select
                            value={formData.header_type}
                            onChange={(e) => {
                              setFormData({ ...formData, header_type: e.target.value });
                              if (e.target.value === 'TEXT') {
                                setMediaFile(null);
                                setMediaPreview(null);
                              }
                            }}
                            className="w-full h-9 px-3 border border-input rounded-md bg-background text-sm focus:ring-2 focus:ring-ring"
                            disabled={!!editingPlantilla}
                          >
                            <option value="TEXT">Texto</option>
                            <option value="IMAGE">Imagen</option>
                            <option value="VIDEO">Video</option>
                            <option value="DOCUMENT">Documento</option>
                          </select>
                        </div>
                        {formData.header_type === 'TEXT' ? (
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Texto</label>
                            <Input
                              value={formData.header_text}
                              onChange={(e) => setFormData({ ...formData, header_text: e.target.value })}
                              placeholder="Bienvenido a {{1}}"
                              className="h-9"
                            />
                          </div>
                        ) : (
                          <div className="col-span-2">
                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                              Archivo {formData.header_type === 'IMAGE' ? '(JPG, PNG)' : formData.header_type === 'VIDEO' ? '(MP4)' : '(PDF, Word, Excel)'}
                            </label>
                            <div className="space-y-2">
                              {(mediaPreview || mediaFile) && (
                                <div className="relative bg-background border rounded-md p-2">
                                  <button
                                    type="button"
                                    onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                                    className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 hover:bg-destructive/90 z-10"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                  {formData.header_type === 'IMAGE' && mediaPreview && (
                                    <img src={mediaPreview} alt="Preview" className="max-h-20 rounded object-contain mx-auto" />
                                  )}
                                  {formData.header_type === 'VIDEO' && mediaPreview && (
                                    <video src={mediaPreview} className="max-h-20 rounded mx-auto" controls />
                                  )}
                                  {formData.header_type === 'DOCUMENT' && (mediaFile || mediaPreview) && (
                                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                      <File className="w-5 h-5" />
                                      <span className="truncate">{mediaFile?.name || 'Documento cargado'}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                              <div className="relative">
                                <input
                                  type="file"
                                  accept={
                                    formData.header_type === 'IMAGE' ? 'image/jpeg,image/png' :
                                    formData.header_type === 'VIDEO' ? 'video/mp4,video/3gpp' :
                                    '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx'
                                  }
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      if (file.size > 100 * 1024 * 1024) {
                                        toast.error('El archivo excede el limite de 100MB');
                                        e.target.value = '';
                                        return;
                                      }
                                      setMediaFile(file);
                                      if (formData.header_type === 'IMAGE' || formData.header_type === 'VIDEO') {
                                        const url = URL.createObjectURL(file);
                                        setMediaPreview(url);
                                      } else {
                                        setMediaPreview(null);
                                      }
                                    }
                                  }}
                                  className="hidden"
                                  id="media-upload"
                                />
                                <label
                                  htmlFor="media-upload"
                                  className="flex items-center justify-center space-x-2 h-9 px-4 border border-dashed border-input rounded-md bg-background text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                                >
                                  <Upload className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-muted-foreground">
                                    {mediaFile ? 'Cambiar archivo' : 'Seleccionar archivo'}
                                  </span>
                                </label>
                              </div>
                              <p className="text-[10px] text-muted-foreground flex items-center space-x-1">
                                <Info className="w-3 h-3" />
                                <span>Tamaño maximo: 100MB</span>
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Body */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Contenido del mensaje *</label>
                    <textarea
                      value={formData.body}
                      onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                      rows={5}
                      className="w-full px-4 py-3 border border-input rounded-md bg-background focus:ring-2 focus:ring-ring transition-colors resize-none text-sm"
                      placeholder="Hola {{1}}, gracias por tu interes en nuestros servicios..."
                    />
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-xs text-muted-foreground flex items-center space-x-1">
                        <Info className="w-3 h-3" />
                        <span>Usa {"{{1}}"}, {"{{2}}"}, etc. para variables</span>
                      </p>
                      <span className="text-xs text-muted-foreground">{formData.body.length}/1024</span>
                    </div>
                  </div>

                  {/* Variable - Campo mapping */}
                  {extractVariables(formData.body).length > 0 && (
                    <Card className="bg-blue-50/50 border-blue-200">
                      <CardContent className="p-4">
                        <h3 className="text-sm font-semibold text-foreground mb-1">Mapeo de Variables</h3>
                        <p className="text-xs text-muted-foreground mb-3">
                          Asigna un campo del formato o del sistema a cada variable detectada en el mensaje
                        </p>
                        {(loadingCampos || loadingCamposSistema) ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            <span className="text-sm text-muted-foreground">Cargando campos...</span>
                          </div>
                        ) : (campos.length === 0 && camposSistema.length === 0) ? (
                          <p className="text-xs text-muted-foreground text-center py-3">
                            No hay campos disponibles para asignar
                          </p>
                        ) : (
                          <div className="grid gap-3">
                            {extractVariables(formData.body).map((varNum) => (
                              <div key={varNum} className="flex items-center gap-3">
                                <span className="inline-flex items-center justify-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md text-sm font-semibold min-w-[60px]">
                                  {`{{${varNum}}}`}
                                </span>
                                <select
                                  value={variableCampos[varNum] || ''}
                                  onChange={(e) => setVariableCampos({ ...variableCampos, [varNum]: e.target.value })}
                                  className="flex-1 h-9 px-3 border border-input rounded-md bg-background text-sm focus:ring-2 focus:ring-ring"
                                >
                                  <option value="">Seleccionar campo...</option>
                                  {camposSistema.length > 0 && (
                                    <optgroup label="Campos del Sistema (fijos)">
                                      {camposSistema.map((campo) => (
                                        <option key={`sistema_${campo.id}`} value={`sistema_${campo.id}`}>
                                          {campo.etiqueta || campo.nombre}
                                        </option>
                                      ))}
                                    </optgroup>
                                  )}
                                  {campos.length > 0 && (
                                    <optgroup label="Campos del Formato">
                                      {campos.map((campo) => (
                                        <option key={`formato_${campo.id}`} value={`formato_${campo.id}`}>
                                          {campo.etiqueta || campo.nombre_campo}
                                        </option>
                                      ))}
                                    </optgroup>
                                  )}
                                </select>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Footer */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Pie de mensaje (opcional)</label>
                    <Input
                      value={formData.footer}
                      onChange={(e) => setFormData({ ...formData, footer: e.target.value })}
                      placeholder="Responde MENU para ver opciones"
                    />
                  </div>

                  {/* Buttons */}
                  <Card className="bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-foreground">Botones (opcional)</h3>
                        {formData.buttons.length < 3 && (
                          <Button variant="outline" size="sm" onClick={addButton}>
                            <Plus className="w-4 h-4 mr-1" />
                            Agregar
                          </Button>
                        )}
                      </div>
                      {formData.buttons.length === 0 ? (
                        <div className="text-center py-4 text-sm text-muted-foreground">No hay botones configurados</div>
                      ) : (
                        <div className="space-y-2">
                          {formData.buttons.map((button, index) => (
                            <div key={index} className="bg-background p-3 rounded-lg border">
                              <div className="flex items-center space-x-2">
                                <Badge variant="secondary" className="h-6 w-6 flex items-center justify-center p-0 text-xs">{index + 1}</Badge>
                                <select
                                  value={button.type}
                                  onChange={(e) => updateButton(index, 'type', e.target.value)}
                                  className="w-28 h-8 px-2 border border-input rounded-md bg-background text-sm"
                                >
                                  <option value="QUICK_REPLY">Respuesta</option>
                                  <option value="URL">URL</option>
                                  <option value="PHONE_NUMBER">Telefono</option>
                                </select>
                                <Input
                                  value={button.text}
                                  onChange={(e) => updateButton(index, 'text', e.target.value)}
                                  placeholder="Texto del boton"
                                  className="flex-1 h-8"
                                />
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => removeButton(index)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              {button.type === 'URL' && (
                                <div className="mt-2 ml-8">
                                  <Input
                                    value={button.url || ''}
                                    onChange={(e) => updateButton(index, 'url', e.target.value)}
                                    placeholder="https://..."
                                    className="h-8"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Preview en tiempo real */}
                <div className="lg:col-span-2 bg-muted/30 p-6">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center space-x-2">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <span>Vista previa del mensaje</span>
                  </h3>

                  <div className="rounded-2xl overflow-hidden shadow-lg max-w-[320px] mx-auto">
                    <div className="bg-[#075E54] px-3 py-2.5 flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-[#DFE5E7] flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">+51 ---</p>
                        <p className="text-white/70 text-[11px]">en linea</p>
                      </div>
                    </div>

                    <div
                      className="px-3 py-4 min-h-[280px] flex flex-col justify-end"
                      style={{ backgroundColor: '#E5DDD5' }}
                    >
                      <div className="max-w-[85%] ml-auto">
                        <div className="bg-[#DCF8C6] rounded-lg rounded-tr-none p-2.5 shadow-sm relative overflow-hidden">
                          {formData.header_type === 'IMAGE' && mediaPreview && (
                            <img src={mediaPreview} alt="Header" className="w-full h-24 object-cover rounded mb-2" />
                          )}
                          {formData.header_type === 'VIDEO' && mediaPreview && (
                            <video src={mediaPreview} className="w-full h-24 object-cover rounded mb-2" />
                          )}
                          {formData.header_type === 'DOCUMENT' && (mediaFile || mediaPreview) && (
                            <div className="flex items-center space-x-2 bg-white/50 rounded p-2 mb-2">
                              <File className="w-8 h-8 text-red-500" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{mediaFile?.name || 'Documento'}</p>
                                <p className="text-[10px] text-gray-500">Documento</p>
                              </div>
                            </div>
                          )}
                          {formData.header_type === 'TEXT' && formData.header_text && (
                            <p className="text-[13px] font-bold text-gray-900 mb-1 break-words">{formData.header_text}</p>
                          )}
                          <p className="text-[13px] text-gray-800 whitespace-pre-line break-words leading-[18px]">
                            {formData.body || 'El contenido de tu mensaje aparecera aqui...'}
                          </p>
                          {formData.footer && (
                            <p className="text-[11px] text-gray-500 mt-1.5 break-words">{formData.footer}</p>
                          )}
                          <div className="flex items-center justify-end space-x-1 mt-0.5">
                            <span className="text-[10px] text-gray-500">12:30 p. m.</span>
                            <svg className="w-4 h-4 text-[#53bdeb]" viewBox="0 0 16 11" fill="currentColor">
                              <path d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.405-2.272a.463.463 0 0 0-.336-.146.47.47 0 0 0-.343.146l-.311.31a.445.445 0 0 0-.14.337c0 .136.047.25.14.343l2.996 2.996a.724.724 0 0 0 .501.203.697.697 0 0 0 .546-.266l6.646-8.417a.497.497 0 0 0 .108-.299.441.441 0 0 0-.19-.374l-.337-.273zm2.992 0a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-1.066-1.009-.566.718 1.352 1.352a.724.724 0 0 0 .501.203.697.697 0 0 0 .546-.266l6.646-8.417a.497.497 0 0 0 .108-.299.441.441 0 0 0-.19-.374l-.337-.273z" />
                            </svg>
                          </div>
                        </div>
                        {formData.buttons.length > 0 && (
                          <div className="mt-1 space-y-1">
                            {formData.buttons.map((btn, idx) => (
                              <div key={idx} className="bg-white rounded-lg shadow-sm py-2 text-center">
                                <span className="text-[13px] text-[#00a884] font-medium">{btn.text || `Boton ${idx + 1}`}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-yellow-800">
                        <p className="font-medium">Nota importante</p>
                        <p className="mt-0.5">Las plantillas deben ser aprobadas por Meta antes de poder usarlas. El proceso puede tomar hasta 24 horas.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                <span className="text-destructive">*</span> Campos obligatorios
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={saving || !formData.name || !formData.body}>
                  {saving ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</>
                  ) : (
                    <><Check className="w-4 h-4 mr-2" />{editingPlantilla ? 'Actualizar' : 'Crear Plantilla'}</>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Preview Modal */}
        <Dialog open={!!showPreview} onOpenChange={() => setShowPreview(null)}>
          <DialogContent className="max-w-sm p-0 overflow-hidden">
            {showPreview && (
              <>
                <div className="bg-[#075E54] px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">Vista Previa</p>
                        <p className="text-white/70 text-xs">{showPreview.name}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 min-h-[320px]" style={{ backgroundColor: '#ECE5DD' }}>
                  <div className="flex justify-end mb-2">
                    <div className="relative max-w-[85%]">
                      <div className="bg-[#DCF8C6] rounded-lg rounded-tr-none p-3 shadow-sm">
                        {showPreview.components.header && (
                          <p className="text-[15px] font-semibold text-gray-900 mb-1.5">{showPreview.components.header.text}</p>
                        )}
                        <p className="text-[14px] text-gray-800 whitespace-pre-line leading-relaxed">{showPreview.components.body}</p>
                        {showPreview.components.footer && (
                          <p className="text-[12px] text-gray-500 mt-2">{showPreview.components.footer}</p>
                        )}
                        {showPreview.components.buttons && showPreview.components.buttons.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-[#c5e8b0] space-y-1.5">
                            {showPreview.components.buttons.map((btn, idx) => (
                              <div key={idx} className="w-full py-2 text-[14px] text-[#00a884] font-medium text-center flex items-center justify-center space-x-1">
                                {btn.type === 'URL' && <Link2 className="w-4 h-4" />}
                                {btn.type === 'PHONE_NUMBER' && <Phone className="w-4 h-4" />}
                                <span>{btn.text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-end space-x-1 mt-1">
                          <span className="text-[11px] text-gray-500">12:30</span>
                          <svg className="w-4 h-4 text-[#53bdeb]" viewBox="0 0 16 11" fill="currentColor">
                            <path d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.405-2.272a.463.463 0 0 0-.336-.146.47.47 0 0 0-.343.146l-.311.31a.445.445 0 0 0-.14.337c0 .136.047.25.14.343l2.996 2.996a.724.724 0 0 0 .501.203.697.697 0 0 0 .546-.266l6.646-8.417a.497.497 0 0 0 .108-.299.441.441 0 0 0-.19-.374l-.337-.273zm2.992 0a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-1.066-1.009-.566.718 1.352 1.352a.724.724 0 0 0 .501.203.697.697 0 0 0 .546-.266l6.646-8.417a.497.497 0 0 0 .108-.299.441.441 0 0 0-.19-.374l-.337-.273z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 px-4 py-3 border-t flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-4">
                    <Badge className={STATUS_STYLES[showPreview.status]?.className}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLES[showPreview.status]?.dot} mr-1`} />
                      {STATUS_STYLES[showPreview.status]?.label}
                    </Badge>
                    <span className="text-muted-foreground">{CATEGORY_LABELS[showPreview.category]}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowPreview(null)}>Cerrar</Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Send Modal */}
        <Dialog open={!!showSendModal} onOpenChange={() => setShowSendModal(null)}>
          <DialogContent className="max-w-2xl p-0 overflow-hidden">
            {showSendModal && (
              <>
                <div className="bg-gradient-to-r from-[#25D366] to-[#128C7E] px-6 py-4">
                  <DialogHeader>
                    <DialogTitle className="text-white flex items-center space-x-2">
                      <Send className="w-5 h-5" />
                      <span>Enviar Plantilla</span>
                    </DialogTitle>
                    <DialogDescription className="text-white/80">{showSendModal.name}</DialogDescription>
                  </DialogHeader>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                  <div className="p-6 space-y-5 border-r">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Numero de telefono *</label>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1 px-3 h-10 bg-muted border border-input rounded-md text-sm text-muted-foreground">
                          <span>+51</span>
                        </div>
                        <div className="relative flex-1">
                          <Input
                            type="tel"
                            value={sendPhone}
                            onChange={(e) => setSendPhone(e.target.value.replace(/\D/g, '').slice(0, 9))}
                            placeholder="999 888 777"
                          />
                          {sendPhone.length === 9 && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">Ingresa el numero sin el codigo de pais</p>
                    </div>

                    {Object.keys(sendVariables).length > 0 && (
                      <Card className="bg-muted/50">
                        <CardContent className="p-4">
                          <h3 className="text-sm font-semibold text-foreground mb-3">Personaliza las variables</h3>
                          <div className="space-y-3">
                            {Object.keys(sendVariables).map((key) => (
                              <div key={key}>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">Variable {`{{${key}}}`}</label>
                                <Input
                                  value={sendVariables[key]}
                                  onChange={(e) => setSendVariables({ ...sendVariables, [key]: e.target.value })}
                                  placeholder={key === '1' ? 'Ej: Juan' : `Valor para {{${key}}}`}
                                  className="h-9"
                                />
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-start space-x-2">
                        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-blue-800">
                          <p className="font-medium">Sobre las plantillas</p>
                          <p className="mt-0.5">Solo puedes enviar plantillas aprobadas por Meta. Los mensajes se cobran segun tu plan.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/30 p-6">
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center space-x-2">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                      <span>Vista previa del mensaje</span>
                    </h3>

                    <div className="rounded-xl overflow-hidden shadow-lg" style={{ backgroundColor: '#ECE5DD' }}>
                      <div className="bg-[#075E54] px-3 py-2 flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">+51 {sendPhone || '---'}</p>
                          <p className="text-white/60 text-xs">en linea</p>
                        </div>
                      </div>

                      <div className="p-4 min-h-[200px]">
                        <div className="flex justify-end">
                          <div className="relative max-w-[90%]">
                            <div className="bg-[#DCF8C6] rounded-lg rounded-tr-none p-3 shadow-sm">
                              {showSendModal.url_imagen && (() => {
                                const headerType = showSendModal.components.header?.type?.toUpperCase();
                                const imgUrl = getMediaUrl(showSendModal.url_imagen);
                                if (headerType === 'IMAGE') {
                                  return <img src={imgUrl} alt="" className="w-full h-20 object-cover rounded mb-2" onError={(e) => e.target.style.display='none'} />;
                                } else if (headerType === 'VIDEO') {
                                  return (
                                    <div className="relative w-full h-20 bg-gray-800 rounded mb-2 flex items-center justify-center">
                                      <Video className="w-6 h-6 text-white" />
                                    </div>
                                  );
                                } else if (headerType === 'DOCUMENT') {
                                  return (
                                    <div className="flex items-center space-x-2 bg-white/50 rounded p-1.5 mb-2">
                                      <File className="w-5 h-5 text-red-500" />
                                      <span className="text-xs text-gray-600 truncate">Documento</span>
                                    </div>
                                  );
                                }
                                return <img src={imgUrl} alt="" className="w-full h-20 object-cover rounded mb-2" onError={(e) => e.target.style.display='none'} />;
                              })()}
                              {showSendModal.components.header && showSendModal.components.header.type === 'TEXT' && (
                                <p className="text-sm font-semibold text-gray-900 mb-1">{showSendModal.components.header.text}</p>
                              )}
                              <p className="text-sm text-gray-700 whitespace-pre-line">{renderPreviewMessage(showSendModal)}</p>
                              {showSendModal.components.footer && (
                                <p className="text-xs text-gray-500 mt-2">{showSendModal.components.footer}</p>
                              )}
                              {showSendModal.components.buttons && showSendModal.components.buttons.length > 0 && (
                                <div className="mt-2 pt-2 border-t border-[#c5e8b0] space-y-1">
                                  {showSendModal.components.buttons.map((btn, idx) => (
                                    <div key={idx} className="w-full py-1.5 text-sm text-[#00a884] font-medium text-center">{btn.text}</div>
                                  ))}
                                </div>
                              )}
                              <div className="flex items-center justify-end space-x-1 mt-1">
                                <span className="text-[10px] text-gray-500">{new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <MessageSquare className="w-4 h-4 text-green-500" />
                    <span>Plantilla: <strong className="text-foreground">{showSendModal.name}</strong></span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button variant="ghost" onClick={() => setShowSendModal(null)}>Cancelar</Button>
                    <Button
                      onClick={handleSend}
                      disabled={sending || sendPhone.length !== 9}
                      className="bg-[#25D366] hover:bg-[#128C7E] text-white"
                    >
                      {sending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando...</>
                      ) : (
                        <><Send className="w-4 h-4 mr-2" />Enviar mensaje</>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
