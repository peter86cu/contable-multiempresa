import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Empresa } from '../../types';

class EmpresasFirebaseService {
  private collectionName = 'empresas';

  // Obtener todas las empresas
  async getEmpresas(): Promise<Empresa[]> {
    try {
      const empresasRef = collection(db, this.collectionName);
      const q = query(empresasRef, orderBy('nombre'));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fechaCreacion: doc.data().fechaCreacion?.toDate() || new Date(),
        fechaActualizacion: doc.data().fechaActualizacion?.toDate()
      })) as Empresa[];
    } catch (error) {
      console.error('Error obteniendo empresas:', error);
      throw error;
    }
  }

  // Obtener empresas por usuario - AHORA FILTRA CORRECTAMENTE POR USUARIO
  async getEmpresasByUsuario(usuarioId: string): Promise<Empresa[]> {
    try {
      console.log('🔄 Obteniendo empresas para usuario:', usuarioId);
      
      // Obtener todas las empresas
      const empresasRef = collection(db, this.collectionName);
      const q = query(empresasRef, orderBy('nombre'));
      
      const querySnapshot = await getDocs(q);
      
      const todasEmpresas = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fechaCreacion: doc.data().fechaCreacion?.toDate() || new Date(),
        fechaActualizacion: doc.data().fechaActualizacion?.toDate()
      })) as Empresa[];
      
      // Filtrar empresas por usuario
      const empresasUsuario = todasEmpresas.filter(empresa => 
        empresa.usuariosAsignados && empresa.usuariosAsignados.includes(usuarioId)
      );
      
      console.log(`✅ Se encontraron ${empresasUsuario.length} empresas para el usuario ${usuarioId}`);
      
      return empresasUsuario;
    } catch (error) {
      console.error('Error obteniendo empresas:', error);
      throw error;
    }
  }

  // Resto del código se mantiene igual...
}

export const empresasFirebaseService = new EmpresasFirebaseService();