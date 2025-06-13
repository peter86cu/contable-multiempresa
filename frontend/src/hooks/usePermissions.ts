import { useAuth } from '../context/AuthContext';
import { PERMISOS } from '../services/auth0/roles';

/**
 * Hook personalizado para verificar permisos de usuario
 */
export const usePermissions = () => {
  const { hasPermission, usuario } = useAuth();
  
  // Verificar si el usuario es administrador
  const isAdmin = usuario?.rol === 'admin_empresa' || usuario?.rol === 'super_admin';

  // Verificar permisos específicos
  const canViewContabilidad = isAdmin || hasPermission(PERMISOS.CONTABILIDAD_READ);
  const canEditContabilidad = isAdmin || hasPermission(PERMISOS.CONTABILIDAD_WRITE);
  const canViewFinanzas = isAdmin || hasPermission(PERMISOS.FINANZAS_READ);
  const canEditFinanzas = isAdmin || hasPermission(PERMISOS.FINANZAS_WRITE);
  const canViewEmpresas = isAdmin || hasPermission(PERMISOS.EMPRESAS_READ);
  const canEditEmpresas = isAdmin || hasPermission(PERMISOS.EMPRESAS_WRITE);
  const canViewUsuarios = isAdmin || hasPermission(PERMISOS.USUARIOS_READ);
  const canEditUsuarios = isAdmin || hasPermission(PERMISOS.USUARIOS_WRITE);
  const hasAdminAll = isAdmin || hasPermission(PERMISOS.ADMIN_ALL);

  // Verificar permisos para acciones específicas
  const canCreateAsiento = isAdmin || canEditContabilidad;
  const canEditAsiento = isAdmin || canEditContabilidad;
  const canDeleteAsiento = isAdmin || canEditContabilidad;
  
  const canCreateFactura = isAdmin || canEditFinanzas;
  const canEditFactura = isAdmin || canEditFinanzas;
  const canDeleteFactura = isAdmin || canEditFinanzas;
  const canRegisterPayment = isAdmin || canEditFinanzas;
  
  const canCreateEmpresa = isAdmin || canEditEmpresas;
  const canEditEmpresa = isAdmin || canEditEmpresas;
  const canDeleteEmpresa = isAdmin || canEditEmpresas;
  
  const canCreateUsuario = isAdmin || canEditUsuarios;
  const canEditUsuario = isAdmin || canEditUsuarios;
  const canDeleteUsuario = isAdmin || canEditUsuarios;

  // Verificar permiso genérico
  const checkPermission = (permiso: string) => isAdmin || hasPermission(permiso);

  return {
    // Permisos básicos
    canViewContabilidad,
    canEditContabilidad,
    canViewFinanzas,
    canEditFinanzas,
    canViewEmpresas,
    canEditEmpresas,
    canViewUsuarios,
    canEditUsuarios,
    isAdmin,
    hasAdminAll,
    
    // Permisos específicos
    canCreateAsiento,
    canEditAsiento,
    canDeleteAsiento,
    canCreateFactura,
    canEditFactura,
    canDeleteFactura,
    canRegisterPayment,
    canCreateEmpresa,
    canEditEmpresa,
    canDeleteEmpresa,
    canCreateUsuario,
    canEditUsuario,
    canDeleteUsuario,
    
    // Función genérica
    checkPermission
  };
};