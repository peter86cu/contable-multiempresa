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

// Función para obtener token de Auth0 Management API
async function getAuth0ManagementToken() {
  try {
    // En modo desarrollo, devolver un token mock
    if (Deno.env.get('ENVIRONMENT') === 'development') {
      console.log('Modo desarrollo: Devolviendo token mock para Auth0 Management API');
      return 'mock_token_for_development';
    }

    // Obtener variables de entorno
    const domain = Deno.env.get('AUTH0_DOMAIN');
    const clientId = Deno.env.get('AUTH0_MGMT_CLIENT_ID');
    const clientSecret = Deno.env.get('AUTH0_MGMT_CLIENT_SECRET');

    if (!domain || !clientId || !clientSecret) {
      throw new Error('Faltan variables de entorno de Auth0 Management API');
    }

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
      const error = await response.json();
      throw new Error(`Error obteniendo token: ${error.error_description || response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error generando token de Auth0:', error);
    throw error;
  }
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

    // Obtener la URL y método de la solicitud
    const url = new URL(req.url);
    const method = req.method;
    const path = url.pathname.split('/').filter(Boolean);
    
    // Modo desarrollo - Devolver datos mock
    if (Deno.env.get('ENVIRONMENT') === 'development' || !Deno.env.get('AUTH0_DOMAIN')) {
      console.log('Modo desarrollo: Devolviendo datos mock para Auth0 API');
      
      // Datos mock para desarrollo
      const mockUsers = [
        {
          id: 'auth0|123456789',
          email: 'admin@contaempresa.com',
          nombre: 'Administrador',
          avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150',
          rol: 'super_admin',
          empresasAsignadas: ['dev-empresa-pe', 'dev-empresa-co', 'dev-empresa-mx'],
          permisos: ['admin:all'],
          fechaCreacion: new Date().toISOString(),
          ultimaConexion: new Date().toISOString(),
          activo: true
        },
        {
          id: 'auth0|987654321',
          email: 'contador@contaempresa.com',
          nombre: 'María González',
          avatar: 'https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=150',
          rol: 'contador',
          empresasAsignadas: ['dev-empresa-pe'],
          permisos: ['contabilidad:read', 'contabilidad:write', 'reportes:read'],
          fechaCreacion: new Date().toISOString(),
          ultimaConexion: new Date().toISOString(),
          activo: true
        },
        {
          id: 'auth0|567891234',
          email: 'usuario@contaempresa.com',
          nombre: 'Carlos Mendoza',
          avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
          rol: 'usuario',
          empresasAsignadas: ['dev-empresa-pe'],
          permisos: ['contabilidad:read'],
          fechaCreacion: new Date().toISOString(),
          ultimaConexion: null,
          activo: true
        }
      ];
      
      if (method === 'GET') {
        // Filtrar usuarios según parámetros
        const query = url.searchParams.get('q') || '';
        let filteredUsers = mockUsers;
        
        if (query) {
          filteredUsers = mockUsers.filter(user => 
            user.email.includes(query) || 
            user.nombre.includes(query)
          );
        }
        
        return new Response(
          JSON.stringify(filteredUsers),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (method === 'POST') {
        // Simular creación de usuario
        const body = await req.json();
        const newUser = {
          id: `auth0|${Date.now()}`,
          email: body.email,
          nombre: body.name,
          avatar: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150',
          rol: body.app_metadata?.rol || 'usuario',
          empresasAsignadas: body.app_metadata?.empresas || [],
          permisos: body.app_metadata?.permisos || [],
          fechaCreacion: new Date().toISOString(),
          ultimaConexion: null,
          activo: true
        };
        
        return new Response(
          JSON.stringify(newUser),
          { 
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } else if (method === 'PATCH' && path.length === 1) {
        // Simular actualización de usuario
        const userId = path[0];
        const body = await req.json();
        const user = mockUsers.find(u => u.id === userId) || mockUsers[0];
        
        const updatedUser = {
          ...user,
          ...body,
          app_metadata: {
            ...user.app_metadata,
            ...body.app_metadata
          }
        };
        
        return new Response(
          JSON.stringify(updatedUser),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else if (method === 'DELETE' && path.length === 1) {
        // Simular eliminación de usuario
        return new Response(
          JSON.stringify({ success: true, message: 'Usuario eliminado correctamente' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: 'Endpoint no encontrado' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Obtener token de Auth0 Management API
    const managementToken = await getAuth0ManagementToken();

    // Obtener dominio de Auth0
    const domain = Deno.env.get('AUTH0_DOMAIN');
    if (!domain) {
      throw new Error('Falta la variable de entorno AUTH0_DOMAIN');
    }

    // Manejar diferentes endpoints y métodos
    if (method === 'GET') {
      // Obtener usuarios
      if (path.length === 0) {
        // Obtener parámetros de consulta
        const page = parseInt(url.searchParams.get('page') || '0');
        const perPage = parseInt(url.searchParams.get('per_page') || '100');
        const query = url.searchParams.get('q') || '';

        // Construir URL con parámetros
        const searchParams = new URLSearchParams();
        searchParams.append('page', page.toString());
        searchParams.append('per_page', perPage.toString());
        searchParams.append('fields', 'user_id,email,name,nickname,picture,created_at,updated_at,last_login,blocked,app_metadata');
        searchParams.append('include_fields', 'true');
        
        // Solo agregar parámetros de búsqueda si hay una consulta
        if (query) {
          searchParams.append('q', query);
          // Usar v2 en lugar de v3 para evitar el error 400
          searchParams.append('search_engine', 'v2');
        }

        console.log(`Fetching users from Auth0: https://${domain}/api/v2/users?${searchParams.toString()}`);

        // Obtener usuarios de Auth0
        const response = await fetch(`https://${domain}/api/v2/users?${searchParams.toString()}`, {
          headers: {
            'Authorization': `Bearer ${managementToken}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Auth0 API Error Response:', errorText);
          throw new Error(`Error obteniendo usuarios de Auth0: ${response.status} ${response.statusText}`);
        }

        const usuarios = await response.json();
        console.log(`Retrieved ${usuarios.length} users from Auth0`);

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
        const response = await fetch(`https://${domain}/api/v2/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${managementToken}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Auth0 API Error Response:', errorText);
          throw new Error(`Error obteniendo usuario de Auth0: ${response.status} ${response.statusText}`);
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
      const response = await fetch(`https://${domain}/api/v2/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${managementToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Error creando usuario en Auth0: ${error.message || response.statusText}`);
      }

      const nuevoUsuario = await response.json();
      
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
      const response = await fetch(`https://${domain}/api/v2/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${managementToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Error actualizando usuario en Auth0: ${error.message || response.statusText}`);
      }

      const usuarioActualizado = await response.json();
      
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
      const response = await fetch(`https://${domain}/api/v2/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${managementToken}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Error eliminando usuario en Auth0: ${error.message || response.statusText}`);
      }
      
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