import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function safeArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function clampStr(s: string, max = 14000) {
  if (!s) return "";
  return s.length > max ? s.slice(0, max) + "\n...[TRUNCADO]" : s;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const versionId = String(body?.versionId ?? "").trim();

    if (!versionId) {
      return new Response(
        JSON.stringify({ error: "Falta versionId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Revisar si ya existen
    const { data: versionRow, error: versionError } = await supabase
      .from("exam_dataset_versions")
      .select(`
        id,
        version_number,
        file_name,
        total_preguntas,
        total_intentos,
        conclusiones,
        recomendaciones,
        exam_datasets (
          id,
          nombre,
          descripcion,
          periodo
        )
      `)
      .eq("id", versionId)
      .single();

    if (versionError || !versionRow) {
      return new Response(
        JSON.stringify({ error: "Versión no encontrada", detail: versionError }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const conclusionesExistentes = String(versionRow.conclusiones ?? "").trim();
    const recomendacionesExistentes = String(versionRow.recomendaciones ?? "").trim();

    if (conclusionesExistentes && recomendacionesExistentes) {
      return new Response(
        JSON.stringify({
          conclusiones: safeArray<string>(JSON.parse(conclusionesExistentes)),
          recomendaciones: safeArray<string>(JSON.parse(recomendacionesExistentes)),
          cached: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 2. Traer preguntas
    const { data: preguntas, error: preguntasError } = await supabase
      .from("preguntas")
      .select(`
        id,
        numero_pregunta,
        enunciado,
        pregunta_raw,
        componente,
        subcomponente,
        tema,
        nivel,
        docente,
        justificacion
      `)
      .eq("version_id", versionId)
      .order("numero_pregunta", { ascending: true });

    if (preguntasError) {
      throw preguntasError;
    }

    // 3. Traer intentos
    const { data: intentos, error: intentosError } = await supabase
      .from("intentos")
      .select(`
        id,
        apellidos,
        nombres,
        correo,
        estado,
        tiempo_requerido_segundos,
        calificacion_total
      `)
      .eq("version_id", versionId);

    if (intentosError) {
      throw intentosError;
    }

    const intentoIds = safeArray<any>(intentos).map((i) => i.id);

    // 4. Traer respuestas
    let respuestas: any[] = [];
    if (intentoIds.length > 0) {
      const { data: respuestasData, error: respuestasError } = await supabase
        .from("intento_respuestas")
        .select(`
          id,
          intento_id,
          pregunta_id,
          opcion_id,
          es_correcta,
          puntaje_obtenido,
          respuesta_estudiante_raw,
          respuesta_estudiante_normalizada
        `)
        .in("intento_id", intentoIds);

      if (respuestasError) {
        throw respuestasError;
      }

      respuestas = respuestasData ?? [];
    }

    const preguntasMap = new Map((preguntas ?? []).map((p) => [p.id, p]));

    const percent = (part: number, total: number) => (total ? (part / total) * 100 : 0);

    // 5. Métricas globales
    const calificaciones = safeArray<any>(intentos)
      .map((i) => Number(i.calificacion_total))
      .filter((n) => Number.isFinite(n));

    const promedioGeneral = calificaciones.length
      ? calificaciones.reduce((a, b) => a + b, 0) / calificaciones.length
      : 0;

    const aprobados = calificaciones.filter((n) => n >= 70).length;
    const porcentajeAprobacion = percent(aprobados, calificaciones.length);

    const totalAciertos = respuestas.filter((r) => r.es_correcta === true).length;
    const aciertoGlobal = percent(totalAciertos, respuestas.length);

    // 6. Rendimiento por componente
    const groupedByComponent = new Map<
      string,
      { nombre: string; totalRespuestas: number; totalAciertos: number; promedio: number }
    >();

    for (const r of respuestas) {
      const pregunta = preguntasMap.get(r.pregunta_id);
      if (!pregunta) continue;

      const componente = String(pregunta.componente ?? "Sin componente").trim() || "Sin componente";

      if (!groupedByComponent.has(componente)) {
        groupedByComponent.set(componente, {
          nombre: componente,
          totalRespuestas: 0,
          totalAciertos: 0,
          promedio: 0,
        });
      }

      const item = groupedByComponent.get(componente)!;
      item.totalRespuestas += 1;
      if (r.es_correcta === true) item.totalAciertos += 1;
    }

    const componentes = Array.from(groupedByComponent.values())
      .map((c) => ({
        ...c,
        promedio: percent(c.totalAciertos, c.totalRespuestas),
      }))
      .sort((a, b) => a.promedio - b.promedio);

    // 7. Preguntas más difíciles
    const groupedQuestions = new Map<
      string,
      {
        numero_pregunta: number;
        enunciado: string;
        total: number;
        aciertos: number;
        porcentaje: number;
        componente: string;
      }
    >();

    for (const r of respuestas) {
      const pregunta = preguntasMap.get(r.pregunta_id);
      if (!pregunta) continue;

      if (!groupedQuestions.has(pregunta.id)) {
        groupedQuestions.set(pregunta.id, {
          numero_pregunta: pregunta.numero_pregunta,
          enunciado: pregunta.enunciado || pregunta.pregunta_raw || "Sin enunciado",
          total: 0,
          aciertos: 0,
          porcentaje: 0,
          componente: String(pregunta.componente ?? "Sin componente"),
        });
      }

      const q = groupedQuestions.get(pregunta.id)!;
      q.total += 1;
      if (r.es_correcta === true) q.aciertos += 1;
    }

    const preguntasDificiles = Array.from(groupedQuestions.values())
      .map((q) => ({
        ...q,
        porcentaje: percent(q.aciertos, q.total),
      }))
      .sort((a, b) => a.porcentaje - b.porcentaje)
      .slice(0, 10);

    // 8. Distribución de calificaciones
    const distribucion = {
      "0-49": 0,
      "50-69": 0,
      "70-84": 0,
      "85-100": 0,
      "Sin nota": 0,
    };

    for (const intento of safeArray<any>(intentos)) {
      const score = intento.calificacion_total == null ? null : Number(intento.calificacion_total);

      let rango = "Sin nota";
      if (score != null && !Number.isNaN(score)) {
        if (score < 50) rango = "0-49";
        else if (score < 70) rango = "50-69";
        else if (score < 85) rango = "70-84";
        else rango = "85-100";
      }

      distribucion[rango as keyof typeof distribucion] += 1;
    }

    // 9. Armar contexto
    const dataset = Array.isArray(versionRow.exam_datasets)
      ? versionRow.exam_datasets[0]
      : versionRow.exam_datasets;

    const contexto = {
      dataset: {
        nombre: dataset?.nombre ?? null,
        descripcion: dataset?.descripcion ?? null,
        periodo: dataset?.periodo ?? null,
      },
      version: {
        id: versionRow.id,
        version_number: versionRow.version_number,
        file_name: versionRow.file_name,
        total_preguntas: versionRow.total_preguntas,
        total_intentos: versionRow.total_intentos,
      },
      metricas: {
        promedioGeneral,
        porcentajeAprobacion,
        aciertoGlobal,
        totalEstudiantes: calificaciones.length,
      },
      distribucion,
      componentes,
      preguntasDificiles,
    };

    const systemPrompt = `
Eres un analista gerencial académico especializado en evaluación universitaria.

Tu tarea es generar exactamente:
- 5 conclusiones
- 5 recomendaciones

Reglas:
- Redacta en español.
- Tono institucional, técnico y claro.
- Cada conclusión debe basarse en datos reales del contexto.
- Cada recomendación debe ser accionable y coherente con los hallazgos.
- No repitas ideas entre sí.
- No inventes datos.
- Devuelve SOLO JSON válido con esta estructura exacta:

{
  "conclusiones": ["...", "...", "...", "...", "..."],
  "recomendaciones": ["...", "...", "...", "...", "..."]
}
`;

    const userPrompt = `
Analiza el siguiente contexto de resultados de evaluación y genera 5 conclusiones y 5 recomendaciones.

CONTEXTO:
${clampStr(JSON.stringify(contexto), 14000)}
`;

    const openaiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    const openaiData = await openaiResp.json();

    if (!openaiResp.ok) {
      return new Response(
        JSON.stringify({ error: "OpenAI error", detail: openaiData }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const raw = openaiData?.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);

    const conclusiones = safeArray<string>(parsed?.conclusiones).slice(0, 5);
    const recomendaciones = safeArray<string>(parsed?.recomendaciones).slice(0, 5);

    if (conclusiones.length !== 5 || recomendaciones.length !== 5) {
      return new Response(
        JSON.stringify({
          error: "La IA no devolvió 5 conclusiones y 5 recomendaciones válidas",
          raw,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    await supabase
      .from("exam_dataset_versions")
      .update({
        conclusiones: JSON.stringify(conclusiones),
        recomendaciones: JSON.stringify(recomendaciones),
      })
      .eq("id", versionId);

    return new Response(
      JSON.stringify({
        conclusiones,
        recomendaciones,
        cached: false,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({
        error: "Error interno",
        detail: String(e),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});