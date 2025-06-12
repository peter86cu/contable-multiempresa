import { Empresa, Usuario, ConfiguracionContable } from '../../types';
import { empresasFirebaseService } from '../firebase/empresas';
import { SeedDataEmpresasService } from '../firebase/seedDataEmpresas';
import { FirebaseAuthService } from '../../config/firebaseAuth';

export class EmpresasService {
  // Obtener empresas por usuario (cargando desde Firebase)
  static async getEmpresasByUsuario(usuarioId: string): Promise<Empresa[]> {
    try {
      // Ensure user is authenticated before making Firebase requests
      await FirebaseAuthService.ensureAuthenticated();
      
      console.log('🔄 Cargando empresas para usuario:', usuarioId);
      
      // Verificar si existen empresas en Firebase
      const existenEmpresas = await SeedDataEmpresasService.existenEmpresas();
      
      // Si no existen empresas, insertar datos de prueba
      if (!existenEmpresas) {
        console.log('⚠️ No existen empresas en la base de datos, insertando datos de prueba...');
        await SeedDataEmpresasService.insertEmpresasPrueba();
      }
      
      // Obtener empresas desde Firebase filtrando por usuario
      const empresas = await empresasFirebaseService.getEmpresasByUsuario(usuarioId);
      console.log('✅ Empresas cargadas desde Firebase:', empresas.length);
      
      return empresas;
    } catch (error) {
      console.error('❌ Error obteniendo empresas:', error);
      throw new Error('No se pudieron cargar las empresas: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  }
  
  // Resto del código se mantiene igual...
}