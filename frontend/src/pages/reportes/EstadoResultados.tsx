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
  TrendingUp,
  TrendingDown,
  DollarSign,
  RefreshCw
} from 'lucide-react';
import { useSesion } from '../../context/SesionContext';
import { useAuth } from '../../context/AuthContext';
import { ReportesService, EstadoResultadosData } from '../../services/firebase/reportes';

export const EstadoResultados: React.FC = () => {
  const { empresaActual, paisActual, formatearMoneda } = useSesion();
  const { usuario } = useAuth();
  
  // Estados
  const [resultadosData, setResultadosData] = useState<EstadoResultadosData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [exporting, setExporting] = useState(false);
  
  // Generar estado de resultados
  const handleGenerarResultados = async () => {
    if (!empresaActual?.id) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const data = await ReportesService.generarEstadoResultados(
        empresaActual.id,
        fechaInicio || undefined,
        fechaFin || undefined
      );
      
      setResultadosData(data);
    } catch (err) {
      console.error('Error generando estado de resultados:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Exportar a Excel
  const handleExportExcel = async () => {
    if (!resultadosData || !empresaActual) return;
    
    setExporting(true);
    try {
      ReportesService.exportarEstadoResultadosExcel(resultadosData, empresaActual.nombre);
    } catch (error) {
      console.error('Error exportando a Excel:', error);
      alert('Error al exportar a Excel');
    } finally {
      setExporting(false);
    }
  };

  // Exportar a PDF
  const handleExportPDF = async () => {
    if (!resultadosData || !empresaActual) return;
    
    setExporting(true);
    try {
      ReportesService.exportarEstadoResultadosPDF(resultadosData, empresaActual.nombre);
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
    setResultadosData(null);
    setError(null);
  };

  if (!empresaActual) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Selecciona una empresa para ver el estado de resultados</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-3 rounded-lg">
              <BarChart3 className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Estado de Resultados</h1>
              <p className="text-purple-100">Análisis de ingresos, gastos y utilidades</p>
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
          <Filter className="h-5 w-5 text-purple-600" />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
            />
          </div>
          
          {/* Botón generar */}
          <div className="flex items-end">
            <button
              onClick={handleGenerarResultados}
              disabled={loading}
              className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4" />
                  Generar Reporte
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
              <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
              <p className="text-gray-600">Generando estado de resultados...</p>
              <p className="text-sm text-gray-500 mt-2">Procesando ingresos y gastos...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center max-w-md">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al generar reporte</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={handleGenerarResultados}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : !resultadosData ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="bg-gray-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <BarChart3 className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Generar Estado de Resultados
              </h3>
              <p className="text-gray-600">
                Configure los filtros y haga clic en "Generar Reporte" para obtener el estado de resultados
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
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    Estado de Resultados
                  </h2>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Empresa:</span> {empresaActual.nombre}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Período:</span> 
                      {resultadosData.fechaInicio ? new Date(resultadosData.fechaInicio).toLocaleDateString('es-PE') : 'Desde el inicio'} - 
                      {resultadosData.fechaFin ? new Date(resultadosData.fechaFin).toLocaleDateString('es-PE') : 'Hasta la fecha'}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Generado:</span> {resultadosData.fechaGeneracion.toLocaleString('es-PE')}
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
                      <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                      <p className="text-lg font-bold text-green-600">
                        {formatearMoneda(resultadosData.totalIngresos)}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Gastos Totales</p>
                      <p className="text-lg font-bold text-red-600">
                        {formatearMoneda(resultadosData.totalGastos)}
                      </p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-red-500" />
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Utilidad Neta</p>
                      <p className="text-lg font-bold text-purple-600">
                        {formatearMoneda(resultadosData.utilidadNeta)}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-purple-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla de resultados */}
            <div className="p-6">
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
                    {/* Ingresos */}
                    {resultadosData.ingresos.map((grupo, grupoIndex) => (
                      <React.Fragment key={`ingreso-${grupoIndex}`}>
                        <tr className="bg-green-50">
                          <td colSpan={2} className="px-6 py-3 text-sm font-semibold text-green-800">
                            {grupo.nombre}
                          </td>
                          <td className="px-6 py-3 text-sm font-semibold text-right text-green-800">
                            {formatearMoneda(grupo.total)}
                          </td>
                        </tr>
                        {grupo.cuentas.map((cuenta, cuentaIndex) => (
                          <tr key={`ingreso-${grupoIndex}-${cuentaIndex}`} className="hover:bg-gray-50">
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
                        TOTAL INGRESOS
                      </td>
                      <td className="px-6 py-3 text-sm text-right text-green-900">
                        {formatearMoneda(resultadosData.totalIngresos)}
                      </td>
                    </tr>

                    {/* Gastos */}
                    {resultadosData.gastos.map((grupo, grupoIndex) => (
                      <React.Fragment key={`gasto-${grupoIndex}`}>
                        <tr className="bg-red-50">
                          <td colSpan={2} className="px-6 py-3 text-sm font-semibold text-red-800">
                            {grupo.nombre}
                          </td>
                          <td className="px-6 py-3 text-sm font-semibold text-right text-red-800">
                            {formatearMoneda(grupo.total)}
                          </td>
                        </tr>
                        {grupo.cuentas.map((cuenta, cuentaIndex) => (
                          <tr key={`gasto-${grupoIndex}-${cuentaIndex}`} className="hover:bg-gray-50">
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
                        TOTAL GASTOS
                      </td>
                      <td className="px-6 py-3 text-sm text-right text-red-900">
                        {formatearMoneda(resultadosData.totalGastos)}
                      </td>
                    </tr>

                    {/* Resultados */}
                    <tr className="bg-gray-100">
                      <td colSpan={2} className="px-6 py-3 text-sm font-semibold text-gray-900">
                        UTILIDAD BRUTA
                      </td>
                      <td className="px-6 py-3 text-sm font-semibold text-right text-gray-900">
                        {formatearMoneda(resultadosData.utilidadBruta)}
                      </td>
                    </tr>
                    <tr className="bg-gray-100">
                      <td colSpan={2} className="px-6 py-3 text-sm font-semibold text-gray-900">
                        GASTOS OPERATIVOS
                      </td>
                      <td className="px-6 py-3 text-sm font-semibold text-right text-gray-900">
                        {formatearMoneda(resultadosData.gastosOperativos)}
                      </td>
                    </tr>
                    <tr className="bg-gray-100">
                      <td colSpan={2} className="px-6 py-3 text-sm font-semibold text-gray-900">
                        UTILIDAD OPERATIVA
                      </td>
                      <td className="px-6 py-3 text-sm font-semibold text-right text-gray-900">
                        {formatearMoneda(resultadosData.utilidadOperativa)}
                      </td>
                    </tr>
                    <tr className="bg-gray-100">
                      <td colSpan={2} className="px-6 py-3 text-sm font-semibold text-gray-900">
                        OTROS INGRESOS
                      </td>
                      <td className="px-6 py-3 text-sm font-semibold text-right text-gray-900">
                        {formatearMoneda(resultadosData.otrosIngresos)}
                      </td>
                    </tr>
                    <tr className="bg-gray-100">
                      <td colSpan={2} className="px-6 py-3 text-sm font-semibold text-gray-900">
                        OTROS GASTOS
                      </td>
                      <td className="px-6 py-3 text-sm font-semibold text-right text-gray-900">
                        {formatearMoneda(resultadosData.otrosGastos)}
                      </td>
                    </tr>
                    <tr className="bg-gray-100">
                      <td colSpan={2} className="px-6 py-3 text-sm font-semibold text-gray-900">
                        UTILIDAD ANTES DE IMPUESTOS
                      </td>
                      <td className="px-6 py-3 text-sm font-semibold text-right text-gray-900">
                        {formatearMoneda(resultadosData.utilidadAntesImpuestos)}
                      </td>
                    </tr>
                    <tr className="bg-gray-100">
                      <td colSpan={2} className="px-6 py-3 text-sm font-semibold text-gray-900">
                        IMPUESTOS
                      </td>
                      <td className="px-6 py-3 text-sm font-semibold text-right text-gray-900">
                        {formatearMoneda(resultadosData.impuestos)}
                      </td>
                    </tr>
                    <tr className="bg-purple-100 font-bold">
                      <td colSpan={2} className="px-6 py-4 text-base text-purple-900">
                        UTILIDAD NETA
                      </td>
                      <td className="px-6 py-4 text-base text-right text-purple-900">
                        {formatearMoneda(resultadosData.utilidadNeta)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};