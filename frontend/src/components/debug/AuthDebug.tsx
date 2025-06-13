import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAuth0 } from '@auth0/auth0-react';
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { AuthDebugToken } from './AuthDebugToken';

export const AuthDebug: React.FC = () => {
  const { user, usuario, isLoading, isAuthenticated } = useAuth();
  const { getAccessTokenSilently, loginWithRedirect, logout } = useAuth0();
  const [expanded, setExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefreshToken = async () => {
    setRefreshing(true);
    try {
      // Force a token refresh
      await getAccessTokenSilently({ ignoreCache: true });
      // Reload the page to get fresh tokens
      window.location.reload();
    } catch (error) {
      console.error('Error refreshing token:', error);
      setRefreshing(false);
    }
  };

  if (import.meta.env.PROD) {
    return null; // Don't show in production
  }

  if (isLoading) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
        <p className="text-blue-800">Cargando información de autenticación...</p>
      </div>
    );
  }

  if (!isAuthenticated || !usuario) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
        <p className="text-red-800 mb-2">No autenticado</p>
        <button 
          onClick={() => loginWithRedirect()}
          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
        >
          Iniciar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg mb-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          🔐 Auth Debug Panel
          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
            {usuario.rol}
          </span>
        </h3>
        <div className="flex gap-2">
          <button 
            onClick={handleRefreshToken}
            disabled={refreshing}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center gap-1"
          >
            {refreshing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            Refresh Token
          </button>
          <button 
            onClick={() => setExpanded(!expanded)}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm flex items-center gap-1"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? 'Hide Details' : 'Show Details'}
          </button>
          <button 
            onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
          >
            Logout
          </button>
        </div>
      </div>
      
      {expanded && (
        <div className="mt-4 space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Usuario Procesado:</h4>
            <pre className="bg-white p-2 rounded border border-gray-200 text-xs overflow-auto max-h-40">
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
            <h4 className="text-sm font-medium text-gray-700 mb-1">Auth0 User Raw:</h4>
            <pre className="bg-white p-2 rounded border border-gray-200 text-xs overflow-auto max-h-40">
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
          
          <AuthDebugToken />
        </div>
      )}
    </div>
  );
};