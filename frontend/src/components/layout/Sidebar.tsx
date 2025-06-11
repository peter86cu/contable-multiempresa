import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Calculator,
  PieChart,
  Users,
  Building2,
  Settings,
  Receipt,
  CreditCard,
  Wallet,
  BarChart3,
  FileBarChart,
  ArrowLeftRight,
  X,
  Database
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const [expandedMenu, setExpandedMenu] = React.useState<string | null>('Contabilidad');
  const { usuario, hasPermission } = useAuth();

  const toggleSubmenu = (title: string) => {
    setExpandedMenu(expandedMenu === title ? null : title);
  };

  // Verificar si el usuario tiene el permiso admin:all
  const hasAdminAll = usuario?.permisos?.includes('admin:all') || false;
  console.log("🔍 SIDEBAR - Usuario:", usuario);
  console.log("🔑 SIDEBAR - Permisos del usuario:", usuario?.permisos);
  console.log("🔑 SIDEBAR - Usuario tiene admin:all:", hasAdminAll);

  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/',
      permiso: null // Accesible para todos los usuarios autenticados
    },
    {
      title: 'Contabilidad',
      icon: Calculator,
      permiso: 'contabilidad:read',
      submenu: [
        { 
          title: 'Plan de Cuentas', 
          icon: FileText, 
          path: '/contabilidad/plan-cuentas',
          permiso: 'contabilidad:read'
        },
        { 
          title: 'Asientos Contables', 
          icon: Receipt, 
          path: '/contabilidad/asientos',
          permiso: 'contabilidad:read'
        },
        { 
          title: 'Libro Mayor', 
          icon: FileBarChart, 
          path: '/contabilidad/mayor',
          permiso: 'contabilidad:read'
        },
        { 
          title: 'Balance de Comprobación', 
          icon: BarChart3, 
          path: '/contabilidad/balance-comprobacion',
          permiso: 'contabilidad:read'
        }
      ]
    },
    {
      title: 'Finanzas',
      icon: Wallet,
      permiso: 'finanzas:read',
      submenu: [
        { 
          title: 'Cuentas por Cobrar', 
          icon: CreditCard, 
          path: '/finanzas/cuentas-cobrar',
          permiso: 'finanzas:read'
        },
        { 
          title: 'Cuentas por Pagar', 
          icon: Receipt, 
          path: '/finanzas/cuentas-pagar',
          permiso: 'finanzas:read'
        },
        { 
          title: 'Tesorería', 
          icon: Wallet, 
          path: '/finanzas/tesoreria',
          permiso: 'finanzas:read'
        },
        { 
          title: 'Conciliación Bancaria', 
          icon: ArrowLeftRight, 
          path: '/finanzas/conciliacion',
          permiso: 'finanzas:read'
        }
      ]
    },
    {
      title: 'Reportes',
      icon: PieChart,
      permiso: 'contabilidad:read',
      submenu: [
        { 
          title: 'Balance General', 
          icon: FileBarChart, 
          path: '/reportes/balance-general',
          permiso: 'contabilidad:read'
        },
        { 
          title: 'Estado de Resultados', 
          icon: BarChart3, 
          path: '/reportes/estado-resultados',
          permiso: 'contabilidad:read'
        },
        { 
          title: 'Flujo de Efectivo', 
          icon: ArrowLeftRight, 
          path: '/reportes/flujo-efectivo',
          permiso: 'contabilidad:read'
        }
      ]
    },
    {
      title: 'Administración',
      icon: Settings,
      permiso: 'empresas:read',
      submenu: [
        { 
          title: 'Empresas', 
          icon: Building2, 
          path: '/admin/empresas',
          permiso: 'empresas:read'
        },
        { 
          title: 'Usuarios', 
          icon: Users, 
          path: '/admin/usuarios',
          permiso: 'usuarios:read'
        },
        { 
          title: 'Nomencladores', 
          icon: Database, 
          path: '/admin/configuracion',
          permiso: 'empresas:read'
        },
        { 
          title: 'Mapeo de Archivos', 
          icon: FileText, 
          path: '/admin/configuracion-mapeo',
          permiso: 'empresas:read'
        }
      ]
    }
  ];

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar - FIJO en desktop, overlay en móvil */}
      <aside
        className={`
          w-64 bg-white border-r border-gray-200 z-50 transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:relative lg:flex lg:flex-col
          fixed lg:static h-full lg:h-auto
        `}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
          <h2 className="text-lg font-semibold text-gray-900">Menú</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            // IMPORTANTE: Si el usuario tiene admin:all, mostrar TODOS los menús
            // Si no, verificar el permiso específico
            console.log(`🔍 SIDEBAR - Evaluando ítem: ${item.title}, permiso: ${item.permiso}`);
            const tienePermiso = hasAdminAll || 
                               item.permiso === null || 
                               (item.permiso && hasPermission(item.permiso));
            
            console.log(`🔑 SIDEBAR - Ítem ${item.title} - Tiene permiso: ${tienePermiso}`);
            
            // Si no tiene permiso, no mostrar el ítem
            if (!tienePermiso) {
              console.log(`❌ SIDEBAR - Ítem ${item.title} - No tiene permiso, ocultando`);
              return null;
            }
            
            return (
              <div key={item.title}>
                {item.submenu ? (
                  <div>
                    <button
                      onClick={() => toggleSubmenu(item.title)}
                      className="w-full flex items-center justify-between px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <item.icon className="h-5 w-5" />
                        <span className="font-medium">{item.title}</span>
                      </div>
                      <span className={`transform transition-transform ${
                        expandedMenu === item.title ? 'rotate-90' : ''
                      }`}>
                        ▶
                      </span>
                    </button>
                    
                    {expandedMenu === item.title && (
                      <div className="ml-4 mt-2 space-y-1">
                        {item.submenu.map((subItem) => {
                          // IMPORTANTE: Si el usuario tiene admin:all, mostrar TODOS los submenús
                          // Si no, verificar el permiso específico
                          console.log(`🔍 SIDEBAR - Evaluando subítem: ${subItem.title}, permiso: ${subItem.permiso}`);
                          const tienePermisoSub = hasAdminAll || 
                                               subItem.permiso === null || 
                                               (subItem.permiso && hasPermission(subItem.permiso));
                          
                          console.log(`🔑 SIDEBAR - Subítem ${subItem.title} - Tiene permiso: ${tienePermisoSub}`);
                          
                          // Si no tiene permiso, no mostrar el subítem
                          if (!tienePermisoSub) {
                            return null;
                          }
                          
                          return (
                            <NavLink
                              key={subItem.path}
                              to={subItem.path}
                              className={({ isActive }) =>
                                `flex items-center space-x-3 px-3 py-2 text-sm rounded-md transition-colors ${
                                  isActive
                                    ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`
                              }
                              onClick={() => window.innerWidth < 1024 && onClose()}
                            >
                              <subItem.icon className="h-4 w-4" />
                              <span>{subItem.title}</span>
                            </NavLink>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`
                    }
                    onClick={() => window.innerWidth < 1024 && onClose()}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.title}</span>
                  </NavLink>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
};