/* =========================
   ASIGNATURAS DETALLE
   (coincide EXACTAMENTE con asignaturas_detalle de la RPC)
========================= */
export type AsignaturaDetalle = {
  componente_id: string;
  subcomponente_id: string;
  tema_id: string;

  asignatura_id: string;
  asignatura: string;
  promedio_asignatura: number;

  docentes: {
    docente: string;

    // promedio general del docente en la asignatura
    promedio: number;

    // 🔹 NUEVO: separado por hoja
    // Hoja 1 = primera vez
    // Hoja 2 = n veces
    primera_vez?: number | null;
    n_veces?: number | null;

    // 🔹 NUEVO: periodos reales asociados a ese docente en esa asignatura
    periodos?: string[] | null;
  }[];
};

/* =========================
   ITEM GENÉRICO (gráficos)
========================= */
export interface Item {
  id: string;
  nombre: string;
  promedio: number;

  componente_id?: string;
  subcomponente_id?: string;
}

/* =========================
   DOCENTE GLOBAL DETALLE
   (docentes_global_detalle de la RPC)
========================= */
export type DocenteDetalle = {
  docente: string;
  asignatura: string;
  asignatura_id: string;

  componente_id: string;
  subcomponente_id: string;
  tema_id: string;

  // periodos donde aparece ese docente en esa asignatura
  periodos: string[];
};

/* =========================
   TOP 5
========================= */
export type Top5Data = {
  componentes: Item[] | null;
  subcomponentes: Item[] | null;
  temas: Item[] | null;
  asignaturas: Item[] | null;
};

/* =========================
   RESPUESTA PRINCIPAL RPC
========================= */
export type DashboardResponse = {
  /* GLOBAL */
  global: number;
  conteo: number | null;

  /* =========================
     🔹 METADATOS DE LA VERSIÓN
     (eval_dataset_versions)
  ========================= */
  periodo_detectado?: string | null;
  porcentaje_aprobados?: number | null;
  numero_estudiantes?: number | null;

  total_inscritos?: number | null;
  inscritos_primera_vez?: number | null;
  inscritos_n_veces?: number | null;
  aprobados_primera_vez?: number | null;
  aprobados_n_veces?: number | null;
  ausentes_primera_vez?: number | null;
  ausentes_n_veces?: number | null;

  /* =========================
     AGRUPADOS
  ========================= */
  por_componente: Item[] | null;
  por_subcomponente: Item[] | null;
  por_tema: Item[] | null;
  por_asignatura: Item[] | null;

  /* =========================
     TOP 5
  ========================= */
  top5: Top5Data;

  /* =========================
     DOCENTES POR NIVEL
  ========================= */
  docentes_por_componente: Record<string, string[]> | null;
  docentes_por_subcomponente: Record<string, string[]> | null;
  docentes_por_tema: Record<string, string[]> | null;
  docentes_por_asignatura: Record<string, string[]> | null;

  /* =========================
     DETALLES
  ========================= */
  docentes_global_detalle: DocenteDetalle[] | null;
  asignaturas_detalle?: AsignaturaDetalle[] | null;
};

/* =========================
   FILTROS
========================= */
export type DashboardFilters = {
  versionId: string;

  periodoId?: string | null;
  componenteId?: string | null;
  subcomponenteId?: string | null;
  temaId?: string | null;
  asignaturaId?: string | null;
  profesorId?: string | null;
};
