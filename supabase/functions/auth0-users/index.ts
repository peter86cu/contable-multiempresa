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
    throw new Error(`Variables de entorno faltantes: ${missingVars.join(', ')}. Por favor configura estas variables en tu proyecto de Supabase.`);
  }

  return requiredVars;
}

// Función para obtener token de Auth0 Management API
async function getAuth0ManagementToken(domain: string, clientId: string, clientSecret: string) {
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
    throw new Error(`Error obteniendo token de Auth0: ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Función para obtener usuarios de Auth0
async function getAuth0Users(domain: string, token: string, params: any) {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const response = await fetch(`https://${domain}/api/v2/users?${searchParams.toString()}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error(`Error obteniendo usuarios de Auth0: ${response.statusText}`);
  }

  return await response.json();
}

// Función para crear usuario en Auth0
async function createAuth0User(domain: string, token: string, userData: any) {
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
    throw new Error(`Error creando usuario en Auth0: ${error.message || response.statusText}`);
  }

  return await response.json();
}

// Función para actualizar usuario en Auth0
async function updateAuth0User(domain: string, token: string, userId: string, userData: any) {
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
    throw new Error(`Error actualizando usuario en Auth0: ${error.message || response.statusText}`);
  }

  return await response.json();
}

// Función para eliminar usuario en Auth0
async function deleteAuth0User(domain: string, token: string, userId: string) {
  const response = await fetch(`https://${domain}/api/v2/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Error eliminando usuario en Auth0: ${error.message || response.statusText}`);
  }

  return true;
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

    // Obtener token de Auth0 Management API
    const managementToken = await getAuth0ManagementToken(
      envVars.AUTH0_DOMAIN!,
      envVars.AUTH0_MGMT_CLIENT_ID!,
      envVars.AUTH0_MGMT_CLIENT_SECRET!
    );

    // Obtener la URL y método de la solicitud
    const url = new URL(req.url);
    const method = req.method;
    const path = url.pathname.split('/').filter(Boolean);
    
    // Manejar diferentes endpoints y métodos
    if (method === 'GET') {
      // Obtener usuarios
      if (path.length === 0) {
        // Obtener parámetros de consulta
        const page = parseInt(url.searchParams.get('page') || '0');
        const perPage = parseInt(url.searchParams.get('per_page') || '100');
        const query = url.searchParams.get('q') || '';

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
      } 
      // Obtener usuario específico
      else if (path.length === 1) {
        const userId = path[0];
        
        // Obtener usuario de Auth0
        const response = await fetch(`https://${envVars.AUTH0_DOMAIN}/api/v2/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${managementToken}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error(`Error obteniendo usuario de Auth0: ${response.statusText}`);
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
      }
    } 
    // Crear usuario
    else if (method === 'POST' && path.length === 0) {
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
    } 
    // Actualizar usuario
    else if (method === 'PATCH' && path.length === 1) {
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
    } 
    // Eliminar usuario
    else if (method === 'DELETE' && path.length === 1) {
      const userId = path[0];
      
      // Eliminar usuario en Auth0
      await deleteAuth0User(envVars.AUTH0_DOMAIN!, managementToken, userId);
      
      // Devolver respuesta
      return new Response(
        JSON.stringify({ success: true, message: 'Usuario eliminado correctamente' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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