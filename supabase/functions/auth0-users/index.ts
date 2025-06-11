import { createClient } from 'npm:@supabase/supabase-js@2';

// Configuración de CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

    // Obtener parámetros de consulta
    const url = new URL(req.url);
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
      empresasAsignadas: u.app_metadata?.empresasAsignadas || [],
      permisos: u.app_metadata?.permisos || [],
      fechaCreacion: u.created_at,
      ultimaConexion: u.last_login,
      activo: true
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
});