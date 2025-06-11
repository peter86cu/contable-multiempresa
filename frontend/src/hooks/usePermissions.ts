import { useAuth } from '../context/AuthContext';
import { PERMISOS } from '../services/auth0/roles';

/**
 * Hook personalizado para verificar permisos de usuario
 */
export const usePermissions = () => {
  const { hasPermission } = useAuth();

  // Verificar permisos específicos
  const canViewContabilidad = hasPermission(PERMISOS.CONTABILIDAD_READ);
  const canEditContabilidad = hasPermission(PERMISOS.CONTABILIDAD_WRITE);
  const canViewFinanzas = hasPermission(PERMISOS.FINANZAS_READ);
  const canEditFinanzas = hasPermission(PERMISOS.FINANZAS_WRITE);
  const canViewEmpresas = hasPermission(PERMISOS.EMPRESAS_READ);
  const canEditEmpresas = hasPermission(PERMISOS.EMPRESAS_WRITE);
  const canViewUsuarios = hasPermission(PERMISOS.USUARIOS_READ);
  const canEditUsuarios = hasPermission(PERMISOS.USUARIOS_WRITE);
  const isAdmin = hasPermission(PERMISOS.ADMIN_ALL);

  // Verificar permisos para acciones específicas
  const canCreateAsiento = canEditContabilidad;
  const canEditAsiento = canEditContabilidad;
  const canDeleteAsiento = canEditContabilidad;
  
  const canCreateFactura = canEditFinanzas;
  const canEditFactura = canEditFinanzas;
  const canDeleteFactura = canEditFinanzas;
  const canRegisterPayment = canEditFinanzas;
  
  const canCreateEmpresa = canEditEmpresas;
  const canEditEmpresa = canEditEmpresas;
  const canDeleteEmpresa = canEditEmpresas;
  
  const canCreateUsuario = canEditUsuarios;
  const canEditUsuario = canEditUsuarios;
  const canDeleteUsuario = canEditUsuarios;

  // Verificar permiso genérico
  const checkPermission = (permiso: string) => hasPermission(permiso);

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