import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FirebaseAuthService } from '../../config/firebaseAuth';
import { AsientoContable, PlanCuenta } from '../../types';

// Tipos para los reportes
export interface BalanceGeneralData {
  activos: GrupoBalance[];
  pasivos: GrupoBalance[];
  patrimonio: GrupoBalance[];
  totalActivos: number;
  totalPasivos: number;
  totalPatrimonio: number;
  fechaGeneracion: Date;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface GrupoBalance {
  nombre: string;
  cuentas: CuentaBalance[];
  total: number;
}

export interface CuentaBalance {
  codigo: string;
  nombre: string;
  saldo: number;
}

export interface EstadoResultadosData {
  ingresos: GrupoResultado[];
  gastos: GrupoResultado[];
  totalIngresos: number;
  totalGastos: number;
  utilidadBruta: number;
  gastosOperativos: number;
  utilidadOperativa: number;
  otrosIngresos: number;
  otrosGastos: number;
  utilidadAntesImpuestos: number;
  impuestos: number;
  utilidadNeta: number;
  fechaGeneracion: Date;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface GrupoResultado {
  nombre: string;
  cuentas: CuentaResultado[];
  total: number;
}

export interface CuentaResultado {
  codigo: string;
  nombre: string;
  saldo: number;
}

export interface FlujoEfectivoData {
  operacion: GrupoFlujo[];
  inversion: GrupoFlujo[];
  financiamiento: GrupoFlujo[];
  totalOperacion: number;
  totalInversion: number;
  totalFinanciamiento: number;
  flujoPeriodo: number;
  saldoInicial: number;
  saldoFinal: number;
  fechaGeneracion: Date;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface GrupoFlujo {
  nombre: string;
  movimientos: MovimientoFlujo[];
  total: number;
}

export interface MovimientoFlujo {
  descripcion: string;
  monto: number;
  tipo: 'INGRESO' | 'EGRESO';
}

export class ReportesService {
  // Balance General
  static async generarBalanceGeneral(
    empresaId: string,
    fechaInicio?: string,
    fechaFin?: string
  ): Promise<BalanceGeneralData> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }

      console.log('🔄 Generando balance general para empresa:', empresaId);
      
      // Obtener todas las cuentas
      const cuentasRef = collection(db, 'empresas', empresaId, 'cuentas');
      const cuentasQuery = query(cuentasRef, where('activa', '==', true), orderBy('codigo'));
      const cuentasSnapshot = await getDocs(cuentasQuery);
      
      const cuentas = cuentasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PlanCuenta[];
      
      // Obtener asientos del período
      const asientosRef = collection(db, 'empresas', empresaId, 'asientos');
      let asientosQuery = query(
        asientosRef,
        where('estado', '==', 'confirmado')
      );
      
      if (fechaInicio) {
        asientosQuery = query(asientosQuery, where('fecha', '>=', fechaInicio));
      }
      
      if (fechaFin) {
        asientosQuery = query(asientosQuery, where('fecha', '<=', fechaFin));
      }
      
      const asientosSnapshot = await getDocs(asientosQuery);
      const asientos = asientosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AsientoContable[];
      
      // Calcular saldos por cuenta
      const saldosCuentas = new Map<string, number>();
      
      // Inicializar saldos
      cuentas.forEach(cuenta => {
        saldosCuentas.set(cuenta.id, 0);
      });
      
      // Procesar asientos
      asientos.forEach(asiento => {
        asiento.movimientos.forEach(movimiento => {
          const saldoActual = saldosCuentas.get(movimiento.cuentaId) || 0;
          const debe = movimiento.debito || 0;
          const haber = movimiento.credito || 0;
          
          saldosCuentas.set(movimiento.cuentaId, saldoActual + debe - haber);
        });
      });
      
      // Agrupar cuentas por tipo
      const activosCuentas: CuentaBalance[] = [];
      const pasivosCuentas: CuentaBalance[] = [];
      const patrimonioCuentas: CuentaBalance[] = [];
      
      cuentas.forEach(cuenta => {
        const saldo = saldosCuentas.get(cuenta.id) || 0;
        
        // Solo incluir cuentas con saldo
        if (saldo !== 0) {
          const cuentaBalance: CuentaBalance = {
            codigo: cuenta.codigo,
            nombre: cuenta.nombre,
            saldo: Math.abs(saldo) // Usar valor absoluto para presentación
          };
          
          switch (cuenta.tipo) {
            case 'ACTIVO':
              activosCuentas.push(cuentaBalance);
              break;
            case 'PASIVO':
              pasivosCuentas.push(cuentaBalance);
              break;
            case 'PATRIMONIO':
              patrimonioCuentas.push(cuentaBalance);
              break;
          }
        }
      });
      
      // Agrupar activos
      const activosGrupos: GrupoBalance[] = [
        {
          nombre: 'ACTIVO CORRIENTE',
          cuentas: activosCuentas.filter(c => c.codigo.startsWith('1')),
          total: activosCuentas.filter(c => c.codigo.startsWith('1')).reduce((sum, c) => sum + c.saldo, 0)
        },
        {
          nombre: 'ACTIVO NO CORRIENTE',
          cuentas: activosCuentas.filter(c => !c.codigo.startsWith('1')),
          total: activosCuentas.filter(c => !c.codigo.startsWith('1')).reduce((sum, c) => sum + c.saldo, 0)
        }
      ];
      
