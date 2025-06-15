import React, { useState } from 'react';
import { 
  Code, 
  Server, 
  FileJson, 
  Copy, 
  Check, 
  ExternalLink, 
  ChevronDown, 
  ChevronRight, 
  Play, 
  Lock, 
  Unlock, 
  Download,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  FileText,
  X,
  Loader2
} from 'lucide-react';
import { useSesion } from '../../context/SesionContext';
import { useAuth } from '../../context/AuthContext';

// Define API endpoint types
interface ApiEndpoint {
  id: string;
  name: string;
  description: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  requiresAuth: boolean;
  category: 'contabilidad' | 'nomina' | 'tesoreria' | 'admin' | 'general';
  parameters: ApiParameter[];
  responses: ApiResponse[];
  example?: {
    request: string;
    response: string;
  };
}

interface ApiParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example?: string;
}

interface ApiResponse {
  status: number;
  description: string;
  schema?: string;
}

export const ApiDocumentation: React.FC = () => {
  const { empresaActual } = useSesion();
  const { usuario } = useAuth();
  
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [testResponse, setTestResponse] = useState<{endpoint: string, response: any} | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Mock API endpoints data
  const apiEndpoints: ApiEndpoint[] = [
    {
      id: 'get-asientos',
      name: 'Obtener Asientos Contables',
      description: 'Obtiene la lista de asientos contables de una empresa',
      method: 'GET',
      path: '/api/v1/contabilidad/asientos',
      requiresAuth: true,
      category: 'contabilidad',
      parameters: [
        {
          name: 'empresa_id',
          type: 'string',
          required: true,
          description: 'ID de la empresa',
          example: empresaActual?.id || 'empresa-123'
        },
        {
          name: 'fecha_desde',
          type: 'string (YYYY-MM-DD)',
          required: false,
          description: 'Fecha de inicio para filtrar',
          example: '2024-01-01'
        },
        {
          name: 'fecha_hasta',
          type: 'string (YYYY-MM-DD)',
          required: false,
          description: 'Fecha de fin para filtrar',
          example: '2024-12-31'
        }
      ],
      responses: [
        {
          status: 200,
          description: 'Lista de asientos contables',
          schema: 'Array<AsientoContable>'
        },
        {
          status: 400,
          description: 'Parámetros inválidos'
        },
        {
          status: 401,
          description: 'No autorizado'
        },
        {
          status: 404,
          description: 'Empresa no encontrada'
        }
      ],
      example: {
        request: `curl -X GET "https://api.contaempresa.com/api/v1/contabilidad/asientos?empresa_id=${empresaActual?.id || 'empresa-123'}&fecha_desde=2024-01-01&fecha_hasta=2024-12-31" \\
-H "Authorization: Bearer {api_key}"`,
        response: `{
  "data": [
    {
      "id": "asiento-123",
      "numero": "ASI-001",
      "fecha": "2024-03-15",
      "descripcion": "Venta de mercadería",
      "estado": "confirmado",
      "movimientos": [
        {
          "id": "mov-1",
          "cuentaId": "cuenta-1",
          "cuenta": "1011 - Caja MN",
          "debito": 1180,
          "credito": 0
        },
        {
          "id": "mov-2",
          "cuentaId": "cuenta-2",
          "cuenta": "7011 - Ventas de mercaderías",
          "debito": 0,
          "credito": 1000
        },
        {
          "id": "mov-3",
          "cuentaId": "cuenta-3",
          "cuenta": "40111 - IGV - Cuenta propia",
          "debito": 0,
          "credito": 180
        }
      ]
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}`
      }
    },
    {
      id: 'post-nomina',
      name: 'Contabilizar Nómina',
      description: 'Genera asientos contables a partir de datos de nómina',
      method: 'POST',
      path: '/api/v1/nomina/contabilizar',
      requiresAuth: true,
      category: 'nomina',
      parameters: [
        {
          name: 'empresa_id',
          type: 'string',
          required: true,
          description: 'ID de la empresa',
          example: empresaActual?.id || 'empresa-123'
        },
        {
          name: 'periodo',
          type: 'string (YYYY-MM)',
          required: true,
          description: 'Periodo de nómina a contabilizar',
          example: '2024-05'
        },
        {
          name: 'tipo_nomina',
          type: 'string',
          required: true,
          description: 'Tipo de nómina (quincenal, mensual)',
          example: 'mensual'
        },
        {
          name: 'datos_nomina',
          type: 'object',
          required: true,
          description: 'Datos de la nómina a contabilizar',
          example: '{ "empleados": [...], "totales": {...} }'
        }
      ],
      responses: [
        {
          status: 200,
          description: 'Asiento contable generado',
          schema: 'AsientoContable'
        },
        {
          status: 400,
          description: 'Datos de nómina inválidos'
        },
        {
          status: 401,
          description: 'No autorizado'
        },
        {
          status: 500,
          description: 'Error al contabilizar'
        }
      ],
      example: {
        request: `curl -X POST "https://api.contaempresa.com/api/v1/nomina/contabilizar" \\
-H "Authorization: Bearer {api_key}" \\
-H "Content-Type: application/json" \\
-d '{
  "empresa_id": "${empresaActual?.id || 'empresa-123'}",
  "periodo": "2024-05",
  "tipo_nomina": "mensual",
  "datos_nomina": {
    "empleados": [
      {
        "id": "emp-001",
        "nombre": "Juan Pérez",
        "salario_base": 3000,
        "horas_extra": 10,
        "bonificaciones": 500,
        "deducciones": 300
      }
    ],
    "totales": {
      "salarios": 3000,
      "horas_extra": 500,
      "bonificaciones": 500,
      "deducciones": 300,
      "total_bruto": 4000,
      "total_neto": 3700
    }
  }
}'`,
        response: `{
  "asiento": {
    "id": "asiento-456",
    "numero": "ASI-045",
    "fecha": "2024-05-31",
    "descripcion": "Contabilización de nómina - Mayo 2024",
    "estado": "confirmado",
    "movimientos": [
      {
        "id": "mov-1",
        "cuentaId": "cuenta-4",
        "cuenta": "6211 - Sueldos y salarios",
        "debito": 4000,
        "credito": 0
      },
      {
        "id": "mov-2",
        "cuentaId": "cuenta-5",
        "cuenta": "4111 - Remuneraciones por pagar",
        "debito": 0,
        "credito": 3700
      },
      {
        "id": "mov-3",
        "cuentaId": "cuenta-6",
        "cuenta": "4031 - Essalud",
        "debito": 0,
        "credito": 300
      }
    ]
  },
  "status": "success",
  "message": "Nómina contabilizada correctamente"
}`
      }
    },
    {
      id: 'get-cuentas',
      name: 'Obtener Plan de Cuentas',
      description: 'Obtiene el plan de cuentas de una empresa',
      method: 'GET',
      path: '/api/v1/contabilidad/cuentas',
      requiresAuth: true,
      category: 'contabilidad',
      parameters: [
        {
          name: 'empresa_id',
          type: 'string',
          required: true,
          description: 'ID de la empresa',
          example: empresaActual?.id || 'empresa-123'
        },
        {
          name: 'activas',
          type: 'boolean',
          required: false,
          description: 'Filtrar solo cuentas activas',
          example: 'true'
        },
        {
          name: 'tipo',
          type: 'string',
          required: false,
          description: 'Filtrar por tipo de cuenta (ACTIVO, PASIVO, etc.)',
          example: 'ACTIVO'
        }
      ],
      responses: [
        {
          status: 200,
          description: 'Lista de cuentas contables',
          schema: 'Array<PlanCuenta>'
        },
        {
          status: 400,
          description: 'Parámetros inválidos'
        },
        {
          status: 401,
          description: 'No autorizado'
        }
      ],
      example: {
        request: `curl -X GET "https://api.contaempresa.com/api/v1/contabilidad/cuentas?empresa_id=${empresaActual?.id || 'empresa-123'}&activas=true" \\
-H "Authorization: Bearer {api_key}"`,
        response: `{
  "data": [
    {
      "id": "cuenta-1",
      "codigo": "1011",
      "nombre": "Caja MN",
      "tipo": "ACTIVO",
      "nivel": 3,
      "activa": true
    },
    {
      "id": "cuenta-2",
      "codigo": "7011",
      "nombre": "Ventas de mercaderías",
      "tipo": "INGRESO",
      "nivel": 3,
      "activa": true
    }
  ],
  "total": 2
}`
      }
    },
    {
      id: 'post-tesoreria-movimiento',
      name: 'Registrar Movimiento de Tesorería',
      description: 'Crea un nuevo movimiento de tesorería',
      method: 'POST',
      path: '/api/v1/tesoreria/movimientos',
      requiresAuth: true,
      category: 'tesoreria',
      parameters: [
        {
          name: 'empresa_id',
          type: 'string',
          required: true,
          description: 'ID de la empresa',
          example: empresaActual?.id || 'empresa-123'
        },
        {
          name: 'fecha',
          type: 'string (YYYY-MM-DD)',
          required: true,
          description: 'Fecha del movimiento',
          example: '2024-05-15'
        },
        {
          name: 'tipo',
          type: 'string',
          required: true,
          description: 'Tipo de movimiento (INGRESO, EGRESO, TRANSFERENCIA)',
          example: 'INGRESO'
        },
        {
          name: 'concepto',
          type: 'string',
          required: true,
          description: 'Descripción del movimiento',
          example: 'Cobro de factura F001-00123'
        },
        {
          name: 'monto',
          type: 'number',
          required: true,
          description: 'Monto del movimiento',
          example: '1500.00'
        },
        {
          name: 'cuenta_id',
          type: 'string',
          required: true,
          description: 'ID de la cuenta bancaria',
          example: 'cuenta-123'
        },
        {
          name: 'cuenta_destino_id',
          type: 'string',
          required: false,
          description: 'ID de la cuenta destino (solo para transferencias)',
          example: 'cuenta-456'
        },
        {
          name: 'referencia',
          type: 'string',
          required: false,
          description: 'Referencia del movimiento',
          example: 'F001-00123'
        }
      ],
      responses: [
        {
          status: 201,
          description: 'Movimiento creado',
          schema: 'MovimientoTesoreria'
        },
        {
          status: 400,
          description: 'Datos inválidos'
        },
        {
          status: 401,
          description: 'No autorizado'
        },
        {
          status: 404,
          description: 'Cuenta no encontrada'
        }
      ],
      example: {
        request: `curl -X POST "https://api.contaempresa.com/api/v1/tesoreria/movimientos" \\
-H "Authorization: Bearer {api_key}" \\
-H "Content-Type: application/json" \\
-d '{
  "empresa_id": "${empresaActual?.id || 'empresa-123'}",
  "fecha": "2024-05-15",
  "tipo": "INGRESO",
  "concepto": "Cobro de factura F001-00123",
  "monto": 1500.00,
  "cuenta_id": "cuenta-123",
  "referencia": "F001-00123"
}'`,
        response: `{
  "id": "mov-789",
  "fecha": "2024-05-15",
  "tipo": "INGRESO",
  "concepto": "Cobro de factura F001-00123",
  "monto": 1500.00,
  "cuenta_id": "cuenta-123",
  "referencia": "F001-00123",
  "estado": "PENDIENTE",
  "empresa_id": "${empresaActual?.id || 'empresa-123'}",
  "creado_por": "usuario-123",
  "fecha_creacion": "2024-05-15T14:30:00Z"
}`
      }
    },
    {
      id: 'get-api-key',
      name: 'Obtener API Key',
      description: 'Genera o recupera una API Key para integraciones',
      method: 'POST',
      path: '/api/v1/admin/api-keys',
      requiresAuth: true,
      category: 'admin',
      parameters: [
        {
          name: 'empresa_id',
          type: 'string',
          required: true,
          description: 'ID de la empresa',
          example: empresaActual?.id || 'empresa-123'
        },
        {
          name: 'nombre',
          type: 'string',
          required: true,
          description: 'Nombre descriptivo para la API Key',
          example: 'Integración Sistema Nómina'
        },
        {
          name: 'permisos',
          type: 'array',
          required: true,
          description: 'Lista de permisos para la API Key',
          example: '["contabilidad:read", "contabilidad:write", "nomina:write"]'
        },
        {
          name: 'fecha_expiracion',
          type: 'string (YYYY-MM-DD)',
          required: false,
          description: 'Fecha de expiración de la API Key',
          example: '2025-12-31'
        }
      ],
      responses: [
        {
          status: 201,
          description: 'API Key generada',
          schema: 'ApiKey'
        },
        {
          status: 400,
          description: 'Datos inválidos'
        },
        {
          status: 401,
          description: 'No autorizado'
        }
      ],
      example: {
        request: `curl -X POST "https://api.contaempresa.com/api/v1/admin/api-keys" \\
-H "Authorization: Bearer {token}" \\
-H "Content-Type: application/json" \\
-d '{
  "empresa_id": "${empresaActual?.id || 'empresa-123'}",
  "nombre": "Integración Sistema Nómina",
  "permisos": ["contabilidad:read", "contabilidad:write", "nomina:write"],
  "fecha_expiracion": "2025-12-31"
}'`,
        response: `{
  "id": "apikey-123",
  "key": "ce_live_a1b2c3d4e5f6g7h8i9j0...",
  "nombre": "Integración Sistema Nómina",
  "permisos": ["contabilidad:read", "contabilidad:write", "nomina:write"],
  "fecha_creacion": "2024-05-15T14:30:00Z",
  "fecha_expiracion": "2025-12-31T23:59:59Z",
  "ultimo_uso": null,
  "activa": true
}`
      }
    }
  ];

  // Filter endpoints based on search and category
  const filteredEndpoints = apiEndpoints.filter(endpoint => {
    const matchesSearch = 
      endpoint.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      endpoint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      endpoint.path.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || endpoint.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Generate API key (mock)
  const handleGenerateApiKey = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setApiKey(`ce_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`);
    } catch (error) {
      console.error('Error generating API key:', error);
    } finally {
      setLoading(false);
    }
  };

  // Test endpoint (mock)
  const handleTestEndpoint = async (endpoint: ApiEndpoint) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setTestResponse({
        endpoint: endpoint.id,
        response: JSON.parse(endpoint.example?.response || '{}')
      });
    } catch (error) {
      console.error('Error testing endpoint:', error);
      setTestResponse({
        endpoint: endpoint.id,
        response: { error: 'Error al probar el endpoint', message: String(error) }
      });
    } finally {
      setLoading(false);
    }
  };

  // Copy to clipboard
  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Get method color
  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'POST': return 'bg-green-100 text-green-800 border-green-200';
      case 'PUT': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'DELETE': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'contabilidad': return <Code className="h-4 w-4" />;
      case 'nomina': return <Users className="h-4 w-4" />;
      case 'tesoreria': return <DollarSign className="h-4 w-4" />;
      case 'admin': return <Settings className="h-4 w-4" />;
      default: return <FileJson className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-3 rounded-lg">
              <Server className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">API Documentation</h1>
              <p className="text-purple-100">Documentación para integraciones con sistemas externos</p>
              <div className="flex items-center space-x-4 mt-2 text-sm">
                <span className="bg-white/20 px-3 py-1 rounded">
                  {apiEndpoints.length} endpoints
                </span>
                <span className="bg-white/20 px-3 py-1 rounded">
                  {Array.from(new Set(apiEndpoints.map(e => e.category))).length} categorías
                </span>
                <a 
                  href="#" 
                  className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors flex items-center gap-1"
                  onClick={(e) => e.preventDefault()}
                >
                  <ExternalLink className="h-3 w-3" />
                  <span>Documentación completa</span>
                </a>
              </div>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleGenerateApiKey}
              disabled={loading}
              className="bg-white text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors flex items-center gap-2 font-medium"
            >
              {apiKey ? <Key className="h-5 w-5" /> : <KeyGenerate className="h-5 w-5" />}
              {apiKey ? 'Regenerar API Key' : 'Generar API Key'}
            </button>
          </div>
        </div>
      </div>

      {/* API Key Section */}
      {apiKey && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Key className="h-5 w-5 text-purple-600" />
              API Key
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Activa
              </span>
              <button
                onClick={() => setApiKey(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="font-mono text-sm bg-gray-100 px-3 py-2 rounded border border-gray-300 flex-1 mr-2 overflow-x-auto">
                {apiKey}
              </div>
              <button
                onClick={() => handleCopy(apiKey, 'apiKey')}
                className="p-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
              >
                {copiedText === 'apiKey' ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Esta API key te permite autenticarte en las APIs de ContaEmpresa. Mantenla segura y no la compartas.
            </p>
          </div>
          
          <div className="mt-4 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">Información importante</h3>
                <p className="text-xs text-yellow-700 mt-1">
                  Esta API key tiene acceso completo a tu cuenta. Guárdala de forma segura y no la incluyas en código público.
                  La API key expirará el 31/12/2025 o cuando la regeneres.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Buscar endpoints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">Todas las categorías</option>
            <option value="contabilidad">Contabilidad</option>
            <option value="nomina">Nómina</option>
            <option value="tesoreria">Tesorería</option>
            <option value="admin">Administración</option>
            <option value="general">General</option>
          </select>

          <div className="flex justify-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
              }}
              className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Limpiar filtros</span>
            </button>
          </div>
        </div>
      </div>

      {/* API Endpoints */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Endpoints ({filteredEndpoints.length})
          </h2>
        </div>
        
        {filteredEndpoints.length === 0 ? (
          <div className="text-center py-12">
            <Server className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron endpoints
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory 
                ? 'Intenta ajustar los filtros de búsqueda'
                : 'No hay endpoints disponibles en este momento'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredEndpoints.map((endpoint) => (
              <div key={endpoint.id} className="p-0">
                <div 
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${expandedEndpoint === endpoint.id ? 'bg-gray-50' : ''}`}
                  onClick={() => setExpandedEndpoint(expandedEndpoint === endpoint.id ? null : endpoint.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`px-3 py-1 rounded-lg text-sm font-medium ${getMethodColor(endpoint.method)}`}>
                        {endpoint.method}
                      </div>
                      <div className="font-mono text-sm text-gray-600">
                        {endpoint.path}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800`}>
                          {getCategoryIcon(endpoint.category)}
                          <span className="ml-1">{endpoint.category}</span>
                        </span>
                        {endpoint.requiresAuth && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Lock className="h-3 w-3 mr-1" />
                            Auth
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{endpoint.name}</span>
                      {expandedEndpoint === endpoint.id ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
                
                {expandedEndpoint === endpoint.id && (
                  <div className="p-6 bg-gray-50 border-t border-gray-200">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">{endpoint.name}</h3>
                        <p className="text-gray-600">{endpoint.description}</p>
                      </div>
                      
                      {/* Parameters */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Parámetros</h4>
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requerido</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ejemplo</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {endpoint.parameters.map((param, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{param.name}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{param.type}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {param.required ? (
                                      <span className="text-red-600">Sí</span>
                                    ) : (
                                      <span className="text-gray-500">No</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-500">{param.description}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{param.example}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      {/* Responses */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3">Respuestas</h4>
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Esquema</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {endpoint.responses.map((response, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      response.status >= 200 && response.status < 300
                                        ? 'bg-green-100 text-green-800'
                                        : response.status >= 400
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {response.status}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{response.description}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{response.schema || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      {/* Example */}
                      {endpoint.example && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Ejemplo</h4>
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-xs font-medium text-gray-700">Request</h5>
                                <button
                                  onClick={() => handleCopy(endpoint.example?.request || '', `request-${endpoint.id}`)}
                                  className="p-1 text-gray-400 hover:text-gray-600"
                                >
                                  {copiedText === `request-${endpoint.id}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </button>
                              </div>
                              <div className="bg-gray-800 rounded-lg p-4 overflow-x-auto">
                                <pre className="text-xs text-gray-300 whitespace-pre-wrap">{endpoint.example.request}</pre>
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="text-xs font-medium text-gray-700">Response</h5>
                                <button
                                  onClick={() => handleCopy(endpoint.example?.response || '', `response-${endpoint.id}`)}
                                  className="p-1 text-gray-400 hover:text-gray-600"
                                >
                                  {copiedText === `response-${endpoint.id}` ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </button>
                              </div>
                              <div className="bg-gray-800 rounded-lg p-4 overflow-x-auto">
                                <pre className="text-xs text-gray-300 whitespace-pre-wrap">{endpoint.example.response}</pre>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Test Endpoint */}
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleTestEndpoint(endpoint)}
                          disabled={loading || !apiKey}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {loading && testResponse?.endpoint === endpoint.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                          <span>Probar Endpoint</span>
                        </button>
                      </div>
                      
                      {/* Test Response */}
                      {testResponse?.endpoint === endpoint.id && (
                        <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-sm font-medium text-gray-900">Respuesta de prueba</h5>
                            <button
                              onClick={() => setTestResponse(null)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="bg-white rounded-lg border border-gray-200 p-4 overflow-x-auto">
                            <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                              {JSON.stringify(testResponse.response, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documentation Links */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recursos Adicionales</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a 
            href="#" 
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-start space-x-3"
            onClick={(e) => e.preventDefault()}
          >
            <FileText className="h-6 w-6 text-purple-600" />
            <div>
              <h3 className="font-medium text-gray-900">Documentación Completa</h3>
              <p className="text-sm text-gray-500 mt-1">Guía detallada de todas las APIs disponibles</p>
            </div>
          </a>
          <a 
            href="#" 
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-start space-x-3"
            onClick={(e) => e.preventDefault()}
          >
            <Code className="h-6 w-6 text-purple-600" />
            <div>
              <h3 className="font-medium text-gray-900">Ejemplos de Código</h3>
              <p className="text-sm text-gray-500 mt-1">Ejemplos en diferentes lenguajes de programación</p>
            </div>
          </a>
          <a 
            href="#" 
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-start space-x-3"
            onClick={(e) => e.preventDefault()}
          >
            <Download className="h-6 w-6 text-purple-600" />
            <div>
              <h3 className="font-medium text-gray-900">Descargar Especificación</h3>
              <p className="text-sm text-gray-500 mt-1">Especificación OpenAPI (Swagger) en formato JSON</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};

// Custom icons
const KeyGenerate: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 9h.01" />
    <path d="M15 6a6 6 0 0 1 6 6c0 3.61-2.14 5.44-5 7l-.29-2.5A4.71 4.71 0 0 0 20 12a5 5 0 0 0-5-5" />
    <path d="M19.25 14.25a1.5 1.5 0 0 0 0-2.12" />
    <path d="m12 15-3 3H7v2H5v2H3v-2.18c0-.53.21-1.03.59-1.41L12 10" />
  </svg>
);

const Key: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

const Users: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const Settings: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const DollarSign: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="12" x2="12" y1="2" y2="22" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

export default ApiDocumentation;