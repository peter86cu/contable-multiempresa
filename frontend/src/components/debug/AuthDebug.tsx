import React from 'react';
import { useAuth } from '../../context/AuthContext';

export const AuthDebug: React.FC = () => {
  const { user, usuario, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">Cargando información de autenticación...</div>;
  }

  if (!isAuthenticated || !usuario) {
    return <div className="p-4 bg-red-50 border border-red-200 rounded-lg">No autenticado</div>;
  }

  return (
    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
      <h3 className="text-lg font-semibold text-green-800 mb-2">Información de Autenticación</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-green-700 mb-1">Usuario Procesado:</h4>
          <pre className="bg-white p-2 rounded border border-green-200 text-xs overflow-auto max-h-40">
            {JSON.stringify({
              id: usuario.id,
              nombre: usuario.nombre,
              email: usuario.email,
              rol: usuario.rol,
              permisos: usuario.permisos,
              empresasAsignadas: usuario.empresasAsignadas
            }, null, 2)}
          </pre>
        </div>
        
        <div>
          <h4 className="font-medium text-green-700 mb-1">Auth0 User Raw:</h4>
          <pre className="bg-white p-2 rounded border border-green-200 text-xs overflow-auto max-h-40">
            {JSON.stringify({
              sub: user?.sub,
              name: user?.name,
              email: user?.email,
              app_metadata: user?.app_metadata,
              'https://contaempresa.com/rol': user?.['https://contaempresa.com/rol'],
              'https://contaempresa.com/permisos': user?.['https://contaempresa.com/permisos'],
              'https://contaempresa.com/empresas': user?.['https://contaempresa.com/empresas']
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};