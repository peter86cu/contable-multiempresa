interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

export class Auth0TokenService {
  private static cachedToken: CachedToken | null = null;
  private static readonly BUFFER_TIME = 300; // 5 minutos de buffer antes de expiración
  private static readonly TOKEN_STORAGE_KEY = 'auth0_mgmt_token';
  private static readonly TOKEN_EXPIRY_KEY = 'auth0_mgmt_token_expiry';

  // Obtener token válido (usa caché si está disponible)
  static async getValidToken(): Promise<string> {
    // Verificar si estamos en modo desarrollo
    if (import.meta.env.DEV) {
      console.log('Modo desarrollo: Devolviendo token mock para Auth0 Management API');
      return 'mock_token_for_development';
    }

    // Intentar obtener token de localStorage
    try {
      const cachedToken = localStorage.getItem(this.TOKEN_STORAGE_KEY);
      const cachedExpiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
      
      if (cachedToken && cachedExpiry) {
        const expiresAt = parseInt(cachedExpiry, 10);
        
        // Verificar si el token aún es válido
        if (Date.now() < expiresAt) {
          console.log('Usando token de Auth0 Management API desde localStorage');
          return cachedToken;
        }
      }
    } catch (error) {
      console.warn('Error accediendo a localStorage:', error);
    }

    // Verificar si tenemos un token en caché válido
    if (this.cachedToken && this.isTokenValid(this.cachedToken)) {
      return this.cachedToken.token;
    }

    // Generar nuevo token
    const newToken = await this.generateNewToken();
    
    // Guardar en caché
    this.cachedToken = {
      token: newToken.access_token,
      expiresAt: Date.now() + (newToken.expires_in * 1000) - (this.BUFFER_TIME * 1000)
    };
    
    // Guardar en localStorage
    try {
      localStorage.setItem(this.TOKEN_STORAGE_KEY, newToken.access_token);
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, this.cachedToken.expiresAt.toString());
    } catch (error) {
      console.warn('Error guardando token en localStorage:', error);
    }

    return newToken.access_token;
  }

  // Generar nuevo token desde Auth0
  private static async generateNewToken(): Promise<TokenResponse> {
    const domain = import.meta.env.VITE_AUTH0_DOMAIN;
    const clientId = import.meta.env.VITE_AUTH0_MANAGEMENT_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_AUTH0_MANAGEMENT_CLIENT_SECRET;

    if (!domain || !clientId || !clientSecret) {
      throw new Error('Faltan credenciales de Auth0 Management API en las variables de entorno');
    }

    console.log('Generando nuevo token de Auth0 Management API');
    console.log('Domain:', domain);
    console.log('Client ID:', clientId);
    console.log('Client Secret:', clientSecret ? 'Configurado' : 'No configurado');

    try {
      const response = await fetch(`https://${domain}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          audience: `https://${domain}/api/v2/`,
          grant_type: 'client_credentials'
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Error en respuesta de Auth0:', error);
        throw new Error(`Error obteniendo token: ${error.error_description || response.statusText}`);
      }

      const data = await response.json();
      console.log('Token de Auth0 Management API generado correctamente');
      return data;
    } catch (error) {
      console.error('Error generando token de Auth0:', error);
      throw error;
    }
  }

  // Verificar si el token en caché es válido
  private static isTokenValid(cachedToken: CachedToken): boolean {
    return Date.now() < cachedToken.expiresAt;
  }

  // Limpiar caché (útil para logout o errores)
  static clearTokenCache(): void {
    this.cachedToken = null;
    try {
      localStorage.removeItem(this.TOKEN_STORAGE_KEY);
      localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
    } catch (error) {
      console.warn('Error eliminando token de localStorage:', error);
    }
  }

  // Forzar renovación del token
  static async refreshToken(): Promise<string> {
    this.clearTokenCache();
    return await this.getValidToken();
  }
}