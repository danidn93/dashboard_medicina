//src/components/FloatingChatGPT.tsx
"use client";

import { useMemo, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const COLORS = {
  primary: "#002E45",
  accent: "#FF6900",
  bg: "#FFFFFF",
  muted: "#E5E7EB",
};

type ChatMsg = { role: "user" | "assistant"; content: string };

// Para Edge: role system/user/assistant
type WireMsg = { role: "system" | "user" | "assistant"; content: string };

export default function FloatingChatGPT({
  dashboardContext,
  rpcSnapshot,
}: {
  dashboardContext: string;
  rpcSnapshot?: any; // opcional: subset del JSON de la RPC
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(false);

  // Convertimos historial local a formato wire
  const wireHistory: WireMsg[] = useMemo(() => {
    return messages.map((m) => ({
      role: m.role,
      content: m.content,
    })) as WireMsg[];
  }, [messages]);

  async function send() {
    const q = input.trim();
    if (!q || loading) return;

    // UI optimistic
    setMessages((m) => [...m, { role: "user", content: q }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-gerencial`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: q,
            dashboard_context: dashboardContext,
            rpc_snapshot: rpcSnapshot ?? null,
            history: wireHistory, // 👈 hilo completo (recortado en servidor)
          }),
        }
      );

      const data = await res.json();

      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: data?.answer ?? "No se obtuvo respuesta.",
        },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Error al consultar el asistente." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="
            fixed 
            bottom-4 right-4 sm:bottom-6 sm:right-6
            z-50 
            rounded-full 
            p-3 sm:p-4 
            shadow-lg 
            transition 
            hover:scale-105
          "
          style={{ backgroundColor: COLORS.accent, color: "#fff" }}
          aria-label="Abrir chat"
        >
          <MessageCircle />
        </button>
      )}

      {open && (
        <div
          className="
            fixed 
            inset-0 sm:inset-auto
            sm:bottom-6 sm:right-6
            z-50
            w-full sm:w-[520px]
            h-full sm:h-auto
            max-h-full sm:max-h-[720px]
            rounded-none sm:rounded-2xl
            shadow-2xl
            flex flex-col
            overflow-hidden
            border
          "
          style={{ backgroundColor: COLORS.bg, borderColor: COLORS.muted }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ backgroundColor: COLORS.primary, color: "#fff" }}
          >
            <div className="font-semibold text-base">Asistente Gerencial</div>
            <button
              onClick={() => setOpen(false)}
              className="opacity-80 hover:opacity-100"
              aria-label="Cerrar chat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3 text-sm">
            {messages.length === 0 && (
              <div className="opacity-70">
                Preguntas sugeridas:
                <ul className="list-disc ml-5 mt-2">
                  <li>¿Cuál es el componente más crítico y por qué?</li>
                  <li>¿Qué asignaturas están más bajas y qué acción recomiendas?</li>
                  <li>Muéstrame docentes asociados al peor tema.</li>
                  <li>¿Qué pasa si filtro por un tema específico?</li>
                </ul>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[86%] rounded-2xl px-4 py-3 leading-relaxed ${
                  m.role === "user" ? "ml-auto" : ""
                }`}
                style={{
                  backgroundColor: m.role === "user" ? COLORS.primary : "#F3F4F6",
                  color: m.role === "user" ? "#fff" : "#000",
                }}
              >
                {m.content}
              </div>
            ))}

            {loading && (
              <div className="text-xs opacity-60">Analizando…</div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t flex gap-2" style={{ borderColor: COLORS.muted }}>
            <Input
              value={input}
              placeholder="Escribe tu pregunta…"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              disabled={loading}
              className="h-11"
            />
            <Button
              onClick={send}
              disabled={loading}
              className="h-11 px-4"
              style={{ backgroundColor: COLORS.accent, color: "#fff" }}
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
