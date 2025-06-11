import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Usuario } from '../types';

interface AuthContextType {
  user: any;
  usuario: Usuario | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  hasAccess: (empresaId: string) => boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated: auth0IsAuthenticated, isLoading: auth0IsLoading, loginWithRedirect, logout: auth0Logout, error: auth0Error } = useAuth0();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Inicializar autenticación
    const initializeAuth = async () => {
      try {
        setError(null);
        
        // Si estamos en desarrollo y no hay usuario de Auth0, crear usuario mock
        if (import.meta.env.DEV && !auth0IsAuthenticated && !auth0IsLoading) {
          console.log('🔧 Modo desarrollo: Creando usuario mock');
          
          // Crear usuario mock para desarrollo con múltiples empresas
          const mockUser: Usuario = {
            id: 'dev-user-123',
            nombre: 'Usuario de Desarrollo',
            email: 'dev@contaempresa.com',
            rol: 'super_admin', // Super admin para acceso completo
            empresasAsignadas: ['dev-empresa-pe', 'dev-empresa-co', 'dev-empresa-mx'],
            permisos: ['admin:all'],
            paisId: 'peru',
            activo: true,
            fechaCreacion: new Date(),
            configuracion: {
              idioma: 'es',
              timezone: 'America/Lima',
              formatoFecha: 'DD/MM/YYYY',
              formatoMoneda: 'es-PE'
            }
          };
          
          setUsuario(mockUser);
          setIsLoading(false);
          return;
        }
        
        // Si hay un usuario autenticado en Auth0, usarlo
        if (auth0IsAuthenticated && user) {
          console.log('🔐 Usuario autenticado en Auth0:', user.email);
          
          // Convertir usuario de Auth0 a nuestro formato
          const userFromAuth0: Usuario = {
            id: user.sub,
            nombre: user.name || 'Usuario',
            email: user.email,
            rol: user.rol || 'usuario',
            empresasAsignadas: user.empresasAsignadas || [],
            permisos: user.permisos || [],
            paisId: user.paisId || 'peru',
            auth0Id: user.sub,
            activo: true,
            fechaCreacion: new Date(),
            avatar: user.picture,
            configuracion: {
              idioma: 'es',
              timezone: 'America/Lima',
              formatoFecha: 'DD/MM/YYYY',
              formatoMoneda: 'es-PE'
            }
          };
          
          setUsuario(userFromAuth0);
        }
      } catch (error) {
        console.error('Error inicializando autenticación:', error);
        setError('Error inicializando la aplicación');
      } finally {
        setIsLoading(false);
      }
    };

    if (!auth0IsLoading) {
      initializeAuth();
    }
  }, [auth0IsAuthenticated, auth0IsLoading, user]);

  // Manejar errores de Auth0
  useEffect(() => {
    if (auth0Error) {
      console.error('Error de Auth0:', auth0Error);
      setError(auth0Error.message || 'Error de autenticación');
    }
  }, [auth0Error]);

  const login = () => {
    if (import.meta.env.DEV) {
      // En modo desarrollo, simplemente marcar como autenticado
      console.log('Login simulado - ya estás autenticado en modo desarrollo');
    } else {
      // En producción, redirigir a Auth0
      loginWithRedirect();
    }
  };

  const logout = () => {
    if (import.meta.env.DEV) {
      setUsuario(null);
      setError(null);
      // En desarrollo, podrías recargar la página o resetear el estado
      window.location.reload();
    } else {
      // En producción, cerrar sesión en Auth0
      auth0Logout({ 
        logoutParams: {
          returnTo: window.location.origin 
        }
      });
    }
  };

  const hasAccess = (empresaId: string): boolean => {
    if (!usuario) return false;
    return usuario.empresasAsignadas.includes(empresaId);
  };

  return (
    <AuthContext.Provider value={{
      user: user || usuario,
      usuario,
      isLoading: isLoading || auth0IsLoading,
      isAuthenticated: auth0IsAuthenticated || (import.meta.env.DEV && !!usuario),
      login,
      logout,
      hasAccess,
      error
    }}>
      {children}
    </AuthContext.Provider>
  );
};