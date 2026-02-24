"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import Link from "next/link";

export default function TipificacionesArbolPage() {
  const [tipificaciones, setTipificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState(new Set());

  useEffect(() => {
    fetchTipificaciones();
  }, []);

  const fetchTipificaciones = async () => {
    try {
      const data = await apiClient.get("/crm/tipificaciones");
      setTipificaciones(data.data || []);

      // Expandir todos los nodos por defecto
      const allIds = new Set((data.data || []).map(t => t.id));
      setExpandedNodes(allIds);
    } catch (error) {
      console.error("Error al cargar tipificaciones:", error);
    } finally {
      setLoading(false);
    }
  };

  // Obtener tipificaciones raíz (sin padre)
  const getRoots = () => {
    return tipificaciones.filter(t => !t.id_padre);
  };

  // Obtener hijos de un nodo
  const getChildren = (parentId) => {
    return tipificaciones.filter(t => t.id_padre === parentId);
  };

  // Toggle expandir/colapsar nodo
  const toggleNode = (id) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Expandir todos
  const expandAll = () => {
    const allIds = new Set(tipificaciones.map(t => t.id));
    setExpandedNodes(allIds);
  };

  // Colapsar todos
  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  // Componente recursivo para renderizar nodo del árbol
  const TreeNode = ({ tipificacion, level = 0 }) => {
    const children = getChildren(tipificacion.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedNodes.has(tipificacion.id);

    return (
      <div className="select-none">
        <div
          className={`flex items-center py-2 px-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors ${level === 0 ? 'bg-gray-50' : ''}`}
          style={{ marginLeft: `${level * 24}px` }}
          onClick={() => hasChildren && toggleNode(tipificacion.id)}
        >
          {/* Icono de expandir/colapsar */}
          <div className="w-6 h-6 flex items-center justify-center mr-2">
            {hasChildren ? (
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            )}
          </div>

          {/* Color indicator */}
          {tipificacion.color && (
            <div
              className="w-4 h-4 rounded-full mr-3 flex-shrink-0 border border-gray-200"
              style={{ backgroundColor: tipificacion.color }}
            />
          )}

          {/* Nombre */}
          <span className={`font-medium ${level === 0 ? 'text-gray-900 text-base' : 'text-gray-700 text-sm'}`}>
            {tipificacion.nombre}
          </span>

          {/* Badges */}
          <div className="flex items-center gap-2 ml-3">
            {tipificacion.flag_asesor === 1 && (
              <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                Asesor
              </span>
            )}
            {tipificacion.flag_bot === 1 && (
              <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                Bot
              </span>
            )}
            {hasChildren && (
              <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded-full">
                {children.length} {children.length === 1 ? 'hijo' : 'hijos'}
              </span>
            )}
          </div>
        </div>

        {/* Hijos */}
        {hasChildren && isExpanded && (
          <div className="border-l-2 border-gray-200" style={{ marginLeft: `${level * 24 + 12}px` }}>
            {children.map(child => (
              <TreeNode key={child.id} tipificacion={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const roots = getRoots();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/configuracion/tipificaciones"
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Vista Árbol - Tipificaciones</h1>
                <p className="text-sm text-gray-500 mt-1">
                  {tipificaciones.length} tipificaciones en total • {roots.length} categorías principales
                </p>
              </div>
            </div>

            {/* Controles */}
            <div className="flex items-center gap-2">
              <button
                onClick={expandAll}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Expandir todo
              </button>
              <button
                onClick={collapseAll}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Colapsar todo
              </button>
            </div>
          </div>
        </div>

        {/* Árbol */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          {roots.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p>No hay tipificaciones configuradas</p>
              <Link
                href="/configuracion/tipificaciones"
                className="mt-4 inline-block text-indigo-600 hover:text-indigo-700"
              >
                Crear tipificación
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
              {roots.map(root => (
                <TreeNode key={root.id} tipificacion={root} level={0} />
              ))}
            </div>
          )}
        </div>

        {/* Leyenda */}
        <div className="mt-4 flex items-center justify-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">Asesor</span>
            <span>Visible para asesores</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">Bot</span>
            <span>Disponible para bot</span>
          </div>
        </div>
      </div>
    </div>
  );
}
