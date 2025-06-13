import React from 'react';
import { useAuth } from '../context/AuthContext';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermission: string;
  fallback?: React.ReactNode;
}

/**
 * Componente para mostrar contenido condicionalmente basado en permisos
 * @param children Contenido a mostrar si el usuario tiene el permiso requerido
 * @param requiredPermission Permiso requerido para mostrar el contenido
 * @param fallback Contenido alternativo a mostrar si el usuario no tiene el permiso
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  children, 
  requiredPermission,
  fallback = null
}) => {
  const { hasPermission, usuario } = useAuth();
  
  // Si el usuario es admin_empresa o super_admin, siempre mostrar el contenido
  if (usuario?.rol === 'admin_empresa' || usuario?.rol === 'super_admin') {
    console.log(`✅ PermissionGuard: Acceso concedido a ${requiredPermission} por rol ${usuario.rol}`);
    return <>{children}</>;
  }
  
  // Si el usuario tiene el permiso, mostrar el contenido
  if (hasPermission(requiredPermission)) {
    console.log(`✅ PermissionGuard: Acceso concedido a ${requiredPermission} por permiso`);
    return <>{children}</>;
  }
  
  // Si no tiene el permiso, mostrar el contenido alternativo
  console.log(`❌ PermissionGuard: Acceso denegado a ${requiredPermission}`);
  return <>{fallback}</>;
};