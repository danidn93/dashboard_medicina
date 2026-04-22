import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (s: number, b: unknown) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { ...cors, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const { versionId } = await req.json();
    if (!versionId) return json(400, { error: "versionId requerido" });

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const [
      componentes,
      subcomponentes,
      temas,
      asignaturas,
      profesores,
      periodos,
    ] = await Promise.all([
      sb.from("eval_componentes").select("id", { count: "exact", head: true }),
      sb.from("eval_subcomponentes").select("id", { count: "exact", head: true }),
      sb.from("eval_temas").select("id", { count: "exact", head: true }),
      sb.from("eval_asignaturas").select("id", { count: "exact", head: true }),
      sb.from("eval_profesores").select("id", { count: "exact", head: true }),
      sb.from("eval_periodos").select("id", { count: "exact", head: true }),
    ]);

    await sb
      .from("eval_dataset_versions")
      .update({
        total_componentes: componentes.count ?? 0,
        total_subcomponentes: subcomponentes.count ?? 0,
        total_temas: temas.count ?? 0,
        total_asignaturas: asignaturas.count ?? 0,
        total_profesores: profesores.count ?? 0,
        total_periodos: periodos.count ?? 0,
      })
      .eq("id", versionId);

    return json(200, { success: true });
  } catch (e: any) {
    return json(500, { error: e.message });
  }
});
