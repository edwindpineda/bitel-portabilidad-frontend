import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-50 via-background to-primary-100">
      <div className="w-full max-w-md mx-auto p-8">
        {/* Card principal */}
        <div className="bg-white rounded-2xl shadow-card-hover p-8 text-center">

          {/* Logo/Icono */}
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)' }}>
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>

          {/* Título y descripción */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-500 bg-clip-text text-transparent mb-2">
              AI-YOU
            </h1>
            <p className="text-lg text-primary-600 font-semibold mb-3">
              CRM Inteligente
            </p>
            <p className="text-gray-600">
              Sistema inteligente de gestión de leads y ventas con IA
            </p>
          </div>

          {/* Botón de acción */}
          <div>
            <Link
              href="/login"
              className="block w-full px-6 py-3.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Iniciar Sesión
            </Link>
          </div>
        </div>

        {/* Copyright */}
        <p className="text-center text-sm text-gray-600 mt-6">
          © 2025 AIYOU CRM. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
