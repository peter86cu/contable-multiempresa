import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FirebaseAuthService } from '../../config/firebaseAuth';
import { 
  TipoDocumentoIdentidad, 
  TipoDocumentoFactura,
  TipoImpuesto,
  FormaPago,
  TipoMovimientoTesoreria,
  TipoMoneda,
  Banco
} from '../../types/nomencladores';

export class NomencladoresService {
  // Tipos de Documento de Identidad
  static async getTiposDocumentoIdentidad(paisId: string): Promise<TipoDocumentoIdentidad[]> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        console.log('No se pudo autenticar con Firebase, usando datos mock');
        return this.getMockTiposDocumentoIdentidad(paisId);
      }

      console.log('🔍 Obteniendo tipos de documento de identidad para país:', paisId);
      
      const tiposDocRef = collection(db, 'tiposDocumentoIdentidad');
      
      // Usar query simple sin orderBy para evitar necesidad de índices compuestos
      const q = query(tiposDocRef, where('paisId', '==', paisId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log('⚠️ No se encontraron tipos de documento de identidad, usando datos mock');
        return this.getMockTiposDocumentoIdentidad(paisId);
      }
      
      const tiposDoc = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fechaCreacion: doc.data().fechaCreacion?.toDate() || new Date()
      })) as TipoDocumentoIdentidad[];
      
      // Ordenar en el cliente para evitar necesidad de índices compuestos
      const tiposDocOrdenados = tiposDoc.sort((a, b) => a.nombre.localeCompare(b.nombre));
      
      console.log(`✅ Se encontraron ${tiposDocOrdenados.length} tipos de documento de identidad`);
      return tiposDocOrdenados;
    } catch (error) {
      console.error('❌ Error obteniendo tipos de documento de identidad:', error);
      
      // Devolver datos mock para desarrollo
      console.log('⚠️ Devolviendo datos mock para desarrollo');
      return this.getMockTiposDocumentoIdentidad(paisId);
    }
  }

  // Crear Tipo de Documento de Identidad
  static async crearTipoDocumentoIdentidad(tipo: Omit<TipoDocumentoIdentidad, 'id' | 'fechaCreacion'>): Promise<string> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }

      console.log('📝 Creando nuevo tipo de documento de identidad:', tipo.nombre);
      
      const tiposDocRef = collection(db, 'tiposDocumentoIdentidad');
      const nuevoTipo = {
        ...tipo,
        fechaCreacion: Timestamp.now()
      };
      
      const docRef = await addDoc(tiposDocRef, nuevoTipo);
      console.log(`✅ Tipo de documento de identidad creado con ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creando tipo de documento de identidad:', error);
      throw error;
    }
  }

  // Actualizar Tipo de Documento de Identidad
  static async actualizarTipoDocumentoIdentidad(id: string, datos: Partial<TipoDocumentoIdentidad>): Promise<void> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }

      console.log(`🔄 Actualizando tipo de documento de identidad ${id}`);
      
      const tipoDocRef = doc(db, 'tiposDocumentoIdentidad', id);
      await updateDoc(tipoDocRef, {
        ...datos,
        fechaModificacion: Timestamp.now()
      });
      
      console.log('✅ Tipo de documento de identidad actualizado correctamente');
    } catch (error) {
      console.error('❌ Error actualizando tipo de documento de identidad:', error);
      throw error;
    }
  }

  // Eliminar Tipo de Documento de Identidad
  static async eliminarTipoDocumentoIdentidad(id: string): Promise<void> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }

      console.log(`🗑️ Eliminando tipo de documento de identidad ${id}`);
      
      const tipoDocRef = doc(db, 'tiposDocumentoIdentidad', id);
      await deleteDoc(tipoDocRef);
      
      console.log('✅ Tipo de documento de identidad eliminado correctamente');
    } catch (error) {
      console.error('❌ Error eliminando tipo de documento de identidad:', error);
      throw error;
    }
  }

  // Tipos de Documento de Factura
  static async getTiposDocumentoFactura(paisId: string): Promise<TipoDocumentoFactura[]> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        console.log('No se pudo autenticar con Firebase, usando datos mock');
        return this.getMockTiposDocumentoFactura(paisId);
      }

      console.log('🔍 Obteniendo tipos de documento de factura para país:', paisId);
      
      const tiposDocRef = collection(db, 'tiposDocumentoFactura');
      
      // Usar query simple sin orderBy para evitar necesidad de índices compuestos
      const q = query(tiposDocRef, where('paisId', '==', paisId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log('⚠️ No se encontraron tipos de documento de factura, usando datos mock');
        return this.getMockTiposDocumentoFactura(paisId);
      }
      
      const tiposDoc = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fechaCreacion: doc.data().fechaCreacion?.toDate() || new Date()
      })) as TipoDocumentoFactura[];
      
      // Ordenar en el cliente para evitar necesidad de índices compuestos
      const tiposDocOrdenados = tiposDoc.sort((a, b) => a.nombre.localeCompare(b.nombre));
      
      console.log(`✅ Se encontraron ${tiposDocOrdenados.length} tipos de documento de factura`);
      return tiposDocOrdenados;
    } catch (error) {
      console.error('❌ Error obteniendo tipos de documento de factura:', error);
      
      // Devolver datos mock para desarrollo
      console.log('⚠️ Devolviendo datos mock para desarrollo');
      return this.getMockTiposDocumentoFactura(paisId);
    }
  }

  // Crear Tipo de Documento de Factura
  static async crearTipoDocumentoFactura(tipo: Omit<TipoDocumentoFactura, 'id' | 'fechaCreacion'>): Promise<string> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }

      console.log('📝 Creando nuevo tipo de documento de factura:', tipo.nombre);
      
      const tiposDocRef = collection(db, 'tiposDocumentoFactura');
      const nuevoTipo = {
        ...tipo,
        fechaCreacion: Timestamp.now()
      };
      
      const docRef = await addDoc(tiposDocRef, nuevoTipo);
      console.log(`✅ Tipo de documento de factura creado con ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creando tipo de documento de factura:', error);
      throw error;
    }
  }

  // Actualizar Tipo de Documento de Factura
  static async actualizarTipoDocumentoFactura(id: string, datos: Partial<TipoDocumentoFactura>): Promise<void> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }

      console.log(`🔄 Actualizando tipo de documento de factura ${id}`);
      
      const tipoDocRef = doc(db, 'tiposDocumentoFactura', id);
      await updateDoc(tipoDocRef, {
        ...datos,
        fechaModificacion: Timestamp.now()
      });
      
      console.log('✅ Tipo de documento de factura actualizado correctamente');
    } catch (error) {
      console.error('❌ Error actualizando tipo de documento de factura:', error);
      throw error;
    }
  }

  // Eliminar Tipo de Documento de Factura
  static async eliminarTipoDocumentoFactura(id: string): Promise<void> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }

      console.log(`🗑️ Eliminando tipo de documento de factura ${id}`);
      
      const tipoDocRef = doc(db, 'tiposDocumentoFactura', id);
      await deleteDoc(tipoDocRef);
      
      console.log('✅ Tipo de documento de factura eliminado correctamente');
    } catch (error) {
      console.error('❌ Error eliminando tipo de documento de factura:', error);
      throw error;
    }
  }

  // Tipos de Impuesto
  static async getTiposImpuesto(paisId: string): Promise<TipoImpuesto[]> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        console.log('No se pudo autenticar con Firebase, usando datos mock');
        return this.getMockTiposImpuesto(paisId);
      }

      console.log('🔍 Obteniendo tipos de impuesto para país:', paisId);
      
      const tiposImpuestoRef = collection(db, 'tiposImpuesto');
      
      // Usar query simple sin orderBy para evitar necesidad de índices compuestos
      const q = query(tiposImpuestoRef, where('paisId', '==', paisId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log('⚠️ No se encontraron tipos de impuesto, usando datos mock');
        return this.getMockTiposImpuesto(paisId);
      }
      
      const tiposImpuesto = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fechaCreacion: doc.data().fechaCreacion?.toDate() || new Date()
      })) as TipoImpuesto[];
      
      // Ordenar en el cliente para evitar necesidad de índices compuestos
      const tiposImpuestoOrdenados = tiposImpuesto.sort((a, b) => a.nombre.localeCompare(b.nombre));
      
      console.log(`✅ Se encontraron ${tiposImpuestoOrdenados.length} tipos de impuesto`);
      return tiposImpuestoOrdenados;
    } catch (error) {
      console.error('❌ Error obteniendo tipos de impuesto:', error);
      
      // Devolver datos mock para desarrollo
      console.log('⚠️ Devolviendo datos mock para desarrollo');
      return this.getMockTiposImpuesto(paisId);
    }
  }

  // Crear Tipo de Impuesto
  static async crearTipoImpuesto(tipo: Omit<TipoImpuesto, 'id' | 'fechaCreacion'>): Promise<string> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }

      console.log('📝 Creando nuevo tipo de impuesto:', tipo.nombre);
      
      const tiposImpuestoRef = collection(db, 'tiposImpuesto');
      const nuevoTipo = {
        ...tipo,
        fechaCreacion: Timestamp.now()
      };
      
      const docRef = await addDoc(tiposImpuestoRef, nuevoTipo);
      console.log(`✅ Tipo de impuesto creado con ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creando tipo de impuesto:', error);
      throw error;
    }
  }

  // Actualizar Tipo de Impuesto
  static async actualizarTipoImpuesto(id: string, datos: Partial<TipoImpuesto>): Promise<void> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }

      console.log(`🔄 Actualizando tipo de impuesto ${id}`);
      
      const tipoImpuestoRef = doc(db, 'tiposImpuesto', id);
      await updateDoc(tipoImpuestoRef, {
        ...datos,
        fechaModificacion: Timestamp.now()
      });
      
      console.log('✅ Tipo de impuesto actualizado correctamente');
    } catch (error) {
      console.error('❌ Error actualizando tipo de impuesto:', error);
      throw error;
    }
  }

  // Eliminar Tipo de Impuesto
  static async eliminarTipoImpuesto(id: string): Promise<void> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }

      console.log(`🗑️ Eliminando tipo de impuesto ${id}`);
      
      const tipoImpuestoRef = doc(db, 'tiposImpuesto', id);
      await deleteDoc(tipoImpuestoRef);
      
      console.log('✅ Tipo de impuesto eliminado correctamente');
    } catch (error) {
      console.error('❌ Error eliminando tipo de impuesto:', error);
      throw error;
    }
  }

  // Formas de Pago
  static async getFormasPago(paisId: string): Promise<FormaPago[]> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        console.log('No se pudo autenticar con Firebase, usando datos mock');
        return this.getMockFormasPago(paisId);
      }

      console.log('🔍 Obteniendo formas de pago para país:', paisId);
      
      const formasPagoRef = collection(db, 'formasPago');
      
      // Usar query simple sin orderBy para evitar necesidad de índices compuestos
      const q = query(formasPagoRef, where('paisId', '==', paisId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log('⚠️ No se encontraron formas de pago, usando datos mock');
        return this.getMockFormasPago(paisId);
      }
      
      const formasPago = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fechaCreacion: doc.data().fechaCreacion?.toDate() || new Date()
      })) as FormaPago[];
      
      // Ordenar en el cliente para evitar necesidad de índices compuestos
      const formasPagoOrdenadas = formasPago.sort((a, b) => a.nombre.localeCompare(b.nombre));
      
      console.log(`✅ Se encontraron ${formasPagoOrdenadas.length} formas de pago`);
      return formasPagoOrdenadas;
    } catch (error) {
      console.error('❌ Error obteniendo formas de pago:', error);
      
      // Devolver datos mock para desarrollo
      console.log('⚠️ Devolviendo datos mock para desarrollo');
      return this.getMockFormasPago(paisId);
    }
  }

  // Crear Forma de Pago
  static async crearFormaPago(forma: Omit<FormaPago, 'id' | 'fechaCreacion'>): Promise<string> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }

      console.log('📝 Creando nueva forma de pago:', forma.nombre);
      
      const formasPagoRef = collection(db, 'formasPago');
      const nuevaForma = {
        ...forma,
        fechaCreacion: Timestamp.now()
      };
      
      const docRef = await addDoc(formasPagoRef, nuevaForma);
      console.log(`✅ Forma de pago creada con ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creando forma de pago:', error);
      throw error;
    }
  }

  // Actualizar Forma de Pago
  static async actualizarFormaPago(id: string, datos: Partial<FormaPago>): Promise<void> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }

      console.log(`🔄 Actualizando forma de pago ${id}`);
      
      const formaPagoRef = doc(db, 'formasPago', id);
      await updateDoc(formaPagoRef, {
        ...datos,
        fechaModificacion: Timestamp.now()
      });
      
      console.log('✅ Forma de pago actualizada correctamente');
    } catch (error) {
      console.error('❌ Error actualizando forma de pago:', error);
      throw error;
    }
  }

  // Eliminar Forma de Pago
  static async eliminarFormaPago(id: string): Promise<void> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }

      console.log(`🗑️ Eliminando forma de pago ${id}`);
      
      const formaPagoRef = doc(db, 'formasPago', id);
      await deleteDoc(formaPagoRef);
      
      console.log('✅ Forma de pago eliminada correctamente');
    } catch (error) {
      console.error('❌ Error eliminando forma de pago:', error);
      throw error;
    }
  }

  // Tipos de Movimiento de Tesorería
  static async getTiposMovimientoTesoreria(paisId: string): Promise<TipoMovimientoTesoreria[]> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        console.log('No se pudo autenticar con Firebase, usando datos mock');
        return this.getMockTiposMovimientoTesoreria(paisId);
      }

      console.log('🔍 Obteniendo tipos de movimiento de tesorería para país:', paisId);
      
      const tiposMovimientoRef = collection(db, 'tiposMovimientoTesoreria');
      
      // Usar query simple sin orderBy para evitar necesidad de índices compuestos
      const q = query(tiposMovimientoRef, where('paisId', '==', paisId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log('⚠️ No se encontraron tipos de movimiento de tesorería, usando datos mock');
        return this.getMockTiposMovimientoTesoreria(paisId);
      }
      
      const tiposMovimiento = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fechaCreacion: doc.data().fechaCreacion?.toDate() || new Date()
      })) as TipoMovimientoTesoreria[];
      
      // Ordenar en el cliente para evitar necesidad de índices compuestos
      const tiposMovimientoOrdenados = tiposMovimiento.sort((a, b) => a.nombre.localeCompare(b.nombre));
      
      console.log(`✅ Se encontraron ${tiposMovimientoOrdenados.length} tipos de movimiento de tesorería`);
      return tiposMovimientoOrdenados;
    } catch (error) {
      console.error('❌ Error obteniendo tipos de movimiento de tesorería:', error);
      
      // Devolver datos mock para desarrollo
      console.log('⚠️ Devolviendo datos mock para desarrollo');
      return this.getMockTiposMovimientoTesoreria(paisId);
    }
  }

  // Crear Tipo de Movimiento de Tesorería
  static async crearTipoMovimientoTesoreria(tipo: Omit<TipoMovimientoTesoreria, 'id' | 'fechaCreacion'>): Promise<string> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }

      console.log('📝 Creando nuevo tipo de movimiento de tesorería:', tipo.nombre);
      
      const tiposMovimientoRef = collection(db, 'tiposMovimientoTesoreria');
      const nuevoTipo = {
        ...tipo,
        fechaCreacion: Timestamp.now()
      };
      
      const docRef = await addDoc(tiposMovimientoRef, nuevoTipo);
      console.log(`✅ Tipo de movimiento de tesorería creado con ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creando tipo de movimiento de tesorería:', error);
      throw error;
    }
  }

  // Actualizar Tipo de Movimiento de Tesorería
  static async actualizarTipoMovimientoTesoreria(id: string, datos: Partial<TipoMovimientoTesoreria>): Promise<void> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }

      console.log(`🔄 Actualizando tipo de movimiento de tesorería ${id}`);
      
      const tipoMovimientoRef = doc(db, 'tiposMovimientoTesoreria', id);
      await updateDoc(tipoMovimientoRef, {
        ...datos,
        fechaModificacion: Timestamp.now()
      });
      
      console.log('✅ Tipo de movimiento de tesorería actualizado correctamente');
    } catch (error) {
      console.error('❌ Error actualizando tipo de movimiento de tesorería:', error);
      throw error;
    }
  }

  // Eliminar Tipo de Movimiento de Tesorería
  static async eliminarTipoMovimientoTesoreria(id: string): Promise<void> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }

      console.log(`🗑️ Eliminando tipo de movimiento de tesorería ${id}`);
      
      const tipoMovimientoRef = doc(db, 'tiposMovimientoTesoreria', id);
      await deleteDoc(tipoMovimientoRef);
      
      console.log('✅ Tipo de movimiento de tesorería eliminado correctamente');
    } catch (error) {
      console.error('❌ Error eliminando tipo de movimiento de tesorería:', error);
      throw error;
    }
  }

  // Tipos de Moneda
  static async getTiposMoneda(paisId: string): Promise<TipoMoneda[]> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        console.log('No se pudo autenticar con Firebase, usando datos mock');
        return this.getMockTiposMoneda(paisId);
      }

      console.log('🔍 Obteniendo tipos de moneda para país:', paisId);
      
      const tiposMonedaRef = collection(db, 'tiposMoneda');
      
      // Usar query simple sin orderBy para evitar necesidad de índices compuestos
      const q = query(tiposMonedaRef, where('paisId', '==', paisId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log('⚠️ No se encontraron tipos de moneda, usando datos mock');
        return this.getMockTiposMoneda(paisId);
      }
      
      const tiposMoneda = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fechaCreacion: doc.data().fechaCreacion?.toDate() || new Date()
      })) as TipoMoneda[];
      
      // Ordenar en el cliente para evitar necesidad de índices compuestos
      const tiposMonedaOrdenados = tiposMoneda.sort((a, b) => a.nombre.localeCompare(b.nombre));
      
      console.log(`✅ Se encontraron ${tiposMonedaOrdenados.length} tipos de moneda`);
      return tiposMonedaOrdenados;
    } catch (error) {
      console.error('❌ Error obteniendo tipos de moneda:', error);
      
      // Devolver datos mock para desarrollo
      console.log('⚠️ Devolviendo datos mock para desarrollo');
      return this.getMockTiposMoneda(paisId);
    }
  }

  // Crear Tipo de Moneda
  static async crearTipoMoneda(tipo: Omit<TipoMoneda, 'id' | 'fechaCreacion'>): Promise<string> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }

      console.log('📝 Creando nuevo tipo de moneda:', tipo.nombre);
      
      const tiposMonedaRef = collection(db, 'tiposMoneda');
      const nuevoTipo = {
        ...tipo,
        fechaCreacion: Timestamp.now()
      };
      
      const docRef = await addDoc(tiposMonedaRef, nuevoTipo);
      console.log(`✅ Tipo de moneda creado con ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creando tipo de moneda:', error);
      throw error;
    }
  }

  // Actualizar Tipo de Moneda
  static async actualizarTipoMoneda(id: string, datos: Partial<TipoMoneda>): Promise<void> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }

      console.log(`🔄 Actualizando tipo de moneda ${id}`);
      
      const tipoMonedaRef = doc(db, 'tiposMoneda', id);
      await updateDoc(tipoMonedaRef, {
        ...datos,
        fechaModificacion: Timestamp.now()
      });
      
      console.log('✅ Tipo de moneda actualizado correctamente');
    } catch (error) {
      console.error('❌ Error actualizando tipo de moneda:', error);
      throw error;
    }
  }

  // Eliminar Tipo de Moneda
  static async eliminarTipoMoneda(id: string): Promise<void> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }

      console.log(`🗑️ Eliminando tipo de moneda ${id}`);
      
      const tipoMonedaRef = doc(db, 'tiposMoneda', id);
      await deleteDoc(tipoMonedaRef);
      
      console.log('✅ Tipo de moneda eliminado correctamente');
    } catch (error) {
      console.error('❌ Error eliminando tipo de moneda:', error);
      throw error;
    }
  }

  // Bancos
  static async getBancos(paisId: string): Promise<Banco[]> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        console.log('No se pudo autenticar con Firebase, usando datos mock');
        return this.getMockBancos(paisId);
      }

      console.log('🔍 Obteniendo bancos para país:', paisId);
      
      const bancosRef = collection(db, 'bancos');
      
      // Usar query simple sin orderBy para evitar necesidad de índices compuestos
      const q = query(bancosRef, where('paisId', '==', paisId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log('⚠️ No se encontraron bancos, usando datos mock');
        return this.getMockBancos(paisId);
      }
      
      const bancos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fechaCreacion: doc.data().fechaCreacion?.toDate() || new Date()
      })) as Banco[];
      
      // Ordenar en el cliente para evitar necesidad de índices compuestos
      const bancosOrdenados = bancos.sort((a, b) => a.nombre.localeCompare(b.nombre));
      
      console.log(`✅ Se encontraron ${bancosOrdenados.length} bancos`);
      return bancosOrdenados;
    } catch (error) {
      console.error('❌ Error obteniendo bancos:', error);
      
      // Devolver datos mock para desarrollo
      console.log('⚠️ Devolviendo datos mock para desarrollo');
      return this.getMockBancos(paisId);
    }
  }

  // Crear Banco
  static async crearBanco(banco: Omit<Banco, 'id' | 'fechaCreacion'>): Promise<string> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }

      console.log('📝 Creando nuevo banco:', banco.nombre);
      
      const bancosRef = collection(db, 'bancos');
      const nuevoBanco = {
        ...banco,
        fechaCreacion: Timestamp.now()
      };
      
      const docRef = await addDoc(bancosRef, nuevoBanco);
      console.log(`✅ Banco creado con ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creando banco:', error);
      throw error;
    }
  }

  // Actualizar Banco
  static async actualizarBanco(id: string, datos: Partial<Banco>): Promise<void> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }

      console.log(`🔄 Actualizando banco ${id}`);
      
      const bancoRef = doc(db, 'bancos', id);
      await updateDoc(bancoRef, {
        ...datos,
        fechaModificacion: Timestamp.now()
      });
      
      console.log('✅ Banco actualizado correctamente');
    } catch (error) {
      console.error('❌ Error actualizando banco:', error);
      throw error;
    }
  }

  // Eliminar Banco
  static async eliminarBanco(id: string): Promise<void> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }

      console.log(`🗑️ Eliminando banco ${id}`);
      
      const bancoRef = doc(db, 'bancos', id);
      await deleteDoc(bancoRef);
      
      console.log('✅ Banco eliminado correctamente');
    } catch (error) {
      console.error('❌ Error eliminando banco:', error);
      throw error;
    }
  }

  // Inicializar nomencladores para un país
  static async inicializarNomencladores(paisId: string): Promise<boolean> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }

      console.log(`🔄 Inicializando nomencladores para país: ${paisId}`);
      
      // Verificar si ya existen nomencladores
      const tiposDocRef = collection(db, 'tiposDocumentoIdentidad');
      const q = query(tiposDocRef, where('paisId', '==', paisId), limit(1));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        console.log(`⚠️ Ya existen nomencladores para el país ${paisId}`);
        return false;
      }
      
      // Insertar datos mock como iniciales
      await Promise.all([
        // Insertar tipos de documento de identidad
        ...this.getMockTiposDocumentoIdentidad(paisId).map(tipo => 
          this.crearTipoDocumentoIdentidad({
            nombre: tipo.nombre,
            codigo: tipo.codigo,
            descripcion: tipo.descripcion,
            paisId: tipo.paisId,
            activo: tipo.activo
          })
        ),
        
        // Insertar tipos de documento de factura
        ...this.getMockTiposDocumentoFactura(paisId).map(tipo => 
          this.crearTipoDocumentoFactura({
            nombre: tipo.nombre,
            codigo: tipo.codigo,
            descripcion: tipo.descripcion,
            paisId: tipo.paisId,
            activo: tipo.activo,
            requiereImpuesto: tipo.requiereImpuesto,
            requiereCliente: tipo.requiereCliente,
            afectaInventario: tipo.afectaInventario,
            afectaContabilidad: tipo.afectaContabilidad,
            prefijo: tipo.prefijo,
            formato: tipo.formato
          })
        ),
        
        // Insertar tipos de impuesto
        ...this.getMockTiposImpuesto(paisId).map(tipo => 
          this.crearTipoImpuesto({
            nombre: tipo.nombre,
            codigo: tipo.codigo,
            porcentaje: tipo.porcentaje,
            tipo: tipo.tipo,
            paisId: tipo.paisId,
            activo: tipo.activo
          })
        ),
        
        // Insertar formas de pago
        ...this.getMockFormasPago(paisId).map(forma => 
          this.crearFormaPago({
            nombre: forma.nombre,
            codigo: forma.codigo,
            descripcion: forma.descripcion,
            paisId: forma.paisId,
            activo: forma.activo,
            requiereBanco: forma.requiereBanco,
            requiereReferencia: forma.requiereReferencia,
            requiereFecha: forma.requiereFecha
          })
        ),
        
        // Insertar tipos de movimiento de tesorería
        ...this.getMockTiposMovimientoTesoreria(paisId).map(tipo => 
          this.crearTipoMovimientoTesoreria({
            nombre: tipo.nombre,
            codigo: tipo.codigo,
            descripcion: tipo.descripcion,
            paisId: tipo.paisId,
            activo: tipo.activo,
            afectaSaldo: tipo.afectaSaldo,
            requiereReferencia: tipo.requiereReferencia
          })
        ),
        
        // Insertar tipos de moneda
        ...this.getMockTiposMoneda(paisId).map(tipo => 
          this.crearTipoMoneda({
            nombre: tipo.nombre,
            codigo: tipo.codigo,
            simbolo: tipo.simbolo,
            paisId: tipo.paisId,
            activo: tipo.activo,
            esPrincipal: tipo.esPrincipal
          })
        ),
        
        // Insertar bancos
        ...this.getMockBancos(paisId).map(banco => 
          this.crearBanco({
            nombre: banco.nombre,
            codigo: banco.codigo,
            paisId: banco.paisId,
            activo: banco.activo
          })
        )
      ]);
      
      console.log(`✅ Nomencladores inicializados correctamente para país ${paisId}`);
      return true;
    } catch (error) {
      console.error(`❌ Error inicializando nomencladores para país ${paisId}:`, error);
      throw error;
    }
  }

  // Datos mock para desarrollo
  static getMockTiposDocumentoIdentidad(paisId: string): TipoDocumentoIdentidad[] {
    switch (paisId) {
      case 'peru':
        return [
          {
            id: 'dni',
            nombre: 'DNI',
            codigo: '1',
            descripcion: 'Documento Nacional de Identidad',
            paisId: 'peru',
            activo: true,
            fechaCreacion: new Date()
          },
          {
            id: 'ruc',
            nombre: 'RUC',
            codigo: '6',
            descripcion: 'Registro Único de Contribuyentes',
            paisId: 'peru',
            activo: true,
            fechaCreacion: new Date()
          },
          {
            id: 'ce',
            nombre: 'Carnet de Extranjería',
            codigo: '4',
            descripcion: 'Carnet de Extranjería',
            paisId: 'peru',
            activo: true,
            fechaCreacion: new Date()
          },
          {
            id: 'pasaporte',
            nombre: 'Pasaporte',
            codigo: '7',
            descripcion: 'Pasaporte',
            paisId: 'peru',
            activo: true,
            fechaCreacion: new Date()
          }
        ];
      case 'colombia':
        return [
          {
            id: 'cc',
            nombre: 'Cédula de Ciudadanía',
            codigo: 'CC',
            descripcion: 'Cédula de Ciudadanía',
            paisId: 'colombia',
            activo: true,
            fechaCreacion: new Date()
          },
          {
            id: 'nit',
            nombre: 'NIT',
            codigo: 'NIT',
            descripcion: 'Número de Identificación Tributaria',
            paisId: 'colombia',
            activo: true,
            fechaCreacion: new Date()
          },
          {
            id: 'ce_col',
            nombre: 'Cédula de Extranjería',
            codigo: 'CE',
            descripcion: 'Cédula de Extranjería',
            paisId: 'colombia',
            activo: true,
            fechaCreacion: new Date()
          }
        ];
      case 'mexico':
        return [
          {
            id: 'rfc',
            nombre: 'RFC',
            codigo: 'RFC',
            descripcion: 'Registro Federal de Contribuyentes',
            paisId: 'mexico',
            activo: true,
            fechaCreacion: new Date()
          },
          {
            id: 'curp',
            nombre: 'CURP',
            codigo: 'CURP',
            descripcion: 'Clave Única de Registro de Población',
            paisId: 'mexico',
            activo: true,
            fechaCreacion: new Date()
          }
        ];
      default:
        return [
          {
            id: 'doc_identidad',
            nombre: 'Documento de Identidad',
            codigo: '1',
            descripcion: 'Documento de Identidad',
            paisId,
            activo: true,
            fechaCreacion: new Date()
          },
          {
            id: 'doc_tributario',
            nombre: 'Documento Tributario',
            codigo: '2',
            descripcion: 'Documento Tributario',
            paisId,
            activo: true,
            fechaCreacion: new Date()
          }
        ];
    }
  }

  static getMockTiposDocumentoFactura(paisId: string): TipoDocumentoFactura[] {
    switch (paisId) {
      case 'peru':
        return [
          {
            id: 'factura',
            nombre: 'Factura',
            codigo: '01',
            descripcion: 'Factura Electrónica',
            paisId: 'peru',
            activo: true,
            requiereImpuesto: true,
            requiereCliente: true,
            afectaInventario: true,
            afectaContabilidad: true,
            prefijo: 'F',
            formato: 'F###-########',
            fechaCreacion: new Date()
          },
          {
            id: 'boleta',
            nombre: 'Boleta',
            codigo: '03',
            descripcion: 'Boleta de Venta Electrónica',
            paisId: 'peru',
            activo: true,
            requiereImpuesto: true,
            requiereCliente: false,
            afectaInventario: true,
            afectaContabilidad: true,
            prefijo: 'B',
            formato: 'B###-########',
            fechaCreacion: new Date()
          },
          {
            id: 'nota_credito',
            nombre: 'Nota de Crédito',
            codigo: '07',
            descripcion: 'Nota de Crédito Electrónica',
            paisId: 'peru',
            activo: true,
            requiereImpuesto: true,
            requiereCliente: true,
            afectaInventario: true,
            afectaContabilidad: true,
            prefijo: 'NC',
            formato: 'NC##-########',
            fechaCreacion: new Date()
          },
          {
            id: 'nota_debito',
            nombre: 'Nota de Débito',
            codigo: '08',
            descripcion: 'Nota de Débito Electrónica',
            paisId: 'peru',
            activo: true,
            requiereImpuesto: true,
            requiereCliente: true,
            afectaInventario: false,
            afectaContabilidad: true,
            prefijo: 'ND',
            formato: 'ND##-########',
            fechaCreacion: new Date()
          }
        ];
      case 'colombia':
        return [
          {
            id: 'factura_electronica',
            nombre: 'Factura Electrónica',
            codigo: 'FE',
            descripcion: 'Factura Electrónica',
            paisId: 'colombia',
            activo: true,
            requiereImpuesto: true,
            requiereCliente: true,
            afectaInventario: true,
            afectaContabilidad: true,
            prefijo: 'FE',
            formato: 'FE##########',
            fechaCreacion: new Date()
          },
          {
            id: 'nota_credito_electronica',
            nombre: 'Nota Crédito Electrónica',
            codigo: 'NC',
            descripcion: 'Nota Crédito Electrónica',
            paisId: 'colombia',
            activo: true,
            requiereImpuesto: true,
            requiereCliente: true,
            afectaInventario: true,
            afectaContabilidad: true,
            prefijo: 'NC',
            formato: 'NC##########',
            fechaCreacion: new Date()
          }
        ];
      case 'mexico':
        return [
          {
            id: 'cfdi',
            nombre: 'CFDI',
            codigo: 'CFDI',
            descripcion: 'Comprobante Fiscal Digital por Internet',
            paisId: 'mexico',
            activo: true,
            requiereImpuesto: true,
            requiereCliente: true,
            afectaInventario: true,
            afectaContabilidad: true,
            prefijo: '',
            formato: '',
            fechaCreacion: new Date()
          },
          {
            id: 'nota_credito_mx',
            nombre: 'Nota de Crédito',
            codigo: 'NC',
            descripcion: 'Nota de Crédito',
            paisId: 'mexico',
            activo: true,
            requiereImpuesto: true,
            requiereCliente: true,
            afectaInventario: true,
            afectaContabilidad: true,
            prefijo: 'NC',
            formato: 'NC########',
            fechaCreacion: new Date()
          }
        ];
      default:
        return [
          {
            id: 'factura_default',
            nombre: 'Factura',
            codigo: 'F',
            descripcion: 'Factura',
            paisId,
            activo: true,
            requiereImpuesto: true,
            requiereCliente: true,
            afectaInventario: true,
            afectaContabilidad: true,
            prefijo: 'F',
            formato: 'F########',
            fechaCreacion: new Date()
          },
          {
            id: 'nota_credito_default',
            nombre: 'Nota de Crédito',
            codigo: 'NC',
            descripcion: 'Nota de Crédito',
            paisId,
            activo: true,
            requiereImpuesto: true,
            requiereCliente: true,
            afectaInventario: true,
            afectaContabilidad: true,
            prefijo: 'NC',
            formato: 'NC########',
            fechaCreacion: new Date()
          }
        ];
    }
  }

  static getMockTiposImpuesto(paisId: string): TipoImpuesto[] {
    switch (paisId) {
      case 'peru':
        return [
          {
            id: 'igv',
            nombre: 'IGV',
            codigo: 'IGV',
            porcentaje: 18,
            tipo: 'IGV',
            paisId: 'peru',
            activo: true,
            fechaCreacion: new Date()
          },
          {
            id: 'isc',
            nombre: 'ISC',
            codigo: 'ISC',
            porcentaje: 10,
            tipo: 'OTRO',
            paisId: 'peru',
            activo: true,
            fechaCreacion: new Date()
          },
          {
            id: 'exonerado',
            nombre: 'Exonerado',
            codigo: 'EXO',
            porcentaje: 0,
            tipo: 'OTRO',
            paisId: 'peru',
            activo: true,
            fechaCreacion: new Date()
          }
        ];
      case 'colombia':
        return [
          {
            id: 'iva',
            nombre: 'IVA',
            codigo: 'IVA',
            porcentaje: 19,
            tipo: 'IVA',
            paisId: 'colombia',
            activo: true,
            fechaCreacion: new Date()
          },
          {
            id: 'iva_reducido',
            nombre: 'IVA Reducido',
            codigo: 'IVA-R',
            porcentaje: 5,
            tipo: 'IVA',
            paisId: 'colombia',
            activo: true,
            fechaCreacion: new Date()
          },
          {
            id: 'exento',
            nombre: 'Exento',
            codigo: 'EXE',
            porcentaje: 0,
            tipo: 'OTRO',
            paisId: 'colombia',
            activo: true,
            fechaCreacion: new Date()
          }
        ];
      case 'mexico':
        return [
          {
            id: 'iva_mx',
            nombre: 'IVA',
            codigo: 'IVA',
            porcentaje: 16,
            tipo: 'IVA',
            paisId: 'mexico',
            activo: true,
            fechaCreacion: new Date()
          },
          {
            id: 'iva_frontera',
            nombre: 'IVA Frontera',
            codigo: 'IVA-F',
            porcentaje: 8,
            tipo: 'IVA',
            paisId: 'mexico',
            activo: true,
            fechaCreacion: new Date()
          },
          {
            id: 'ieps',
            nombre: 'IEPS',
            codigo: 'IEPS',
            porcentaje: 8,
            tipo: 'OTRO',
            paisId: 'mexico',
            activo: true,
            fechaCreacion: new Date()
          }
        ];
      default:
        return [
          {
            id: 'impuesto_general',
            nombre: 'Impuesto General',
            codigo: 'IG',
            porcentaje: 15,
            tipo: 'IVA',
            paisId,
            activo: true,
            fechaCreacion: new Date()
          },
          {
            id: 'impuesto_reducido',
            nombre: 'Impuesto Reducido',
            codigo: 'IR',
            porcentaje: 5,
            tipo: 'IVA',
            paisId,
            activo: true,
            fechaCreacion: new Date()
          }
        ];
    }
  }

  static getMockFormasPago(paisId: string): FormaPago[] {
    const formasPagoComunes = [
      {
        id: 'efectivo',
        nombre: 'Efectivo',
        codigo: 'EFE',
        descripcion: 'Pago en efectivo',
        paisId,
        activo: true,
        requiereBanco: false,
        requiereReferencia: false,
        requiereFecha: false,
        fechaCreacion: new Date()
      },
      {
        id: 'transferencia',
        nombre: 'Transferencia Bancaria',
        codigo: 'TRA',
        descripcion: 'Pago por transferencia bancaria',
        paisId,
        activo: true,
        requiereBanco: true,
        requiereReferencia: true,
        requiereFecha: true,
        fechaCreacion: new Date()
      },
      {
        id: 'tarjeta_credito',
        nombre: 'Tarjeta de Crédito',
        codigo: 'TC',
        descripcion: 'Pago con tarjeta de crédito',
        paisId,
        activo: true,
        requiereBanco: true,
        requiereReferencia: true,
        requiereFecha: false,
        fechaCreacion: new Date()
      },
      {
        id: 'tarjeta_debito',
        nombre: 'Tarjeta de Débito',
        codigo: 'TD',
        descripcion: 'Pago con tarjeta de débito',
        paisId,
        activo: true,
        requiereBanco: true,
        requiereReferencia: true,
        requiereFecha: false,
        fechaCreacion: new Date()
      },
      {
        id: 'cheque',
        nombre: 'Cheque',
        codigo: 'CHE',
        descripcion: 'Pago con cheque',
        paisId,
        activo: true,
        requiereBanco: true,
        requiereReferencia: true,
        requiereFecha: true,
        fechaCreacion: new Date()
      }
    ];

    // Agregar formas de pago específicas por país
    switch (paisId) {
      case 'peru':
        return [
          ...formasPagoComunes,
          {
            id: 'deposito_cuenta',
            nombre: 'Depósito en Cuenta',
            codigo: 'DEP',
            descripcion: 'Depósito en cuenta bancaria',
            paisId: 'peru',
            activo: true,
            requiereBanco: true,
            requiereReferencia: true,
            requiereFecha: true,
            fechaCreacion: new Date()
          },
          {
            id: 'yape',
            nombre: 'Yape',
            codigo: 'YAPE',
            descripcion: 'Pago mediante Yape',
            paisId: 'peru',
            activo: true,
            requiereBanco: false,
            requiereReferencia: true,
            requiereFecha: false,
            fechaCreacion: new Date()
          },
          {
            id: 'plin',
            nombre: 'Plin',
            codigo: 'PLIN',
            descripcion: 'Pago mediante Plin',
            paisId: 'peru',
            activo: true,
            requiereBanco: false,
            requiereReferencia: true,
            requiereFecha: false,
            fechaCreacion: new Date()
          }
        ];
      case 'colombia':
        return [
          ...formasPagoComunes,
          {
            id: 'nequi',
            nombre: 'Nequi',
            codigo: 'NEQ',
            descripcion: 'Pago mediante Nequi',
            paisId: 'colombia',
            activo: true,
            requiereBanco: false,
            requiereReferencia: true,
            requiereFecha: false,
            fechaCreacion: new Date()
          },
          {
            id: 'daviplata',
            nombre: 'Daviplata',
            codigo: 'DAV',
            descripcion: 'Pago mediante Daviplata',
            paisId: 'colombia',
            activo: true,
            requiereBanco: false,
            requiereReferencia: true,
            requiereFecha: false,
            fechaCreacion: new Date()
          }
        ];
      case 'mexico':
        return [
          ...formasPagoComunes,
          {
            id: 'spei',
            nombre: 'SPEI',
            codigo: 'SPEI',
            descripcion: 'Transferencia SPEI',
            paisId: 'mexico',
            activo: true,
            requiereBanco: true,
            requiereReferencia: true,
            requiereFecha: true,
            fechaCreacion: new Date()
          },
          {
            id: 'codi',
            nombre: 'CoDi',
            codigo: 'CODI',
            descripcion: 'Cobro Digital',
            paisId: 'mexico',
            activo: true,
            requiereBanco: false,
            requiereReferencia: true,
            requiereFecha: false,
            fechaCreacion: new Date()
          }
        ];
      default:
        return formasPagoComunes;
    }
  }

  static getMockTiposMovimientoTesoreria(paisId: string): TipoMovimientoTesoreria[] {
    return [
      {
        id: 'ingreso_ventas',
        nombre: 'Ingreso por Ventas',
        codigo: 'IV',
        descripcion: 'Ingreso por ventas de productos o servicios',
        paisId,
        activo: true,
        afectaSaldo: true,
        requiereReferencia: true,
        fechaCreacion: new Date()
      },
      {
        id: 'ingreso_cobranza',
        nombre: 'Ingreso por Cobranza',
        codigo: 'IC',
        descripcion: 'Ingreso por cobranza de facturas',
        paisId,
        activo: true,
        afectaSaldo: true,
        requiereReferencia: true,
        fechaCreacion: new Date()
      },
      {
        id: 'ingreso_prestamo',
        nombre: 'Ingreso por Préstamo',
        codigo: 'IP',
        descripcion: 'Ingreso por préstamo recibido',
        paisId,
        activo: true,
        afectaSaldo: true,
        requiereReferencia: true,
        fechaCreacion: new Date()
      },
      {
        id: 'egreso_compras',
        nombre: 'Egreso por Compras',
        codigo: 'EC',
        descripcion: 'Egreso por compras de productos o servicios',
        paisId,
        activo: true,
        afectaSaldo: true,
        requiereReferencia: true,
        fechaCreacion: new Date()
      },
      {
        id: 'egreso_pagos',
        nombre: 'Egreso por Pagos',
        codigo: 'EP',
        descripcion: 'Egreso por pago de facturas',
        paisId,
        activo: true,
        afectaSaldo: true,
        requiereReferencia: true,
        fechaCreacion: new Date()
      },
      {
        id: 'egreso_impuestos',
        nombre: 'Egreso por Impuestos',
        codigo: 'EI',
        descripcion: 'Egreso por pago de impuestos',
        paisId,
        activo: true,
        afectaSaldo: true,
        requiereReferencia: true,
        fechaCreacion: new Date()
      },
      {
        id: 'egreso_nomina',
        nombre: 'Egreso por Nómina',
        codigo: 'EN',
        descripcion: 'Egreso por pago de nómina',
        paisId,
        activo: true,
        afectaSaldo: true,
        requiereReferencia: false,
        fechaCreacion: new Date()
      },
      {
        id: 'transferencia_interna',
        nombre: 'Transferencia entre Cuentas',
        codigo: 'TI',
        descripcion: 'Transferencia entre cuentas propias',
        paisId,
        activo: true,
        afectaSaldo: true,
        requiereReferencia: false,
        fechaCreacion: new Date()
      }
    ];
  }

  static getMockTiposMoneda(paisId: string): TipoMoneda[] {
    switch (paisId) {
      case 'peru':
        return [
          {
            id: 'pen',
            nombre: 'Sol Peruano',
            codigo: 'PEN',
            simbolo: 'S/',
            paisId: 'peru',
            activo: true,
            esPrincipal: true,
            fechaCreacion: new Date()
          },
          {
            id: 'usd',
            nombre: 'Dólar Estadounidense',
            codigo: 'USD',
            simbolo: '$',
            paisId: 'peru',
            activo: true,
            esPrincipal: false,
            fechaCreacion: new Date()
          },
          {
            id: 'eur',
            nombre: 'Euro',
            codigo: 'EUR',
            simbolo: '€',
            paisId: 'peru',
            activo: true,
            esPrincipal: false,
            fechaCreacion: new Date()
          }
        ];
      case 'colombia':
        return [
          {
            id: 'cop',
            nombre: 'Peso Colombiano',
            codigo: 'COP',
            simbolo: '$',
            paisId: 'colombia',
            activo: true,
            esPrincipal: true,
            fechaCreacion: new Date()
          },
          {
            id: 'usd_col',
            nombre: 'Dólar Estadounidense',
            codigo: 'USD',
            simbolo: 'US$',
            paisId: 'colombia',
            activo: true,
            esPrincipal: false,
            fechaCreacion: new Date()
          }
        ];
      case 'mexico':
        return [
          {
            id: 'mxn',
            nombre: 'Peso Mexicano',
            codigo: 'MXN',
            simbolo: '$',
            paisId: 'mexico',
            activo: true,
            esPrincipal: true,
            fechaCreacion: new Date()
          },
          {
            id: 'usd_mx',
            nombre: 'Dólar Estadounidense',
            codigo: 'USD',
            simbolo: 'US$',
            paisId: 'mexico',
            activo: true,
            esPrincipal: false,
            fechaCreacion: new Date()
          }
        ];
      default:
        return [
          {
            id: 'moneda_local',
            nombre: 'Moneda Local',
            codigo: 'ML',
            simbolo: '$',
            paisId,
            activo: true,
            esPrincipal: true,
            fechaCreacion: new Date()
          },
          {
            id: 'usd_default',
            nombre: 'Dólar Estadounidense',
            codigo: 'USD',
            simbolo: 'US$',
            paisId,
            activo: true,
            esPrincipal: false,
            fechaCreacion: new Date()
          }
        ];
    }
  }

  static getMockBancos(paisId: string): Banco[] {
    switch (paisId) {
      case 'peru':
        return [
          {
            id: 'bcp',
            nombre: 'Banco de Crédito del Perú',
            codigo: 'BCP',
            paisId: 'peru',
            activo: true,
            fechaCreacion: new Date()
          },
          {
            id: 'bbva',
            nombre: 'BBVA',
            codigo: 'BBVA',
            paisId: 'peru',
            activo: true,
            fechaCreacion: new Date()
          },
          {
            id: 'interbank',
            nombre: 'Interbank',
            codigo: 'IBK',
            paisId: 'peru',
            activo: true,
            fechaCreacion: new Date()
          },
          {
            id: 'scotiabank',
            nombre: 'Scotiabank',
            codigo: 'SBP',
            paisId: 'peru',
            activo: true,
            fechaCreacion: new Date()
          },
          {
            id: 'banbif',
            nombre: 'BanBif',
            codigo: 'BIF',
            paisId: 'peru',
            activo: true,
            fechaCreacion: new Date()
          }
        ];
      case 'colombia':
        return [
          {
            id: 'bancolombia',
            nombre: 'Bancolombia',
            codigo: 'BCO',
            paisId: 'colombia',
            activo: true,
            fechaCreacion: new Date()
          },
          {
            id: 'davivienda',
            nombre: 'Davivienda',
            codigo: 'DAV',
            paisId: 'colombia',
            activo: true,
            fechaCreacion: new Date()
          },
          {
            id: 'bbva_col',
            nombre: 'BBVA Colombia',
            codigo: 'BBVA',
            paisId: 'colombia',
            activo: true,
            fechaCreacion: new Date()
          },
          {
            id: 'banco_bogota',
            nombre: 'Banco de Bogotá',
            codigo: 'BOG',
            paisId: 'colombia',
            activo: true,
            fechaCreacion: new Date()
          }
        ];
      case 'mexico':
        return [
          {
            id: 'bbva_mx',
            nombre: 'BBVA México',
            codigo: 'BBVA',
            paisId: 'mexico',
            activo: true,
            fechaCreacion: new Date()
          },
          {
            id: 'banamex',
            nombre: 'Citibanamex',
            codigo: 'BANA',
            paisId: 'mexico',
            activo: true,
            fechaCreacion: new Date()
          },
          {
            id: 'banorte',
            nombre: 'Banorte',
            codigo: 'BNO',
            paisId: 'mexico',
            activo: true,
            fechaCreacion: new Date()
          },
          {
            id: 'santander_mx',
            nombre: 'Santander México',
            codigo: 'SAN',
            paisId: 'mexico',
            activo: true,
            fechaCreacion: new Date()
          }
        ];
      default:
        return [
          {
            id: 'banco_principal',
            nombre: 'Banco Principal',
            codigo: 'BP',
            paisId,
            activo: true,
            fechaCreacion: new Date()
          },
          {
            id: 'banco_secundario',
            nombre: 'Banco Secundario',
            codigo: 'BS',
            paisId,
            activo: true,
            fechaCreacion: new Date()
          }
        ];
    }
  }
}