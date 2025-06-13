import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Usuario } from '../types';
import { PERMISOS, PERMISOS_POR_ROL } from '../services/auth0/roles';

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
          
          // SOLUCIÓN: Acceder directamente a app_metadata
          console.log('🔍 Buscando metadatos en:', auth0User);
          
          // Imprimir el objeto completo para depuración
          console.log('DEBUG - Auth0 User Object:', JSON.stringify(auth0User, null, 2));
          
          // SOLUCIÓN DIRECTA: Acceder directamente a app_metadata
          let rol = 'usuario'; // Valor por defecto
          
          // Verificar si app_metadata existe y tiene rol
          if (auth0User.app_metadata && auth0User.app_metadata.rol) {
            rol = auth0User.app_metadata.rol;
            console.log('👤 Rol encontrado en app_metadata:', rol);
          } else {
            console.log('⚠️ No se encontró rol en app_metadata, buscando en otras ubicaciones');
            // Buscar en otras ubicaciones
            rol = auth0User['https://contaempresa.com/rol'] || 
                  auth0User.user_metadata?.rol ||
                  auth0User['rol'] ||
                  'usuario';
          }
          
          console.log('👤 Rol encontrado:', rol);
          
          // Verificar si app_metadata existe y tiene permisos
          let permisos: string[] = [];
          if (auth0User.app_metadata && auth0User.app_metadata.permisos) {
            permisos = auth0User.app_metadata.permisos;
            console.log('🔑 Permisos encontrados en app_metadata:', permisos);
          } else {
            console.log('⚠️ No se encontraron permisos en app_metadata, buscando en otras ubicaciones');
            // Si no, buscar en otras ubicaciones
            if (auth0User['https://contaempresa.com/permisos']) {
              permisos = auth0User['https://contaempresa.com/permisos'];
            }
            else if (auth0User.user_metadata?.permisos) {
              permisos = auth0User.user_metadata.permisos;
            }
            else if (auth0User['permisos']) {
              permisos = auth0User['permisos'];
            }
          }
          
          console.log('🔑 Permisos encontrados:', permisos);
          
          // IMPORTANTE: Si el rol es admin_empresa o super_admin y no tiene admin:all, agregarlo
          if ((rol === 'admin_empresa' || rol === 'super_admin') && !permisos.includes('admin:all')) {
            permisos.push('admin:all');
            console.log('🔑 Agregado admin:all por rol de administrador');
          }
          
          // Si no hay permisos y el rol es conocido, asignar permisos por defecto según el rol
          if (permisos.length === 0) {
            permisos = PERMISOS_POR_ROL[rol as keyof typeof PERMISOS_POR_ROL] || [];
            console.log('🔑 Asignados permisos por defecto según rol:', permisos);
          }
          
          // Buscar empresas asignadas
          let empresasAsignadas: string[] = [];
          if (auth0User.app_metadata && auth0User.app_metadata.empresas) {
            empresasAsignadas = auth0User.app_metadata.empresas;
            console.log('🏢 Empresas asignadas encontradas en app_metadata:', empresasAsignadas);
          } else {
            empresasAsignadas = auth0User['https://contaempresa.com/empresas'] || 
                               auth0User.user_metadata?.empresas ||
                               auth0User['empresas'] ||
                               ['dev-empresa-pe', 'dev-empresa-co', 'dev-empresa-mx'];
            console.log('🏢 Empresas asignadas encontradas en otras ubicaciones:', empresasAsignadas);
          }
          
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
          console.log('👤 Rol final del usuario:', userFromAuth0.rol);
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
    loginWithRedirect({
      appState: { returnTo: window.location.pathname }
    });
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
    
    // Si el usuario es admin, tiene acceso a todas las empresas
    if (usuario.rol === 'super_admin' || usuario.rol === 'admin_empresa') {
      return true;
    }
    
    return usuario.empresasAsignadas.includes(empresaId);
  };

  // Método para verificar permisos
  const hasPermission = (permiso: string): boolean => {
    if (!usuario) {
      console.log(`❌ Sin usuario autenticado, permiso ${permiso} denegado`);
      return false;
    }
    
    // SOLUCIÓN DIRECTA: Verificar rol explícitamente
    if (usuario.rol === 'super_admin' || usuario.rol === 'admin_empresa') {
      console.log(`✅ Permiso ${permiso} concedido por rol ${usuario.rol}`);
      return true;
    }
    
    // Si tiene admin:all, tiene todos los permisos
    if (usuario.permisos.includes('admin:all')) {
      console.log(`✅ Permiso ${permiso} concedido por admin:all`);
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