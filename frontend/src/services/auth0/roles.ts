/**
 * Servicio para gestionar roles y permisos de Auth0
 */

// Definición de roles disponibles en el sistema
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN_EMPRESA: 'admin_empresa',
  CONTADOR: 'contador',
  USUARIO: 'usuario'
};

// Definición de permisos disponibles en el sistema
export const PERMISOS = {
  // Permisos administrativos
  ADMIN_ALL: 'admin:all',
  
  // Permisos de empresas
  EMPRESAS_READ: 'empresas:read',
  EMPRESAS_WRITE: 'empresas:write',
  
  // Permisos de contabilidad
  CONTABILIDAD_READ: 'contabilidad:read',
  CONTABILIDAD_WRITE: 'contabilidad:write',
  
  // Permisos de finanzas
  FINANZAS_READ: 'finanzas:read',
  FINANZAS_WRITE: 'finanzas:write',
  
  // Permisos de usuarios
  USUARIOS_READ: 'usuarios:read',
  USUARIOS_WRITE: 'usuarios:write'
};

// Mapeo de roles a permisos por defecto
export const PERMISOS_POR_ROL = {
  [ROLES.SUPER_ADMIN]: [
    PERMISOS.ADMIN_ALL,
    PERMISOS.EMPRESAS_READ,
    PERMISOS.EMPRESAS_WRITE,
    PERMISOS.CONTABILIDAD_READ,
    PERMISOS.CONTABILIDAD_WRITE,
    PERMISOS.FINANZAS_READ,
    PERMISOS.FINANZAS_WRITE,
    PERMISOS.USUARIOS_READ,
    PERMISOS.USUARIOS_WRITE
  ],
  [ROLES.ADMIN_EMPRESA]: [
    PERMISOS.ADMIN_ALL,  // Aseguramos que admin_empresa siempre tenga admin:all
    PERMISOS.EMPRESAS_READ,
    PERMISOS.EMPRESAS_WRITE,
    PERMISOS.CONTABILIDAD_READ,
    PERMISOS.CONTABILIDAD_WRITE,
    PERMISOS.FINANZAS_READ,
    PERMISOS.FINANZAS_WRITE,
    PERMISOS.USUARIOS_READ,
    PERMISOS.USUARIOS_WRITE
  ],
  [ROLES.CONTADOR]: [
    PERMISOS.EMPRESAS_READ,
    PERMISOS.CONTABILIDAD_READ,
    PERMISOS.CONTABILIDAD_WRITE,
    PERMISOS.FINANZAS_READ,
    PERMISOS.FINANZAS_WRITE
  ],
  [ROLES.USUARIO]: [
    PERMISOS.EMPRESAS_READ,
    PERMISOS.CONTABILIDAD_READ,
    PERMISOS.FINANZAS_READ
  ]
};

// Descripción de roles para la interfaz de usuario
export const ROLES_DESCRIPCION = {
  [ROLES.SUPER_ADMIN]: 'Acceso completo al sistema',
  [ROLES.ADMIN_EMPRESA]: 'Administrador de empresa',
  [ROLES.CONTADOR]: 'Acceso a funciones contables',
  [ROLES.USUARIO]: 'Acceso básico al sistema'
};

// Descripción de permisos para la interfaz de usuario
export const PERMISOS_DESCRIPCION = {
  [PERMISOS.ADMIN_ALL]: 'Administración Total',
  [PERMISOS.EMPRESAS_READ]: 'Ver Empresas',
  [PERMISOS.EMPRESAS_WRITE]: 'Gestionar Empresas',
  [PERMISOS.CONTABILIDAD_READ]: 'Ver Contabilidad',
  [PERMISOS.CONTABILIDAD_WRITE]: 'Editar Contabilidad',
  [PERMISOS.FINANZAS_READ]: 'Ver Finanzas',
  [PERMISOS.FINANZAS_WRITE]: 'Gestionar Finanzas',
  [PERMISOS.USUARIOS_READ]: 'Ver Usuarios',
  [PERMISOS.USUARIOS_WRITE]: 'Gestionar Usuarios'
};

