'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

// Formatear numero con separacion de miles
const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return Number(num).toLocaleString('es-PE');
};

export default function EncuestasPage() {
  const [statsPersonas, setStatsPersonas] = useState(null);
  const [statsEncuestas, setStatsEncuestas] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [personasRes, encuestasRes] = await Promise.all([
          apiClient.get('/crm/tools/encuesta/personas/stats'),
          apiClient.get('/crm/tools/encuesta')
        ]);
        setStatsPersonas(personasRes.data || null);

        const encuestas = encuestasRes.data?.encuestas || [];
        setStatsEncuestas({
          total: encuestas.length,
          aceptaron: encuestas.filter(e => String(e.participacion || '').toLowerCase().includes('acept')).length,
          intencionWilder: encuestas.filter(e => String(e.p2_intencion_voto || '').startsWith('1:')).length
        });
      } catch (error) {
        console.error('Error al cargar estadisticas:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const menuEncuestas = [
    {
      title: 'Personas',
      description: 'Gestionar personas para encuestas',
      href: '/encuestas/personas',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'bg-blue-500',
    },
    {
      title: 'Encuestas',
      description: 'Gestionar encuestas y cuestionarios',
      href: '/encuestas/encuestas',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
      color: 'bg-emerald-500',
    },
    {
      title: 'Reportes',
      description: 'Graficos y estadisticas de encuestas',
      href: '/encuestas/reportes',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
      ),
      color: 'bg-purple-500',
    },
  ];

  const ConfigCard = ({ config }) => (
    <Link
      href={config.href}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
    >
      <div className={`${config.color} w-14 h-14 rounded-lg flex items-center justify-center text-white mb-4`}>
        {config.icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{config.title}</h3>
      <p className="text-sm text-gray-600">{config.description}</p>
    </Link>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Encuestas</h1>
        <p className="text-gray-600 mt-1">Gestiona personas y encuestas del sistema</p>
      </div>

      {/* Header con gradiente */}
      <div className="rounded-lg p-4 mb-6 bg-gradient-to-r from-emerald-600 to-teal-500">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Modulo de Encuestas</h2>
            <p className="text-sm text-white/80">Administra personas y encuestas</p>
          </div>
        </div>
      </div>

      {/* Indicadores */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-gray-900">{formatNumber(statsPersonas?.total)}</div>
            <div className="text-xs text-gray-500">Total Personas</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-yellow-600">{formatNumber(statsPersonas?.pendientes)}</div>
            <div className="text-xs text-gray-500">Pendientes</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-green-600">{formatNumber(statsPersonas?.completados)}</div>
            <div className="text-xs text-gray-500">Completados</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-emerald-600">{formatNumber(statsEncuestas?.total)}</div>
            <div className="text-xs text-gray-500">Total Encuestas</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-green-600">{formatNumber(statsEncuestas?.aceptaron)}</div>
            <div className="text-xs text-gray-500">Aceptaron</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-2xl font-bold text-blue-600">{formatNumber(statsEncuestas?.intencionWilder)}</div>
            <div className="text-xs text-gray-500">Intencion Wilder</div>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center mb-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      )}

      {/* Cards de navegacion */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuEncuestas.map((config) => (
          <ConfigCard key={config.href} config={config} />
        ))}
      </div>
    </div>
  );
}
