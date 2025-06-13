import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Filter, 
  Calendar, 
  Building2, 
  BarChart3,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
  Search,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw
} from 'lucide-react';
import { useSesion } from '../../context/SesionContext';
import { useAuth } from '../../context/AuthContext';

// Tipo para el balance general
interface BalanceGeneralData {
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

interface GrupoBalance {
  nombre: string;
  cuentas: CuentaBalance[];
  total: number;
}

interface CuentaBalance {
  codigo: string;
  nombre: string;
  saldo: number;
}

export const BalanceGeneral: React.FC = () => {
  const { empresaActual, paisActual, formatearMoneda } = useSesion();
  const { usuario } = useAuth();
  
  // Estados
  const [balanceData, setBalanceData] = useState<BalanceGeneralData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [exporting, setExporting] = useState(false);
  
  // Generar balance general
  const handleGenerarBalance = async () => {
    if (!empresaActual?.id) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Simulamos una carga de datos
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Datos de ejemplo para el balance general
      const mockBalanceData: BalanceGeneralData = {
        activos: [
          {
            nombre: 'ACTIVO CORRIENTE',
            cuentas: [
              { codigo: '10', nombre: 'EFECTIVO Y EQUIVALENTES DE EFECTIVO', saldo: 25000 },
              { codigo: '12', nombre: 'CUENTAS POR COBRAR COMERCIALES', saldo: 15000 },
              { codigo: '20', nombre: 'MERCADERÍAS', saldo: 30000 }
            ],
            total: 70000
          },
          {
            nombre: 'ACTIVO NO CORRIENTE',
            cuentas: [
              { codigo: '33', nombre: 'INMUEBLES, MAQUINARIA Y EQUIPO', saldo: 120000 },
              { codigo: '39', nombre: 'DEPRECIACIÓN ACUMULADA', saldo: -20000 }
            ],
            total: 100000
          }
        ],
        pasivos: [
          {
            nombre: 'PASIVO CORRIENTE',
            cuentas: [
              { codigo: '40', nombre: 'TRIBUTOS POR PAGAR', saldo: 5000 },
              { codigo: '42', nombre: 'CUENTAS POR PAGAR COMERCIALES', saldo: 25000 }
            ],
            total: 30000
          },
          {
            nombre: 'PASIVO NO CORRIENTE',
            cuentas: [
              { codigo: '45', nombre: 'OBLIGACIONES FINANCIERAS', saldo: 40000 }
            ],
            total: 40000
          }
        ],
        patrimonio: [
          {
            nombre: 'PATRIMONIO',
            cuentas: [
              { codigo: '50', nombre: 'CAPITAL', saldo: 80000 },
              { codigo: '59', nombre: 'RESULTADOS ACUMULADOS', saldo: 20000 }
            ],
            total: 100000
          }
        ],
        totalActivos: 170000,
        totalPasivos: 70000,
        totalPatrimonio: 100000,
        fechaGeneracion: new Date(),
        fechaInicio: fechaInicio || undefined,
        fechaFin: fechaFin || undefined
      };
      
      setBalanceData(mockBalanceData);
    } catch (err) {
      console.error('Error generando balance general:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Exportar a Excel
  const handleExportExcel = async () => {
    if (!balanceData) return;
    
    setExporting(true);
    try {
      // Simulamos la exportación
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Aquí iría la lógica real de exportación
      console.log('Exportando a Excel:', balanceData);
      
      // Mostrar alerta de éxito
      alert('Balance General exportado a Excel correctamente');
    } catch (error) {
      console.error('Error exportando a Excel:', error);
      alert('Error al exportar a Excel');
    } finally {
      setExporting(false);
    }
  };

  // Exportar a PDF
  const handleExportPDF = async () => {
    if (!balanceData) return;
    
    setExporting(true);
    try {
      // Simulamos la exportación
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Aquí iría la lógica real de exportación
      console.log('Exportando a PDF:', balanceData);
      
      // Mostrar alerta de éxito
      alert('Balance General exportado a PDF correctamente');
    } catch (error) {
      console.error('Error exportando a PDF:', error);
      alert('Error al exportar a PDF');
    } finally {
      setExporting(false);
    }
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFechaInicio('');
    setFechaFin('');
    setBalanceData(null);
    setError(null);
  };

  if (!empresaActual) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Selecciona una empresa para ver el balance general</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-3 rounded-lg">
              <FileText className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Balance General</h1>
              <p className="text-blue-100">Estado de situación financiera de la empresa</p>
              <div className="flex items-center space-x-4 mt-2 text-sm">
                <span className="bg-white/20 px-3 py-1 rounded">
                  {empresaActual.nombre}
                </span>
                <span className="bg-white/20 px-3 py-1 rounded">
                  {paisActual?.monedaPrincipal || 'PEN'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={limpiarFiltros}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Filter className="h-5 w-5" />
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Filter className="h-5 w-5 text-blue-600" />
          Filtros de Consulta
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Fecha desde */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Fecha Desde
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>
          
          {/* Fecha hasta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4 inline mr-1" />
              Fecha Hasta
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
          </div>
          
          {/* Botón generar */}
          <div className="flex items-end">
            <button
              onClick={handleGenerarBalance}
              disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4" />
                  Generar Balance
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p>
            <strong>Período:</strong> {fechaInicio ? new Date(fechaInicio).toLocaleDateString('es-PE') : 'Desde el inicio'} - {fechaFin ? new Date(fechaFin).toLocaleDateString('es-PE') : 'Hasta la fecha'}
          </p>
        </div>
      </div>

      {/* Resultados */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Generando balance general...</p>
              <p className="text-sm text-gray-500 mt-2">Procesando cuentas y saldos...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center max-w-md">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al generar balance</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={handleGenerarBalance}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : !balanceData ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="bg-gray-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <FileText className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Generar Balance General
              </h3>
              <p className="text-gray-600">
                Configure los filtros y haga clic en "Generar Balance" para obtener el reporte
              </p>
            </div>
          </div>
        ) : (
          <div>
            {/* Header de resultados */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Balance General
                  </h2>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Empresa:</span> {empresaActual.nombre}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Período:</span> 
                      {balanceData.fechaInicio ? new Date(balanceData.fechaInicio).toLocaleDateString('es-PE') : 'Desde el inicio'} - 
                      {balanceData.fechaFin ? new Date(balanceData.fechaFin).toLocaleDateString('es-PE') : 'Hasta la fecha'}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Generado:</span> {balanceData.fechaGeneracion.toLocaleString('es-PE')}
                    </p>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleExportExcel}
                    disabled={exporting}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {exporting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="h-4 w-4" />
                    )}
                    <span>Excel</span>
                  </button>
                  <button
                    onClick={handleExportPDF}
                    disabled={exporting}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {exporting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    <span>PDF</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Resumen de totales */}
            <div className="p-6 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Activos</p>
                      <p className="text-lg font-bold text-blue-600">
                        {formatearMoneda(balanceData.totalActivos)}
                      </p>
                    </div>
                    <ArrowUpRight className="h-8 w-8 text-blue-500" />
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Pasivos</p>
                      <p className="text-lg font-bold text-red-600">
                        {formatearMoneda(balanceData.totalPasivos)}
                      </p>
                    </div>
                    <ArrowDownRight className="h-8 w-8 text-red-500" />
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Patrimonio</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatearMoneda(balanceData.totalPatrimonio)}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla de balance */}
            <div className="p-6">
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Activos</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Código
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cuenta
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Saldo
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {balanceData.activos.map((grupo, grupoIndex) => (
                        <React.Fragment key={`activo-${grupoIndex}`}>
                          <tr className="bg-blue-50">
                            <td colSpan={2} className="px-6 py-3 text-sm font-semibold text-blue-800">
                              {grupo.nombre}
                            </td>
                            <td className="px-6 py-3 text-sm font-semibold text-right text-blue-800">
                              {formatearMoneda(grupo.total)}
                            </td>
                          </tr>
                          {grupo.cuentas.map((cuenta, cuentaIndex) => (
                            <tr key={`activo-${grupoIndex}-${cuentaIndex}`} className="hover:bg-gray-50">
                              <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                                {cuenta.codigo}
                              </td>
                              <td className="px-6 py-2 text-sm text-gray-900">
                                {cuenta.nombre}
                              </td>
                              <td className="px-6 py-2 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                                {formatearMoneda(cuenta.saldo)}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                      <tr className="bg-blue-100 font-semibold">
                        <td colSpan={2} className="px-6 py-3 text-sm text-blue-900">
                          TOTAL ACTIVOS
                        </td>
                        <td className="px-6 py-3 text-sm text-right text-blue-900">
                          {formatearMoneda(balanceData.totalActivos)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pasivos</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Código
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cuenta
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Saldo
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {balanceData.pasivos.map((grupo, grupoIndex) => (
                        <React.Fragment key={`pasivo-${grupoIndex}`}>
                          <tr className="bg-red-50">
                            <td colSpan={2} className="px-6 py-3 text-sm font-semibold text-red-800">
                              {grupo.nombre}
                            </td>
                            <td className="px-6 py-3 text-sm font-semibold text-right text-red-800">
                              {formatearMoneda(grupo.total)}
                            </td>
                          </tr>
                          {grupo.cuentas.map((cuenta, cuentaIndex) => (
                            <tr key={`pasivo-${grupoIndex}-${cuentaIndex}`} className="hover:bg-gray-50">
                              <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                                {cuenta.codigo}
                              </td>
                              <td className="px-6 py-2 text-sm text-gray-900">
                                {cuenta.nombre}
                              </td>
                              <td className="px-6 py-2 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                                {formatearMoneda(cuenta.saldo)}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                      <tr className="bg-red-100 font-semibold">
                        <td colSpan={2} className="px-6 py-3 text-sm text-red-900">
                          TOTAL PASIVOS
                        </td>
                        <td className="px-6 py-3 text-sm text-right text-red-900">
                          {formatearMoneda(balanceData.totalPasivos)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Patrimonio</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Código
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cuenta
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Saldo
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {balanceData.patrimonio.map((grupo, grupoIndex) => (
                        <React.Fragment key={`patrimonio-${grupoIndex}`}>
                          <tr className="bg-green-50">
                            <td colSpan={2} className="px-6 py-3 text-sm font-semibold text-green-800">
                              {grupo.nombre}
                            </td>
                            <td className="px-6 py-3 text-sm font-semibold text-right text-green-800">
                              {formatearMoneda(grupo.total)}
                            </td>
                          </tr>
                          {grupo.cuentas.map((cuenta, cuentaIndex) => (
                            <tr key={`patrimonio-${grupoIndex}-${cuentaIndex}`} className="hover:bg-gray-50">
                              <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                                {cuenta.codigo}
                              </td>
                              <td className="px-6 py-2 text-sm text-gray-900">
                                {cuenta.nombre}
                              </td>
                              <td className="px-6 py-2 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                                {formatearMoneda(cuenta.saldo)}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                      <tr className="bg-green-100 font-semibold">
                        <td colSpan={2} className="px-6 py-3 text-sm text-green-900">
                          TOTAL PATRIMONIO
                        </td>
                        <td className="px-6 py-3 text-sm text-right text-green-900">
                          {formatearMoneda(balanceData.totalPatrimonio)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Resumen</h3>
                    <p className="text-sm text-gray-600">Ecuación contable: Activo = Pasivo + Patrimonio</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total Activos = Total Pasivos + Patrimonio</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatearMoneda(balanceData.totalActivos)} = {formatearMoneda(balanceData.totalPasivos + balanceData.totalPatrimonio)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};