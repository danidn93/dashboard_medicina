import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/* ===============================
   CORS
=============================== */
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

const pick = (obj: any, keys: string[]) => {
  if (!obj || typeof obj !== "object") return undefined;
  const map = new Map<string, any>();
  for (const [k, v] of Object.entries(obj)) {
    map.set(normKey(k), v);
  }
  for (const k of keys) {
    const v = map.get(normKey(k));
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return undefined;
};

const parseRow = (data: any) => {
  // Caso array
  if (Array.isArray(data)) {
    const [tema, asignatura] = data;
    return {
      tema: tema?.toString?.().trim(),
      asignatura: asignatura?.toString?.().trim(),
    };
  }

  // Caso object (por encabezados)
  if (data && typeof data === "object") {
    return {
      tema: pick(data, ["TEMA", "Tema"]),
      asignatura: pick(data, ["ASIGNATURA", "Asignatura"]),
    };
  }

  return { tema: null, asignatura: null };
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST")
    return json(405, { error: "Method not allowed" });

  try {
    const { versionId, sheetNames, chunkSize = 200, offset = 0 } =
      await req.json();

    if (!versionId || !Array.isArray(sheetNames) || sheetNames.length !== 1) {
      return json(400, {
        error: "Debe enviarse exactamente una hoja por ejecución",
      });
    }

    const sheetName = String(sheetNames[0]).trim();

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    /* ===============================
       RAW
    =============================== */
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
        processed: 0,
        finished: true,
      });
    }

    /* ===============================
       CATÁLOGOS
    =============================== */
    const [{ data: temas }, { data: asignaturas }] = await Promise.all([
      sb.from("eval_temas").select("id,nombre"),
      sb.from("eval_asignaturas").select("id,nombre"),
    ]);

    const temaMap = new Map((temas ?? []).map(t => [t.nombre, t.id]));
    const asigMap = new Map((asignaturas ?? []).map(a => [a.nombre, a.id]));

    const nuevosTemas: any[] = [];
    const nuevasAsignaturas: any[] = [];
    const relaciones: any[] = [];

    let skipped = 0;

    for (const row of rows) {
      const { tema, asignatura } = parseRow(row.data);

      if (!tema || !asignatura) {
        skipped++;
        continue;
      }

      let temaId = temaMap.get(tema);
      if (!temaId) {
        temaId = crypto.randomUUID();
        temaMap.set(tema, temaId);
        nuevosTemas.push({ id: temaId, nombre: tema });
      }

      let asigId = asigMap.get(asignatura);
      if (!asigId) {
        asigId = crypto.randomUUID();
        asigMap.set(asignatura, asigId);
        nuevasAsignaturas.push({ id: asigId, nombre: asignatura });
      }

      relaciones.push({
        version_id: versionId,
        tema_id: temaId,
        asignatura_id: asigId,
      });
    }

    /* ===============================
       UPSERTS
    =============================== */
    if (nuevosTemas.length)
      await sb.from("eval_temas").upsert(nuevosTemas, {
        onConflict: "nombre",
      });

    if (nuevasAsignaturas.length)
      await sb.from("eval_asignaturas").upsert(nuevasAsignaturas, {
        onConflict: "nombre",
      });

    if (relaciones.length)
      await sb.from("eval_tema_asignatura").upsert(relaciones, {
        onConflict: "version_id,tema_id,asignatura_id",
      });

    return json(200, {
      success: true,
      processed: rows.length,
      inserted: relaciones.length,
      skipped,
      finished: rows.length < chunkSize,
    });
  } catch (e: any) {
    return json(500, {
      error: e.message ?? "Error procesando tema-asignatura",
    });
  }
});
