import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import WizardProgress from "@/components/wizard/WizardProgress";

import FileUploadStep from "@/components/wizard/FileUploadStep";
import PreviewStep from "@/components/wizard/PreviewStep";
import SheetRoleStep from "@/components/wizard/SheetRoleStep";
import ColumnSelectionStep from "@/components/wizard/ColumnSelectionStep";
import SummaryStep from "@/components/wizard/SummaryStep";

/* =========================
   STEPS
========================= */

const steps = [
  { id: 1, title: "Archivo", description: "Sube tu archivo" },
  { id: 2, title: "Vista previa", description: "Revisa las hojas" },
  { id: 3, title: "Roles", description: "Define preguntas e intentos" },
  { id: 4, title: "Columnas", description: "Mapea las columnas" },
  { id: 5, title: "Resumen", description: "Confirma e importa" },
];

/* =========================
   TIPOS
========================= */

export type SheetRole =
  | "PREGUNTAS"
  | "INTENTOS"
  | "IGNORAR"
  | null;

export interface SheetData {
  sheetName: string;
  headers: string[];
  rows: any[][];
  role: SheetRole;
  columnMap?: Record<string, string>;
}

export interface WizardData {
  file: File | null;
  sheets: SheetData[];
}

/* =========================
   COMPONENT
========================= */

const CreateVersion = () => {
  const navigate = useNavigate();
  const { datasetId } = useParams();

  const [currentStep, setCurrentStep] = useState(1);

  const [wizardData, setWizardData] = useState<WizardData>({
    file: null,
    sheets: [],
  });

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => s - 1);
    }
  };

  const updateWizardData = (data: Partial<WizardData>) => {
    setWizardData((prev) => ({ ...prev, ...data }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <FileUploadStep
            wizardData={wizardData}
            updateWizardData={updateWizardData}
            onNext={handleNext}
          />
        );

      case 2:
        return (
          <PreviewStep
            wizardData={wizardData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );

      case 3:
        return (
          <SheetRoleStep
            wizardData={wizardData}
            updateWizardData={updateWizardData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );

      case 4:
        return (
          <ColumnSelectionStep
            wizardData={wizardData}
            updateWizardData={updateWizardData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );

      case 5:
        return (
          <SummaryStep
            wizardData={wizardData}
            datasetId={datasetId || ""}
            onBack={handleBack}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary to-secondary p-6">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(`/datasets/${datasetId}/versions`)}
          className="mb-6 text-primary-foreground hover:bg-primary-foreground/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Versiones
        </Button>

        <Card className="border-0 shadow-elegant">
          <CardContent className="p-8">
            <WizardProgress steps={steps} currentStep={currentStep} />
            <div className="mt-8">{renderStep()}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreateVersion;