// supabase/functions/procesar-eval-resultados/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const { versionId } = await req.json();
    if (!versionId) return json(400, { error: "versionId requerido" });

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const compCache = new Map<string, string>();
    const subCache = new Map<string, string>();
    const temaCache = new Map<string, string>();

    async function getOrCreate(
      table: string,
      uniqueKey: string,
      value: string,
      extra: any = {}
    ) {
      const key = `${table}:${value}`;
      if (table === "eval_componentes" && compCache.has(key)) return compCache.get(key)!;
      if (table === "eval_subcomponentes" && subCache.has(key)) return subCache.get(key)!;
      if (table === "eval_temas" && temaCache.has(key)) return temaCache.get(key)!;

      const { data, error } = await sb
        .from(table)
        .select("id")
        .eq(uniqueKey, value)
        .maybeSingle();

      if (data) {
        if (table === "eval_componentes") compCache.set(key, data.id);
        if (table === "eval_subcomponentes") subCache.set(key, data.id);
        if (table === "eval_temas") temaCache.set(key, data.id);
        return data.id;
      }

      const { data: ins, error: insErr } = await sb
        .from(table)
        .insert({ [uniqueKey]: value, ...extra })
        .select("id")
        .single();

      if (insErr) throw insErr;

      if (table === "eval_componentes") compCache.set(key, ins.id);
      if (table === "eval_subcomponentes") subCache.set(key, ins.id);
      if (table === "eval_temas") temaCache.set(key, ins.id);

      return ins.id;
    }

    const { data: raw } = await sb
      .from("eval_import_raw")
      .select("data")
      .eq("version_id", versionId);

    let inserted = 0;

    for (const row of raw ?? []) {
      const r = row.data as any[];
      const [comp, sub, tema, pct] = r;

      if (!comp || !sub || !tema || pct == null) continue;

      const compId = await getOrCreate("eval_componentes", "nombre", String(comp));
      const subId = await getOrCreate(
        "eval_subcomponentes",
        "nombre",
        String(sub),
        { componente_id: compId }
      );
      const temaId = await getOrCreate("eval_temas", "nombre", String(tema));

      await sb.from("eval_resultados").insert({
        version_id: versionId,
        componente_id: compId,
        subcomponente_id: subId,
        tema_id: temaId,
        aciertos_pct: Number(pct),
      });

      inserted++;
    }

    return json(200, { success: true, resultados: inserted });
  } catch (e: any) {
    return json(500, { error: e.message });
  }
});
