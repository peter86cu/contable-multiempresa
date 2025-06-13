import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  Timestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FirebaseAuthService } from '../../config/firebaseAuth';
import { AsientoContable, PlanCuenta } from '../../types';

// Balance General Types
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

// Estado de Resultados Types
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

// Flujo de Efectivo Types
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
      
      // 1. Obtener todas las cuentas
      const cuentasRef = collection(db, 'empresas', empresaId, 'cuentas');
      const cuentasSnapshot = await getDocs(cuentasRef);
      
      const cuentas = cuentasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PlanCuenta[];
      
      // 2. Obtener asientos contables del período
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
      
      // 3. Calcular saldos por cuenta
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
      
      // 4. Organizar cuentas por tipo y grupo
      const activosCorrientes: CuentaBalance[] = [];
      const activosNoCorrientes: CuentaBalance[] = [];
      const pasivosCorrientes: CuentaBalance[] = [];
      const pasivosNoCorrientes: CuentaBalance[] = [];
      const patrimonioItems: CuentaBalance[] = [];
      
      cuentas.forEach(cuenta => {
        const saldo = saldosCuentas.get(cuenta.id) || 0;
        
        // Solo incluir cuentas con saldo
        if (saldo !== 0) {
          const cuentaBalance: CuentaBalance = {
            codigo: cuenta.codigo,
            nombre: cuenta.nombre,
            saldo: Math.abs(saldo) // Usar valor absoluto para presentación
          };
          
          // Clasificar según tipo y código
          if (cuenta.tipo === 'ACTIVO') {
            // Activos corrientes (códigos 10-29)
            if (parseInt(cuenta.codigo.substring(0, 2)) < 30) {
              activosCorrientes.push(cuentaBalance);
            } else {
              activosNoCorrientes.push(cuentaBalance);
            }
          } else if (cuenta.tipo === 'PASIVO') {
            // Pasivos corrientes (códigos 40-49)
            if (parseInt(cuenta.codigo.substring(0, 2)) < 45) {
              pasivosCorrientes.push(cuentaBalance);
            } else {
              pasivosNoCorrientes.push(cuentaBalance);
            }
          } else if (cuenta.tipo === 'PATRIMONIO') {
            patrimonioItems.push(cuentaBalance);
          }
        }
      });
      
      // 5. Calcular totales
      const totalActivosCorrientes = activosCorrientes.reduce((sum, cuenta) => sum + cuenta.saldo, 0);
      const totalActivosNoCorrientes = activosNoCorrientes.reduce((sum, cuenta) => sum + cuenta.saldo, 0);
      const totalPasivosCorrientes = pasivosCorrientes.reduce((sum, cuenta) => sum + cuenta.saldo, 0);
      const totalPasivosNoCorrientes = pasivosNoCorrientes.reduce((sum, cuenta) => sum + cuenta.saldo, 0);
      const totalPatrimonio = patrimonioItems.reduce((sum, cuenta) => sum + cuenta.saldo, 0);
      
      const totalActivos = totalActivosCorrientes + totalActivosNoCorrientes;
      const totalPasivos = totalPasivosCorrientes + totalPasivosNoCorrientes;
      
      // 6. Construir estructura del balance
      const balanceData: BalanceGeneralData = {
        activos: [
          {
            nombre: 'ACTIVO CORRIENTE',
            cuentas: activosCorrientes,
            total: totalActivosCorrientes
          },
          {
            nombre: 'ACTIVO NO CORRIENTE',
            cuentas: activosNoCorrientes,
            total: totalActivosNoCorrientes
          }
        ],
        pasivos: [
          {
            nombre: 'PASIVO CORRIENTE',
            cuentas: pasivosCorrientes,
            total: totalPasivosCorrientes
          },
          {
            nombre: 'PASIVO NO CORRIENTE',
            cuentas: pasivosNoCorrientes,
            total: totalPasivosNoCorrientes
          }
        ],
        patrimonio: [
          {
            nombre: 'PATRIMONIO',
            cuentas: patrimonioItems,
            total: totalPatrimonio
          }
        ],
        totalActivos,
        totalPasivos,
        totalPatrimonio,
        fechaGeneracion: new Date(),
        fechaInicio,
        fechaFin
      };
      
      console.log('✅ Balance general generado exitosamente');
      return balanceData;
    } catch (error) {
      console.error('❌ Error generando balance general:', error);
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
      
      // 1. Obtener todas las cuentas
      const cuentasRef = collection(db, 'empresas', empresaId, 'cuentas');
      const cuentasSnapshot = await getDocs(cuentasRef);
      
      const cuentas = cuentasSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PlanCuenta[];
      
      // 2. Obtener asientos contables del período
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
      
      // 3. Calcular saldos por cuenta
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
          
          // Para cuentas de resultado, el saldo se calcula diferente
          const cuenta = cuentas.find(c => c.id === movimiento.cuentaId);
          if (cuenta) {
            if (cuenta.tipo === 'INGRESO') {
              // Ingresos aumentan con créditos
              saldosCuentas.set(movimiento.cuentaId, saldoActual + haber - debe);
            } else if (cuenta.tipo === 'GASTO') {
              // Gastos aumentan con débitos
              saldosCuentas.set(movimiento.cuentaId, saldoActual + debe - haber);
            }
          }
        });
      });
      
      // 4. Organizar cuentas por tipo y grupo
      const ingresosOperacionales: CuentaResultado[] = [];
      const otrosIngresos: CuentaResultado[] = [];
      const costoVentas: CuentaResultado[] = [];
      const gastosOperativos: CuentaResultado[] = [];
      const gastosFinancieros: CuentaResultado[] = [];
      const impuestosGastos: CuentaResultado[] = [];
      
      cuentas.forEach(cuenta => {
        const saldo = saldosCuentas.get(cuenta.id) || 0;
        
        // Solo incluir cuentas con saldo
        if (saldo !== 0) {
          const cuentaResultado: CuentaResultado = {
            codigo: cuenta.codigo,
            nombre: cuenta.nombre,
            saldo: Math.abs(saldo) // Usar valor absoluto para presentación
          };
          
          // Clasificar según tipo y código
          if (cuenta.tipo === 'INGRESO') {
            // Ingresos operacionales (códigos 70-74)
            if (parseInt(cuenta.codigo.substring(0, 2)) >= 70 && parseInt(cuenta.codigo.substring(0, 2)) <= 74) {
              ingresosOperacionales.push(cuentaResultado);
            } else {
              otrosIngresos.push(cuentaResultado);
            }
          } else if (cuenta.tipo === 'GASTO') {
            // Costo de ventas (código 69)
            if (cuenta.codigo.startsWith('69')) {
              costoVentas.push(cuentaResultado);
            } 
            // Gastos operativos (códigos 60-68)
            else if (parseInt(cuenta.codigo.substring(0, 2)) >= 60 && parseInt(cuenta.codigo.substring(0, 2)) <= 68) {
              gastosOperativos.push(cuentaResultado);
            }
            // Gastos financieros (código 67)
            else if (cuenta.codigo.startsWith('67')) {
              gastosFinancieros.push(cuentaResultado);
            }
            // Impuestos (código 88)
            else if (cuenta.codigo.startsWith('88')) {
              impuestosGastos.push(cuentaResultado);
            }
          }
        }
      });
      
      // 5. Calcular totales
      const totalIngresosOperacionales = ingresosOperacionales.reduce((sum, cuenta) => sum + cuenta.saldo, 0);
      const totalOtrosIngresos = otrosIngresos.reduce((sum, cuenta) => sum + cuenta.saldo, 0);
      const totalCostoVentas = costoVentas.reduce((sum, cuenta) => sum + cuenta.saldo, 0);
      const totalGastosOperativos = gastosOperativos.reduce((sum, cuenta) => sum + cuenta.saldo, 0);
      const totalGastosFinancieros = gastosFinancieros.reduce((sum, cuenta) => sum + cuenta.saldo, 0);
      const totalImpuestos = impuestosGastos.reduce((sum, cuenta) => sum + cuenta.saldo, 0);
      
      const totalIngresos = totalIngresosOperacionales + totalOtrosIngresos;
      const totalGastos = totalCostoVentas + totalGastosOperativos + totalGastosFinancieros + totalImpuestos;
      
      const utilidadBruta = totalIngresosOperacionales - totalCostoVentas;
      const utilidadOperativa = utilidadBruta - totalGastosOperativos;
      const utilidadAntesImpuestos = utilidadOperativa + totalOtrosIngresos - totalGastosFinancieros;
      const utilidadNeta = utilidadAntesImpuestos - totalImpuestos;
      
      // 6. Construir estructura del estado de resultados
      const resultadosData: EstadoResultadosData = {
        ingresos: [
          {
            nombre: 'INGRESOS OPERACIONALES',
            cuentas: ingresosOperacionales,
            total: totalIngresosOperacionales
          },
          {
            nombre: 'OTROS INGRESOS',
            cuentas: otrosIngresos,
            total: totalOtrosIngresos
          }
        ],
        gastos: [
          {
            nombre: 'COSTO DE VENTAS',
            cuentas: costoVentas,
            total: totalCostoVentas
          },
          {
            nombre: 'GASTOS OPERATIVOS',
            cuentas: gastosOperativos,
            total: totalGastosOperativos
          },
          {
            nombre: 'GASTOS FINANCIEROS',
            cuentas: gastosFinancieros,
            total: totalGastosFinancieros
          }
        ],
        totalIngresos,
        totalGastos,
        utilidadBruta,
        gastosOperativos: totalGastosOperativos,
        utilidadOperativa,
        otrosIngresos: totalOtrosIngresos,
        otrosGastos: totalGastosFinancieros,
        utilidadAntesImpuestos,
        impuestos: totalImpuestos,
        utilidadNeta,
        fechaGeneracion: new Date(),
        fechaInicio,
        fechaFin
      };
      
      console.log('✅ Estado de resultados generado exitosamente');
      return resultadosData;
    } catch (error) {
      console.error('❌ Error generando estado de resultados:', error);
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
      
      // 1. Obtener movimientos de tesorería
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
      
      // 2. Obtener saldo inicial (movimientos antes del período)
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
        });
      }
      
      // 3. Clasificar movimientos por actividad
      const movimientosOperacion: MovimientoFlujo[] = [];
      const movimientosInversion: MovimientoFlujo[] = [];
      const movimientosFinanciamiento: MovimientoFlujo[] = [];
      
      movimientos.forEach(mov => {
        const movimientoFlujo: MovimientoFlujo = {
          descripcion: mov.concepto,
          monto: mov.monto,
          tipo: mov.tipo === 'INGRESO' ? 'INGRESO' : 'EGRESO'
        };
        
        // Clasificar según concepto o documentoRelacionado
        if (mov.concepto.toLowerCase().includes('cobro') || 
            mov.concepto.toLowerCase().includes('venta') ||
            mov.concepto.toLowerCase().includes('cliente')) {
          movimientosOperacion.push(movimientoFlujo);
        }
        else if (mov.concepto.toLowerCase().includes('pago') || 
                 mov.concepto.toLowerCase().includes('compra') ||
                 mov.concepto.toLowerCase().includes('proveedor') ||
                 mov.concepto.toLowerCase().includes('servicio')) {
          movimientosOperacion.push(movimientoFlujo);
        }
        else if (mov.concepto.toLowerCase().includes('activo') || 
                 mov.concepto.toLowerCase().includes('equipo') ||
                 mov.concepto.toLowerCase().includes('maquinaria') ||
                 mov.concepto.toLowerCase().includes('inversión')) {
          movimientosInversion.push(movimientoFlujo);
        }
        else if (mov.concepto.toLowerCase().includes('préstamo') || 
                 mov.concepto.toLowerCase().includes('financiamiento') ||
                 mov.concepto.toLowerCase().includes('dividendo') ||
                 mov.concepto.toLowerCase().includes('capital')) {
          movimientosFinanciamiento.push(movimientoFlujo);
        }
        else {
          // Por defecto, considerar como operación
          movimientosOperacion.push(movimientoFlujo);
        }
      });
      
      // 4. Calcular totales por actividad
      const calcularTotal = (movs: MovimientoFlujo[]) => {
        return movs.reduce((total, mov) => {
          return total + (mov.tipo === 'INGRESO' ? mov.monto : -mov.monto);
        }, 0);
      };
      
      const totalOperacion = calcularTotal(movimientosOperacion);
      const totalInversion = calcularTotal(movimientosInversion);
      const totalFinanciamiento = calcularTotal(movimientosFinanciamiento);
      
      const flujoPeriodo = totalOperacion + totalInversion + totalFinanciamiento;
      const saldoFinal = saldoInicial + flujoPeriodo;
      
      // 5. Agrupar movimientos por tipo
      const flujoData: FlujoEfectivoData = {
        operacion: [
          {
            nombre: 'INGRESOS OPERACIONALES',
            movimientos: movimientosOperacion.filter(m => m.tipo === 'INGRESO'),
            total: movimientosOperacion.filter(m => m.tipo === 'INGRESO').reduce((sum, m) => sum + m.monto, 0)
          },
          {
            nombre: 'EGRESOS OPERACIONALES',
            movimientos: movimientosOperacion.filter(m => m.tipo === 'EGRESO'),
            total: -movimientosOperacion.filter(m => m.tipo === 'EGRESO').reduce((sum, m) => sum + m.monto, 0)
          }
        ],
        inversion: [
          {
            nombre: 'INGRESOS DE INVERSIÓN',
            movimientos: movimientosInversion.filter(m => m.tipo === 'INGRESO'),
            total: movimientosInversion.filter(m => m.tipo === 'INGRESO').reduce((sum, m) => sum + m.monto, 0)
          },
          {
            nombre: 'EGRESOS DE INVERSIÓN',
            movimientos: movimientosInversion.filter(m => m.tipo === 'EGRESO'),
            total: -movimientosInversion.filter(m => m.tipo === 'EGRESO').reduce((sum, m) => sum + m.monto, 0)
          }
        ],
        financiamiento: [
          {
            nombre: 'INGRESOS DE FINANCIAMIENTO',
            movimientos: movimientosFinanciamiento.filter(m => m.tipo === 'INGRESO'),
            total: movimientosFinanciamiento.filter(m => m.tipo === 'INGRESO').reduce((sum, m) => sum + m.monto, 0)
          },
          {
            nombre: 'EGRESOS DE FINANCIAMIENTO',
            movimientos: movimientosFinanciamiento.filter(m => m.tipo === 'EGRESO'),
            total: -movimientosFinanciamiento.filter(m => m.tipo === 'EGRESO').reduce((sum, m) => sum + m.monto, 0)
          }
        ],
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
      
      console.log('✅ Flujo de efectivo generado exitosamente');
      return flujoData;
    } catch (error) {
      console.error('❌ Error generando flujo de efectivo:', error);
      throw error;
    }
  }

  // Exportación a Excel para Balance General
  static exportarBalanceGeneralExcel(data: BalanceGeneralData, empresaNombre: string): void {
    let content = `Balance General\n`;
    content += `${empresaNombre}\n`;
    content += `Período: ${data.fechaInicio ? new Date(data.fechaInicio).toLocaleDateString('es-PE') : 'Desde el inicio'} hasta ${data.fechaFin ? new Date(data.fechaFin).toLocaleDateString('es-PE') : 'la fecha actual'}\n`;
    content += `Generado: ${data.fechaGeneracion.toLocaleString('es-PE')}\n\n`;

    // Activos
    content += `ACTIVOS\n`;
    data.activos.forEach(grupo => {
      content += `${grupo.nombre}\t${grupo.total.toFixed(2)}\n`;
      grupo.cuentas.forEach(cuenta => {
        content += `\t${cuenta.codigo}\t${cuenta.nombre}\t${cuenta.saldo.toFixed(2)}\n`;
      });
    });
    content += `TOTAL ACTIVOS\t${data.totalActivos.toFixed(2)}\n\n`;

    // Pasivos
    content += `PASIVOS\n`;
    data.pasivos.forEach(grupo => {
      content += `${grupo.nombre}\t${grupo.total.toFixed(2)}\n`;
      grupo.cuentas.forEach(cuenta => {
        content += `\t${cuenta.codigo}\t${cuenta.nombre}\t${cuenta.saldo.toFixed(2)}\n`;
      });
    });
    content += `TOTAL PASIVOS\t${data.totalPasivos.toFixed(2)}\n\n`;

    // Patrimonio
    content += `PATRIMONIO\n`;
    data.patrimonio.forEach(grupo => {
      content += `${grupo.nombre}\t${grupo.total.toFixed(2)}\n`;
      grupo.cuentas.forEach(cuenta => {
        content += `\t${cuenta.codigo}\t${cuenta.nombre}\t${cuenta.saldo.toFixed(2)}\n`;
      });
    });
    content += `TOTAL PATRIMONIO\t${data.totalPatrimonio.toFixed(2)}\n\n`;

    // Ecuación contable
    content += `TOTAL PASIVO + PATRIMONIO\t${(data.totalPasivos + data.totalPatrimonio).toFixed(2)}\n`;

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

  // Exportación a PDF para Balance General
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
            background-color: #e0e0e0;
            font-weight: bold;
          }
          .total-row {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          .number { 
            text-align: right; 
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 10px;
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
        <h3>ACTIVOS</h3>
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
            <tr class="total-row">
              <td colspan="2">TOTAL ACTIVOS</td>
              <td class="number">${data.totalActivos.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
            </tr>
          </tbody>
        </table>
        
        <!-- PASIVOS -->
        <h3>PASIVOS</h3>
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
            <tr class="total-row">
              <td colspan="2">TOTAL PASIVOS</td>
              <td class="number">${data.totalPasivos.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
            </tr>
          </tbody>
        </table>
        
        <!-- PATRIMONIO -->
        <h3>PATRIMONIO</h3>
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
            <tr class="total-row">
              <td colspan="2">TOTAL PATRIMONIO</td>
              <td class="number">${data.totalPatrimonio.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
            </tr>
          </tbody>
        </table>
        
        <!-- RESUMEN -->
        <div style="margin-top: 30px; padding: 15px; border: 1px solid #ddd; background-color: #f9f9f9;">
          <h3 style="margin-top: 0;">RESUMEN</h3>
          <table style="width: 100%; border: none;">
            <tr>
              <td style="border: none; width: 70%;">Total Activos</td>
              <td style="border: none; text-align: right; font-weight: bold;">${data.totalActivos.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
            </tr>
            <tr>
              <td style="border: none;">Total Pasivos</td>
              <td style="border: none; text-align: right; font-weight: bold;">${data.totalPasivos.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
            </tr>
            <tr>
              <td style="border: none;">Total Patrimonio</td>
              <td style="border: none; text-align: right; font-weight: bold;">${data.totalPatrimonio.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
            </tr>
            <tr>
              <td style="border: none; border-top: 1px solid #ddd; padding-top: 8px;">Total Pasivo + Patrimonio</td>
              <td style="border: none; border-top: 1px solid #ddd; padding-top: 8px; text-align: right; font-weight: bold;">${(data.totalPasivos + data.totalPatrimonio).toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
            </tr>
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

  // Exportación a Excel para Estado de Resultados
  static exportarEstadoResultadosExcel(data: EstadoResultadosData, empresaNombre: string): void {
    let content = `Estado de Resultados\n`;
    content += `${empresaNombre}\n`;
    content += `Período: ${data.fechaInicio ? new Date(data.fechaInicio).toLocaleDateString('es-PE') : 'Desde el inicio'} hasta ${data.fechaFin ? new Date(data.fechaFin).toLocaleDateString('es-PE') : 'la fecha actual'}\n`;
    content += `Generado: ${data.fechaGeneracion.toLocaleString('es-PE')}\n\n`;

    // Ingresos
    content += `INGRESOS\n`;
    data.ingresos.forEach(grupo => {
      content += `${grupo.nombre}\t${grupo.total.toFixed(2)}\n`;
      grupo.cuentas.forEach(cuenta => {
        content += `\t${cuenta.codigo}\t${cuenta.nombre}\t${cuenta.saldo.toFixed(2)}\n`;
      });
    });
    content += `TOTAL INGRESOS\t${data.totalIngresos.toFixed(2)}\n\n`;

    // Gastos
    content += `GASTOS\n`;
    data.gastos.forEach(grupo => {
      content += `${grupo.nombre}\t${grupo.total.toFixed(2)}\n`;
      grupo.cuentas.forEach(cuenta => {
        content += `\t${cuenta.codigo}\t${cuenta.nombre}\t${cuenta.saldo.toFixed(2)}\n`;
      });
    });
    content += `TOTAL GASTOS\t${data.totalGastos.toFixed(2)}\n\n`;

    // Resultados
    content += `RESULTADOS\n`;
    content += `UTILIDAD BRUTA\t${data.utilidadBruta.toFixed(2)}\n`;
    content += `GASTOS OPERATIVOS\t${data.gastosOperativos.toFixed(2)}\n`;
    content += `UTILIDAD OPERATIVA\t${data.utilidadOperativa.toFixed(2)}\n`;
    content += `OTROS INGRESOS\t${data.otrosIngresos.toFixed(2)}\n`;
    content += `OTROS GASTOS\t${data.otrosGastos.toFixed(2)}\n`;
    content += `UTILIDAD ANTES DE IMPUESTOS\t${data.utilidadAntesImpuestos.toFixed(2)}\n`;
    content += `IMPUESTOS\t${data.impuestos.toFixed(2)}\n`;
    content += `UTILIDAD NETA\t${data.utilidadNeta.toFixed(2)}\n`;

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

  // Exportación a PDF para Estado de Resultados
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
            background-color: #e0e0e0;
            font-weight: bold;
          }
          .total-row {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          .number { 
            text-align: right; 
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 10px;
          }
          .results-section {
            margin-top: 30px;
            padding: 15px;
            border: 1px solid #ddd;
            background-color: #f9f9f9;
          }
          .positive { color: #28a745; }
          .negative { color: #dc3545; }
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
        <h3>INGRESOS</h3>
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
            <tr class="total-row">
              <td colspan="2">TOTAL INGRESOS</td>
              <td class="number">${data.totalIngresos.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
            </tr>
          </tbody>
        </table>
        
        <!-- GASTOS -->
        <h3>GASTOS</h3>
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
            <tr class="total-row">
              <td colspan="2">TOTAL GASTOS</td>
              <td class="number">${data.totalGastos.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
            </tr>
          </tbody>
        </table>
        
        <!-- RESULTADOS -->
        <div class="results-section">
          <h3 style="margin-top: 0;">RESULTADOS</h3>
          <table style="width: 100%; border: none;">
            <tr>
              <td style="border: none; width: 70%;">Utilidad Bruta</td>
              <td style="border: none; text-align: right; font-weight: bold;" class="${data.utilidadBruta >= 0 ? 'positive' : 'negative'}">${data.utilidadBruta.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
            </tr>
            <tr>
              <td style="border: none;">Gastos Operativos</td>
              <td style="border: none; text-align: right; font-weight: bold;">${data.gastosOperativos.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
            </tr>
            <tr>
              <td style="border: none;">Utilidad Operativa</td>
              <td style="border: none; text-align: right; font-weight: bold;" class="${data.utilidadOperativa >= 0 ? 'positive' : 'negative'}">${data.utilidadOperativa.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
            </tr>
            <tr>
              <td style="border: none;">Otros Ingresos</td>
              <td style="border: none; text-align: right; font-weight: bold;">${data.otrosIngresos.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
            </tr>
            <tr>
              <td style="border: none;">Otros Gastos</td>
              <td style="border: none; text-align: right; font-weight: bold;">${data.otrosGastos.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
            </tr>
            <tr>
              <td style="border: none;">Utilidad Antes de Impuestos</td>
              <td style="border: none; text-align: right; font-weight: bold;" class="${data.utilidadAntesImpuestos >= 0 ? 'positive' : 'negative'}">${data.utilidadAntesImpuestos.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
            </tr>
            <tr>
              <td style="border: none;">Impuestos</td>
              <td style="border: none; text-align: right; font-weight: bold;">${data.impuestos.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
            </tr>
            <tr>
              <td style="border: none; border-top: 1px solid #ddd; padding-top: 8px; font-weight: bold;">UTILIDAD NETA</td>
              <td style="border: none; border-top: 1px solid #ddd; padding-top: 8px; text-align: right; font-weight: bold; font-size: 14px;" class="${data.utilidadNeta >= 0 ? 'positive' : 'negative'}">${data.utilidadNeta.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
            </tr>
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

  // Exportación a Excel para Flujo de Efectivo
  static exportarFlujoEfectivoExcel(data: FlujoEfectivoData, empresaNombre: string): void {
    let content = `Flujo de Efectivo\n`;
    content += `${empresaNombre}\n`;
    content += `Período: ${data.fechaInicio ? new Date(data.fechaInicio).toLocaleDateString('es-PE') : 'Desde el inicio'} hasta ${data.fechaFin ? new Date(data.fechaFin).toLocaleDateString('es-PE') : 'la fecha actual'}\n`;
    content += `Generado: ${data.fechaGeneracion.toLocaleString('es-PE')}\n\n`;

    // Saldo inicial
    content += `SALDO INICIAL\t${data.saldoInicial.toFixed(2)}\n\n`;

    // Actividades de operación
    content += `ACTIVIDADES DE OPERACIÓN\n`;
    data.operacion.forEach(grupo => {
      content += `${grupo.nombre}\t${grupo.total.toFixed(2)}\n`;
      grupo.movimientos.forEach(mov => {
        content += `\t${mov.descripcion}\t${mov.tipo === 'INGRESO' ? '+' : '-'}\t${mov.monto.toFixed(2)}\n`;
      });
    });
    content += `FLUJO NETO DE OPERACIÓN\t${data.totalOperacion.toFixed(2)}\n\n`;

    // Actividades de inversión
    content += `ACTIVIDADES DE INVERSIÓN\n`;
    data.inversion.forEach(grupo => {
      content += `${grupo.nombre}\t${grupo.total.toFixed(2)}\n`;
      grupo.movimientos.forEach(mov => {
        content += `\t${mov.descripcion}\t${mov.tipo === 'INGRESO' ? '+' : '-'}\t${mov.monto.toFixed(2)}\n`;
      });
    });
    content += `FLUJO NETO DE INVERSIÓN\t${data.totalInversion.toFixed(2)}\n\n`;

    // Actividades de financiamiento
    content += `ACTIVIDADES DE FINANCIAMIENTO\n`;
    data.financiamiento.forEach(grupo => {
      content += `${grupo.nombre}\t${grupo.total.toFixed(2)}\n`;
      grupo.movimientos.forEach(mov => {
        content += `\t${mov.descripcion}\t${mov.tipo === 'INGRESO' ? '+' : '-'}\t${mov.monto.toFixed(2)}\n`;
      });
    });
    content += `FLUJO NETO DE FINANCIAMIENTO\t${data.totalFinanciamiento.toFixed(2)}\n\n`;

    // Resumen
    content += `RESUMEN\n`;
    content += `Flujo de Operación\t${data.totalOperacion.toFixed(2)}\n`;
    content += `Flujo de Inversión\t${data.totalInversion.toFixed(2)}\n`;
    content += `Flujo de Financiamiento\t${data.totalFinanciamiento.toFixed(2)}\n`;
    content += `Flujo del Período\t${data.flujoPeriodo.toFixed(2)}\n`;
    content += `Saldo Inicial\t${data.saldoInicial.toFixed(2)}\n`;
    content += `Saldo Final\t${data.saldoFinal.toFixed(2)}\n`;

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

  // Exportación a PDF para Flujo de Efectivo
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
            background-color: #e0e0e0;
            font-weight: bold;
          }
          .total-row {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          .number { 
            text-align: right; 
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 10px;
          }
          .summary-section {
            margin-top: 30px;
            padding: 15px;
            border: 1px solid #ddd;
            background-color: #f9f9f9;
          }
          .positive { color: #28a745; }
          .negative { color: #dc3545; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">${empresaNombre}</div>
          <div class="report-title">ESTADO DE FLUJO DE EFECTIVO</div>
          <div class="period">
            Período: ${data.fechaInicio ? new Date(data.fechaInicio).toLocaleDateString('es-PE') : 'Desde el inicio'} 
            hasta ${data.fechaFin ? new Date(data.fechaFin).toLocaleDateString('es-PE') : 'la fecha actual'}
          </div>
        </div>
        
        <!-- SALDO INICIAL -->
        <div style="margin-bottom: 20px;">
          <h3 style="margin-bottom: 10px;">SALDO INICIAL</h3>
          <div style="font-size: 16px; font-weight: bold;">${data.saldoInicial.toLocaleString('es-PE', {minimumFractionDigits: 2})}</div>
        </div>
        
        <!-- ACTIVIDADES DE OPERACIÓN -->
        <h3>ACTIVIDADES DE OPERACIÓN</h3>
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
            <tr class="total-row">
              <td>FLUJO NETO DE OPERACIÓN</td>
              <td class="number ${data.totalOperacion >= 0 ? 'positive' : 'negative'}">${data.totalOperacion.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
            </tr>
          </tbody>
        </table>
        
        <!-- ACTIVIDADES DE INVERSIÓN -->
        <h3>ACTIVIDADES DE INVERSIÓN</h3>
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
            <tr class="total-row">
              <td>FLUJO NETO DE INVERSIÓN</td>
              <td class="number ${data.totalInversion >= 0 ? 'positive' : 'negative'}">${data.totalInversion.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
            </tr>
          </tbody>
        </table>
        
        <!-- ACTIVIDADES DE FINANCIAMIENTO -->
        <h3>ACTIVIDADES DE FINANCIAMIENTO</h3>
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
            <tr class="total-row">
              <td>FLUJO NETO DE FINANCIAMIENTO</td>
              <td class="number ${data.totalFinanciamiento >= 0 ? 'positive' : 'negative'}">${data.totalFinanciamiento.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
            </tr>
          </tbody>
        </table>
        
        <!-- RESUMEN -->
        <div class="summary-section">
          <h3 style="margin-top: 0;">RESUMEN</h3>
          <table style="width: 100%; border: none;">
            <tr>
              <td style="border: none; width: 70%;">Flujo de Operación</td>
              <td style="border: none; text-align: right; font-weight: bold;" class="${data.totalOperacion >= 0 ? 'positive' : 'negative'}">${data.totalOperacion.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
            </tr>
            <tr>
              <td style="border: none;">Flujo de Inversión</td>
              <td style="border: none; text-align: right; font-weight: bold;" class="${data.totalInversion >= 0 ? 'positive' : 'negative'}">${data.totalInversion.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
            </tr>
            <tr>
              <td style="border: none;">Flujo de Financiamiento</td>
              <td style="border: none; text-align: right; font-weight: bold;" class="${data.totalFinanciamiento >= 0 ? 'positive' : 'negative'}">${data.totalFinanciamiento.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
            </tr>
            <tr>
              <td style="border: none;">Flujo del Período</td>
              <td style="border: none; text-align: right; font-weight: bold;" class="${data.flujoPeriodo >= 0 ? 'positive' : 'negative'}">${data.flujoPeriodo.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
            </tr>
            <tr>
              <td style="border: none;">Saldo Inicial</td>
              <td style="border: none; text-align: right; font-weight: bold;">${data.saldoInicial.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
            </tr>
            <tr>
              <td style="border: none; border-top: 1px solid #ddd; padding-top: 8px; font-weight: bold;">SALDO FINAL</td>
              <td style="border: none; border-top: 1px solid #ddd; padding-top: 8px; text-align: right; font-weight: bold; font-size: 14px;" class="${data.saldoFinal >= 0 ? 'positive' : 'negative'}">${data.saldoFinal.toLocaleString('es-PE', {minimumFractionDigits: 2})}</td>
            </tr>
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