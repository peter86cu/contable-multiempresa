import { createClient } from '@supabase/supabase-js';
import { 
  TipoDocumentoIdentidad, 
  TipoDocumentoFactura,
  TipoImpuesto,
  FormaPago,
  TipoMovimientoTesoreria,
  TipoMoneda,
  Banco
} from '../../types/nomencladores';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export class SupabaseNomencladoresService {
  // Get all nomencladores for a country
  static async getNomencladoresByPais(paisId: string): Promise<{
    tiposDocumentoIdentidad: TipoDocumentoIdentidad[];
    tiposDocumentoFactura: TipoDocumentoFactura[];
    tiposImpuesto: TipoImpuesto[];
    formasPago: FormaPago[];
    tiposMovimientoTesoreria: TipoMovimientoTesoreria[];
    tiposMoneda: TipoMoneda[];
    bancos: Banco[];
  }> {
    try {
      console.log(`🔍 Obteniendo nomencladores para país: ${paisId}`);
      
      // Fetch all types of nomencladores in parallel
      const [
        tiposDocIdentidad,
        tiposDocFactura,
        tiposImp,
        formasDePago,
        tiposMovTesoreria,
        tiposMon,
        bancosData
      ] = await Promise.all([
        this.getTiposDocumentoIdentidad(paisId),
        this.getTiposDocumentoFactura(paisId),
        this.getTiposImpuesto(paisId),
        this.getFormasPago(paisId),
        this.getTiposMovimientoTesoreria(paisId),
        this.getTiposMoneda(paisId),
        this.getBancos(paisId)
      ]);
      
      return {
        tiposDocumentoIdentidad: tiposDocIdentidad,
        tiposDocumentoFactura: tiposDocFactura,
        tiposImpuesto: tiposImp,
        formasPago: formasDePago,
        tiposMovimientoTesoreria: tiposMovTesoreria,
        tiposMoneda: tiposMon,
        bancos: bancosData
      };
    } catch (error) {
      console.error('❌ Error obteniendo nomencladores:', error);
      throw error;
    }
  }

  // Get identity document types
  static async getTiposDocumentoIdentidad(paisId: string): Promise<TipoDocumentoIdentidad[]> {
    try {
      const { data, error } = await supabase
        .from('tipos_documento_identidad')
        .select('*')
        .eq('pais_id', paisId);
      
      if (error) throw error;
      
      return data.map(item => ({
        id: item.id,
        nombre: item.nombre,
        codigo: item.codigo,
        descripcion: item.descripcion || '',
        paisId: item.pais_id,
        activo: item.activo
      }));
    } catch (error) {
      console.error('Error obteniendo tipos de documento de identidad:', error);
      return [];
    }
  }

  // Get invoice document types
  static async getTiposDocumentoFactura(paisId: string): Promise<TipoDocumentoFactura[]> {
    try {
      const { data, error } = await supabase
        .from('tipos_documento_factura')
        .select('*')
        .eq('pais_id', paisId);
      
      if (error) throw error;
      
      return data.map(item => ({
        id: item.id,
        nombre: item.nombre,
        codigo: item.codigo,
        descripcion: item.descripcion || '',
        paisId: item.pais_id,
        activo: item.activo,
        requiereImpuesto: item.requiere_impuesto,
        requiereCliente: item.requiere_cliente,
        afectaInventario: item.afecta_inventario,
        afectaContabilidad: item.afecta_contabilidad,
        prefijo: item.prefijo || '',
        formato: item.formato || ''
      }));
    } catch (error) {
      console.error('Error obteniendo tipos de documento de factura:', error);
      return [];
    }
  }

  // Get tax types
  static async getTiposImpuesto(paisId: string): Promise<TipoImpuesto[]> {
    try {
      const { data, error } = await supabase
        .from('tipos_impuesto')
        .select('*')
        .eq('pais_id', paisId);
      
      if (error) throw error;
      
      return data.map(item => ({
        id: item.id,
        nombre: item.nombre,
        codigo: item.codigo,
        porcentaje: item.porcentaje,
        tipo: item.tipo,
        paisId: item.pais_id,
        activo: item.activo,
        cuentaContableId: item.cuenta_contable_id
      }));
    } catch (error) {
      console.error('Error obteniendo tipos de impuesto:', error);
      return [];
    }
  }

  // Get payment methods
  static async getFormasPago(paisId: string): Promise<FormaPago[]> {
    try {
      const { data, error } = await supabase
        .from('formas_pago')
        .select('*')
        .eq('pais_id', paisId);
      
      if (error) throw error;
      
      return data.map(item => ({
        id: item.id,
        nombre: item.nombre,
        codigo: item.codigo,
        descripcion: item.descripcion || '',
        paisId: item.pais_id,
        activo: item.activo,
        requiereBanco: item.requiere_banco,
        requiereReferencia: item.requiere_referencia,
        requiereFecha: item.requiere_fecha
      }));
    } catch (error) {
      console.error('Error obteniendo formas de pago:', error);
      return [];
    }
  }

  // Get treasury movement types
  static async getTiposMovimientoTesoreria(paisId: string): Promise<TipoMovimientoTesoreria[]> {
    try {
      const { data, error } = await supabase
        .from('tipos_movimiento_tesoreria')
        .select('*')
        .eq('pais_id', paisId);
      
      if (error) throw error;
      
      return data.map(item => ({
        id: item.id,
        nombre: item.nombre,
        codigo: item.codigo,
        descripcion: item.descripcion || '',
        paisId: item.pais_id,
        activo: item.activo,
        afectaSaldo: item.afecta_saldo,
        requiereReferencia: item.requiere_referencia,
        requiereDocumento: item.requiere_documento
      }));
    } catch (error) {
      console.error('Error obteniendo tipos de movimiento de tesorería:', error);
      return [];
    }
  }

  // Get currency types
  static async getTiposMoneda(paisId: string): Promise<TipoMoneda[]> {
    try {
      const { data, error } = await supabase
        .from('tipos_moneda')
        .select('*')
        .eq('pais_id', paisId);
      
      if (error) throw error;
      
      return data.map(item => ({
        id: item.id,
        nombre: item.nombre,
        codigo: item.codigo,
        simbolo: item.simbolo,
        paisId: item.pais_id,
        activo: item.activo,
        esPrincipal: item.es_principal
      }));
    } catch (error) {
      console.error('Error obteniendo tipos de moneda:', error);
      return [];
    }
  }

  // Get banks
  static async getBancos(paisId: string): Promise<Banco[]> {
    try {
      const { data, error } = await supabase
        .from('bancos')
        .select('*')
        .eq('pais_id', paisId);
      
      if (error) throw error;
      
      return data.map(item => ({
        id: item.id,
        nombre: item.nombre,
        codigo: item.codigo,
        paisId: item.pais_id,
        activo: item.activo
      }));
    } catch (error) {
      console.error('Error obteniendo bancos:', error);
      return [];
    }
  }

  // Create a new nomenclador
  static async createNomenclador(tipo: string, data: any): Promise<string> {
    try {
      console.log(`📝 Creando nuevo ${tipo}:`, data);
      
      // Convert camelCase to snake_case for database
      const dbData = this.convertToSnakeCase(data);
      
      const { data: result, error } = await supabase
        .from(tipo)
        .insert([dbData])
        .select();
      
      if (error) throw error;
      
      console.log(`✅ ${tipo} creado con ID: ${result[0].id}`);
      return result[0].id;
    } catch (error) {
      console.error(`❌ Error creando ${tipo}:`, error);
      throw error;
    }
  }

  // Update a nomenclador
  static async updateNomenclador(tipo: string, id: string, data: any): Promise<void> {
    try {
      console.log(`🔄 Actualizando ${tipo} ${id}:`, data);
      
      // Convert camelCase to snake_case for database
      const dbData = this.convertToSnakeCase(data);
      
      // Add updated_at
      dbData.updated_at = new Date();
      
      const { error } = await supabase
        .from(tipo)
        .update(dbData)
        .eq('id', id);
      
      if (error) throw error;
      
      console.log(`✅ ${tipo} actualizado correctamente`);
    } catch (error) {
      console.error(`❌ Error actualizando ${tipo}:`, error);
      throw error;
    }
  }

  // Delete a nomenclador
  static async deleteNomenclador(tipo: string, id: string): Promise<void> {
    try {
      console.log(`🗑️ Eliminando ${tipo} ${id}`);
      
      const { error } = await supabase
        .from(tipo)
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      console.log(`✅ ${tipo} eliminado correctamente`);
    } catch (error) {
      console.error(`❌ Error eliminando ${tipo}:`, error);
      throw error;
    }
  }

  // Initialize nomencladores for a country
  static async initializeNomencladores(paisId: string): Promise<boolean> {
    try {
      console.log(`🔄 Inicializando nomencladores para país: ${paisId}`);
      
      // Check if nomencladores already exist
      const { data: existingData, error: checkError } = await supabase
        .from('tipos_documento_identidad')
        .select('id')
        .eq('pais_id', paisId)
        .limit(1);
      
      if (checkError) throw checkError;
      
      if (existingData && existingData.length > 0) {
        console.log(`⚠️ Ya existen nomencladores para el país ${paisId}`);
        return false;
      }
      
      // Get default nomencladores for the country
      const defaultNomencladores = this.getDefaultNomencladores(paisId);
      
      // Insert all nomencladores in parallel
      await Promise.all([
        this.insertBatch('tipos_documento_identidad', defaultNomencladores.tiposDocumentoIdentidad),
        this.insertBatch('tipos_documento_factura', defaultNomencladores.tiposDocumentoFactura),
        this.insertBatch('tipos_impuesto', defaultNomencladores.tiposImpuesto),
        this.insertBatch('formas_pago', defaultNomencladores.formasPago),
        this.insertBatch('tipos_movimiento_tesoreria', defaultNomencladores.tiposMovimientoTesoreria),
        this.insertBatch('tipos_moneda', defaultNomencladores.tiposMoneda),
        this.insertBatch('bancos', defaultNomencladores.bancos)
      ]);
      
      console.log(`✅ Nomencladores inicializados correctamente para país ${paisId}`);
      return true;
    } catch (error) {
      console.error('❌ Error inicializando nomencladores:', error);
      throw error;
    }
  }

  // Insert batch of nomencladores
  private static async insertBatch(table: string, items: any[]): Promise<void> {
    if (!items || items.length === 0) return;
    
    try {
      // Convert camelCase to snake_case for database
      const dbItems = items.map(item => this.convertToSnakeCase(item));
      
      const { error } = await supabase
        .from(table)
        .insert(dbItems);
      
      if (error) throw error;
      
      console.log(`✅ Insertados ${items.length} registros en ${table}`);
    } catch (error) {
      console.error(`❌ Error insertando en ${table}:`, error);
      throw error;
    }
  }

  // Convert camelCase to snake_case
  private static convertToSnakeCase(data: any): any {
    const result: any = {};
    
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        // Convert camelCase to snake_case
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        result[snakeKey] = data[key];
      }
    }
    
    return result;
  }

  // Get default nomencladores for a country
  private static getDefaultNomencladores(paisId: string): {
    tiposDocumentoIdentidad: TipoDocumentoIdentidad[];
    tiposDocumentoFactura: TipoDocumentoFactura[];
    tiposImpuesto: TipoImpuesto[];
    formasPago: FormaPago[];
    tiposMovimientoTesoreria: TipoMovimientoTesoreria[];
    tiposMoneda: TipoMoneda[];
    bancos: Banco[];
  } {
    // Default nomencladores for Peru
    if (paisId === 'peru') {
      return {
        tiposDocumentoIdentidad: [
          { id: '', nombre: 'DNI', codigo: '1', descripcion: 'Documento Nacional de Identidad', paisId, activo: true },
          { id: '', nombre: 'RUC', codigo: '6', descripcion: 'Registro Único de Contribuyentes', paisId, activo: true },
          { id: '', nombre: 'Pasaporte', codigo: '7', descripcion: 'Pasaporte', paisId, activo: true },
          { id: '', nombre: 'Carnet de Extranjería', codigo: '4', descripcion: 'Carnet de Extranjería', paisId, activo: true }
        ],
        tiposDocumentoFactura: [
          { id: '', nombre: 'Factura', codigo: '01', descripcion: 'Factura Electrónica', paisId, activo: true, requiereImpuesto: true, requiereCliente: true, afectaInventario: true, afectaContabilidad: true, prefijo: 'F', formato: 'F###-########' },
          { id: '', nombre: 'Boleta', codigo: '03', descripcion: 'Boleta de Venta Electrónica', paisId, activo: true, requiereImpuesto: true, requiereCliente: false, afectaInventario: true, afectaContabilidad: true, prefijo: 'B', formato: 'B###-########' },
          { id: '', nombre: 'Nota de Crédito', codigo: '07', descripcion: 'Nota de Crédito Electrónica', paisId, activo: true, requiereImpuesto: true, requiereCliente: true, afectaInventario: true, afectaContabilidad: true, prefijo: 'NC', formato: 'NC##-########' },
          { id: '', nombre: 'Nota de Débito', codigo: '08', descripcion: 'Nota de Débito Electrónica', paisId, activo: true, requiereImpuesto: true, requiereCliente: true, afectaInventario: true, afectaContabilidad: true, prefijo: 'ND', formato: 'ND##-########' }
        ],
        tiposImpuesto: [
          { id: '', nombre: 'IGV', codigo: 'IGV', porcentaje: 18, tipo: 'IGV', paisId, activo: true },
          { id: '', nombre: 'ISC', codigo: 'ISC', porcentaje: 10, tipo: 'ISC', paisId, activo: true },
          { id: '', nombre: 'Exonerado', codigo: 'EXO', porcentaje: 0, tipo: 'OTRO', paisId, activo: true }
        ],
        formasPago: [
          { id: '', nombre: 'Efectivo', codigo: 'EFE', descripcion: 'Pago en efectivo', paisId, activo: true, requiereBanco: false, requiereReferencia: false, requiereFecha: false },
          { id: '', nombre: 'Transferencia', codigo: 'TRA', descripcion: 'Transferencia bancaria', paisId, activo: true, requiereBanco: true, requiereReferencia: true, requiereFecha: true },
          { id: '', nombre: 'Cheque', codigo: 'CHE', descripcion: 'Pago con cheque', paisId, activo: true, requiereBanco: true, requiereReferencia: true, requiereFecha: true },
          { id: '', nombre: 'Tarjeta de Crédito', codigo: 'TCR', descripcion: 'Pago con tarjeta de crédito', paisId, activo: true, requiereBanco: false, requiereReferencia: true, requiereFecha: false },
          { id: '', nombre: 'Tarjeta de Débito', codigo: 'TDE', descripcion: 'Pago con tarjeta de débito', paisId, activo: true, requiereBanco: false, requiereReferencia: true, requiereFecha: false }
        ],
        tiposMovimientoTesoreria: [
          { id: '', nombre: 'Ingreso', codigo: 'ING', descripcion: 'Ingreso de dinero', paisId, activo: true, afectaSaldo: true, requiereReferencia: false },
          { id: '', nombre: 'Egreso', codigo: 'EGR', descripcion: 'Egreso de dinero', paisId, activo: true, afectaSaldo: true, requiereReferencia: false },
          { id: '', nombre: 'Transferencia', codigo: 'TRA', descripcion: 'Transferencia entre cuentas', paisId, activo: true, afectaSaldo: true, requiereReferencia: false }
        ],
        tiposMoneda: [
          { id: '', nombre: 'Sol Peruano', codigo: 'PEN', simbolo: 'S/', paisId, activo: true, esPrincipal: true },
          { id: '', nombre: 'Dólar Americano', codigo: 'USD', simbolo: '$', paisId, activo: true, esPrincipal: false },
          { id: '', nombre: 'Euro', codigo: 'EUR', simbolo: '€', paisId, activo: true, esPrincipal: false }
        ],
        bancos: [
          { id: '', nombre: 'BCP', codigo: 'BCP', paisId, activo: true },
          { id: '', nombre: 'BBVA', codigo: 'BBVA', paisId, activo: true },
          { id: '', nombre: 'Interbank', codigo: 'IBK', paisId, activo: true },
          { id: '', nombre: 'Scotiabank', codigo: 'SBP', paisId, activo: true }
        ]
      };
    }
    
    // Default nomencladores for Colombia
    if (paisId === 'colombia') {
      return {
        tiposDocumentoIdentidad: [
          { id: '', nombre: 'Cédula de Ciudadanía', codigo: 'CC', descripcion: 'Cédula de Ciudadanía', paisId, activo: true },
          { id: '', nombre: 'NIT', codigo: 'NIT', descripcion: 'Número de Identificación Tributaria', paisId, activo: true },
          { id: '', nombre: 'Pasaporte', codigo: 'PA', descripcion: 'Pasaporte', paisId, activo: true },
          { id: '', nombre: 'Cédula de Extranjería', codigo: 'CE', descripcion: 'Cédula de Extranjería', paisId, activo: true }
        ],
        tiposDocumentoFactura: [
          { id: '', nombre: 'Factura Electrónica', codigo: 'FE', descripcion: 'Factura Electrónica', paisId, activo: true, requiereImpuesto: true, requiereCliente: true, afectaInventario: true, afectaContabilidad: true, prefijo: 'FE', formato: 'FE##########' },
          { id: '', nombre: 'Nota Crédito', codigo: 'NC', descripcion: 'Nota Crédito', paisId, activo: true, requiereImpuesto: true, requiereCliente: true, afectaInventario: true, afectaContabilidad: true, prefijo: 'NC', formato: 'NC##########' },
          { id: '', nombre: 'Nota Débito', codigo: 'ND', descripcion: 'Nota Débito', paisId, activo: true, requiereImpuesto: true, requiereCliente: true, afectaInventario: true, afectaContabilidad: true, prefijo: 'ND', formato: 'ND##########' }
        ],
        tiposImpuesto: [
          { id: '', nombre: 'IVA 19%', codigo: 'IVA19', porcentaje: 19, tipo: 'IVA', paisId, activo: true },
          { id: '', nombre: 'IVA 5%', codigo: 'IVA5', porcentaje: 5, tipo: 'IVA', paisId, activo: true },
          { id: '', nombre: 'Exento', codigo: 'EXE', porcentaje: 0, tipo: 'OTRO', paisId, activo: true }
        ],
        formasPago: [
          { id: '', nombre: 'Efectivo', codigo: 'EFE', descripcion: 'Pago en efectivo', paisId, activo: true, requiereBanco: false, requiereReferencia: false, requiereFecha: false },
          { id: '', nombre: 'Transferencia', codigo: 'TRA', descripcion: 'Transferencia bancaria', paisId, activo: true, requiereBanco: true, requiereReferencia: true, requiereFecha: true },
          { id: '', nombre: 'Cheque', codigo: 'CHE', descripcion: 'Pago con cheque', paisId, activo: true, requiereBanco: true, requiereReferencia: true, requiereFecha: true },
          { id: '', nombre: 'Tarjeta de Crédito', codigo: 'TCR', descripcion: 'Pago con tarjeta de crédito', paisId, activo: true, requiereBanco: false, requiereReferencia: true, requiereFecha: false }
        ],
        tiposMovimientoTesoreria: [
          { id: '', nombre: 'Ingreso', codigo: 'ING', descripcion: 'Ingreso de dinero', paisId, activo: true, afectaSaldo: true, requiereReferencia: false },
          { id: '', nombre: 'Egreso', codigo: 'EGR', descripcion: 'Egreso de dinero', paisId, activo: true, afectaSaldo: true, requiereReferencia: false },
          { id: '', nombre: 'Transferencia', codigo: 'TRA', descripcion: 'Transferencia entre cuentas', paisId, activo: true, afectaSaldo: true, requiereReferencia: false }
        ],
        tiposMoneda: [
          { id: '', nombre: 'Peso Colombiano', codigo: 'COP', simbolo: '$', paisId, activo: true, esPrincipal: true },
          { id: '', nombre: 'Dólar Americano', codigo: 'USD', simbolo: 'US$', paisId, activo: true, esPrincipal: false }
        ],
        bancos: [
          { id: '', nombre: 'Bancolombia', codigo: 'BCO', paisId, activo: true },
          { id: '', nombre: 'Banco de Bogotá', codigo: 'BBO', paisId, activo: true },
          { id: '', nombre: 'Davivienda', codigo: 'DAV', paisId, activo: true }
        ]
      };
    }
    
    // Default nomencladores for Mexico
    if (paisId === 'mexico') {
      return {
        tiposDocumentoIdentidad: [
          { id: '', nombre: 'RFC', codigo: 'RFC', descripcion: 'Registro Federal de Contribuyentes', paisId, activo: true },
          { id: '', nombre: 'CURP', codigo: 'CURP', descripcion: 'Clave Única de Registro de Población', paisId, activo: true },
          { id: '', nombre: 'INE', codigo: 'INE', descripcion: 'Instituto Nacional Electoral', paisId, activo: true }
        ],
        tiposDocumentoFactura: [
          { id: '', nombre: 'CFDI', codigo: 'CFDI', descripcion: 'Comprobante Fiscal Digital por Internet', paisId, activo: true, requiereImpuesto: true, requiereCliente: true, afectaInventario: true, afectaContabilidad: true, prefijo: 'CFDI', formato: 'CFDI-########' },
          { id: '', nombre: 'Nota de Crédito', codigo: 'NC', descripcion: 'Nota de Crédito', paisId, activo: true, requiereImpuesto: true, requiereCliente: true, afectaInventario: true, afectaContabilidad: true, prefijo: 'NC', formato: 'NC-########' }
        ],
        tiposImpuesto: [
          { id: '', nombre: 'IVA 16%', codigo: 'IVA16', porcentaje: 16, tipo: 'IVA', paisId, activo: true },
          { id: '', nombre: 'IVA 0%', codigo: 'IVA0', porcentaje: 0, tipo: 'IVA', paisId, activo: true },
          { id: '', nombre: 'IEPS', codigo: 'IEPS', porcentaje: 8, tipo: 'OTRO', paisId, activo: true }
        ],
        formasPago: [
          { id: '', nombre: 'Efectivo', codigo: '01', descripcion: 'Pago en efectivo', paisId, activo: true, requiereBanco: false, requiereReferencia: false, requiereFecha: false },
          { id: '', nombre: 'Transferencia', codigo: '03', descripcion: 'Transferencia bancaria', paisId, activo: true, requiereBanco: true, requiereReferencia: true, requiereFecha: true },
          { id: '', nombre: 'Tarjeta de Crédito', codigo: '04', descripcion: 'Pago con tarjeta de crédito', paisId, activo: true, requiereBanco: false, requiereReferencia: true, requiereFecha: false }
        ],
        tiposMovimientoTesoreria: [
          { id: '', nombre: 'Ingreso', codigo: 'ING', descripcion: 'Ingreso de dinero', paisId, activo: true, afectaSaldo: true, requiereReferencia: false },
          { id: '', nombre: 'Egreso', codigo: 'EGR', descripcion: 'Egreso de dinero', paisId, activo: true, afectaSaldo: true, requiereReferencia: false },
          { id: '', nombre: 'Transferencia', codigo: 'TRA', descripcion: 'Transferencia entre cuentas', paisId, activo: true, afectaSaldo: true, requiereReferencia: false }
        ],
        tiposMoneda: [
          { id: '', nombre: 'Peso Mexicano', codigo: 'MXN', simbolo: '$', paisId, activo: true, esPrincipal: true },
          { id: '', nombre: 'Dólar Americano', codigo: 'USD', simbolo: 'US$', paisId, activo: true, esPrincipal: false }
        ],
        bancos: [
          { id: '', nombre: 'BBVA México', codigo: 'BBVA', paisId, activo: true },
          { id: '', nombre: 'Banorte', codigo: 'BNO', paisId, activo: true },
          { id: '', nombre: 'Santander', codigo: 'SAN', paisId, activo: true }
        ]
      };
    }
    
    // For other countries, return empty arrays
    return {
      tiposDocumentoIdentidad: [],
      tiposDocumentoFactura: [],
      tiposImpuesto: [],
      formasPago: [],
      tiposMovimientoTesoreria: [],
      tiposMoneda: [],
      bancos: []
    };
  }
}