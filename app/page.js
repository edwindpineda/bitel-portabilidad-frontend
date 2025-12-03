import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-50 via-background to-primary-100">
      <div className="w-full max-w-md mx-auto p-8">
        {/* Card principal */}
        <div className="bg-white rounded-2xl shadow-card-hover p-8 text-center">

          {/* Logo/Icono */}
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>

          {/* Título y descripción */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              CRM Bitel
            </h1>
            <p className="text-lg text-primary-600 font-semibold mb-3">
              Portabilidad
            </p>
            <p className="text-gray-600">
              Sistema de gestión de leads y ventas para portabilidad
            </p>
          </div>

          {/* Botones de acción */}
          <div className="space-y-3">
            <Link
              href="/login"
              className="block w-full px-6 py-3.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Iniciar Sesión
            </Link>

            {/* Acceso directo sin autenticación */}
            <Link
              href="/dashboard"
              className="block w-full px-6 py-3.5 bg-gradient-to-r from-success-500 to-success-600 text-white font-semibold rounded-lg hover:from-success-600 hover:to-success-700 active:from-success-700 active:to-success-800 transition-all duration-200 shadow-md hover:shadow-lg border-2 border-success-400"
            >
              🚀 Acceso Directo al CRM
            </Link>
            <p className="text-xs text-gray-500 italic">
              (Saltear verificación - Modo desarrollo)
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              ¿Necesitas ayuda?{' '}
              <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                Contáctanos
              </a>
            </p>
          </div>
        </div>

        {/* Copyright */}
        <p className="text-center text-sm text-gray-600 mt-6">
          © 2024 Bitel CRM. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
