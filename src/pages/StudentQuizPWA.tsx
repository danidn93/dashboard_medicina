import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Lock,
  PlayCircle,
  RefreshCw,
  UserCheck,
  UserCircle,
  XCircle,
  CalendarClock,
  AlertCircle,
} from "lucide-react";

const db = supabase as any;
const STORAGE_KEY = "quiz_cedula";

type Question = {
  attempt_question_id: string;
  orden: number;
  tipo: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_TEXT";
  enunciado: string;
  puntaje: number;
  options: {
    attempt_option_id: string;
    orden: number;
    texto: string;
  }[];
};

type AvailableTest = {
  test_id: string;
  test_nombre: string;
  descripcion?: string | null;
  estado?: string;
  total_preguntas: number;
  nota_aprobacion: number;
  nota_maxima?: number;
  duracion_minutos?: number | null;
  intentos_realizados: number;
  intentos_permitidos: number;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  navigation_mode?: "NAVIGABLE" | "SECUENCIAL";

  esta_abierto?: boolean;
  es_futuro?: boolean;
  es_pasado?: boolean;
};

type AvailableCourse = {
  course_id: string;
  course_nombre: string;
  course_descripcion?: string | null;
  periodo?: string | null;
  paralelo?: string | null;
  docente?: string | null;
  tests: AvailableTest[];
};

type StudentInfo = {
  id?: string;
  cedula?: string;
  nombres?: string;
  apellidos?: string;
  nombre_completo?: string;
  email?: string;
};

const cleanCedula = (value: string) => String(value || "").replace(/\D/g, "");

