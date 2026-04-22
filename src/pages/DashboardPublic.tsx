"use client";

import React from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import DashboardGerencial from "./Dashboard";

/**
 * Dashboard público:
 * - Sin login
 * - Solo lectura
 * - Acceso controlado por versionId
 */
export default function DashboardPublic() {
  const { versionId } = useParams<{ versionId: string }>();

  if (!versionId) {
    return (
      <div className="p-6 text-sm">
        No se especificó una versión válida para visualización pública.
      </div>
    );
  }

  return (
    <div className="relative">
      

      {/* Dashboard reutilizado */}
      <DashboardGerencial
        forcePublic
        versionIdOverride={versionId}
      />
    </div>
  );
}
