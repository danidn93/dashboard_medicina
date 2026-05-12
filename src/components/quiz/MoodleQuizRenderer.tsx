import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";

export type MoodleQuestionOption = {
  id: string;
  texto: string;
  orden?: number;
  es_correcta?: boolean;
};

export type MoodleQuestion = {
  id: string;
  orden: number;
  tipo: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_TEXT";
  enunciado: string;
  puntaje: number;
  options: MoodleQuestionOption[];
};

type AnswerValue = string | string[];

type Props = {
  title: string;
  subtitle?: string;
  questions: MoodleQuestion[];
  navigationMode?: "NAVIGABLE" | "SECUENCIAL";
  readOnly?: boolean;
  simulateGrade?: boolean;
  onSaveAnswer?: (
    question: MoodleQuestion,
    value: AnswerValue,
    rawText?: string
  ) => Promise<void> | void;
  onFinish?: (result?: {
    score: number;
    total: number;
    percent: number;
    correct: number;
    totalQuestions: number;
  }) => Promise<void> | void;
};

export default function MoodleQuizRenderer({
  title,
  subtitle,
  questions,
  navigationMode = "NAVIGABLE",
  readOnly = false,
  simulateGrade = false,
  onSaveAnswer,
  onFinish,
}: Props) {
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finished, setFinished] = useState(false);

  const currentQuestion = questions[currentIndex];

  const visibleQuestions =
    navigationMode === "SECUENCIAL" && !finished
      ? currentQuestion
        ? [currentQuestion]
        : []
      : questions;

  const isAnswered = (questionId: string) => {
    const value = answers[questionId];
    if (Array.isArray(value)) return value.length > 0;
    return Boolean(value);
  };

  const isSelected = (questionId: string, optionId: string) => {
    const value = answers[questionId];
    if (Array.isArray(value)) return value.includes(optionId);
    return value === optionId;
  };

  const setOptionAnswer = async (question: MoodleQuestion, optionId: string) => {
    if (readOnly || finished) return;

    let next: AnswerValue;

    if (question.tipo === "MULTIPLE_CHOICE") {
      const current = Array.isArray(answers[question.id])
        ? (answers[question.id] as string[])
        : [];

      next = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
    } else {
      next = optionId;
    }

    setAnswers((prev) => ({ ...prev, [question.id]: next }));
    await onSaveAnswer?.(question, next);
  };

  const setTextAnswer = async (question: MoodleQuestion, value: string) => {
    if (readOnly || finished) return;

    setAnswers((prev) => ({ ...prev, [question.id]: value }));
    await onSaveAnswer?.(question, value, value);
  };

  const grade = useMemo(() => {
    let score = 0;
    let total = 0;
    let correct = 0;

    for (const question of questions) {
      total += Number(question.puntaje || 0);

      if (question.tipo === "SHORT_TEXT") continue;

      const selected = answers[question.id];
      const correctIds = question.options
        .filter((opt) => opt.es_correcta)
        .map((opt) => opt.id)
        .sort();

      let isCorrect = false;

      if (question.tipo === "MULTIPLE_CHOICE") {
        const selectedIds = Array.isArray(selected)
          ? [...selected].sort()
          : [];

        isCorrect =
          selectedIds.length === correctIds.length &&
          selectedIds.every((id, index) => id === correctIds[index]);
      } else {
        isCorrect =
          typeof selected === "string" &&
          correctIds.length === 1 &&
          selected === correctIds[0];
      }

      if (isCorrect) {
        score += Number(question.puntaje || 0);
        correct++;
      }
    }

    const percent = total > 0 ? Number(((score / total) * 100).toFixed(2)) : 0;

    return {
      score: Number(score.toFixed(2)),
      total: Number(total.toFixed(2)),
      percent,
      correct,
      totalQuestions: questions.length,
    };
  }, [answers, questions]);

  const finish = async () => {
    setFinished(true);
    await onFinish?.(simulateGrade ? grade : undefined);
  };

  const showResultForQuestion = (question: MoodleQuestion) => {
    if (!finished || !simulateGrade || question.tipo === "SHORT_TEXT") return null;

    const selected = answers[question.id];
    const correctIds = question.options
      .filter((opt) => opt.es_correcta)
      .map((opt) => opt.id)
      .sort();

    let isCorrect = false;

    if (question.tipo === "MULTIPLE_CHOICE") {
      const selectedIds = Array.isArray(selected) ? [...selected].sort() : [];
      isCorrect =
        selectedIds.length === correctIds.length &&
        selectedIds.every((id, index) => id === correctIds[index]);
    } else {
      isCorrect = typeof selected === "string" && selected === correctIds[0];
    }

    return (
      <div
        className={`mt-4 rounded-md border p-3 text-sm ${
          isCorrect
            ? "border-green-200 bg-green-50 text-green-700"
            : "border-red-200 bg-red-50 text-red-700"
        }`}
      >
        {isCorrect ? (
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Respuesta correcta
          </span>
        ) : (
          <span className="inline-flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Respuesta incorrecta
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="bg-[#f5f5f5] border rounded-lg overflow-hidden">
      <div className="bg-white border-b px-5 py-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      {finished && simulateGrade && (
        <div className="bg-white border-b p-4">
          <Card className="p-4">
            <h3 className="font-semibold text-lg">Calificación simulada</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Esta calificación no se guardó en la base de datos.
            </p>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="rounded-md border p-3">
                <div className="text-muted-foreground">Puntaje</div>
                <div className="text-2xl font-bold">
                  {grade.score}/{grade.total}
                </div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-muted-foreground">Porcentaje</div>
                <div className="text-2xl font-bold">{grade.percent}%</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-muted-foreground">Correctas</div>
                <div className="text-2xl font-bold">
                  {grade.correct}/{grade.totalQuestions}
                </div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-muted-foreground">Estado</div>
                <div className="text-2xl font-bold">Simulado</div>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_260px] gap-4 p-4">
        <div className="space-y-4">
          {visibleQuestions.map((question) => (
            <div
              key={question.id}
              className="bg-white border rounded-md overflow-hidden"
            >
              <div className="grid md:grid-cols-[170px_1fr]">
                <div className="bg-[#f7f7f7] border-r p-4 text-sm">
                  <div className="font-semibold">Pregunta {question.orden}</div>
                  <div className="mt-2 text-muted-foreground">
                    {isAnswered(question.id) ? "Respondida" : "Sin responder"}
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Puntúa como {Number(question.puntaje || 0).toFixed(2)}
                  </div>
                </div>

                <div className="p-5">
                  <div className="font-medium mb-4 leading-relaxed">
                    {question.enunciado}
                  </div>

                  {question.options.length > 0 ? (
                    <div className="space-y-2">
                      {question.options.map((option) => {
                        const selected = isSelected(question.id, option.id);
                        const showCorrect =
                          finished && simulateGrade && option.es_correcta;

                        return (
                          <label
                            key={option.id}
                            className={`flex gap-3 items-start rounded border p-3 cursor-pointer transition ${
                              selected
                                ? "border-primary bg-primary/5"
                                : "hover:bg-muted/40"
                            } ${
                              showCorrect
                                ? "border-green-300 bg-green-50"
                                : ""
                            }`}
                          >
                            <input
                              type={
                                question.tipo === "MULTIPLE_CHOICE"
                                  ? "checkbox"
                                  : "radio"
                              }
                              name={`question-${question.id}`}
                              checked={selected}
                              disabled={readOnly || finished}
                              onChange={() => setOptionAnswer(question, option.id)}
                              className="mt-1"
                            />
                            <span>{option.texto}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <Textarea
                      placeholder="Escriba su respuesta aquí..."
                      disabled={readOnly || finished}
                      value={String(answers[question.id] || "")}
                      onChange={(e) => setTextAnswer(question, e.target.value)}
                    />
                  )}

                  {showResultForQuestion(question)}
                </div>
              </div>
            </div>
          ))}

          {navigationMode === "SECUENCIAL" && !finished && (
            <div className="flex justify-between bg-white border rounded-md p-4">
              <Button
                variant="outline"
                disabled={currentIndex <= 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              >
                Anterior
              </Button>

              {currentIndex < questions.length - 1 ? (
                <Button
                  onClick={() =>
                    setCurrentIndex((prev) =>
                      Math.min(questions.length - 1, prev + 1)
                    )
                  }
                >
                  Siguiente
                </Button>
              ) : (
                <Button onClick={finish}>Terminar intento...</Button>
              )}
            </div>
          )}
        </div>

        <aside className="bg-white border rounded-md p-4 h-fit sticky top-4">
          <h3 className="font-semibold mb-3">Navegación por el cuestionario</h3>

          <div className="grid grid-cols-5 gap-2">
            {questions.map((question, index) => (
              <button
                key={question.id}
                disabled={navigationMode === "SECUENCIAL" && !finished}
                onClick={() => setCurrentIndex(index)}
                className={`h-9 rounded border text-sm ${
                  currentIndex === index && navigationMode === "SECUENCIAL"
                    ? "ring-2 ring-primary"
                    : ""
                } ${
                  isAnswered(question.id)
                    ? "bg-primary text-primary-foreground"
                    : "bg-white hover:bg-muted"
                }`}
              >
                {question.orden}
              </button>
            ))}
          </div>

          {navigationMode === "NAVIGABLE" && !finished && (
            <Button className="w-full mt-4" onClick={finish}>
              Terminar intento...
            </Button>
          )}

          {finished && (
            <Button className="w-full mt-4" variant="outline" disabled>
              Intento finalizado
            </Button>
          )}
        </aside>
      </div>
    </div>
  );
}