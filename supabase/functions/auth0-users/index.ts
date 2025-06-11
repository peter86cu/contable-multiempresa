import { createClient } from 'npm:@supabase/supabase-js@2';

// Configuración de CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

// Función para manejar solicitudes CORS preflight
function handleCors(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }
  return null;
}

// Función para validar variables de entorno
function validateEnvironmentVariables() {
  const requiredVars = {
    AUTH0_DOMAIN: Deno.env.get('AUTH0_DOMAIN'),
    AUTH0_MGMT_CLIENT_ID: Deno.env.get('AUTH0_MGMT_CLIENT_ID'),
    AUTH0_MGMT_CLIENT_SECRET: Deno.env.get('AUTH0_MGMT_CLIENT_SECRET')
  };

  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key, _]) => key);

  if (missingVars.length > 0) {
    console.warn(`Variables de entorno faltantes: ${missingVars.join(', ')}`);
    return null;
  }

  return requiredVars;
}

// Función para obtener token de Auth0 Management API
async function getAuth0ManagementToken(domain: string, clientId: string, clientSecret: string) {
  try {
    console.log('Obteniendo token de Auth0 Management API...');
    
    const response = await fetch(`https://${domain}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        audience: `https://${domain}/api/v2/`,
        grant_type: 'client_credentials'
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Error obteniendo token de Auth0: ${response.status} ${response.statusText}`);
      console.error(`Respuesta: ${errorData}`);
      throw new Error(`Error obteniendo token de Auth0: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Token de Auth0 Management API obtenido correctamente');
    return data.access_token;
  } catch (error) {
    console.error('Error obteniendo token de Auth0:', error);
    throw error;
  }
}

// Función para obtener usuarios de Auth0
async function getAuth0Users(domain: string, token: string, params: any) {
  try {
    console.log('Obteniendo usuarios de Auth0...');
    
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const url = `https://${domain}/api/v2/users?${searchParams.toString()}`;
    console.log(`URL de solicitud: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Error obteniendo usuarios de Auth0: ${response.status} ${response.statusText}`);
      console.error(`Respuesta: ${errorData}`);
      throw new Error(`Error obteniendo usuarios de Auth0: ${response.status} ${response.statusText}`);
    }

    const users = await response.json();
    console.log(`Se obtuvieron ${users.length} usuarios de Auth0`);
    return users;
  } catch (error) {
    console.error('Error obteniendo usuarios de Auth0:', error);
    throw error;
  }
}

// Función para crear usuario en Auth0
async function createAuth0User(domain: string, token: string, userData: any) {
  try {
    console.log('Creando usuario en Auth0:', userData.email);
    
    const response = await fetch(`https://${domain}/api/v2/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`Error creando usuario en Auth0: ${response.status} ${response.statusText}`);
      console.error('Detalles del error:', error);
      throw new Error(`Error creando usuario en Auth0: ${error.message || response.statusText}`);
    }

    const user = await response.json();
    console.log('Usuario creado correctamente en Auth0:', user.user_id);
    return user;
  } catch (error) {
    console.error('Error creando usuario en Auth0:', error);
    throw error;
  }
}

// Función para actualizar usuario en Auth0
async function updateAuth0User(domain: string, token: string, userId: string, userData: any) {
  try {
    console.log(`Actualizando usuario en Auth0: ${userId}`);
    
    const response = await fetch(`https://${domain}/api/v2/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`Error actualizando usuario en Auth0: ${response.status} ${response.statusText}`);
      console.error('Detalles del error:', error);
      throw new Error(`Error actualizando usuario en Auth0: ${error.message || response.statusText}`);
    }

    const user = await response.json();
    console.log('Usuario actualizado correctamente en Auth0');
    return user;
  } catch (error) {
    console.error('Error actualizando usuario en Auth0:', error);
    throw error;
  }
}

// Función para eliminar usuario en Auth0
async function deleteAuth0User(domain: string, token: string, userId: string) {
  try {
    console.log(`Eliminando usuario en Auth0: ${userId}`);
    
    const response = await fetch(`https://${domain}/api/v2/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error eliminando usuario en Auth0: ${response.status} ${response.statusText}`);
      console.error('Detalles del error:', errorText);
      throw new Error(`Error eliminando usuario en Auth0: ${response.statusText}`);
    }

    console.log('Usuario eliminado correctamente en Auth0');
    return true;
  } catch (error) {
    console.error('Error eliminando usuario en Auth0:', error);
    throw error;
  }
}

