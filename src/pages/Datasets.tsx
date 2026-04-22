import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, FolderOpen, Calendar, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ExamDataset {
  id: string;
  nombre: string;
  descripcion: string | null;
  created_at: string;
  updated_at: string;
  versionsCount: number;
}

const Datasets = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [datasets, setDatasets] = useState<ExamDataset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDatasets();
  }, []);

  const loadDatasets = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      const { data: datasetsData, error } = await supabase
        .from("exam_datasets")
        .select("id, nombre, descripcion, created_at, updated_at")
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const { data: versionsData, error: versionsError } = await supabase
        .from("exam_dataset_versions")
        .select("dataset_id, id");

      if (versionsError) throw versionsError;

      const countsMap: Record<string, number> = {};
      versionsData?.forEach((v) => {
        countsMap[v.dataset_id] = (countsMap[v.dataset_id] || 0) + 1;
      });

      const datasetsWithVersions = (datasetsData || []).map((d) => ({
        ...d,
        versionsCount: countsMap[d.id] ?? 0,
      }));

      setDatasets(datasetsWithVersions);
    } catch (error: any) {
      toast({
        title: "Error al cargar datasets",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary to-secondary flex items-center justify-center">
        <div className="text-primary-foreground text-xl">
          Cargando datasets...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary to-secondary p-6">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-primary-foreground mb-2">
                Datasets
              </h1>
              <p className="text-primary-foreground/80">
                Carga archivos Excel y gestiona versiones de evaluación
              </p>
            </div>
          </div>

          <Button
            onClick={() => navigate("/datasets/create")}
            size="lg"
            className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            Crear Dataset
          </Button>
        </div>

        {datasets.length === 0 ? (
          <Card className="border-0 shadow-elegant">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FolderOpen className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                No hay datasets
              </h3>
              <p className="text-muted-foreground mb-6">
                Comienza creando tu primer dataset de evaluación
              </p>
              <Button
                onClick={() => navigate("/datasets/create")}
                className="bg-accent hover:bg-accent/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Crear Dataset
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {datasets.map((dataset) => (
              <Card
                key={dataset.id}
                className="border-0 shadow-elegant hover:shadow-xl transition-all cursor-pointer group"
                onClick={() => navigate(`/datasets/${dataset.id}/versions`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 group-hover:text-accent transition-colors">
                    <FolderOpen className="h-5 w-5" />
                    {dataset.nombre}
                  </CardTitle>
                  {dataset.descripcion && (
                    <CardDescription>{dataset.descripcion}</CardDescription>
                  )}
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Versiones:</span>
                      <span className="font-semibold bg-accent/10 text-accent px-3 py-1 rounded-full">
                        {dataset.versionsCount}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Modificado: {new Date(dataset.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Datasets;