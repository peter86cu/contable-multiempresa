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

interface NomencladorBase {
  nombre: string;
  codigo: string;
  descripcion?: string;
  pais_id: string;
  activo: boolean;
}

interface TipoDocumentoIdentidad extends NomencladorBase {}

interface TipoDocumentoFactura extends NomencladorBase {
  requiere_impuesto: boolean;
  requiere_cliente: boolean;
  afecta_inventario: boolean;
  afecta_contabilidad: boolean;
  prefijo?: string;
  formato?: string;
}

interface TipoImpuesto extends NomencladorBase {
  porcentaje: number;
  tipo: string;
  cuenta_contable_id?: string;
}

interface FormaPago extends NomencladorBase {
  requiere_banco: boolean;
  requiere_referencia: boolean;
  requiere_fecha: boolean;
}

interface TipoMovimientoTesoreria extends NomencladorBase {
  afecta_saldo: boolean;
  requiere_referencia?: boolean;
  requiere_documento?: boolean;
}

interface TipoMoneda extends NomencladorBase {
  simbolo: string;
  es_principal: boolean;
}

interface Banco extends NomencladorBase {}

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
    
    // Path should be like: /nomencladores/[tipo]/[pais_id]
    // or: /nomencladores/[tipo]/[pais_id]/[id] for specific item
    
    if (path.length < 3 || path[0] !== "nomencladores") {
      return new Response(
        JSON.stringify({ error: "Invalid path" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const tipo = path[1];
    const paisId = path[2];
    const id = path.length > 3 ? path[3] : null;
    
    // Validate tipo
    const validTipos = [
      "tipos_documento_identidad",
      "tipos_documento_factura",
      "tipos_impuesto",
      "formas_pago",
      "tipos_movimiento_tesoreria",
      "tipos_moneda",
      "bancos"
    ];
    
    if (!validTipos.includes(tipo)) {
      return new Response(
        JSON.stringify({ error: "Invalid tipo" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
    
    // Validate paisId
    if (!paisId) {
      return new Response(
        JSON.stringify({ error: "Invalid pais_id" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
    
    // Handle different HTTP methods
    switch (req.method) {
      case "GET":
        return await handleGet(tipo, paisId, id);
      case "POST":
        return await handlePost(req, tipo, paisId);
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
        return await handlePut(req, tipo, id);
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
        return await handleDelete(tipo, id);
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

async function handleGet(tipo: string, paisId: string, id: string | null) {
  try {
    let query = supabase.from(tipo).select("*").eq("pais_id", paisId);
    
    if (id) {
      query = query.eq("id", id);
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

async function handlePost(req: Request, tipo: string, paisId: string) {
  try {
    const body = await req.json();
    
    // Ensure pais_id is set
    body.pais_id = paisId;
    
    const { data, error } = await supabase.from(tipo).insert([body]).select();
    
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
      JSON.stringify({ error: error.message || "Error creating record" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
}

async function handlePut(req: Request, tipo: string, id: string) {
  try {
    const body = await req.json();
    
    // Set updated_at
    body.updated_at = new Date();
    
    const { data, error } = await supabase
      .from(tipo)
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
      JSON.stringify({ error: error.message || "Error updating record" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
}

async function handleDelete(tipo: string, id: string) {
  try {
    const { error } = await supabase
      .from(tipo)
      .delete()
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
      JSON.stringify({ error: error.message || "Error deleting record" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
}