      // Agrupar pasivos
      const pasivosGrupos: GrupoBalance[] = [
        {
          nombre: 'PASIVO CORRIENTE',
          cuentas: pasivosCuentas.filter(c => c.codigo.startsWith('4')),
          total: pasivosCuentas.filter(c => c.codigo.startsWith('4')).reduce((sum, c) => sum + c.saldo, 0)
        },
        {
          nombre: 'PASIVO NO CORRIENTE',
          cuentas: pasivosCuentas.filter(c => !c.codigo.startsWith('4')),
          total: pasivosCuentas.filter(c => !c.codigo.startsWith('4')).reduce((sum, c) => sum + c.saldo, 0)
        }
      ];
      
      // Agrupar patrimonio
      const patrimonioGrupos: GrupoBalance[] = [
        {
          nombre: 'PATRIMONIO',
          cuentas: patrimonioCuentas,
          total: patrimonioCuentas.reduce((sum, c) => sum + c.saldo, 0)
        }
      ];
      
      // Calcular totales
      const totalActivos = activosGrupos.reduce((sum, g) => sum + g.total, 0);
      const totalPasivos = pasivosGrupos.reduce((sum, g) => sum + g.total, 0);
      const totalPatrimonio = patrimonioGrupos.reduce((sum, g) => sum + g.total, 0);
      
      // Crear balance general
      const balanceGeneral: BalanceGeneralData = {
        activos: activosGrupos,
        pasivos: pasivosGrupos,
        patrimonio: patrimonioGrupos,
        totalActivos,
        totalPasivos,
        totalPatrimonio,
        fechaGeneracion: new Date(),
        fechaInicio,
        fechaFin
      };
      
      console.log('✅ Balance general generado correctamente');
      return balanceGeneral;
    } catch (error) {
      console.error('Error generando balance general:', error);
      throw error;
    }
  }

