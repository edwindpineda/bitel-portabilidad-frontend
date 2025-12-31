'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

const COLOR_MAP = {
  'rojo': '#EF4444',
  'naranja': '#F97316',
  'amarillo': '#EAB308',
  'verde': '#22C55E',
  'azul': '#3B82F6',
  'indigo': '#6366F1',
  'cyan': '#06B6D4',
  'teal': '#14B8A6',
  'gris': '#6B7280',
  'morado': '#A855F7',
  'rosa': '#EC4899',
};

const getColorHex = (color) => {
  if (!color) return '#6B7280';
  if (color.startsWith('#')) return color;
  return COLOR_MAP[color.toLowerCase()] || '#6B7280';
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/crm/reportes/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Error al cargar estadisticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const statCards = stats ? [
    {
      name: 'Total Leads',
      value: stats.totalLeads?.toLocaleString() || '0',
      subtitle: 'Prospectos registrados',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'primary',
    },
    {
      name: 'Interesados en Portabilidad',
      value: stats.interesados?.toLocaleString() || '0',
      subtitle: 'Line1 + Line2',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'success',
    },
    {
      name: 'Leads Esta Semana',
      value: stats.leadsSemana?.toLocaleString() || '0',
      subtitle: 'Ultimos 7 dias',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      color: 'purple',
    },
    {
      name: 'Tasa de Conversion',
      value: `${stats.tasaConversion || 0}%`,
      subtitle: `${stats.interesados || 0} de ${stats.totalLeads || 0} interesados`,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: 'warning',
    },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard de Portabilidad</h1>
          <p className="text-gray-600 mt-1">Seguimiento de prospectos y tasa de conversión</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadDashboardStats}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Actualizar</span>
          </button>
          <div className="text-right">
            <p className="text-sm text-gray-500">Ultima actualizacion</p>
            <p className="text-sm font-medium text-gray-900">Hoy, {new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
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
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline Visual */}
      {stats?.pipeline && stats.pipeline.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Pipeline por Estado</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {stats.pipeline.map((stage) => {
              const colorHex = getColorHex(stage.color);
              const percentage = stats.totalLeads > 0 ? Math.round((stage.total / stats.totalLeads) * 100) : 0;
              return (
                <div key={stage.nombre} className="text-center">
                  <div
                    className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-3"
                    style={{ backgroundColor: `${colorHex}20` }}
                  >
                    <span
                      className="text-2xl font-bold"
                      style={{ color: colorHex }}
                    >
                      {stage.total}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{stage.nombre}</p>
                  <p className="text-xs text-gray-500 mt-1">{percentage}% del total</p>
                </div>
              );
            })}
          </div>
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Tasa de Conversion (Interesados)</span>
              <span className="font-semibold text-gray-900">{stats.interesados} de {stats.totalLeads} ({stats.tasaConversion}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-success-500 to-success-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${stats.tasaConversion}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversion Stats */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen de Conversion</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{stats?.totalLeads?.toLocaleString() || 0}</p>
              <p className="text-sm text-blue-700 mt-1">Total Leads</p>
              <p className="text-xs text-blue-500 mt-0.5">100% del pipeline</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-3xl font-bold text-yellow-600">{stats?.contactados?.toLocaleString() || 0}</p>
              <p className="text-sm text-yellow-700 mt-1">Contactados</p>
              <p className="text-xs text-yellow-500 mt-0.5">Tiene mensaje</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{stats?.interesados?.toLocaleString() || 0}</p>
              <p className="text-sm text-green-700 mt-1">Interesados</p>
              <p className="text-xs text-green-500 mt-0.5">Line1 + Line2</p>
            </div>
          </div>
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Nota: La tasa de conversion se calcula como:</p>
            <p className="text-sm font-medium text-gray-900">
              Interesados (Line1 + Line2) / Total Leads = <span className="text-success-600">{stats?.tasaConversion || 0}%</span>
            </p>
          </div>
        </div>

        {/* Quick Actions & Stats */}
        <div className="space-y-6">
          {/* Interesados Card */}
          <div className="bg-gradient-to-br from-success-50 to-success-100 rounded-lg shadow-sm border border-success-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-success-900">Interesados</h2>
              <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-success-900">{stats?.interesados?.toLocaleString() || 0}</p>
              <p className="text-sm text-success-700 mt-1">Prospectos interesados en portabilidad</p>
              <p className="text-xs text-success-600 mt-2">Estados: Line1 + Line2</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rapidas</h2>
            <div className="space-y-3">
              <a
                href="/leads"
                className="block w-full px-4 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors text-center"
              >
                Ver Leads
              </a>
              <a
                href="/reportes"
                className="block w-full px-4 py-3 bg-gray-100 text-gray-900 font-medium rounded-lg hover:bg-gray-200 transition-colors text-center"
              >
                Ver Reportes
              </a>
            </div>
          </div>

          {/* Tasa de Conversion */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tasa de Conversion</h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Interesados / Total</span>
                  <span className="font-semibold text-success-600">{stats?.tasaConversion || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-success-500 h-2.5 rounded-full transition-all"
                    style={{ width: `${stats?.tasaConversion || 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{stats?.interesados || 0} de {stats?.totalLeads || 0} prospectos</p>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Leads Esta Semana</span>
                  <span className="font-semibold text-purple-600">+{stats?.leadsSemana || 0}</span>
                </div>
                <p className="text-xs text-gray-500">Nuevos prospectos ultimos 7 dias</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
