import { createClient } from 'npm:@supabase/supabase-js';
import { ManagementClient } from 'npm:auth0@3.6.0';

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

    // Inicializar cliente de Auth0 Management API
    const auth0 = new ManagementClient({
      domain: Deno.env.get('AUTH0_DOMAIN') || '',
      clientId: Deno.env.get('AUTH0_MGMT_CLIENT_ID') || '',
      clientSecret: Deno.env.get('AUTH0_MGMT_CLIENT_SECRET') || '',
      scope: 'read:users read:user_idp_tokens read:roles'
    });

    // Obtener parámetros de consulta
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '0');
    const perPage = parseInt(url.searchParams.get('per_page') || '100');
    const query = url.searchParams.get('q') || '';

    // Obtener usuarios de Auth0
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

    const usuarios = await auth0.getUsers(params);

    // Mapear usuarios a formato deseado
    const usuariosMapeados = usuarios.map(u => ({
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