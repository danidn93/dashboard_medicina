import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const CreateDataset = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim()) {
      toast({
        title: "Error",
        description: "El nombre del dataset es obligatorio",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      const { error } = await supabase.from("exam_datasets").insert({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        periodo: periodo.trim() || null,
      });

      if (error) throw error;

      toast({
        title: "Dataset creado",
        description: "El dataset se creó correctamente",
      });

      navigate("/datasets");
    } catch (error: any) {
      console.error(error);

      toast({
        title: "Error al crear dataset",
        description: error.message || "No se pudo crear el dataset",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary to-secondary p-6">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/datasets")}
          className="mb-6 text-primary-foreground hover:bg-primary-foreground/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Datasets
        </Button>

        <Card className="border-0 shadow-elegant">
          <CardHeader>
            <CardTitle className="text-2xl">Crear Nuevo Dataset</CardTitle>
            <CardDescription>
              Define la información básica del dataset del examen
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre del Dataset</Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Simulador Psicométrico 2026"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  disabled={loading}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Este nombre se mostrará en la lista de datasets.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="periodo">Período (opcional)</Label>
                <Input
                  id="periodo"
                  placeholder="Ej: 2026-1"
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value)}
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  Puedes usar un período académico o una referencia temporal.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción (opcional)</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Describe el propósito de este dataset..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  disabled={loading}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Información adicional para identificar este dataset.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/datasets")}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  className="flex-1 bg-accent hover:bg-accent/90"
                  disabled={loading}
                >
                  {loading ? "Creando..." : "Crear Dataset"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateDataset;