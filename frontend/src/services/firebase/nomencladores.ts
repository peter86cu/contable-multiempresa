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
  setDoc,
  writeBatch
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
      
      // Usar query simple para evitar problemas de índices
      const q = query(tiposDocRef, where('paisId', '==', paisId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log('⚠️ No se encontraron tipos de documento de identidad, usando datos mock');
        return this.getMockTiposDocumentoIdentidad(paisId);
      }
      
      const tiposDoc = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TipoDocumentoIdentidad[];
      
      // Ordenar en el cliente para evitar problemas de índices
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

  static async crearTipoDocumentoIdentidad(tipo: Omit<TipoDocumentoIdentidad, 'id'>): Promise<string> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }

      console.log('📝 Creando nuevo tipo de documento de identidad:', tipo.nombre);
      
      const tiposDocRef = collection(db, 'tiposDocumentoIdentidad');
      const docRef = await addDoc(tiposDocRef, {
        ...tipo,
        fechaCreacion: Timestamp.now()
      });
      
      console.log(`✅ Tipo de documento de identidad creado con ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creando tipo de documento de identidad:', error);
      throw error;
    }
  }

  static async actualizarTipoDocumentoIdentidad(id: string, datos: Partial<TipoDocumentoIdentidad>): Promise<void> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }

      console.log(`🔄 Actualizando tipo de documento de identidad ${id}`);
      
      const tipoDocRef = doc(db, 'tiposDocumentoIdentidad', id);
      await setDoc(tipoDocRef, {
        ...datos,
        fechaModificacion: Timestamp.now()
      }, { merge: true });
      
      console.log('✅ Tipo de documento de identidad actualizado correctamente');
    } catch (error) {
      console.error('❌ Error actualizando tipo de documento de identidad:', error);
      throw error;
    }
  }

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
      
      // Usar query simple para evitar problemas de índices
      const q = query(tiposDocRef, where('paisId', '==', paisId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log('⚠️ No se encontraron tipos de documento de factura, usando datos mock');
        return this.getMockTiposDocumentoFactura(paisId);
      }
      
      const tiposDoc = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TipoDocumentoFactura[];
      
      // Ordenar en el cliente para evitar problemas de índices
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

  static async crearTipoDocumentoFactura(tipo: Omit<TipoDocumentoFactura, 'id'>): Promise<string> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }

      console.log('📝 Creando nuevo tipo de documento de factura:', tipo.nombre);
      
      const tiposDocRef = collection(db, 'tiposDocumentoFactura');
      const docRef = await addDoc(tiposDocRef, {
        ...tipo,
        fechaCreacion: Timestamp.now()
      });
      
      console.log(`✅ Tipo de documento de factura creado con ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creando tipo de documento de factura:', error);
      throw error;
    }
  }

  static async actualizarTipoDocumentoFactura(id: string, datos: Partial<TipoDocumentoFactura>): Promise<void> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }

      console.log(`🔄 Actualizando tipo de documento de factura ${id}`);
      
      const tipoDocRef = doc(db, 'tiposDocumentoFactura', id);
      await setDoc(tipoDocRef, {
        ...datos,
        fechaModificacion: Timestamp.now()
      }, { merge: true });
      
      console.log('✅ Tipo de documento de factura actualizado correctamente');
    } catch (error) {
      console.error('❌ Error actualizando tipo de documento de factura:', error);
      throw error;
    }
  }

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
      
      // Usar query simple para evitar problemas de índices
      const q = query(tiposImpuestoRef, where('paisId', '==', paisId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log('⚠️ No se encontraron tipos de impuesto, usando datos mock');
        return this.getMockTiposImpuesto(paisId);
      }
      
      const tiposImpuesto = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TipoImpuesto[];
      
      // Ordenar en el cliente para evitar problemas de índices
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

  static async crearTipoImpuesto(tipo: Omit<TipoImpuesto, 'id'>): Promise<string> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }

      console.log('📝 Creando nuevo tipo de impuesto:', tipo.nombre);
      
      const tiposImpuestoRef = collection(db, 'tiposImpuesto');
      const docRef = await addDoc(tiposImpuestoRef, {
        ...tipo,
        fechaCreacion: Timestamp.now()
      });
      
      console.log(`✅ Tipo de impuesto creado con ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creando tipo de impuesto:', error);
      throw error;
    }
  }

  static async actualizarTipoImpuesto(id: string, datos: Partial<TipoImpuesto>): Promise<void> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }

      console.log(`🔄 Actualizando tipo de impuesto ${id}`);
      
      const tipoImpuestoRef = doc(db, 'tiposImpuesto', id);
      await setDoc(tipoImpuestoRef, {
        ...datos,
        fechaModificacion: Timestamp.now()
      }, { merge: true });
      
      console.log('✅ Tipo de impuesto actualizado correctamente');
    } catch (error) {
      console.error('❌ Error actualizando tipo de impuesto:', error);
      throw error;
    }
  }

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
      
      // Usar query simple para evitar problemas de índices
      const q = query(formasPagoRef, where('paisId', '==', paisId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log('⚠️ No se encontraron formas de pago, usando datos mock');
        return this.getMockFormasPago(paisId);
      }
      
      const formasPago = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FormaPago[];
      
      // Ordenar en el cliente para evitar problemas de índices
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

  static async crearFormaPago(forma: Omit<FormaPago, 'id'>): Promise<string> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }

      console.log('📝 Creando nueva forma de pago:', forma.nombre);
      
      const formasPagoRef = collection(db, 'formasPago');
      const docRef = await addDoc(formasPagoRef, {
        ...forma,
        fechaCreacion: Timestamp.now()
      });
      
      console.log(`✅ Forma de pago creada con ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creando forma de pago:', error);
      throw error;
    }
  }

  static async actualizarFormaPago(id: string, datos: Partial<FormaPago>): Promise<void> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }

      console.log(`🔄 Actualizando forma de pago ${id}`);
      
      const formaPagoRef = doc(db, 'formasPago', id);
      await setDoc(formaPagoRef, {
        ...datos,
        fechaModificacion: Timestamp.now()
      }, { merge: true });
      
      console.log('✅ Forma de pago actualizada correctamente');
    } catch (error) {
      console.error('❌ Error actualizando forma de pago:', error);
      throw error;
    }
  }

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
      
      // Usar query simple para evitar problemas de índices
      const q = query(tiposMovimientoRef, where('paisId', '==', paisId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log('⚠️ No se encontraron tipos de movimiento de tesorería, usando datos mock');
        return this.getMockTiposMovimientoTesoreria(paisId);
      }
      
      const tiposMovimiento = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TipoMovimientoTesoreria[];
      
      // Ordenar en el cliente para evitar problemas de índices
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

  static async crearTipoMovimientoTesoreria(tipo: Omit<TipoMovimientoTesoreria, 'id'>): Promise<string> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }

      console.log('📝 Creando nuevo tipo de movimiento de tesorería:', tipo.nombre);
      
      const tiposMovimientoRef = collection(db, 'tiposMovimientoTesoreria');
      const docRef = await addDoc(tiposMovimientoRef, {
        ...tipo,
        fechaCreacion: Timestamp.now()
      });
      
      console.log(`✅ Tipo de movimiento de tesorería creado con ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creando tipo de movimiento de tesorería:', error);
      throw error;
    }
  }

  static async actualizarTipoMovimientoTesoreria(id: string, datos: Partial<TipoMovimientoTesoreria>): Promise<void> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }

      console.log(`🔄 Actualizando tipo de movimiento de tesorería ${id}`);
      
      const tipoMovimientoRef = doc(db, 'tiposMovimientoTesoreria', id);
      await setDoc(tipoMovimientoRef, {
        ...datos,
        fechaModificacion: Timestamp.now()
      }, { merge: true });
      
      console.log('✅ Tipo de movimiento de tesorería actualizado correctamente');
    } catch (error) {
      console.error('❌ Error actualizando tipo de movimiento de tesorería:', error);
      throw error;
    }
  }

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
      
      // Usar query simple para evitar problemas de índices
      const q = query(tiposMonedaRef, where('paisId', '==', paisId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log('⚠️ No se encontraron tipos de moneda, usando datos mock');
        return this.getMockTiposMoneda(paisId);
      }
      
      const tiposMoneda = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TipoMoneda[];
      
      // Ordenar en el cliente para evitar problemas de índices
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

  static async crearTipoMoneda(tipo: Omit<TipoMoneda, 'id'>): Promise<string> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }

      console.log('📝 Creando nuevo tipo de moneda:', tipo.nombre);
      
      const tiposMonedaRef = collection(db, 'tiposMoneda');
      const docRef = await addDoc(tiposMonedaRef, {
        ...tipo,
        fechaCreacion: Timestamp.now()
      });
      
      console.log(`✅ Tipo de moneda creado con ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creando tipo de moneda:', error);
      throw error;
    }
  }

  static async actualizarTipoMoneda(id: string, datos: Partial<TipoMoneda>): Promise<void> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }

      console.log(`🔄 Actualizando tipo de moneda ${id}`);
      
      const tipoMonedaRef = doc(db, 'tiposMoneda', id);
      await setDoc(tipoMonedaRef, {
        ...datos,
        fechaModificacion: Timestamp.now()
      }, { merge: true });
      
      console.log('✅ Tipo de moneda actualizado correctamente');
    } catch (error) {
      console.error('❌ Error actualizando tipo de moneda:', error);
      throw error;
    }
  }

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
      
      // Usar query simple para evitar problemas de índices
      const q = query(bancosRef, where('paisId', '==', paisId));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log('⚠️ No se encontraron bancos, usando datos mock');
        return this.getMockBancos(paisId);
      }
      
      const bancos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Banco[];
      
      // Ordenar en el cliente para evitar problemas de índices
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

  static async crearBanco(banco: Omit<Banco, 'id'>): Promise<string> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }

      console.log('📝 Creando nuevo banco:', banco.nombre);
      
      const bancosRef = collection(db, 'bancos');
      const docRef = await addDoc(bancosRef, {
        ...banco,
        fechaCreacion: Timestamp.now()
      });
      
      console.log(`✅ Banco creado con ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creando banco:', error);
      throw error;
    }
  }

  static async actualizarBanco(id: string, datos: Partial<Banco>): Promise<void> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }

      console.log(`🔄 Actualizando banco ${id}`);
      
      const bancoRef = doc(db, 'bancos', id);
      await setDoc(bancoRef, {
        ...datos,
        fechaModificacion: Timestamp.now()
      }, { merge: true });
      
      console.log('✅ Banco actualizado correctamente');
    } catch (error) {
      console.error('❌ Error actualizando banco:', error);
      throw error;
    }
  }

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
      console.log(`🔄 Inicializando nomencladores para país: ${paisId}`);
      
      // Verificar si ya existen nomencladores
      const tiposDocRef = collection(db, 'tiposDocumentoIdentidad');
      const q = query(tiposDocRef, where('paisId', '==', paisId));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        console.log(`✅ Ya existen nomencladores para el país ${paisId}`);
        return true;
      }
      
      // Crear batch para inserción masiva
      const batch = writeBatch(db);
      
      // 1. Insertar tipos de documento de identidad
      const tiposDocIdentidad = this.getMockTiposDocumentoIdentidad(paisId);
      
      console.log(`📝 Insertando ${tiposDocIdentidad.length} tipos de documento de identidad`);
      
      tiposDocIdentidad.forEach(tipo => {
        const docRef = doc(collection(db, 'tiposDocumentoIdentidad'));
        batch.set(docRef, {
          ...tipo,
          fechaCreacion: Timestamp.now()
        });
      });
      
      // 2. Insertar tipos de documento de factura
      const tiposDocFactura = this.getMockTiposDocumentoFactura(paisId);
      
      console.log(`📝 Insertando ${tiposDocFactura.length} tipos de documento de factura`);
      
      tiposDocFactura.forEach(tipo => {
        const docRef = doc(collection(db, 'tiposDocumentoFactura'));
        batch.set(docRef, {
          ...tipo,
          fechaCreacion: Timestamp.now()
        });
      });
      
      // 3. Insertar tipos de impuestos
      const tiposImpuesto = this.getMockTiposImpuesto(paisId);
      
      console.log(`📝 Insertando ${tiposImpuesto.length} tipos de impuesto`);
      
      tiposImpuesto.forEach(tipo => {
        const docRef = doc(collection(db, 'tiposImpuesto'));
        batch.set(docRef, {
          ...tipo,
          fechaCreacion: Timestamp.now()
        });
      });
      
      // 4. Insertar formas de pago
      const formasPago = this.getMockFormasPago(paisId);
      
      console.log(`📝 Insertando ${formasPago.length} formas de pago`);
      
      formasPago.forEach(forma => {
        const docRef = doc(collection(db, 'formasPago'));
        batch.set(docRef, {
          ...forma,
          fechaCreacion: Timestamp.now()
        });
      });
      
      // 5. Insertar tipos de movimiento de tesorería
      const tiposMovimiento = this.getMockTiposMovimientoTesoreria(paisId);
      
      console.log(`📝 Insertando ${tiposMovimiento.length} tipos de movimiento de tesorería`);
      
      tiposMovimiento.forEach(tipo => {
        const docRef = doc(collection(db, 'tiposMovimientoTesoreria'));
        batch.set(docRef, {
          ...tipo,
          fechaCreacion: Timestamp.now()
        });
      });
      
      // 6. Insertar tipos de moneda
      const tiposMoneda = this.getMockTiposMoneda(paisId);
      
      console.log(`📝 Insertando ${tiposMoneda.length} tipos de moneda`);
      
      tiposMoneda.forEach(tipo => {
        const docRef = doc(collection(db, 'tiposMoneda'));
        batch.set(docRef, {
          ...tipo,
          fechaCreacion: Timestamp.now()
        });
      });
      
      // 7. Insertar bancos
      const bancos = this.getMockBancos(paisId);
      
      console.log(`📝 Insertando ${bancos.length} bancos`);
      
      bancos.forEach(banco => {
        const docRef = doc(collection(db, 'bancos'));
        batch.set(docRef, {
          ...banco,
          fechaCreacion: Timestamp.now()
        });
      });
      
      // Ejecutar batch
      await batch.commit();
      
      console.log(`✅ Nomencladores inicializados exitosamente para país ${paisId}`);
      return true;
    } catch (error) {
      console.error('❌ Error inicializando nomencladores:', error);
      return false;
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
            activo: true
          },
          {
            id: 'ruc',
            nombre: 'RUC',
            codigo: '6',
            descripcion: 'Registro Único de Contribuyentes',
            paisId: 'peru',
            activo: true
          },
          {
            id: 'ce',
            nombre: 'Carnet de Extranjería',
            codigo: '4',
            descripcion: 'Carnet de Extranjería',
            paisId: 'peru',
            activo: true
          },
          {
            id: 'pasaporte',
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
            id: 'cc',
            nombre: 'Cédula de Ciudadanía',
            codigo: 'CC',
            descripcion: 'Cédula de Ciudadanía',
            paisId: 'colombia',
            activo: true
          },
          {
            id: 'nit',
            nombre: 'NIT',
            codigo: 'NIT',
            descripcion: 'Número de Identificación Tributaria',
            paisId: 'colombia',
            activo: true
          },
          {
            id: 'ce',
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
            id: 'rfc',
            nombre: 'RFC',
            codigo: 'RFC',
            descripcion: 'Registro Federal de Contribuyentes',
            paisId: 'mexico',
            activo: true
          },
          {
            id: 'curp',
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
            id: 'doc1',
            nombre: 'Documento de Identidad',
            codigo: '1',
            descripcion: 'Documento de Identidad',
            paisId,
            activo: true
          },
          {
            id: 'doc2',
            nombre: 'Documento Tributario',
            codigo: '2',
            descripcion: 'Documento Tributario',
            paisId,
            activo: true
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
            formato: 'F###-########'
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
            formato: 'B###-########'
          },
          {
            id: 'nc',
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
            id: 'nd',
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
            id: 'factura',
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
            formato: 'FE-########'
          },
          {
            id: 'nc',
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
            formato: 'NC-########'
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
            prefijo: 'CFDI',
            formato: 'CFDI-########'
          }
        ];
      default:
        return [
          {
            id: 'factura',
            nombre: 'Factura',
            codigo: '01',
            descripcion: 'Factura',
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
            id: 'nc',
            nombre: 'Nota de Crédito',
            codigo: '02',
            descripcion: 'Nota de Crédito',
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
            activo: true
          },
          {
            id: 'isc',
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
            id: 'iva',
            nombre: 'IVA',
            codigo: 'IVA',
            porcentaje: 19,
            tipo: 'IVA',
            paisId: 'colombia',
            activo: true
          },
          {
            id: 'iva-reducido',
            nombre: 'IVA Reducido',
            codigo: 'IVA-R',
            porcentaje: 5,
            tipo: 'IVA',
            paisId: 'colombia',
            activo: true
          }
        ];
      case 'mexico':
        return [
          {
            id: 'iva',
            nombre: 'IVA',
            codigo: 'IVA',
            porcentaje: 16,
            tipo: 'IVA',
            paisId: 'mexico',
            activo: true
          },
          {
            id: 'ieps',
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
            id: 'impuesto1',
            nombre: 'Impuesto General',
            codigo: 'IG',
            porcentaje: 15,
            tipo: 'IVA',
            paisId,
            activo: true
          },
          {
            id: 'impuesto2',
            nombre: 'Impuesto Reducido',
            codigo: 'IR',
            porcentaje: 5,
            tipo: 'IVA',
            paisId,
            activo: true
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
        id: 'tarjeta',
        nombre: 'Tarjeta de Crédito/Débito',
        codigo: 'TAR',
        descripcion: 'Pago con tarjeta de crédito o débito',
        paisId,
        activo: true,
        requiereBanco: true,
        requiereReferencia: true,
        requiereFecha: false
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
      }
    ];

    // Agregar formas de pago específicas por país
    switch (paisId) {
      case 'peru':
        return [
          ...formasPagoComunes,
          {
            id: 'yape',
            nombre: 'Yape',
            codigo: 'YAP',
            descripcion: 'Pago con Yape',
            paisId: 'peru',
            activo: true,
            requiereBanco: false,
            requiereReferencia: true,
            requiereFecha: false
          },
          {
            id: 'plin',
            nombre: 'Plin',
            codigo: 'PLI',
            descripcion: 'Pago con Plin',
            paisId: 'peru',
            activo: true,
            requiereBanco: false,
            requiereReferencia: true,
            requiereFecha: false
          }
        ];
      case 'colombia':
        return [
          ...formasPagoComunes,
          {
            id: 'nequi',
            nombre: 'Nequi',
            codigo: 'NEQ',
            descripcion: 'Pago con Nequi',
            paisId: 'colombia',
            activo: true,
            requiereBanco: false,
            requiereReferencia: true,
            requiereFecha: false
          }
        ];
      case 'mexico':
        return [
          ...formasPagoComunes,
          {
            id: 'codi',
            nombre: 'CoDi',
            codigo: 'COD',
            descripcion: 'Pago con CoDi',
            paisId: 'mexico',
            activo: true,
            requiereBanco: false,
            requiereReferencia: true,
            requiereFecha: false
          }
        ];
      default:
        return formasPagoComunes;
    }
  }

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
        requiereReferencia: true
      },
      {
        id: 'cobro',
        nombre: 'Cobro de Factura',
        codigo: 'COB',
        descripcion: 'Cobro de factura a cliente',
        paisId,
        activo: true,
        afectaSaldo: true,
        requiereReferencia: true,
        requiereDocumento: true
      },
      {
        id: 'pago',
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
            id: 'usd',
            nombre: 'Dólar Americano',
            codigo: 'USD',
            simbolo: '$',
            paisId: 'peru',
            activo: true,
            esPrincipal: false
          },
          {
            id: 'eur',
            nombre: 'Euro',
            codigo: 'EUR',
            simbolo: '€',
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
            id: 'usd',
            nombre: 'Dólar Americano',
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
            id: 'usd',
            nombre: 'Dólar Americano',
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
            id: 'moneda1',
            nombre: 'Moneda Principal',
            codigo: 'MP',
            simbolo: '$',
            paisId,
            activo: true,
            esPrincipal: true
          },
          {
            id: 'usd',
            nombre: 'Dólar Americano',
            codigo: 'USD',
            simbolo: 'US$',
            paisId,
            activo: true,
            esPrincipal: false
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
            id: 'bbva',
            nombre: 'BBVA Colombia',
            codigo: 'BBVA',
            paisId: 'colombia',
            activo: true
          }
        ];
      case 'mexico':
        return [
          {
            id: 'bbva',
            nombre: 'BBVA México',
            codigo: 'BBVA',
            paisId: 'mexico',
            activo: true
          },
          {
            id: 'banamex',
            nombre: 'Citibanamex',
            codigo: 'BANA',
            paisId: 'mexico',
            activo: true
          },
          {
            id: 'banorte',
            nombre: 'Banorte',
            codigo: 'BNO',
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
}