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
          let permisos = [];
          
          // Primero buscar en user_metadata (tiene prioridad)
          if (auth0User.user_metadata && auth0User.user_metadata.permisos) {
            permisos = auth0User.user_metadata.permisos;
            console.log('🔑 Permisos encontrados en user_metadata:', permisos);
          } 
          // Luego buscar en app_metadata
          else if (auth0User.app_metadata && auth0User.app_metadata.permisos) {
            permisos = auth0User.app_metadata.permisos;
            console.log('🔑 Permisos encontrados en app_metadata:', permisos);
          }
          // Luego buscar en namespaces personalizados
          else if (auth0User['https://contaempresa.com/permisos']) {
            permisos = auth0User['https://contaempresa.com/permisos'];
            console.log('🔑 Permisos encontrados en namespace personalizado:', permisos);
          }
          // Finalmente, buscar directamente en el objeto
          else if (auth0User['permisos']) {
            permisos = auth0User['permisos'];
            console.log('🔑 Permisos encontrados directamente en el objeto:', permisos);
          }
          // Si no se encuentra, usar valor por defecto
          else {
            permisos = ['contabilidad:read'];
            console.log('⚠️ No se encontraron permisos, usando valor por defecto:', permisos);
          }
          
          console.log('🔑 Permisos encontrados:', permisos);
          
          // Buscar rol en diferentes ubicaciones
          let rol;
          
          // Primero buscar en user_metadata (tiene prioridad)
          if (auth0User.user_metadata && auth0User.user_metadata.rol) {
            rol = auth0User.user_metadata.rol;
            console.log('👤 Rol encontrado en user_metadata:', rol);
          }
          // Luego buscar en app_metadata
          else if (auth0User.app_metadata && auth0User.app_metadata.rol) {
            rol = auth0User.app_metadata.rol;
            console.log('👤 Rol encontrado en app_metadata:', rol);
          }
          // Luego buscar en namespaces personalizados
          else if (auth0User['https://contaempresa.com/rol']) {
            rol = auth0User['https://contaempresa.com/rol'];
            console.log('👤 Rol encontrado en namespace personalizado:', rol);
          }
          // Finalmente, buscar directamente en el objeto
          else if (auth0User['rol']) {
            rol = auth0User['rol'];
            console.log('👤 Rol encontrado directamente en el objeto:', rol);
          }
          // Si no se encuentra, usar valor por defecto
          else {
            rol = 'usuario';
            console.log('⚠️ No se encontró rol, usando valor por defecto:', rol);
          }
          
          console.log('👤 Rol encontrado:', rol);
          
          // Buscar empresas asignadas en diferentes ubicaciones
          let empresasAsignadas;
          
          // Primero buscar en user_metadata (tiene prioridad)
          if (auth0User.user_metadata && auth0User.user_metadata.empresas) {
            empresasAsignadas = auth0User.user_metadata.empresas;
            console.log('🏢 Empresas asignadas encontradas en user_metadata:', empresasAsignadas);
          }
          // Luego buscar en app_metadata
          else if (auth0User.app_metadata && auth0User.app_metadata.empresas) {
            empresasAsignadas = auth0User.app_metadata.empresas;
            console.log('🏢 Empresas asignadas encontradas en app_metadata:', empresasAsignadas);
          }
          // Luego buscar en namespaces personalizados
          else if (auth0User['https://contaempresa.com/empresas']) {
            empresasAsignadas = auth0User['https://contaempresa.com/empresas'];
            console.log('🏢 Empresas asignadas encontradas en namespace personalizado:', empresasAsignadas);
          }
          // Finalmente, buscar directamente en el objeto
          else if (auth0User['empresas']) {
            empresasAsignadas = auth0User['empresas'];
            console.log('🏢 Empresas asignadas encontradas directamente en el objeto:', empresasAsignadas);
          }
          // Si no se encuentra, usar valor por defecto
          else {
            empresasAsignadas = ['dev-empresa-pe', 'dev-empresa-co', 'dev-empresa-mx'];
            console.log('⚠️ No se encontraron empresas asignadas, usando valor por defecto:', empresasAsignadas);
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
      console.log(`🔍 Verificando permiso ${permiso}: ✅ Sí (por admin:all)`);
      console.log(`🔑 Permisos disponibles: admin:all`);
      return true;
    }
    
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