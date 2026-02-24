# CRM Bitel - Frontend

Sistema de gestión de leads y ventas para portabilidad Bitel construido con Next.js 14.

## 🚀 Stack Tecnológico

- **Framework**: Next.js 14 (App Router)
- **React**: 18.3.1
- **Styling**: Tailwind CSS 3.4
- **Auth**: NextAuth.js 4.24
- **HTTP Client**: Axios 1.7
- **Forms**: React Hook Form + Yup
- **Charts**: Recharts 2.12
- **Icons**: Lucide React
- **Drag & Drop**: @dnd-kit (para Kanban)
- **State**: Zustand 4.5

## 📁 Estructura del Proyecto

```
frontend/
├── app/                          # App Router (Next.js 14)
│   ├── (auth)/                   # Grupo de rutas de autenticación
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (dashboard)/              # Grupo de rutas del dashboard
│   │   ├── dashboard/
│   │   ├── leads/
│   │   ├── conversations/
│   │   ├── pipeline/
│   │   ├── operators/
│   │   ├── reports/
│   │   ├── plans/
│   │   ├── faqs/
│   │   └── settings/
│   └── api/                      # API Routes
│       ├── auth/[...nextauth]/
│       └── health/
├── components/                   # Componentes reutilizables
│   ├── ui/                       # Componentes UI base
│   ├── layout/                   # Layouts (Sidebar, Navbar, etc.)
│   ├── features/                 # Componentes por feature
│   └── common/                   # Componentes comunes
├── lib/                          # Utilidades y configuración
│   ├── api.js                    # Cliente HTTP
│   ├── utils.js                  # Utilidades generales
│   ├── constants.js              # Constantes
│   └── formatters.js             # Funciones de formateo
├── hooks/                        # Custom React hooks
├── contexts/                     # React contexts
├── services/                     # Servicios de API
├── styles/                       # Estilos globales
└── public/                       # Assets estáticos

## 🎨 Paleta de Colores

### Colores Primarios
- **Primary**: `#2563eb` (Azul principal)
- **Primary Dark**: `#1e40af`
- **Primary Light**: `#3b82f6`

### Estados
- **Success**: `#10b981` (Verde)
- **Warning**: `#f59e0b` (Amarillo)
- **Danger**: `#ef4444` (Rojo)
- **Info**: `#06b6d4` (Cyan)

### Pipeline
- **Nuevo**: `#8b5cf6` (Violeta)
- **Contactado**: `#06b6d4` (Cyan)
- **Interesado**: `#f59e0b` (Amarillo)
- **Negociación**: `#f97316` (Naranja)
- **Ganado**: `#10b981` (Verde)
- **Perdido**: `#6b7280` (Gris)

### Neutros
- **Background**: `#f8fafc`
- **Surface**: `#ffffff`
- **Border**: `#e2e8f0`
- **Text Primary**: `#0f172a`
- **Text Secondary**: `#64748b`
- **Text Muted**: `#94a3b8`

## 🛠️ Configuración

### Instalación

```bash
cd frontend
npm install
```

### Variables de Entorno

Crea un archivo `.env.local`:

```env
# API Backend
NEXT_PUBLIC_API_URL=http://localhost:3020/api

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Environment
NODE_ENV=development
```

### Desarrollo

```bash
npm run dev
```

El frontend estará disponible en: `http://localhost:3000`

### Build

```bash
npm run build
npm start
```

### Lint

```bash
npm run lint
```

## 📦 Módulos del CRM

### 1. 🔐 Autenticación
- Login con username/password
- Registro de nuevos usuarios
- Recuperación de contraseña
- Gestión de sesión con JWT

### 2. 📊 Dashboard
- KPIs principales
- Gráficos de conversión
- Leads recientes
- Performance de operadores

### 3. 👥 Gestión de Leads
- Lista de contactos
- Filtros avanzados
- Vista detallada
- Historial de interacciones
- Asignación a operadores

### 4. 💬 Conversaciones
- Historial de chat con IA
- Transcripciones completas
- Filtros por fecha/estado
- Notas de operadores

### 5. 🎯 Pipeline de Ventas
- Vista Kanban
- Drag & Drop entre etapas
- Indicadores de tiempo
- Alertas de leads estancados

### 6. 👨‍💼 Gestión de Operadores
- Lista de usuarios
- Asignación de leads
- Métricas de performance
- Gestión de disponibilidad

### 7. 📈 Reportes
- Reporte de conversiones
- Análisis de abandono
- Performance por operador
- Exportación Excel/PDF

### 8. 📋 Catálogo de Planes
- CRUD de planes tarifarios
- Activación/desactivación
- Historial de cambios

### 9. ❓ Base de Conocimiento
- CRUD de FAQs
- Categorización por proceso
- Estadísticas de uso

### 10. ⚙️ Configuración
- Gestión de roles y permisos
- Módulos del sistema
- Sucursales
- Perfil de usuario

## 🔒 Roles y Permisos

- **Admin**: Acceso completo
- **Supervisor**: Gestión de leads y operadores
- **Asesor**: Gestión de leads asignados
- **Backoffice**: Procesamiento de portabilidades

## 🚀 Próximos Pasos

1. ✅ Estructura base creada
2. ✅ Configuración de Tailwind con colores del CRM
3. ✅ Archivos de utilidades y formateo
4. ⏳ Crear componentes UI base (Button, Input, Card, etc.)
5. ⏳ Implementar páginas de autenticación
6. ⏳ Configurar NextAuth
7. ⏳ Crear layouts (Auth y Dashboard)
8. ⏳ Implementar módulos del dashboard

## 📚 Documentación Adicional

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Hook Form](https://react-hook-form.com/)
- [NextAuth.js](https://next-auth.js.org/)

## 🤝 Contribución

Este es un proyecto interno de Bitel para gestión de portabilidades.

## 📄 Licencia

Privado - Bitel CRM © 2024
```
