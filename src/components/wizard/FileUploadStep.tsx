import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import type { WizardData, SheetData } from "@/pages/CreateVersion";

interface FileUploadStepProps {
  wizardData: WizardData;
  updateWizardData: (data: Partial<WizardData>) => void;
  onNext: () => void;
}

const FileUploadStep = ({
  wizardData,
  updateWizardData,
  onNext,
}: FileUploadStepProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const normalizeCell = (value: unknown): string => {
    return String(value ?? "")
      .replace(/\u00A0/g, " ")
      .replace(/\r/g, "")
      .trim();
  };

  const cleanSheet = (data: unknown[][]): unknown[][] => {
    const rows = data
      .map((row) => row.map((cell) => normalizeCell(cell)))
      .filter((row) => row.some((cell) => cell !== ""));

    if (rows.length === 0) return [];

    const maxCols = Math.max(...rows.map((r) => r.length));
    const validCols: number[] = [];

    for (let i = 0; i < maxCols; i++) {
      const header = normalizeCell(rows[0]?.[i]);
      const hasDataBelow = rows.slice(1).some((r) => normalizeCell(r[i]) !== "");

      if (header !== "" && hasDataBelow) {
        validCols.push(i);
      }
    }

    return rows.map((row) => validCols.map((i) => normalizeCell(row[i])));
  };

  const buildSheetData = (sheetName: string, rawData: unknown[][]): SheetData | null => {
    const cleaned = cleanSheet(rawData);

    if (cleaned.length < 2) return null;

    return {
      sheetName,
      headers: cleaned[0].map((h) => String(h)),
      rows: cleaned.slice(1) as any[][],
      role: null,
      columnMap: {},
    };
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();

    if (!ext || !["xlsx", "xls", "csv"].includes(ext)) {
      toast({
        title: "Formato no válido",
        description: "Solo se permiten archivos XLSX, XLS o CSV.",
        variant: "destructive",
      });
      return;
    }

    try {
      const sheets: SheetData[] = [];

      if (ext === "csv") {
        const text = await file.text();

        const result = Papa.parse<string[]>(text, {
          skipEmptyLines: true,
        });

        if (result.errors?.length) {
          throw new Error(result.errors[0].message);
        }

        const sheetData = buildSheetData("CSV", result.data as unknown[][]);

        if (!sheetData) {
          throw new Error("El archivo CSV no contiene suficientes datos.");
        }

        sheets.push(sheetData);
      } else {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });

        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];

          const rawData = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
            defval: "",
            blankrows: false,
          }) as unknown[][];

          const sheetData = buildSheetData(sheetName, rawData);

          if (sheetData) {
            sheets.push(sheetData);
          }
        }
      }

      if (sheets.length === 0) {
        toast({
          title: "Archivo vacío",
          description: "No se encontraron hojas con datos válidos.",
          variant: "destructive",
        });
        return;
      }

      updateWizardData({
        file,
        sheets,
      });

      toast({
        title: "Archivo cargado",
        description: `${sheets.length} hoja(s) procesada(s) correctamente.`,
      });

      onNext();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error al procesar archivo",
        description: "No se pudo leer el archivo seleccionado.",
        variant: "destructive",
      });
    }
  };

  const handleReset = () => {
    updateWizardData({
      file: null,
      sheets: [],
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Subir archivo</h2>
        <p className="text-muted-foreground">
          Carga un archivo XLSX, XLS o CSV con hojas de preguntas e intentos.
        </p>
      </div>

      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors hover:border-accent hover:bg-accent/5"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileUpload}
          className="hidden"
        />

        <Upload className="mx-auto h-10 w-10 text-accent mb-3" />
        <p className="font-semibold">Selecciona un archivo</p>
        <p className="text-sm text-muted-foreground">XLSX, XLS o CSV</p>
      </div>

      {wizardData.file && (
        <div className="bg-muted rounded-lg p-4 flex items-center gap-3">
          <FileSpreadsheet className="h-8 w-8 text-accent" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{wizardData.file.name}</p>
            <p className="text-sm text-muted-foreground">
              {wizardData.sheets.length} hoja(s) detectada(s)
            </p>
          </div>

          <Button size="sm" variant="outline" onClick={handleReset}>
            Cambiar
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileUploadStep;