// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/crm/auth/login',
  REGISTER: '/crm/auth/register',
  LOGOUT: '/crm/auth/logout',
  REFRESH: '/crm/auth/refresh',

  // Dashboard
  DASHBOARD_STATS: '/crm/dashboard/stats',
  DASHBOARD_CHARTS: '/crm/dashboard/charts',

  // Leads
  LEADS: '/crm/leads',
  LEAD_DETAIL: (id) => `/crm/leads/${id}`,
  ASSIGN_LEAD: (id) => `/crm/leads/${id}/assign`,

  // Conversations
  CONVERSATIONS: '/crm/conversations',
  CONVERSATION_DETAIL: (id) => `/crm/conversations/${id}`,

  // Operators
  OPERATORS: '/crm/operators',
  OPERATOR_DETAIL: (id) => `/crm/operators/${id}`,
  OPERATOR_STATS: (id) => `/crm/operators/${id}/stats`,

  // Reports
  REPORTS: '/crm/reports',
  REPORT_EXPORT: '/crm/reports/export',

  // Plans
  PLANS: '/crm/plans',
  PLAN_DETAIL: (id) => `/crm/plans/${id}`,

  // FAQs
  FAQS: '/crm/faqs',
  FAQ_DETAIL: (id) => `/crm/faqs/${id}`,

  // Settings
  ROLES: '/crm/settings/roles',
  MODULES: '/crm/settings/modules',
  PERMISSIONS: '/crm/settings/permissions',
  SUCURSALES: '/crm/settings/sucursales',
};

// Estados del pipeline
export const PIPELINE_STATUSES = [
  { value: 'nuevo', label: 'Nuevo', color: '#8b5cf6' },
  { value: 'contactado', label: 'Contactado', color: '#06b6d4' },
  { value: 'interesado', label: 'Interesado', color: '#f59e0b' },
  { value: 'negociacion', label: 'Negociación', color: '#f97316' },
  { value: 'ganado', label: 'Ganado', color: '#10b981' },
  { value: 'perdido', label: 'Perdido', color: '#6b7280' },
];

// Estados de respuesta del bot
export const BOT_STATUSES = [
  { value: 'exitosa', label: 'Exitosa', color: '#10b981' },
  { value: 'derivada', label: 'Derivada', color: '#f59e0b' },
  { value: 'ambigua', label: 'Ambigua', color: '#f97316' },
  { value: 'finalizada', label: 'Finalizada', color: '#6b7280' },
  { value: 'line1', label: 'Derivado a Asesor', color: '#3b82f6' },
  { value: 'line2', label: 'Derivado a Backoffice', color: '#8b5cf6' },
];

// Roles de usuario
export const USER_ROLES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'asesor', label: 'Asesor' },
  { value: 'backoffice', label: 'Backoffice' },
];

// Módulos del sistema
export const MODULES = [
  { id: 'dashboard', name: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard' },
  { id: 'leads', name: 'Leads', icon: 'Users', path: '/leads' },
  { id: 'conversations', name: 'Conversaciones', icon: 'MessageSquare', path: '/conversations' },
  { id: 'pipeline', name: 'Pipeline', icon: 'GitBranch', path: '/pipeline' },
  { id: 'operators', name: 'Operadores', icon: 'UserCog', path: '/operators' },
  { id: 'reports', name: 'Reportes', icon: 'BarChart3', path: '/reports' },
  { id: 'plans', name: 'Planes', icon: 'Package', path: '/plans' },
  { id: 'faqs', name: 'FAQs', icon: 'HelpCircle', path: '/faqs' },
  { id: 'settings', name: 'Configuración', icon: 'Settings', path: '/settings' },
];

// Filtros de fecha
export const DATE_FILTERS = [
  { value: 'today', label: 'Hoy' },
  { value: 'yesterday', label: 'Ayer' },
  { value: 'last7days', label: 'Últimos 7 días' },
  { value: 'last30days', label: 'Últimos 30 días' },
  { value: 'thisMonth', label: 'Este mes' },
  { value: 'lastMonth', label: 'Mes pasado' },
  { value: 'custom', label: 'Personalizado' },
];

// Paginación
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  LIMITS: [10, 25, 50, 100],
};

// Formatos de fecha
export const DATE_FORMATS = {
  FULL: 'dd/MM/yyyy HH:mm:ss',
  DATE: 'dd/MM/yyyy',
  TIME: 'HH:mm:ss',
  SHORT: 'dd/MM/yy',
  DISPLAY: 'dd MMM yyyy',
};

// Mensajes de validación
export const VALIDATION_MESSAGES = {
  REQUIRED: 'Este campo es obligatorio',
  EMAIL: 'Email inválido',
  PHONE: 'Número de teléfono inválido (debe empezar con 9 y tener 9 dígitos)',
  MIN_LENGTH: (min) => `Mínimo ${min} caracteres`,
  MAX_LENGTH: (max) => `Máximo ${max} caracteres`,
  PASSWORD_MISMATCH: 'Las contraseñas no coinciden',
  INVALID_CREDENTIALS: 'Credenciales inválidas',
};

// Timeouts y delays
export const TIMEOUTS = {
  DEBOUNCE: 500,
  TOAST: 3000,
  API_TIMEOUT: 30000,
};

// Límites
export const LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_IMAGE_SIZE: 2 * 1024 * 1024, // 2MB
  MAX_ATTACHMENTS: 5,
};
