/**
 * Servicio para gestionar usuarios de Auth0 a través de la Edge Function
 */
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

      // Realizar petición a la Edge Function
      const response = await fetch(`${this.baseUrl}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Error en Auth0 API: ${error.message || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error obteniendo usuarios de Auth0:', error);
      
      // En caso de error, devolver datos mock en desarrollo
      if (import.meta.env.DEV) {
        console.log('Devolviendo datos mock como fallback');
        return this.getMockUsers();
      }
      
      throw error;
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
   * Datos mock para desarrollo
   */
  private static getMockUsers() {
    return [
      {
        id: 'auth0|123456789',
        email: 'admin@contaempresa.com',
        nombre: 'Administrador',
        avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
        rol: 'super_admin',
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