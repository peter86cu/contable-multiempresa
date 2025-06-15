import { useState, useCallback } from 'react';
import { ApiService } from '../services/api';
import { API_CONFIG, ApiError } from '../config/api';

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
  retryAttempts?: number;
  retryDelay?: number;
}

export function useApi<T = any>(options: UseApiOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  
  const retryAttempts = options.retryAttempts ?? API_CONFIG.retryAttempts;
  const retryDelay = options.retryDelay ?? API_CONFIG.retryDelay;
  
  // Generic fetch function with retry logic
  const fetchWithRetry = useCallback(async <R>(
    apiCall: () => Promise<R>,
    attempts: number = retryAttempts
  ): Promise<R> => {
    try {
      return await apiCall();
    } catch (err) {
      if (attempts <= 1) {
        throw err;
      }
      
      console.log(`Retrying API call, ${attempts - 1} attempts left`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return fetchWithRetry(apiCall, attempts - 1);
    }
  }, [retryAttempts, retryDelay]);
  
  // Generic execute function
  const execute = useCallback(async <R>(
    apiCall: () => Promise<R>
  ): Promise<R | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchWithRetry(apiCall);
      setData(result as unknown as T);
      options.onSuccess?.(result);
      return result;
    } catch (err) {
      console.error('API Error:', err);
      const apiError = err instanceof ApiError 
        ? err 
        : new ApiError(
            err instanceof Error ? err.message : 'Unknown error',
            500
          );
      
      setError(apiError);
      options.onError?.(apiError);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchWithRetry, options]);
  
  // Specific API methods
  const getEmpresas = useCallback(() => {
    return execute(() => ApiService.getEmpresas());
  }, [execute]);
  
  const getEmpresaById = useCallback((id: string) => {
    return execute(() => ApiService.getEmpresaById(id));
  }, [execute]);
  
  const getEmpresasByPais = useCallback((paisId: string) => {
    return execute(() => ApiService.getEmpresasByPais(paisId));
  }, [execute]);
  
  const getPaises = useCallback(() => {
    return execute(() => ApiService.getPaises());
  }, [execute]);
  
  const getPaisById = useCallback((id: string) => {
    return execute(() => ApiService.getPaisById(id));
  }, [execute]);
  
  const getPlanCuentas = useCallback((empresaId: string) => {
    return execute(() => ApiService.getPlanCuentas(empresaId));
  }, [execute]);
  
  const getAsientos = useCallback((empresaId: string, fechaDesde?: string, fechaHasta?: string) => {
    return execute(() => ApiService.getAsientos(empresaId, fechaDesde, fechaHasta));
  }, [execute]);
  
  const getCuentasBancarias = useCallback((empresaId: string) => {
    return execute(() => ApiService.getCuentasBancarias(empresaId));
  }, [execute]);
  
  const getMovimientosTesoreria = useCallback((empresaId: string) => {
    return execute(() => ApiService.getMovimientosTesoreria(empresaId));
  }, [execute]);
  
  const getNomencladores = useCallback((tipo: string, paisId: string) => {
    return execute(() => ApiService.getNomencladores(tipo, paisId));
  }, [execute]);
  
  return {
    data,
    loading,
    error,
    execute,
    // Specific API methods
    getEmpresas,
    getEmpresaById,
    getEmpresasByPais,
    getPaises,
    getPaisById,
    getPlanCuentas,
    getAsientos,
    getCuentasBancarias,
    getMovimientosTesoreria,
    getNomencladores
  };
}