// Categorías de permisos para agruparlos en la interfaz
export const CATEGORIAS_PERMISOS = {
  ADMIN: 'Administración',
  EMPRESAS: 'Empresas',
  CONTABILIDAD: 'Contabilidad',
  FINANZAS: 'Finanzas',
  USUARIOS: 'Usuarios'
};

// Mapeo de permisos a categorías
export const PERMISOS_POR_CATEGORIA = {
  [CATEGORIAS_PERMISOS.ADMIN]: [
    PERMISOS.ADMIN_ALL
  ],
  [CATEGORIAS_PERMISOS.EMPRESAS]: [
    PERMISOS.EMPRESAS_READ,
    PERMISOS.EMPRESAS_WRITE
  ],
  [CATEGORIAS_PERMISOS.CONTABILIDAD]: [
    PERMISOS.CONTABILIDAD_READ,
    PERMISOS.CONTABILIDAD_WRITE
  ],
  [CATEGORIAS_PERMISOS.FINANZAS]: [
    PERMISOS.FINANZAS_READ,
    PERMISOS.FINANZAS_WRITE
  ],
  [CATEGORIAS_PERMISOS.USUARIOS]: [
    PERMISOS.USUARIOS_READ,
    PERMISOS.USUARIOS_WRITE
  ]
};

/**
 * Obtiene los permisos por defecto para un rol
 * @param rol Rol del usuario
 * @returns Array de permisos
 */
export function getPermisosPorRol(rol: string): string[] {
  // Si el rol es admin_empresa o super_admin, asegurarse de que tenga admin:all
  if (rol === ROLES.ADMIN_EMPRESA || rol === ROLES.SUPER_ADMIN) {
    const permisos = PERMISOS_POR_ROL[rol as keyof typeof PERMISOS_POR_ROL] || [];
    if (!permisos.includes(PERMISOS.ADMIN_ALL)) {
      return [PERMISOS.ADMIN_ALL, ...permisos];
    }
    return permisos;
  }
  
  return PERMISOS_POR_ROL[rol as keyof typeof PERMISOS_POR_ROL] || [];
}

/**
 * Verifica si un usuario tiene un permiso específico
 * @param permisos Permisos del usuario
 * @param permiso Permiso a verificar
 * @returns true si tiene el permiso, false en caso contrario
 */
export function tienePermiso(permisos: string[], permiso: string): boolean {
  // Si tiene admin:all, tiene todos los permisos
  if (permisos.includes(PERMISOS.ADMIN_ALL)) {
    return true;
  }
  
  return permisos.includes(permiso);
}

/**
 * Verifica si un usuario tiene un rol específico
 * @param rol Rol del usuario
 * @param rolRequerido Rol requerido
 * @returns true si tiene el rol o un rol superior, false en caso contrario
 */
export function tieneRol(rol: string, rolRequerido: string): boolean {
  const nivelRol = {
    [ROLES.SUPER_ADMIN]: 4,
    [ROLES.ADMIN_EMPRESA]: 3,
    [ROLES.CONTADOR]: 2,
    [ROLES.USUARIO]: 1
  };
  
  const nivelUsuario = nivelRol[rol as keyof typeof nivelRol] || 0;
  const nivelRequerido = nivelRol[rolRequerido as keyof typeof nivelRol] || 0;
  
  return nivelUsuario >= nivelRequerido;
}

/**
 * Prepara los metadatos de usuario para Auth0
 * @param rol Rol del usuario
 * @param permisos Permisos del usuario
 * @param empresas Empresas asignadas al usuario
 * @param subdominio Subdominio del usuario
 * @returns Objeto con los metadatos para Auth0
 */
export function prepararMetadatosAuth0(
  rol: string,
  permisos: string[],
  empresas: string[],
  subdominio?: string
) {
  // Asegurarse de que si el rol es admin_empresa o super_admin, tenga admin:all
  let permisosFinales = [...permisos];
  if ((rol === ROLES.ADMIN_EMPRESA || rol === ROLES.SUPER_ADMIN) && !permisosFinales.includes(PERMISOS.ADMIN_ALL)) {
    permisosFinales = [PERMISOS.ADMIN_ALL, ...permisosFinales];
  }
  
  return {
    app_metadata: {
      rol,
      permisos: permisosFinales,
      empresas,
      subdominio: subdominio || empresas[0] || ''
    }
  };
}