//supabase/functions/chat-gerencial/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

type ChatMsg = { role: "system" | "user" | "assistant"; content: string };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function clampStr(s: string, max = 14000) {
  if (!s) return "";
  return s.length > max ? s.slice(0, max) + "\n...[TRUNCADO]" : s;
}

function safeArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

/**
 * Espera un payload:
 * {
 *   question: string,
 *   dashboard_context: string,         // tu string armado en el TSX (filtros + top5 + global)
 *   rpc_snapshot?: any,               // opcional: subset del JSON de la RPC (NO todo si es enorme)
 *   history?: ChatMsg[]               // historial de mensajes previos (hilo)
 * }
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();

    const question = String(body?.question ?? "").trim();
    const dashboardContext = String(body?.dashboard_context ?? "").trim();
    const rpcSnapshot = body?.rpc_snapshot ?? null;
    const history = safeArray<ChatMsg>(body?.history);

    if (!question) {
      return new Response(JSON.stringify({ error: "Falta question" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // System prompt: define contrato de respuesta
    const systemPrompt = `
Eres un Asistente Gerencial Académico para un dashboard de evaluación.
Objetivo: responder preguntas basadas en el CONTEXTO del dashboard y/o el SNAPSHOT JSON disponible.

Reglas de salida:
- Responde claro, breve, institucional, orientado a decisión.
- Si detectas bajo desempeño, sugiere 1 acción concreta (no lista larga).
- Si el usuario pregunta por "top/peor/mejor", usa promedios (aciertos_pct agregado) y explica el criterio.
- Si faltan datos para afirmar algo, dilo explícitamente y sugiere qué filtro/dato falta.
- Mantén coherencia con el hilo: considera la conversación previa.
`;

    const ctxBlock = `
CONTEXTO DEL DASHBOARD (texto resumido):
${clampStr(dashboardContext, 12000)}

SNAPSHOT JSON (si aplica, puede estar recortado):
${rpcSnapshot ? clampStr(JSON.stringify(rpcSnapshot), 12000) : "NO PROVISTO"}
`;

    // Historial defensivo: máximo 12 turnos (24 msgs) para no inflar tokens
    const trimmedHistory = history.slice(-24).filter((m) =>
      m && (m.role === "user" || m.role === "assistant" || m.role === "system") && typeof m.content === "string"
    );

    const messages: ChatMsg[] = [
      { role: "system", content: systemPrompt },
      // Metemos contexto como "system" adicional (mejor control)
      { role: "system", content: ctxBlock },
      ...trimmedHistory,
      { role: "user", content: question },
    ];

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.0,
        messages,
      }),
    });

    const data = await resp.json();

    if (!resp.ok) {
      return new Response(JSON.stringify({ error: "OpenAI error", detail: data }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const answer = data?.choices?.[0]?.message?.content ?? "Sin respuesta";

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Error interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
