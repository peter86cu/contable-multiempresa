import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.38.4";

// Create a Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split("/").filter(Boolean);
    
    // Path should be like: /paises or /paises/[id]
    if (path.length === 0 || path[0] !== "paises") {
      return new Response(
        JSON.stringify({ error: "Invalid path" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const id = path.length > 1 ? path[1] : null;
    
    // Handle different HTTP methods
    switch (req.method) {
      case "GET":
        return await handleGet(id);
      case "POST":
        return await handlePost(req);
      case "PUT":
        if (!id) {
          return new Response(
            JSON.stringify({ error: "ID is required for PUT" }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            }
          );
        }
        return await handlePut(req, id);
      case "DELETE":
        if (!id) {
          return new Response(
            JSON.stringify({ error: "ID is required for DELETE" }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            }
          );
        }
        return await handleDelete(id);
      default:
        return new Response(
          JSON.stringify({ error: "Method not allowed" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 405,
          }
        );
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

async function handleGet(id: string | null) {
  try {
    let query = supabase.from("paises").select("*");
    
    if (id) {
      query = query.eq("id", id);
    } else {
      // By default, only return active countries
      query = query.eq("activo", true);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    return new Response(
      JSON.stringify(id ? (data[0] || null) : data),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in GET:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Error fetching data" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
}

async function handlePost(req: Request) {
  try {
    const body = await req.json();
    
    // Validate required fields
    const requiredFields = ["id", "nombre", "codigo", "codigo_iso", "moneda_principal", "simbolo_moneda"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return new Response(
          JSON.stringify({ error: `Field '${field}' is required` }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }
    }
    
    // Check if country already exists
    const { data: existingCountry } = await supabase
      .from("paises")
      .select("id")
      .eq("id", body.id)
      .maybeSingle();
    
    if (existingCountry) {
      return new Response(
        JSON.stringify({ error: `Country with id '${body.id}' already exists` }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 409,
        }
      );
    }
    
    // Set default values
    body.activo = body.activo !== false;
    body.created_at = new Date();
    body.updated_at = new Date();
    
    const { data, error } = await supabase.from("paises").insert([body]).select();
    
    if (error) throw error;
    
    return new Response(
      JSON.stringify(data[0]),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 201,
      }
    );
  } catch (error) {
    console.error("Error in POST:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Error creating country" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
}

async function handlePut(req: Request, id: string) {
  try {
    const body = await req.json();
    
    // Set updated_at
    body.updated_at = new Date();
    
    const { data, error } = await supabase
      .from("paises")
      .update(body)
      .eq("id", id)
      .select();
    
    if (error) throw error;
    
    return new Response(
      JSON.stringify(data[0]),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in PUT:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Error updating country" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
}

async function handleDelete(id: string) {
  try {
    // Instead of deleting, just set activo to false
    const { error } = await supabase
      .from("paises")
      .update({ activo: false, updated_at: new Date() })
      .eq("id", id);
    
    if (error) throw error;
    
    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in DELETE:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Error deleting country" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
}