/**
 * Servicio para gestionar usuarios de Auth0 a través de la Edge Function
 */
import { PERMISOS_POR_ROL } from './roles';

export class Auth0UsersService {
  private static baseUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth0-users`;

  /**
   * Obtiene la lista de usuarios de Auth0
   * @param options Opciones de consulta
   * @returns Lista de usuarios
   */
  static async getUsers(options: {
    page?: number;
    perPage?: number;
    query?: string;
  } = {}) {
    try {
      // Verificar si estamos en modo desarrollo sin credenciales reales
      if (import.meta.env.DEV && !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.log('Modo desarrollo: Simulando obtención de usuarios de Auth0', options);
        return this.getMockUsers();
      }

      // Construir URL con parámetros
      const params = new URLSearchParams();
      if (options.page !== undefined) params.append('page', options.page.toString());
      if (options.perPage !== undefined) params.append('per_page', options.perPage.toString());
      if (options.query) params.append('q', options.query);

      console.log(`Obteniendo usuarios de Auth0: ${this.baseUrl}?${params.toString()}`);

      // Realizar petición a la Edge Function
      const response = await fetch(`${this.baseUrl}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      // Verificar si la respuesta contiene datos mock
      const isMockData = response.headers.get('X-Mock-Data') === 'true';
      
      if (!response.ok && !isMockData) {
        const error = await response.json();
        throw new Error(`Error en Auth0 API: ${error.message || response.statusText}`);
      }

      const data = await response.json();
      
      // Ensure data is always an array
      const users = Array.isArray(data) ? data : [];
      
      // Log the first user to debug role and permissions
      if (users.length > 0) {
        console.log('DEBUG - Primer usuario recibido:', users[0]);
        console.log('DEBUG - Rol del primer usuario:', users[0].rol);
        console.log('DEBUG - Permisos del primer usuario:', users[0].permisos);
      }
      
      if (isMockData) {
        console.log('Recibidos datos mock de Auth0');
      } else {
        console.log(`Recibidos ${users.length} usuarios de Auth0`);
      }
      
