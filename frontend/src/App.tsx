import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SesionProvider } from './context/SesionContext';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { FirebaseAuthService } from './config/firebaseAuth';
import { ProtectedRoute } from './components/ProtectedRoute';

// Lazy load components to improve performance
const PlanCuentas = React.lazy(() =>
  import('./pages/contabilidad/PlanCuentas')
    .then(mod => ({ default: mod.PlanCuentas }))
)

const AsientosContables = React.lazy(() =>
  import('./pages/contabilidad/AsientosContables')
    .then(mod => ({ default: mod.AsientosContables }))
)

const LibroMayor = React.lazy(() =>
  import('./pages/contabilidad/LibroMayor')
    .then(mod => ({ default: mod.LibroMayor }))
)

const BalanceComprobacion = React.lazy(() =>
  import('./pages/contabilidad/BalanceComprobacion')
    .then(mod => ({ default: mod.BalanceComprobacion }))
)

const CuentasPorCobrar = React.lazy(() =>
  import('./pages/finanzas/CuentasPorCobrar')
    .then(mod => ({ default: mod.CuentasPorCobrar }))
)

const CuentasPorPagar = React.lazy(() =>
  import('./pages/finanzas/CuentasPorPagar')
    .then(mod => ({ default: mod.CuentasPorPagar }))
)

const Tesoreria = React.lazy(() =>
  import('./pages/finanzas/Tesoreria')
    .then(mod => ({ default: mod.Tesoreria }))
)

const ConciliacionBancaria = React.lazy(() =>
  import('./pages/finanzas/ConciliacionBancaria')
    .then(mod => ({ default: mod.ConciliacionBancaria }))
)

const GestionUsuarios = React.lazy(() =>
  import('./pages/admin/GestionUsuarios')
    .then(mod => ({ default: mod.GestionUsuarios }))
)

const GestionEmpresas = React.lazy(() =>
  import('./pages/admin/GestionEmpresas')
    .then(mod => ({ default: mod.GestionEmpresas }))
)
const GestionNomencladores = React.lazy(() =>
  import('./pages/admin/GestionNomencladores')
    .then(mod => ({ default: mod.GestionNomencladores }))
)

const ConfiguracionMapeoArchivos = React.lazy(() =>
  import('./pages/admin/ConfiguracionMapeoArchivos')
    .then(mod => ({ default: mod.ConfiguracionMapeoArchivos }))
)

const ManualRouter = React.lazy(() =>
  import('./manuales/ManualRouter')
    .then(mod => ({ default: mod.ManualRouter }))
)

// Lazy load report components
const BalanceGeneral = React.lazy(() =>
  import('./pages/reportes/BalanceGeneral')
    .then(mod => ({ default: mod.BalanceGeneral }))
)

const EstadoResultados = React.lazy(() =>
  import('./pages/reportes/EstadoResultados')
    .then(mod => ({ default: mod.EstadoResultados }))
)

const FlujoEfectivo = React.lazy(() =>
  import('./pages/reportes/FlujoEfectivo')
    .then(mod => ({ default: mod.FlujoEfectivo }))
)

const AppRoutes: React.FC = () => {
  const { usuario, isLoading, isAuthenticated, error } = useAuth();

  // Inicializar autenticación de Firebase al cargar la app
  useEffect(() => {
    console.log('🔄 Inicializando autenticación de Firebase...');
    FirebaseAuthService.initialize().catch(error => {
      console.error('❌ Error inicializando autenticación de Firebase:', error);
    });
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando aplicación...</p>
        </div>
      </div>
    );
  }

  // Mostrar error si existe
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Recargar página
          </button>
        </div>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SesionProvider>
      <Layout>
        <React.Suspense fallback={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando módulo...</p>
            </div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            
            {/* Rutas de Contabilidad */}
            <Route path="/contabilidad/plan-cuentas" element={
              <ProtectedRoute requiredPermission="contabilidad:read">
                <PlanCuentas />
              </ProtectedRoute>
            } />
            <Route path="/contabilidad/asientos" element={
              <ProtectedRoute requiredPermission="contabilidad:read">
                <AsientosContables />
              </ProtectedRoute>
            } />
            <Route path="/contabilidad/mayor" element={
              <ProtectedRoute requiredPermission="contabilidad:read">
                <LibroMayor />
              </ProtectedRoute>
            } />
            <Route path="/contabilidad/balance-comprobacion" element={
              <ProtectedRoute requiredPermission="contabilidad:read">
                <BalanceComprobacion />
              </ProtectedRoute>
            } />
            
            {/* Rutas de Finanzas */}
            <Route path="/finanzas/cuentas-cobrar" element={
              <ProtectedRoute requiredPermission="finanzas:read">
                <CuentasPorCobrar />
              </ProtectedRoute>
            } />
            <Route path="/finanzas/cuentas-pagar" element={
              <ProtectedRoute requiredPermission="finanzas:read">
                <CuentasPorPagar />
              </ProtectedRoute>
            } />
            <Route path="/finanzas/tesoreria" element={
              <ProtectedRoute requiredPermission="finanzas:read">
                <Tesoreria />
              </ProtectedRoute>
            } />
            <Route path="/finanzas/conciliacion" element={
              <ProtectedRoute requiredPermission="finanzas:read">
                <ConciliacionBancaria />
              </ProtectedRoute>
            } />
            
            {/* Rutas de Reportes */}
            <Route path="/reportes/balance-general" element={
              <ProtectedRoute requiredPermission="contabilidad:read">
                <BalanceGeneral />
              </ProtectedRoute>
            } />
            <Route path="/reportes/estado-resultados" element={
              <ProtectedRoute requiredPermission="contabilidad:read">
                <EstadoResultados />
              </ProtectedRoute>
            } />
            <Route path="/reportes/flujo-efectivo" element={
              <ProtectedRoute requiredPermission="contabilidad:read">
                <FlujoEfectivo />
              </ProtectedRoute>
            } />
            
            {/* Rutas de Administración */}
            <Route path="/admin/empresas" element={
              <ProtectedRoute requiredPermission="empresas:read">
                <GestionEmpresas />
              </ProtectedRoute>
            } />
            <Route path="/admin/usuarios" element={
              <ProtectedRoute requiredPermission="usuarios:read">
                <GestionUsuarios />
              </ProtectedRoute>
            } />
            <Route path="/admin/configuracion" element={
              <ProtectedRoute requiredPermission="empresas:read">
                <GestionNomencladores />
              </ProtectedRoute>
            } />
            <Route path="/admin/configuracion-mapeo" element={
              <ProtectedRoute requiredPermission="empresas:read">
                <ConfiguracionMapeoArchivos />
              </ProtectedRoute>
            } />
            
            {/* Rutas para el manual de usuario */}
            <Route path="/manuales/*" element={<ManualRouter />} />
            
            <Route path="*" element={<Navigate to="/\" replace />} />
          </Routes>
        </React.Suspense>
      </Layout>
    </SesionProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<AppRoutes />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;