// Función para generar datos mock de usuarios
function getMockUsers() {
  return [
    {
      user_id: 'auth0|123456789',
      email: 'admin@contaempresa.com',
      name: 'Administrador',
      picture: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
      app_metadata: {
        rol: 'super_admin',
        empresas: ['dev-empresa-pe', 'dev-empresa-co', 'dev-empresa-mx'],
        permisos: ['admin:all']
      },
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
      blocked: false
    },
    {
      user_id: 'auth0|987654321',
      email: 'contador@contaempresa.com',
      name: 'María González',
      picture: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=150',
      app_metadata: {
        rol: 'contador',
        empresas: ['dev-empresa-pe'],
        permisos: ['contabilidad:read', 'contabilidad:write', 'reportes:read']
      },
      created_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
      blocked: false
    },
    {
      user_id: 'auth0|567891234',
      email: 'usuario@contaempresa.com',
      name: 'Carlos Mendoza',
      picture: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
      app_metadata: {
        rol: 'usuario',
        empresas: ['dev-empresa-pe'],
        permisos: ['contabilidad:read']
      },
      created_at: new Date().toISOString(),
      last_login: null,
      blocked: false
    }
  ];
}

// Función principal
Deno.serve(async (req) => {
  // Manejar CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Verificar autenticación
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Se requiere autenticación' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar variables de entorno
    const envVars = validateEnvironmentVariables();
    
    // Si faltan variables de entorno, devolver datos mock en modo desarrollo
    if (!envVars) {
      console.log('Faltan variables de entorno, devolviendo datos mock');
      
      // Obtener la URL y método de la solicitud
      const url = new URL(req.url);
      const method = req.method;
      const path = url.pathname.split('/').filter(Boolean);
      
      // Manejar diferentes endpoints y métodos con datos mock
      if (method === 'GET' && path.length === 0) {
        // Devolver lista de usuarios mock
        const mockUsers = getMockUsers();
        
        // Mapear usuarios a formato deseado
        const usuariosMapeados = mockUsers.map((u: any) => ({
          id: u.user_id,
          email: u.email,
          nombre: u.name || u.email?.split('@')[0] || 'Usuario',
          avatar: u.picture,
          rol: u.app_metadata?.rol || 'usuario',
          empresasAsignadas: u.app_metadata?.empresas || [],
          permisos: u.app_metadata?.permisos || [],
          fechaCreacion: u.created_at,
          ultimaConexion: u.last_login,
          activo: !u.blocked
        }));
        
        return new Response(
          JSON.stringify(usuariosMapeados),
          { 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'X-Mock-Data': 'true'
            } 
          }
        );
      } else if (method === 'GET' && path.length === 1) {
        // Devolver usuario específico mock
        const userId = path[0];
        const mockUsers = getMockUsers();
        const mockUser = mockUsers.find(u => u.user_id === userId) || mockUsers[0];
        
        const usuarioMapeado = {
          id: mockUser.user_id,
          email: mockUser.email,
          nombre: mockUser.name || mockUser.email?.split('@')[0] || 'Usuario',
          avatar: mockUser.picture,
          rol: mockUser.app_metadata?.rol || 'usuario',
          empresasAsignadas: mockUser.app_metadata?.empresas || [],
          permisos: mockUser.app_metadata?.permisos || [],
          fechaCreacion: mockUser.created_at,
          ultimaConexion: mockUser.last_login,
          activo: !mockUser.blocked
        };
        
        return new Response(
          JSON.stringify(usuarioMapeado),
          { 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'X-Mock-Data': 'true'
            } 
          }
        );
      } else if (method === 'POST' && path.length === 0) {
        // Simular creación de usuario
        const body = await req.json();
        const mockUser = {
          user_id: `auth0_${Date.now()}`,
          email: body.email,
          name: body.name,
          app_metadata: body.app_metadata || {},
          created_at: new Date().toISOString()
        };
        
        return new Response(
          JSON.stringify({
            id: mockUser.user_id,
            email: mockUser.email,
            nombre: mockUser.name,
            rol: body.app_metadata?.rol || 'usuario',
            empresasAsignadas: body.app_metadata?.empresas || [],
            permisos: body.app_metadata?.permisos || [],
            fechaCreacion: mockUser.created_at,
            activo: true
          }),
          { 
            status: 201,
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'X-Mock-Data': 'true'
            } 
          }
        );
      }
      
      // Si no se encuentra el endpoint en modo mock
      return new Response(
        JSON.stringify({ 
          message: 'Modo desarrollo: Endpoint no implementado en mock',
          mockEnabled: true
        }),
        { 
          status: 404, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-Mock-Data': 'true'
          } 
        }
      );
    }

    // Obtener token de Auth0 Management API
    let managementToken;
    try {
      managementToken = await getAuth0ManagementToken(
        envVars.AUTH0_DOMAIN!,
        envVars.AUTH0_MGMT_CLIENT_ID!,
        envVars.AUTH0_MGMT_CLIENT_SECRET!
      );
    } catch (tokenError) {
      console.error('Error obteniendo token de Auth0 Management API:', tokenError);
      
      // Devolver datos mock en caso de error de token
      const mockUsers = getMockUsers();
      const usuariosMapeados = mockUsers.map((u: any) => ({
        id: u.user_id,
        email: u.email,
        nombre: u.name || u.email?.split('@')[0] || 'Usuario',
        avatar: u.picture,
        rol: u.app_metadata?.rol || 'usuario',
        empresasAsignadas: u.app_metadata?.empresas || [],
        permisos: u.app_metadata?.permisos || [],
        fechaCreacion: u.created_at,
        ultimaConexion: u.last_login,
        activo: !u.blocked
      }));
      
      return new Response(
        JSON.stringify(usuariosMapeados),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'X-Mock-Data': 'true'
          } 
        }
      );
    }

    // Obtener la URL y método de la solicitud
    const url = new URL(req.url);
    const method = req.method;
    const path = url.pathname.split('/').filter(Boolean);
    
    // Manejar diferentes endpoints y métodos
    if (method === 'GET') {
      // Obtener usuarios
      if (path.length === 0) {
        try {
          // Obtener parámetros de consulta
          const page = parseInt(url.searchParams.get('page') || '0');
          const perPage = parseInt(url.searchParams.get('per_page') || '100');
          const query = url.searchParams.get('q') || '';

          // Preparar parámetros para Auth0 API
          const params: any = {
            page,
            per_page: perPage,
            fields: 'user_id,email,name,nickname,picture,user_metadata,app_metadata,created_at,updated_at,last_login,blocked',
            include_fields: true
          };

          if (query) {
            params.q = query;
            params.search_engine = 'v3';
          }

          // Obtener usuarios de Auth0
          const usuarios = await getAuth0Users(envVars.AUTH0_DOMAIN!, managementToken, params);

          // Mapear usuarios a formato deseado
          const usuariosMapeados = usuarios.map((u: any) => ({
            id: u.user_id,
            email: u.email,
            nombre: u.name || u.nickname || u.email?.split('@')[0] || 'Usuario',
            avatar: u.picture,
            rol: u.app_metadata?.rol || 'usuario',
            empresasAsignadas: u.app_metadata?.empresas || [],
            permisos: u.app_metadata?.permisos || [],
            fechaCreacion: u.created_at,
            ultimaConexion: u.last_login,
            activo: !u.blocked
          }));

          // Devolver respuesta
          return new Response(
            JSON.stringify(usuariosMapeados),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error obteniendo usuarios de Auth0:', error);
          
          // Devolver datos mock en caso de error
          const mockUsers = getMockUsers();
          const usuariosMapeados = mockUsers.map((u: any) => ({
            id: u.user_id,
            email: u.email,
            nombre: u.name || u.email?.split('@')[0] || 'Usuario',
            avatar: u.picture,
            rol: u.app_metadata?.rol || 'usuario',
            empresasAsignadas: u.app_metadata?.empresas || [],
            permisos: u.app_metadata?.permisos || [],
            fechaCreacion: u.created_at,
            ultimaConexion: u.last_login,
            activo: !u.blocked
          }));
          
          return new Response(
            JSON.stringify(usuariosMapeados),
            { 
              headers: { 
                ...corsHeaders, 
                'Content-Type': 'application/json',
                'X-Mock-Data': 'true'
              } 
            }
          );
        }
      } 
      // Obtener usuario específico
      else if (path.length === 1) {
        try {
          const userId = path[0];
          console.log(`Obteniendo usuario específico: ${userId}`);
          
          // Verificar si el userId está codificado
          const decodedUserId = userId.includes('%7C') ? decodeURIComponent(userId) : userId;
          console.log(`ID de usuario decodificado: ${decodedUserId}`);
          
          // Obtener usuario de Auth0
          const url = `https://${envVars.AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(decodedUserId)}`;
          console.log(`URL de solicitud: ${url}`);
          
          const response = await fetch(url, {
            headers: {
              'Authorization': `Bearer ${managementToken}`,
              'Content-Type': 'application/json',
            }
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error obteniendo usuario de Auth0: ${response.status} ${response.statusText}`);
            console.error(`Respuesta: ${errorText}`);
            throw new Error(`Error obteniendo usuario de Auth0: ${response.status} ${response.statusText}`);
          }

          const usuario = await response.json();
          console.log(`Usuario obtenido correctamente: ${usuario.user_id}`);
          
          // Mapear usuario a formato deseado
          const usuarioMapeado = {
            id: usuario.user_id,
            email: usuario.email,
            nombre: usuario.name || usuario.nickname || usuario.email?.split('@')[0] || 'Usuario',
            avatar: usuario.picture,
            rol: usuario.app_metadata?.rol || 'usuario',
            empresasAsignadas: usuario.app_metadata?.empresas || [],
            permisos: usuario.app_metadata?.permisos || [],
            fechaCreacion: usuario.created_at,
            ultimaConexion: usuario.last_login,
            activo: !usuario.blocked
          };

          // Devolver respuesta
          return new Response(
            JSON.stringify(usuarioMapeado),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          console.error('Error obteniendo usuario específico:', error);
          
          // Devolver usuario mock en caso de error
          const mockUsers = getMockUsers();
          const userId = path[0];
          const decodedUserId = userId.includes('%7C') ? decodeURIComponent(userId) : userId;
          
          // Buscar por ID exacto o por ID parcial (sin el prefijo auth0|)
          const mockUser = mockUsers.find(u => 
            u.user_id === decodedUserId || 
            u.user_id === `auth0|${decodedUserId}` ||
            decodedUserId.includes(u.user_id.replace('auth0|', ''))
          ) || mockUsers[0];
          
          const usuarioMapeado = {
            id: mockUser.user_id,
            email: mockUser.email,
            nombre: mockUser.name || mockUser.email?.split('@')[0] || 'Usuario',
            avatar: mockUser.picture,
            rol: mockUser.app_metadata?.rol || 'usuario',
            empresasAsignadas: mockUser.app_metadata?.empresas || [],
            permisos: mockUser.app_metadata?.permisos || [],
            fechaCreacion: mockUser.created_at,
            ultimaConexion: mockUser.last_login,
            activo: !mockUser.blocked
          };
          
          return new Response(
            JSON.stringify(usuarioMapeado),
            { 
              headers: { 
                ...corsHeaders, 
                'Content-Type': 'application/json',
                'X-Mock-Data': 'true'
              } 
            }
          );
        }
      }
    } 
    // Crear usuario
    else if (method === 'POST' && path.length === 0) {
      try {
        const body = await req.json();
        
        // Crear usuario en Auth0
        const nuevoUsuario = await createAuth0User(envVars.AUTH0_DOMAIN!, managementToken, body);
        
        // Mapear usuario a formato deseado
        const usuarioMapeado = {
          id: nuevoUsuario.user_id,
          email: nuevoUsuario.email,
          nombre: nuevoUsuario.name || nuevoUsuario.nickname || nuevoUsuario.email?.split('@')[0] || 'Usuario',
          rol: body.app_metadata?.rol || 'usuario',
          empresasAsignadas: body.app_metadata?.empresas || [],
          permisos: body.app_metadata?.permisos || [],
          fechaCreacion: nuevoUsuario.created_at,
          activo: true
        };

        // Devolver respuesta
        return new Response(
          JSON.stringify(usuarioMapeado),
          { 
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } catch (error) {
        console.error('Error creando usuario:', error);
        
        // Simular creación en caso de error
        const body = await req.json();
        const mockUser = {
          user_id: `auth0_${Date.now()}`,
          email: body.email,
          name: body.name,
          app_metadata: body.app_metadata || {},
          created_at: new Date().toISOString()
        };
        
        return new Response(
          JSON.stringify({
            id: mockUser.user_id,
            email: mockUser.email,
            nombre: mockUser.name,
            rol: body.app_metadata?.rol || 'usuario',
            empresasAsignadas: body.app_metadata?.empresas || [],
            permisos: body.app_metadata?.permisos || [],
            fechaCreacion: mockUser.created_at,
            activo: true,
            mock: true
          }),
          { 
            status: 201,
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'X-Mock-Data': 'true'
            } 
          }
        );
      }
    } 
    // Actualizar usuario
    else if (method === 'PATCH' && path.length === 1) {
      try {
        const userId = path[0];
        const body = await req.json();
        
        // Verificar si el userId está codificado
        const decodedUserId = userId.includes('%7C') ? decodeURIComponent(userId) : userId;
        console.log(`ID de usuario decodificado para actualización: ${decodedUserId}`);
        
        // Actualizar usuario en Auth0
        const usuarioActualizado = await updateAuth0User(envVars.AUTH0_DOMAIN!, managementToken, decodedUserId, body);
        
        // Mapear usuario a formato deseado
        const usuarioMapeado = {
          id: usuarioActualizado.user_id,
          email: usuarioActualizado.email,
          nombre: usuarioActualizado.name || usuarioActualizado.nickname || usuarioActualizado.email?.split('@')[0] || 'Usuario',
          rol: usuarioActualizado.app_metadata?.rol || 'usuario',
          empresasAsignadas: usuarioActualizado.app_metadata?.empresas || [],
          permisos: usuarioActualizado.app_metadata?.permisos || [],
          fechaCreacion: usuarioActualizado.created_at,
          ultimaConexion: usuarioActualizado.last_login,
          activo: !usuarioActualizado.blocked
        };

        // Devolver respuesta
        return new Response(
          JSON.stringify(usuarioMapeado),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error actualizando usuario:', error);
        
        // Simular actualización en caso de error
        const userId = path[0];
        const body = await req.json();
        
        // Buscar usuario mock
        const mockUsers = getMockUsers();
        const decodedUserId = userId.includes('%7C') ? decodeURIComponent(userId) : userId;
        
        // Buscar por ID exacto o por ID parcial (sin el prefijo auth0|)
        const mockUser = mockUsers.find(u => 
          u.user_id === decodedUserId || 
          u.user_id === `auth0|${decodedUserId}` ||
          decodedUserId.includes(u.user_id.replace('auth0|', ''))
        ) || mockUsers[0];
        
        // Actualizar datos
        const updatedUser = {
          ...mockUser,
          name: body.name || mockUser.name,
          app_metadata: {
            ...mockUser.app_metadata,
            ...body.app_metadata
          }
        };
        
        return new Response(
          JSON.stringify({
            id: updatedUser.user_id,
            email: updatedUser.email,
            nombre: updatedUser.name,
            rol: updatedUser.app_metadata?.rol || 'usuario',
            empresasAsignadas: updatedUser.app_metadata?.empresas || [],
            permisos: updatedUser.app_metadata?.permisos || [],
            fechaCreacion: updatedUser.created_at,
            ultimaConexion: updatedUser.last_login,
            activo: !updatedUser.blocked,
            mock: true
          }),
          { 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'X-Mock-Data': 'true'
            } 
          }
        );
      }
    } 
    // Eliminar usuario
    else if (method === 'DELETE' && path.length === 1) {
      try {
        const userId = path[0];
        
        // Verificar si el userId está codificado
        const decodedUserId = userId.includes('%7C') ? decodeURIComponent(userId) : userId;
        console.log(`ID de usuario decodificado para eliminación: ${decodedUserId}`);
        
        // Eliminar usuario en Auth0
        await deleteAuth0User(envVars.AUTH0_DOMAIN!, managementToken, decodedUserId);
        
        // Devolver respuesta
        return new Response(
          JSON.stringify({ success: true, message: 'Usuario eliminado correctamente' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error eliminando usuario:', error);
        
        // Simular eliminación en caso de error
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Usuario eliminado correctamente (simulado)', 
            mock: true 
          }),
          { 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'X-Mock-Data': 'true'
            } 
          }
        );
      }
    }

    // Si no se encuentra el endpoint
    return new Response(
      JSON.stringify({ error: 'Endpoint no encontrado' }),
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error en Auth0 API:', error);
    
    // Devolver respuesta de error con detalles
    return new Response(
      JSON.stringify({ 
        error: 'Error al procesar la solicitud', 
        details: error.message,
        statusCode: error.statusCode || 500
      }),
      { 
        status: error.statusCode || 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});