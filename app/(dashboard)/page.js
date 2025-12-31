'use client';

export default function DashboardPage() {
  // Mock data - Métricas del CRM
  const stats = [
    {
      name: 'Conversaciones Asignadas',
      value: '100',
      subtitle: 'Total asignadas',
      change: '+15 esta semana',
      changeType: 'increase',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'primary',
    },
    {
      name: 'Portabilidades Cerradas',
      value: '68',
      subtitle: 'Ya compraron plan',
      change: '+8 esta semana',
      changeType: 'increase',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'success',
    },
    {
      name: 'Leads Nuevos',
      value: '15',
      subtitle: 'Esta semana',
      change: '+15 vs semana pasada',
      changeType: 'increase',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      color: 'purple',
    },
    {
      name: 'Tasa de Conversión',
      value: '68%',
      subtitle: '68 de 100 convertidos',
      change: '+5% vs mes pasado',
      changeType: 'increase',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: 'warning',
    },
  ];

  // Pipeline de ventas
  const pipeline = [
    { status: 'Nuevo', count: 15, color: 'purple', percentage: 15 },
    { status: 'Contactado', count: 12, color: 'blue', percentage: 12 },
    { status: 'Interesado', count: 5, color: 'yellow', percentage: 5 },
    { status: 'Ganado', count: 68, color: 'green', percentage: 68 },
  ];

  const recentConversations = [
    { id: 1, name: 'Carlos Pérez', status: 'nuevo', time: '5 min', message: 'Quiero información sobre portabilidad' },
    { id: 2, name: 'María López', status: 'interesado', time: '15 min', message: 'Me interesa el plan de 45 soles' },
    { id: 3, name: 'Juan Torres', status: 'contactado', time: '1 hora', message: 'Tengo Claro actualmente' },
    { id: 4, name: 'Ana Gutiérrez', status: 'nuevo', time: '2 horas', message: 'Cuánto cuesta portarme?' },
  ];

  const statusColors = {
    nuevo: 'bg-purple-100 text-purple-700',
    contactado: 'bg-blue-100 text-blue-700',
    interesado: 'bg-yellow-100 text-yellow-700',
    ganado: 'bg-green-100 text-green-700',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard de Portabilidad</h1>
          <p className="text-gray-600 mt-1">Seguimiento de conversaciones y ventas</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Última actualización</p>
          <p className="text-sm font-medium text-gray-900">Hoy, {new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${
                stat.color === 'primary' ? 'bg-primary-100' :
                stat.color === 'success' ? 'bg-success-100' :
                stat.color === 'purple' ? 'bg-purple-100' :
                stat.color === 'warning' ? 'bg-warning-100' : 'bg-gray-100'
              }`}>
                <div className={`${
                  stat.color === 'primary' ? 'text-primary-600' :
                  stat.color === 'success' ? 'text-success-600' :
                  stat.color === 'purple' ? 'text-purple-600' :
                  stat.color === 'warning' ? 'text-warning-600' : 'text-gray-600'
                }`}>
                  {stat.icon}
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
              <p className="text-sm font-medium text-gray-900 mt-1">{stat.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.subtitle}</p>
              <p className="text-xs text-success-600 font-medium mt-2">{stat.change}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline Visual */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Pipeline de Portabilidad</h2>
        <div className="grid grid-cols-4 gap-4">
          {pipeline.map((stage) => (
            <div key={stage.status} className="text-center">
              <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-3 ${
                stage.color === 'purple' ? 'bg-purple-100' :
                stage.color === 'blue' ? 'bg-blue-100' :
                stage.color === 'yellow' ? 'bg-yellow-100' :
                'bg-green-100'
              }`}>
                <span className={`text-2xl font-bold ${
                  stage.color === 'purple' ? 'text-purple-700' :
                  stage.color === 'blue' ? 'text-blue-700' :
                  stage.color === 'yellow' ? 'text-yellow-700' :
                  'text-green-700'
                }`}>
                  {stage.count}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-900">{stage.status}</p>
              <p className="text-xs text-gray-500 mt-1">{stage.percentage}% del total</p>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Progreso general</span>
            <span className="font-semibold text-gray-900">68 de 100 convertidos (68%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className="bg-gradient-to-r from-success-500 to-success-600 h-3 rounded-full transition-all duration-500" style={{ width: '68%' }}></div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Conversations */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Conversaciones Recientes</h2>
              <p className="text-xs text-gray-500 mt-0.5">Clientes que preguntaron por portabilidad hoy</p>
            </div>
            <a href="/conversaciones" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Ver todas
            </a>
          </div>
          <div className="divide-y divide-gray-200">
            {recentConversations.map((conv) => (
              <div key={conv.id} className="p-6 hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {conv.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{conv.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{conv.message}</p>
                      <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full ${statusColors[conv.status]}`}>
                        {conv.status.charAt(0).toUpperCase() + conv.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{conv.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions & Stats */}
        <div className="space-y-6">
          {/* Ventas de la Semana */}
          <div className="bg-gradient-to-br from-success-50 to-success-100 rounded-lg shadow-sm border border-success-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-success-900">Ventas de la Semana</h2>
              <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-success-900">8</p>
              <p className="text-sm text-success-700 mt-1">Portabilidades cerradas</p>
              <p className="text-xs text-success-600 mt-2">+8 vs semana pasada</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
            <div className="space-y-3">
              <a
                href="/conversaciones"
                className="block w-full px-4 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors text-center"
              >
                💬 Ver Conversaciones
              </a>
              <a
                href="/configuracion/planes-tarifarios"
                className="block w-full px-4 py-3 bg-gray-100 text-gray-900 font-medium rounded-lg hover:bg-gray-200 transition-colors text-center"
              >
                📋 Ver Planes Tarifarios
              </a>
            </div>
          </div>

          {/* Mi Desempeño Semanal */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Mi Desempeño Semanal</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Tasa de Conversión</span>
                  <span className="font-semibold text-success-600">68%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-success-500 h-2.5 rounded-full transition-all" style={{ width: '68%' }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">68 de 100 convertidos</p>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Tiempo de Respuesta</span>
                  <span className="font-semibold text-primary-600">Rápido</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-primary-500 h-2.5 rounded-full transition-all" style={{ width: '85%' }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Promedio: 15 minutos</p>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Nuevos Leads</span>
                  <span className="font-semibold text-purple-600">+15</span>
                </div>
                <p className="text-xs text-gray-500">Esta semana vs semana pasada</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
