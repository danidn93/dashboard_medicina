import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import {
  Database,
  LogOut,
  BarChart3,
  ClipboardList,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);

      if (!session) {
        navigate("/login");
      }

      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);

      if (!session) {
        navigate("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();

      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
      });

      navigate("/login");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo cerrar sesión",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary to-secondary">
        <div className="text-primary-foreground text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary to-secondary p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between gap-6">
          <div className="text-center flex-1">
            <h1 className="text-5xl md:text-6xl font-bold text-primary-foreground mb-4">
              Sistema de Análisis y Dashboards
            </h1>

            <p className="text-xl text-primary-foreground/80">
              Carga archivos, analiza resultados, administra bancos de preguntas
              y genera visualizaciones institucionales
            </p>

            {user?.email && (
              <p className="mt-3 text-sm text-primary-foreground/70">
                Sesión iniciada como: {user.email}
              </p>
            )}
          </div>

          <Button
            variant="outline"
            onClick={handleLogout}
            className="bg-background/10 text-primary-foreground border-primary-foreground/20 hover:bg-background/20"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Salir
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* DATASETS */}
          <Card
            className="border-0 shadow-elegant hover:shadow-2xl transition-shadow cursor-pointer"
            onClick={() => navigate("/datasets")}
          >
            <CardHeader>
              <Database className="h-12 w-12 mb-4 text-primary" />

              <CardTitle className="text-2xl">Datasets</CardTitle>

              <CardDescription>
                Sube archivos Excel, gestiona versiones y genera dashboards
                institucionales a partir de los datos cargados.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Button className="w-full">Gestionar Datasets</Button>
            </CardContent>
          </Card>

          {/* TEST / BANCO DE PREGUNTAS */}
          <Card
            className="border-0 shadow-elegant hover:shadow-2xl transition-shadow cursor-pointer"
            onClick={() => navigate("/tests")}
          >
            <CardHeader>
              <ClipboardList className="h-12 w-12 mb-4 text-primary" />

              <CardTitle className="text-2xl">
                Test y Banco de Preguntas
              </CardTitle>

              <CardDescription>
                Crea cursos, registra estudiantes, administra categorías,
                subcategorías, preguntas y configura tests tipo Moodle para la PWA.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Button className="w-full">
                Gestionar Tests
              </Button>
            </CardContent>
          </Card>

          {/* INDICADORES */}
          <Card className="border-0 shadow-elegant opacity-70">
            <CardHeader>
              <BarChart3 className="h-12 w-12 mb-4 text-muted-foreground" />

              <CardTitle className="text-2xl">
                Indicadores Globales
              </CardTitle>

              <CardDescription>
                Visualización consolidada de resultados históricos y comparativos
                institucionales.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Button disabled className="w-full">
                Próximamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;