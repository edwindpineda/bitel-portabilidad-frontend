'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function PlanesPage() {
  const [expandedPlan, setExpandedPlan] = useState(null);

  const planes = [
    {
      id: 1,
      nombre: 'Plan S/34.90',
      precio_regular: 69.90,
      precio_promocional: 34.90,
      descripcion: 'Llamadas y SMS ilimitados. Suscripción premium a Paramount x 6 meses. Pagas solo S/34.90 x 12 meses.',
      principal: true,
      imagen_url: 'https://ai-you.io/planes/plan1.jpg',
      beneficios: [
        'Llamadas ilimitadas a nivel nacional',
        'SMS ilimitados',
        'Paramount Premium x 6 meses',
      ],
    },
    {
      id: 2,
      nombre: 'Plan S/27.90',
      precio_regular: 55.90,
      precio_promocional: 27.90,
      descripcion: 'Llamadas y SMS ilimitados. Bono 30GB para TikTok (x 6 meses). Suscripción premium a Paramount x 6 meses. Pagas solo S/27.90 x 12 meses. Primer mes a S/13.90',
      principal: false,
      imagen_url: 'https://ai-you.io/planes/plan2.jpg',
      beneficios: [
        'Llamadas ilimitadas a nivel nacional',
        'SMS ilimitados',
        '30GB datos para TikTok x 6 meses',
        'Paramount Premium x 6 meses',
        'Primer mes S/13.90',
      ],
    },
    {
      id: 3,
      nombre: 'Plan S/39.90',
      precio_regular: 79.90,
      precio_promocional: 39.90,
      descripcion: 'Llamadas y SMS ilimitados. Bono 30GB para TikTok (x 6 meses). Suscripción premium a Paramount x 6 meses. Pagas solo S/39.90 x 12 meses.',
      principal: false,
      imagen_url: 'https://ai-you.io/planes/plan3.jpg',
      beneficios: [
        'Llamadas ilimitadas a nivel nacional',
        'SMS ilimitados',
        '30GB datos para TikTok x 6 meses',
        'Paramount Premium x 6 meses',
      ],
    },
  ];

  const calcularAhorro = (regular, promocional) => {
    return (((regular - promocional) / regular) * 100).toFixed(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      {/* Header Mejorado */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Planes Disponibles</h1>
          <p className="text-lg text-gray-600">Consulta los planes actuales de portabilidad Bitel</p>
        </div>

        {/* Cards principales - Vista compacta */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {planes.map((plan) => {
            const ahorro = calcularAhorro(plan.precio_regular, plan.precio_promocional);
            const isExpanded = expandedPlan?.id === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative rounded-xl overflow-hidden shadow-lg transition-all duration-300 cursor-pointer transform hover:shadow-2xl hover:-translate-y-1 ${
                  plan.principal
                    ? 'border-2 border-primary-400 bg-gradient-to-br from-primary-50 to-white'
                    : 'bg-white border border-gray-200 hover:border-primary-300'
                } ${isExpanded ? 'ring-2 ring-primary-600' : ''}`}
                onClick={() => setExpandedPlan(isExpanded ? null : plan)}
              >
                {/* Badges */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
                  {plan.principal && (
                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      ⭐ DESTACADO
                    </div>
                  )}
                  <div className="bg-gradient-to-r from-success-500 to-success-600 text-white px-2 py-1 rounded-lg text-xs font-bold shadow-md flex items-center gap-1">
                    <span>-{ahorro}%</span>
                  </div>
                </div>

                {/* Imagen Miniatura */}
                <div className="relative h-32 w-full bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center overflow-hidden">
                  <Image
                    src={plan.imagen_url}
                    alt={plan.nombre}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  {/* Fallback */}
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-50 z-0">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary-600">
                        S/ {plan.precio_promocional}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contenido Principal */}
                <div className="p-5">
                  {/* Nombre */}
                  <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-1">
                    {plan.nombre}
                  </h3>

                  {/* Precios en horizontal compacto */}
                  <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Precio Promocional</p>
                      <p className="text-2xl font-bold text-primary-600">
                        S/ {plan.precio_promocional.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600 mb-1">Regular</p>
                      <p className="text-lg font-semibold text-gray-400 line-through">
                        S/ {plan.precio_regular.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Descripción breve */}
                  <p className="text-sm text-gray-700 mb-4 line-clamp-2 leading-relaxed">
                    {plan.descripcion}
                  </p>

                  {/* Indicador de expandible */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <span className="text-xs font-semibold text-primary-600">
                      {plan.beneficios.length} beneficios
                    </span>
                    <button
                      className={`text-primary-600 transition-transform duration-300 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </button>
                  </div>

                  {/* Contenido expandible */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* Ahorro total */}
                      <div className="p-3 bg-success-50 rounded-lg">
                        <p className="text-xs text-gray-700 mb-1">Ahorro Mensual vs Regular</p>
                        <p className="text-xl font-bold text-success-600">
                          S/ {(plan.precio_regular - plan.precio_promocional).toFixed(2)}
                        </p>
                      </div>

                      {/* Beneficios */}
                      <div>
                        <p className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-wide">
                          Incluye:
                        </p>
                        <ul className="space-y-2">
                          {plan.beneficios.map((beneficio, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-xs text-gray-700"
                            >
                              <span className="text-primary-500 font-bold mt-1">✓</span>
                              <span>{beneficio}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabla Comparativa Inferior */}
      <div className="max-w-7xl mx-auto mt-16">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          {/* Título */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-6">
            <h2 className="text-2xl font-bold text-white">Comparativa de Planes</h2>
            <p className="text-primary-100 mt-1">Resumen detallado de características</p>
          </div>

          {/* Tabla responsiva */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300 bg-gray-50">
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                    Característica
                  </th>
                  {planes.map((plan) => (
                    <th
                      key={plan.id}
                      className={`px-6 py-4 text-center text-sm font-bold ${
                        plan.principal
                          ? 'bg-primary-50 text-primary-900'
                          : 'text-gray-900'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span>{plan.nombre}</span>
                        {plan.principal && (
                          <span className="text-xs bg-primary-500 text-white px-2 py-1 rounded-full">
                            Destacado
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {/* Precio Regular */}
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-900">Precio Regular</td>
                  {planes.map((plan) => (
                    <td
                      key={plan.id}
                      className={`px-6 py-4 text-center font-semibold text-lg ${
                        plan.principal ? 'bg-primary-50 text-gray-500' : ''
                      }`}
                    >
                      <span className="line-through text-gray-500">
                        S/ {plan.precio_regular.toFixed(2)}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* Precio Promocional */}
                <tr className="hover:bg-gray-50 transition-colors bg-gradient-to-r from-success-50 to-transparent">
                  <td className="px-6 py-4 font-bold text-gray-900">Precio en Promoción</td>
                  {planes.map((plan) => (
                    <td
                      key={plan.id}
                      className={`px-6 py-4 text-center font-bold text-2xl text-success-600 ${
                        plan.principal ? 'bg-primary-50' : ''
                      }`}
                    >
                      S/ {plan.precio_promocional.toFixed(2)}
                    </td>
                  ))}
                </tr>

                {/* Ahorro */}
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-900">Ahorro vs Regular</td>
                  {planes.map((plan) => {
                    const ahorro = calcularAhorro(plan.precio_regular, plan.precio_promocional);
                    return (
                      <td
                        key={plan.id}
                        className={`px-6 py-4 text-center font-bold ${
                          plan.principal ? 'bg-primary-50' : ''
                        }`}
                      >
                        <span className="text-danger-600 text-lg">
                          -{ahorro}%
                        </span>
                        <p className="text-xs text-gray-600 mt-1">
                          S/ {(plan.precio_regular - plan.precio_promocional).toFixed(2)}
                        </p>
                      </td>
                    );
                  })}
                </tr>

                {/* Llamadas y SMS */}
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-900">Llamadas y SMS</td>
                  {planes.map((plan) => (
                    <td
                      key={plan.id}
                      className={`px-6 py-4 text-center ${
                        plan.principal ? 'bg-primary-50' : ''
                      }`}
                    >
                      <span className="text-success-600 font-bold">✓ Ilimitados</span>
                    </td>
                  ))}
                </tr>

                {/* Paramount */}
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-900">Paramount Premium</td>
                  {planes.map((plan) => (
                    <td
                      key={plan.id}
                      className={`px-6 py-4 text-center ${
                        plan.principal ? 'bg-primary-50' : ''
                      }`}
                    >
                      <span className="text-success-600 font-bold">✓ 6 meses</span>
                    </td>
                  ))}
                </tr>

                {/* TikTok Bono */}
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-900">Bono 30GB TikTok</td>
                  {planes.map((plan) => (
                    <td
                      key={plan.id}
                      className={`px-6 py-4 text-center ${
                        plan.principal ? 'bg-primary-50' : ''
                      }`}
                    >
                      {plan.id === 1 ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        <span className="text-success-600 font-bold">✓ 6 meses</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Promoción Especial */}
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-gray-900">Promoción Especial</td>
                  {planes.map((plan) => (
                    <td
                      key={plan.id}
                      className={`px-6 py-4 text-center ${
                        plan.principal ? 'bg-primary-50' : ''
                      }`}
                    >
                      {plan.id === 2 ? (
                        <span className="text-danger-600 font-bold">Primer mes S/13.90</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer de la tabla */}
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              📌 <strong>Nota:</strong> Todos los planes incluyen contratación por 12 meses. Los precios mostrados son valores mensuales.
            </p>
          </div>
        </div>
      </div>

      {/* Info Footer */}
      <div className="max-w-7xl mx-auto mt-12 text-center">
        <p className="text-sm text-gray-600">
          Última actualización: Hoy a las {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
