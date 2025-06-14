import { createClient } from '@supabase/supabase-js';
import { Pais } from '../../types';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export class SupabasePaisesService {
  // Get all active countries
  static async getPaisesActivos(): Promise<Pais[]> {
    try {
      console.log('🔍 Obteniendo países activos desde Supabase');
      
      const { data, error } = await supabase
        .from('paises')
        .select('*')
        .eq('activo', true);
      
      if (error) throw error;
      
      const paises = data.map(item => ({
        id: item.id,
        nombre: item.nombre,
        codigo: item.codigo,
        codigoISO: item.codigo_iso,
        monedaPrincipal: item.moneda_principal,
        simboloMoneda: item.simbolo_moneda,
        formatoFecha: item.formato_fecha || 'DD/MM/YYYY',
        separadorDecimal: item.separador_decimal || '.',
        separadorMiles: item.separador_miles || ',',
        configuracionTributaria: {
          tiposDocumento: [],
          impuestos: [],
          regimenesTributarios: [],
          formatoNumeroIdentificacion: '',
          longitudNumeroIdentificacion: 0
        },
        planContableBase: item.plan_contable_base || '',
        activo: item.activo,
        fechaCreacion: new Date(item.created_at)
      }));
      
      console.log(`✅ Se encontraron ${paises.length} países activos`);
      return paises;
    } catch (error) {
      console.error('❌ Error obteniendo países:', error);
      
      // Return mock data if there's an error
      return this.getMockPaises();
    }
  }

  // Get country by ID
  static async getPais(paisId: string): Promise<Pais | null> {
    try {
      console.log(`🔍 Buscando país ${paisId} en Supabase`);
      
      const { data, error } = await supabase
        .from('paises')
        .select('*')
        .eq('id', paisId)
        .single();
      
      if (error) throw error;
      
      if (!data) {
        console.log(`❌ País ${paisId} no encontrado`);
        return null;
      }
      
      const pais: Pais = {
        id: data.id,
        nombre: data.nombre,
        codigo: data.codigo,
        codigoISO: data.codigo_iso,
        monedaPrincipal: data.moneda_principal,
        simboloMoneda: data.simbolo_moneda,
        formatoFecha: data.formato_fecha || 'DD/MM/YYYY',
        separadorDecimal: data.separador_decimal || '.',
        separadorMiles: data.separador_miles || ',',
        configuracionTributaria: {
          tiposDocumento: [],
          impuestos: [],
          regimenesTributarios: [],
          formatoNumeroIdentificacion: '',
          longitudNumeroIdentificacion: 0
        },
        planContableBase: data.plan_contable_base || '',
        activo: data.activo,
        fechaCreacion: new Date(data.created_at)
      };
      
      console.log(`✅ País ${paisId} encontrado`);
      return pais;
    } catch (error) {
      console.error(`❌ Error obteniendo país ${paisId}:`, error);
      
      // Try to get from mock data
      const mockPaises = this.getMockPaises();
      const mockPais = mockPaises.find(p => p.id === paisId);
      
      return mockPais || null;
    }
  }

  // Create a new country
  static async crearPais(paisData: Omit<Pais, 'fechaCreacion'>): Promise<string> {
    try {
      console.log(`🔄 Creando nuevo país: ${paisData.nombre}`);
      
      // Convert to snake_case for database
      const dbData = {
        id: paisData.id,
        nombre: paisData.nombre,
        codigo: paisData.codigo,
        codigo_iso: paisData.codigoISO,
        moneda_principal: paisData.monedaPrincipal,
        simbolo_moneda: paisData.simboloMoneda,
        formato_fecha: paisData.formatoFecha || 'DD/MM/YYYY',
        separador_decimal: paisData.separadorDecimal || '.',
        separador_miles: paisData.separadorMiles || ',',
        plan_contable_base: paisData.planContableBase || '',
        activo: paisData.activo !== false
      };
      
      const { data, error } = await supabase
        .from('paises')
        .insert([dbData])
        .select();
      
      if (error) throw error;
      
      console.log(`✅ País ${paisData.nombre} creado exitosamente con ID: ${data[0].id}`);
      return data[0].id;
    } catch (error) {
      console.error('❌ Error creando país:', error);
      throw error;
    }
  }

  // Update a country
  static async actualizarPais(paisId: string, datos: Partial<Pais>): Promise<void> {
    try {
      console.log(`🔄 Actualizando país ${paisId}`);
      
      // Convert to snake_case for database
      const dbData: any = {};
      
      if (datos.nombre) dbData.nombre = datos.nombre;
      if (datos.codigo) dbData.codigo = datos.codigo;
      if (datos.codigoISO) dbData.codigo_iso = datos.codigoISO;
      if (datos.monedaPrincipal) dbData.moneda_principal = datos.monedaPrincipal;
      if (datos.simboloMoneda) dbData.simbolo_moneda = datos.simboloMoneda;
      if (datos.formatoFecha) dbData.formato_fecha = datos.formatoFecha;
      if (datos.separadorDecimal) dbData.separador_decimal = datos.separadorDecimal;
      if (datos.separadorMiles) dbData.separador_miles = datos.separadorMiles;
      if (datos.planContableBase) dbData.plan_contable_base = datos.planContableBase;
      if (datos.activo !== undefined) dbData.activo = datos.activo;
      
      // Add updated_at
      dbData.updated_at = new Date();
      
      const { error } = await supabase
        .from('paises')
        .update(dbData)
        .eq('id', paisId);
      
      if (error) throw error;
      
      console.log(`✅ País ${paisId} actualizado correctamente`);
    } catch (error) {
      console.error(`❌ Error actualizando país ${paisId}:`, error);
      throw error;
    }
  }

  // Format currency according to country
  static formatearMoneda(cantidad: number, paisId: string, pais: Pais): string {
    try {
      const opciones: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: pais.monedaPrincipal,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      };

      // Configure separators according to the country
      const locale = this.getLocaleFromPais(pais.codigo);
      return new Intl.NumberFormat(locale, opciones).format(cantidad);
    } catch (error) {
      console.error('Error formatting currency:', error);
      return `${pais.simboloMoneda} ${cantidad.toFixed(2)}`;
    }
  }

  // Get locale for formatting
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

  // Mock data for countries
  private static getMockPaises(): Pais[] {
    return [
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
          tiposDocumento: [],
          impuestos: [],
          regimenesTributarios: [],
          formatoNumeroIdentificacion: '',
          longitudNumeroIdentificacion: 0
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
          tiposDocumento: [],
          impuestos: [],
          regimenesTributarios: [],
          formatoNumeroIdentificacion: '',
          longitudNumeroIdentificacion: 0
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
          tiposDocumento: [],
          impuestos: [],
          regimenesTributarios: [],
          formatoNumeroIdentificacion: '',
          longitudNumeroIdentificacion: 0
        },
        planContableBase: 'pcg_mexico',
        activo: true,
        fechaCreacion: new Date()
      }
    ];
  }
}