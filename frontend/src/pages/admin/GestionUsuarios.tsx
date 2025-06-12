import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  FileText,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Mail,
  Phone,
  Building2,
  CreditCard,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Users,
  Receipt,
  Loader2,
  Shield,
  Key,
  X,
  Save,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useSesion } from '../../context/SesionContext';
import { useAuth } from '../../context/AuthContext';
import { useCuentasPorCobrar } from '../../hooks/useCuentasPorCobrar';
import { useNomencladores } from '../../hooks/useNomencladores';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { NotificationModal } from '../../components/common/NotificationModal';
import { useModals } from '../../hooks/useModals';
import { FacturaModal } from '../../components/finanzas/FacturaModal';
import { ClienteModal } from '../../components/finanzas/ClienteModal';
import { PagoModal } from '../../components/finanzas/PagoModal';
import { ResumenCuentasPorCobrar } from '../../components/finanzas/ResumenCuentasPorCobrar';
import { PermissionGuard } from '../../components/PermissionGuard';
import { 
  ROLES, 
  PERMISOS, 
  PERMISOS_POR_ROL, 
  getPermisosPorRol 
} from '@/services/auth0/roles';
import { Auth0UsersService } from '@/services/auth0/users';
import { RolesPermisosList } from '../../components/admin/RolesPermisosList';

