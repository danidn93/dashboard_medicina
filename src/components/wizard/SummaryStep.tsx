import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, FileSpreadsheet, Layers } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import type { WizardData } from "@/pages/CreateVersion";
import ConfirmationModal from "./ConfirmationModal";

interface SummaryStepProps {
  wizardData: WizardData;
  onBack: () => void;
  datasetId: string;
}

const ROLE_LABELS: Record<string, string> = {
  PREGUNTAS: "Banco de preguntas",
  INTENTOS: "Intentos / respuestas de estudiantes",
};

const BATCH_SIZE = 200;

const normalizeText = (value: unknown): string =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/\r/g, "")
    .replace(/[•·▪◦]/g, "")
    .replace(/^\s*[-–—]\s*/gm, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getCellValue = (
  row: any[],
  headers: string[],
  columnMap: Record<string, string> | undefined,
  key: string
): string => {
  const columnName = columnMap?.[key];
  if (!columnName) return "";

  const index = headers.indexOf(columnName);
  if (index === -1) return "";

  return String(row[index] ?? "").trim();
};

const detectResponseColumns = (headers: string[]) => {
  return headers
    .map((header) => {
      const match = normalizeText(header).match(/^respuesta\s*(\d+)$/);
      if (!match) return null;

      return {
        header,
        questionNumber: Number(match[1]),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a!.questionNumber - b!.questionNumber) as {
    header: string;
    questionNumber: number;
  }[];
};

const splitQuestionAndOptions = (preguntaRaw: string) => {
  const raw = String(preguntaRaw ?? "").replace(/\r/g, "").trim();

  if (!raw) {
    return {
      enunciado: "",
      opciones: [] as string[],
    };
  }

  const parts = raw.split(/respuestas\s*:/i);
  const enunciado = parts[0]?.trim() ?? raw;

  if (parts.length < 2) {
    return {
      enunciado,
      opciones: [],
    };
  }

  const optionsBlock = parts.slice(1).join("\n").trim();

  let opciones = optionsBlock
    .split("\n")
    .map((line) =>
      line
        .replace(/^\s*[-–—•·▪◦]\s*/, "")
        .trim()
    )
    .filter(Boolean);

  if (opciones.length <= 1) {
    opciones = optionsBlock
      .split(/\s(?=[-–—•·▪◦]\s)/)
      .map((line) =>
        line
          .replace(/^\s*[-–—•·▪◦]\s*/, "")
          .trim()
      )
      .filter(Boolean);
  }

  return {
    enunciado,
    opciones,
  };
};

const findCorrectOptionIndex = (
  respuestaCorrecta: string,
  opciones: string[]
): number | null => {
  const normalizedCorrect = normalizeText(respuestaCorrecta);

  if (!normalizedCorrect || opciones.length === 0) return null;

  if (/^[a-z]$/.test(normalizedCorrect)) {
    const idx = normalizedCorrect.charCodeAt(0) - 97;
    return idx >= 0 && idx < opciones.length ? idx : null;
  }

  if (/^\d+$/.test(normalizedCorrect)) {
    const idx = Number(normalizedCorrect) - 1;
    return idx >= 0 && idx < opciones.length ? idx : null;
  }

  const exactIndex = opciones.findIndex(
    (op) => normalizeText(op) === normalizedCorrect
  );
  if (exactIndex >= 0) return exactIndex;

  const containsIndex = opciones.findIndex((op) => {
    const normalizedOption = normalizeText(op);
    return (
      normalizedOption.includes(normalizedCorrect) ||
      normalizedCorrect.includes(normalizedOption)
    );
  });
  if (containsIndex >= 0) return containsIndex;

  return null;
};

const chunkArray = <T,>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
};

const excelSerialToISO = (serial: number): string | null => {
  if (!Number.isFinite(serial)) return null;

  const excelEpoch = new Date(Date.UTC(1899, 11, 30));
  const ms = serial * 24 * 60 * 60 * 1000;
  const date = new Date(excelEpoch.getTime() + ms);

  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
};

const parseSpanishDateToISO = (value: string): string | null => {
  const text = String(value ?? "").trim().toLowerCase();
  if (!text) return null;

  const months: Record<string, number> = {
    enero: 0,
    febrero: 1,
    marzo: 2,
    abril: 3,
    mayo: 4,
    junio: 5,
    julio: 6,
    agosto: 7,
    septiembre: 8,
    setiembre: 8,
    octubre: 9,
    noviembre: 10,
    diciembre: 11,
  };

  const match = text.match(
    /^(\d{1,2})\s+de\s+([a-záéíóú]+)\s+de\s+(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );

  if (!match) return null;

  const day = Number(match[1]);
  const monthName = match[2]
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const year = Number(match[3]);
  const hour = Number(match[4] ?? 0);
  const minute = Number(match[5] ?? 0);
  const second = Number(match[6] ?? 0);

  const month = months[monthName];
  if (month === undefined) return null;

  const date = new Date(year, month, day, hour, minute, second);

  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
};

const parseAnyDateToISO = (value: unknown): string | null => {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "number") {
    return excelSerialToISO(value);
  }

  const raw = String(value).trim();
  if (!raw) return null;

  const numeric = Number(raw);
  if (!Number.isNaN(numeric) && /^\d+(\.\d+)?$/.test(raw)) {
    return excelSerialToISO(numeric);
  }

  const spanishParsed = parseSpanishDateToISO(raw);
  if (spanishParsed) return spanishParsed;

  const nativeDate = new Date(raw);
  if (!Number.isNaN(nativeDate.getTime())) {
    return nativeDate.toISOString();
  }

  return null;
};

const parseDurationToSeconds = (value: unknown): number | null => {
  const text = String(value ?? "").trim().toLowerCase();
  if (!text) return null;

  let total = 0;

  const horas = text.match(/(\d+)\s*hora/);
  const minutos = text.match(/(\d+)\s*minuto/);
  const segundos = text.match(/(\d+)\s*segundo/);

  if (horas) total += Number(horas[1]) * 3600;
  if (minutos) total += Number(minutos[1]) * 60;
  if (segundos) total += Number(segundos[1]);

  return total > 0 ? total : null;
};

const findCorrectAnswersRow = (rows: any[][]): any[] | null => {
  const target = "respuesta correcta";

  for (const row of rows) {
    const hasMarker = row.some(
      (cell) => normalizeText(cell) === target
    );
    if (hasMarker) return row;
  }

  return null;
};

const isCorrectAnswersRow = (row: any[]): boolean => {
  return row.some((cell) => normalizeText(cell) === "respuesta correcta");
};

const SummaryStep = ({ wizardData, onBack, datasetId }: SummaryStepProps) => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const usableSheets = useMemo(
    () => wizardData.sheets.filter((s) => s.role && s.role !== "IGNORAR"),
    [wizardData.sheets]
  );

  const handleCreate = async () => {
    setIsProcessing(true);

    try {
      const questionsSheets = usableSheets.filter((s) => s.role === "PREGUNTAS");
      const attemptsSheets = usableSheets.filter((s) => s.role === "INTENTOS");

      if (questionsSheets.length === 0 || attemptsSheets.length === 0) {
        throw new Error(
          'Debes tener al menos una hoja "PREGUNTAS" y una hoja "INTENTOS".'
        );
      }

      const { data: lastVersionData, error: lastVersionError } = await supabase
        .from("exam_dataset_versions")
        .select("version_number")
        .eq("dataset_id", datasetId)
        .order("version_number", { ascending: false })
        .limit(1);

      if (lastVersionError) throw lastVersionError;

      const nextVersionNumber =
        (lastVersionData?.[0]?.version_number ?? 0) + 1;

      const { data: versionData, error: versionError } = await supabase
        .from("exam_dataset_versions")
        .insert({
          dataset_id: datasetId,
          version_number: nextVersionNumber,
          file_name: wizardData.file?.name ?? null,
          total_preguntas: 0,
          total_intentos: 0,
        })
        .select("id")
        .single();

      if (versionError) throw versionError;

      const versionId = versionData.id as string;

      const allQuestionRowsPrepared = questionsSheets.flatMap((questionsSheet) => {
        return questionsSheet.rows.map((row) => {
          const numeroPregunta = Number(
            getCellValue(
              row,
              questionsSheet.headers,
              questionsSheet.columnMap,
              "NUMERO_PREGUNTA"
            )
          );

          const preguntaRaw = getCellValue(
            row,
            questionsSheet.headers,
            questionsSheet.columnMap,
            "PREGUNTA_RAW"
          );

          const respuestaCorrecta = getCellValue(
            row,
            questionsSheet.headers,
            questionsSheet.columnMap,
            "RESPUESTA_CORRECTA"
          );

          const componente = getCellValue(
            row,
            questionsSheet.headers,
            questionsSheet.columnMap,
            "COMPONENTE"
          );

          const subcomponente = getCellValue(
            row,
            questionsSheet.headers,
            questionsSheet.columnMap,
            "SUBCOMPONENTE"
          );

          const tema = getCellValue(
            row,
            questionsSheet.headers,
            questionsSheet.columnMap,
            "TEMA"
          );

          const nivel = getCellValue(
            row,
            questionsSheet.headers,
            questionsSheet.columnMap,
            "NIVEL"
          );

          const asignatura = getCellValue(
            row,
            questionsSheet.headers,
            questionsSheet.columnMap,
            "ASIGNATURA"
          );

          const docente = getCellValue(
            row,
            questionsSheet.headers,
            questionsSheet.columnMap,
            "DOCENTE"
          );

          const justificacion = getCellValue(
            row,
            questionsSheet.headers,
            questionsSheet.columnMap,
            "JUSTIFICACION"
          );

          const { enunciado, opciones } = splitQuestionAndOptions(preguntaRaw);
          const correctIndex = findCorrectOptionIndex(respuestaCorrecta, opciones);

          return {
            id: crypto.randomUUID(),
            version_id: versionId,
            numero_pregunta: numeroPregunta,
            pregunta_raw: preguntaRaw,
            enunciado: enunciado || null,
            componente: componente || null,
            subcomponente: subcomponente || null,
            tema: tema || null,

            // Si tu mapeo usa ASIGNATURA como equivalente de NIVEL:
            nivel: nivel || asignatura || null,

            docente: docente || null,
            justificacion: justificacion || null,
            tipo_pregunta: "opcion_multiple",
            respuesta_correcta_texto: respuestaCorrecta || null,
            opciones: opciones.map((texto, index) => ({
              id: crypto.randomUUID(),
              pregunta_id: "" as string,
              orden: index + 1,
              texto,
              es_correcta: correctIndex === index,
            })),
          };
        });
      });

      const validQuestions = allQuestionRowsPrepared.filter(
        (q) => q.numero_pregunta > 0 && q.pregunta_raw
      );

      if (validQuestions.length === 0) {
        throw new Error("No se encontraron preguntas válidas para importar.");
      }

      for (const chunk of chunkArray(validQuestions, BATCH_SIZE)) {
        const payload = chunk.map(
          ({ opciones, respuesta_correcta_texto, ...question }) => question
        );

        const { error } = await supabase.from("preguntas").insert(payload);
        if (error) throw error;
      }

      const optionsPayload = validQuestions.flatMap((q) =>
        q.opciones.map((op) => ({
          ...op,
          pregunta_id: q.id,
        }))
      );

      for (const chunk of chunkArray(optionsPayload, BATCH_SIZE)) {
        const { error } = await supabase.from("pregunta_opciones").insert(chunk);
        if (error) throw error;
      }

      const questionMapByNumber = new Map<
        number,
        {
          id: string;
          numero_pregunta: number;
          respuestaCorrectaBanco: string | null;
          opciones: {
            id: string;
            orden: number;
            texto: string;
            es_correcta: boolean;
          }[];
        }
      >();

      validQuestions.forEach((q) => {
        questionMapByNumber.set(q.numero_pregunta, {
          id: q.id,
          numero_pregunta: q.numero_pregunta,
          respuestaCorrectaBanco: q.respuesta_correcta_texto,
          opciones: q.opciones.map((o) => ({
            ...o,
            pregunta_id: q.id,
          })),
        });
      });

      const allValidAttempts: Array<any> = [];
      const allAttemptResponsesPayload: Array<any> = [];

      for (const attemptsSheet of attemptsSheets) {
        const correctAnswersRow = findCorrectAnswersRow(attemptsSheet.rows);

        if (!correctAnswersRow) {
          throw new Error(
            `No se encontró la fila "RESPUESTA CORRECTA" en la hoja "${attemptsSheet.sheetName}".`
          );
        }

        const studentRows = attemptsSheet.rows.filter(
          (row) => !isCorrectAnswersRow(row)
        );

        const responseColumns = detectResponseColumns(attemptsSheet.headers);

        const preparedAttempts = studentRows.map((row) => {
          const comenzadoRaw = getCellValue(
            row,
            attemptsSheet.headers,
            attemptsSheet.columnMap,
            "COMENZADO_EL"
          );

          const finalizadoRaw = getCellValue(
            row,
            attemptsSheet.headers,
            attemptsSheet.columnMap,
            "FINALIZADO_EL"
          );

          const tiempoRequeridoRaw = getCellValue(
            row,
            attemptsSheet.headers,
            attemptsSheet.columnMap,
            "TIEMPO_REQUERIDO_TEXTO"
          );

          return {
            id: crypto.randomUUID(),
            version_id: versionId,
            apellidos: getCellValue(
              row,
              attemptsSheet.headers,
              attemptsSheet.columnMap,
              "APELLIDOS"
            ),
            nombres: getCellValue(
              row,
              attemptsSheet.headers,
              attemptsSheet.columnMap,
              "NOMBRES"
            ),
            correo:
              getCellValue(
                row,
                attemptsSheet.headers,
                attemptsSheet.columnMap,
                "CORREO"
              ) || null,
            estado:
              getCellValue(
                row,
                attemptsSheet.headers,
                attemptsSheet.columnMap,
                "ESTADO"
              ) || null,
            comenzado_el: parseAnyDateToISO(comenzadoRaw),
            finalizado_el: parseAnyDateToISO(finalizadoRaw),
            tiempo_requerido_texto: tiempoRequeridoRaw || null,
            tiempo_requerido_segundos: parseDurationToSeconds(tiempoRequeridoRaw),
            calificacion_total: (() => {
              const value = getCellValue(
                row,
                attemptsSheet.headers,
                attemptsSheet.columnMap,
                "CALIFICACION_TOTAL"
              );
              const n = Number(String(value).replace(",", "."));
              return Number.isFinite(n) ? n : null;
            })(),

            // ✅ Esto era lo que faltaba para guardar public.intentos.nivel
            nivel:
              getCellValue(
                row,
                attemptsSheet.headers,
                attemptsSheet.columnMap,
                "NIVEL"
              ) || null,

            rawRow: row,
            headers: attemptsSheet.headers,
            correctAnswersRow,
            responseColumns,
          };
        });

        const validAttempts = preparedAttempts.filter(
          (a) => a.apellidos && a.nombres
        );

        allValidAttempts.push(...validAttempts);

        const attemptResponsesPayload = validAttempts.flatMap((attempt) => {
          return attempt.responseColumns.flatMap((responseCol: any) => {
            const questionRef = questionMapByNumber.get(
              responseCol.questionNumber
            );

            if (!questionRef) return [];

            const colIndex = attempt.headers.indexOf(responseCol.header);
            if (colIndex === -1) return [];

            const respuestaRaw = String(attempt.rawRow[colIndex] ?? "").trim();
            const respuestaNormalizada = normalizeText(respuestaRaw);

            const respuestaCorrectaRaw = String(
              attempt.correctAnswersRow[colIndex] ?? ""
            ).trim();

            const respuestaCorrectaNormalizada =
              normalizeText(respuestaCorrectaRaw);

            let matchedOption:
              | {
                  id: string;
                  orden: number;
                  texto: string;
                  es_correcta: boolean;
                }
              | null = null;

            if (/^[a-z]$/.test(respuestaNormalizada)) {
              const index = respuestaNormalizada.charCodeAt(0) - 97;
              matchedOption = questionRef.opciones[index] || null;
            } else if (/^\d+$/.test(respuestaNormalizada)) {
              const index = Number(respuestaNormalizada) - 1;
              matchedOption = questionRef.opciones[index] || null;
            }

            if (!matchedOption) {
              matchedOption =
                questionRef.opciones.find(
                  (op) => normalizeText(op.texto) === respuestaNormalizada
                ) || null;
            }

            if (!matchedOption && respuestaNormalizada.length > 2) {
              matchedOption =
                questionRef.opciones.find((op) => {
                  const normalizedOption = normalizeText(op.texto);
                  return (
                    normalizedOption.includes(respuestaNormalizada) ||
                    respuestaNormalizada.includes(normalizedOption)
                  );
                }) || null;
            }

            const normalizedCorrectFromBank = normalizeText(
              questionRef.respuestaCorrectaBanco ?? ""
            );

            const esCorrecta =
              !!respuestaNormalizada &&
              (respuestaNormalizada === respuestaCorrectaNormalizada ||
                respuestaNormalizada === normalizedCorrectFromBank ||
                (respuestaCorrectaNormalizada &&
                  (respuestaCorrectaNormalizada.includes(
                    respuestaNormalizada
                  ) ||
                    respuestaNormalizada.includes(
                      respuestaCorrectaNormalizada
                    ))) ||
                (normalizedCorrectFromBank &&
                  (normalizedCorrectFromBank.includes(respuestaNormalizada) ||
                    respuestaNormalizada.includes(normalizedCorrectFromBank))));

            return [
              {
                id: crypto.randomUUID(),
                intento_id: attempt.id,
                pregunta_id: questionRef.id,
                opcion_id: matchedOption?.id ?? null,
                respuesta_estudiante_raw: respuestaRaw || null,
                respuesta_estudiante_normalizada: respuestaNormalizada || null,
                es_correcta: esCorrecta,
                puntaje_obtenido: esCorrecta ? 1 : 0,
              },
            ];
          });
        });

        allAttemptResponsesPayload.push(...attemptResponsesPayload);
      }

      if (allValidAttempts.length === 0) {
        throw new Error("No se encontraron intentos válidos para importar.");
      }

      for (const chunk of chunkArray(allValidAttempts, BATCH_SIZE)) {
        const payload = chunk.map(
          ({
            rawRow,
            headers,
            correctAnswersRow,
            responseColumns,
            ...attempt
          }) => attempt
        );

        const { error } = await supabase.from("intentos").insert(payload);
        if (error) throw error;
      }

      for (const chunk of chunkArray(allAttemptResponsesPayload, BATCH_SIZE)) {
        const { error } = await supabase
          .from("intento_respuestas")
          .insert(chunk);

        if (error) throw error;
      }

      const { error: updateVersionError } = await supabase
        .from("exam_dataset_versions")
        .update({
          total_preguntas: validQuestions.length,
          total_intentos: allValidAttempts.length,
        })
        .eq("id", versionId);

      if (updateVersionError) throw updateVersionError;

      toast.success("Versión creada e importada correctamente");
      navigate(`/datasets/${datasetId}/versions`);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Error al crear la versión");
    } finally {
      setIsProcessing(false);
      setShowModal(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">
          Resumen de la configuración
        </h2>
        <p className="text-muted-foreground">
          Revisa las hojas y el mapeo antes de crear la versión.
        </p>
      </div>

      <Card className="border-primary/20 max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-accent" />
            Archivo
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Nombre:</span>
            <span className="font-semibold text-right">
              {wizardData.file?.name}
            </span>
          </div>

          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Hojas útiles:</span>
            <span className="font-semibold">{usableSheets.length}</span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4 max-w-3xl mx-auto">
        {usableSheets.map((sheet, idx) => (
          <Card key={idx} className="border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Layers className="h-5 w-5 text-accent" />
                {sheet.sheetName}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Rol:</span>
                <span className="font-semibold">
                  {ROLE_LABELS[sheet.role!]}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Filas:</span>
                <span className="font-semibold">{sheet.rows.length}</span>
              </div>

              <div className="pt-2">
                <p className="text-muted-foreground mb-1">
                  Mapeo de columnas:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  {sheet.columnMap &&
                    Object.entries(sheet.columnMap).map(([key, value]) => (
                      <li key={key}>
                        <strong>{key}:</strong> {value}
                      </li>
                    ))}
                </ul>
              </div>

              {sheet.role === "INTENTOS" && (
                <div className="pt-2">
                  <p className="text-muted-foreground mb-1">
                    Columnas de respuestas detectadas:
                  </p>
                  <p className="font-semibold">
                    {detectResponseColumns(sheet.headers).length}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between pt-4 max-w-3xl mx-auto">
        <Button variant="outline" onClick={onBack} disabled={isProcessing}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Atrás
        </Button>

        <Button
          onClick={() => setShowModal(true)}
          className="bg-success hover:bg-success/90"
          disabled={isProcessing}
        >
          Crear Versión
        </Button>
      </div>

      <ConfirmationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleCreate}
        title="Confirmar creación de versión"
        description="Se creará una nueva versión usando la estructura configurada."
      />
    </div>
  );
};

export default SummaryStep;