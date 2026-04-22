import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (s: number, b: any) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { ...cors, "Content-Type": "application/json" },
  });

/* ===============================
   HELPERS
=============================== */
const normKey = (k: string) =>
  k
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[áàäâ]/g, "a")
    .replace(/[éèëê]/g, "e")
    .replace(/[íìïî]/g, "i")
    .replace(/[óòöô]/g, "o")
    .replace(/[úùüû]/g, "u")
    .replace(/ñ/g, "n");

const pickFromObject = (obj: any, keys: string[]) => {
  if (!obj || typeof obj !== "object") return undefined;

  const map = new Map<string, any>();
  for (const [k, v] of Object.entries(obj)) {
    map.set(normKey(String(k)), v);
  }

  for (const k of keys) {
    const v = map.get(normKey(k));
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return undefined;
};

const parsePct = (pct: any) => {
  if (pct === null || pct === undefined) return null;
  if (typeof pct === "number") return pct;
  const s = String(pct).trim();
  if (!s) return null;
  // "85,5" -> 85.5 ; "85%" -> 85
  const cleaned = s.replace("%", "").replace(",", ".").trim();
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

// Soporta filas en formato array o object
const parseRow = (data: any) => {
  // Caso 1: array
  if (Array.isArray(data)) {
    const [comp, sub, tema, pct] = data;
    return {
      comp: comp?.toString?.().trim(),
      sub: sub?.toString?.().trim(),
      tema: tema?.toString?.().trim(),
      pct: parsePct(pct),
    };
  }

  // Caso 2: object por encabezados
  if (data && typeof data === "object") {
    const comp = pickFromObject(data, [
      "COMPONENTE",
      "Componente",
      "componente",
    ]);
    const sub = pickFromObject(data, [
      "SUBCOMPONENTE",
      "Subcomponente",
      "subcomponente",
      "SUB_COMPONENTE",
      "SUB COMPONENTE",
    ]);
    const tema = pickFromObject(data, ["TEMA", "Tema", "tema"]);
    const pct = pickFromObject(data, [
      "ACIERTOS_PCT",
      "ACIERTOS%",
      "ACIERTOS_%",
      "ACIERTOS",
      "PORCENTAJE",
      "PCT",
      "%ACIERTOS",
      "PORCENTAJE_ACIERTOS",
    ]);

    return {
      comp: comp?.toString?.().trim(),
      sub: sub?.toString?.().trim(),
      tema: tema?.toString?.().trim(),
      pct: parsePct(pct),
    };
  }

  return { comp: undefined, sub: undefined, tema: undefined, pct: null };
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const { versionId, sheetNames, chunkSize = 200, offset = 0 } =
      await req.json();

    if (!versionId || !Array.isArray(sheetNames) || sheetNames.length !== 1) {
      return json(400, {
        error: "Se requiere exactamente una hoja (sheetNames: [sheetName])",
      });
    }

    const sheetName = String(sheetNames[0]).trim();

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: rows, error } = await sb
      .from("eval_import_raw")
      .select("row_number, data")
      .eq("version_id", versionId)
      .eq("sheet_name", sheetName)
      .order("row_number", { ascending: true })
      .range(offset, offset + chunkSize - 1);

    if (error) throw error;

    if (!rows || rows.length === 0) {
      return json(200, {
        success: true,
        sheetName,
        processed: 0,
        inserted: 0,
        skipped: 0,
        finished: true,
      });
    }

    // precargar catálogos
    const [{ data: comps }, { data: subs }, { data: temas }] =
      await Promise.all([
        sb.from("eval_componentes").select("id,nombre"),
        sb.from("eval_subcomponentes").select("id,nombre,componente_id"),
        sb.from("eval_temas").select("id,nombre"),
      ]);

    const compMap = new Map((comps ?? []).map((c: any) => [c.nombre, c.id]));
    const subMap = new Map(
      (subs ?? []).map((s: any) => [`${s.componente_id}|${s.nombre}`, s.id])
    );
    const temaMap = new Map((temas ?? []).map((t: any) => [t.nombre, t.id]));

    const nuevosComp: any[] = [];
    const nuevosSub: any[] = [];
    const nuevosTema: any[] = [];
    const resultados: any[] = [];

    let skipped = 0;

    for (const row of rows) {
      const { comp, sub, tema, pct } = parseRow(row.data);

      if (!comp || !sub || !tema || pct === null) {
        skipped++;
        continue;
      }

      let compId = compMap.get(comp);
      if (!compId) {
        compId = crypto.randomUUID();
        compMap.set(comp, compId);
        nuevosComp.push({ id: compId, nombre: comp });
      }

      const subKey = `${compId}|${sub}`;
      let subId = subMap.get(subKey);
      if (!subId) {
        subId = crypto.randomUUID();
        subMap.set(subKey, subId);
        nuevosSub.push({ id: subId, nombre: sub, componente_id: compId });
      }

      let temaId = temaMap.get(tema);
      if (!temaId) {
        temaId = crypto.randomUUID();
        temaMap.set(tema, temaId);
        nuevosTema.push({ id: temaId, nombre: tema });
      }

      resultados.push({
        version_id: versionId,
        sheet_name: sheetName, // ✅ CLAVE para diferenciar Hoja 1 vs Hoja 2
        componente_id: compId,
        subcomponente_id: subId,
        tema_id: temaId,
        aciertos_pct: pct,
      });
    }

    // upsert catálogos
    if (nuevosComp.length) {
      const { error: e1 } = await sb
        .from("eval_componentes")
        .upsert(nuevosComp, { onConflict: "nombre" });
      if (e1) throw e1;
    }

    if (nuevosSub.length) {
      const { error: e2 } = await sb
        .from("eval_subcomponentes")
        .upsert(nuevosSub, { onConflict: "componente_id,nombre" });
      if (e2) throw e2;
    }

    if (nuevosTema.length) {
      const { error: e3 } = await sb
        .from("eval_temas")
        .upsert(nuevosTema, { onConflict: "nombre" });
      if (e3) throw e3;
    }

    // insert resultados (si quieres tolerar duplicados, cambiamos a upsert)
    let inserted = 0;
    if (resultados.length) {
      const { error: e4 } = await sb.from("eval_resultados").insert(resultados);
      if (e4) throw e4;
      inserted = resultados.length;
    }

    return json(200, {
      success: true,
      sheetName,
      processed: rows.length,
      inserted,
      skipped,
      offset,
      chunkSize,
      finished: rows.length < chunkSize,
      // diagnóstico útil si Hoja 2 vuelve a salir 0:
      sample_row_type: Array.isArray(rows[0]?.data)
        ? "array"
        : typeof rows[0]?.data,
      sample_row_keys: rows[0]?.data && typeof rows[0]?.data === "object"
        ? Object.keys(rows[0].data).slice(0, 20)
        : null,
    });
  } catch (e: any) {
    return json(500, { error: e.message ?? "Error interno" });
  }
});