export const GestionUsuarios: React.FC = () => {
  const { usuario: usuarioActual } = useAuth();
  const { empresaActual, filtrarUsuariosPorEmpresaActual } = useSesion();
  
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRol, setSelectedRol] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'invite'>('create');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [auth0Connected, setAuth0Connected] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showManagementSetup, setShowManagementSetup] = useState(false);
  const [checkingAuth0, setCheckingAuth0] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Hook para modales
  const {
    notificationModal,
    closeNotification,
    showError,
    showSuccess
  } = useModals();

  // Form states
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    rol: 'usuario',
    empresas: [] as string[],
    permisos: [] as string[],
    password: '',
    generatePassword: true
  });

  useEffect(() => {
    cargarDatos();
    verificarConexionAuth0();
  }, [empresaActual]);

  // Efecto para filtrar usuarios cuando cambia la empresa actual
  useEffect(() => {
    if (usuarios && Array.isArray(usuarios)) {
      // Filtrar usuarios por empresa actual
      const filtrados = filtrarUsuariosPorEmpresaActual(usuarios);
      setUsuariosFiltrados(filtrados);
      
      console.log(`🔍 Usuarios filtrados por empresa actual: ${filtrados.length} de ${usuarios.length} usuarios`);
    } else {
      console.log('⚠️ No hay usuarios para filtrar o no son un array');
      setUsuariosFiltrados([]);
    }
  }, [usuarios, empresaActual, filtrarUsuariosPorEmpresaActual]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Cargar usuarios desde Auth0
      await cargarUsuarios();
    } catch (error) {
      console.error('Error cargando datos:', error);
      showError(
        'Error al cargar datos',
        error instanceof Error ? error.message : 'Error desconocido'
      );
    } finally {
      setLoading(false);
    }
  };

  const cargarUsuarios = async (reset = true) => {
    try {
      setLoadingUsers(true);
      
      if (reset) {
        setPage(0);
        setHasMore(true);
      }
      
      const currentPage = reset ? 0 : page;
      
      // Obtener usuarios desde Auth0
      const usuariosData = await Auth0UsersService.getUsers({
        page: currentPage,
        perPage: 10,
        query: searchTerm ? `email:*${searchTerm}* OR name:*${searchTerm}*` : undefined
      });
      
      // Verificar que usuariosData sea un array
      if (!Array.isArray(usuariosData)) {
        console.error('Error: usuariosData no es un array', usuariosData);
        setUsuarios([]);
        return [];
      }
      
      // Actualizar estado
      if (reset) {
        setUsuarios(usuariosData);
      } else {
        setUsuarios(prev => [...prev, ...usuariosData]);
      }
      
      // Actualizar paginación
      setHasMore(usuariosData.length === 10);
      setPage(currentPage + 1);
      
      return usuariosData;
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      showError(
        'Error al cargar usuarios',
        error instanceof Error ? error.message : 'Error desconocido'
      );
      setUsuarios([]);
      return [];
    } finally {
      setLoadingUsers(false);
    }
  };

  const cargarMasUsuarios = async () => {
    if (loadingUsers || !hasMore) return;
    await cargarUsuarios(false);
  };

  const verificarConexionAuth0 = async () => {
    try {
      setCheckingAuth0(true);
      // Verificar si las variables de entorno están configuradas
      const domain = import.meta.env.VITE_AUTH0_DOMAIN;
      const mgmtClientId = import.meta.env.VITE_AUTH0_MANAGEMENT_CLIENT_ID;
      const mgmtClientSecret = import.meta.env.VITE_AUTH0_MANAGEMENT_CLIENT_SECRET;
      
      const connected = !!(domain && mgmtClientId && mgmtClientSecret);
      setAuth0Connected(connected);
      
      if (connected) {
        // Intentar cargar usuarios como prueba de conexión
        const usuarios = await Auth0UsersService.getUsers({ perPage: 1 });
        setAuth0Connected(usuarios && Array.isArray(usuarios));
      }
    } catch (error) {
      setAuth0Connected(false);
      console.error('Error verificando conexión con Auth0:', error);
    } finally {
      setCheckingAuth0(false);
    }
  };

  // Aplicar filtros a los usuarios ya filtrados por empresa
  const getUsuariosFiltrados = () => {
    if (!usuariosFiltrados || !Array.isArray(usuariosFiltrados)) {
      return [];
    }
    
    return usuariosFiltrados.filter(usuario => {
      const matchesSearch = usuario.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           usuario.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRol = !selectedRol || usuario.rol === selectedRol;
      return matchesSearch && matchesRol;
    });
  };

  const getErrorMessage = (error: any): { title: string; message: string } => {
    const errorMessage = error?.message || error?.toString() || 'Error desconocido';
    
    // Errores de configuración Auth0
    if (errorMessage.includes('Management API') || errorMessage.includes('client_credentials')) {
      return {
        title: 'Error de configuración Auth0',
        message: 'El Auth0 Management API no está configurado correctamente. Verifica las credenciales del Management API en las variables de entorno.'
      };
    }
    
    // Errores de red/conectividad
    if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('NetworkError')) {
      return {
        title: 'Error de conexión',
        message: 'No se pudo conectar con Auth0. Verifica tu conexión a internet y que el dominio de Auth0 sea correcto.'
      };
    }
    
    // Errores de permisos
    if (errorMessage.includes('insufficient_scope') || errorMessage.includes('access_denied')) {
      return {
        title: 'Error de permisos',
        message: 'El Management API no tiene los permisos necesarios. Asegúrate de que tenga los scopes: read:users, create:users, update:users.'
      };
    }
    
    // Errores de validación de datos
    if (errorMessage.includes('email') && errorMessage.includes('already exists')) {
      return {
        title: 'Email ya registrado',
        message: 'Ya existe un usuario con este email. Usa un email diferente o edita el usuario existente.'
      };
    }
    
    if (errorMessage.includes('password') && errorMessage.includes('policy')) {
      return {
        title: 'Contraseña no válida',
        message: 'La contraseña no cumple con las políticas de seguridad. Debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas y números.'
      };
    }
    
    // Errores de función Edge
    if (errorMessage.includes('Edge Function') || errorMessage.includes('Supabase')) {
      return {
        title: 'Error del servidor',
        message: 'Error en la función de servidor. Verifica que la función Edge de Supabase esté desplegada y funcionando correctamente.'
      };
    }
    
    // Error genérico con más contexto
    return {
      title: 'Error al crear usuario',
      message: `Ocurrió un error inesperado: ${errorMessage}. Si el problema persiste, contacta al administrador del sistema.`
    };
  };

  // Extraer el subdominio del email
  const extractSubdomainFromEmail = (email: string): string => {
    try {
      // Obtener la parte después del @ en el email
      const parts = email.split('@');
      if (parts.length !== 2) return '';
      
      const domain = parts[1];
      
      // Eliminar dominios comunes como gmail.com, hotmail.com, etc.
      const commonDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'aol.com', 'protonmail.com', 'mail.com'];
      if (commonDomains.includes(domain.toLowerCase())) {
        return '';
      }
      
      return domain;
    } catch (error) {
      console.error('Error extrayendo subdominio del email:', error);
      return '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!auth0Connected && !import.meta.env.DEV) {
      showError(
        'Error de configuración',
        'No se puede crear usuarios sin conexión a Auth0. Verifica la configuración del Management API.'
      );
      return;
    }
    
    try {
      setIsCreatingUser(true);
      
      // Asegurarse de que la empresa actual esté incluida en las empresas asignadas
      const empresasAsignadas = [...formData.empresas];
      if (empresaActual && !empresasAsignadas.includes(empresaActual.id)) {
        empresasAsignadas.push(empresaActual.id);
      }
      
      // Extraer subdominio del email
      const subdominio = extractSubdomainFromEmail(formData.email);
      console.log(`Subdominio extraído del email: ${subdominio}`);
      
      if (modalType === 'create' || modalType === 'invite') {
        // Crear usuario en Auth0
        const result = await Auth0UsersService.createUser({
          email: formData.email,
          password: formData.generatePassword ? generateRandomPassword() : formData.password,
          name: formData.nombre,
          rol: formData.rol,
          empresas: empresasAsignadas,
          permisos: formData.permisos,
          subdominio: subdominio // Agregar el subdominio extraído del email
        });
        
        showSuccess('Usuario creado', 'El usuario ha sido creado exitosamente');
        
        // Recargar usuarios
        await cargarUsuarios();
      } else if (modalType === 'edit' && selectedUser) {
        // Actualizar usuario en Auth0
        await Auth0UsersService.updateUser(selectedUser.id, {
          name: formData.nombre,
          rol: formData.rol,
          permisos: formData.permisos,
          empresas: empresasAsignadas
        });
        
        showSuccess('Usuario actualizado', 'El usuario ha sido actualizado exitosamente');
        
        // Recargar usuarios
        await cargarUsuarios();
      }

      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error guardando usuario:', error);
      
      // Usar la función mejorada de manejo de errores
      const { title, message } = getErrorMessage(error);
      showError(title, message);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const resetForm = () => {
    // Inicializar con la empresa actual si está disponible
    const empresasIniciales = empresaActual ? [empresaActual.id] : [];
    
    setFormData({
      nombre: '',
      email: '',
      rol: 'usuario',
      empresas: empresasIniciales,
      permisos: getPermisosPorRol('usuario'),
      password: '',
      generatePassword: true
    });
    setSelectedUser(null);
  };

  const openModal = (type: 'create' | 'edit' | 'invite', user?: any) => {
    setModalType(type);
    if (user) {
      setSelectedUser(user);
      if (type === 'edit') {
        setFormData({
          nombre: user.nombre,
          email: user.email,
          rol: user.rol,
          empresas: user.empresasAsignadas || [],
          permisos: user.permisos,
          password: '',
          generatePassword: true
        });
      }
    } else {
      // Para nuevo usuario, inicializar con la empresa actual
      resetForm();
    }
    setShowModal(true);
  };

  const getRolColor = (rol: string) => {
    const colors = {
      'super_admin': 'bg-red-100 text-red-800',
      'admin_empresa': 'bg-orange-100 text-orange-800',
      'contador': 'bg-blue-100 text-blue-800',
      'usuario': 'bg-green-100 text-green-800'
    };
    return colors[rol as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess('Copiado', 'Texto copiado al portapapeles');
  };

  const generateRandomPassword = (): string => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  };

  const exportarUsuarios = () => {
    // Crear CSV
    const headers = ['ID', 'Nombre', 'Email', 'Rol', 'Empresas', 'Permisos', 'Fecha Creación', 'Última Conexión', 'Estado'];
    const rows = getUsuariosFiltrados().map(u => [
      u.id,
      u.nombre,
      u.email,
      u.rol,
      (u.empresasAsignadas || []).join(', '),
      (u.permisos || []).join(', '),
      u.fechaCreacion ? new Date(u.fechaCreacion).toLocaleDateString() : '',
      u.ultimaConexion ? new Date(u.ultimaConexion).toLocaleDateString() : 'Nunca',
      u.activo ? 'Activo' : 'Inactivo'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `usuarios_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Obtener usuarios filtrados
  const usuariosParaMostrar = getUsuariosFiltrados();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600 mt-1">
            Administra usuarios, roles y permisos para {empresaActual?.nombre}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <button
            onClick={() => openModal('invite')}
            disabled={!auth0Connected && !import.meta.env.DEV}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Mail className="h-4 w-4" />
            <span>Invitar Usuario</span>
          </button>
          <button
            onClick={() => openModal('create')}
            disabled={!auth0Connected && !import.meta.env.DEV}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Usuario</span>
          </button>
        </div>
      </div>

      {/* Estado de conexión Auth0 */}
      <div className={`p-4 rounded-lg border ${
        checkingAuth0 ? 'bg-yellow-50 border-yellow-200' :
        auth0Connected ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {checkingAuth0 ? (
              <Loader2 className="h-5 w-5 text-yellow-600 animate-spin" />
            ) : auth0Connected ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            )}
            <div>
              <h3 className={`text-sm font-medium ${
                checkingAuth0 ? 'text-yellow-800' :
                auth0Connected ? 'text-green-800' : 'text-red-800'
              }`}>
                {checkingAuth0 ? 'Verificando conexión Auth0...' :
                 auth0Connected ? 'Auth0 Management API conectado' : 'Error: Auth0 Management API no configurado'}
              </h3>
              {!auth0Connected && !checkingAuth0 && (
                <div className="text-sm text-red-700 mt-1">
                  <p>Para gestionar usuarios necesitas configurar el Auth0 Management API.</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <button 
                      onClick={verificarConexionAuth0}
                      disabled={checkingAuth0}
                      className="text-red-800 underline hover:no-underline flex items-center gap-1"
                    >
                      {checkingAuth0 ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      Reintentar
                    </button>
                    <span>•</span>
                    <button
                      onClick={() => setShowManagementSetup(!showManagementSetup)}
                      className="text-red-800 underline hover:no-underline"
                    >
                      {showManagementSetup ? 'Ocultar instrucciones' : 'Ver instrucciones'}
                    </button>
                  </div>
                </div>
              )}
              {import.meta.env.DEV && !auth0Connected && (
                <p className="text-sm text-yellow-600 mt-1">
                  Modo desarrollo: Puedes crear usuarios de prueba aunque Auth0 Management API no esté configurado.
                </p>
              )}
            </div>
          </div>
          {auth0Connected && (
            <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
              Configurado correctamente
            </span>
          )}
        </div>

        {/* Instrucciones de configuración */}
        {showManagementSetup && !auth0Connected && (
          <div className="mt-4 p-4 bg-red-100 rounded border border-red-200">
            <h4 className="text-sm font-medium text-red-800 mb-3">
              📋 Configuración del Auth0 Management API
            </h4>
            <div className="text-sm text-red-700 space-y-3">
              <div>
                <p className="font-medium">1. Crear Machine to Machine Application:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Ve a Auth0 Dashboard → Applications</li>
                  <li>Click "Create Application"</li>
                  <li>Nombre: "ContaEmpresa Management API"</li>
                  <li>Tipo: "Machine to Machine Applications"</li>
                  <li>Autoriza para "Auth0 Management API"</li>
                </ul>
              </div>
              
              <div>
                <p className="font-medium">2. Configurar permisos:</p>
                <p className="ml-4">Selecciona estos scopes: <code className="bg-red-200 px-2 py-1 rounded">read:users, create:users, update:users, delete:users</code></p>
              </div>
              
              <div>
                <p className="font-medium">3. Obtener credenciales:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Copia el "Client ID" y "Client Secret"</li>
                  <li>Agrégalos a tu archivo .env:</li>
                </ul>
                <div className="mt-2 p-2 bg-red-200 rounded font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <code>VITE_AUTH0_MANAGEMENT_CLIENT_ID=tu-client-id</code>
                    <button
                      onClick={() => copyToClipboard('VITE_AUTH0_MANAGEMENT_CLIENT_ID=tu-client-id')}
                      className="text-red-700 hover:text-red-900"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <code>VITE_AUTH0_MANAGEMENT_CLIENT_SECRET=tu-client-secret</code>
                    <button
                      onClick={() => copyToClipboard('VITE_AUTH0_MANAGEMENT_CLIENT_SECRET=tu-client-secret')}
                      className="text-red-700 hover:text-red-900"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="pt-2 border-t border-red-200">
                <a
                  href="https://auth0.com/docs/get-started/auth0-overview/create-applications/machine-to-machine-apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-red-800 hover:text-red-900 underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>Ver documentación oficial</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Usuarios</p>
              <p className="text-lg font-semibold text-gray-900">{usuariosParaMostrar.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Administradores</p>
              <p className="text-lg font-semibold text-gray-900">
                {usuariosParaMostrar.filter(u => u.rol === 'admin_empresa' || u.rol === 'super_admin').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Usuarios Activos</p>
              <p className="text-lg font-semibold text-gray-900">
                {usuariosParaMostrar.filter(u => u.activo).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <Key className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Roles Definidos</p>
              <p className="text-lg font-semibold text-gray-900">4</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={selectedRol}
            onChange={(e) => setSelectedRol(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos los roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin_empresa">Administrador</option>
            <option value="contador">Contador</option>
            <option value="usuario">Usuario</option>
          </select>

          <div className="flex justify-between">
            <button 
              onClick={() => cargarUsuarios(true)}
              disabled={loadingUsers}
              className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              {loadingUsers ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>Actualizar</span>
            </button>
            
            <button 
              onClick={exportarUsuarios}
              className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Exportar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Lista de Usuarios ({usuariosParaMostrar.length})
          </h3>
          {empresaActual && (
            <p className="text-sm text-gray-600 mt-1">
              Mostrando usuarios asignados a la empresa: {empresaActual.nombre}
            </p>
          )}
        </div>
        
        {loadingUsers && usuarios.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Cargando usuarios...</p>
            </div>
          </div>
        ) : usuariosParaMostrar.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || selectedRol ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedRol 
                ? 'Intenta ajustar los filtros de búsqueda'
                : empresaActual 
                  ? `No hay usuarios asignados a la empresa ${empresaActual.nombre}`
                  : 'Selecciona una empresa para ver sus usuarios'
              }
            </p>
            {!searchTerm && !selectedRol && empresaActual && (
              <button
                onClick={() => openModal('create')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Crear Primer Usuario
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Permisos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Última Conexión
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usuariosParaMostrar.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={usuario.avatar || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150'}
                          alt={usuario.nombre}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{usuario.nombre}</div>
                          <div className="text-sm text-gray-500">{usuario.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRolColor(usuario.rol)}`}>
                        {usuario.rol === 'super_admin' ? 'Super Admin' : 
                         usuario.rol === 'admin_empresa' ? 'Admin' :
                         usuario.rol === 'contador' ? 'Contador' : 'Usuario'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(usuario.permisos || []).slice(0, 3).map((permiso: string) => (
                          <span key={permiso} className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            {permiso}
                          </span>
                        ))}
                        {(usuario.permisos || []).length > 3 && (
                          <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                            +{(usuario.permisos || []).length - 3} más
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        usuario.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {usuario.ultimaConexion ? 
                        new Date(usuario.ultimaConexion).toLocaleDateString() : 
                        'Nunca'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openModal('edit', usuario)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Botón "Cargar más" */}
            {hasMore && (
              <div className="flex justify-center py-4 border-t border-gray-200">
                <button
                  onClick={cargarMasUsuarios}
                  disabled={loadingUsers}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  {loadingUsers ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span>Cargar más usuarios</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    {modalType === 'invite' ? (
                      <Mail className="h-6 w-6 text-blue-600" />
                    ) : modalType === 'edit' ? (
                      <Edit className="h-6 w-6 text-blue-600" />
                    ) : (
                      <Users className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {modalType === 'create' ? 'Crear Usuario' : 
                     modalType === 'edit' ? 'Editar Usuario' : 'Invitar Usuario'}
                  </h2>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Información básica */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Información Básica</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      disabled={modalType === 'edit'}
                    />
                    {modalType === 'create' && formData.email && (
                      <p className="text-xs text-gray-500 mt-1">
                        Subdominio detectado: {extractSubdomainFromEmail(formData.email) || 'Ninguno'}
                      </p>
                    )}
                  </div>
                </div>

                {modalType === 'create' && (
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.generatePassword}
                        onChange={(e) => setFormData({...formData, generatePassword: e.target.checked})}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">Generar contraseña automáticamente</span>
                    </label>
                    
                    {!formData.generatePassword && (
                      <div className="mt-2 relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Contraseña"
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required={!formData.generatePassword}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <Eye className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Roles y permisos */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Roles y Permisos</h3>
                
                <RolesPermisosList
                  selectedRol={formData.rol}
                  selectedPermisos={formData.permisos}
                  onRolChange={(rol) => setFormData({
                    ...formData, 
                    rol,
                    permisos: getPermisosPorRol(rol)
                  })}
                  onPermisosChange={(permisos) => setFormData({...formData, permisos})}
                />
              </div>

              {/* Empresas asignadas */}
              {empresaActual && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Empresas Asignadas</h3>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{empresaActual.nombre}</p>
                        <p className="text-xs text-gray-500">{empresaActual.razonSocial}</p>
                      </div>
                      <div className="flex-shrink-0">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={isCreatingUser}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingUser || (!auth0Connected && !import.meta.env.DEV)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
                >
                  {isCreatingUser ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {modalType === 'create' ? 'Crear Usuario' : 
                      modalType === 'edit' ? 'Guardar Cambios' : 'Enviar Invitación'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de notificación */}
      <NotificationModal
        isOpen={notificationModal.isOpen}
        onClose={closeNotification}
        title={notificationModal.title}
        message={notificationModal.message}
        type={notificationModal.type}
        autoClose={notificationModal.autoClose}
      />
    </div>
  );
};