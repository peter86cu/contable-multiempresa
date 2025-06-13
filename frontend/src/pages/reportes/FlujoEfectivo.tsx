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
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  RefreshCw,
  ArrowLeftRight
} from 'lucide-react';
import { useSesion } from '../../context/SesionContext';
import { useAuth } from '../../context/AuthContext';
import { ReportesService, FlujoEfectivoData } from '../../services/firebase/reportes';

export const FlujoEfectivo: React.FC = () => {
  const { empresaActual, paisActual, formatearMoneda } = useSesion();
  const { usuario } = useAuth();
  
  // Estados
  const [flujoData, setFlujoData] = useState<FlujoEfectivoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [exporting, setExporting] = useState(false);
  
  // Generar flujo de efectivo
  const handleGenerarFlujo = async () => {
    if (!empresaActual?.id) {
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const data = await ReportesService.generarFlujoEfectivo(
        empresaActual.id,
        fechaInicio || undefined,
        fechaFin || undefined
      );
      
      setFlujoData(data);
    } catch (err) {
      console.error('Error generando flujo de efectivo:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Exportar a Excel
  const handleExportExcel = async () => {
    if (!flujoData || !empresaActual) return;
    
    setExporting(true);
    try {
      ReportesService.exportarFlujoEfectivoExcel(flujoData, empresaActual.nombre);
    } catch (error) {
      console.error('Error exportando a Excel:', error);
      alert('Error al exportar a Excel');
    } finally {
      setExporting(false);
    }
  };

  // Exportar a PDF
  const handleExportPDF = async () => {
    if (!flujoData || !empresaActual) return;
    
    setExporting(true);
    try {
      ReportesService.exportarFlujoEfectivoPDF(flujoData, empresaActual.nombre);
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
    setFlujoData(null);
    setError(null);
  };

  if (!empresaActual) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Selecciona una empresa para ver el flujo de efectivo</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-3 rounded-lg">
              <ArrowLeftRight className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Flujo de Efectivo</h1>
              <p className="text-teal-100">Análisis de movimientos de efectivo por actividad</p>
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
          <Filter className="h-5 w-5 text-teal-600" />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              disabled={loading}
            />
          </div>
          
          {/* Botón generar */}
          <div className="flex items-end">
            <button
              onClick={handleGenerarFlujo}
              disabled={loading}
              className="w-full bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <ArrowLeftRight className="h-4 w-4" />
                  Generar Flujo
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
              <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-4" />
              <p className="text-gray-600">Generando flujo de efectivo...</p>
              <p className="text-sm text-gray-500 mt-2">Procesando movimientos de efectivo...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center max-w-md">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al generar flujo</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={handleGenerarFlujo}
                className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : !flujoData ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="bg-gray-100 rounded-full p-6 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <ArrowLeftRight className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Generar Flujo de Efectivo
              </h3>
              <p className="text-gray-600">
                Configure los filtros y haga clic en "Generar Flujo" para obtener el reporte
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
                    <ArrowLeftRight className="h-5 w-5 text-teal-600" />
                    Flujo de Efectivo
                  </h2>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Empresa:</span> {empresaActual.nombre}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Período:</span> 
                      {flujoData.fechaInicio ? new Date(flujoData.fechaInicio).toLocaleDateString('es-PE') : 'Desde el inicio'} - 
                      {flujoData.fechaFin ? new Date(flujoData.fechaFin).toLocaleDateString('es-PE') : 'Hasta la fecha'}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Generado:</span> {flujoData.fechaGeneracion.toLocaleString('es-PE')}
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
                      <p className="text-sm font-medium text-gray-600">Saldo Inicial</p>
                      <p className="text-lg font-bold text-blue-600">
                        {formatearMoneda(flujoData.saldoInicial)}
                      </p>
                    </div>
                    <ArrowUpRight className="h-8 w-8 text-blue-500" />
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Flujo del Período</p>
                      <p className={`text-lg font-bold ${flujoData.flujoPeriodo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatearMoneda(flujoData.flujoPeriodo)}
                      </p>
                    </div>
                    <ArrowLeftRight className="h-8 w-8 text-teal-500" />
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Saldo Final</p>
                      <p className="text-lg font-bold text-teal-600">
                        {formatearMoneda(flujoData.saldoFinal)}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-teal-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla de flujo de efectivo */}
            <div className="p-6">
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividades de Operación</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Descripción
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Monto
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {flujoData.operacion.map((grupo, grupoIndex) => (
                        <React.Fragment key={`operacion-${grupoIndex}`}>
                          <tr className="bg-blue-50">
                            <td className="px-6 py-3 text-sm font-semibold text-blue-800">
                              {grupo.nombre}
                            </td>
                            <td className="px-6 py-3 text-sm font-semibold text-right text-blue-800">
                              {formatearMoneda(grupo.total)}
                            </td>
                          </tr>
                          {grupo.movimientos.map((movimiento, movIndex) => (
                            <tr key={`operacion-${grupoIndex}-${movIndex}`} className="hover:bg-gray-50">
                              <td className="px-6 py-2 text-sm text-gray-900">
                                {movimiento.descripcion}
                              </td>
                              <td className={`px-6 py-2 whitespace-nowrap text-sm text-right font-medium ${
                                movimiento.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {movimiento.tipo === 'INGRESO' ? '+' : '-'} {formatearMoneda(movimiento.monto)}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                      <tr className="bg-blue-100 font-semibold">
                        <td className="px-6 py-3 text-sm text-blue-900">
                          FLUJO NETO DE OPERACIÓN
                        </td>
                        <td className={`px-6 py-3 text-sm text-right ${
                          flujoData.totalOperacion >= 0 ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {formatearMoneda(flujoData.totalOperacion)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividades de Inversión</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Descripción
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Monto
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {flujoData.inversion.map((grupo, grupoIndex) => (
                        <React.Fragment key={`inversion-${grupoIndex}`}>
                          <tr className="bg-purple-50">
                            <td className="px-6 py-3 text-sm font-semibold text-purple-800">
                              {grupo.nombre}
                            </td>
                            <td className="px-6 py-3 text-sm font-semibold text-right text-purple-800">
                              {formatearMoneda(grupo.total)}
                            </td>
                          </tr>
                          {grupo.movimientos.map((movimiento, movIndex) => (
                            <tr key={`inversion-${grupoIndex}-${movIndex}`} className="hover:bg-gray-50">
                              <td className="px-6 py-2 text-sm text-gray-900">
                                {movimiento.descripcion}
                              </td>
                              <td className={`px-6 py-2 whitespace-nowrap text-sm text-right font-medium ${
                                movimiento.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {movimiento.tipo === 'INGRESO' ? '+' : '-'} {formatearMoneda(movimiento.monto)}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                      <tr className="bg-purple-100 font-semibold">
                        <td className="px-6 py-3 text-sm text-purple-900">
                          FLUJO NETO DE INVERSIÓN
                        </td>
                        <td className={`px-6 py-3 text-sm text-right ${
                          flujoData.totalInversion >= 0 ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {formatearMoneda(flujoData.totalInversion)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividades de Financiamiento</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Descripción
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Monto
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {flujoData.financiamiento.map((grupo, grupoIndex) => (
                        <React.Fragment key={`financiamiento-${grupoIndex}`}>
                          <tr className="bg-yellow-50">
                            <td className="px-6 py-3 text-sm font-semibold text-yellow-800">
                              {grupo.nombre}
                            </td>
                            <td className="px-6 py-3 text-sm font-semibold text-right text-yellow-800">
                              {formatearMoneda(grupo.total)}
                            </td>
                          </tr>
                          {grupo.movimientos.map((movimiento, movIndex) => (
                            <tr key={`financiamiento-${grupoIndex}-${movIndex}`} className="hover:bg-gray-50">
                              <td className="px-6 py-2 text-sm text-gray-900">
                                {movimiento.descripcion}
                              </td>
                              <td className={`px-6 py-2 whitespace-nowrap text-sm text-right font-medium ${
                                movimiento.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {movimiento.tipo === 'INGRESO' ? '+' : '-'} {formatearMoneda(movimiento.monto)}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                      <tr className="bg-yellow-100 font-semibold">
                        <td className="px-6 py-3 text-sm text-yellow-900">
                          FLUJO NETO DE FINANCIAMIENTO
                        </td>
                        <td className={`px-6 py-3 text-sm text-right ${
                          flujoData.totalFinanciamiento >= 0 ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {formatearMoneda(flujoData.totalFinanciamiento)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-blue-800">Flujo de Operación</p>
                    <p className={`text-xl font-bold ${flujoData.totalOperacion >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatearMoneda(flujoData.totalOperacion)}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <p className="text-sm font-medium text-purple-800">Flujo de Inversión</p>
                    <p className={`text-xl font-bold ${flujoData.totalInversion >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatearMoneda(flujoData.totalInversion)}
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800">Flujo de Financiamiento</p>
                    <p className={`text-xl font-bold ${flujoData.totalFinanciamiento >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatearMoneda(flujoData.totalFinanciamiento)}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-teal-50 border border-teal-200 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-teal-800">Saldo Inicial</p>
                      <p className="text-xl font-bold text-teal-600">
                        {formatearMoneda(flujoData.saldoInicial)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-teal-800">Flujo del Período</p>
                      <p className={`text-xl font-bold ${flujoData.flujoPeriodo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatearMoneda(flujoData.flujoPeriodo)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-teal-800">Saldo Final</p>
                      <p className="text-xl font-bold text-teal-600">
                        {formatearMoneda(flujoData.saldoFinal)}
                      </p>
                    </div>
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