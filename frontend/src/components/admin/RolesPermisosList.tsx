import React from 'react';
import { 
  Shield, 
  Check, 
  Lock, 
  Building2, 
  Calculator, 
  Wallet, 
  Users 
} from 'lucide-react';
import { 
  ROLES, 
  PERMISOS, 
  PERMISOS_POR_ROL, 
  ROLES_DESCRIPCION, 
  PERMISOS_DESCRIPCION,
  CATEGORIAS_PERMISOS,
  PERMISOS_POR_CATEGORIA
} from '@/services/auth0/roles';

interface RolesPermisosListProps {
  selectedRol: string;
  selectedPermisos: string[];
  onRolChange: (rol: string) => void;
  onPermisosChange: (permisos: string[]) => void;
  disabled?: boolean;
}

export const RolesPermisosList: React.FC<RolesPermisosListProps> = ({
  selectedRol,
  selectedPermisos,
  onRolChange,
  onPermisosChange,
  disabled = false
}) => {
  // Manejar cambio de rol
  const handleRolChange = (rol: string) => {
    onRolChange(rol);
    // Actualizar permisos según el rol seleccionado
    onPermisosChange(PERMISOS_POR_ROL[rol as keyof typeof PERMISOS_POR_ROL] || []);
  };

  // Manejar cambio de permisos
  const handlePermisoChange = (permiso: string, checked: boolean) => {
    if (checked) {
      onPermisosChange([...selectedPermisos, permiso]);
    } else {
      onPermisosChange(selectedPermisos.filter(p => p !== permiso));
    }
  };

  // Obtener ícono para categoría
  const getCategoryIcon = (categoria: string) => {
    switch (categoria) {
      case CATEGORIAS_PERMISOS.ADMIN:
        return <Lock className="h-4 w-4 text-red-600" />;
      case CATEGORIAS_PERMISOS.EMPRESAS:
        return <Building2 className="h-4 w-4 text-blue-600" />;
      case CATEGORIAS_PERMISOS.CONTABILIDAD:
        return <Calculator className="h-4 w-4 text-green-600" />;
      case CATEGORIAS_PERMISOS.FINANZAS:
        return <Wallet className="h-4 w-4 text-purple-600" />;
      case CATEGORIAS_PERMISOS.USUARIOS:
        return <Users className="h-4 w-4 text-orange-600" />;
      default:
        return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Selección de rol */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Rol del Usuario</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(ROLES).map(([key, value]) => (
            <div 
              key={value}
              className={`
                p-3 rounded-lg border cursor-pointer transition-colors
                ${selectedRol === value 
                  ? 'bg-blue-50 border-blue-300' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              onClick={() => !disabled && handleRolChange(value)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${selectedRol === value ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    <Shield className={`h-4 w-4 ${selectedRol === value ? 'text-blue-600' : 'text-gray-600'}`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{key.replace('_', ' ')}</p>
                    <p className="text-xs text-gray-500">{ROLES_DESCRIPCION[value]}</p>
                  </div>
                </div>
                {selectedRol === value && (
                  <Check className="h-5 w-5 text-blue-600" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lista de permisos por categoría */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Permisos Asignados</h3>
        
        <div className="space-y-4">
          {Object.entries(CATEGORIAS_PERMISOS).map(([key, categoria]) => (
            <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 p-3 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  {getCategoryIcon(categoria)}
                  <h4 className="font-medium text-gray-900">{categoria}</h4>
                </div>
              </div>
              
              <div className="p-3 space-y-2">
                {PERMISOS_POR_CATEGORIA[categoria].map(permiso => (
                  <label 
                    key={permiso} 
                    className={`flex items-center space-x-2 p-2 rounded hover:bg-gray-50 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPermisos.includes(permiso)}
                      onChange={(e) => !disabled && handlePermisoChange(permiso, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={disabled}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{PERMISOS_DESCRIPCION[permiso]}</p>
                      <p className="text-xs text-gray-500">{permiso}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};