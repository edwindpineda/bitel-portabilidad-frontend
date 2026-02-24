import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-8xl font-bold text-primary-600 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Página no encontrada
          </h2>
          <p className="text-gray-600">
            La página que estás buscando no existe o ha sido movida.
          </p>
        </div>
        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="block w-full px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-colors"
          >
            Ir al Dashboard
          </Link>
          <Link
            href="/login"
            className="block w-full px-6 py-3 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 active:bg-gray-400 transition-colors"
          >
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
