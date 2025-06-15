import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Function to handle CORS preflight requests
function handleCors(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }
  return null;
}

// Function to get Auth0 Management API token
async function getAuth0ManagementToken() {
  try {
    const domain = Deno.env.get("AUTH0_DOMAIN");
    const clientId = Deno.env.get("AUTH0_MGMT_CLIENT_ID");
    const clientSecret = Deno.env.get("AUTH0_MGMT_CLIENT_SECRET");

    if (!domain || !clientId || !clientSecret) {
      console.error("Missing Auth0 Management API credentials");
      return null;
    }

    const response = await fetch(`https://${domain}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        audience: `https://${domain}/api/v2/`,
        grant_type: "client_credentials",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Error getting Auth0 token:", error);
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Error in getAuth0ManagementToken:", error);
    return null;
  }
}

// Function to get users from Auth0
async function getAuth0Users(token: string, query?: string, page = 0, perPage = 10) {
  try {
    const domain = Deno.env.get("AUTH0_DOMAIN");
    if (!domain || !token) {
      throw new Error("Missing Auth0 domain or token");
    }

    let url = `https://${domain}/api/v2/users?page=${page}&per_page=${perPage}&include_totals=true`;
    if (query) {
      url += `&q=${encodeURIComponent(query)}`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error fetching Auth0 users: ${error}`);
    }

    const data = await response.json();
    
    // Map Auth0 users to our user format
    return data.users.map((user: any) => ({
      id: user.user_id,
      nombre: user.name || user.nickname || user.email,
      email: user.email,
      rol: user.app_metadata?.rol || 'usuario',
      empresasAsignadas: user.app_metadata?.empresas || [],
      permisos: user.app_metadata?.permisos || [],
      avatar: user.picture,
      fechaCreacion: user.created_at,
      ultimaConexion: user.last_login,
      activo: !user.blocked
    }));
  } catch (error) {
    console.error("Error in getAuth0Users:", error);
    throw error;
  }
}

// Function to create a user in Auth0
async function createAuth0User(token: string, userData: any) {
  try {
    const domain = Deno.env.get("AUTH0_DOMAIN");
    if (!domain || !token) {
      throw new Error("Missing Auth0 domain or token");
    }

    const response = await fetch(`https://${domain}/api/v2/users`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Error creating Auth0 user: ${error.message || error.error}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error in createAuth0User:", error);
    throw error;
  }
}

// Function to update a user in Auth0
async function updateAuth0User(token: string, userId: string, userData: any) {
  try {
    const domain = Deno.env.get("AUTH0_DOMAIN");
    if (!domain || !token) {
      throw new Error("Missing Auth0 domain or token");
    }

    const response = await fetch(`https://${domain}/api/v2/users/${userId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Error updating Auth0 user: ${error.message || error.error}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error in updateAuth0User:", error);
    throw error;
  }
}

// Function to delete a user in Auth0
async function deleteAuth0User(token: string, userId: string) {
  try {
    const domain = Deno.env.get("AUTH0_DOMAIN");
    if (!domain || !token) {
      throw new Error("Missing Auth0 domain or token");
    }

    const response = await fetch(`https://${domain}/api/v2/users/${userId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error deleting Auth0 user: ${error}`);
    }

    return true;
  } catch (error) {
    console.error("Error in deleteAuth0User:", error);
    throw error;
  }
}

// Function to get mock users for development
function getMockUsers() {
  return [
    {
      id: "auth0|123456789",
      nombre: "Administrador",
      email: "admin@contaempresa.com",
      avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150",
      rol: "admin_empresa",
      empresasAsignadas: ["dev-empresa-pe", "dev-empresa-co", "dev-empresa-mx"],
      permisos: ["admin:all"],
      fechaCreacion: new Date().toISOString(),
      ultimaConexion: new Date().toISOString(),
      activo: true,
    },
    {
      id: "auth0|987654321",
      nombre: "María González",
      email: "contador@contaempresa.com",
      avatar: "https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg?auto=compress&cs=tinysrgb&w=150",
      rol: "contador",
      empresasAsignadas: ["dev-empresa-pe"],
      permisos: ["contabilidad:read", "contabilidad:write", "reportes:read"],
      fechaCreacion: new Date().toISOString(),
      ultimaConexion: new Date().toISOString(),
      activo: true,
    },
    {
      id: "auth0|567891234",
      nombre: "Carlos Mendoza",
      email: "usuario@contaempresa.com",
      avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150",
      rol: "usuario",
      empresasAsignadas: ["dev-empresa-pe"],
      permisos: ["contabilidad:read"],
      fechaCreacion: new Date().toISOString(),
      ultimaConexion: null,
      activo: true,
    },
  ];
}

// Main handler function
serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    // Check if we're in development mode
    const isDev = Deno.env.get("ENVIRONMENT") === "development" || !Deno.env.get("AUTH0_DOMAIN");
    
    // If in development mode or missing Auth0 credentials, return mock data
    if (isDev) {
      console.log("Using mock data for development");
      
      // GET /auth0-users - Get users
      if (method === "GET" && path === "/auth0-users") {
        const mockUsers = getMockUsers();
        return new Response(JSON.stringify(mockUsers), {
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "X-Mock-Data": "true"
          },
        });
      }
      
      // POST /auth0-users - Create user
      if (method === "POST" && path === "/auth0-users") {
        const mockUser = {
          id: `auth0|${Date.now()}`,
          nombre: "Nuevo Usuario",
          email: "nuevo@contaempresa.com",
          avatar: "https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150",
          rol: "usuario",
          empresasAsignadas: ["dev-empresa-pe"],
          permisos: ["contabilidad:read"],
          fechaCreacion: new Date().toISOString(),
          ultimaConexion: null,
          activo: true,
        };
        
        return new Response(JSON.stringify(mockUser), {
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "X-Mock-Data": "true"
          },
        });
      }
      
      // PATCH /auth0-users/:id - Update user
      if (method === "PATCH" && path.startsWith("/auth0-users/")) {
        const userId = path.split("/").pop();
        const mockUser = {
          id: userId,
          nombre: "Usuario Actualizado",
          email: "actualizado@contaempresa.com",
          rol: "usuario",
          empresasAsignadas: ["dev-empresa-pe"],
          permisos: ["contabilidad:read"],
          activo: true,
        };
        
        return new Response(JSON.stringify(mockUser), {
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "X-Mock-Data": "true"
          },
        });
      }
      
      // DELETE /auth0-users/:id - Delete user
      if (method === "DELETE" && path.startsWith("/auth0-users/")) {
        return new Response(null, {
          status: 204,
          headers: { 
            ...corsHeaders,
            "X-Mock-Data": "true"
          },
        });
      }
    }

    // Get Auth0 Management API token
    const token = await getAuth0ManagementToken();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Failed to get Auth0 Management API token" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // GET /auth0-users - Get users
    if (method === "GET" && path === "/auth0-users") {
      const query = url.searchParams.get("q") || undefined;
      const page = parseInt(url.searchParams.get("page") || "0", 10);
      const perPage = parseInt(url.searchParams.get("per_page") || "10", 10);
      
      const users = await getAuth0Users(token, query, page, perPage);
      return new Response(JSON.stringify(users), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // POST /auth0-users - Create user
    if (method === "POST" && path === "/auth0-users") {
      const body = await req.json();
      const user = await createAuth0User(token, body);
      return new Response(JSON.stringify(user), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // PATCH /auth0-users/:id - Update user
    if (method === "PATCH" && path.startsWith("/auth0-users/")) {
      const userId = path.split("/").pop();
      const body = await req.json();
      const user = await updateAuth0User(token, userId as string, body);
      return new Response(JSON.stringify(user), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // DELETE /auth0-users/:id - Delete user
    if (method === "DELETE" && path.startsWith("/auth0-users/")) {
      const userId = path.split("/").pop();
      await deleteAuth0User(token, userId as string);
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // If no route matches
    return new Response(
      JSON.stringify({ error: "Not found" }),
      {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error handling request:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});