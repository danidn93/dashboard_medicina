//supabase/functions/eval-dashboard-analisis
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* ===============================
   CORS
=============================== */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  /* ===============================
     PRE-FLIGHT
  =============================== */
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  try {
    const {
      versionId,
      periodoId,
      componenteId,
      subcomponenteId,
      temaId,
      asignaturaId,
      profesorId,
    } = await req.json();

    if (!versionId) {
      return json(400, { error: "versionId es requerido" });
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await sb.rpc("eval_dashboard_analisis", {
      p_version_id: versionId,
      p_periodo: periodoId ?? null,
      p_componente: componenteId ?? null,
      p_subcomponente: subcomponenteId ?? null,
      p_tema: temaId ?? null,
      p_asignatura: asignaturaId ?? null,
      p_profesor: profesorId ?? null,
    });

    if (error) {
      return json(500, { error: error.message });
    }

    return json(200, data);
  } catch (e: any) {
    return json(500, { error: e.message ?? "Error interno" });
  }
});
