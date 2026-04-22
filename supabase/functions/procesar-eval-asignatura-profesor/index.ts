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
    const [asignatura, profesor, tipo, periodo] = data;
    return {
      asignatura: asignatura?.toString?.().trim(),
      profesor: profesor?.toString?.().trim(),
      tipo: tipo?.toString?.().trim() ?? "PRINCIPAL",
      periodo: periodo?.toString?.().trim(),
    };
  }

  // Caso object (por encabezados)
  if (data && typeof data === "object") {
    return {
      asignatura: pick(data, ["ASIGNATURA", "Asignatura"]),
      profesor: pick(data, ["PROFESOR", "DOCENTE", "Profesor"]),
      tipo: pick(data, ["TIPO", "TIPO_PROFESOR", "ROL", "TIPO DE PROFESOR"]) ?? "PRINCIPAL",
      periodo: pick(data, ["PERIODO", "PERÍODO", "Periodo"]),
    };
  }

  return { asignatura: null, profesor: null, tipo: null, periodo: null };
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST")
    return json(405, { error: "Method not allowed" });

  try {
    const { versionId, sheetNames, chunkSize = 100, offset = 0 } =
      await req.json();

    if (!versionId || !Array.isArray(sheetNames) || sheetNames.length !== 1) {
      return json(400, {
        error: "Se requiere exactamente una hoja",
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
      .select("row_number,data")
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
    const [{ data: asigs }, { data: profs }, { data: pers }] =
      await Promise.all([
        sb.from("eval_asignaturas").select("id,nombre"),
        sb.from("eval_profesores").select("id,nombre"),
        sb.from("eval_periodos").select("id,nombre"),
      ]);

    const asigMap = new Map((asigs ?? []).map((a: any) => [a.nombre, a.id]));
    const profMap = new Map((profs ?? []).map((p: any) => [p.nombre, p.id]));
    const perMap = new Map((pers ?? []).map((p: any) => [p.nombre, p.id]));

    const nuevasAsig: any[] = [];
    const nuevosProf: any[] = [];
    const nuevosPer: any[] = [];
    const relaciones: any[] = [];

    let skipped = 0;

    for (const row of rows) {
      const { asignatura, profesor, tipo, periodo } = parseRow(row.data);

      if (!asignatura || !profesor || !periodo) {
        skipped++;
        continue;
      }

      let asigId = asigMap.get(asignatura);
      if (!asigId) {
        asigId = crypto.randomUUID();
        asigMap.set(asignatura, asigId);
        nuevasAsig.push({ id: asigId, nombre: asignatura });
      }

      let profId = profMap.get(profesor);
      if (!profId) {
        profId = crypto.randomUUID();
        profMap.set(profesor, profId);
        nuevosProf.push({ id: profId, nombre: profesor });
      }

      let perId = perMap.get(periodo);
      if (!perId) {
        perId = crypto.randomUUID();
        perMap.set(periodo, perId);
        nuevosPer.push({ id: perId, nombre: periodo });
      }

      relaciones.push({
        version_id: versionId,
        asignatura_id: asigId,
        profesor_id: profId,
        periodo_id: perId,
        tipo_profesor: tipo || "PRINCIPAL",
      });
    }

    /* ===============================
       UPSERT CATÁLOGOS
    =============================== */
    if (nuevasAsig.length)
      await sb
        .from("eval_asignaturas")
        .upsert(nuevasAsig, { onConflict: "nombre" });

    if (nuevosProf.length)
      await sb
        .from("eval_profesores")
        .upsert(nuevosProf, { onConflict: "nombre" });

    if (nuevosPer.length)
      await sb
        .from("eval_periodos")
        .upsert(nuevosPer, { onConflict: "nombre" });

    /* ===============================
       UPSERT RELACIONES (CLAVE)
    =============================== */
    if (relaciones.length) {
      await sb.from("eval_asignatura_profesor").upsert(relaciones, {
        onConflict:
          "version_id,asignatura_id,profesor_id,periodo_id,tipo_profesor",
      });
    }

    return json(200, {
      success: true,
      processed: rows.length,
      inserted: relaciones.length,
      skipped,
      finished: rows.length < chunkSize,
    });
  } catch (e: any) {
    return json(500, { error: e.message ?? "Error interno" });
  }
});
