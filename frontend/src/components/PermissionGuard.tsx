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
  const { hasPermission } = useAuth();
  
  // Si el usuario tiene el permiso, mostrar el contenido
  if (hasPermission(requiredPermission)) {
    return <>{children}</>;
  }
  
  // Si no tiene el permiso, mostrar el contenido alternativo
  return <>{fallback}</>;
};