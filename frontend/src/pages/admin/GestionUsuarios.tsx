import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Mail, 
  Shield,
  Users,
  Eye,
  EyeOff,
  UserPlus,
  Settings,
  AlertCircle,
  CheckCircle,
  XCircle,
  ExternalLink,
  Copy,
  RefreshCw,
  Loader2,
  Download
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSesion } from '@/context/SesionContext';
import { NotificationModal } from '@/components/common/NotificationModal';
import { useModals } from '@/hooks/useModals';
import { Auth0UsersService } from '@/services/auth0/users';

export const GestionUsuarios: React.FC = () => {
  const { usuario: usuarioActual } = useAuth();
  const { empresaActual } = useSesion();
  
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [permisos, setPermisos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRol, setSelectedRol] = useState('');
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

  // Hooks para modales
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

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Cargar usuarios desde Auth0
      await cargarUsuarios();
      
      // Cargar roles y permisos (mock por ahora)
      const rolesData = [
        { id: 'super_admin', nombre: 'Super Admin', descripcion: 'Acceso completo al sistema' },
        { id: 'admin_empresa', nombre: 'Administrador', descripcion: 'Administrador de empresa' },
        { id: 'contador', nombre: 'Contador', descripcion: 'Acceso a funciones contables' },
        { id: 'usuario', nombre: 'Usuario', descripcion: 'Acceso básico' }
      ];
      
      const permisosData = [
        { id: 'admin:all', nombre: 'Administración Total', categoria: 'admin' },
        { id: 'empresas:read', nombre: 'Ver Empresas', categoria: 'empresas' },
        { id: 'empresas:write', nombre: 'Gestionar Empresas', categoria: 'empresas' },
        { id: 'contabilidad:read', nombre: 'Ver Contabilidad', categoria: 'contabilidad' },
        { id: 'contabilidad:write', nombre: 'Editar Contabilidad', categoria: 'contabilidad' },
        { id: 'finanzas:read', nombre: 'Ver Finanzas', categoria: 'finanzas' },
        { id: 'finanzas:write', nombre: 'Gestionar Finanzas', categoria: 'finanzas' },
        { id: 'usuarios:read', nombre: 'Ver Usuarios', categoria: 'usuarios' },
        { id: 'usuarios:write', nombre: 'Gestionar Usuarios', categoria: 'usuarios' }
      ];
      
      setRoles(rolesData);
      setPermisos(permisosData);
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

  const filteredUsuarios = usuarios.filter(usuario => {
    const matchesSearch = usuario.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         usuario.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRol = !selectedRol || usuario.rol === selectedRol;
    return matchesSearch && matchesRol;
  });

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
      if (modalType === 'create' || modalType === 'invite') {
        // Aquí iría la lógica para crear usuario
        showSuccess('Usuario creado', 'El usuario ha sido creado exitosamente');
      } else if (modalType === 'edit' && selectedUser) {
        // Aquí iría la lógica para actualizar usuario
        showSuccess('Usuario actualizado', 'El usuario ha sido actualizado exitosamente');
      }

      await cargarUsuarios();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error guardando usuario:', error);
      showError(
        'Error al guardar usuario',
        error instanceof Error ? error.message : 'Error desconocido'
      );
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      email: '',
      rol: 'usuario',
      empresas: [],
      permisos: [],
      password: '',
      generatePassword: true
    });
    setSelectedUser(null);
  };

  const openModal = (type: 'create' | 'edit' | 'invite', user?: any) => {
    setModalType(type);
    if (user) {
      setSelectedUser(user);
      setFormData({
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        empresas: user.empresasAsignadas || [],
        permisos: user.permisos,
        password: '',
        generatePassword: true
      });
    } else {
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

  const getRolPermissions = (rolId: string) => {
    const rol = roles.find(r => r.id === rolId);
    return rol?.permisos || [];
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess('Copiado', 'Texto copiado al portapapeles');
  };

  const exportarUsuarios = () => {
    // Crear CSV
    const headers = ['ID', 'Nombre', 'Email', 'Rol', 'Empresas', 'Permisos', 'Fecha Creación', 'Última Conexión', 'Estado'];
    const rows = filteredUsuarios.map(u => [
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
              <XCircle className="h-5 w-5 text-red-600" />
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
                    <span>VITE_AUTH0_MANAGEMENT_CLIENT_ID=tu-client-id</span>
                    <button
                      onClick={() => copyToClipboard('VITE_AUTH0_MANAGEMENT_CLIENT_ID=tu-client-id')}
                      className="text-red-700 hover:text-red-900"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>VITE_AUTH0_MANAGEMENT_CLIENT_SECRET=tu-client-secret</span>
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
              <p className="text-lg font-semibold text-gray-900">{usuarios.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Administradores</p>
              <p className="text-lg font-semibold text-gray-900">
                {usuarios.filter(u => u.rol === 'admin_empresa' || u.rol === 'super_admin').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <UserPlus className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Usuarios Activos</p>
              <p className="text-lg font-semibold text-gray-900">
                {usuarios.filter(u => u.activo).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <Settings className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Roles Definidos</p>
              <p className="text-lg font-semibold text-gray-900">{roles.length}</p>
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
            Lista de Usuarios ({filteredUsuarios.length})
          </h3>
        </div>
        
        {loadingUsers && usuarios.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Cargando usuarios...</p>
            </div>
          </div>
        ) : filteredUsuarios.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron usuarios
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedRol 
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'Comienza creando tu primer usuario'
              }
            </p>
            {!searchTerm && !selectedRol && (
              <button
                onClick={() => openModal('create')}
                disabled={!auth0Connected && !import.meta.env.DEV}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Crear Primer Usuario
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsuarios.map((usuario) => (
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
                         usuario.rol === 'admin_empresa' ? 'Administrador' : 
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
                      <div className="flex items-center space-x-2">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {modalType === 'create' ? 'Crear Usuario' : 
               modalType === 'edit' ? 'Editar Usuario' : 'Invitar Usuario'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={modalType === 'edit'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rol
                </label>
                <select
                  value={formData.rol}
                  onChange={(e) => {
                    const newRol = e.target.value;
                    setFormData({
                      ...formData, 
                      rol: newRol,
                      permisos: getRolPermissions(newRol)
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="usuario">Usuario</option>
                  <option value="contador">Contador</option>
                  <option value="admin_empresa">Administrador</option>
                  {usuarioActual?.rol === 'super_admin' && (
                    <option value="super_admin">Super Admin</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Permisos
                </label>
                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
                  {permisos.map((permiso) => (
                    <label key={permiso.id} className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        checked={formData.permisos.includes(permiso.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              permisos: [...formData.permisos, permiso.id]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              permisos: formData.permisos.filter(p => p !== permiso.id)
                            });
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm">{permiso.nombre}</span>
                    </label>
                  ))}
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
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required={!formData.generatePassword}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={(!auth0Connected && !import.meta.env.DEV)}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {modalType === 'create' ? 'Crear Usuario' : 
                   modalType === 'edit' ? 'Guardar Cambios' : 'Enviar Invitación'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancelar
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