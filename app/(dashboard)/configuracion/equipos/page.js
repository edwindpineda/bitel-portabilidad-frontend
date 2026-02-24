'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import Link from 'next/link';

export default function EquiposPage() {
  const [coordinadores, setCoordinadores] = useState([]);
  const [asesores, setAsesores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedCoordinador, setExpandedCoordinador] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [coordinadoresRes, asesoresRes] = await Promise.all([
        apiClient.get('/crm/usuarios/rol/2'),
        apiClient.get('/crm/usuarios/rol/3')
      ]);
      setCoordinadores(coordinadoresRes.data || []);
      setAsesores(asesoresRes.data || []);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAsesoresByCoordinador = (coordinadorId) => {
    return asesores.filter(asesor => asesor.id_padre === coordinadorId);
  };

  const getAsesoresSinCoordinador = () => {
    return asesores.filter(asesor => !asesor.id_padre);
  };

  const toggleExpand = (coordinadorId) => {
    setExpandedCoordinador(expandedCoordinador === coordinadorId ? null : coordinadorId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const asesoresSinAsignar = getAsesoresSinCoordinador();

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
          <Link href="/configuracion" className="hover:text-primary-600">Configuracion</Link>
          <span>/</span>
          <span className="text-gray-900">Equipos</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Equipos de Trabajo</h1>
        <p className="text-gray-600 mt-1">Visualiza la estructura de coordinadores y asesores</p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{coordinadores.length}</p>
              <p className="text-sm text-gray-500">Coordinadores</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{asesores.length}</p>
              <p className="text-sm text-gray-500">Asesores</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{asesoresSinAsignar.length}</p>
              <p className="text-sm text-gray-500">Sin Asignar</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Coordinadores con sus Asesores */}
      <div className="space-y-4">
        {coordinadores.map((coordinador) => {
          const asesoresDelCoordinador = getAsesoresByCoordinador(coordinador.id);
          const isExpanded = expandedCoordinador === coordinador.id;

          return (
            <div key={coordinador.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleExpand(coordinador.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {coordinador.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-gray-900">@{coordinador.username}</h3>
                    <p className="text-sm text-gray-500">Coordinador</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                    {asesoresDelCoordinador.length} asesores
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-50">
                  {asesoresDelCoordinador.length > 0 ? (
                    <div className="divide-y divide-gray-200">
                      {asesoresDelCoordinador.map((asesor) => (
                        <div key={asesor.id} className="px-6 py-3 flex items-center space-x-4 ml-8">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {(asesor.username || '?').charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">@{asesor.username}</p>
                            {asesor.sucursal_nombre && (
                              <p className="text-xs text-gray-500">{asesor.sucursal_nombre}</p>
                            )}
                          </div>
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                            Asesor
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-6 py-4 text-center text-gray-500 text-sm">
                      No tiene asesores asignados
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Asesores sin coordinador */}
      {asesoresSinAsignar.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center space-x-2">
            <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Asesores sin Coordinador Asignado</span>
          </h2>
          <div className="bg-white rounded-lg shadow-sm border border-yellow-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {asesoresSinAsignar.map((asesor) => (
                <div key={asesor.id} className="px-6 py-3 flex items-center space-x-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {(asesor.username || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">@{asesor.username}</p>
                    {asesor.sucursal_nombre && (
                      <p className="text-xs text-gray-500">{asesor.sucursal_nombre}</p>
                    )}
                  </div>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                    Sin asignar
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {coordinadores.length === 0 && (
        <div className="text-center py-8 text-gray-500 bg-white rounded-lg border border-gray-200">
          No hay coordinadores registrados
        </div>
      )}
    </div>
  );
}
