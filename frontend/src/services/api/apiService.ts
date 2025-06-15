import { FirebaseAuthService } from '../../config/firebaseAuth';

// Base URL for the API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.contaempresa.online';

// API Service class
export class ApiService {
  // Generic fetch method with authentication
  private static async fetchWithAuth(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    try {
      // Ensure Firebase authentication
      await FirebaseAuthService.ensureAuthenticated();
      
      // Get current user
      const user = FirebaseAuthService.getCurrentUser();
      
      if (!user) {
        throw new Error('No authenticated user');
      }
      
      // Get ID token
      const idToken = await user.getIdToken();
      
      // Set up headers
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
        ...options.headers
      };
      
      // Make the request
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });
      
      // Check if response is OK
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || 
          errorData?.message || 
          `API request failed with status ${response.status}`
        );
      }
      
      // Parse response
      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }
  
  // Empresas
  static async getEmpresas() {
    return this.fetchWithAuth('/api/empresas');
  }
  
  static async getEmpresaById(id: string) {
    return this.fetchWithAuth(`/api/empresas/${id}`);
  }
  
  static async getEmpresasByPais(paisId: string) {
    return this.fetchWithAuth(`/api/empresas/pais/${paisId}`);
  }
  
  // Paises
  static async getPaises() {
    return this.fetchWithAuth('/api/paises');
  }
  
  static async getPaisById(id: string) {
    return this.fetchWithAuth(`/api/paises/${id}`);
  }
  
  // Plan de Cuentas
  static async getPlanCuentas(empresaId: string) {
    return this.fetchWithAuth(`/api/contabilidad/cuentas?empresa_id=${empresaId}`);
  }
  
  // Asientos Contables
  static async getAsientos(empresaId: string, fechaDesde?: string, fechaHasta?: string) {
    let url = `/api/contabilidad/asientos?empresa_id=${empresaId}`;
    
    if (fechaDesde) {
      url += `&fecha_desde=${fechaDesde}`;
    }
    
    if (fechaHasta) {
      url += `&fecha_hasta=${fechaHasta}`;
    }
    
    return this.fetchWithAuth(url);
  }
  
  // Tesorería
  static async getCuentasBancarias(empresaId: string) {
    return this.fetchWithAuth(`/api/tesoreria/cuentas?empresa_id=${empresaId}`);
  }
  
  static async getMovimientosTesoreria(empresaId: string) {
    return this.fetchWithAuth(`/api/tesoreria/movimientos?empresa_id=${empresaId}`);
  }
  
  // Nomencladores
  static async getNomencladores(tipo: string, paisId: string) {
    return this.fetchWithAuth(`/api/nomencladores/${tipo}?pais_id=${paisId}`);
  }
}