const formatDateTime = (value?: string | null) => {
  if (!value) return "Sin definir";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin definir";

  return new Intl.DateTimeFormat("es-EC", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const QuizTimer = ({
  initialMinutes,
  startTime,
  onExpire,
}: {
  initialMinutes: number;
  startTime: string;
  onExpire: () => void;
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const start = new Date(startTime).getTime();
      const limit = initialMinutes * 60 * 1000;
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((start + limit - now) / 1000));

      setTimeLeft(diff);

      if (diff <= 0 && !expired) {
        setExpired(true);
        onExpire();
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);

    return () => clearInterval(timer);
  }, [startTime, initialMinutes, onExpire, expired]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    return `${h > 0 ? h + ":" : ""}${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`flex items-center gap-2 font-mono text-xl font-black ${
        timeLeft < 60 ? "animate-pulse text-red-600" : "text-[#002E45]"
      }`}
    >
      <Clock className="h-5 w-5" />
      {formatTime(timeLeft)}
    </div>
  );
};

export default function StudentQuizPWA() {
  const [cedula, setCedula] = useState(localStorage.getItem(STORAGE_KEY) || "");
  const [cedulaLocked, setCedulaLocked] = useState(
    Boolean(localStorage.getItem(STORAGE_KEY))
  );

  const [student, setStudent] = useState<StudentInfo | null>(null);
  const [courses, setCourses] = useState<AvailableCourse[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<AvailableCourse | null>(
    null
  );

  const [attempt, setAttempt] = useState<any | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [loading, setLoading] = useState(false);
  const [finishResult, setFinishResult] = useState<any | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const studentName = useMemo(() => {
    if (student?.nombre_completo) return student.nombre_completo;

    const full = `${student?.nombres || ""} ${student?.apellidos || ""}`.trim();
    return full || "estudiante";
  }, [student]);

  const answeredCount = useMemo(() => {
    return questions.filter((q) => {
      const value = answers[q.attempt_question_id];
      if (Array.isArray(value)) return value.length > 0;
      return Boolean(String(value || "").trim());
    }).length;
  }, [answers, questions]);

  const isSequential = attempt?.test?.navigation_mode === "SECUENCIAL";

  const visibleQuestions = isSequential
    ? questions.slice(currentIndex, currentIndex + 1)
    : questions;

  const loadCourses = async (cedulaValue = cedula) => {
    try {
      setLoading(true);

      const clean = cleanCedula(cedulaValue);
      if (!clean) {
        toast.error("Ingrese su número de cédula");
        return;
      }

      localStorage.setItem(STORAGE_KEY, clean);
      setCedula(clean);
      setCedulaLocked(true);

      const { data, error } = await db.rpc(
        "quiz_get_available_courses_by_cedula",
        { p_cedula: clean }
      );

      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "No se encontraron cursos");

      setStudent(data.student || null);
      setCourses(Array.isArray(data.courses) ? data.courses : []);
      setSelectedCourse(null);
      setAttempt(null);
      setQuestions([]);
      setAnswers({});
      setFinishResult(null);
      setCurrentIndex(0);
    } catch (error: any) {
      toast.error(error.message || "Error cargando cursos");
    } finally {
      setLoading(false);
    }
  };

  const unlockCedula = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCedula("");
    setCedulaLocked(false);
    setStudent(null);
    setCourses([]);
    setSelectedCourse(null);
    setAttempt(null);
    setQuestions([]);
    setAnswers({});
    setFinishResult(null);
    setCurrentIndex(0);
  };

  const getTestAvailability = (test: AvailableTest) => {
    const intentosRealizados = Number(test.intentos_realizados || 0);
    const intentosPermitidos = Number(test.intentos_permitidos || 0);

    const agotado =
      intentosPermitidos > 0 && intentosRealizados >= intentosPermitidos;

    const sinIntentosConfigurados = intentosPermitidos <= 0;

    const estaAbierto = Boolean(test.esta_abierto);
    const esFuturo = Boolean(test.es_futuro);
    const esPasado = Boolean(test.es_pasado);

    let status:
      | "DISPONIBLE"
      | "FUTURO"
      | "VENCIDO"
      | "AGOTADO"
      | "SIN_INTENTOS"
      | "CERRADO" = "DISPONIBLE";

    let label = "Disponible";
    let message = "Puede iniciar este cuestionario.";
    let disabled = false;

    if (sinIntentosConfigurados) {
      status = "SIN_INTENTOS";
      label = "No disponible";
      message = "Este cuestionario no tiene intentos permitidos configurados.";
      disabled = true;
    } else if (agotado) {
      status = "AGOTADO";
      label = "Agotado";
      message = "Ya utilizó todos los intentos disponibles.";
      disabled = true;
    } else if (esFuturo) {
      status = "FUTURO";
      label = "No habilitado";
      message = `Se habilitará el ${formatDateTime(test.fecha_inicio)}.`;
      disabled = true;
    } else if (esPasado) {
      status = "VENCIDO";
      label = "Finalizado";
      message = `El periodo para rendir terminó el ${formatDateTime(
        test.fecha_fin
      )}.`;
      disabled = true;
    } else if (!estaAbierto) {
      status = "CERRADO";
      label = "Cerrado";
      message = "Este cuestionario no está habilitado actualmente.";
      disabled = true;
    }

    return {
      status,
      label,
      message,
      disabled,
      agotado,
      estaAbierto,
      esFuturo,
      esPasado,
    };
  };

  const startAttempt = async (test: AvailableTest) => {
    const availability = getTestAvailability(test);

    if (availability.disabled) {
      toast.error(availability.message);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await db.rpc("quiz_start_attempt_by_cedula", {
        p_cedula: cleanCedula(cedula),
        p_test_id: test.test_id,
      });

      if (error) throw error;
      if (!data?.ok) {
        throw new Error(data?.error || "No se pudo iniciar el intento");
      }

      await loadAttempt(data.attempt_id);
    } catch (error: any) {
      toast.error(error.message || "No se pudo iniciar el intento");
    } finally {
      setLoading(false);
    }
  };

  const loadAttempt = async (attemptId: string) => {
    const { data, error } = await db.rpc("quiz_get_attempt_by_cedula", {
      p_cedula: cleanCedula(cedula),
      p_attempt_id: attemptId,
    });

    if (error) throw error;
    if (!data?.ok) throw new Error(data?.error || "No se pudo cargar intento");

    setAttempt(data.data);
    setQuestions(data.data.questions || []);
    setAnswers({});
    setCurrentIndex(0);
    setFinishResult(null);
  };

  const selectAnswer = async (question: Question, optionId: string) => {
    const current = answers[question.attempt_question_id];

    let next: string | string[];

    if (question.tipo === "MULTIPLE_CHOICE") {
      const arr = Array.isArray(current) ? current : [];
      next = arr.includes(optionId)
        ? arr.filter((x) => x !== optionId)
        : [...arr, optionId];
    } else {
      next = optionId;
    }

    setAnswers((prev) => ({
      ...prev,
      [question.attempt_question_id]: next,
    }));

    const { error } = await db.rpc("quiz_save_answer_by_cedula", {
      p_cedula: cleanCedula(cedula),
      p_attempt_question_id: question.attempt_question_id,
      p_selected_option_id:
        question.tipo === "MULTIPLE_CHOICE" ? null : optionId,
      p_respuesta_texto: null,
      p_respuesta_json:
        question.tipo === "MULTIPLE_CHOICE"
          ? { selected_option_ids: next }
          : null,
    });

    if (error) toast.error(error.message);
  };

  const saveTextAnswer = async (question: Question, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [question.attempt_question_id]: value,
    }));

    const { error } = await db.rpc("quiz_save_answer_by_cedula", {
      p_cedula: cleanCedula(cedula),
      p_attempt_question_id: question.attempt_question_id,
      p_selected_option_id: null,
      p_respuesta_texto: value,
      p_respuesta_json: null,
    });

    if (error) toast.error(error.message);
  };

  const isSelected = (question: Question, optionId: string) => {
    const value = answers[question.attempt_question_id];
    if (Array.isArray(value)) return value.includes(optionId);
    return value === optionId;
  };

  const finishAttempt = async () => {
    if (!attempt?.attempt_id) return;
    if (!confirm("¿Desea terminar y enviar el intento?")) return;

    try {
      setLoading(true);

      const { data, error } = await db.rpc("quiz_finish_attempt_by_cedula", {
        p_cedula: cleanCedula(cedula),
        p_attempt_id: attempt.attempt_id,
      });

      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "No se pudo finalizar");

      setFinishResult(data);
      setAttempt(null);
      setQuestions([]);
      setAnswers({});
      setCurrentIndex(0);

      toast.success("Intento finalizado correctamente");

      await loadCourses();
    } catch (error: any) {
      toast.error(error.message || "No se pudo finalizar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) loadCourses(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (attempt) {
    return (
      <div className="min-h-screen bg-[#f6f8f9]">
        <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 p-4">
            <div>
              <h1 className="text-lg font-black text-[#002E45]">
                {attempt.test?.nombre}
              </h1>
              <p className="text-xs text-muted-foreground">
                Estudiante: {studentName}
              </p>
            </div>

            {attempt.test?.duracion_minutos && (
              <div className="rounded-lg border bg-orange-50 px-4 py-2 shadow-inner">
                <span className="block text-[10px] font-bold uppercase text-orange-600">
                  Tiempo restante
                </span>
                <QuizTimer
                  initialMinutes={attempt.test.duracion_minutos}
                  startTime={attempt.fecha_inicio}
                  onExpire={() => finishAttempt()}
                />
              </div>
            )}
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl gap-4 p-4 lg:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            {visibleQuestions.map((question) => {
              const index = questions.findIndex(
                (q) => q.attempt_question_id === question.attempt_question_id
              );

              return (
                <Card
                  key={question.attempt_question_id}
                  className="overflow-hidden border-[#002E45]/10 shadow-sm"
                >
                  <div className="grid md:grid-cols-[170px_1fr]">
                    <div className="border-r bg-[#002E45]/5 p-4 text-sm">
                      <div className="font-black text-[#002E45]">
                        Pregunta {index + 1}
                      </div>

                      <div className="mt-2 text-muted-foreground">
                        {answers[question.attempt_question_id]
                          ? "Respondida"
                          : "Sin responder"}
                      </div>

                      <div className="mt-2 text-xs text-muted-foreground">
                        Puntúa como {Number(question.puntaje || 0).toFixed(2)}
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="mb-4 text-base font-semibold leading-relaxed text-[#002E45]">
                        {question.enunciado}
                      </div>

                      {question.options.length > 0 ? (
                        <div className="space-y-2">
                          {question.options.map((option) => (
                            <label
                              key={option.attempt_option_id}
                              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                                isSelected(question, option.attempt_option_id)
                                  ? "border-[#FF6900] bg-orange-50"
                                  : "bg-white hover:bg-[#f6f8f9]"
                              }`}
                            >
                              <input
                                type={
                                  question.tipo === "MULTIPLE_CHOICE"
                                    ? "checkbox"
                                    : "radio"
                                }
                                name={`question-${question.attempt_question_id}`}
                                checked={isSelected(
                                  question,
                                  option.attempt_option_id
                                )}
                                onChange={() =>
                                  selectAnswer(
                                    question,
                                    option.attempt_option_id
                                  )
                                }
                                className="mt-1"
                              />

                              <span>{option.texto}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <Textarea
                          placeholder="Escriba su respuesta aquí..."
                          value={String(
                            answers[question.attempt_question_id] || ""
                          )}
                          onChange={(e) =>
                            saveTextAnswer(question, e.target.value)
                          }
                          className="min-h-32"
                        />
                      )}

                      {isSequential && (
                        <div className="mt-5 flex justify-between">
                          <Button
                            variant="outline"
                            disabled={currentIndex === 0}
                            onClick={() =>
                              setCurrentIndex((v) => Math.max(0, v - 1))
                            }
                          >
                            Anterior
                          </Button>

                          <Button
                            variant="outline"
                            disabled={currentIndex === questions.length - 1}
                            onClick={() =>
                              setCurrentIndex((v) =>
                                Math.min(questions.length - 1, v + 1)
                              )
                            }
                          >
                            Siguiente
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <aside className="space-y-4">
            <Card className="border-t-4 border-t-[#002E45] p-4 shadow-md">
              <h3 className="mb-4 text-sm font-bold text-[#002E45]">
                Navegación por el cuestionario
              </h3>

              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const value = answers[q.attempt_question_id];
                  const isAnswered = Array.isArray(value)
                    ? value.length > 0
                    : Boolean(String(value || "").trim());

                  const isCurrent = currentIndex === idx;

                  return (
                    <button
                      key={q.attempt_question_id}
                      onClick={() => !isSequential && setCurrentIndex(idx)}
                      className={`relative h-10 w-full rounded-md border text-xs font-bold transition-all
                        ${
                          isAnswered
                            ? "bg-slate-400 text-white"
                            : "bg-white text-slate-600"
                        }
                        ${isCurrent ? "ring-2 ring-[#FF6900] ring-offset-2" : ""}
                        ${
                          isSequential && !isCurrent
                            ? "cursor-not-allowed opacity-50"
                            : "hover:border-[#002E45]"
                        }
                      `}
                    >
                      {idx + 1}

                      {isAnswered && (
                        <div className="absolute bottom-0 left-0 h-1.5 w-full rounded-b-md bg-slate-600" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 rounded-xl bg-[#f6f8f9] p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Respondidas</span>
                  <strong className="text-[#002E45]">
                    {answeredCount}/{questions.length}
                  </strong>
                </div>
              </div>

              <div className="mt-6 border-t pt-4">
                <button
                  onClick={finishAttempt}
                  className="text-sm font-semibold text-[#002E45] hover:underline"
                >
                  Finalizar intento...
                </button>
              </div>
            </Card>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8f9] p-4">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-2xl bg-[#002E45] p-6 text-white shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                <GraduationCap className="h-4 w-4 text-[#FF6900]" />
                Aula virtual
              </div>

              <h1 className="mt-3 text-3xl font-black">Mis cursos</h1>

              <p className="mt-2 text-sm text-white/75">
                Seleccione un curso para ver sus cuestionarios disponibles.
              </p>
            </div>

            {cedulaLocked && (
              <div className="rounded-xl bg-white/10 px-4 py-3 text-sm">
                <div className="flex items-center gap-2 font-semibold">
                  <UserCircle className="h-4 w-4 text-[#FF6900]" />
                  Bienvenido/a
                </div>
                <div className="mt-1 text-white/90">{studentName}</div>

                <button
                  onClick={unlockCedula}
                  className="mt-2 text-xs font-semibold text-white/70 underline hover:text-white"
                >
                  Cambiar cédula
                </button>
              </div>
            )}
          </div>
        </section>

        {!cedulaLocked && (
          <Card className="border-[#002E45]/10 shadow-sm">
            <CardHeader>
              <CardTitle className="text-[#002E45]">
                Identificación del estudiante
              </CardTitle>
              <CardDescription>
                Ingrese su número de cédula una sola vez. Luego quedará guardado
                en este dispositivo.
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Cédula"
                value={cedula}
                onChange={(e) => setCedula(e.target.value)}
              />

              <Button
                onClick={() => loadCourses()}
                disabled={loading}
                className="bg-[#002E45] hover:bg-[#003b59]"
              >
                <UserCheck className="mr-2 h-4 w-4" />
                Consultar
              </Button>
            </CardContent>
          </Card>
        )}

        {cedulaLocked && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => loadCourses()}
              disabled={loading}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Actualizar
            </Button>
          </div>
        )}

        {finishResult && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 font-bold text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                Intento finalizado correctamente
              </div>

              {finishResult.score_percent !== undefined && (
                <p className="mt-1 text-sm text-green-700">
                  Nota obtenida:{" "}
                  <strong>
                    {Number(finishResult.score_percent || 0).toFixed(2)}
                  </strong>
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {cedulaLocked && courses.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No hay cursos disponibles para esta cédula.
            </CardContent>
          </Card>
        )}

        {cedulaLocked && !selectedCourse && courses.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <Card
                key={course.course_id}
                className="cursor-pointer border-[#002E45]/10 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                onClick={() => setSelectedCourse(course)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-[#002E45]">
                    <BookOpen className="h-5 w-5 text-[#FF6900]" />
                    {course.course_nombre}
                  </CardTitle>

                  <CardDescription>
                    {course.tests?.length || 0} cuestionario(s) publicado(s)
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  {course.course_descripcion && (
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {course.course_descripcion}
                    </p>
                  )}

                  {(course.periodo || course.paralelo || course.docente) && (
                    <div className="rounded-xl bg-[#f6f8f9] p-3 text-sm text-muted-foreground">
                      {course.periodo && <div>Periodo: {course.periodo}</div>}
                      {course.paralelo && (
                        <div>Paralelo: {course.paralelo}</div>
                      )}
                      {course.docente && <div>Docente: {course.docente}</div>}
                    </div>
                  )}

                  <Button className="w-full bg-[#002E45] hover:bg-[#003b59]">
                    Ver cuestionarios
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {cedulaLocked && selectedCourse && (
          <div className="space-y-4">
            <Button variant="outline" onClick={() => setSelectedCourse(null)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a cursos
            </Button>

            <Card className="border-[#002E45]/10 shadow-sm">
              <CardHeader className="border-b bg-white">
                <CardTitle className="flex items-center gap-2 text-[#002E45]">
                  <BookOpen className="h-5 w-5 text-[#FF6900]" />
                  {selectedCourse.course_nombre}
                </CardTitle>

                <CardDescription>
                  Cuestionarios publicados del curso seleccionado.
                </CardDescription>
              </CardHeader>

              <CardContent className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
                {(selectedCourse.tests || []).length === 0 && (
                  <div className="col-span-full rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                    Este curso no tiene cuestionarios publicados.
                  </div>
                )}

                {(selectedCourse.tests || []).map((test) => {
                  const availability = getTestAvailability(test);

                  const badgeClass =
                    availability.status === "DISPONIBLE"
                      ? "bg-green-100 text-green-700"
                      : availability.status === "FUTURO"
                      ? "bg-blue-100 text-blue-700"
                      : availability.status === "VENCIDO"
                      ? "bg-zinc-100 text-zinc-700"
                      : "bg-red-100 text-red-700";

                  return (
                    <div
                      key={test.test_id}
                      className={`rounded-xl border bg-white p-4 shadow-sm transition ${
                        availability.disabled
                          ? "opacity-80"
                          : "hover:-translate-y-0.5 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-black text-[#002E45]">
                            {test.test_nombre}
                          </h3>

                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {test.descripcion || "Cuestionario publicado"}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${badgeClass}`}
                        >
                          {availability.label}
                        </span>
                      </div>

                      <div
                        className={`mt-4 rounded-xl border p-3 text-sm ${
                          availability.status === "DISPONIBLE"
                            ? "border-green-200 bg-green-50 text-green-800"
                            : availability.status === "FUTURO"
                            ? "border-blue-200 bg-blue-50 text-blue-800"
                            : availability.status === "VENCIDO"
                            ? "border-zinc-200 bg-zinc-50 text-zinc-700"
                            : "border-red-200 bg-red-50 text-red-800"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {availability.status === "DISPONIBLE" ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                          ) : availability.status === "FUTURO" ? (
                            <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />
                          ) : availability.status === "VENCIDO" ? (
                            <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                          ) : (
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                          )}

                          <span className="font-medium">
                            {availability.message}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                        <div className="rounded-lg bg-[#f6f8f9] p-3">
                          <div className="text-xs text-muted-foreground">
                            Preguntas
                          </div>
                          <div className="font-bold">
                            {test.total_preguntas}
                          </div>
                        </div>

                        <div className="rounded-lg bg-[#f6f8f9] p-3">
                          <div className="text-xs text-muted-foreground">
                            Nota mínima
                          </div>
                          <div className="font-bold">
                            {test.nota_aprobacion}
                          </div>
                        </div>

                        <div className="rounded-lg bg-[#f6f8f9] p-3">
                          <div className="text-xs text-muted-foreground">
                            Intentos
                          </div>
                          <div className="font-bold">
                            {test.intentos_realizados}/
                            {test.intentos_permitidos}
                          </div>
                        </div>

                        <div className="rounded-lg bg-[#f6f8f9] p-3">
                          <div className="text-xs text-muted-foreground">
                            Duración
                          </div>
                          <div className="flex items-center gap-1 font-bold">
                            <Clock className="h-3.5 w-3.5" />
                            {test.duracion_minutos
                              ? `${test.duracion_minutos} min`
                              : "Libre"}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1 rounded-lg bg-slate-50 p-3 text-xs text-muted-foreground">
                        <div>
                          <strong>Inicio:</strong>{" "}
                          {formatDateTime(test.fecha_inicio)}
                        </div>
                        <div>
                          <strong>Fin:</strong> {formatDateTime(test.fecha_fin)}
                        </div>
                      </div>

                      <Button
                        className="mt-4 w-full bg-[#002E45] hover:bg-[#003b59] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                        disabled={loading || availability.disabled}
                        onClick={() => startAttempt(test)}
                      >
                        {availability.disabled ? (
                          <>
                            {availability.status === "AGOTADO" ? (
                              <XCircle className="mr-2 h-4 w-4" />
                            ) : (
                              <Lock className="mr-2 h-4 w-4" />
                            )}
                            {availability.label}
                          </>
                        ) : (
                          <>
                            <PlayCircle className="mr-2 h-4 w-4" />
                            Iniciar intento
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}