  // Estado de Resultados
  static async generarEstadoResultados(
    empresaId: string,
    fechaInicio?: string,
    fechaFin?: string
  ): Promise<EstadoResultadosData> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }

      console.log('🔄 Generando estado de resultados para empresa:', empresaId);
      
      // Obtener todas las cuentas
      const cuentasRef = collection(db, 'empresas', empresaId, 'cuentas');
      const cuentasQuery = query(cuentasRef, where('activa', '==', true), orderBy('codigo'));
      const cuentasSnapshot = await getDocs(cuentasQuery);
      
      const cuentas = cuentasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PlanCuenta[];
      
      // Obtener asientos del período
      const asientosRef = collection(db, 'empresas', empresaId, 'asientos');
      let asientosQuery = query(
        asientosRef,
        where('estado', '==', 'confirmado')
      );
      
      if (fechaInicio) {
        asientosQuery = query(asientosQuery, where('fecha', '>=', fechaInicio));
      }
      
      if (fechaFin) {
        asientosQuery = query(asientosQuery, where('fecha', '<=', fechaFin));
      }
      
      const asientosSnapshot = await getDocs(asientosQuery);
      const asientos = asientosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AsientoContable[];
      
      // Calcular saldos por cuenta
      const saldosCuentas = new Map<string, number>();
      
      // Inicializar saldos
      cuentas.forEach(cuenta => {
        saldosCuentas.set(cuenta.id, 0);
      });
      
      // Procesar asientos
      asientos.forEach(asiento => {
        asiento.movimientos.forEach(movimiento => {
          const saldoActual = saldosCuentas.get(movimiento.cuentaId) || 0;
          const debe = movimiento.debito || 0;
          const haber = movimiento.credito || 0;
          
          saldosCuentas.set(movimiento.cuentaId, saldoActual + debe - haber);
        });
      });
      
      // Agrupar cuentas por tipo
      const ingresosCuentas: CuentaResultado[] = [];
      const gastosCuentas: CuentaResultado[] = [];
      
      cuentas.forEach(cuenta => {
        const saldo = saldosCuentas.get(cuenta.id) || 0;
        
        // Solo incluir cuentas con saldo
        if (saldo !== 0) {
          const cuentaResultado: CuentaResultado = {
            codigo: cuenta.codigo,
            nombre: cuenta.nombre,
            saldo: Math.abs(saldo) // Usar valor absoluto para presentación
          };
          
          if (cuenta.tipo === 'INGRESO') {
            ingresosCuentas.push(cuentaResultado);
          } else if (cuenta.tipo === 'GASTO') {
            gastosCuentas.push(cuentaResultado);
          }
        }
      });
      
      // Agrupar ingresos
      const ingresosOperacionales = ingresosCuentas.filter(c => c.codigo.startsWith('70'));
      const otrosIngresos = ingresosCuentas.filter(c => !c.codigo.startsWith('70'));
      
      const ingresosGrupos: GrupoResultado[] = [
        {
          nombre: 'INGRESOS OPERACIONALES',
          cuentas: ingresosOperacionales,
          total: ingresosOperacionales.reduce((sum, c) => sum + c.saldo, 0)
        },
        {
          nombre: 'OTROS INGRESOS',
          cuentas: otrosIngresos,
          total: otrosIngresos.reduce((sum, c) => sum + c.saldo, 0)
        }
      ];
      
      // Agrupar gastos
      const costoVentas = gastosCuentas.filter(c => c.codigo.startsWith('69'));
      const gastosOperativos = gastosCuentas.filter(c => 
        c.codigo.startsWith('62') || 
        c.codigo.startsWith('63') || 
        c.codigo.startsWith('65')
      );
      const gastosFinancieros = gastosCuentas.filter(c => c.codigo.startsWith('67'));
      const otrosGastos = gastosCuentas.filter(c => 
        !c.codigo.startsWith('69') && 
        !c.codigo.startsWith('62') && 
        !c.codigo.startsWith('63') && 
        !c.codigo.startsWith('65') && 
        !c.codigo.startsWith('67')
      );
      
      const gastosGrupos: GrupoResultado[] = [
        {
          nombre: 'COSTO DE VENTAS',
          cuentas: costoVentas,
          total: costoVentas.reduce((sum, c) => sum + c.saldo, 0)
        },
        {
          nombre: 'GASTOS OPERATIVOS',
          cuentas: gastosOperativos,
          total: gastosOperativos.reduce((sum, c) => sum + c.saldo, 0)
        },
        {
          nombre: 'GASTOS FINANCIEROS',
          cuentas: gastosFinancieros,
          total: gastosFinancieros.reduce((sum, c) => sum + c.saldo, 0)
        },
        {
          nombre: 'OTROS GASTOS',
          cuentas: otrosGastos,
          total: otrosGastos.reduce((sum, c) => sum + c.saldo, 0)
        }
      ];
      
      // Calcular totales
      const totalIngresos = ingresosGrupos.reduce((sum, g) => sum + g.total, 0);
      const totalGastos = gastosGrupos.reduce((sum, g) => sum + g.total, 0);
      const costoVentasTotal = costoVentas.reduce((sum, c) => sum + c.saldo, 0);
      const utilidadBruta = totalIngresos - costoVentasTotal;
      const gastosOperativosTotal = gastosOperativos.reduce((sum, c) => sum + c.saldo, 0);
      const utilidadOperativa = utilidadBruta - gastosOperativosTotal;
      const otrosIngresosTotal = otrosIngresos.reduce((sum, c) => sum + c.saldo, 0);
      const otrosGastosTotal = gastosFinancieros.reduce((sum, c) => sum + c.saldo, 0) + 
                              otrosGastos.reduce((sum, c) => sum + c.saldo, 0);
      const utilidadAntesImpuestos = utilidadOperativa + otrosIngresosTotal - otrosGastosTotal;
      
      // Estimar impuestos (30% de la utilidad antes de impuestos)
      const impuestos = utilidadAntesImpuestos > 0 ? utilidadAntesImpuestos * 0.3 : 0;
      const utilidadNeta = utilidadAntesImpuestos - impuestos;
      
      // Crear estado de resultados
      const estadoResultados: EstadoResultadosData = {
        ingresos: ingresosGrupos,
        gastos: gastosGrupos,
        totalIngresos,
        totalGastos,
        utilidadBruta,
        gastosOperativos: gastosOperativosTotal,
        utilidadOperativa,
        otrosIngresos: otrosIngresosTotal,
        otrosGastos: otrosGastosTotal,
        utilidadAntesImpuestos,
        impuestos,
        utilidadNeta,
        fechaGeneracion: new Date(),
        fechaInicio,
        fechaFin
      };
      
      console.log('✅ Estado de resultados generado correctamente');
      return estadoResultados;
    } catch (error) {
      console.error('Error generando estado de resultados:', error);
      throw error;
    }
  }

  // Flujo de Efectivo
  static async generarFlujoEfectivo(
    empresaId: string,
    fechaInicio?: string,
    fechaFin?: string
  ): Promise<FlujoEfectivoData> {
    try {
      // Asegurar autenticación
      const isAuth = await FirebaseAuthService.ensureAuthenticated();
      if (!isAuth) {
        throw new Error('No se pudo autenticar con Firebase');
      }

      console.log('🔄 Generando flujo de efectivo para empresa:', empresaId);
      
      // Obtener movimientos de tesorería
      const movimientosRef = collection(db, 'empresas', empresaId, 'movimientosTesoreria');
      let movimientosQuery = query(movimientosRef);
      
      if (fechaInicio) {
        movimientosQuery = query(movimientosQuery, where('fecha', '>=', fechaInicio));
      }
      
      if (fechaFin) {
        movimientosQuery = query(movimientosQuery, where('fecha', '<=', fechaFin));
      }
      
      const movimientosSnapshot = await getDocs(movimientosQuery);
      const movimientos = movimientosSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Obtener saldo inicial (movimientos antes del período)
      let saldoInicial = 0;
      if (fechaInicio) {
        const movimientosAnterioresQuery = query(
          movimientosRef,
          where('fecha', '<', fechaInicio)
        );
        
        const movimientosAnterioresSnapshot = await getDocs(movimientosAnterioresQuery);
        const movimientosAnteriores = movimientosAnterioresSnapshot.docs.map(doc => doc.data());
        
        // Calcular saldo inicial
        movimientosAnteriores.forEach(mov => {
          if (mov.tipo === 'INGRESO') {
            saldoInicial += mov.monto;
          } else if (mov.tipo === 'EGRESO') {
            saldoInicial -= mov.monto;
          }
          // Las transferencias no afectan el saldo total
        });
      }
      
      // Clasificar movimientos
      const movimientosOperacion: any[] = [];
      const movimientosInversion: any[] = [];
      const movimientosFinanciamiento: any[] = [];
      
      movimientos.forEach(mov => {
        // Clasificar según concepto y tipo
        const concepto = mov.concepto.toLowerCase();
        const movimientoFlujo: MovimientoFlujo = {
          descripcion: mov.concepto,
          monto: mov.monto,
          tipo: mov.tipo === 'INGRESO' ? 'INGRESO' : 'EGRESO'
        };
        
        if (
          concepto.includes('cobro') || 
          concepto.includes('venta') || 
          concepto.includes('cliente') ||
          concepto.includes('operativo')
        ) {
          movimientosOperacion.push(movimientoFlujo);
        } else if (
          concepto.includes('activo') || 
          concepto.includes('equipo') || 
          concepto.includes('inversion')
        ) {
          movimientosInversion.push(movimientoFlujo);
        } else if (
          concepto.includes('prestamo') || 
          concepto.includes('financiamiento') || 
          concepto.includes('dividendo')
        ) {
          movimientosFinanciamiento.push(movimientoFlujo);
        } else {
          // Por defecto, considerar como operación
          movimientosOperacion.push(movimientoFlujo);
        }
      });
      
      // Agrupar movimientos de operación
      const ingresosOperacionales = movimientosOperacion.filter(m => m.tipo === 'INGRESO');
      const egresosOperacionales = movimientosOperacion.filter(m => m.tipo === 'EGRESO');
      
      const operacionGrupos: GrupoFlujo[] = [
        {
          nombre: 'INGRESOS OPERACIONALES',
          movimientos: ingresosOperacionales,
          total: ingresosOperacionales.reduce((sum, m) => sum + m.monto, 0)
        },
        {
          nombre: 'EGRESOS OPERACIONALES',
          movimientos: egresosOperacionales,
          total: -egresosOperacionales.reduce((sum, m) => sum + m.monto, 0)
        }
      ];
      
      // Agrupar movimientos de inversión
      const ingresosInversion = movimientosInversion.filter(m => m.tipo === 'INGRESO');
      const egresosInversion = movimientosInversion.filter(m => m.tipo === 'EGRESO');
      
      const inversionGrupos: GrupoFlujo[] = [
        {
          nombre: 'INGRESOS DE INVERSIÓN',
          movimientos: ingresosInversion,
          total: ingresosInversion.reduce((sum, m) => sum + m.monto, 0)
        },
        {
          nombre: 'EGRESOS DE INVERSIÓN',
          movimientos: egresosInversion,
          total: -egresosInversion.reduce((sum, m) => sum + m.monto, 0)
        }
      ];
      
      // Agrupar movimientos de financiamiento
      const ingresosFinanciamiento = movimientosFinanciamiento.filter(m => m.tipo === 'INGRESO');
      const egresosFinanciamiento = movimientosFinanciamiento.filter(m => m.tipo === 'EGRESO');
      
      const financiamientoGrupos: GrupoFlujo[] = [
        {
          nombre: 'INGRESOS DE FINANCIAMIENTO',
          movimientos: ingresosFinanciamiento,
          total: ingresosFinanciamiento.reduce((sum, m) => sum + m.monto, 0)
        },
        {
          nombre: 'EGRESOS DE FINANCIAMIENTO',
          movimientos: egresosFinanciamiento,
          total: -egresosFinanciamiento.reduce((sum, m) => sum + m.monto, 0)
        }
      ];
      
      // Calcular totales
      const totalOperacion = operacionGrupos.reduce((sum, g) => sum + g.total, 0);
      const totalInversion = inversionGrupos.reduce((sum, g) => sum + g.total, 0);
      const totalFinanciamiento = financiamientoGrupos.reduce((sum, g) => sum + g.total, 0);
      const flujoPeriodo = totalOperacion + totalInversion + totalFinanciamiento;
      const saldoFinal = saldoInicial + flujoPeriodo;
      
      // Crear flujo de efectivo
      const flujoEfectivo: FlujoEfectivoData = {
        operacion: operacionGrupos,
        inversion: inversionGrupos,
        financiamiento: financiamientoGrupos,
        totalOperacion,
        totalInversion,
        totalFinanciamiento,
        flujoPeriodo,
        saldoInicial,
        saldoFinal,
        fechaGeneracion: new Date(),
        fechaInicio,
        fechaFin
      };
      
      console.log('✅ Flujo de efectivo generado correctamente');
      return flujoEfectivo;
    } catch (error) {
      console.error('Error generando flujo de efectivo:', error);
      throw error;
    }
  }

  // Exportar Balance General a Excel
  static exportarBalanceGeneralExcel(data: BalanceGeneralData, empresaNombre: string): void {
    let content = `Balance General\n`;
    content += `${empresaNombre}\n`;
    content += `Período: ${data.fechaInicio ? new Date(data.fechaInicio).toLocaleDateString('es-PE') : 'Desde el inicio'} hasta ${data.fechaFin ? new Date(data.fechaFin).toLocaleDateString('es-PE') : 'la fecha actual'}\n`;
    content += `Generado: ${data.fechaGeneracion.toLocaleString('es-PE')}\n\n`;

    // Activos
    content += `ACTIVOS\n`;
    data.activos.forEach(grupo => {
      content += `${grupo.nombre}\t\t${grupo.total.toFixed(2)}\n`;
      grupo.cuentas.forEach(cuenta => {
        content += `\t${cuenta.codigo}\t${cuenta.nombre}\t${cuenta.saldo.toFixed(2)}\n`;
      });
    });
    content += `TOTAL ACTIVOS\t\t${data.totalActivos.toFixed(2)}\n\n`;

    // Pasivos
    content += `PASIVOS\n`;
    data.pasivos.forEach(grupo => {
      content += `${grupo.nombre}\t\t${grupo.total.toFixed(2)}\n`;
      grupo.cuentas.forEach(cuenta => {
        content += `\t${cuenta.codigo}\t${cuenta.nombre}\t${cuenta.saldo.toFixed(2)}\n`;
      });
    });
    content += `TOTAL PASIVOS\t\t${data.totalPasivos.toFixed(2)}\n\n`;

    // Patrimonio
    content += `PATRIMONIO\n`;
    data.patrimonio.forEach(grupo => {
      content += `${grupo.nombre}\t\t${grupo.total.toFixed(2)}\n`;
      grupo.cuentas.forEach(cuenta => {
        content += `\t${cuenta.codigo}\t${cuenta.nombre}\t${cuenta.saldo.toFixed(2)}\n`;
      });
    });
    content += `TOTAL PATRIMONIO\t\t${data.totalPatrimonio.toFixed(2)}\n\n`;

    // Ecuación contable
    content += `ECUACIÓN CONTABLE\n`;
    content += `Activo = Pasivo + Patrimonio\n`;
    content += `${data.totalActivos.toFixed(2)} = ${data.totalPasivos.toFixed(2)} + ${data.totalPatrimonio.toFixed(2)}\n`;

    const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `balance_general_${new Date().toISOString().split('T')[0]}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Exportar Balance General a PDF
  static exportarBalanceGeneralPDF(data: BalanceGeneralData, empresaNombre: string): void {
    // Crear contenido HTML para PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Balance General</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            font-size: 12px;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
          }
          .company-name { 
            font-size: 18px; 
            font-weight: bold; 
            margin-bottom: 5px;
          }
          .report-title { 
            font-size: 16px; 
            font-weight: bold; 
            margin-bottom: 10px;
          }
          .period { 
            font-size: 12px; 
            color: #666;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left;
          }
          th { 
            background-color: #f5f5f5; 
            font-weight: bold;
          }
          .group-header {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          .number { 
            text-align: right; 
          }
          .total { 
            font-weight: bold;
            background-color: #f0f0f0;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 10px;
          }
          .equation {
            margin-top: 20px;
            padding: 10px;
            background-color: #f9f9f9;
            border: 1px solid #ddd;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">${empresaNombre}</div>
          <div class="report-title">BALANCE GENERAL</div>
          <div class="period">
            Período: ${data.fechaInicio ? new Date(data.fechaInicio).toLocaleDateString('es-PE') : 'Desde el inicio'} 
            hasta ${data.fechaFin ? new Date(data.fechaFin).toLocaleDateString('es-PE') : 'la fecha actual'}
          </div>
        </div>
        
        <!-- ACTIVOS -->
        <h2>ACTIVOS</h2>
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Cuenta</th>
              <th class="number">Saldo</th>
            </tr>
          </thead>
          <tbody>
            ${data.activos.map(grupo => `
              <tr class="group-header">
                <td colspan="2">${grupo.nombre}</td>
                <td class="number">${grupo.total.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
              </tr>
              ${grupo.cuentas.map(cuenta => `
                <tr>
                  <td>${cuenta.codigo}</td>
                  <td>${cuenta.nombre}</td>
                  <td class="number">${cuenta.saldo.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
                </tr>
              `).join('')}
            `).join('')}
            <tr class="total">
              <td colspan="2">TOTAL ACTIVOS</td>
              <td class="number">${data.totalActivos.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
            </tr>
          </tbody>
        </table>
        
        <!-- PASIVOS -->
        <h2>PASIVOS</h2>
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Cuenta</th>
              <th class="number">Saldo</th>
            </tr>
          </thead>
          <tbody>
            ${data.pasivos.map(grupo => `
              <tr class="group-header">
                <td colspan="2">${grupo.nombre}</td>
                <td class="number">${grupo.total.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
              </tr>
              ${grupo.cuentas.map(cuenta => `
                <tr>
                  <td>${cuenta.codigo}</td>
                  <td>${cuenta.nombre}</td>
                  <td class="number">${cuenta.saldo.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
                </tr>
              `).join('')}
            `).join('')}
            <tr class="total">
              <td colspan="2">TOTAL PASIVOS</td>
              <td class="number">${data.totalPasivos.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
            </tr>
          </tbody>
        </table>
        
        <!-- PATRIMONIO -->
        <h2>PATRIMONIO</h2>
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Cuenta</th>
              <th class="number">Saldo</th>
            </tr>
          </thead>
          <tbody>
            ${data.patrimonio.map(grupo => `
              <tr class="group-header">
                <td colspan="2">${grupo.nombre}</td>
                <td class="number">${grupo.total.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
              </tr>
              ${grupo.cuentas.map(cuenta => `
                <tr>
                  <td>${cuenta.codigo}</td>
                  <td>${cuenta.nombre}</td>
                  <td class="number">${cuenta.saldo.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
                </tr>
              `).join('')}
            `).join('')}
            <tr class="total">
              <td colspan="2">TOTAL PATRIMONIO</td>
              <td class="number">${data.totalPatrimonio.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="equation">
          <h3>ECUACIÓN CONTABLE</h3>
          <p>Activo = Pasivo + Patrimonio</p>
          <p>${data.totalActivos.toLocaleString('es-PE', {minimumFractionDigits: 2})} = ${data.totalPasivos.toLocaleString('es-PE', {minimumFractionDigits: 2})} + ${data.totalPatrimonio.toLocaleString('es-PE', {minimumFractionDigits: 2})}</p>
        </div>
        
        <div class="footer">
          Generado el ${data.fechaGeneracion.toLocaleString('es-PE')}
        </div>
      </body>
      </html>
    `;

    // Crear y descargar PDF
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');
    
    if (newWindow) {
      newWindow.onload = () => {
        setTimeout(() => {
          newWindow.print();
        }, 500);
      };
    }
  }

  // Exportar Estado de Resultados a Excel
  static exportarEstadoResultadosExcel(data: EstadoResultadosData, empresaNombre: string): void {
    let content = `Estado de Resultados\n`;
    content += `${empresaNombre}\n`;
    content += `Período: ${data.fechaInicio ? new Date(data.fechaInicio).toLocaleDateString('es-PE') : 'Desde el inicio'} hasta ${data.fechaFin ? new Date(data.fechaFin).toLocaleDateString('es-PE') : 'la fecha actual'}\n`;
    content += `Generado: ${data.fechaGeneracion.toLocaleString('es-PE')}\n\n`;

    // Ingresos
    content += `INGRESOS\n`;
    data.ingresos.forEach(grupo => {
      content += `${grupo.nombre}\t\t${grupo.total.toFixed(2)}\n`;
      grupo.cuentas.forEach(cuenta => {
        content += `\t${cuenta.codigo}\t${cuenta.nombre}\t${cuenta.saldo.toFixed(2)}\n`;
      });
    });
    content += `TOTAL INGRESOS\t\t${data.totalIngresos.toFixed(2)}\n\n`;

    // Gastos
    content += `GASTOS\n`;
    data.gastos.forEach(grupo => {
      content += `${grupo.nombre}\t\t${grupo.total.toFixed(2)}\n`;
      grupo.cuentas.forEach(cuenta => {
        content += `\t${cuenta.codigo}\t${cuenta.nombre}\t${cuenta.saldo.toFixed(2)}\n`;
      });
    });
    content += `TOTAL GASTOS\t\t${data.totalGastos.toFixed(2)}\n\n`;

    // Resultados
    content += `RESULTADOS\n`;
    content += `UTILIDAD BRUTA\t\t${data.utilidadBruta.toFixed(2)}\n`;
    content += `GASTOS OPERATIVOS\t\t${data.gastosOperativos.toFixed(2)}\n`;
    content += `UTILIDAD OPERATIVA\t\t${data.utilidadOperativa.toFixed(2)}\n`;
    content += `OTROS INGRESOS\t\t${data.otrosIngresos.toFixed(2)}\n`;
    content += `OTROS GASTOS\t\t${data.otrosGastos.toFixed(2)}\n`;
    content += `UTILIDAD ANTES DE IMPUESTOS\t\t${data.utilidadAntesImpuestos.toFixed(2)}\n`;
    content += `IMPUESTOS\t\t${data.impuestos.toFixed(2)}\n`;
    content += `UTILIDAD NETA\t\t${data.utilidadNeta.toFixed(2)}\n`;

    const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `estado_resultados_${new Date().toISOString().split('T')[0]}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Exportar Estado de Resultados a PDF
  static exportarEstadoResultadosPDF(data: EstadoResultadosData, empresaNombre: string): void {
    // Crear contenido HTML para PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Estado de Resultados</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            font-size: 12px;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
          }
          .company-name { 
            font-size: 18px; 
            font-weight: bold; 
            margin-bottom: 5px;
          }
          .report-title { 
            font-size: 16px; 
            font-weight: bold; 
            margin-bottom: 10px;
          }
          .period { 
            font-size: 12px; 
            color: #666;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left;
          }
          th { 
            background-color: #f5f5f5; 
            font-weight: bold;
          }
          .group-header {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          .number { 
            text-align: right; 
          }
          .total { 
            font-weight: bold;
            background-color: #f0f0f0;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 10px;
          }
          .results {
            margin-top: 20px;
            padding: 10px;
            background-color: #f9f9f9;
            border: 1px solid #ddd;
          }
          .results table {
            margin-top: 0;
          }
          .utilidad-neta {
            font-size: 14px;
            font-weight: bold;
            color: ${data.utilidadNeta >= 0 ? '#28a745' : '#dc3545'};
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">${empresaNombre}</div>
          <div class="report-title">ESTADO DE RESULTADOS</div>
          <div class="period">
            Período: ${data.fechaInicio ? new Date(data.fechaInicio).toLocaleDateString('es-PE') : 'Desde el inicio'} 
            hasta ${data.fechaFin ? new Date(data.fechaFin).toLocaleDateString('es-PE') : 'la fecha actual'}
          </div>
        </div>
        
        <!-- INGRESOS -->
        <h2>INGRESOS</h2>
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Cuenta</th>
              <th class="number">Saldo</th>
            </tr>
          </thead>
          <tbody>
            ${data.ingresos.map(grupo => `
              <tr class="group-header">
                <td colspan="2">${grupo.nombre}</td>
                <td class="number">${grupo.total.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
              </tr>
              ${grupo.cuentas.map(cuenta => `
                <tr>
                  <td>${cuenta.codigo}</td>
                  <td>${cuenta.nombre}</td>
                  <td class="number">${cuenta.saldo.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
                </tr>
              `).join('')}
            `).join('')}
            <tr class="total">
              <td colspan="2">TOTAL INGRESOS</td>
              <td class="number">${data.totalIngresos.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
            </tr>
          </tbody>
        </table>
        
        <!-- GASTOS -->
        <h2>GASTOS</h2>
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Cuenta</th>
              <th class="number">Saldo</th>
            </tr>
          </thead>
          <tbody>
            ${data.gastos.map(grupo => `
              <tr class="group-header">
                <td colspan="2">${grupo.nombre}</td>
                <td class="number">${grupo.total.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
              </tr>
              ${grupo.cuentas.map(cuenta => `
                <tr>
                  <td>${cuenta.codigo}</td>
                  <td>${cuenta.nombre}</td>
                  <td class="number">${cuenta.saldo.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
                </tr>
              `).join('')}
            `).join('')}
            <tr class="total">
              <td colspan="2">TOTAL GASTOS</td>
              <td class="number">${data.totalGastos.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
            </tr>
          </tbody>
        </table>
        
        <!-- RESULTADOS -->
        <div class="results">
          <h2>RESULTADOS</h2>
          <table>
            <tbody>
              <tr>
                <td>UTILIDAD BRUTA</td>
                <td class="number">${data.utilidadBruta.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
              </tr>
              <tr>
                <td>GASTOS OPERATIVOS</td>
                <td class="number">${data.gastosOperativos.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
              </tr>
              <tr>
                <td>UTILIDAD OPERATIVA</td>
                <td class="number">${data.utilidadOperativa.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
              </tr>
              <tr>
                <td>OTROS INGRESOS</td>
                <td class="number">${data.otrosIngresos.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
              </tr>
              <tr>
                <td>OTROS GASTOS</td>
                <td class="number">${data.otrosGastos.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
              </tr>
              <tr>
                <td>UTILIDAD ANTES DE IMPUESTOS</td>
                <td class="number">${data.utilidadAntesImpuestos.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
              </tr>
              <tr>
                <td>IMPUESTOS</td>
                <td class="number">${data.impuestos.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
              </tr>
              <tr class="total">
                <td>UTILIDAD NETA</td>
                <td class="number utilidad-neta">${data.utilidadNeta.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="footer">
          Generado el ${data.fechaGeneracion.toLocaleString('es-PE')}
        </div>
      </body>
      </html>
    `;

    // Crear y descargar PDF
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');
    
    if (newWindow) {
      newWindow.onload = () => {
        setTimeout(() => {
          newWindow.print();
        }, 500);
      };
    }
  }

  // Exportar Flujo de Efectivo a Excel
  static exportarFlujoEfectivoExcel(data: FlujoEfectivoData, empresaNombre: string): void {
    let content = `Flujo de Efectivo\n`;
    content += `${empresaNombre}\n`;
    content += `Período: ${data.fechaInicio ? new Date(data.fechaInicio).toLocaleDateString('es-PE') : 'Desde el inicio'} hasta ${data.fechaFin ? new Date(data.fechaFin).toLocaleDateString('es-PE') : 'la fecha actual'}\n`;
    content += `Generado: ${data.fechaGeneracion.toLocaleString('es-PE')}\n\n`;

    // Actividades de Operación
    content += `ACTIVIDADES DE OPERACIÓN\n`;
    data.operacion.forEach(grupo => {
      content += `${grupo.nombre}\t\t${grupo.total.toFixed(2)}\n`;
      grupo.movimientos.forEach(mov => {
        content += `\t${mov.descripcion}\t${mov.tipo === 'INGRESO' ? '+' : '-'} ${mov.monto.toFixed(2)}\n`;
      });
    });
    content += `FLUJO NETO DE OPERACIÓN\t\t${data.totalOperacion.toFixed(2)}\n\n`;

    // Actividades de Inversión
    content += `ACTIVIDADES DE INVERSIÓN\n`;
    data.inversion.forEach(grupo => {
      content += `${grupo.nombre}\t\t${grupo.total.toFixed(2)}\n`;
      grupo.movimientos.forEach(mov => {
        content += `\t${mov.descripcion}\t${mov.tipo === 'INGRESO' ? '+' : '-'} ${mov.monto.toFixed(2)}\n`;
      });
    });
    content += `FLUJO NETO DE INVERSIÓN\t\t${data.totalInversion.toFixed(2)}\n\n`;

    // Actividades de Financiamiento
    content += `ACTIVIDADES DE FINANCIAMIENTO\n`;
    data.financiamiento.forEach(grupo => {
      content += `${grupo.nombre}\t\t${grupo.total.toFixed(2)}\n`;
      grupo.movimientos.forEach(mov => {
        content += `\t${mov.descripcion}\t${mov.tipo === 'INGRESO' ? '+' : '-'} ${mov.monto.toFixed(2)}\n`;
      });
    });
    content += `FLUJO NETO DE FINANCIAMIENTO\t\t${data.totalFinanciamiento.toFixed(2)}\n\n`;

    // Resumen
    content += `RESUMEN\n`;
    content += `Saldo Inicial\t\t${data.saldoInicial.toFixed(2)}\n`;
    content += `Flujo del Período\t\t${data.flujoPeriodo.toFixed(2)}\n`;
    content += `Saldo Final\t\t${data.saldoFinal.toFixed(2)}\n`;

    const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `flujo_efectivo_${new Date().toISOString().split('T')[0]}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Exportar Flujo de Efectivo a PDF
  static exportarFlujoEfectivoPDF(data: FlujoEfectivoData, empresaNombre: string): void {
    // Crear contenido HTML para PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Flujo de Efectivo</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            font-size: 12px;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
          }
          .company-name { 
            font-size: 18px; 
            font-weight: bold; 
            margin-bottom: 5px;
          }
          .report-title { 
            font-size: 16px; 
            font-weight: bold; 
            margin-bottom: 10px;
          }
          .period { 
            font-size: 12px; 
            color: #666;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left;
          }
          th { 
            background-color: #f5f5f5; 
            font-weight: bold;
          }
          .group-header {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          .number { 
            text-align: right; 
          }
          .total { 
            font-weight: bold;
            background-color: #f0f0f0;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 10px;
          }
          .summary {
            margin-top: 20px;
            padding: 10px;
            background-color: #f9f9f9;
            border: 1px solid #ddd;
          }
          .positive {
            color: #28a745;
          }
          .negative {
            color: #dc3545;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">${empresaNombre}</div>
          <div class="report-title">FLUJO DE EFECTIVO</div>
          <div class="period">
            Período: ${data.fechaInicio ? new Date(data.fechaInicio).toLocaleDateString('es-PE') : 'Desde el inicio'} 
            hasta ${data.fechaFin ? new Date(data.fechaFin).toLocaleDateString('es-PE') : 'la fecha actual'}
          </div>
        </div>
        
        <!-- ACTIVIDADES DE OPERACIÓN -->
        <h2>ACTIVIDADES DE OPERACIÓN</h2>
        <table>
          <thead>
            <tr>
              <th>Descripción</th>
              <th class="number">Monto</th>
            </tr>
          </thead>
          <tbody>
            ${data.operacion.map(grupo => `
              <tr class="group-header">
                <td>${grupo.nombre}</td>
                <td class="number">${grupo.total.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
              </tr>
              ${grupo.movimientos.map(mov => `
                <tr>
                  <td>${mov.descripcion}</td>
                  <td class="number">${mov.tipo === 'INGRESO' ? '+' : '-'} ${mov.monto.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
                </tr>
              `).join('')}
            `).join('')}
            <tr class="total">
              <td>FLUJO NETO DE OPERACIÓN</td>
              <td class="number ${data.totalOperacion >= 0 ? 'positive' : 'negative'}">${data.totalOperacion.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
            </tr>
          </tbody>
        </table>
        
        <!-- ACTIVIDADES DE INVERSIÓN -->
        <h2>ACTIVIDADES DE INVERSIÓN</h2>
        <table>
          <thead>
            <tr>
              <th>Descripción</th>
              <th class="number">Monto</th>
            </tr>
          </thead>
          <tbody>
            ${data.inversion.map(grupo => `
              <tr class="group-header">
                <td>${grupo.nombre}</td>
                <td class="number">${grupo.total.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
              </tr>
              ${grupo.movimientos.map(mov => `
                <tr>
                  <td>${mov.descripcion}</td>
                  <td class="number">${mov.tipo === 'INGRESO' ? '+' : '-'} ${mov.monto.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
                </tr>
              `).join('')}
            `).join('')}
            <tr class="total">
              <td>FLUJO NETO DE INVERSIÓN</td>
              <td class="number ${data.totalInversion >= 0 ? 'positive' : 'negative'}">${data.totalInversion.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
            </tr>
          </tbody>
        </table>
        
        <!-- ACTIVIDADES DE FINANCIAMIENTO -->
        <h2>ACTIVIDADES DE FINANCIAMIENTO</h2>
        <table>
          <thead>
            <tr>
              <th>Descripción</th>
              <th class="number">Monto</th>
            </tr>
          </thead>
          <tbody>
            ${data.financiamiento.map(grupo => `
              <tr class="group-header">
                <td>${grupo.nombre}</td>
                <td class="number">${grupo.total.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
              </tr>
              ${grupo.movimientos.map(mov => `
                <tr>
                  <td>${mov.descripcion}</td>
                  <td class="number">${mov.tipo === 'INGRESO' ? '+' : '-'} ${mov.monto.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
                </tr>
              `).join('')}
            `).join('')}
            <tr class="total">
              <td>FLUJO NETO DE FINANCIAMIENTO</td>
              <td class="number ${data.totalFinanciamiento >= 0 ? 'positive' : 'negative'}">${data.totalFinanciamiento.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
            </tr>
          </tbody>
        </table>
        
        <!-- RESUMEN -->
        <div class="summary">
          <h2>RESUMEN</h2>
          <table>
            <tbody>
              <tr>
                <td>Saldo Inicial</td>
                <td class="number">${data.saldoInicial.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
              </tr>
              <tr>
                <td>Flujo del Período</td>
                <td class="number ${data.flujoPeriodo >= 0 ? 'positive' : 'negative'}">${data.flujoPeriodo.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
              </tr>
              <tr class="total">
                <td>Saldo Final</td>
                <td class="number ${data.saldoFinal >= 0 ? 'positive' : 'negative'}">${data.saldoFinal.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="footer">
          Generado el ${data.fechaGeneracion.toLocaleString('es-PE')}
        </div>
      </body>
      </html>
    `;

    // Crear y descargar PDF
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');
    
    if (newWindow) {
      newWindow.onload = () => {
        setTimeout(() => {
          newWindow.print();
        }, 500);
      };
    }
  }
}