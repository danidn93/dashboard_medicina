import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ArrowRight, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { WizardData, SheetRole } from "@/pages/CreateVersion";

interface SheetRoleStepProps {
  wizardData: WizardData;
  updateWizardData: (data: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const ROLE_LABELS: Record<Exclude<SheetRole, null>, string> = {
  PREGUNTAS: "Banco de preguntas",
  INTENTOS: "Intentos / respuestas de estudiantes",
  IGNORAR: "Ignorar esta hoja",
};

const detectSuggestedRole = (headers: string[]): SheetRole => {
  const normalizedHeaders = headers.map((h) => h.trim().toLowerCase());

  const hasPreguntaHeaders =
    normalizedHeaders.includes("pregunta") ||
    normalizedHeaders.includes("respuesta correcta") ||
    normalizedHeaders.includes("n°") ||
    normalizedHeaders.includes("nº");

  const hasIntentoHeaders =
    normalizedHeaders.includes("apellido(s)") ||
    normalizedHeaders.includes("nombre") ||
    normalizedHeaders.includes("dirección de correo") ||
    normalizedHeaders.some((h) => h.startsWith("respuesta 1"));

  if (hasPreguntaHeaders) return "PREGUNTAS";
  if (hasIntentoHeaders) return "INTENTOS";
  return null;
};

const SheetRoleStep = ({
  wizardData,
  updateWizardData,
  onNext,
  onBack,
}: SheetRoleStepProps) => {
  const { toast } = useToast();

  const updateRole = (index: number, role: SheetRole) => {
    const updatedSheets = wizardData.sheets.map((sheet, i) =>
      i === index ? { ...sheet, role } : sheet
    );

    updateWizardData({ sheets: updatedSheets });
  };

  const autoAssignRoles = () => {
    const updatedSheets = wizardData.sheets.map((sheet) => ({
      ...sheet,
      role: sheet.role ?? detectSuggestedRole(sheet.headers),
    }));

    updateWizardData({ sheets: updatedSheets });

    toast({
      title: "Sugerencias aplicadas",
      description: "Se asignaron roles sugeridos según los encabezados detectados.",
    });
  };

  const handleContinue = () => {
    const sheets = wizardData.sheets;

    const unassigned = sheets.filter((s) => !s.role);
    if (unassigned.length > 0) {
      toast({
        title: "Faltan asignar roles",
        description: "Todas las hojas deben tener un rol asignado.",
        variant: "destructive",
      });
      return;
    }

    const usable = sheets.filter((s) => s.role !== "IGNORAR");
    if (usable.length === 0) {
      toast({
        title: "No hay hojas válidas",
        description: "Debes seleccionar al menos una hoja útil.",
        variant: "destructive",
      });
      return;
    }

    const preguntasSheets = sheets.filter((s) => s.role === "PREGUNTAS");
    const intentosSheets = sheets.filter((s) => s.role === "INTENTOS");

    if (preguntasSheets.length !== 1) {
      toast({
        title: "Hoja de preguntas inválida",
        description: "Debes seleccionar exactamente una hoja como banco de preguntas.",
        variant: "destructive",
      });
      return;
    }

    if (intentosSheets.length !== 1) {
      toast({
        title: "Hoja de intentos inválida",
        description: "Debes seleccionar exactamente una hoja como intentos de estudiantes.",
        variant: "destructive",
      });
      return;
    }

    onNext();
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Definir rol de cada hoja</h2>
        <p className="text-muted-foreground">
          Indica qué hoja corresponde al banco de preguntas y cuál a los intentos.
        </p>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={autoAssignRoles}>
          Sugerir roles automáticamente
        </Button>
      </div>

      <div className="space-y-4">
        {wizardData.sheets.map((sheet, index) => (
          <Card key={index} className="border">
            <CardHeader className="flex flex-row items-center gap-3">
              <FileSpreadsheet className="h-6 w-6 text-accent" />
              <CardTitle className="text-lg">{sheet.sheetName}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">
                {sheet.rows.length} filas • {sheet.headers.length} columnas
              </div>

              <div className="text-xs text-muted-foreground">
                Encabezados detectados:{" "}
                {sheet.headers.slice(0, 6).join(" • ")}
                {sheet.headers.length > 6 ? " ..." : ""}
              </div>

              <Select
                value={sheet.role ?? ""}
                onValueChange={(value) => updateRole(index, value as SheetRole)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona el rol de esta hoja" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Atrás
        </Button>

        <Button
          onClick={handleContinue}
          className="bg-accent hover:bg-accent/90"
        >
          Continuar
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default SheetRoleStep;