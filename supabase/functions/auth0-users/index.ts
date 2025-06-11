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
    console.error(`Variables de entorno faltantes: ${missingVars.join(', ')}`);
    return { valid: false, vars: requiredVars, missing: missingVars };
  }

  return { valid: true, vars: requiredVars, missing: [] };
}

// Función para obtener token de Auth0 Management API
async function getAuth0ManagementToken(domain: string, clientId: string, clientSecret: string) {
  try {
    console.log(`Obteniendo token de Auth0 Management API para dominio: ${domain}`);
    
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
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Error obteniendo token de Auth0:', errorData);
      throw new Error(`Error obteniendo token de Auth0: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Token de Auth0 obtenido correctamente');
    return data.access_token;
  } catch (error) {
    console.error('Error en getAuth0ManagementToken:', error);
    throw error;
  }
}

// Función para obtener usuarios de Auth0
async function getAuth0Users(domain: string, token: string, params: any) {
  try {
    console.log(`Obteniendo usuarios de Auth0 con parámetros:`, params);
    
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
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Error obteniendo usuarios de Auth0:', errorData);
      throw new Error(`Error obteniendo usuarios de Auth0: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Se obtuvieron ${data.length} usuarios de Auth0`);
    return data;
  } catch (error) {
    console.error('Error en getAuth0Users:', error);
    throw error;
  }
}

// Función para crear usuario en Auth0
async function createAuth0User(domain: string, token: string, userData: any) {
  try {
    console.log(`Creando usuario en Auth0:`, userData.email);
    
    const response = await fetch(`https://${domain}/api/v2/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Error creando usuario en Auth0:', errorData);
      throw new Error(`Error creando usuario en Auth0: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('Usuario creado correctamente en Auth0');
    return data;
  } catch (error) {
    console.error('Error en createAuth0User:', error);
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
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Error actualizando usuario en Auth0:', errorData);
      throw new Error(`Error actualizando usuario en Auth0: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('Usuario actualizado correctamente en Auth0');
    return data;
  } catch (error) {
    console.error('Error en updateAuth0User:', error);
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
      // Si el código es 404, consideramos que ya está eliminado
      if (response.status === 404) {
        console.log('Usuario no encontrado en Auth0, posiblemente ya eliminado');
        return true;
      }
      
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Error eliminando usuario en Auth0:', errorData);
      throw new Error(`Error eliminando usuario en Auth0: ${errorData.message || response.statusText}`);
    }

    console.log('Usuario eliminado correctamente en Auth0');
    return true;
  } catch (error) {
    console.error('Error en deleteAuth0User:', error);
    throw error;
  }
}

// Función para generar datos mock para desarrollo
function generateMockData(method: string, path: string[], params: any = {}) {
  console.log('Generando datos mock para desarrollo');
  
  // Datos mock para usuarios
  const mockUsers = [
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

  // GET usuarios
  if (method === 'GET' && path.length === 0) {
    // Filtrar por query si existe
    let filteredUsers = [...mockUsers];
    if (params.q) {
      const query = params.q.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.email.toLowerCase().includes(query) || 
        user.name.toLowerCase().includes(query)
      );
    }
    
    // Aplicar paginación
    const page = parseInt(params.page) || 0;
    const perPage = parseInt(params.per_page) || 10;
    const start = page * perPage;
    const end = start + perPage;
    
    return filteredUsers.slice(start, end);
  }
  
  // GET usuario específico
  if (method === 'GET' && path.length === 1) {
    const userId = path[0];
    return mockUsers.find(user => user.user_id === userId) || null;
  }
  
  // POST crear usuario
  if (method === 'POST' && path.length === 0) {
    const newUser = {
      user_id: `auth0|${Date.now()}`,
      email: params.email || 'nuevo@contaempresa.com',
      name: params.name || 'Nuevo Usuario',
      picture: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150',
      app_metadata: params.app_metadata || {
        rol: 'usuario',
        empresas: ['dev-empresa-pe'],
        permisos: ['contabilidad:read']
      },
      created_at: new Date().toISOString(),
      last_login: null,
      blocked: false
    };
    
    return newUser;
  }
  
  // PATCH actualizar usuario
  if (method === 'PATCH' && path.length === 1) {
    const userId = path[0];
    const user = mockUsers.find(user => user.user_id === userId);
    
    if (!user) return null;
    
    return {
      ...user,
      ...params
    };
  }
  
  // DELETE eliminar usuario
  if (method === 'DELETE' && path.length === 1) {
    return { deleted: true };
  }
  
  return null;
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
    const envValidation = validateEnvironmentVariables();
    const envVars = envValidation.vars;
    
    // Determinar si estamos en modo desarrollo
    const isDevelopment = !envValidation.valid || Deno.env.get('ENVIRONMENT') === 'development';
    
    if (!envValidation.valid) {
      console.warn(`Modo desarrollo activado debido a variables faltantes: ${envValidation.missing.join(', ')}`);
    }

    // Obtener la URL y método de la solicitud
    const url = new URL(req.url);
    const method = req.method;
    const path = url.pathname.split('/').filter(Boolean);
    
    // Extraer parámetros de consulta
    const queryParams: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });
    
    // Si estamos en modo desarrollo, devolver datos mock
    if (isDevelopment) {
      console.log('Modo desarrollo: Usando datos mock');
      
      let mockData;
      
      if (method === 'GET') {
        mockData = generateMockData('GET', path, queryParams);
      } else if (method === 'POST') {
        const body = await req.json();
        mockData = generateMockData('POST', path, body);
      } else if (method === 'PATCH') {
        const body = await req.json();
        mockData = generateMockData('PATCH', path, body);
      } else if (method === 'DELETE') {
        mockData = generateMockData('DELETE', path);
      }
      
      if (mockData) {
        // Si es un array de usuarios, mapear a formato deseado
        if (Array.isArray(mockData)) {
          const usuariosMapeados = mockData.map((u: any) => ({
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
          
          return new Response(
            JSON.stringify(usuariosMapeados),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Si es un usuario individual, mapear a formato deseado
        if (mockData && mockData.user_id) {
          const usuarioMapeado = {
            id: mockData.user_id,
            email: mockData.email,
            nombre: mockData.name || mockData.nickname || mockData.email?.split('@')[0] || 'Usuario',
            avatar: mockData.picture,
            rol: mockData.app_metadata?.rol || 'usuario',
            empresasAsignadas: mockData.app_metadata?.empresas || [],
            permisos: mockData.app_metadata?.permisos || [],
            fechaCreacion: mockData.created_at,
            ultimaConexion: mockData.last_login,
            activo: !mockData.blocked
          };
          
          return new Response(
            JSON.stringify(usuarioMapeado),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Otros casos
        return new Response(
          JSON.stringify(mockData || { success: true, mock: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Si no estamos en modo desarrollo, proceder con Auth0 real
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
      return new Response(
        JSON.stringify({ 
          error: 'Error de configuración de Auth0', 
          details: tokenError.message,
          statusCode: 500
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Manejar diferentes endpoints y métodos
    if (method === 'GET') {
      // Obtener usuarios
      if (path.length === 0) {
        try {
          // Obtener parámetros de consulta
          const page = parseInt(queryParams.page || '0');
          const perPage = parseInt(queryParams.per_page || '100');
          const query = queryParams.q || '';

          // Preparar parámetros para Auth0 API
          const params: any = {
            page,
            per_page: perPage,
            fields: 'user_id,email,name,nickname,picture,user_metadata,app_metadata,created_at,updated_at,last_login',
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
          return new Response(
            JSON.stringify({ 
              error: 'Error al obtener usuarios', 
              details: error.message,
              statusCode: error.statusCode || 500
            }),
            { 
              status: error.statusCode || 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      } 
      // Obtener usuario específico
      else if (path.length === 1) {
        try {
          const userId = path[0];
          
          // Obtener usuario de Auth0
          const response = await fetch(`https://${envVars.AUTH0_DOMAIN}/api/v2/users/${userId}`, {
            headers: {
              'Authorization': `Bearer ${managementToken}`,
              'Content-Type': 'application/json',
            }
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(`Error obteniendo usuario de Auth0: ${errorData.message || response.statusText}`);
          }

          const usuario = await response.json();
          
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
          console.error('Error obteniendo usuario específico de Auth0:', error);
          return new Response(
            JSON.stringify({ 
              error: 'Error al obtener usuario', 
              details: error.message,
              statusCode: error.statusCode || 500
            }),
            { 
              status: error.statusCode || 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
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
        console.error('Error creando usuario en Auth0:', error);
        return new Response(
          JSON.stringify({ 
            error: 'Error al crear usuario', 
            details: error.message,
            statusCode: error.statusCode || 500
          }),
          { 
            status: error.statusCode || 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    } 
    // Actualizar usuario
    else if (method === 'PATCH' && path.length === 1) {
      try {
        const userId = path[0];
        const body = await req.json();
        
        // Actualizar usuario en Auth0
        const usuarioActualizado = await updateAuth0User(envVars.AUTH0_DOMAIN!, managementToken, userId, body);
        
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
        console.error('Error actualizando usuario en Auth0:', error);
        return new Response(
          JSON.stringify({ 
            error: 'Error al actualizar usuario', 
            details: error.message,
            statusCode: error.statusCode || 500
          }),
          { 
            status: error.statusCode || 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    } 
    // Eliminar usuario
    else if (method === 'DELETE' && path.length === 1) {
      try {
        const userId = path[0];
        
        // Eliminar usuario en Auth0
        await deleteAuth0User(envVars.AUTH0_DOMAIN!, managementToken, userId);
        
        // Devolver respuesta
        return new Response(
          JSON.stringify({ success: true, message: 'Usuario eliminado correctamente' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Error eliminando usuario en Auth0:', error);
        return new Response(
          JSON.stringify({ 
            error: 'Error al eliminar usuario', 
            details: error.message,
            statusCode: error.statusCode || 500
          }),
          { 
            status: error.statusCode || 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
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