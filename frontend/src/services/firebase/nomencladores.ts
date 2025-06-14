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
  getDoc
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
  // ==================== TIPOS DE DOCUMENTO DE IDENTIDAD ====================
  
  // Obtener tipos de documento de identidad
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
      const q = query(
        tiposDocRef,
        where('paisId', '==', paisId),
        orderBy('nombre')
      );
      
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
      
      console.log(`✅ Se encontraron ${tiposDoc.length} tipos de documento de identidad`);
      return tiposDoc;
    } catch (error) {
      console.error('❌ Error obteniendo tipos de documento de identidad:', error);
      
      // Devolver datos mock para desarrollo
      console.log('⚠️ Devolviendo datos mock para desarrollo');
      return this.getMockTiposDocumentoIdentidad(paisId);
    }
  }

  // Crear tipo de documento de identidad
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

  // Actualizar tipo de documento de identidad
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

  // Eliminar tipo de documento de identidad
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

  // ==================== TIPOS DE DOCUMENTO DE FACTURA ====================
  
  // Obtener tipos de documento de factura
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
      const q = query(
        tiposDocRef,
        where('paisId', '==', paisId),
        orderBy('nombre')
      );
      
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
      
      console.log(`✅ Se encontraron ${tiposDoc.length} tipos de documento de factura`);
      return tiposDoc;
    } catch (error) {
      console.error('❌ Error obteniendo tipos de documento de factura:', error);
      
      // Devolver datos mock para desarrollo
      console.log('⚠️ Devolviendo datos mock para desarrollo');
      return this.getMockTiposDocumentoFactura(paisId);
    }
  }

  // Crear tipo de documento de factura
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

  // Actualizar tipo de documento de factura
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

  // Eliminar tipo de documento de factura
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

  // ==================== TIPOS DE IMPUESTO ====================
  
  // Obtener tipos de impuesto
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
      const q = query(
        tiposImpuestoRef,
        where('paisId', '==', paisId),
        orderBy('nombre')
      );
      
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
      
      console.log(`✅ Se encontraron ${tiposImpuesto.length} tipos de impuesto`);
      return tiposImpuesto;
    } catch (error) {
      console.error('❌ Error obteniendo tipos de impuesto:', error);
      
      // Devolver datos mock para desarrollo
      console.log('⚠️ Devolviendo datos mock para desarrollo');
      return this.getMockTiposImpuesto(paisId);
    }
  }

  // Crear tipo de impuesto
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

  // Actualizar tipo de impuesto
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

  // Eliminar tipo de impuesto
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

  // ==================== FORMAS DE PAGO ====================
  
  // Obtener formas de pago
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
      const q = query(
        formasPagoRef,
        where('paisId', '==', paisId),
        orderBy('nombre')
      );
      
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
      
      console.log(`✅ Se encontraron ${formasPago.length} formas de pago`);
      return formasPago;
    } catch (error) {
      console.error('❌ Error obteniendo formas de pago:', error);
      
      // Devolver datos mock para desarrollo
      console.log('⚠️ Devolviendo datos mock para desarrollo');
      return this.getMockFormasPago(paisId);
    }
  }

  // Crear forma de pago
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

  // Actualizar forma de pago
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

  // Eliminar forma de pago
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

  // ==================== TIPOS DE MOVIMIENTO DE TESORERÍA ====================
  
  // Obtener tipos de movimiento de tesorería
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
      const q = query(
        tiposMovimientoRef,
        where('paisId', '==', paisId),
        orderBy('nombre')
      );
      
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
      
      console.log(`✅ Se encontraron ${tiposMovimiento.length} tipos de movimiento de tesorería`);
      return tiposMovimiento;
    } catch (error) {
      console.error('❌ Error obteniendo tipos de movimiento de tesorería:', error);
      
      // Devolver datos mock para desarrollo
      console.log('⚠️ Devolviendo datos mock para desarrollo');
      return this.getMockTiposMovimientoTesoreria(paisId);
    }
  }

  // Crear tipo de movimiento de tesorería
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

  // Actualizar tipo de movimiento de tesorería
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

  // Eliminar tipo de movimiento de tesorería
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

  // ==================== TIPOS DE MONEDA ====================
  
  // Obtener tipos de moneda
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
      const q = query(
        tiposMonedaRef,
        where('paisId', '==', paisId),
        orderBy('nombre')
      );
      
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
      
      console.log(`✅ Se encontraron ${tiposMoneda.length} tipos de moneda`);
      return tiposMoneda;
    } catch (error) {
      console.error('❌ Error obteniendo tipos de moneda:', error);
      
      // Devolver datos mock para desarrollo
      console.log('⚠️ Devolviendo datos mock para desarrollo');
      return this.getMockTiposMoneda(paisId);
    }
  }

  // Crear tipo de moneda
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

  // Actualizar tipo de moneda
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

  // Eliminar tipo de moneda
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

  // ==================== BANCOS ====================
  
  // Obtener bancos
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
      const q = query(
        bancosRef,
        where('paisId', '==', paisId),
        orderBy('nombre')
      );
      
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
      
      console.log(`✅ Se encontraron ${bancos.length} bancos`);
      return bancos;
    } catch (error) {
      console.error('❌ Error obteniendo bancos:', error);
      
      // Devolver datos mock para desarrollo
      console.log('⚠️ Devolviendo datos mock para desarrollo');
      return this.getMockBancos(paisId);
    }
  }

  // Crear banco
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

  // Actualizar banco
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

  // Eliminar banco
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

  // ==================== DATOS MOCK PARA DESARROLLO ====================
  
  // Datos mock para tipos de documento de identidad
  static getMockTiposDocumentoIdentidad(paisId: string): TipoDocumentoIdentidad[] {
    switch (paisId) {
      case 'peru':
        return [
          {
            id: 'dni-pe',
            nombre: 'DNI',
            codigo: '1',
            descripcion: 'Documento Nacional de Identidad',
            paisId: 'peru',
            activo: true
          },
          {
            id: 'ruc-pe',
            nombre: 'RUC',
            codigo: '6',
            descripcion: 'Registro Único de Contribuyentes',
            paisId: 'peru',
            activo: true
          },
          {
            id: 'ce-pe',
            nombre: 'Carnet de Extranjería',
            codigo: '4',
            descripcion: 'Carnet de Extranjería',
            paisId: 'peru',
            activo: true
          },
          {
            id: 'pasaporte-pe',
            nombre: 'Pasaporte',
            codigo: '7',
            descripcion: 'Pasaporte',
            paisId: 'peru',
            activo: true
          }
        ];
      case 'colombia':
        return [
          {
            id: 'cc-co',
            nombre: 'Cédula de Ciudadanía',
            codigo: 'CC',
            descripcion: 'Cédula de Ciudadanía',
            paisId: 'colombia',
            activo: true
          },
          {
            id: 'nit-co',
            nombre: 'NIT',
            codigo: 'NIT',
            descripcion: 'Número de Identificación Tributaria',
            paisId: 'colombia',
            activo: true
          },
          {
            id: 'ce-co',
            nombre: 'Cédula de Extranjería',
            codigo: 'CE',
            descripcion: 'Cédula de Extranjería',
            paisId: 'colombia',
            activo: true
          }
        ];
      case 'mexico':
        return [
          {
            id: 'rfc-mx',
            nombre: 'RFC',
            codigo: 'RFC',
            descripcion: 'Registro Federal de Contribuyentes',
            paisId: 'mexico',
            activo: true
          },
          {
            id: 'curp-mx',
            nombre: 'CURP',
            codigo: 'CURP',
            descripcion: 'Clave Única de Registro de Población',
            paisId: 'mexico',
            activo: true
          }
        ];
      default:
        return [
          {
            id: 'doc-default',
            nombre: 'Documento de Identidad',
            codigo: 'DI',
            descripcion: 'Documento de Identidad Genérico',
            paisId,
            activo: true
          },
          {
            id: 'tax-default',
            nombre: 'Identificación Fiscal',
            codigo: 'IF',
            descripcion: 'Identificación Fiscal Genérica',
            paisId,
            activo: true
          }
        ];
    }
  }

  // Datos mock para tipos de documento de factura
  static getMockTiposDocumentoFactura(paisId: string): TipoDocumentoFactura[] {
    switch (paisId) {
      case 'peru':
        return [
          {
            id: 'factura-pe',
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
            formato: 'F###-########'
          },
          {
            id: 'boleta-pe',
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
            formato: 'B###-########'
          },
          {
            id: 'nc-pe',
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
            formato: 'NC##-########'
          },
          {
            id: 'nd-pe',
            nombre: 'Nota de Débito',
            codigo: '08',
            descripcion: 'Nota de Débito Electrónica',
            paisId: 'peru',
            activo: true,
            requiereImpuesto: true,
            requiereCliente: true,
            afectaInventario: true,
            afectaContabilidad: true,
            prefijo: 'ND',
            formato: 'ND##-########'
          }
        ];
      case 'colombia':
        return [
          {
            id: 'factura-co',
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
            formato: 'FE##########'
          },
          {
            id: 'nc-co',
            nombre: 'Nota Crédito',
            codigo: 'NC',
            descripcion: 'Nota Crédito Electrónica',
            paisId: 'colombia',
            activo: true,
            requiereImpuesto: true,
            requiereCliente: true,
            afectaInventario: true,
            afectaContabilidad: true,
            prefijo: 'NC',
            formato: 'NC##########'
          }
        ];
      default:
        return [
          {
            id: 'factura-default',
            nombre: 'Factura',
            codigo: 'F',
            descripcion: 'Factura Genérica',
            paisId,
            activo: true,
            requiereImpuesto: true,
            requiereCliente: true,
            afectaInventario: true,
            afectaContabilidad: true,
            prefijo: 'F',
            formato: 'F-########'
          },
          {
            id: 'nc-default',
            nombre: 'Nota de Crédito',
            codigo: 'NC',
            descripcion: 'Nota de Crédito Genérica',
            paisId,
            activo: true,
            requiereImpuesto: true,
            requiereCliente: true,
            afectaInventario: true,
            afectaContabilidad: true,
            prefijo: 'NC',
            formato: 'NC-########'
          }
        ];
    }
  }

  // Datos mock para tipos de impuesto
  static getMockTiposImpuesto(paisId: string): TipoImpuesto[] {
    switch (paisId) {
      case 'peru':
        return [
          {
            id: 'igv-pe',
            nombre: 'IGV',
            codigo: 'IGV',
            porcentaje: 18,
            tipo: 'IGV',
            paisId: 'peru',
            activo: true
          },
          {
            id: 'isc-pe',
            nombre: 'ISC',
            codigo: 'ISC',
            porcentaje: 10,
            tipo: 'OTRO',
            paisId: 'peru',
            activo: true
          }
        ];
      case 'colombia':
        return [
          {
            id: 'iva-co',
            nombre: 'IVA',
            codigo: 'IVA',
            porcentaje: 19,
            tipo: 'IVA',
            paisId: 'colombia',
            activo: true
          },
          {
            id: 'ica-co',
            nombre: 'ICA',
            codigo: 'ICA',
            porcentaje: 0.7,
            tipo: 'OTRO',
            paisId: 'colombia',
            activo: true
          }
        ];
      case 'mexico':
        return [
          {
            id: 'iva-mx',
            nombre: 'IVA',
            codigo: 'IVA',
            porcentaje: 16,
            tipo: 'IVA',
            paisId: 'mexico',
            activo: true
          },
          {
            id: 'ieps-mx',
            nombre: 'IEPS',
            codigo: 'IEPS',
            porcentaje: 8,
            tipo: 'OTRO',
            paisId: 'mexico',
            activo: true
          }
        ];
      default:
        return [
          {
            id: 'iva-default',
            nombre: 'IVA',
            codigo: 'IVA',
            porcentaje: 20,
            tipo: 'IVA',
            paisId,
            activo: true
          }
        ];
    }
  }

  // Datos mock para formas de pago
  static getMockFormasPago(paisId: string): FormaPago[] {
    return [
      {
        id: 'efectivo',
        nombre: 'Efectivo',
        codigo: 'EFE',
        descripcion: 'Pago en efectivo',
        paisId,
        activo: true,
        requiereBanco: false,
        requiereReferencia: false,
        requiereFecha: false
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
        requiereFecha: true
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
        requiereFecha: true
      },
      {
        id: 'tarjeta',
        nombre: 'Tarjeta de Crédito/Débito',
        codigo: 'TAR',
        descripcion: 'Pago con tarjeta de crédito o débito',
        paisId,
        activo: true,
        requiereBanco: true,
        requiereReferencia: true,
        requiereFecha: false
      }
    ];
  }

  // Datos mock para tipos de movimiento de tesorería
  static getMockTiposMovimientoTesoreria(paisId: string): TipoMovimientoTesoreria[] {
    return [
      {
        id: 'ingreso',
        nombre: 'Ingreso',
        codigo: 'ING',
        descripcion: 'Ingreso de dinero',
        paisId,
        activo: true,
        afectaSaldo: true,
        requiereReferencia: false
      },
      {
        id: 'egreso',
        nombre: 'Egreso',
        codigo: 'EGR',
        descripcion: 'Egreso de dinero',
        paisId,
        activo: true,
        afectaSaldo: true,
        requiereReferencia: false
      },
      {
        id: 'transferencia',
        nombre: 'Transferencia',
        codigo: 'TRA',
        descripcion: 'Transferencia entre cuentas',
        paisId,
        activo: true,
        afectaSaldo: true,
        requiereReferencia: false
      },
      {
        id: 'cobro-cliente',
        nombre: 'Cobro a Cliente',
        codigo: 'COB',
        descripcion: 'Cobro de factura a cliente',
        paisId,
        activo: true,
        afectaSaldo: true,
        requiereReferencia: true,
        requiereDocumento: true
      },
      {
        id: 'pago-proveedor',
        nombre: 'Pago a Proveedor',
        codigo: 'PAG',
        descripcion: 'Pago de factura a proveedor',
        paisId,
        activo: true,
        afectaSaldo: true,
        requiereReferencia: true,
        requiereDocumento: true
      }
    ];
  }

  // Datos mock para tipos de moneda
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
            esPrincipal: true
          },
          {
            id: 'usd-pe',
            nombre: 'Dólar Estadounidense',
            codigo: 'USD',
            simbolo: '$',
            paisId: 'peru',
            activo: true,
            esPrincipal: false
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
            esPrincipal: true
          },
          {
            id: 'usd-co',
            nombre: 'Dólar Estadounidense',
            codigo: 'USD',
            simbolo: 'US$',
            paisId: 'colombia',
            activo: true,
            esPrincipal: false
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
            esPrincipal: true
          },
          {
            id: 'usd-mx',
            nombre: 'Dólar Estadounidense',
            codigo: 'USD',
            simbolo: 'US$',
            paisId: 'mexico',
            activo: true,
            esPrincipal: false
          }
        ];
      default:
        return [
          {
            id: 'local',
            nombre: 'Moneda Local',
            codigo: 'LOC',
            simbolo: '$',
            paisId,
            activo: true,
            esPrincipal: true
          },
          {
            id: 'usd-default',
            nombre: 'Dólar Estadounidense',
            codigo: 'USD',
            simbolo: 'US$',
            paisId,
            activo: true,
            esPrincipal: false
          }
        ];
    }
  }

  // Datos mock para bancos
  static getMockBancos(paisId: string): Banco[] {
    switch (paisId) {
      case 'peru':
        return [
          {
            id: 'bcp',
            nombre: 'Banco de Crédito del Perú',
            codigo: 'BCP',
            paisId: 'peru',
            activo: true
          },
          {
            id: 'bbva',
            nombre: 'BBVA',
            codigo: 'BBVA',
            paisId: 'peru',
            activo: true
          },
          {
            id: 'interbank',
            nombre: 'Interbank',
            codigo: 'IBK',
            paisId: 'peru',
            activo: true
          },
          {
            id: 'scotiabank',
            nombre: 'Scotiabank',
            codigo: 'SBP',
            paisId: 'peru',
            activo: true
          }
        ];
      case 'colombia':
        return [
          {
            id: 'bancolombia',
            nombre: 'Bancolombia',
            codigo: 'BCO',
            paisId: 'colombia',
            activo: true
          },
          {
            id: 'davivienda',
            nombre: 'Davivienda',
            codigo: 'DAV',
            paisId: 'colombia',
            activo: true
          },
          {
            id: 'bbva-co',
            nombre: 'BBVA Colombia',
            codigo: 'BBVA',
            paisId: 'colombia',
            activo: true
          }
        ];
      case 'mexico':
        return [
          {
            id: 'banamex',
            nombre: 'Citibanamex',
            codigo: 'BANA',
            paisId: 'mexico',
            activo: true
          },
          {
            id: 'bbva-mx',
            nombre: 'BBVA México',
            codigo: 'BBVA',
            paisId: 'mexico',
            activo: true
          },
          {
            id: 'banorte',
            nombre: 'Banorte',
            codigo: 'BNT',
            paisId: 'mexico',
            activo: true
          }
        ];
      default:
        return [
          {
            id: 'banco1',
            nombre: 'Banco Principal',
            codigo: 'BP',
            paisId,
            activo: true
          },
          {
            id: 'banco2',
            nombre: 'Banco Secundario',
            codigo: 'BS',
            paisId,
            activo: true
          }
        ];
    }
  }

  // Inicializar nomencladores para un país
  static async inicializarNomencladores(paisId: string): Promise<void> {
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
        return;
      }
      
      // Obtener datos mock
      const tiposDocIdentidad = this.getMockTiposDocumentoIdentidad(paisId);
      const tiposDocFactura = this.getMockTiposDocumentoFactura(paisId);
      const tiposImpuesto = this.getMockTiposImpuesto(paisId);
      const formasPago = this.getMockFormasPago(paisId);
      const tiposMovimiento = this.getMockTiposMovimientoTesoreria(paisId);
      const tiposMoneda = this.getMockTiposMoneda(paisId);
      const bancos = this.getMockBancos(paisId);
      
      // Insertar datos
      for (const tipo of tiposDocIdentidad) {
        await this.crearTipoDocumentoIdentidad({
          nombre: tipo.nombre,
          codigo: tipo.codigo,
          descripcion: tipo.descripcion,
          paisId: tipo.paisId,
          activo: tipo.activo
        });
      }
      
      for (const tipo of tiposDocFactura) {
        await this.crearTipoDocumentoFactura({
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
        });
      }
      
      for (const tipo of tiposImpuesto) {
        await this.crearTipoImpuesto({
          nombre: tipo.nombre,
          codigo: tipo.codigo,
          porcentaje: tipo.porcentaje,
          tipo: tipo.tipo,
          paisId: tipo.paisId,
          activo: tipo.activo
        });
      }
      
      for (const forma of formasPago) {
        await this.crearFormaPago({
          nombre: forma.nombre,
          codigo: forma.codigo,
          descripcion: forma.descripcion,
          paisId: forma.paisId,
          activo: forma.activo,
          requiereBanco: forma.requiereBanco,
          requiereReferencia: forma.requiereReferencia,
          requiereFecha: forma.requiereFecha
        });
      }
      
      for (const tipo of tiposMovimiento) {
        await this.crearTipoMovimientoTesoreria({
          nombre: tipo.nombre,
          codigo: tipo.codigo,
          descripcion: tipo.descripcion,
          paisId: tipo.paisId,
          activo: tipo.activo,
          afectaSaldo: tipo.afectaSaldo,
          requiereReferencia: tipo.requiereReferencia,
          requiereDocumento: tipo.requiereDocumento
        });
      }
      
      for (const tipo of tiposMoneda) {
        await this.crearTipoMoneda({
          nombre: tipo.nombre,
          codigo: tipo.codigo,
          simbolo: tipo.simbolo,
          paisId: tipo.paisId,
          activo: tipo.activo,
          esPrincipal: tipo.esPrincipal
        });
      }
      
      for (const banco of bancos) {
        await this.crearBanco({
          nombre: banco.nombre,
          codigo: banco.codigo,
          paisId: banco.paisId,
          activo: banco.activo
        });
      }
      
      console.log(`✅ Nomencladores inicializados correctamente para país ${paisId}`);
    } catch (error) {
      console.error('❌ Error inicializando nomencladores:', error);
      throw error;
    }
  }
}