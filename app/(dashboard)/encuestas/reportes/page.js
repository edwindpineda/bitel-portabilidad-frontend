'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

// Componente de grafico de torta SVG
const PieChart = ({ data, title, colors }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">{title}</h3>
        <div className="flex items-center justify-center h-48 text-gray-500">
          Sin datos
        </div>
      </div>
    );
  }

  let currentAngle = 0;
  const slices = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    // Calcular coordenadas del arco
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);
    const x1 = 50 + 40 * Math.cos(startRad);
    const y1 = 50 + 40 * Math.sin(startRad);
    const x2 = 50 + 40 * Math.cos(endRad);
    const y2 = 50 + 40 * Math.sin(endRad);
    const largeArc = angle > 180 ? 1 : 0;

    // Path del slice
    const path = angle >= 360
      ? `M 50 10 A 40 40 0 1 1 49.99 10 Z`
      : `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return {
      ...item,
      percentage,
      path,
      color: colors[index % colors.length]
    };
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">{title}</h3>
      <div className="flex flex-col md:flex-row items-center justify-center gap-4">
        <svg viewBox="0 0 100 100" className="w-48 h-48">
          {slices.map((slice, index) => (
            <path
              key={index}
              d={slice.path}
              fill={slice.color}
              stroke="white"
              strokeWidth="0.5"
            />
          ))}
        </svg>
        <div className="flex flex-col gap-2">
          {slices.map((slice, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: slice.color }}
              />
              <span className="text-gray-700">
                {slice.label}: {slice.value} ({slice.percentage.toFixed(1)}%)
              </span>
            </div>
          ))}
          <div className="mt-2 pt-2 border-t border-gray-200 text-sm font-semibold text-gray-900">
            Total: {total}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ReportesPage() {
  const [encuestas, setEncuestas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departamentos, setDepartamentos] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [filtros, setFiltros] = useState({ departamento: '', municipio: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [encuestasRes, departamentosRes] = await Promise.all([
          apiClient.get('/crm/tools/encuesta'),
          apiClient.get('/crm/tools/encuesta/departamentos')
        ]);
        setEncuestas(encuestasRes?.data?.encuestas || []);
        setDepartamentos(departamentosRes?.data || []);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        toast.error('Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Cargar municipios cuando cambia el departamento
  useEffect(() => {
    const fetchMunicipios = async () => {
      try {
        const url = filtros.departamento
          ? `/crm/tools/encuesta/municipios?departamento=${encodeURIComponent(filtros.departamento)}`
          : '/crm/tools/encuesta/municipios';
        const response = await apiClient.get(url);
        setMunicipios(response?.data || []);
      } catch (error) {
        console.error('Error al cargar municipios:', error);
      }
    };
    fetchMunicipios();
  }, [filtros.departamento]);

  // Filtrar encuestas
  const encuestasFiltradas = encuestas.filter(e => {
    if (filtros.departamento && e.departamento !== filtros.departamento) return false;
    if (filtros.municipio && e.municipio !== filtros.municipio) return false;
    return true;
  });

  const handleFiltroChange = (campo, valor) => {
    if (campo === 'departamento') {
      setFiltros({ departamento: valor, municipio: '' });
    } else {
      setFiltros(prev => ({ ...prev, [campo]: valor }));
    }
  };

  // Funcion para agrupar datos (usa encuestas filtradas)
  const agruparDatos = (campo) => {
    const grupos = {};
    encuestasFiltradas.forEach(e => {
      let valor = e[campo] || 'Sin respuesta';
      // Limpiar codigos como "1: Valor"
      valor = String(valor).replace(/^\d+:\s*/, '').trim();
      if (!valor) valor = 'Sin respuesta';
      grupos[valor] = (grupos[valor] || 0) + 1;
    });
    return Object.entries(grupos)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  };

  // Colores para los graficos
  const coloresParticipacion = ['#10B981', '#EF4444', '#6B7280'];
  const coloresPiensaVotar = ['#3B82F6', '#EF4444', '#F59E0B', '#6B7280'];
  const coloresIntencion = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6B7280'];
  const coloresSabeVotar = ['#10B981', '#EF4444', '#6B7280'];
  const coloresRefuerzo = ['#3B82F6', '#F59E0B', '#10B981', '#6B7280'];
  const coloresConoce = ['#10B981', '#EF4444', '#6B7280'];
  const coloresAutoriza = ['#10B981', '#EF4444', '#6B7280'];

  // Datos para los graficos
  const dataParticipacion = agruparDatos('participacion');
  const dataPiensaVotar = agruparDatos('p1_piensa_votar');
  const dataIntencion = agruparDatos('p2_intencion_voto');
  const dataSabeVotar = agruparDatos('p3a_sabe_como_votar');
  const dataRefuerzo = agruparDatos('p3a_refuerzo_pedagogico');
  const dataConoce = agruparDatos('p3b_conoce_candidato');
  const dataAutoriza = agruparDatos('p4_autoriza_whatsapp');

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-4">
        <nav className="flex items-center space-x-2 text-sm text-gray-500">
          <Link href="/encuestas" className="hover:text-gray-700">Encuestas</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">Reportes</span>
        </nav>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes de Encuestas</h1>
          <p className="text-gray-600 mt-1">Graficos y estadisticas de las respuestas</p>
        </div>
        <div className="text-sm text-gray-500">
          Mostrando: <span className="font-bold text-gray-900">{encuestasFiltradas.length}</span> de {encuestas.length} encuestas
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
            <select
              value={filtros.departamento}
              onChange={(e) => handleFiltroChange('departamento', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Todos los departamentos</option>
              {departamentos.map((depto, idx) => (
                <option key={idx} value={depto}>{depto}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Municipio</label>
            <select
              value={filtros.municipio}
              onChange={(e) => handleFiltroChange('municipio', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Todos los municipios</option>
              {municipios.map((muni, idx) => (
                <option key={idx} value={muni}>{muni}</option>
              ))}
            </select>
          </div>
          {(filtros.departamento || filtros.municipio) && (
            <button
              onClick={() => setFiltros({ departamento: '', municipio: '' })}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Participacion */}
          <PieChart
            data={dataParticipacion}
            title="Participacion en Encuesta"
            colors={coloresParticipacion}
          />

          {/* Piensa Votar */}
          <PieChart
            data={dataPiensaVotar}
            title="P1: Piensa Votar"
            colors={coloresPiensaVotar}
          />

          {/* Intencion de Voto */}
          <PieChart
            data={dataIntencion}
            title="P2: Intencion de Voto"
            colors={coloresIntencion}
          />

          {/* Sabe como votar */}
          <PieChart
            data={dataSabeVotar}
            title="P3a: Sabe Como Votar"
            colors={coloresSabeVotar}
          />

          {/* Refuerzo pedagogico */}
          <PieChart
            data={dataRefuerzo}
            title="P3a: Refuerzo Pedagogico"
            colors={coloresRefuerzo}
          />

          {/* Conoce al candidato */}
          <PieChart
            data={dataConoce}
            title="P3b: Conoce al Candidato"
            colors={coloresConoce}
          />

          {/* Autoriza WhatsApp */}
          <PieChart
            data={dataAutoriza}
            title="P4: Autoriza mensaje WhatsApp"
            colors={coloresAutoriza}
          />
        </div>
      )}
    </div>
  );
}
