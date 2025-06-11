import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Usuario } from '../types';
import { FirebaseAuthService } from '../config/firebaseAuth';

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
  const { user, isLoading: auth0Loading, isAuthenticated: auth0Authenticated, loginWithRedirect, logout: auth0Logout, error: auth0Error } = useAuth0();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Inicializar autenticación cuando cambia el estado de Auth0
    const initializeAuth = async () => {
      try {
        setError(null);
        
        // Si estamos en Auth0 y autenticados, usar esos datos
        if (auth0Authenticated && user) {
          console.log('🔐 Usuario autenticado con Auth0:', user);
          
          // Inicializar Firebase Auth
          await FirebaseAuthService.ensureAuthenticated();
          
          // Crear usuario mock basado en datos de Auth0
          const mockUser: Usuario = {
            id: user.sub || 'auth0-user',
            nombre: user.name || 'Usuario Auth0',
            email: user.email || 'auth0@example.com',
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
        } else if (import.meta.env.DEV) {
          // En desarrollo, crear usuario mock si no hay Auth0
          console.log('🔄 Modo desarrollo - Creando usuario mock');
          
          // Simular tiempo de carga
          await new Promise(resolve => setTimeout(resolve, 500));
          
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
        } else {
          // Si no estamos autenticados y no estamos en desarrollo, no hay usuario
          setUsuario(null);
        }
      } catch (error) {
        console.error('Error inicializando autenticación:', error);
        setError('Error inicializando la aplicación');
      } finally {
        setIsLoading(false);
      }
    };

    // Solo inicializar cuando Auth0 termine de cargar
    if (!auth0Loading) {
      initializeAuth();
    }
  }, [auth0Loading, auth0Authenticated, user]);

  // Manejar errores de Auth0
  useEffect(() => {
    if (auth0Error) {
      console.error('Error de Auth0:', auth0Error);
      setError(`Error de autenticación: ${auth0Error.message}`);
    }
  }, [auth0Error]);

  const login = () => {
    if (auth0Authenticated) {
      console.log('Ya estás autenticado con Auth0');
      return;
    }
    
    try {
      loginWithRedirect();
    } catch (error) {
      console.error('Error en login:', error);
      setError('Error al iniciar sesión');
    }
  };

  const logout = () => {
    setUsuario(null);
    setError(null);
    
    if (auth0Authenticated) {
      auth0Logout({ 
        logoutParams: { 
          returnTo: window.location.origin 
        } 
      });
    } else {
      // En desarrollo, simplemente recargar la página
      window.location.reload();
    }
  };

  const hasAccess = (empresaId: string): boolean => {
    if (!usuario) return false;
    return usuario.empresasAsignadas.includes(empresaId);
  };

  // Mock user object para compatibilidad
  const mockAuth0User = {
    sub: usuario?.id || 'dev-user-123',
    name: usuario?.nombre || 'Usuario de Desarrollo',
    email: usuario?.email || 'dev@contaempresa.com',
    picture: usuario?.avatar || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150'
  };

  return (
    <AuthContext.Provider value={{
      user: user || mockAuth0User,
      usuario,
      isLoading: isLoading || auth0Loading,
      isAuthenticated: !!usuario || auth0Authenticated,
      login,
      logout,
      hasAccess,
      error
    }}>
      {children}
    </AuthContext.Provider>
  );
};