"use client";

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "@/components/ui/sonner";

/* ===============================
   Tipos
================================ */
type ResultadoRow = {
  componente: string;
  subcomponente: string;
  tema: string;
  aciertos_pct: number;
};

type TemaAsignaturaRow = {
  tema: string;
  asignatura: string;
};

type AsignaturaProfesorRow = {
  asignatura: string;
  profesor: string;
  periodo: string;
  tipo_profesor: string;
};

/* ===============================
   Página principal
================================ */
export default function ExcelEvalViewer() {
  const { versionId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [hoja1, setHoja1] = useState<ResultadoRow[]>([]);
  const [hoja2, setHoja2] = useState<ResultadoRow[]>([]);
  const [temaAsignatura, setTemaAsignatura] = useState<TemaAsignaturaRow[]>([]);
  const [asignaturaProfesor, setAsignaturaProfesor] =
    useState<AsignaturaProfesorRow[]>([]);

  /* ===============================
     Fetch
  ================================ */
  useEffect(() => {
    if (!versionId) return;

    const fetchData = async () => {
      try {
        /* ---------------------------
           Hoja 1 y Hoja 2
        --------------------------- */
        const { data: resultados, error } = await supabase
          .from("eval_resultados")
          .select(`
            sheet_name,
            aciertos_pct,
            eval_componentes(nombre),
            eval_subcomponentes(nombre),
            eval_temas(nombre)
          `)
          .eq("version_id", versionId);

        if (error) throw error;

        const mapResultados = (sheet: string) =>
          resultados
            ?.filter((r) => r.sheet_name === sheet)
            .map((r) => ({
              componente: r.eval_componentes.nombre,
              subcomponente: r.eval_subcomponentes.nombre,
              tema: r.eval_temas.nombre,
              aciertos_pct: r.aciertos_pct,
            })) ?? [];

        setHoja1(mapResultados("Hoja 1"));
        setHoja2(mapResultados("Hoja 2"));

        /* ---------------------------
           Tema – Asignatura
        --------------------------- */
        const { data: ta, error: taError } = await supabase
          .from("eval_tema_asignatura")
          .select(`
            eval_temas(nombre),
            eval_asignaturas(nombre)
          `)
          .eq("version_id", versionId);

        if (taError) throw taError;

        setTemaAsignatura(
          ta?.map((r) => ({
            tema: r.eval_temas.nombre,
            asignatura: r.eval_asignaturas.nombre,
          })) ?? []
        );

        /* ---------------------------
           Asignatura – Docente
        --------------------------- */
        const { data: ap, error: apError } = await supabase
          .from("eval_asignatura_profesor")
          .select(`
            tipo_profesor,
            eval_asignaturas(nombre),
            eval_profesores(nombre),
            eval_periodos(nombre)
          `)
          .eq("version_id", versionId);

        if (apError) throw apError;

        setAsignaturaProfesor(
          ap?.map((r) => ({
            asignatura: r.eval_asignaturas.nombre,
            profesor: r.eval_profesores.nombre,
            periodo: r.eval_periodos.nombre,
            tipo_profesor: r.tipo_profesor,
          })) ?? []
        );
      } catch (err) {
        console.error(err);
        toast.error("Error cargando datos del dataset");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [versionId]);

  /* ===============================
     UI Estados
  ================================ */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-xl">Cargando datos…</span>
      </div>
    );
  }

  /* ===============================
     Render
  ================================ */
  return (
    <div className="min-h-screen p-8 space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver
      </Button>

      <h1 className="text-3xl font-bold">
        Visualización tipo Excel – Versión {versionId?.slice(-6)}
      </h1>

      <Tabs defaultValue="hoja1" className="w-full">
        <TabsList>
          <TabsTrigger value="hoja1">Primera vez</TabsTrigger>
          <TabsTrigger value="hoja2">Repetidores</TabsTrigger>
          <TabsTrigger value="tema_asignatura">Tema – Asignatura</TabsTrigger>
          <TabsTrigger value="asignatura_profesor">
            Asignatura – Docente
          </TabsTrigger>
        </TabsList>

        {/* ===========================
           Hoja 1
        =========================== */}
        <TabsContent value="hoja1">
          <ResultadosTable rows={hoja1} />
        </TabsContent>

        {/* ===========================
           Hoja 2
        =========================== */}
        <TabsContent value="hoja2">
          <ResultadosTable rows={hoja2} />
        </TabsContent>

        {/* ===========================
           Tema – Asignatura
        =========================== */}
        <TabsContent value="tema_asignatura">
          <SimpleTable
            headers={["Tema", "Asignatura"]}
            rows={temaAsignatura.map((r) => [r.tema, r.asignatura])}
          />
        </TabsContent>

        {/* ===========================
           Asignatura – Docente
        =========================== */}
        <TabsContent value="asignatura_profesor">
          <SimpleTable
            headers={["Asignatura", "Docente", "Periodo", "Tipo"]}
            rows={asignaturaProfesor.map((r) => [
              r.asignatura,
              r.profesor,
              r.periodo,
              r.tipo_profesor,
            ])}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ===============================
   Subcomponentes
================================ */
function ResultadosTable({ rows }: { rows: ResultadoRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Componente</TableHead>
          <TableHead>Subcomponente</TableHead>
          <TableHead>Tema</TableHead>
          <TableHead className="text-right">Aciertos %</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r, i) => (
          <TableRow key={i}>
            <TableCell>{r.componente}</TableCell>
            <TableCell>{r.subcomponente}</TableCell>
            <TableCell>{r.tema}</TableCell>
            <TableCell className="text-right font-bold">
              {r.aciertos_pct}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SimpleTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {headers.map((h) => (
            <TableHead key={h}>{h}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, i) => (
          <TableRow key={i}>
            {row.map((cell, j) => (
              <TableCell key={j}>{cell}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
