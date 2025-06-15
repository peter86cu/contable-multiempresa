// API Configuration
export const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.contaempresa.online',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
};

// API Endpoints
export const API_ENDPOINTS = {
  // Empresas
  EMPRESAS: '/api/empresas',
  EMPRESA_BY_ID: (id: string) => `/api/empresas/${id}`,
  EMPRESAS_BY_PAIS: (paisId: string) => `/api/empresas/pais/${paisId}`,
  
  // Paises
  PAISES: '/api/paises',
  PAIS_BY_ID: (id: string) => `/api/paises/${id}`,
  
  // Contabilidad
  PLAN_CUENTAS: '/api/contabilidad/cuentas',
  ASIENTOS: '/api/contabilidad/asientos',
  
  // Tesorería
  CUENTAS_BANCARIAS: '/api/tesoreria/cuentas',
  MOVIMIENTOS_TESORERIA: '/api/tesoreria/movimientos',
  
  // Nomencladores
  NOMENCLADORES: (tipo: string) => `/api/nomencladores/${tipo}`,
};

// API Error Handling
export class ApiError extends Error {
  status: number;
  data?: any;
  
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}