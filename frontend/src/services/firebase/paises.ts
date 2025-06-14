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
import { Pais, ConfiguracionTributaria } from '../../types';

export class PaisesService {
  // Obtener todos los países activos (versión expandida)
  static async getPaisesActivos(): Promise<Pais[]> {
    try {
      // Intentar obtener países desde Firebase
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (isAuth) {
        console.log('🔍 Obteniendo países desde Firebase');
        
        const paisesRef = collection(db, 'paises');
        const q = query(paisesRef, where('activo', '==', true));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const paises = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            fechaCreacion: doc.data().fechaCreacion?.toDate() || new Date()
          })) as Pais[];
          
          console.log(`✅ Se encontraron ${paises.length} países en Firebase`);
          return paises;
        }
      }
      
      // Si no hay países en Firebase o no se pudo autenticar, devolver datos mock
      console.log('⚠️ Usando datos mock de países');
      
      // Mock de países con configuración completa para toda Latinoamérica
      const paisesMock: Pais[] = [
        {
          id: 'peru',
          nombre: 'Perú',
          codigo: 'PE',
          codigoISO: 'PER',
          monedaPrincipal: 'PEN',
          simboloMoneda: 'S/',
          formatoFecha: 'DD/MM/YYYY',
          separadorDecimal: '.',
          separadorMiles: ',',
          configuracionTributaria: {
            tiposDocumento: [
              { id: 'dni', nombre: 'DNI', codigo: '01', descripcion: 'Documento Nacional de Identidad', activo: true },
              { id: 'ruc', nombre: 'RUC', codigo: '06', descripcion: 'Registro Único de Contribuyentes', activo: true }
            ],
            impuestos: [
              { id: 'igv', nombre: 'IGV', codigo: '1000', porcentaje: 18, tipo: 'IGV', activo: true }
            ],
            regimenesTributarios: [
              { id: 'general', nombre: 'Régimen General', descripcion: 'Régimen General del Impuesto a la Renta', activo: true },
              { id: 'mype', nombre: 'Régimen MYPE Tributario', descripcion: 'Régimen MYPE Tributario', activo: true }
            ],
            formatoNumeroIdentificacion: '###########',
            longitudNumeroIdentificacion: 11,
            validacionNumeroIdentificacion: '^[0-9]{11}$'
          },
          planContableBase: 'pcge_peru',
          activo: true,
          fechaCreacion: new Date()
        },
        {
          id: 'colombia',
          nombre: 'Colombia',
          codigo: 'CO',
          codigoISO: 'COL',
          monedaPrincipal: 'COP',
          simboloMoneda: '$',
          formatoFecha: 'DD/MM/YYYY',
          separadorDecimal: ',',
          separadorMiles: '.',
          configuracionTributaria: {
            tiposDocumento: [
              { id: 'cc', nombre: 'Cédula de Ciudadanía', codigo: '13', descripcion: 'Cédula de Ciudadanía', activo: true },
              { id: 'nit', nombre: 'NIT', codigo: '31', descripcion: 'Número de Identificación Tributaria', activo: true }
            ],
            impuestos: [
              { id: 'iva', nombre: 'IVA', codigo: '01', porcentaje: 19, tipo: 'IVA', activo: true }
            ],
            regimenesTributarios: [
              { id: 'comun', nombre: 'Régimen Común', descripcion: 'Régimen Común', activo: true },
              { id: 'simplificado', nombre: 'Régimen Simplificado', descripcion: 'Régimen Simplificado', activo: true }
            ],
            formatoNumeroIdentificacion: '##########-#',
            longitudNumeroIdentificacion: 10,
            validacionNumeroIdentificacion: '^[0-9]{8,10}$'
          },
          planContableBase: 'puc_colombia',
          activo: true,
          fechaCreacion: new Date()
        },
        {
          id: 'mexico',
          nombre: 'México',
          codigo: 'MX',
          codigoISO: 'MEX',
          monedaPrincipal: 'MXN',
          simboloMoneda: '$',
          formatoFecha: 'DD/MM/YYYY',
          separadorDecimal: '.',
          separadorMiles: ',',
          configuracionTributaria: {
            tiposDocumento: [
              { id: 'rfc', nombre: 'RFC', codigo: 'RFC', descripcion: 'Registro Federal de Contribuyentes', activo: true }
            ],
            impuestos: [
              { id: 'iva', nombre: 'IVA', codigo: '002', porcentaje: 16, tipo: 'IVA', activo: true }
            ],
            regimenesTributarios: [
              { id: 'general', nombre: 'Régimen General', descripcion: 'Régimen General de Ley', activo: true },
              { id: 'incorporacion_fiscal', nombre: 'Régimen de Incorporación Fiscal', descripcion: 'Régimen de Incorporación Fiscal', activo: true }
            ],
            formatoNumeroIdentificacion: 'AAAA######AAA',
            longitudNumeroIdentificacion: 13,
            validacionNumeroIdentificacion: '^[A-Z]{4}[0-9]{6}[A-Z0-9]{3}$'
          },
          planContableBase: 'pcg_mexico',
          activo: true,
          fechaCreacion: new Date()
        },
        {
          id: 'argentina',
          nombre: 'Argentina',
          codigo: 'AR',
          codigoISO: 'ARG',
          monedaPrincipal: 'ARS',
          simboloMoneda: '$',
          formatoFecha: 'DD/MM/YYYY',
          separadorDecimal: ',',
          separadorMiles: '.',
          configuracionTributaria: {
            tiposDocumento: [
              { id: 'cuit', nombre: 'CUIT', codigo: '80', descripcion: 'Clave Única de Identificación Tributaria', activo: true },
              { id: 'cuil', nombre: 'CUIL', codigo: '86', descripcion: 'Código Único de Identificación Laboral', activo: true }
            ],
            impuestos: [
              { id: 'iva', nombre: 'IVA', codigo: '5', porcentaje: 21, tipo: 'IVA', activo: true }
            ],
            regimenesTributarios: [
              { id: 'general', nombre: 'Régimen General', descripcion: 'Régimen General', activo: true },
              { id: 'monotributo', nombre: 'Monotributo', descripcion: 'Régimen Simplificado para Pequeños Contribuyentes', activo: true }
            ],
            formatoNumeroIdentificacion: '##-########-#',
            longitudNumeroIdentificacion: 11,
            validacionNumeroIdentificacion: '^[0-9]{11}$'
          },
          planContableBase: 'pcg_argentina',
          activo: true,
          fechaCreacion: new Date()
        },
        {
          id: 'chile',
          nombre: 'Chile',
          codigo: 'CL',
          codigoISO: 'CHL',
          monedaPrincipal: 'CLP',
          simboloMoneda: '$',
          formatoFecha: 'DD/MM/YYYY',
          separadorDecimal: ',',
          separadorMiles: '.',
          configuracionTributaria: {
            tiposDocumento: [
              { id: 'rut', nombre: 'RUT', codigo: 'RUT', descripcion: 'Rol Único Tributario', activo: true }
            ],
            impuestos: [
              { id: 'iva', nombre: 'IVA', codigo: '14', porcentaje: 19, tipo: 'IVA', activo: true }
            ],
            regimenesTributarios: [
              { id: 'primera_categoria', nombre: 'Primera Categoría', descripcion: 'Impuesto de Primera Categoría', activo: true },
              { id: 'pro_pyme', nombre: 'Régimen Pro PyME', descripcion: 'Régimen Tributario Simplificado', activo: true }
            ],
            formatoNumeroIdentificacion: '########-#',
            longitudNumeroIdentificacion: 9,
            validacionNumeroIdentificacion: '^[0-9]{7,8}-[0-9K]$'
          },
          planContableBase: 'pcg_chile',
          activo: true,
          fechaCreacion: new Date()
        }
      ];
      
      // Intentar guardar los países mock en Firebase si estamos autenticados
      if (isAuth) {
        try {
          console.log('🔄 Intentando guardar países mock en Firebase...');
          const batch = writeBatch(db);
          const paisesRef = collection(db, 'paises');
          
          for (const pais of paisesMock) {
            const paisRef = doc(paisesRef, pais.id);
            batch.set(paisRef, {
              ...pais,
              fechaCreacion: Timestamp.now()
            });
          }
          
          await batch.commit();
          console.log('✅ Países mock guardados exitosamente en Firebase');
        } catch (saveError) {
          console.error('❌ Error guardando países mock en Firebase:', saveError);
          // Continuar con los datos mock aunque falle el guardado
        }
      }
      
      return paisesMock;
    } catch (error) {
      console.error('Error obteniendo países:', error);
      return [];
    }
  }

  // Obtener país por ID (versión mock)
  static async getPais(paisId: string): Promise<Pais | null> {
    try {
      // Intentar obtener país desde Firebase
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (isAuth) {
        console.log(`🔍 Buscando país ${paisId} en Firebase`);
        
        const paisRef = doc(db, 'paises', paisId);
        const paisDoc = await getDoc(paisRef);
        
        if (paisDoc.exists()) {
          const paisData = paisDoc.data();
          console.log(`✅ País ${paisId} encontrado en Firebase`);
          
          return {
            id: paisDoc.id,
            ...paisData,
            fechaCreacion: paisData.fechaCreacion?.toDate() || new Date()
          } as Pais;
        }
      }
      
      // Si no se encuentra en Firebase, buscar en datos mock
      console.log(`⚠️ Buscando país ${paisId} en datos mock`);
      const paises = await this.getPaisesActivos();
      const pais = paises.find(p => p.id === paisId);
      
      if (pais) {
        console.log(`✅ País ${paisId} encontrado en datos mock`);
        
        // Intentar guardar el país en Firebase si estamos autenticados
        if (isAuth) {
          try {
            console.log(`🔄 Guardando país ${paisId} en Firebase...`);
            const paisRef = doc(db, 'paises', paisId);
            await setDoc(paisRef, {
              ...pais,
              fechaCreacion: Timestamp.now()
            });
            console.log(`✅ País ${paisId} guardado exitosamente en Firebase`);
          } catch (saveError) {
            console.error(`❌ Error guardando país ${paisId} en Firebase:`, saveError);
            // Continuar con el país mock aunque falle el guardado
          }
        }
      } else {
        console.log(`❌ País ${paisId} no encontrado`);
      }
      
      return pais || null;
    } catch (error) {
      console.error('Error obteniendo país:', error);
      return null;
    }
  }

  // Obtener país por código (versión mock)
  static async getPaisPorCodigo(codigo: string): Promise<Pais | null> {
    try {
      const paises = await this.getPaisesActivos();
      return paises.find(p => p.codigo === codigo.toUpperCase()) || null;
    } catch (error) {
      console.error('Error obteniendo país por código:', error);
      return null;
    }
  }

  // Crear nuevo país en Firebase
  static async crearPais(paisData: Omit<Pais, 'fechaCreacion'>): Promise<string> {
    try {
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }
      
      console.log(`🔄 Creando nuevo país: ${paisData.nombre}`);
      
      // Verificar si ya existe un país con el mismo ID
      const paisRef = doc(db, 'paises', paisData.id);
      const paisDoc = await getDoc(paisRef);
      
      if (paisDoc.exists()) {
        throw new Error(`Ya existe un país con el ID ${paisData.id}`);
      }
      
      // Crear país
      await setDoc(paisRef, {
        ...paisData,
        fechaCreacion: Timestamp.now()
      });
      
      console.log(`✅ País ${paisData.nombre} creado exitosamente con ID: ${paisData.id}`);
      return paisData.id;
    } catch (error) {
      console.error('❌ Error creando país:', error);
      throw error;
    }
  }

  // Validar número de identificación según país (versión mock)
  static validarNumeroIdentificacion(paisId: string, numero: string, pais: Pais): boolean {
    try {
      if (!pais.configuracionTributaria.validacionNumeroIdentificacion) {
        return true; // Si no hay validación específica, aceptar
      }

      const regex = new RegExp(pais.configuracionTributaria.validacionNumeroIdentificacion);
      return regex.test(numero);
    } catch (error) {
      console.error('Error validando número de identificación:', error);
      return false;
    }
  }

  // Formatear moneda según país (versión mock)
  static formatearMoneda(cantidad: number, paisId: string, pais: Pais): string {
    try {
      const opciones: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: pais.monedaPrincipal,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      };

      // Configurar separadores según el país
      const locale = this.getLocaleFromPais(pais.codigo);
      return new Intl.NumberFormat(locale, opciones).format(cantidad);
    } catch (error) {
      console.error('Error formateando moneda:', error);
      return `${pais.simboloMoneda} ${cantidad.toFixed(2)}`;
    }
  }

  // Obtener locale para formateo (versión expandida)
  static getLocaleFromPais(codigoPais: string): string {
    const locales: { [key: string]: string } = {
      'PE': 'es-PE',
      'CO': 'es-CO',
      'MX': 'es-MX',
      'AR': 'es-AR',
      'CL': 'es-CL',
      'EC': 'es-EC',
      'BO': 'es-BO',
      'UY': 'es-UY',
      'PY': 'es-PY',
      'VE': 'es-VE'
    };

    return locales[codigoPais] || 'es-ES';
  }

  // Obtener configuración tributaria por país (versión mock)
  static async getConfiguracionTributaria(paisId: string): Promise<ConfiguracionTributaria | null> {
    try {
      const pais = await this.getPais(paisId);
      return pais?.configuracionTributaria || null;
    } catch (error) {
      console.error('Error obteniendo configuración tributaria:', error);
      return null;
    }
  }
}