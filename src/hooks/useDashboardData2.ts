import { useState, useEffect, useCallback } from "react";
import { DashboardResponse, DashboardFilters } from "@/types/dashboard";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY; // 👈 AQUÍ

const EDGE_FUNCTION_URL = SUPABASE_URL
  ? `${SUPABASE_URL}/functions/v1/eval-dashboard-analisis`
  : null;

export function useDashboardData(filters: DashboardFilters | null) {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!filters?.versionId) {
      setData(null);
      return;
    }

    if (!EDGE_FUNCTION_URL || !SUPABASE_ANON_KEY) {
      setError("Supabase no configurado (URL o Publishable Key faltante)");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          "apikey": SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          versionId: filters.versionId,
          periodoId: filters.periodoId ?? null,
          componenteId: filters.componenteId ?? null,
          subcomponenteId: filters.subcomponenteId ?? null,
          temaId: filters.temaId ?? null,
          asignaturaId: filters.asignaturaId ?? null,
          profesorId: filters.profesorId ?? null,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Error ${response.status}: ${text}`);
      }

      const result = await response.json();
      setData(result as DashboardResponse);
    } catch (err) {
      console.error("[Dashboard] Error:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
