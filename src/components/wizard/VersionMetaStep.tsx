import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WizardData, VersionMeta } from "@/pages/CreateVersion";
import { useEffect, useState } from "react";

interface Props {
  wizardData: WizardData;
  updateWizardData: (data: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const emptyMeta: VersionMeta = {
  numero_estudiantes: 0,
  total_inscritos: 0,
  inscritos_primera_vez: 0,
  inscritos_n_veces: 0,
  aprobados_primera_vez: 0,
  aprobados_n_veces: 0,
  ausentes_primera_vez: 0,
  ausentes_n_veces: 0,
};

export default function VersionMetaStep({
  wizardData,
  updateWizardData,
  onNext,
  onBack,
}: Props) {
  const [meta, setMeta] = useState<VersionMeta>(
    wizardData.meta ?? emptyMeta
  );

  // 🔹 Calcular automáticamente numero_estudiantes
  useEffect(() => {
    const total =
      meta.aprobados_primera_vez + meta.aprobados_n_veces;
    setMeta((m) => ({ ...m, numero_estudiantes: total }));
  }, [meta.aprobados_primera_vez, meta.aprobados_n_veces]);

  const handleChange = (key: keyof VersionMeta, value: number) => {
    setMeta((m) => ({ ...m, [key]: value }));
  };

  const canContinue =
    meta.total_inscritos >= 0 &&
    meta.inscritos_primera_vez >= 0 &&
    meta.inscritos_n_veces >= 0 &&
    meta.aprobados_primera_vez >= 0 &&
    meta.aprobados_n_veces >= 0 &&
    meta.ausentes_primera_vez >= 0 &&
    meta.ausentes_n_veces >= 0;

  return (
    <Card className="p-6 space-y-6">
      <h2 className="text-xl font-semibold">
        Metadatos de la Evaluación
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field
          label="Total inscritos"
          value={meta.total_inscritos}
          onChange={(v) => handleChange("total_inscritos", v)}
        />
        <Field
          label="Inscritos primera vez"
          value={meta.inscritos_primera_vez}
          onChange={(v) => handleChange("inscritos_primera_vez", v)}
        />
        <Field
          label="Inscritos n veces"
          value={meta.inscritos_n_veces}
          onChange={(v) => handleChange("inscritos_n_veces", v)}
        />
        <Field
          label="Aprobados primera vez"
          value={meta.aprobados_primera_vez}
          onChange={(v) => handleChange("aprobados_primera_vez", v)}
        />
        <Field
          label="Aprobados n veces"
          value={meta.aprobados_n_veces}
          onChange={(v) => handleChange("aprobados_n_veces", v)}
        />
        <Field
          label="Ausentes primera vez"
          value={meta.ausentes_primera_vez}
          onChange={(v) => handleChange("ausentes_primera_vez", v)}
        />
        <Field
          label="Ausentes n veces"
          value={meta.ausentes_n_veces}
          onChange={(v) => handleChange("ausentes_n_veces", v)}
        />

        {/* SOLO LECTURA */}
        <div>
          <Label>Número total de estudiantes</Label>
          <Input
            type="number"
            value={meta.numero_estudiantes}
            disabled
          />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Atrás
        </Button>
        <Button
          onClick={() => {
            updateWizardData({ meta });
            onNext();
          }}
          disabled={!canContinue}
        >
          Continuar
        </Button>
      </div>
    </Card>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
