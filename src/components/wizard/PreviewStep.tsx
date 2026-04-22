import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, ArrowRight, FileSpreadsheet } from "lucide-react";
import type { WizardData } from "@/pages/CreateVersion";

interface PreviewStepProps {
  wizardData: WizardData;
  onNext: () => void;
  onBack: () => void;
}

const getRoleLabel = (role: string | null) => {
  switch (role) {
    case "PREGUNTAS":
      return "Preguntas";
    case "INTENTOS":
      return "Intentos";
    case "IGNORAR":
      return "Ignorar";
    default:
      return "Sin definir";
  }
};

const getRoleVariant = (role: string | null) => {
  switch (role) {
    case "PREGUNTAS":
      return "default";
    case "INTENTOS":
      return "secondary";
    case "IGNORAR":
      return "outline";
    default:
      return "outline";
  }
};

const PreviewStep = ({ wizardData, onNext, onBack }: PreviewStepProps) => {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Vista previa del archivo</h2>
        <p className="text-muted-foreground">
          Se muestran los primeros 10 registros de cada hoja detectada.
        </p>
      </div>

      <div className="space-y-10">
        {wizardData.sheets.map((sheet, sheetIndex) => {
          const previewRows = sheet.rows.slice(0, 10);

          return (
            <div
              key={sheetIndex}
              className="border rounded-lg overflow-hidden bg-background"
            >
              <div className="bg-muted px-4 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2 font-semibold">
                  <FileSpreadsheet className="h-5 w-5 text-accent" />
                  <span>{sheet.sheetName}</span>
                  <Badge variant={getRoleVariant(sheet.role)}>
                    {getRoleLabel(sheet.role)}
                  </Badge>
                </div>

                <div className="text-sm text-muted-foreground flex gap-4">
                  <span>{sheet.headers.length} columnas</span>
                  <span>{sheet.rows.length} filas</span>
                </div>
              </div>

              <div className="overflow-auto max-h-[420px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary hover:bg-primary">
                      <TableHead className="text-primary-foreground font-bold w-[60px]">
                        #
                      </TableHead>
                      {sheet.headers.map((header, index) => (
                        <TableHead
                          key={index}
                          className="text-primary-foreground font-bold min-w-[180px]"
                        >
                          <div className="break-words whitespace-normal leading-tight">
                            {header}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {previewRows.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        <TableCell className="font-medium bg-muted/50 align-top">
                          {rowIndex + 1}
                        </TableCell>

                        {sheet.headers.map((_, cellIndex) => (
                          <TableCell
                            key={cellIndex}
                            className="align-top min-w-[180px]"
                          >
                            <div className="max-w-[320px] whitespace-pre-wrap break-words text-sm leading-relaxed">
                              {String(row[cellIndex] ?? "")}
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Atrás
        </Button>

        <Button onClick={onNext} className="bg-accent hover:bg-accent/90">
          Continuar
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default PreviewStep;