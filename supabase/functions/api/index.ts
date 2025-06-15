import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { initializeApp } from "npm:firebase/app";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit 
} from "npm:firebase/firestore";
import { 
  getAuth, 
  signInWithEmailAndPassword 
} from "npm:firebase/auth";

// CORS headers for cross-origin requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Firebase configuration
const firebaseConfig = {
  apiKey: Deno.env.get("FIREBASE_API_KEY"),
  authDomain: Deno.env.get("FIREBASE_AUTH_DOMAIN"),
  projectId: Deno.env.get("FIREBASE_PROJECT_ID"),
  storageBucket: Deno.env.get("FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: Deno.env.get("FIREBASE_MESSAGING_SENDER_ID"),
  appId: Deno.env.get("FIREBASE_APP_ID")
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

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

// Function to authenticate with Firebase
async function authenticateFirebase() {
  try {
    const email = Deno.env.get("FIREBASE_AUTH_EMAIL");
    const password = Deno.env.get("FIREBASE_AUTH_PASSWORD");
    
    if (!email || !password) {
      console.error("Missing Firebase authentication credentials");
      return null;
    }
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error authenticating with Firebase:", error);
    return null;
  }
}

// API Routes
const routes = {
  // Empresas
  getEmpresas: async () => {
    const empresasRef = collection(db, "empresas");
    const snapshot = await getDocs(empresasRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      fechaCreacion: doc.data().fechaCreacion?.toDate() || new Date(),
      fechaActualizacion: doc.data().fechaActualizacion?.toDate()
    }));
  },
  
  getEmpresaById: async (id: string) => {
    const empresaRef = doc(db, "empresas", id);
    const empresaDoc = await getDoc(empresaRef);
    
    if (!empresaDoc.exists()) {
      return null;
    }
    
    const data = empresaDoc.data();
    return {
      id: empresaDoc.id,
      ...data,
      fechaCreacion: data.fechaCreacion?.toDate() || new Date(),
      fechaActualizacion: data.fechaActualizacion?.toDate()
    };
  },
  
  getEmpresasByPais: async (paisId: string) => {
    const empresasRef = collection(db, "empresas");
    const q = query(empresasRef, where("paisId", "==", paisId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      fechaCreacion: doc.data().fechaCreacion?.toDate() || new Date(),
      fechaActualizacion: doc.data().fechaActualizacion?.toDate()
    }));
  },
  
  // Paises
  getPaises: async () => {
    const paisesRef = collection(db, "paises");
    const q = query(paisesRef, where("activo", "==", true));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      fechaCreacion: doc.data().fechaCreacion?.toDate() || new Date()
    }));
  },
  
  getPaisById: async (id: string) => {
    const paisRef = doc(db, "paises", id);
    const paisDoc = await getDoc(paisRef);
    
    if (!paisDoc.exists()) {
      return null;
    }
    
    const data = paisDoc.data();
    return {
      id: paisDoc.id,
      ...data,
      fechaCreacion: data.fechaCreacion?.toDate() || new Date()
    };
  },
  
  // Plan de Cuentas
  getPlanCuentas: async (empresaId: string) => {
    const cuentasRef = collection(db, "empresas", empresaId, "cuentas");
    const q = query(cuentasRef, orderBy("codigo"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      fechaCreacion: doc.data().fechaCreacion?.toDate() || new Date(),
      fechaModificacion: doc.data().fechaModificacion?.toDate() || new Date()
    }));
  },
  
  // Asientos Contables
  getAsientos: async (empresaId: string, fechaDesde?: string, fechaHasta?: string) => {
    const asientosRef = collection(db, "empresas", empresaId, "asientos");
    
    let q = query(asientosRef, orderBy("fecha", "desc"));
    
    if (fechaDesde) {
      q = query(q, where("fecha", ">=", fechaDesde));
    }
    
    if (fechaHasta) {
      q = query(q, where("fecha", "<=", fechaHasta));
    }
    
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  },
  
  // Tesorería
  getCuentasBancarias: async (empresaId: string) => {
    const cuentasRef = collection(db, "empresas", empresaId, "cuentasBancarias");
    const q = query(cuentasRef, where("activa", "==", true));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      fechaCreacion: doc.data().fechaCreacion?.toDate() || new Date()
    }));
  },
  
  getMovimientosTesoreria: async (empresaId: string) => {
    const movimientosRef = collection(db, "empresas", empresaId, "movimientosTesoreria");
    const q = query(movimientosRef, orderBy("fecha", "desc"));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      fechaCreacion: doc.data().fechaCreacion || new Date().toISOString()
    }));
  },
  
  // Nomencladores
  getNomencladores: async (tipo: string, paisId: string) => {
    const nomencladoresRef = collection(db, tipo);
    const q = query(nomencladoresRef, where("paisId", "==", paisId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
};

// Main handler function
serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;
    
    // Authenticate with Firebase
    const user = await authenticateFirebase();
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Failed to authenticate with Firebase" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // API Routes
    
    // GET /api/empresas - Get all empresas
    if (method === "GET" && path === "/api/empresas") {
      const empresas = await routes.getEmpresas();
      return new Response(JSON.stringify(empresas), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // GET /api/empresas/:id - Get empresa by ID
    if (method === "GET" && path.match(/^\/api\/empresas\/[^\/]+$/)) {
      const id = path.split("/").pop();
      const empresa = await routes.getEmpresaById(id as string);
      
      if (!empresa) {
        return new Response(
          JSON.stringify({ error: "Empresa not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      return new Response(JSON.stringify(empresa), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // GET /api/empresas/pais/:paisId - Get empresas by país
    if (method === "GET" && path.match(/^\/api\/empresas\/pais\/[^\/]+$/)) {
      const paisId = path.split("/").pop();
      const empresas = await routes.getEmpresasByPais(paisId as string);
      
      return new Response(JSON.stringify(empresas), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // GET /api/paises - Get all paises
    if (method === "GET" && path === "/api/paises") {
      const paises = await routes.getPaises();
      return new Response(JSON.stringify(paises), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // GET /api/paises/:id - Get país by ID
    if (method === "GET" && path.match(/^\/api\/paises\/[^\/]+$/)) {
      const id = path.split("/").pop();
      const pais = await routes.getPaisById(id as string);
      
      if (!pais) {
        return new Response(
          JSON.stringify({ error: "País not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      return new Response(JSON.stringify(pais), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // GET /api/contabilidad/cuentas - Get plan de cuentas
    if (method === "GET" && path === "/api/contabilidad/cuentas") {
      const empresaId = url.searchParams.get("empresa_id");
      
      if (!empresaId) {
        return new Response(
          JSON.stringify({ error: "empresa_id is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      const cuentas = await routes.getPlanCuentas(empresaId);
      return new Response(JSON.stringify({ data: cuentas, total: cuentas.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // GET /api/contabilidad/asientos - Get asientos contables
    if (method === "GET" && path === "/api/contabilidad/asientos") {
      const empresaId = url.searchParams.get("empresa_id");
      const fechaDesde = url.searchParams.get("fecha_desde") || undefined;
      const fechaHasta = url.searchParams.get("fecha_hasta") || undefined;
      
      if (!empresaId) {
        return new Response(
          JSON.stringify({ error: "empresa_id is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      const asientos = await routes.getAsientos(empresaId, fechaDesde, fechaHasta);
      return new Response(JSON.stringify({ 
        data: asientos, 
        total: asientos.length,
        page: 1,
        limit: asientos.length
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // GET /api/tesoreria/cuentas - Get cuentas bancarias
    if (method === "GET" && path === "/api/tesoreria/cuentas") {
      const empresaId = url.searchParams.get("empresa_id");
      
      if (!empresaId) {
        return new Response(
          JSON.stringify({ error: "empresa_id is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      const cuentas = await routes.getCuentasBancarias(empresaId);
      return new Response(JSON.stringify(cuentas), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // GET /api/tesoreria/movimientos - Get movimientos de tesorería
    if (method === "GET" && path === "/api/tesoreria/movimientos") {
      const empresaId = url.searchParams.get("empresa_id");
      
      if (!empresaId) {
        return new Response(
          JSON.stringify({ error: "empresa_id is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      const movimientos = await routes.getMovimientosTesoreria(empresaId);
      return new Response(JSON.stringify(movimientos), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // GET /api/nomencladores/:tipo - Get nomencladores by tipo
    if (method === "GET" && path.match(/^\/api\/nomencladores\/[^\/]+$/)) {
      const tipo = path.split("/").pop();
      const paisId = url.searchParams.get("pais_id");
      
      if (!paisId) {
        return new Response(
          JSON.stringify({ error: "pais_id is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      const nomencladores = await routes.getNomencladores(tipo as string, paisId);
      return new Response(JSON.stringify(nomencladores), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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