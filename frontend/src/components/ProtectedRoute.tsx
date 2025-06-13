import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

/**
 * Componente para proteger rutas basado en autenticación y permisos
 * @param children Componentes hijos a renderizar si el usuario está autenticado y tiene permisos
 * @param requiredPermission Permiso requerido para acceder a la ruta
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredPermission 
}) => {
  const { isAuthenticated, isLoading, hasPermission, usuario } = useAuth();
  const location = useLocation();

  // Mostrar indicador de carga mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si se requiere un permiso específico y el usuario no lo tiene, verificar si es admin
  if (requiredPermission) {
    // Si el usuario es admin_empresa o super_admin, siempre permitir acceso
    if (usuario?.rol === 'admin_empresa' || usuario?.rol === 'super_admin') {
      console.log(`✅ ProtectedRoute: Acceso concedido a ${requiredPermission} por rol ${usuario.rol}`);
      return <>{children}</>;
    }
    
    // Si no es admin, verificar el permiso específico
    if (!hasPermission(requiredPermission)) {
      console.log(`❌ ProtectedRoute: Acceso denegado a ${requiredPermission}`);
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8 max-w-md text-center">
            <div className="bg-red-100 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9m3-4V7a3 3 0 00-3-3H6a3 3 0 00-3 3v4a3 3 0 003 3h4a3 3 0 003-3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
            <p className="text-gray-600 mb-6">
              No tienes los permisos necesarios para acceder a esta página.
              Se requiere el permiso: <span className="font-semibold">{requiredPermission}</span>
            </p>
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => window.history.back()}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Volver atrás
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Ir al Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  // Si está autenticado y tiene los permisos necesarios, mostrar los hijos
  return <>{children}</>;
};