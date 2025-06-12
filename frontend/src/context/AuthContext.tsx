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
  hasPermission: (permiso: string) => boolean;
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
  const { 
    user: auth0User, 
    isLoading: auth0Loading, 
    isAuthenticated: auth0Authenticated,
    loginWithRedirect,
    logout: auth0Logout,
    error: auth0Error
  } = useAuth0();
  
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Usar Auth0 para autenticación
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setError(null);
        
        if (auth0Loading) {
          return; // Esperar a que Auth0 termine de cargar
        }
        
        if (auth0Authenticated && auth0User) {
          console.log('✅ Usuario autenticado con Auth0:', auth0User);
          console.log('🔍 Objeto completo del usuario Auth0:', auth0User);
          
          // Obtener permisos y rol desde los metadatos de Auth0
          // Buscar en múltiples ubicaciones posibles
          console.log('🔍 Buscando permisos en:', auth0User);
          
          // Buscar permisos en diferentes ubicaciones
          let permisos = auth0User['https://contaempresa.com/permisos'] || 
                        auth0User.app_metadata?.permisos || 
                        auth0User.user_metadata?.permisos ||
                        auth0User['permisos'];
          
          // Verificar si permisos es un string (puede ocurrir con Auth0)
          if (typeof permisos === 'string') {
            try {
              permisos = JSON.parse(permisos);
            } catch (e) {
              // Si no es un JSON válido, convertirlo a array
              permisos = [permisos];
            }
          }
          
          // Si no se encuentran permisos, usar valor por defecto
          if (!permisos) {
            console.warn('⚠️ No se encontraron permisos, usando valor por defecto: [\'contabilidad:read\']');
            permisos = ['contabilidad:read'];
          }
          
          console.log('🔑 Permisos encontrados:', permisos);
          
          // Buscar rol en diferentes ubicaciones
          let rol = auth0User['https://contaempresa.com/rol'] || 
                   auth0User.app_metadata?.rol || 
                   auth0User.user_metadata?.rol ||
                   auth0User['rol'];
          
          // Si no se encuentra rol, usar valor por defecto
          if (!rol) {
            console.warn('⚠️ No se encontró rol, usando valor por defecto: usuario');
            rol = 'usuario';
          }
          
          console.log('👤 Rol encontrado:', rol);
          
          // Buscar empresas asignadas en diferentes ubicaciones
          let empresasAsignadas = auth0User['https://contaempresa.com/empresas'] || 
                                 auth0User.app_metadata?.empresas || 
                                 auth0User.user_metadata?.empresas ||
                                 auth0User['empresas'];
          
          // Verificar si empresasAsignadas es un string (puede ocurrir con Auth0)
          if (typeof empresasAsignadas === 'string') {
            try {
              empresasAsignadas = JSON.parse(empresasAsignadas);
            } catch (e) {
              // Si no es un JSON válido, convertirlo a array
              empresasAsignadas = [empresasAsignadas];
            }
          }
          
          // Si no se encuentran empresas asignadas, usar valor por defecto
          if (!empresasAsignadas) {
            console.warn('⚠️ No se encontraron empresas asignadas, usando valor por defecto: [\'dev-empresa-pe\', \'dev-empresa-co\', \'dev-empresa-mx\']');
            empresasAsignadas = ['dev-empresa-pe', 'dev-empresa-co', 'dev-empresa-mx'];
          }
          
          console.log('🏢 Empresas asignadas encontradas:', empresasAsignadas);
          
          // Crear usuario a partir de datos de Auth0
          const userFromAuth0: Usuario = {
            id: auth0User.sub,
            nombre: auth0User.name || 'Usuario',
            email: auth0User.email || '',
            rol: rol as any,
            empresasAsignadas: empresasAsignadas,
            permisos: permisos,
            avatar: auth0User.picture,
            paisId: auth0User['https://contaempresa.com/pais'] || 'peru',
            auth0Id: auth0User.sub,
            activo: true,
            fechaCreacion: new Date(),
            configuracion: {
              idioma: 'es',
              timezone: 'America/Lima',
              formatoFecha: 'DD/MM/YYYY',
              formatoMoneda: 'es-PE'
            }
          };
          
          console.log('👤 Usuario procesado:', userFromAuth0);
          console.log('🔑 Permisos del usuario:', userFromAuth0.permisos);
          setUsuario(userFromAuth0);
        } else if (!auth0Loading && !auth0Authenticated) {
          // Si no está autenticado y Auth0 ya terminó de cargar, limpiar usuario
          console.log('⚠️ No autenticado con Auth0');
          setUsuario(null);
        }
      } catch (error) {
        console.error('Error inicializando autenticación:', error);
        setError('Error inicializando la aplicación');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [auth0User, auth0Loading, auth0Authenticated, auth0Error]);

  const login = () => {
    // Usar Auth0 para login
    loginWithRedirect();
  };

  const logout = () => {
    // Usar Auth0 para logout
    auth0Logout({ 
      logoutParams: {
        returnTo: window.location.origin 
      }
    });
    setUsuario(null);
    setError(null);
  };

  const hasAccess = (empresaId: string): boolean => {
    if (!usuario) return false;
    return usuario.empresasAsignadas.includes(empresaId);
  };

  // Método para verificar permisos
  const hasPermission = (permiso: string): boolean => {
    if (!usuario) {
      console.log(`❌ Sin usuario autenticado, permiso ${permiso} denegado`);
      return false;
    }
    
    // Si tiene admin:all, tiene todos los permisos
    if (usuario.permisos.includes('admin:all')) {
      console.log(`🔍 Verificando permiso ${permiso}: ✅ Sí (tiene admin:all)`);
      console.log(`🔑 Permisos disponibles: ${usuario.permisos.join(', ')}`);
      return true;
    }
    
    // Verificar si tiene el permiso específico
    const tienePermiso = usuario.permisos.includes(permiso);
    console.log(`🔍 Verificando permiso ${permiso}: ${tienePermiso ? '✅ Sí' : '❌ No'}`);
    console.log(`🔑 Permisos disponibles: ${usuario.permisos.join(', ')}`);
    return tienePermiso;
  };

  return (
    <AuthContext.Provider value={{
      user: auth0User,
      usuario,
      isLoading: isLoading || auth0Loading,
      isAuthenticated: auth0Authenticated,
      login,
      logout,
      hasAccess,
      hasPermission,
      error: error || (auth0Error ? auth0Error.message : null)
    }}>
      {children}
    </AuthContext.Provider>
  );
};