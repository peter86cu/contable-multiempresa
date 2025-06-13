import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  Timestamp,
  limit,
  startAfter,
  endBefore,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { FirebaseAuthService } from '../../config/firebaseAuth';
import { AsientoContable, PlanCuenta } from '../../types';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Interfaces para los reportes
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

export interface GrupoBalance {
  nombre: string;
  cuentas: CuentaBalance[];
  total: number;
}

export interface GrupoResultado {
  nombre: string;
  cuentas: CuentaResultado[];
  total: number;
}

export interface GrupoFlujo {
  nombre: string;
  movimientos: MovimientoFlujo[];
  total: number;
}

export interface CuentaBalance {
  codigo: string;
  nombre: string;
  saldo: number;
}

export interface CuentaResultado {
  codigo: string;
  nombre: string;
  saldo: number;
}

export interface MovimientoFlujo {
  descripcion: string;
  monto: number;
  tipo: 'INGRESO' | 'EGRESO';
}

export class ReportesService {
  // Generar Balance General
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

      console.log('🔄 Generando Balance General...');
      
      // 1. Obtener todas las cuentas
      const cuentasRef = collection(db, 'empresas', empresaId, 'cuentas');
      const cuentasQuery = query(cuentasRef, where('activa', '==', true), orderBy('codigo'));
      const cuentasSnap = await getDocs(cuentasQuery);
      
      const cuentas = cuentasSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PlanCuenta[];
      
      // 2. Obtener asientos contables en el período
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
      
      const asientosSnap = await getDocs(asientosQuery);
      const asientos = asientosSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AsientoContable[];
      
      // 3. Calcular saldos por cuenta
      const saldosPorCuenta = new Map<string, number>();
      
      // Inicializar saldos
      cuentas.forEach(cuenta => {
        saldosPorCuenta.set(cuenta.id, 0);
      });
      
      // Procesar asientos
      asientos.forEach(asiento => {
        asiento.movimientos.forEach(movimiento => {
          const saldoActual = saldosPorCuenta.get(movimiento.cuentaId) || 0;
          const debe = movimiento.debito || 0;
          const haber = movimiento.credito || 0;
          
          // Actualizar saldo según tipo de cuenta
          const cuenta = cuentas.find(c => c.id === movimiento.cuentaId);
          if (cuenta) {
            if (['ACTIVO', 'GASTO'].includes(cuenta.tipo)) {
              saldosPorCuenta.set(cuenta.id, saldoActual + debe - haber);
            } else {
              saldosPorCuenta.set(cuenta.id, saldoActual + haber - debe);
            }
          }
        });
      });
      
      // 4. Agrupar cuentas por tipo
      const activos: CuentaBalance[] = [];
      const pasivos: CuentaBalance[] = [];
      const patrimonio: CuentaBalance[] = [];
      
      cuentas.forEach(cuenta => {
        const saldo = saldosPorCuenta.get(cuenta.id) || 0;
        
        // Solo incluir cuentas con saldo
        if (saldo !== 0) {
          const cuentaBalance: CuentaBalance = {
            codigo: cuenta.codigo,
            nombre: cuenta.nombre,
            saldo: Math.abs(saldo) // Siempre mostrar saldo positivo
          };
          
          if (cuenta.tipo === 'ACTIVO') {
            activos.push(cuentaBalance);
          } else if (cuenta.tipo === 'PASIVO') {
            pasivos.push(cuentaBalance);
          } else if (cuenta.tipo === 'PATRIMONIO') {
            patrimonio.push(cuentaBalance);
          }
        }
      });
      
      // 5. Agrupar por categorías
      const activoCorriente = activos.filter(c => c.codigo.startsWith('1') && parseInt(c.codigo) < 30);
      const activoNoCorriente = activos.filter(c => parseInt(c.codigo) >= 30);
      
      const pasivoCorriente = pasivos.filter(c => c.codigo.startsWith('4') && parseInt(c.codigo) < 45);
      const pasivoNoCorriente = pasivos.filter(c => parseInt(c.codigo) >= 45);
      
      // 6. Calcular totales
      const totalActivoCorriente = activoCorriente.reduce((sum, c) => sum + c.saldo, 0);
      const totalActivoNoCorriente = activoNoCorriente.reduce((sum, c) => sum + c.saldo, 0);
      const totalPasivoCorriente = pasivoCorriente.reduce((sum, c) => sum + c.saldo, 0);
      const totalPasivoNoCorriente = pasivoNoCorriente.reduce((sum, c) => sum + c.saldo, 0);
      const totalPatrimonioVal = patrimonio.reduce((sum, c) => sum + c.saldo, 0);
      
      const totalActivos = totalActivoCorriente + totalActivoNoCorriente;
      const totalPasivos = totalPasivoCorriente + totalPasivoNoCorriente;
      
      // 7. Construir estructura del balance
      const balanceGeneral: BalanceGeneralData = {
        activos: [
          {
            nombre: 'ACTIVO CORRIENTE',
            cuentas: activoCorriente,
            total: totalActivoCorriente
          },
          {
            nombre: 'ACTIVO NO CORRIENTE',
            cuentas: activoNoCorriente,
            total: totalActivoNoCorriente
          }
        ],
        pasivos: [
          {
            nombre: 'PASIVO CORRIENTE',
            cuentas: pasivoCorriente,
            total: totalPasivoCorriente
          },
          {
            nombre: 'PASIVO NO CORRIENTE',
            cuentas: pasivoNoCorriente,
            total: totalPasivoNoCorriente
          }
        ],
        patrimonio: [
          {
            nombre: 'PATRIMONIO',
            cuentas: patrimonio,
            total: totalPatrimonioVal
          }
        ],
        totalActivos,
        totalPasivos,
        totalPatrimonio: totalPatrimonioVal,
        fechaGeneracion: new Date(),
        fechaInicio,
        fechaFin
      };
      
