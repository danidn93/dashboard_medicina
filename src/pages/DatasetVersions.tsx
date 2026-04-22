import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  FileText,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";

interface ExamDatasetVersion {
  id: string;
  version_number: number;
  file_name: string | null;
  created_at: string;
  total_preguntas: number | null;
  total_intentos: number | null;
}

const Metric = ({
  label,
  value,
}: {
  label: string;
  value?: number | null;
}) => (
  <div>
    <span className="text-muted-foreground">{label}</span>
    <p className="font-semibold text-lg">
      {(value ?? 0).toLocaleString()}
    </p>
  </div>
);

const DatasetVersions = () => {
  const navigate = useNavigate();
  const { datasetId } = useParams();

  const [versions, setVersions] = useState<ExamDatasetVersion[]>([]);
  const [datasetName, setDatasetName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!datasetId) return;
    loadVersions();
  }, [datasetId]);

  const loadVersions = async () => {
    try {
      setLoading(true);

      const { data: datasetData, error: datasetError } = await supabase
        .from("exam_datasets")
        .select("nombre")
        .eq("id", datasetId)
        .single();

      if (datasetError) throw datasetError;
      setDatasetName(datasetData.nombre);

      const { data, error } = await supabase
        .from("exam_dataset_versions")
        .select(`
          id,
          version_number,
          file_name,
          created_at,
          total_preguntas,
          total_intentos
        `)
        .eq("dataset_id", datasetId)
        .order("version_number", { ascending: false });

      if (error) throw error;
      setVersions(data || []);
    } catch (e: any) {
      toast.error(e.message || "Error al cargar versiones");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary to-secondary flex items-center justify-center">
        <div className="text-primary-foreground text-xl">
          Cargando versiones...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary to-secondary p-6">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/datasets")}
          className="mb-6 text-primary-foreground hover:bg-primary-foreground/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Datasets
        </Button>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary-foreground mb-2">
              Versiones del Dataset
            </h1>
            <p className="text-primary-foreground/80">{datasetName}</p>
          </div>

          <Button
            onClick={() => navigate(`/datasets/${datasetId}/versions/create`)}
            size="lg"
            className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            Nueva Versión
          </Button>
        </div>

        <div className="space-y-4">
          {versions.map((v) => (
            <Card
              key={v.id}
              className="border-0 shadow-elegant hover:shadow-xl transition-all"
            >
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-accent">
                        v{v.version_number}
                      </span>
                      <Badge className="bg-success">Lista</Badge>
                    </CardTitle>

                    <CardDescription className="flex items-center gap-2 mt-2">
                      <FileText className="h-4 w-4" />
                      {v.file_name || "Archivo sin nombre"}
                    </CardDescription>

                    <p className="text-xs text-muted-foreground mt-2">
                      Cargado el{" "}
                      {new Date(v.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() =>
                        navigate(`/datasets/${datasetId}/versions/${v.id}/dashboard`)
                      }
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Dashboard
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-2 gap-4 text-sm">
                  <Metric label="Preguntas" value={v.total_preguntas} />
                  <Metric label="Intentos" value={v.total_intentos} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {versions.length === 0 && (
          <Card className="border-0 shadow-elegant mt-10">
            <CardContent className="flex flex-col items-center py-16">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                No hay versiones
              </h3>
              <p className="text-muted-foreground mb-6">
                Crea la primera versión del dataset
              </p>
              <Button
                onClick={() => navigate(`/datasets/${datasetId}/versions/create`)}
                className="bg-accent hover:bg-accent/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nueva Versión
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DatasetVersions;