      return users;
    } catch (error) {
      console.error('Error obteniendo usuarios de Auth0:', error);
      
      // En caso de error en desarrollo, devolver datos mock
      if (import.meta.env.DEV) {
        console.log('Devolviendo datos mock como fallback');
        return this.getMockUsers();
      }
      
      // Always return an empty array instead of throwing error to prevent filter issues
      return [];
    }
  }

  /**
   * Busca un usuario por email
   * @param email Email del usuario
   * @returns Usuario encontrado o null
   */
  static async getUserByEmail(email: string) {
    try {
      const users = await this.getUsers({ query: `email:"${email}"` });
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      console.error('Error buscando usuario por email:', error);
      return null;
    }
  }

  /**
   * Crea un nuevo usuario en Auth0
   * @param userData Datos del usuario
   * @returns Usuario creado
   */
  static async createUser(userData: {
    email: string;
    password: string;
    name: string;
    rol: string;
    empresas: string[];
    permisos?: string[];
    subdominio?: string;
  }) {
    try {
      // Verificar si estamos en modo desarrollo sin credenciales reales
      if (import.meta.env.DEV && !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.log('Modo desarrollo: Simulando creación de usuario en Auth0', userData);
        return {
          id: `auth0_${Date.now()}`,
          email: userData.email,
          nombre: userData.name,
          rol: userData.rol,
          empresasAsignadas: userData.empresas,
          permisos: userData.permisos || PERMISOS_POR_ROL[userData.rol] || [],
          fechaCreacion: new Date().toISOString()
        };
      }

      // Si no se proporcionan permisos, usar los del rol
      const permisos = userData.permisos || PERMISOS_POR_ROL[userData.rol] || [];

      // Extraer el subdominio del email si no se proporciona
      let subdominio = userData.subdominio;
      if (!subdominio && userData.email) {
        const emailParts = userData.email.split('@');
        if (emailParts.length === 2) {
          subdominio = emailParts[1];
        }
      }

      console.log('Creando usuario en Auth0:', userData.email);
      console.log('Subdominio para el usuario:', subdominio);
      console.log('Roles y permisos para el usuario:', {
        rol: userData.rol,
        permisos: permisos
      });

      // Preparar datos para Auth0
      const requestData = {
        email: userData.email,
        password: userData.password,
        name: userData.name,
        connection: 'Username-Password-Authentication',
        app_metadata: {
          rol: userData.rol,
          empresas: userData.empresas,
          permisos: permisos,
          subdominio: subdominio || ''
        },
        user_metadata: {
          created_by: 'admin_panel',
          creation_date: new Date().toISOString()
        }
      };

      // Realizar petición a la Edge Function
      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      // Verificar si la respuesta contiene datos mock
      const isMockData = response.headers.get('X-Mock-Data') === 'true';
      
      if (!response.ok && !isMockData) {
        // Check content type before parsing response
        const contentType = response.headers.get('Content-Type');
        let errorMessage = response.statusText;
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const error = await response.json();
            errorMessage = error.message || error.error || response.statusText;
          } catch (parseError) {
            console.warn('Failed to parse JSON error response:', parseError);
            errorMessage = await response.text() || response.statusText;
          }
        } else {
          // If not JSON, read as text
          try {
            errorMessage = await response.text() || response.statusText;
          } catch (textError) {
            console.warn('Failed to read text error response:', textError);
            errorMessage = response.statusText;
          }
        }
        
        throw new Error(`Error creando usuario en Auth0: ${errorMessage}`);
      }

      const data = await response.json();
      
      if (isMockData) {
        console.log('Recibidos datos mock de creación de usuario');
      } else {
        console.log('Usuario creado correctamente en Auth0:', data.id);
      }
      
      return data;
    } catch (error) {
      console.error('Error creando usuario en Auth0:', error);
      
      // En caso de error en producción, propagar el error
      if (!import.meta.env.DEV) {
        throw error;
      }
      
      // En desarrollo, devolver un usuario mock
      return {
        id: `auth0_${Date.now()}`,
        email: userData.email,
        nombre: userData.name,
        rol: userData.rol,
        empresasAsignadas: userData.empresas,
        permisos: userData.permisos || PERMISOS_POR_ROL[userData.rol] || [],
        fechaCreacion: new Date().toISOString(),
        mock: true
      };
    }
  }

  /**
   * Actualiza un usuario en Auth0
   * @param userId ID del usuario
   * @param userData Datos a actualizar
   * @returns Usuario actualizado
   */
  static async updateUser(userId: string, userData: {
    name?: string;
    email?: string;
    password?: string;
    rol?: string;
    empresas?: string[];
    permisos?: string[];
    subdominio?: string;
    blocked?: boolean;
  }) {
    try {
      // Verificar si estamos en modo desarrollo sin credenciales reales
      if (import.meta.env.DEV && !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.log('Modo desarrollo: Simulando actualización de usuario en Auth0', { userId, userData });
        return { id: userId, ...userData };
      }

      console.log('Actualizando usuario en Auth0:', userId);
      console.log('Datos de actualización:', userData);

      // Preparar datos para Auth0
      const requestData: any = {};
      
      if (userData.name) requestData.name = userData.name;
      if (userData.email) requestData.email = userData.email;
      if (userData.password) requestData.password = userData.password;
      if (userData.blocked !== undefined) requestData.blocked = userData.blocked;
      
      // Metadatos de aplicación
      const appMetadata: any = {};
      if (userData.rol) appMetadata.rol = userData.rol;
      if (userData.empresas) appMetadata.empresas = userData.empresas;
      if (userData.permisos) appMetadata.permisos = userData.permisos;
      if (userData.subdominio) appMetadata.subdominio = userData.subdominio;
      
      if (Object.keys(appMetadata).length > 0) {
        requestData.app_metadata = appMetadata;
      }

      // Realizar petición a la Edge Function
      const response = await fetch(`${this.baseUrl}/${userId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      // Verificar si la respuesta contiene datos mock
      const isMockData = response.headers.get('X-Mock-Data') === 'true';
      
      if (!response.ok && !isMockData) {
        // Check content type before parsing response
        const contentType = response.headers.get('Content-Type');
        let errorMessage = response.statusText;
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const error = await response.json();
            errorMessage = error.message || error.error || response.statusText;
          } catch (parseError) {
            console.warn('Failed to parse JSON error response:', parseError);
            errorMessage = await response.text() || response.statusText;
          }
        } else {
          // If not JSON, read as text
          try {
            errorMessage = await response.text() || response.statusText;
          } catch (textError) {
            console.warn('Failed to read text error response:', textError);
            errorMessage = response.statusText;
          }
        }
        
        throw new Error(`Error actualizando usuario en Auth0: ${errorMessage}`);
      }

      const data = await response.json();
      
      if (isMockData) {
        console.log('Recibidos datos mock de actualización de usuario');
      } else {
        console.log('Usuario actualizado correctamente en Auth0');
      }
      
      return data;
    } catch (error) {
      console.error('Error actualizando usuario en Auth0:', error);
      
      // En caso de error en producción, propagar el error
      if (!import.meta.env.DEV) {
        throw error;
      }
      
      // En desarrollo, devolver datos simulados
      return { 
        id: userId, 
        ...userData, 
        mock: true 
      };
    }
  }

  /**
   * Elimina un usuario en Auth0
   * @param userId ID del usuario
   * @returns true si se eliminó correctamente
   */
  static async deleteUser(userId: string) {
    try {
      // Verificar si estamos en modo desarrollo sin credenciales reales
      if (import.meta.env.DEV && !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        console.log('Modo desarrollo: Simulando eliminación de usuario en Auth0', userId);
        return true;
      }

      // Realizar petición a la Edge Function
      const response = await fetch(`${this.baseUrl}/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // Check content type before parsing response
        const contentType = response.headers.get('Content-Type');
        let errorMessage = response.statusText;
        
        if (contentType && contentType.includes('application/json')) {
          try {
            const error = await response.json();
            errorMessage = error.message || error.error || response.statusText;
          } catch (parseError) {
            console.warn('Failed to parse JSON error response:', parseError);
            errorMessage = await response.text() || response.statusText;
          }
        } else {
          // If not JSON, read as text
          try {
            errorMessage = await response.text() || response.statusText;
          } catch (textError) {
            console.warn('Failed to read text error response:', textError);
            errorMessage = response.statusText;
          }
        }
        
        throw new Error(`Error eliminando usuario en Auth0: ${errorMessage}`);
      }

      return true;
    } catch (error) {
      console.error('Error eliminando usuario en Auth0:', error);
      
      // En caso de error en producción, propagar el error
      if (!import.meta.env.DEV) {
        throw error;
      }
      
      // En desarrollo, simular éxito
      return true;
    }
  }

  /**
   * Datos mock para desarrollo
   */
  private static getMockUsers() {
    return [
      {
        id: 'auth0|123456789',
        email: 'admin@contaempresa.com',
        nombre: 'Administrador',
        avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
        rol: 'admin_empresa',
        empresasAsignadas: ['dev-empresa-pe', 'dev-empresa-co', 'dev-empresa-mx'],
        permisos: ['admin:all'],
        fechaCreacion: new Date().toISOString(),
        ultimaConexion: new Date().toISOString(),
        activo: true
      },
      {
        id: 'auth0|987654321',
        email: 'contador@contaempresa.com',
        nombre: 'María González',
        avatar: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=150',
        rol: 'contador',
        empresasAsignadas: ['dev-empresa-pe'],
        permisos: ['contabilidad:read', 'contabilidad:write', 'reportes:read'],
        fechaCreacion: new Date().toISOString(),
        ultimaConexion: new Date().toISOString(),
        activo: true
      },
      {
        id: 'auth0|567891234',
        email: 'usuario@contaempresa.com',
        nombre: 'Carlos Mendoza',
        avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
        rol: 'usuario',
        empresasAsignadas: ['dev-empresa-pe'],
        permisos: ['contabilidad:read'],
        fechaCreacion: new Date().toISOString(),
        ultimaConexion: null,
        activo: true
      }
    ];
  }
}