      console.log('✅ Balance General generado correctamente');
      return balanceGeneral;
    } catch (error) {
      console.error('❌ Error generando Balance General:', error);
      throw error;
    }
  }

  // Generar Estado de Resultados
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

      console.log('🔄 Generando Estado de Resultados...');
      
      // 1. Obtener todas las cuentas
      const cuentasRef = collection(db, 'empresas', empresaId, 'cuentas');
      const cuentasQuery = query(cuentasRef, where('activa', '==', true), orderBy('codigo'));
      const cuentasSnap = await getDocs(cuentasQuery);
      
      const cuentas = cuentasSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PlanCuenta[];
      
      // 2. Obtener asientos contables en el período
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
      
      const asientosSnap = await getDocs(asientosQuery);
      const asientos = asientosSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AsientoContable[];
      
      // 3. Calcular saldos por cuenta
      const saldosPorCuenta = new Map<string, number>();
      
      // Inicializar saldos
      cuentas.forEach(cuenta => {
        saldosPorCuenta.set(cuenta.id, 0);
      });
      
      // Procesar asientos
      asientos.forEach(asiento => {
        asiento.movimientos.forEach(movimiento => {
          const saldoActual = saldosPorCuenta.get(movimiento.cuentaId) || 0;
          const debe = movimiento.debito || 0;
          const haber = movimiento.credito || 0;
          
          // Actualizar saldo según tipo de cuenta
          const cuenta = cuentas.find(c => c.id === movimiento.cuentaId);
          if (cuenta) {
            if (['ACTIVO', 'GASTO'].includes(cuenta.tipo)) {
              saldosPorCuenta.set(cuenta.id, saldoActual + debe - haber);
            } else {
              saldosPorCuenta.set(cuenta.id, saldoActual + haber - debe);
            }
          }
        });
      });
      
      // 4. Agrupar cuentas por tipo
      const ingresos: CuentaResultado[] = [];
      const gastos: CuentaResultado[] = [];
      
      cuentas.forEach(cuenta => {
        const saldo = saldosPorCuenta.get(cuenta.id) || 0;
        
        // Solo incluir cuentas con saldo
        if (saldo !== 0) {
          const cuentaResultado: CuentaResultado = {
            codigo: cuenta.codigo,
            nombre: cuenta.nombre,
            saldo: Math.abs(saldo) // Siempre mostrar saldo positivo
          };
          
          if (cuenta.tipo === 'INGRESO') {
            ingresos.push(cuentaResultado);
          } else if (cuenta.tipo === 'GASTO') {
            gastos.push(cuentaResultado);
          }
        }
      });
      
      // 5. Agrupar por categorías
      const ingresosOperacionales = ingresos.filter(c => c.codigo.startsWith('70'));
      const otrosIngresos = ingresos.filter(c => !c.codigo.startsWith('70'));
      
      const costoVentas = gastos.filter(c => c.codigo.startsWith('69'));
      const gastosOperativos = gastos.filter(c => 
        c.codigo.startsWith('62') || 
        c.codigo.startsWith('63') || 
        c.codigo.startsWith('64') || 
        c.codigo.startsWith('65')
      );
      const gastosFinancieros = gastos.filter(c => c.codigo.startsWith('67'));
      
      // 6. Calcular totales
      const totalIngresosOperacionales = ingresosOperacionales.reduce((sum, c) => sum + c.saldo, 0);
      const totalOtrosIngresos = otrosIngresos.reduce((sum, c) => sum + c.saldo, 0);
      const totalCostoVentas = costoVentas.reduce((sum, c) => sum + c.saldo, 0);
      const totalGastosOperativos = gastosOperativos.reduce((sum, c) => sum + c.saldo, 0);
      const totalGastosFinancieros = gastosFinancieros.reduce((sum, c) => sum + c.saldo, 0);
      
      const totalIngresos = totalIngresosOperacionales + totalOtrosIngresos;
      const totalGastos = totalCostoVentas + totalGastosOperativos + totalGastosFinancieros;
      
      const utilidadBruta = totalIngresosOperacionales - totalCostoVentas;
      const utilidadOperativa = utilidadBruta - totalGastosOperativos;
      const utilidadAntesImpuestos = utilidadOperativa + totalOtrosIngresos - totalGastosFinancieros;
      
      // Calcular impuestos (estimado 30%)
      const impuestos = utilidadAntesImpuestos > 0 ? utilidadAntesImpuestos * 0.3 : 0;
      const utilidadNeta = utilidadAntesImpuestos - impuestos;
      
      // 7. Construir estructura del estado de resultados
      const estadoResultados: EstadoResultadosData = {
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
        impuestos,
        utilidadNeta,
        fechaGeneracion: new Date(),
        fechaInicio,
        fechaFin
      };
      
      console.log('✅ Estado de Resultados generado correctamente');
      return estadoResultados;
    } catch (error) {
      console.error('❌ Error generando Estado de Resultados:', error);
      throw error;
    }
  }

  // Generar Flujo de Efectivo
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

      console.log('🔄 Generando Flujo de Efectivo...');
      
      // 1. Obtener movimientos de tesorería
      const movimientosRef = collection(db, 'empresas', empresaId, 'movimientosTesoreria');
      let movimientosQuery = query(movimientosRef);
      
      if (fechaInicio) {
        movimientosQuery = query(movimientosQuery, where('fecha', '>=', fechaInicio));
      }
      
      if (fechaFin) {
        movimientosQuery = query(movimientosQuery, where('fecha', '<=', fechaFin));
      }
      
      const movimientosSnap = await getDocs(movimientosQuery);
      const movimientos = movimientosSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // 2. Obtener saldo inicial (movimientos antes del período)
      let saldoInicial = 0;
      
      if (fechaInicio) {
        const movimientosPreviosQuery = query(
          movimientosRef,
          where('fecha', '<', fechaInicio)
        );
        
        const movimientosPreviosSnap = await getDocs(movimientosPreviosQuery);
        const movimientosPrevios = movimientosPreviosSnap.docs.map(doc => doc.data());
        
        // Calcular saldo inicial
        movimientosPrevios.forEach(mov => {
          if (mov.tipo === 'INGRESO') {
            saldoInicial += mov.monto;
          } else if (mov.tipo === 'EGRESO') {
            saldoInicial -= mov.monto;
          }
          // Las transferencias no afectan el saldo total
        });
      }
      
      // 3. Clasificar movimientos por actividad
      const movimientosOperacion: MovimientoFlujo[] = [];
      const movimientosInversion: MovimientoFlujo[] = [];
      const movimientosFinanciamiento: MovimientoFlujo[] = [];
      
      movimientos.forEach(mov => {
        // Clasificar según concepto o tipo
        const movimientoFlujo: MovimientoFlujo = {
          descripcion: mov.concepto,
          monto: mov.monto,
          tipo: mov.tipo === 'INGRESO' ? 'INGRESO' : 'EGRESO'
        };
        
        // Clasificación por palabras clave en el concepto
        const concepto = mov.concepto.toLowerCase();
        
        if (
          concepto.includes('cobro') || 
          concepto.includes('venta') || 
          concepto.includes('cliente') ||
          concepto.includes('pago') && (
            concepto.includes('proveedor') || 
            concepto.includes('servicio') || 
            concepto.includes('gasto')
          )
        ) {
          movimientosOperacion.push(movimientoFlujo);
        } 
        else if (
          concepto.includes('compra') && (
            concepto.includes('activo') || 
            concepto.includes('equipo') || 
            concepto.includes('maquinaria')
          ) ||
          concepto.includes('venta') && (
            concepto.includes('activo') || 
            concepto.includes('equipo') || 
            concepto.includes('maquinaria')
          ) ||
          concepto.includes('inversion')
        ) {
          movimientosInversion.push(movimientoFlujo);
        }
        else if (
          concepto.includes('prestamo') || 
          concepto.includes('credito') || 
          concepto.includes('financiamiento') ||
          concepto.includes('dividendo') ||
          concepto.includes('capital')
        ) {
          movimientosFinanciamiento.push(movimientoFlujo);
        }
        else {
          // Por defecto, considerar como operación
          movimientosOperacion.push(movimientoFlujo);
        }
      });
      
      // 4. Agrupar por tipo (ingreso/egreso)
      const ingresosOperacion = movimientosOperacion.filter(m => m.tipo === 'INGRESO');
      const egresosOperacion = movimientosOperacion.filter(m => m.tipo === 'EGRESO');
      
      const ingresosInversion = movimientosInversion.filter(m => m.tipo === 'INGRESO');
      const egresosInversion = movimientosInversion.filter(m => m.tipo === 'EGRESO');
      
      const ingresosFinanciamiento = movimientosFinanciamiento.filter(m => m.tipo === 'INGRESO');
      const egresosFinanciamiento = movimientosFinanciamiento.filter(m => m.tipo === 'EGRESO');
      
      // 5. Calcular totales
      const totalIngresosOperacion = ingresosOperacion.reduce((sum, m) => sum + m.monto, 0);
      const totalEgresosOperacion = egresosOperacion.reduce((sum, m) => sum + m.monto, 0);
      
      const totalIngresosInversion = ingresosInversion.reduce((sum, m) => sum + m.monto, 0);
      const totalEgresosInversion = egresosInversion.reduce((sum, m) => sum + m.monto, 0);
      
      const totalIngresosFinanciamiento = ingresosFinanciamiento.reduce((sum, m) => sum + m.monto, 0);
      const totalEgresosFinanciamiento = egresosFinanciamiento.reduce((sum, m) => sum + m.monto, 0);
      
      const totalOperacion = totalIngresosOperacion - totalEgresosOperacion;
      const totalInversion = totalIngresosInversion - totalEgresosInversion;
      const totalFinanciamiento = totalIngresosFinanciamiento - totalEgresosFinanciamiento;
      
      const flujoPeriodo = totalOperacion + totalInversion + totalFinanciamiento;
      const saldoFinal = saldoInicial + flujoPeriodo;
      
      // 6. Construir estructura del flujo de efectivo
      const flujoEfectivo: FlujoEfectivoData = {
        operacion: [
          {
            nombre: 'INGRESOS OPERACIONALES',
            movimientos: ingresosOperacion,
            total: totalIngresosOperacion
          },
          {
            nombre: 'EGRESOS OPERACIONALES',
            movimientos: egresosOperacion,
            total: -totalEgresosOperacion
          }
        ],
        inversion: [
          {
            nombre: 'INGRESOS DE INVERSIÓN',
            movimientos: ingresosInversion,
            total: totalIngresosInversion
          },
          {
            nombre: 'EGRESOS DE INVERSIÓN',
            movimientos: egresosInversion,
            total: -totalEgresosInversion
          }
        ],
        financiamiento: [
          {
            nombre: 'INGRESOS DE FINANCIAMIENTO',
            movimientos: ingresosFinanciamiento,
            total: totalIngresosFinanciamiento
          },
          {
            nombre: 'EGRESOS DE FINANCIAMIENTO',
            movimientos: egresosFinanciamiento,
            total: -totalEgresosFinanciamiento
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
      
      console.log('✅ Flujo de Efectivo generado correctamente');
      return flujoEfectivo;
    } catch (error) {
      console.error('❌ Error generando Flujo de Efectivo:', error);
      throw error;
    }
  }

  // Exportar Balance General a Excel
  static exportarBalanceGeneralExcel(data: BalanceGeneralData, empresaNombre: string): void {
    try {
      console.log('🔄 Exportando Balance General a Excel...');
      
      // Crear libro de trabajo
      const wb = XLSX.utils.book_new();
      
      // Crear hoja para activos
      const activosData = [
        ['BALANCE GENERAL'],
        [`Empresa: ${empresaNombre}`],
        [`Período: ${data.fechaInicio ? new Date(data.fechaInicio).toLocaleDateString() : 'Inicio'} - ${data.fechaFin ? new Date(data.fechaFin).toLocaleDateString() : 'Fin'}`],
        [`Generado: ${data.fechaGeneracion.toLocaleString()}`],
        [],
        ['ACTIVOS'],
        ['Código', 'Cuenta', 'Saldo']
      ];
      
      // Agregar datos de activos
      data.activos.forEach(grupo => {
        activosData.push([grupo.nombre, '', '']);
        grupo.cuentas.forEach(cuenta => {
          activosData.push([cuenta.codigo, cuenta.nombre, cuenta.saldo]);
        });
        activosData.push(['', 'Total ' + grupo.nombre, grupo.total]);
      });
      
      activosData.push(['', 'TOTAL ACTIVOS', data.totalActivos]);
      activosData.push([]);
      
      // Agregar datos de pasivos
      activosData.push(['PASIVOS']);
      data.pasivos.forEach(grupo => {
        activosData.push([grupo.nombre, '', '']);
        grupo.cuentas.forEach(cuenta => {
          activosData.push([cuenta.codigo, cuenta.nombre, cuenta.saldo]);
        });
        activosData.push(['', 'Total ' + grupo.nombre, grupo.total]);
      });
      
      activosData.push(['', 'TOTAL PASIVOS', data.totalPasivos]);
      activosData.push([]);
      
      // Agregar datos de patrimonio
      activosData.push(['PATRIMONIO']);
      data.patrimonio.forEach(grupo => {
        activosData.push([grupo.nombre, '', '']);
        grupo.cuentas.forEach(cuenta => {
          activosData.push([cuenta.codigo, cuenta.nombre, cuenta.saldo]);
        });
        activosData.push(['', 'Total ' + grupo.nombre, grupo.total]);
      });
      
      activosData.push(['', 'TOTAL PATRIMONIO', data.totalPatrimonio]);
      activosData.push([]);
      
      // Agregar ecuación contable
      activosData.push(['ECUACIÓN CONTABLE']);
      activosData.push(['Total Activos', '=', 'Total Pasivos + Patrimonio']);
      activosData.push([data.totalActivos, '=', data.totalPasivos + data.totalPatrimonio]);
      
      // Crear hoja de trabajo
      const ws = XLSX.utils.aoa_to_sheet(activosData);
      
      // Agregar hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, 'Balance General');
      
      // Guardar archivo
      XLSX.writeFile(wb, `Balance_General_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      console.log('✅ Balance General exportado a Excel correctamente');
    } catch (error) {
      console.error('❌ Error exportando Balance General a Excel:', error);
      throw error;
    }
  }

  // Exportar Balance General a PDF
  static exportarBalanceGeneralPDF(data: BalanceGeneralData, empresaNombre: string): void {
    try {
      console.log('🔄 Exportando Balance General a PDF...');
      
      // Crear documento PDF
      const doc = new jsPDF();
      
      // Configurar título y encabezado
      doc.setFontSize(16);
      doc.text('BALANCE GENERAL', 105, 15, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`Empresa: ${empresaNombre}`, 105, 25, { align: 'center' });
      doc.text(`Período: ${data.fechaInicio ? new Date(data.fechaInicio).toLocaleDateString() : 'Inicio'} - ${data.fechaFin ? new Date(data.fechaFin).toLocaleDateString() : 'Fin'}`, 105, 32, { align: 'center' });
      doc.text(`Generado: ${data.fechaGeneracion.toLocaleString()}`, 105, 39, { align: 'center' });
      
      // Sección de Activos
      doc.setFontSize(14);
      doc.text('ACTIVOS', 14, 50);
      
      // Tabla de Activos
      const activosData: any[] = [];
      
      data.activos.forEach(grupo => {
        activosData.push([{ content: grupo.nombre, colSpan: 3, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }]);
        
        grupo.cuentas.forEach(cuenta => {
          activosData.push([cuenta.codigo, cuenta.nombre, cuenta.saldo.toFixed(2)]);
        });
        
        activosData.push([
          '',
          { content: `Total ${grupo.nombre}`, styles: { fontStyle: 'bold' } },
          { content: grupo.total.toFixed(2), styles: { fontStyle: 'bold' } }
        ]);
      });
      
      activosData.push([
        '',
        { content: 'TOTAL ACTIVOS', styles: { fontStyle: 'bold' } },
        { content: data.totalActivos.toFixed(2), styles: { fontStyle: 'bold' } }
      ]);
      
      // @ts-ignore
      doc.autoTable({
        startY: 55,
        head: [['Código', 'Cuenta', 'Saldo']],
        body: activosData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 100 },
          2: { cellWidth: 30, halign: 'right' }
        }
      });
      
      // Sección de Pasivos
      // @ts-ignore
      const finalY = doc.lastAutoTable.finalY || 150;
      doc.setFontSize(14);
      doc.text('PASIVOS', 14, finalY + 10);
      
      // Tabla de Pasivos
      const pasivosData: any[] = [];
      
      data.pasivos.forEach(grupo => {
        pasivosData.push([{ content: grupo.nombre, colSpan: 3, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }]);
        
        grupo.cuentas.forEach(cuenta => {
          pasivosData.push([cuenta.codigo, cuenta.nombre, cuenta.saldo.toFixed(2)]);
        });
        
        pasivosData.push([
          '',
          { content: `Total ${grupo.nombre}`, styles: { fontStyle: 'bold' } },
          { content: grupo.total.toFixed(2), styles: { fontStyle: 'bold' } }
        ]);
      });
      
      pasivosData.push([
        '',
        { content: 'TOTAL PASIVOS', styles: { fontStyle: 'bold' } },
        { content: data.totalPasivos.toFixed(2), styles: { fontStyle: 'bold' } }
      ]);
      
      // @ts-ignore
      doc.autoTable({
        startY: finalY + 15,
        head: [['Código', 'Cuenta', 'Saldo']],
        body: pasivosData,
        theme: 'grid',
        headStyles: { fillColor: [231, 76, 60], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 100 },
          2: { cellWidth: 30, halign: 'right' }
        }
      });
      
      // Sección de Patrimonio
      // @ts-ignore
      const finalY2 = doc.lastAutoTable.finalY || 200;
      
      // Verificar si necesitamos una nueva página
      if (finalY2 > 220) {
        doc.addPage();
        doc.setFontSize(14);
        doc.text('PATRIMONIO', 14, 20);
        
        // Tabla de Patrimonio
        const patrimonioData: any[] = [];
        
        data.patrimonio.forEach(grupo => {
          patrimonioData.push([{ content: grupo.nombre, colSpan: 3, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }]);
          
          grupo.cuentas.forEach(cuenta => {
            patrimonioData.push([cuenta.codigo, cuenta.nombre, cuenta.saldo.toFixed(2)]);
          });
          
          patrimonioData.push([
            '',
            { content: `Total ${grupo.nombre}`, styles: { fontStyle: 'bold' } },
            { content: grupo.total.toFixed(2), styles: { fontStyle: 'bold' } }
          ]);
        });
        
        patrimonioData.push([
          '',
          { content: 'TOTAL PATRIMONIO', styles: { fontStyle: 'bold' } },
          { content: data.totalPatrimonio.toFixed(2), styles: { fontStyle: 'bold' } }
        ]);
        
        // @ts-ignore
        doc.autoTable({
          startY: 25,
          head: [['Código', 'Cuenta', 'Saldo']],
          body: patrimonioData,
          theme: 'grid',
          headStyles: { fillColor: [46, 204, 113], textColor: 255 },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 100 },
            2: { cellWidth: 30, halign: 'right' }
          }
        });
        
        // Ecuación contable
        // @ts-ignore
        const finalY3 = doc.lastAutoTable.finalY || 100;
        doc.setFontSize(14);
        doc.text('ECUACIÓN CONTABLE', 14, finalY3 + 10);
        
        // @ts-ignore
        doc.autoTable({
          startY: finalY3 + 15,
          body: [
            ['Total Activos', '=', 'Total Pasivos + Patrimonio'],
            [data.totalActivos.toFixed(2), '=', (data.totalPasivos + data.totalPatrimonio).toFixed(2)]
          ],
          theme: 'grid',
          styles: { halign: 'center' },
          columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 20 },
            2: { cellWidth: 80 }
          }
        });
      } else {
        doc.setFontSize(14);
        doc.text('PATRIMONIO', 14, finalY2 + 10);
        
        // Tabla de Patrimonio
        const patrimonioData: any[] = [];
        
        data.patrimonio.forEach(grupo => {
          patrimonioData.push([{ content: grupo.nombre, colSpan: 3, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }]);
          
          grupo.cuentas.forEach(cuenta => {
            patrimonioData.push([cuenta.codigo, cuenta.nombre, cuenta.saldo.toFixed(2)]);
          });
          
          patrimonioData.push([
            '',
            { content: `Total ${grupo.nombre}`, styles: { fontStyle: 'bold' } },
            { content: grupo.total.toFixed(2), styles: { fontStyle: 'bold' } }
          ]);
        });
        
        patrimonioData.push([
          '',
          { content: 'TOTAL PATRIMONIO', styles: { fontStyle: 'bold' } },
          { content: data.totalPatrimonio.toFixed(2), styles: { fontStyle: 'bold' } }
        ]);
        
        // @ts-ignore
        doc.autoTable({
          startY: finalY2 + 15,
          head: [['Código', 'Cuenta', 'Saldo']],
          body: patrimonioData,
          theme: 'grid',
          headStyles: { fillColor: [46, 204, 113], textColor: 255 },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 100 },
            2: { cellWidth: 30, halign: 'right' }
          }
        });
        
        // Ecuación contable
        // @ts-ignore
        const finalY3 = doc.lastAutoTable.finalY || 250;
        doc.setFontSize(14);
        doc.text('ECUACIÓN CONTABLE', 14, finalY3 + 10);
        
        // @ts-ignore
        doc.autoTable({
          startY: finalY3 + 15,
          body: [
            ['Total Activos', '=', 'Total Pasivos + Patrimonio'],
            [data.totalActivos.toFixed(2), '=', (data.totalPasivos + data.totalPatrimonio).toFixed(2)]
          ],
          theme: 'grid',
          styles: { halign: 'center' },
          columnStyles: {
            0: { cellWidth: 60 },
            1: { cellWidth: 20 },
            2: { cellWidth: 80 }
          }
        });
      }
      
      // Guardar PDF
      doc.save(`Balance_General_${new Date().toISOString().split('T')[0]}.pdf`);
      
      console.log('✅ Balance General exportado a PDF correctamente');
    } catch (error) {
      console.error('❌ Error exportando Balance General a PDF:', error);
      throw error;
    }
  }

  // Exportar Estado de Resultados a Excel
  static exportarEstadoResultadosExcel(data: EstadoResultadosData, empresaNombre: string): void {
    try {
      console.log('🔄 Exportando Estado de Resultados a Excel...');
      
      // Crear libro de trabajo
      const wb = XLSX.utils.book_new();
      
      // Crear hoja para estado de resultados
      const resultadosData = [
        ['ESTADO DE RESULTADOS'],
        [`Empresa: ${empresaNombre}`],
        [`Período: ${data.fechaInicio ? new Date(data.fechaInicio).toLocaleDateString() : 'Inicio'} - ${data.fechaFin ? new Date(data.fechaFin).toLocaleDateString() : 'Fin'}`],
        [`Generado: ${data.fechaGeneracion.toLocaleString()}`],
        [],
        ['INGRESOS'],
        ['Código', 'Cuenta', 'Saldo']
      ];
      
      // Agregar datos de ingresos
      data.ingresos.forEach(grupo => {
        resultadosData.push([grupo.nombre, '', '']);
        grupo.cuentas.forEach(cuenta => {
          resultadosData.push([cuenta.codigo, cuenta.nombre, cuenta.saldo]);
        });
        resultadosData.push(['', 'Total ' + grupo.nombre, grupo.total]);
      });
      
      resultadosData.push(['', 'TOTAL INGRESOS', data.totalIngresos]);
      resultadosData.push([]);
      
      // Agregar datos de gastos
      resultadosData.push(['GASTOS']);
      data.gastos.forEach(grupo => {
        resultadosData.push([grupo.nombre, '', '']);
        grupo.cuentas.forEach(cuenta => {
          resultadosData.push([cuenta.codigo, cuenta.nombre, cuenta.saldo]);
        });
        resultadosData.push(['', 'Total ' + grupo.nombre, grupo.total]);
      });
      
      resultadosData.push(['', 'TOTAL GASTOS', data.totalGastos]);
      resultadosData.push([]);
      
      // Agregar resultados
      resultadosData.push(['RESULTADOS']);
      resultadosData.push(['', 'Utilidad Bruta', data.utilidadBruta]);
      resultadosData.push(['', 'Gastos Operativos', data.gastosOperativos]);
      resultadosData.push(['', 'Utilidad Operativa', data.utilidadOperativa]);
      resultadosData.push(['', 'Otros Ingresos', data.otrosIngresos]);
      resultadosData.push(['', 'Otros Gastos', data.otrosGastos]);
      resultadosData.push(['', 'Utilidad Antes de Impuestos', data.utilidadAntesImpuestos]);
      resultadosData.push(['', 'Impuestos', data.impuestos]);
      resultadosData.push(['', 'UTILIDAD NETA', data.utilidadNeta]);
      
      // Crear hoja de trabajo
      const ws = XLSX.utils.aoa_to_sheet(resultadosData);
      
      // Agregar hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, 'Estado de Resultados');
      
      // Guardar archivo
      XLSX.writeFile(wb, `Estado_Resultados_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      console.log('✅ Estado de Resultados exportado a Excel correctamente');
    } catch (error) {
      console.error('❌ Error exportando Estado de Resultados a Excel:', error);
      throw error;
    }
  }

  // Exportar Estado de Resultados a PDF
  static exportarEstadoResultadosPDF(data: EstadoResultadosData, empresaNombre: string): void {
    try {
      console.log('🔄 Exportando Estado de Resultados a PDF...');
      
      // Crear documento PDF
      const doc = new jsPDF();
      
      // Configurar título y encabezado
      doc.setFontSize(16);
      doc.text('ESTADO DE RESULTADOS', 105, 15, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`Empresa: ${empresaNombre}`, 105, 25, { align: 'center' });
      doc.text(`Período: ${data.fechaInicio ? new Date(data.fechaInicio).toLocaleDateString() : 'Inicio'} - ${data.fechaFin ? new Date(data.fechaFin).toLocaleDateString() : 'Fin'}`, 105, 32, { align: 'center' });
      doc.text(`Generado: ${data.fechaGeneracion.toLocaleString()}`, 105, 39, { align: 'center' });
      
      // Sección de Ingresos
      doc.setFontSize(14);
      doc.text('INGRESOS', 14, 50);
      
      // Tabla de Ingresos
      const ingresosData: any[] = [];
      
      data.ingresos.forEach(grupo => {
        ingresosData.push([{ content: grupo.nombre, colSpan: 3, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }]);
        
        grupo.cuentas.forEach(cuenta => {
          ingresosData.push([cuenta.codigo, cuenta.nombre, cuenta.saldo.toFixed(2)]);
        });
        
        ingresosData.push([
          '',
          { content: `Total ${grupo.nombre}`, styles: { fontStyle: 'bold' } },
          { content: grupo.total.toFixed(2), styles: { fontStyle: 'bold' } }
        ]);
      });
      
      ingresosData.push([
        '',
        { content: 'TOTAL INGRESOS', styles: { fontStyle: 'bold' } },
        { content: data.totalIngresos.toFixed(2), styles: { fontStyle: 'bold' } }
      ]);
      
      // @ts-ignore
      doc.autoTable({
        startY: 55,
        head: [['Código', 'Cuenta', 'Saldo']],
        body: ingresosData,
        theme: 'grid',
        headStyles: { fillColor: [46, 204, 113], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 100 },
          2: { cellWidth: 30, halign: 'right' }
        }
      });
      
      // Sección de Gastos
      // @ts-ignore
      const finalY = doc.lastAutoTable.finalY || 150;
      doc.setFontSize(14);
      doc.text('GASTOS', 14, finalY + 10);
      
      // Tabla de Gastos
      const gastosData: any[] = [];
      
      data.gastos.forEach(grupo => {
        gastosData.push([{ content: grupo.nombre, colSpan: 3, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }]);
        
        grupo.cuentas.forEach(cuenta => {
          gastosData.push([cuenta.codigo, cuenta.nombre, cuenta.saldo.toFixed(2)]);
        });
        
        gastosData.push([
          '',
          { content: `Total ${grupo.nombre}`, styles: { fontStyle: 'bold' } },
          { content: grupo.total.toFixed(2), styles: { fontStyle: 'bold' } }
        ]);
      });
      
      gastosData.push([
        '',
        { content: 'TOTAL GASTOS', styles: { fontStyle: 'bold' } },
        { content: data.totalGastos.toFixed(2), styles: { fontStyle: 'bold' } }
      ]);
      
      // @ts-ignore
      doc.autoTable({
        startY: finalY + 15,
        head: [['Código', 'Cuenta', 'Saldo']],
        body: gastosData,
        theme: 'grid',
        headStyles: { fillColor: [231, 76, 60], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 100 },
          2: { cellWidth: 30, halign: 'right' }
        }
      });
      
      // Sección de Resultados
      // @ts-ignore
      const finalY2 = doc.lastAutoTable.finalY || 200;
      
      // Verificar si necesitamos una nueva página
      if (finalY2 > 220) {
        doc.addPage();
        doc.setFontSize(14);
        doc.text('RESULTADOS', 14, 20);
        
        // Tabla de Resultados
        const resultadosData = [
          ['Concepto', 'Monto'],
          ['Utilidad Bruta', data.utilidadBruta.toFixed(2)],
          ['Gastos Operativos', data.gastosOperativos.toFixed(2)],
          ['Utilidad Operativa', data.utilidadOperativa.toFixed(2)],
          ['Otros Ingresos', data.otrosIngresos.toFixed(2)],
          ['Otros Gastos', data.otrosGastos.toFixed(2)],
          ['Utilidad Antes de Impuestos', data.utilidadAntesImpuestos.toFixed(2)],
          ['Impuestos', data.impuestos.toFixed(2)],
          [{ content: 'UTILIDAD NETA', styles: { fontStyle: 'bold' } }, { content: data.utilidadNeta.toFixed(2), styles: { fontStyle: 'bold' } }]
        ];
        
        // @ts-ignore
        doc.autoTable({
          startY: 25,
          body: resultadosData,
          theme: 'grid',
          columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 60, halign: 'right' }
          }
        });
      } else {
        doc.setFontSize(14);
        doc.text('RESULTADOS', 14, finalY2 + 10);
        
        // Tabla de Resultados
        const resultadosData = [
          ['Concepto', 'Monto'],
          ['Utilidad Bruta', data.utilidadBruta.toFixed(2)],
          ['Gastos Operativos', data.gastosOperativos.toFixed(2)],
          ['Utilidad Operativa', data.utilidadOperativa.toFixed(2)],
          ['Otros Ingresos', data.otrosIngresos.toFixed(2)],
          ['Otros Gastos', data.otrosGastos.toFixed(2)],
          ['Utilidad Antes de Impuestos', data.utilidadAntesImpuestos.toFixed(2)],
          ['Impuestos', data.impuestos.toFixed(2)],
          [{ content: 'UTILIDAD NETA', styles: { fontStyle: 'bold' } }, { content: data.utilidadNeta.toFixed(2), styles: { fontStyle: 'bold' } }]
        ];
        
        // @ts-ignore
        doc.autoTable({
          startY: finalY2 + 15,
          body: resultadosData,
          theme: 'grid',
          columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 60, halign: 'right' }
          }
        });
      }
      
      // Guardar PDF
      doc.save(`Estado_Resultados_${new Date().toISOString().split('T')[0]}.pdf`);
      
      console.log('✅ Estado de Resultados exportado a PDF correctamente');
    } catch (error) {
      console.error('❌ Error exportando Estado de Resultados a PDF:', error);
      throw error;
    }
  }

  // Exportar Flujo de Efectivo a Excel
  static exportarFlujoEfectivoExcel(data: FlujoEfectivoData, empresaNombre: string): void {
    try {
      console.log('🔄 Exportando Flujo de Efectivo a Excel...');
      
      // Crear libro de trabajo
      const wb = XLSX.utils.book_new();
      
      // Crear hoja para flujo de efectivo
      const flujoData = [
        ['FLUJO DE EFECTIVO'],
        [`Empresa: ${empresaNombre}`],
        [`Período: ${data.fechaInicio ? new Date(data.fechaInicio).toLocaleDateString() : 'Inicio'} - ${data.fechaFin ? new Date(data.fechaFin).toLocaleDateString() : 'Fin'}`],
        [`Generado: ${data.fechaGeneracion.toLocaleString()}`],
        [],
        ['ACTIVIDADES DE OPERACIÓN'],
        ['Descripción', 'Tipo', 'Monto']
      ];
      
      // Agregar datos de operación
      data.operacion.forEach(grupo => {
        flujoData.push([grupo.nombre, '', '']);
        grupo.movimientos.forEach(mov => {
          flujoData.push([mov.descripcion, mov.tipo, mov.monto]);
        });
        flujoData.push(['', 'Total ' + grupo.nombre, grupo.total]);
      });
      
      flujoData.push(['', 'FLUJO NETO DE OPERACIÓN', data.totalOperacion]);
      flujoData.push([]);
      
      // Agregar datos de inversión
      flujoData.push(['ACTIVIDADES DE INVERSIÓN']);
      data.inversion.forEach(grupo => {
        flujoData.push([grupo.nombre, '', '']);
        grupo.movimientos.forEach(mov => {
          flujoData.push([mov.descripcion, mov.tipo, mov.monto]);
        });
        flujoData.push(['', 'Total ' + grupo.nombre, grupo.total]);
      });
      
      flujoData.push(['', 'FLUJO NETO DE INVERSIÓN', data.totalInversion]);
      flujoData.push([]);
      
      // Agregar datos de financiamiento
      flujoData.push(['ACTIVIDADES DE FINANCIAMIENTO']);
      data.financiamiento.forEach(grupo => {
        flujoData.push([grupo.nombre, '', '']);
        grupo.movimientos.forEach(mov => {
          flujoData.push([mov.descripcion, mov.tipo, mov.monto]);
        });
        flujoData.push(['', 'Total ' + grupo.nombre, grupo.total]);
      });
      
      flujoData.push(['', 'FLUJO NETO DE FINANCIAMIENTO', data.totalFinanciamiento]);
      flujoData.push([]);
      
      // Agregar resumen
      flujoData.push(['RESUMEN']);
      flujoData.push(['', 'Saldo Inicial', data.saldoInicial]);
      flujoData.push(['', 'Flujo de Operación', data.totalOperacion]);
      flujoData.push(['', 'Flujo de Inversión', data.totalInversion]);
      flujoData.push(['', 'Flujo de Financiamiento', data.totalFinanciamiento]);
      flujoData.push(['', 'Flujo del Período', data.flujoPeriodo]);
      flujoData.push(['', 'SALDO FINAL', data.saldoFinal]);
      
      // Crear hoja de trabajo
      const ws = XLSX.utils.aoa_to_sheet(flujoData);
      
      // Agregar hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, 'Flujo de Efectivo');
      
      // Guardar archivo
      XLSX.writeFile(wb, `Flujo_Efectivo_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      console.log('✅ Flujo de Efectivo exportado a Excel correctamente');
    } catch (error) {
      console.error('❌ Error exportando Flujo de Efectivo a Excel:', error);
      throw error;
    }
  }

  // Exportar Flujo de Efectivo a PDF
  static exportarFlujoEfectivoPDF(data: FlujoEfectivoData, empresaNombre: string): void {
    try {
      console.log('🔄 Exportando Flujo de Efectivo a PDF...');
      
      // Crear documento PDF
      const doc = new jsPDF();
      
      // Configurar título y encabezado
      doc.setFontSize(16);
      doc.text('FLUJO DE EFECTIVO', 105, 15, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`Empresa: ${empresaNombre}`, 105, 25, { align: 'center' });
      doc.text(`Período: ${data.fechaInicio ? new Date(data.fechaInicio).toLocaleDateString() : 'Inicio'} - ${data.fechaFin ? new Date(data.fechaFin).toLocaleDateString() : 'Fin'}`, 105, 32, { align: 'center' });
      doc.text(`Generado: ${data.fechaGeneracion.toLocaleString()}`, 105, 39, { align: 'center' });
      
      // Sección de Operación
      doc.setFontSize(14);
      doc.text('ACTIVIDADES DE OPERACIÓN', 14, 50);
      
      // Tabla de Operación
      const operacionData: any[] = [];
      
      data.operacion.forEach(grupo => {
        operacionData.push([{ content: grupo.nombre, colSpan: 3, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }]);
        
        grupo.movimientos.forEach(mov => {
          operacionData.push([
            mov.descripcion, 
            mov.tipo, 
            { content: mov.monto.toFixed(2), styles: { halign: 'right' } }
          ]);
        });
        
        operacionData.push([
          '',
          { content: `Total ${grupo.nombre}`, styles: { fontStyle: 'bold' } },
          { content: grupo.total.toFixed(2), styles: { fontStyle: 'bold', halign: 'right' } }
        ]);
      });
      
      operacionData.push([
        '',
        { content: 'FLUJO NETO DE OPERACIÓN', styles: { fontStyle: 'bold' } },
        { content: data.totalOperacion.toFixed(2), styles: { fontStyle: 'bold', halign: 'right' } }
      ]);
      
      // @ts-ignore
      doc.autoTable({
        startY: 55,
        head: [['Descripción', 'Tipo', 'Monto']],
        body: operacionData,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 40 },
          2: { cellWidth: 30, halign: 'right' }
        }
      });
      
      // Sección de Inversión
      // @ts-ignore
      const finalY = doc.lastAutoTable.finalY || 150;
      doc.setFontSize(14);
      doc.text('ACTIVIDADES DE INVERSIÓN', 14, finalY + 10);
      
      // Tabla de Inversión
      const inversionData: any[] = [];
      
      data.inversion.forEach(grupo => {
        inversionData.push([{ content: grupo.nombre, colSpan: 3, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }]);
        
        grupo.movimientos.forEach(mov => {
          inversionData.push([
            mov.descripcion, 
            mov.tipo, 
            { content: mov.monto.toFixed(2), styles: { halign: 'right' } }
          ]);
        });
        
        inversionData.push([
          '',
          { content: `Total ${grupo.nombre}`, styles: { fontStyle: 'bold' } },
          { content: grupo.total.toFixed(2), styles: { fontStyle: 'bold', halign: 'right' } }
        ]);
      });
      
      inversionData.push([
        '',
        { content: 'FLUJO NETO DE INVERSIÓN', styles: { fontStyle: 'bold' } },
        { content: data.totalInversion.toFixed(2), styles: { fontStyle: 'bold', halign: 'right' } }
      ]);
      
      // @ts-ignore
      doc.autoTable({
        startY: finalY + 15,
        head: [['Descripción', 'Tipo', 'Monto']],
        body: inversionData,
        theme: 'grid',
        headStyles: { fillColor: [142, 68, 173], textColor: 255 },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 40 },
          2: { cellWidth: 30, halign: 'right' }
        }
      });
      
      // Sección de Financiamiento
      // @ts-ignore
      const finalY2 = doc.lastAutoTable.finalY || 200;
      
      // Verificar si necesitamos una nueva página
      if (finalY2 > 220) {
        doc.addPage();
        doc.setFontSize(14);
        doc.text('ACTIVIDADES DE FINANCIAMIENTO', 14, 20);
        
        // Tabla de Financiamiento
        const financiamientoData: any[] = [];
        
        data.financiamiento.forEach(grupo => {
          financiamientoData.push([{ content: grupo.nombre, colSpan: 3, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }]);
          
          grupo.movimientos.forEach(mov => {
            financiamientoData.push([
              mov.descripcion, 
              mov.tipo, 
              { content: mov.monto.toFixed(2), styles: { halign: 'right' } }
            ]);
          });
          
          financiamientoData.push([
            '',
            { content: `Total ${grupo.nombre}`, styles: { fontStyle: 'bold' } },
            { content: grupo.total.toFixed(2), styles: { fontStyle: 'bold', halign: 'right' } }
          ]);
        });
        
        financiamientoData.push([
          '',
          { content: 'FLUJO NETO DE FINANCIAMIENTO', styles: { fontStyle: 'bold' } },
          { content: data.totalFinanciamiento.toFixed(2), styles: { fontStyle: 'bold', halign: 'right' } }
        ]);
        
        // @ts-ignore
        doc.autoTable({
          startY: 25,
          head: [['Descripción', 'Tipo', 'Monto']],
          body: financiamientoData,
          theme: 'grid',
          headStyles: { fillColor: [243, 156, 18], textColor: 255 },
          columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 40 },
            2: { cellWidth: 30, halign: 'right' }
          }
        });
        
        // Resumen
        // @ts-ignore
        const finalY3 = doc.lastAutoTable.finalY || 100;
        doc.setFontSize(14);
        doc.text('RESUMEN', 14, finalY3 + 10);
        
        // @ts-ignore
        doc.autoTable({
          startY: finalY3 + 15,
          body: [
            ['Saldo Inicial', data.saldoInicial.toFixed(2)],
            ['Flujo de Operación', data.totalOperacion.toFixed(2)],
            ['Flujo de Inversión', data.totalInversion.toFixed(2)],
            ['Flujo de Financiamiento', data.totalFinanciamiento.toFixed(2)],
            ['Flujo del Período', data.flujoPeriodo.toFixed(2)],
            [{ content: 'SALDO FINAL', styles: { fontStyle: 'bold' } }, { content: data.saldoFinal.toFixed(2), styles: { fontStyle: 'bold' } }]
          ],
          theme: 'grid',
          columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 60, halign: 'right' }
          }
        });
      } else {
        doc.setFontSize(14);
        doc.text('ACTIVIDADES DE FINANCIAMIENTO', 14, finalY2 + 10);
        
        // Tabla de Financiamiento
        const financiamientoData: any[] = [];
        
        data.financiamiento.forEach(grupo => {
          financiamientoData.push([{ content: grupo.nombre, colSpan: 3, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }]);
          
          grupo.movimientos.forEach(mov => {
            financiamientoData.push([
              mov.descripcion, 
              mov.tipo, 
              { content: mov.monto.toFixed(2), styles: { halign: 'right' } }
            ]);
          });
          
          financiamientoData.push([
            '',
            { content: `Total ${grupo.nombre}`, styles: { fontStyle: 'bold' } },
            { content: grupo.total.toFixed(2), styles: { fontStyle: 'bold', halign: 'right' } }
          ]);
        });
        
        financiamientoData.push([
          '',
          { content: 'FLUJO NETO DE FINANCIAMIENTO', styles: { fontStyle: 'bold' } },
          { content: data.totalFinanciamiento.toFixed(2), styles: { fontStyle: 'bold', halign: 'right' } }
        ]);
        
        // @ts-ignore
        doc.autoTable({
          startY: finalY2 + 15,
          head: [['Descripción', 'Tipo', 'Monto']],
          body: financiamientoData,
          theme: 'grid',
          headStyles: { fillColor: [243, 156, 18], textColor: 255 },
          columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 40 },
            2: { cellWidth: 30, halign: 'right' }
          }
        });
        
        // Resumen
        // @ts-ignore
        const finalY3 = doc.lastAutoTable.finalY || 250;
        doc.setFontSize(14);
        doc.text('RESUMEN', 14, finalY3 + 10);
        
        // @ts-ignore
        doc.autoTable({
          startY: finalY3 + 15,
          body: [
            ['Saldo Inicial', data.saldoInicial.toFixed(2)],
            ['Flujo de Operación', data.totalOperacion.toFixed(2)],
            ['Flujo de Inversión', data.totalInversion.toFixed(2)],
            ['Flujo de Financiamiento', data.totalFinanciamiento.toFixed(2)],
            ['Flujo del Período', data.flujoPeriodo.toFixed(2)],
            [{ content: 'SALDO FINAL', styles: { fontStyle: 'bold' } }, { content: data.saldoFinal.toFixed(2), styles: { fontStyle: 'bold' } }]
          ],
          theme: 'grid',
          columnStyles: {
            0: { cellWidth: 100 },
            1: { cellWidth: 60, halign: 'right' }
          }
        });
      }
      
      // Guardar PDF
      doc.save(`Flujo_Efectivo_${new Date().toISOString().split('T')[0]}.pdf`);
      
      console.log('✅ Flujo de Efectivo exportado a PDF correctamente');
    } catch (error) {
      console.error('❌ Error exportando Flujo de Efectivo a PDF:', error);
      throw error;
    }
  }
}