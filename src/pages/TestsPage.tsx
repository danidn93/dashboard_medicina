import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Textarea } from "@/components/ui/textarea";

import {
  Plus,
  RefreshCw,
  Upload,
  Eye,
  Settings2,
  Search,
  CheckCircle2,
  XCircle,
  GraduationCap,
  BookOpen,
  Users,
  Layers,
  FileQuestion,
  ClipboardList,
  BarChart3,
  FileText,
} from "lucide-react";

import { toast } from "sonner";

import MoodleQuizRenderer, {
  MoodleQuestion,
} from "@/components/quiz/MoodleQuizRenderer";

const db = supabase as any;
const NONE = "__none__";

type QuestionType =
  | "SINGLE_CHOICE"
  | "MULTIPLE_CHOICE"
  | "TRUE_FALSE"
  | "SHORT_TEXT";

type NavigationMode = "NAVIGABLE" | "SECUENCIAL";

type Course = {
  id: string;
  nombre: string;
  descripcion: string | null;
  periodo: string | null;
  paralelo: string | null;
  docente: string | null;
};

type Student = {
  id: string;
  course_id: string;
  cedula: string | null;
  nombres: string;
  apellidos: string;
  email: string | null;
};

type Category = {
  id: string;
  course_id: string;
  parent_id: string | null;
  nombre: string;
};

type Question = {
  id: string;
  course_id: string;
  category_id: string;
  tipo: QuestionType;
  enunciado: string;
  explicacion: string | null;
  activa: boolean;
};

type Option = {
  id: string;
  question_id: string;
  orden: number;
  texto: string;
  es_correcta: boolean;
};

type Test = {
  id: string;
  course_id: string;
  nombre: string;
  descripcion: string | null;
  estado: "BORRADOR" | "PUBLICADO" | "CERRADO";
  total_preguntas: number;
  nota_aprobacion: number;
  duracion_minutos: number | null;
  intentos_permitidos: number;
  mezclar_preguntas: boolean;
  mezclar_opciones: boolean;
  navigation_mode: NavigationMode;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  review_immediate_score: boolean;
  review_immediate_answers: boolean;
  review_immediate_feedback: boolean;
  review_after_close_score: boolean;
  review_after_close_answers: boolean;
  review_after_close_feedback: boolean;
};

type Rule = {
  id: string;
  test_id: string;
  category_id: string;
  cantidad_preguntas: number;
  puntaje_por_pregunta: number;
  incluir_subcategorias: boolean;
};

type Attempt = {
  id: string;
  test_id: string;
  course_id: string;
  student_id: string;
  numero_intento: number;
  estado: string;
  score_percent: number;
  aprobado: boolean | null;
  started_at: string;
  finished_at: string | null;
};

type AttemptQuestion = {
  id: string;
  attempt_id: string;
  question_id: string;
  orden: number;
  puntaje: number;
  tipo_snapshot: QuestionType;
  enunciado_snapshot: string;
};

type AttemptQuestionOption = {
  id: string;
  attempt_question_id: string;
  option_id: string;
  texto_snapshot: string;
  orden: number;
  es_correcta_snapshot: boolean;
};

type AttemptAnswer = {
  id: string;
  attempt_question_id: string;
  selected_option_id: string | null;
  respuesta_texto: string | null;
  respuesta_json: any | null;
  es_correcta: boolean | null;
  puntaje_obtenido: number;
  answered_at: string;
};

function cleanCedula(value: string) {
  return String(value || "").replace(/\D/g, "");
}

function splitLine(line: string) {
  if (line.includes("\t")) return line.split("\t").map((v) => v.trim());
  if (line.includes(";")) return line.split(";").map((v) => v.trim());
  return line.split(",").map((v) => v.trim());
}

function parseRows(text: string) {
  return text
    .split(/\r?\n/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map(splitLine);
}

function letterToIndex(letter: string) {
  return ["A", "B", "C", "D", "E"].indexOf(
    String(letter || "").trim().toUpperCase()
  );
}

function toDatetimeLocal(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function datetimeLocalToISO(value: string) {
  if (!value) return null;
  return new Date(value).toISOString();
}

export default function TestsPage() {
  const [loading, setLoading] = useState(false);

  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [openQuestionPreview, setOpenQuestionPreview] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [attemptQuestions, setAttemptQuestions] = useState<AttemptQuestion[]>([]);
  const [attemptQuestionOptions, setAttemptQuestionOptions] = useState<
    AttemptQuestionOption[]
  >([]);
  const [attemptAnswers, setAttemptAnswers] = useState<AttemptAnswer[]>([]);
  const [selectedAttemptReview, setSelectedAttemptReview] =
    useState<Attempt | null>(null);

  const [openCourse, setOpenCourse] = useState(false);
  const [openStudent, setOpenStudent] = useState(false);
  const [openCategory, setOpenCategory] = useState(false);
  const [openQuestion, setOpenQuestion] = useState(false);
  const [openTest, setOpenTest] = useState(false);
  const [openRule, setOpenRule] = useState(false);
  const [openBulk, setOpenBulk] = useState(false);
  const [openPreview, setOpenPreview] = useState(false);
  const [openAttemptReview, setOpenAttemptReview] = useState(false);

  const [courseForm, setCourseForm] = useState({
    nombre: "",
    descripcion: "",
    periodo: "",
    paralelo: "",
    docente: "",
  });

  const [studentForm, setStudentForm] = useState({
    course_id: "",
    cedula: "",
    nombres: "",
    apellidos: "",
    email: "",
  });

  const [categoryForm, setCategoryForm] = useState({
    course_id: "",
    parent_id: NONE,
    nombre: "",
  });

  const buildMoodleQuestionFromBank = (questionId: string): MoodleQuestion | null => {
    const q = questions.find((x) => x.id === questionId);
    if (!q) return null;

    const opts = options
      .filter((o) => o.question_id === q.id)
      .sort((a, b) => a.orden - b.orden)
      .map((o) => ({
        id: o.id,
        texto: o.texto,
        orden: o.orden,
        es_correcta: o.es_correcta,
      }));

    return {
      id: q.id,
      orden: 1,
      tipo: q.tipo,
      enunciado: q.enunciado,
      puntaje: 1,
      options: opts,
    };
  };

  const previewBankQuestion = (questionId: string) => {
    setSelectedQuestionId(questionId);
    setOpenQuestionPreview(true);
  };

  const editQuestion = (questionId: string) => {
    const q = questions.find((x) => x.id === questionId);
    if (!q) return;

    const opts = options
      .filter((o) => o.question_id === q.id)
      .sort((a, b) => a.orden - b.orden);

    const correct = opts.find((o) => o.es_correcta);

    setEditingQuestionId(q.id);
    setQuestionForm({
      course_id: q.course_id,
      category_id: q.category_id,
      tipo: q.tipo,
      enunciado: q.enunciado,
      opcion_a: opts[0]?.texto || "",
      opcion_b: opts[1]?.texto || "",
      opcion_c: opts[2]?.texto || "",
      opcion_d: opts[3]?.texto || "",
      opcion_e: opts[4]?.texto || "",
      respuesta_correcta: correct
        ? ["A", "B", "C", "D", "E"][opts.findIndex((o) => o.id === correct.id)]
        : "A",
      explicacion: q.explicacion || "",
    });

    setOpenQuestion(true);
  };

  const saveQuestion = async () => {
    try {
      if (!questionForm.course_id) return toast.error("Seleccione curso");
      if (!questionForm.category_id) return toast.error("Seleccione categoría");
      if (!questionForm.enunciado.trim()) return toast.error("Ingrese enunciado");

      if (!editingQuestionId) {
        await createQuestion();
        return;
      }

      const { error } = await db
        .from("quiz_questions")
        .update({
          course_id: questionForm.course_id,
          category_id: questionForm.category_id,
          tipo: questionForm.tipo,
          enunciado: questionForm.enunciado.trim(),
          explicacion: questionForm.explicacion || null,
        })
        .eq("id", editingQuestionId);

      if (error) throw error;

      await db
        .from("quiz_question_options")
        .delete()
        .eq("question_id", editingQuestionId);

      if (questionForm.tipo !== "SHORT_TEXT") {
        const correctIndex = letterToIndex(questionForm.respuesta_correcta);

        const rows = [
          questionForm.opcion_a,
          questionForm.opcion_b,
          questionForm.opcion_c,
          questionForm.opcion_d,
          questionForm.opcion_e,
        ]
          .map((texto, index) => ({
            question_id: editingQuestionId,
            orden: index + 1,
            texto: texto.trim(),
            es_correcta: index === correctIndex,
          }))
          .filter((x) => x.texto);

        if (rows.length > 0) {
          const { error: optError } = await db
            .from("quiz_question_options")
            .insert(rows);

          if (optError) throw optError;
        }
      }

      toast.success("Pregunta actualizada");
      setOpenQuestion(false);
      setEditingQuestionId(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Error guardando pregunta");
    }
  };

  const [questionForm, setQuestionForm] = useState({
    course_id: "",
    category_id: "",
    tipo: "SINGLE_CHOICE" as QuestionType,
    enunciado: "",
    opcion_a: "",
    opcion_b: "",
    opcion_c: "",
    opcion_d: "",
    opcion_e: "",
    respuesta_correcta: "A",
    explicacion: "",
  });

  const [testForm, setTestForm] = useState({
    course_id: "",
    nombre: "",
    descripcion: "",
    duracion_minutos: "60",
    intentos_permitidos: "1",
    nota_aprobacion: "70",
    estado: "BORRADOR" as "BORRADOR" | "PUBLICADO" | "CERRADO",
    navigation_mode: "NAVIGABLE" as NavigationMode,
    mezclar_preguntas: "true",
    mezclar_opciones: "true",
    fecha_inicio: "",
    fecha_fin: "",
    review_immediate_score: "true",
    review_immediate_answers: "false",
    review_immediate_feedback: "false",
    review_after_close_score: "true",
    review_after_close_answers: "true",
    review_after_close_feedback: "true",
  });

  const [ruleForm, setRuleForm] = useState({
    test_id: "",
    category_id: "",
    cantidad_preguntas: "10",
    incluir_subcategorias: "true",
  });

  const [bulkMode, setBulkMode] = useState<
    "courses" | "students" | "categories" | "questions"
  >("courses");

  const [bulkText, setBulkText] = useState("");
  const [previewTestId, setPreviewTestId] = useState("");
  const [previewQuestions, setPreviewQuestions] = useState<MoodleQuestion[]>([]);
  const [previewNavigationMode, setPreviewNavigationMode] =
    useState<NavigationMode>("NAVIGABLE");
  const [previewTitle, setPreviewTitle] = useState("");

  const [attemptCourseFilter, setAttemptCourseFilter] = useState("ALL");
  const [attemptTestFilter, setAttemptTestFilter] = useState("ALL");
  const [attemptStudentFilter, setAttemptStudentFilter] = useState("");

  const [bulkQuestionCourseId, setBulkQuestionCourseId] = useState("");
  const [bulkQuestionCategoryId, setBulkQuestionCategoryId] = useState("");

  const getCourseName = (id: string) =>
    courses.find((x) => x.id === id)?.nombre || "-";

  const getCategoryName = (id: string) =>
    categories.find((x) => x.id === id)?.nombre || "-";

  const getTestName = (id: string) =>
    tests.find((x) => x.id === id)?.nombre || "-";

  const getStudentName = (id: string) => {
    const s = students.find((x) => x.id === id);
    return s ? `${s.nombres} ${s.apellidos}` : "-";
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        coursesRes,
        studentsRes,
        categoriesRes,
        questionsRes,
        optionsRes,
        testsRes,
        rulesRes,
        attemptsRes,
        attemptQuestionsRes,
        attemptQuestionOptionsRes,
        answersRes,
      ] = await Promise.all([
        db.from("quiz_courses").select("*").order("created_at", { ascending: false }),
        db.from("quiz_students").select("*").order("created_at", { ascending: false }),
        db.from("quiz_categories").select("*").order("created_at", { ascending: false }),
        db.from("quiz_questions").select("*").order("created_at", { ascending: false }),
        db.from("quiz_question_options").select("*").order("orden", { ascending: true }),
        db.from("quiz_tests").select("*").order("created_at", { ascending: false }),
        db.from("quiz_test_category_rules").select("*").order("orden", { ascending: true }),
        db.from("quiz_attempts").select("*").order("created_at", { ascending: false }),

        db.from("quiz_attempt_questions").select("*").order("orden", { ascending: true }),
        db.from("quiz_attempt_question_options").select("*").order("orden", { ascending: true }),
        db.from("quiz_attempt_answers").select("*"),
      ]);

      if (coursesRes.error) throw coursesRes.error;
      if (studentsRes.error) throw studentsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      if (questionsRes.error) throw questionsRes.error;
      if (optionsRes.error) throw optionsRes.error;
      if (testsRes.error) throw testsRes.error;
      if (rulesRes.error) throw rulesRes.error;
      if (attemptsRes.error) throw attemptsRes.error;
      if (attemptQuestionsRes.error) throw attemptQuestionsRes.error;
      if (attemptQuestionOptionsRes.error) throw attemptQuestionOptionsRes.error;
      if (answersRes.error) throw answersRes.error;

      setCourses(coursesRes.data || []);
      setStudents(studentsRes.data || []);
      setCategories(categoriesRes.data || []);
      setQuestions(questionsRes.data || []);
      setOptions(optionsRes.data || []);
      setTests(testsRes.data || []);
      setRules(rulesRes.data || []);
      setAttempts(attemptsRes.data || []);
      setAttemptQuestions(attemptQuestionsRes.data || []);
      setAttemptQuestionOptions(attemptQuestionOptionsRes.data || []);
      setAttemptAnswers(answersRes.data || []);
    } catch (error: any) {
      toast.error(error.message || "Error cargando información");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const courseCategories = useMemo(
    () => categories.filter((x) => x.course_id === categoryForm.course_id),
    [categories, categoryForm.course_id]
  );

  const questionCategories = useMemo(
    () => categories.filter((x) => x.course_id === questionForm.course_id),
    [categories, questionForm.course_id]
  );

  const selectedRuleTest = tests.find((x) => x.id === ruleForm.test_id);

  const ruleCategories = useMemo(() => {
    if (!selectedRuleTest) return [];
    return categories.filter((x) => x.course_id === selectedRuleTest.course_id);
  }, [categories, selectedRuleTest]);

  const attemptTestsByCourse = useMemo(() => {
    if (attemptCourseFilter === "ALL") return tests;

    return tests.filter((t) => t.course_id === attemptCourseFilter);
  }, [tests, attemptCourseFilter]);

  const filteredAttempts = useMemo(() => {
    return attempts.filter((a) => {
      const s = students.find((x) => x.id === a.student_id);

      const studentText = `${s?.cedula || ""} ${s?.nombres || ""} ${
        s?.apellidos || ""
      }`.toLowerCase();

      return (
        (attemptCourseFilter === "ALL" || a.course_id === attemptCourseFilter) &&
        (attemptTestFilter === "ALL" || a.test_id === attemptTestFilter) &&
        (!attemptStudentFilter.trim() ||
          studentText.includes(attemptStudentFilter.trim().toLowerCase()))
      );
    });
  }, [
    attempts,
    attemptCourseFilter,
    attemptTestFilter,
    attemptStudentFilter,
    students,
  ]);

  const studentAttemptStats = useMemo(() => {
    const grouped = new Map<
      string,
      {
        student_id: string;
        course_id: string;
        total_intentos: number;
        promedio: number;
        mayor: number;
        menor: number;
        aprobados: number;
        reprobados: number;
        ultimo_intento: string | null;
      }
    >();

    filteredAttempts.forEach((a) => {
      const nota = Number(a.score_percent || 0);
      const current = grouped.get(a.student_id);

      if (!current) {
        grouped.set(a.student_id, {
          student_id: a.student_id,
          course_id: a.course_id,
          total_intentos: 1,
          promedio: nota,
          mayor: nota,
          menor: nota,
          aprobados: a.aprobado === true ? 1 : 0,
          reprobados: a.aprobado === false ? 1 : 0,
          ultimo_intento: a.finished_at || a.started_at || null,
        });

        return;
      }

      const nuevoTotal = current.total_intentos + 1;

      current.promedio =
        (current.promedio * current.total_intentos + nota) / nuevoTotal;

      current.total_intentos = nuevoTotal;
      current.mayor = Math.max(current.mayor, nota);
      current.menor = Math.min(current.menor, nota);

      if (a.aprobado === true) current.aprobados += 1;
      if (a.aprobado === false) current.reprobados += 1;

      const currentDate = current.ultimo_intento
        ? new Date(current.ultimo_intento).getTime()
        : 0;

      const attemptDate = a.finished_at || a.started_at || null;
      const attemptTime = attemptDate ? new Date(attemptDate).getTime() : 0;

      if (attemptTime > currentDate) {
        current.ultimo_intento = attemptDate;
      }
    });

    return Array.from(grouped.values()).sort((a, b) => {
      const studentA = getStudentName(a.student_id).toLowerCase();
      const studentB = getStudentName(b.student_id).toLowerCase();

      return studentA.localeCompare(studentB);
    });
  }, [filteredAttempts, students]);

  const getChildCategoryIds = (categoryId: string) => {
    const result = new Set<string>([categoryId]);
    let changed = true;

    while (changed) {
      changed = false;
      categories.forEach((cat) => {
        if (cat.parent_id && result.has(cat.parent_id) && !result.has(cat.id)) {
          result.add(cat.id);
          changed = true;
        }
      });
    }

    return Array.from(result);
  };

  const createCourse = async () => {
    try {
      if (!courseForm.nombre.trim()) return toast.error("Ingrese el nombre del curso");

      const { error } = await db.from("quiz_courses").insert({
        nombre: courseForm.nombre.trim(),
        descripcion: courseForm.descripcion || null,
        periodo: courseForm.periodo || null,
        paralelo: courseForm.paralelo || null,
        docente: courseForm.docente || null,
      });

      if (error) throw error;

      toast.success("Curso creado");
      setOpenCourse(false);
      setCourseForm({ nombre: "", descripcion: "", periodo: "", paralelo: "", docente: "" });
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const createStudent = async () => {
    try {
      if (!studentForm.course_id) return toast.error("Seleccione curso");
      if (!studentForm.nombres.trim()) return toast.error("Ingrese nombres");

      const { error } = await db.from("quiz_students").insert({
        course_id: studentForm.course_id,
        cedula: cleanCedula(studentForm.cedula) || null,
        nombres: studentForm.nombres.trim(),
        apellidos: studentForm.apellidos.trim(),
        email: studentForm.email || null,
      });

      if (error) throw error;

      toast.success("Estudiante registrado");
      setOpenStudent(false);
      setStudentForm({ course_id: "", cedula: "", nombres: "", apellidos: "", email: "" });
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const createCategory = async () => {
    try {
      if (!categoryForm.course_id) return toast.error("Seleccione curso");
      if (!categoryForm.nombre.trim()) return toast.error("Ingrese categoría");

      const { error } = await db.from("quiz_categories").insert({
        course_id: categoryForm.course_id,
        parent_id: categoryForm.parent_id === NONE ? null : categoryForm.parent_id,
        nombre: categoryForm.nombre.trim(),
      });

      if (error) throw error;

      toast.success("Categoría creada");
      setOpenCategory(false);
      setCategoryForm({ course_id: "", parent_id: NONE, nombre: "" });
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const createQuestion = async () => {
    try {
      if (!questionForm.course_id) return toast.error("Seleccione curso");
      if (!questionForm.category_id) return toast.error("Seleccione categoría");
      if (!questionForm.enunciado.trim()) return toast.error("Ingrese enunciado");

      const { data: question, error } = await db
        .from("quiz_questions")
        .insert({
          course_id: questionForm.course_id,
          category_id: questionForm.category_id,
          tipo: questionForm.tipo,
          enunciado: questionForm.enunciado.trim(),
          explicacion: questionForm.explicacion || null,
          activa: true,
        })
        .select()
        .single();

      if (error) throw error;

      if (questionForm.tipo !== "SHORT_TEXT") {
        const correctIndex = letterToIndex(questionForm.respuesta_correcta);

        const rows = [
          questionForm.opcion_a,
          questionForm.opcion_b,
          questionForm.opcion_c,
          questionForm.opcion_d,
          questionForm.opcion_e,
        ]
          .map((texto, index) => ({
            question_id: question.id,
            orden: index + 1,
            texto: texto.trim(),
            es_correcta: index === correctIndex,
          }))
          .filter((x) => x.texto);

        if (rows.length > 0) {
          const { error: optError } = await db.from("quiz_question_options").insert(rows);
          if (optError) throw optError;
        }
      }

      toast.success("Pregunta creada");
      setOpenQuestion(false);
      setQuestionForm({
        course_id: "",
        category_id: "",
        tipo: "SINGLE_CHOICE",
        enunciado: "",
        opcion_a: "",
        opcion_b: "",
        opcion_c: "",
        opcion_d: "",
        opcion_e: "",
        respuesta_correcta: "A",
        explicacion: "",
      });
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const createTest = async () => {
    try {
      if (!testForm.course_id) return toast.error("Seleccione curso");
      if (!testForm.nombre.trim()) return toast.error("Ingrese nombre");

      const { error } = await db.from("quiz_tests").insert({
        course_id: testForm.course_id,
        nombre: testForm.nombre.trim(),
        descripcion: testForm.descripcion || null,
        duracion_minutos: Number(testForm.duracion_minutos),
        intentos_permitidos: Number(testForm.intentos_permitidos),
        nota_aprobacion: Number(testForm.nota_aprobacion),
        estado: testForm.estado,
        navigation_mode: testForm.navigation_mode,
        mezclar_preguntas: testForm.mezclar_preguntas === "true",
        mezclar_opciones: testForm.mezclar_opciones === "true",
        fecha_inicio: datetimeLocalToISO(testForm.fecha_inicio),
        fecha_fin: datetimeLocalToISO(testForm.fecha_fin),
        review_immediate_score: testForm.review_immediate_score === "true",
        review_immediate_answers: testForm.review_immediate_answers === "true",
        review_immediate_feedback: testForm.review_immediate_feedback === "true",
        review_after_close_score: testForm.review_after_close_score === "true",
        review_after_close_answers: testForm.review_after_close_answers === "true",
        review_after_close_feedback: testForm.review_after_close_feedback === "true",
      });

      if (error) throw error;

      toast.success("Test creado");
      setOpenTest(false);
      setTestForm({
        course_id: "",
        nombre: "",
        descripcion: "",
        duracion_minutos: "60",
        intentos_permitidos: "1",
        nota_aprobacion: "70",
        estado: "BORRADOR",
        navigation_mode: "NAVIGABLE",
        mezclar_preguntas: "true",
        mezclar_opciones: "true",
        fecha_inicio: "",
        fecha_fin: "",
        review_immediate_score: "true",
        review_immediate_answers: "false",
        review_immediate_feedback: "false",
        review_after_close_score: "true",
        review_after_close_answers: "true",
        review_after_close_feedback: "true",
      });
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const createRule = async () => {
    try {
      if (!ruleForm.test_id) return toast.error("Seleccione test");
      if (!ruleForm.category_id) return toast.error("Seleccione categoría");

      const { error } = await db.from("quiz_test_category_rules").insert({
        test_id: ruleForm.test_id,
        category_id: ruleForm.category_id,
        cantidad_preguntas: Number(ruleForm.cantidad_preguntas),
        incluir_subcategorias: ruleForm.incluir_subcategorias === "true",
      });

      if (error) throw error;

      await db.rpc("quiz_recalculate_test_points", {
        p_test_id: ruleForm.test_id,
      });

      toast.success("Regla agregada");
      setOpenRule(false);
      setRuleForm({
        test_id: "",
        category_id: "",
        cantidad_preguntas: "10",
        incluir_subcategorias: "true",
      });
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const publishTest = async (id: string) => {
    try {
      await db.rpc("quiz_recalculate_test_points", { p_test_id: id });

      const { error } = await db
        .from("quiz_tests")
        .update({ estado: "PUBLICADO" })
        .eq("id", id);

      if (error) throw error;

      toast.success("Test publicado");
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const findOrCreateCourse = async (nombre: string) => {
    const clean = nombre.trim();

    const local = courses.find(
      (c) => c.nombre.trim().toLowerCase() === clean.toLowerCase()
    );

    if (local) return local.id;

    const { data, error } = await db
      .from("quiz_courses")
      .insert({ nombre: clean })
      .select()
      .single();

    if (error) throw error;

    setCourses((prev) => [data, ...prev]);
    return data.id;
  };

  const findOrCreateCategory = async (
    courseId: string,
    nombre: string,
    parentId: string | null
  ) => {
    const clean = nombre.trim();

    const local = categories.find(
      (c) =>
        c.course_id === courseId &&
        c.nombre.trim().toLowerCase() === clean.toLowerCase() &&
        (c.parent_id || null) === parentId
    );

    if (local) return local.id;

    const { data, error } = await db
      .from("quiz_categories")
      .insert({
        course_id: courseId,
        nombre: clean,
        parent_id: parentId,
      })
      .select()
      .single();

    if (error) throw error;

    setCategories((prev) => [data, ...prev]);
    return data.id;
  };

  const handleBulkFile = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    setBulkText(text);
  };

  function parseMoodleLikeQuestions(text: string) {
    const normalized = text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .trim();

    const blocks =
      normalized.match(/[\s\S]*?ANSWER\s*:\s*[A-E](?=\s*(?:\n|$))/gi) || [];

    return blocks.map((block) => {
      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      const answerLineIndex = lines.findIndex((line) =>
        /^ANSWER\s*:\s*[A-E]/i.test(line)
      );

      const answerLine = answerLineIndex >= 0 ? lines[answerLineIndex] : "";

      const correctLetter = answerLine
        .replace(/^ANSWER\s*:\s*/i, "")
        .trim()
        .toUpperCase()
        .charAt(0);

      const contentLines =
        answerLineIndex >= 0
          ? lines.slice(0, answerLineIndex)
          : lines;

      const optionRegex = /^([A-E])[\)\.]\s*(.+)$/i;

      const options: {
        letter: string;
        text: string;
      }[] = [];

      const questionLines: string[] = [];

      for (const line of contentLines) {
        const match = line.match(optionRegex);

        if (match) {
          options.push({
            letter: match[1].toUpperCase(),
            text: match[2].trim(),
          });
        } else {
          questionLines.push(line);
        }
      }

      return {
        enunciado: questionLines.join(" ").trim(),
        options,
        correctLetter,
      };
    });
  }

  const processBulk = async () => {
    try {
      const rows = parseRows(bulkText);

      if (rows.length === 0) {
        toast.error("No hay datos");
        return;
      }

      let count = 0;

      if (bulkMode === "courses") {
        for (const [nombre, descripcion, periodo, paralelo, docente] of rows) {
          if (!nombre) continue;

          const { error } = await db.from("quiz_courses").insert({
            nombre,
            descripcion: descripcion || null,
            periodo: periodo || null,
            paralelo: paralelo || null,
            docente: docente || null,
          });

          if (error) throw error;
          count++;
        }
      }

      if (bulkMode === "students") {
        for (const [curso, cedula, nombres, apellidos, email] of rows) {
          if (!curso || !nombres) continue;

          const courseId = await findOrCreateCourse(curso);

          const { error } = await db.from("quiz_students").insert({
            course_id: courseId,
            cedula: cleanCedula(cedula) || null,
            nombres,
            apellidos: apellidos || "",
            email: email || null,
          });

          if (error) throw error;
          count++;
        }
      }

      if (bulkMode === "categories") {
        for (const [curso, categoria, subcategoria] of rows) {
          if (!curso || !categoria) continue;

          const courseId = await findOrCreateCourse(curso);
          const parentId = await findOrCreateCategory(courseId, categoria, null);

          if (subcategoria) {
            await findOrCreateCategory(courseId, subcategoria, parentId);
          }

          count++;
        }
      }

      if (bulkMode === "questions") {
        if (!bulkQuestionCourseId) {
          toast.error("Seleccione el curso destino");
          return;
        }

        if (!bulkQuestionCategoryId) {
          toast.error("Seleccione la categoría o subcategoría destino");
          return;
        }

        const parsedQuestions = parseMoodleLikeQuestions(bulkText);

        if (parsedQuestions.length === 0) {
          toast.error("No se detectaron preguntas. Verifique que cada pregunta termine con ANSWER: A/B/C/D/E");
          return;
        }

        for (const item of parsedQuestions) {
          if (!item.enunciado) continue;

          if (item.options.length === 0) {
            toast.error(`La pregunta "${item.enunciado.slice(0, 60)}..." no tiene opciones detectadas`);
            continue;
          }

          if (!item.correctLetter) {
            toast.error(`La pregunta "${item.enunciado.slice(0, 60)}..." no tiene ANSWER válido`);
            continue;
          }

          const { data: q, error } = await db
            .from("quiz_questions")
            .insert({
              course_id: bulkQuestionCourseId,
              category_id: bulkQuestionCategoryId,
              tipo: "SINGLE_CHOICE",
              enunciado: item.enunciado,
              explicacion: null,
              activa: true,
            })
            .select()
            .single();

          if (error) throw error;

          const optionRows = item.options.map((option, index) => ({
            question_id: q.id,
            orden: index + 1,
            texto: option.text,
            es_correcta: option.letter === item.correctLetter,
          }));

          const { error: optError } = await db
            .from("quiz_question_options")
            .insert(optionRows);

          if (optError) throw optError;

          count++;
        }
      }

      toast.success(`Carga masiva completada: ${count} registros`);
      setOpenBulk(false);
      setBulkText("");
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Error en carga masiva");
    }
  };

  const generatePreview = () => {
    const test = tests.find((x) => x.id === previewTestId);

    if (!test) {
      toast.error("Seleccione un test");
      return;
    }

    const selected: MoodleQuestion[] = [];

    rules
      .filter((r) => r.test_id === test.id)
      .forEach((rule) => {
        const categoryIds = rule.incluir_subcategorias
          ? getChildCategoryIds(rule.category_id)
          : [rule.category_id];

        const pool = questions.filter(
          (q) =>
            q.course_id === test.course_id &&
            q.activa &&
            categoryIds.includes(q.category_id)
        );

        const shuffled = [...pool].sort(() => Math.random() - 0.5);

        shuffled.slice(0, rule.cantidad_preguntas).forEach((question) => {
          const opts = options
            .filter((o) => o.question_id === question.id)
            .map((o) => ({
              id: o.id,
              texto: o.texto,
              orden: o.orden,
              es_correcta: o.es_correcta,
            }));

          selected.push({
            id: question.id,
            orden: selected.length + 1,
            tipo: question.tipo,
            enunciado: question.enunciado,
            puntaje: Number(rule.puntaje_por_pregunta || 0),
            options: test.mezclar_opciones
              ? [...opts].sort(() => Math.random() - 0.5)
              : opts,
          });
        });
      });

    const finalQuestions = test.mezclar_preguntas
      ? [...selected].sort(() => Math.random() - 0.5)
      : selected;

    finalQuestions.forEach((q, index) => {
      q.orden = index + 1;
    });

    setPreviewQuestions(finalQuestions);
    setPreviewNavigationMode(test.navigation_mode || "NAVIGABLE");
    setPreviewTitle(test.nombre);
    setOpenPreview(true);
  };

  const bulkPlaceholder = {
    courses: "Nombre curso;Descripción;Periodo;Paralelo;Docente",
    students: "Curso;Cédula;Nombres;Apellidos;Email",
    categories: "Curso;Categoría;Subcategoría",
    questions:
`MUJER DE 30 AÑOS SIN ANTECEDENTES PERSONALES INGRESA AL SERVICIO DE EMERGENCIAS POR PRESENTAR DEBILIDAD HORMIGUEO EN PIERNAS Y BRAZOS A LA EXPLORACIÓN FÍSICA LA PACIENTE PRESENTA PARÁLISIS DE LAS PIERNAS BRAZOS Y FASCICULACIONES MUSCULARES, ROTS 0/++++ SE GENERA UN DIAGNÓSTICO PRESUNTIVO DE SÍNDROME DE GUILLAIN BARRÉ SE ACTIVA EL SISTEMA DE VIGILANCIA EPIDEMIOLÓGICA INMEDIATAMENTE QUÉ SISTEMAS DE VIGILANCIA BASADA INDICADORES SE ACTIVAN INICIALMENTE.
A) Subsistemas y SIVE alerta
B) Subsistemas y SIVE de mortalidad
C) Subsistemas y SIVE hospital
D) Subsistemas y SIVE de vigilancia especializada
ANSWER: A`,
  };

  const statCards = [
    { label: "Cursos", value: courses.length, icon: GraduationCap },
    { label: "Estudiantes", value: students.length, icon: Users },
    { label: "Categorías", value: categories.length, icon: Layers },
    { label: "Preguntas", value: questions.length, icon: FileQuestion },
    { label: "Tests", value: tests.length, icon: ClipboardList },
    { label: "Intentos", value: attempts.length, icon: BarChart3 },
  ];

  const tabItems = [
    { value: "courses", label: "Cursos", icon: GraduationCap },
    { value: "students", label: "Estudiantes", icon: Users },
    { value: "categories", label: "Categorías", icon: Layers },
    { value: "questions", label: "Banco", icon: BookOpen },
    { value: "tests", label: "Tests", icon: ClipboardList },
    { value: "rules", label: "Reglas", icon: Settings2 },
    { value: "preview", label: "Vista previa", icon: Eye },
    { value: "attempts", label: "Intentos", icon: BarChart3 },
  ];

  const openReviewAttempt = (attempt: Attempt) => {
    setSelectedAttemptReview(attempt);
    setOpenAttemptReview(true);
  };

  const selectedAttemptQuestions = useMemo(() => {
    if (!selectedAttemptReview) return [];

    return attemptQuestions
      .filter((q) => q.attempt_id === selectedAttemptReview.id)
      .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0));
  }, [attemptQuestions, selectedAttemptReview]);

  const getAttemptAnswer = (attemptQuestionId: string) => {
    return attemptAnswers.find(
      (a) => a.attempt_question_id === attemptQuestionId
    );
  };

  const getQuestionText = (questionId: string) => {
    return questions.find((q) => q.id === questionId)?.enunciado || "-";
  };

const getAttemptOptionText = (selectedOptionId: string | null) => {
  if (!selectedOptionId) return "-";

  return (
    attemptQuestionOptions.find((o) => o.id === selectedOptionId)
      ?.texto_snapshot || "-"
  );
};

const getCorrectAttemptOptionText = (attemptQuestionId: string) => {
  const correctOptions = attemptQuestionOptions.filter(
    (o) =>
      o.attempt_question_id === attemptQuestionId &&
      o.es_correcta_snapshot === true
  );

  if (!correctOptions.length) return "-";

  return correctOptions.map((o) => o.texto_snapshot).join(", ");
};

  return (
    <div className="min-h-screen bg-[#f6f8f9] p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <section className="relative overflow-hidden rounded-2xl bg-[#002E45] p-6 text-white shadow-lg">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#FF6900]/20 blur-2xl" />
          <div className="absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                <BookOpen className="h-4 w-4 text-[#FF6900]" />
                Administración tipo Moodle
              </div>

              <h1 className="text-3xl font-black tracking-tight md:text-4xl">
                Banco de Preguntas y Tests
              </h1>

              <p className="mt-2 max-w-3xl text-sm text-white/75">
                Gestiona cursos, estudiantes, categorías, banco de preguntas,
                cuestionarios, reglas, intentos y revisión académica.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setOpenBulk(true)}
                className="bg-white text-[#002E45] hover:bg-white/90"
              >
                <Upload className="mr-2 h-4 w-4 text-[#FF6900]" />
                Carga masiva
              </Button>

              <Button
                variant="outline"
                onClick={loadData}
                disabled={loading}
                className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Recargar
              </Button>
            </div>
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {statCards.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.label} className="border-[#002E45]/10 shadow-sm">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">
                      {item.label}
                    </p>
                    <p className="text-2xl font-black text-[#002E45]">
                      {item.value}
                    </p>
                  </div>

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#002E45]/10">
                    <Icon className="h-5 w-5 text-[#FF6900]" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="courses" className="space-y-5">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-2 bg-[#002E45]/5 p-2 md:grid-cols-4 lg:grid-cols-8">
            {tabItems.map((tab) => {
              const Icon = tab.icon;

              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="gap-2 rounded-lg data-[state=active]:bg-[#002E45] data-[state=active]:text-white"
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="courses">
            <Card className="border-[#002E45]/10 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between rounded-t-xl border-b bg-white">
                <div>
                  <CardTitle>Cursos</CardTitle>
                  <CardDescription>Gestión de cursos.</CardDescription>
                </div>
                <Button
                    onClick={() => setOpenCourse(true)}
                    className="bg-[#002E45] hover:bg-[#003b59]"
                  >
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo
                </Button>
              </CardHeader>

              <CardContent>
                <Table>
                  <TableHeader className="bg-[#002E45]/5">
                    <TableRow>
                      <TableHead>Curso</TableHead>
                      <TableHead>Periodo</TableHead>
                      <TableHead>Paralelo</TableHead>
                      <TableHead>Docente</TableHead>
                      <TableHead className="text-right">Dashboard</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courses.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>{c.nombre}</TableCell>
                        <TableCell>{c.periodo || "-"}</TableCell>
                        <TableCell>{c.paralelo || "-"}</TableCell>
                        <TableCell>{c.docente || "-"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                          >
                            <Link to={`/tests/course/${c.id}/dashboard`}>
                              <FileText className="mr-2 h-4 w-4" />
                              Ver dashboard
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students">
            <Card className="border-[#002E45]/10 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between rounded-t-xl border-b bg-white">
                <div>
                  <CardTitle>Estudiantes</CardTitle>
                  <CardDescription>Estudiantes por curso.</CardDescription>
                </div>
                <Button
                  onClick={() => setOpenStudent(true)}
                  className="bg-[#002E45] hover:bg-[#003b59]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo
                </Button>
              </CardHeader>

              <CardContent>
                <Table>
                  <TableHeader className="bg-[#002E45]/5">
                    <TableRow>
                      <TableHead>Cédula</TableHead>
                      <TableHead>Estudiante</TableHead>
                      <TableHead>Curso</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>{s.cedula || "-"}</TableCell>
                        <TableCell>
                          {s.nombres} {s.apellidos}
                        </TableCell>
                        <TableCell>{getCourseName(s.course_id)}</TableCell>
                        <TableCell>{s.email || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <Card className="border-[#002E45]/10 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between rounded-t-xl border-b bg-white">
                <div>
                  <CardTitle>Categorías</CardTitle>
                  <CardDescription>Categorías y subcategorías.</CardDescription>
                </div>
                <Button
                  onClick={() => setOpenCategory(true)}
                  className="bg-[#002E45] hover:bg-[#003b59]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva
                </Button>
              </CardHeader>

              <CardContent>
                <Table>
                  <TableHeader className="bg-[#002E45]/5">
                    <TableRow>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Padre</TableHead>
                      <TableHead>Curso</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>{c.nombre}</TableCell>
                        <TableCell>
                          {c.parent_id ? getCategoryName(c.parent_id) : "-"}
                        </TableCell>
                        <TableCell>{getCourseName(c.course_id)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions">
            <Card className="overflow-hidden border-[#002E45]/10 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b bg-[#002E45] text-white">
                <div>
                  <CardTitle>Banco de preguntas</CardTitle>
                  <CardDescription>
                    Banco estilo Moodle con previsualización y edición individual.
                  </CardDescription>
                </div>

                <Button
                  onClick={() => {
                    setEditingQuestionId(null);
                    setQuestionForm({
                      course_id: "",
                      category_id: "",
                      tipo: "SINGLE_CHOICE",
                      enunciado: "",
                      opcion_a: "",
                      opcion_b: "",
                      opcion_c: "",
                      opcion_d: "",
                      opcion_e: "",
                      respuesta_correcta: "A",
                      explicacion: "",
                    });
                    setOpenQuestion(true);
                  }}
                  className="bg-[#FF6900] text-white hover:bg-[#e85f00]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva pregunta
                </Button>
              </CardHeader>

              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-[#e9ecef]">
                    <TableRow>
                      <TableHead className="w-[70px]">Tipo</TableHead>
                      <TableHead>Pregunta</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Curso</TableHead>
                      <TableHead className="text-right w-[220px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {questions.map((q, index) => (
                      <TableRow key={q.id} className={index % 2 === 0 ? "bg-white" : "bg-[#f8f9fa]"}>
                        <TableCell>
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded border bg-white text-xs font-bold text-[#495057]">
                            {q.tipo === "SINGLE_CHOICE" && "OU"}
                            {q.tipo === "MULTIPLE_CHOICE" && "OM"}
                            {q.tipo === "TRUE_FALSE" && "VF"}
                            {q.tipo === "SHORT_TEXT" && "TC"}
                          </span>
                        </TableCell>

                        <TableCell>
                          <div className="max-w-[620px]">
                            <div className="font-medium text-[#1f2937] line-clamp-2">
                              {q.enunciado}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              ID: {q.id.slice(0, 8)}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>{getCategoryName(q.category_id)}</TableCell>
                        <TableCell>{getCourseName(q.course_id)}</TableCell>

                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => previewBankQuestion(q.id)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Previsualizar
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => editQuestion(q.id)}
                            >
                              Editar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tests">
            <Card className="border-[#002E45]/10 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between rounded-t-xl border-b bg-white">
                <div>
                  <CardTitle>Tests</CardTitle>
                  <CardDescription>Configuración de cuestionarios.</CardDescription>
                </div>
                <Button
                  onClick={() => setOpenTest(true)}
                  className="bg-[#002E45] hover:bg-[#003b59]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo
                </Button>
              </CardHeader>

              <CardContent>
                <Table>
                  <TableHeader className="bg-[#002E45]/5">
                    <TableRow>
                      <TableHead>Test</TableHead>
                      <TableHead>Curso</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Apertura</TableHead>
                      <TableHead>Cierre</TableHead>
                      <TableHead>Modo</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tests.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>{t.nombre}</TableCell>
                        <TableCell>{getCourseName(t.course_id)}</TableCell>
                        <TableCell>{t.estado}</TableCell>
                        <TableCell>
                          {t.fecha_inicio
                            ? new Date(t.fecha_inicio).toLocaleString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {t.fecha_fin
                            ? new Date(t.fecha_fin).toLocaleString()
                            : "-"}
                        </TableCell>
                        <TableCell>{t.navigation_mode}</TableCell>
                        <TableCell>{t.total_preguntas}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => publishTest(t.id)}
                          >
                            Publicar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules">
            <Card className="border-[#002E45]/10 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between rounded-t-xl border-b bg-white">
                <div>
                  <CardTitle>Reglas del test</CardTitle>
                  <CardDescription>
                    Cantidad de preguntas por categoría.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setOpenRule(true)}
                  className="bg-[#002E45] hover:bg-[#003b59]"
                >
                  <Settings2 className="w-4 h-4 mr-2" />
                  Nueva regla
                </Button>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-[#002E45]/5">
                      <TableRow>
                        <TableHead>Test</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Puntaje c/u</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rules.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{getTestName(r.test_id)}</TableCell>
                          <TableCell>{getCategoryName(r.category_id)}</TableCell>
                          <TableCell>{r.cantidad_preguntas}</TableCell>
                          <TableCell>
                            {Number(r.puntaje_por_pregunta).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview">
            <Card className="border-[#002E45]/10 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between rounded-t-xl border-b bg-white">
                <CardTitle>Vista previa estilo Moodle</CardTitle>
                <CardDescription>
                  Simulación completa del test con calificación sin guardar
                  intento.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-w-xl">
                  <Label>Test</Label>
                  <Select value={previewTestId} onValueChange={setPreviewTestId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione test" />
                    </SelectTrigger>
                    <SelectContent>
                      {tests.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.nombre} — {getCourseName(t.course_id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={generatePreview}>
                  <Eye className="w-4 h-4 mr-2" />
                  Previsualizar
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attempts">
            <Card className="border-[#002E45]/10 shadow-sm">
              <CardHeader className="border-b bg-white">
                <CardTitle className="flex items-center gap-2 text-[#002E45]">
                  <BarChart3 className="h-5 w-5 text-[#FF6900]" />
                  Intentos de estudiantes
                </CardTitle>
                <CardDescription>
                  Consulta intentos por curso, test y estudiante. También muestra promedio,
                  mayor y menor calificación por estudiante.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5 p-5">
                <div className="rounded-xl bg-[#f6f8f9] p-4">
                  <div className="grid gap-4 md:grid-cols-[260px_260px_1fr]">
                    <div>
                      <Label>Curso</Label>
                      <Select
                        value={attemptCourseFilter}
                        onValueChange={(value) => {
                          setAttemptCourseFilter(value);
                          setAttemptTestFilter("ALL");
                        }}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Todos los cursos</SelectItem>
                          {courses.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Test</Label>
                      <Select
                        value={attemptTestFilter}
                        onValueChange={setAttemptTestFilter}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Todos los tests</SelectItem>
                          {attemptTestsByCourse.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Buscar estudiante</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="bg-white pl-9"
                          placeholder="Cédula, nombres o apellidos"
                          value={attemptStudentFilter}
                          onChange={(e) => setAttemptStudentFilter(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                  <Card className="border-[#002E45]/10">
                    <CardContent className="p-4">
                      <p className="text-xs font-semibold text-muted-foreground">
                        Intentos filtrados
                      </p>
                      <p className="text-2xl font-black text-[#002E45]">
                        {filteredAttempts.length}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-[#002E45]/10">
                    <CardContent className="p-4">
                      <p className="text-xs font-semibold text-muted-foreground">
                        Estudiantes
                      </p>
                      <p className="text-2xl font-black text-[#002E45]">
                        {studentAttemptStats.length}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-[#002E45]/10">
                    <CardContent className="p-4">
                      <p className="text-xs font-semibold text-muted-foreground">
                        Promedio general
                      </p>
                      <p className="text-2xl font-black text-[#002E45]">
                        {filteredAttempts.length
                          ? (
                              filteredAttempts.reduce(
                                (sum, a) => sum + Number(a.score_percent || 0),
                                0
                              ) / filteredAttempts.length
                            ).toFixed(2)
                          : "0.00"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-[#002E45]/10">
                    <CardContent className="p-4">
                      <p className="text-xs font-semibold text-muted-foreground">
                        Aprobados
                      </p>
                      <p className="text-2xl font-black text-green-600">
                        {filteredAttempts.filter((a) => a.aprobado === true).length}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="rounded-xl border bg-white">
                  <div className="border-b px-4 py-3">
                    <h3 className="font-black text-[#002E45]">
                      Resumen por estudiante
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Promedio, mayor y menor calificación de los intentos filtrados.
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-[#002E45]/5">
                        <TableRow>
                          <TableHead>Estudiante</TableHead>
                          <TableHead>Curso</TableHead>
                          <TableHead className="text-center">Intentos</TableHead>
                          <TableHead className="text-center">Promedio</TableHead>
                          <TableHead className="text-center">Mayor</TableHead>
                          <TableHead className="text-center">Menor</TableHead>
                          <TableHead className="text-center">Aprobados</TableHead>
                          <TableHead className="text-center">Reprobados</TableHead>
                          <TableHead>Último intento</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {studentAttemptStats.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={9}
                              className="py-8 text-center text-sm text-muted-foreground"
                            >
                              No existen intentos con los filtros seleccionados.
                            </TableCell>
                          </TableRow>
                        ) : (
                          studentAttemptStats.map((item) => (
                            <TableRow key={item.student_id}>
                              <TableCell className="font-medium">
                                {getStudentName(item.student_id)}
                              </TableCell>
                              <TableCell>{getCourseName(item.course_id)}</TableCell>
                              <TableCell className="text-center">
                                {item.total_intentos}
                              </TableCell>
                              <TableCell className="text-center font-bold text-[#002E45]">
                                {item.promedio.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-center font-bold text-green-600">
                                {item.mayor.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-center font-bold text-red-600">
                                {item.menor.toFixed(2)}
                              </TableCell>
                              <TableCell className="text-center">
                                {item.aprobados}
                              </TableCell>
                              <TableCell className="text-center">
                                {item.reprobados}
                              </TableCell>
                              <TableCell>
                                {item.ultimo_intento
                                  ? new Date(item.ultimo_intento).toLocaleString()
                                  : "-"}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="rounded-xl border bg-white">
                  <div className="border-b px-4 py-3">
                    <h3 className="font-black text-[#002E45]">
                      Detalle de intentos
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Lista individual de cada intento registrado.
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-[#002E45]/5">
                        <TableRow>
                          <TableHead>Estudiante</TableHead>
                          <TableHead>Curso</TableHead>
                          <TableHead>Test</TableHead>
                          <TableHead>Intento</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Nota</TableHead>
                          <TableHead>Resultado</TableHead>
                          <TableHead>Finalizado</TableHead>
                          <TableHead>Respuestas</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {filteredAttempts.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={8}
                              className="py-8 text-center text-sm text-muted-foreground"
                            >
                              No existen intentos registrados.
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredAttempts.map((a) => (
                            <TableRow key={a.id}>
                              <TableCell>{getStudentName(a.student_id)}</TableCell>
                              <TableCell>{getCourseName(a.course_id)}</TableCell>
                              <TableCell>{getTestName(a.test_id)}</TableCell>
                              <TableCell>{a.numero_intento}</TableCell>
                              <TableCell>{a.estado}</TableCell>
                              <TableCell>
                                {Number(a.score_percent || 0).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                {a.aprobado === true && (
                                  <span className="inline-flex items-center text-green-600">
                                    <CheckCircle2 className="mr-1 h-4 w-4" />
                                    Aprobado
                                  </span>
                                )}

                                {a.aprobado === false && (
                                  <span className="inline-flex items-center text-red-600">
                                    <XCircle className="mr-1 h-4 w-4" />
                                    Reprobado
                                  </span>
                                )}

                                {a.aprobado === null && "-"}
                              </TableCell>
                              <TableCell>
                                {a.finished_at
                                  ? new Date(a.finished_at).toLocaleString()
                                  : "-"}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openReviewAttempt(a)}
                                >
                                  <Eye className="mr-1 h-4 w-4" />
                                  Ver
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={openCourse} onOpenChange={setOpenCourse}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo curso</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <Input
                placeholder="Nombre"
                value={courseForm.nombre}
                onChange={(e) =>
                  setCourseForm({ ...courseForm, nombre: e.target.value })
                }
              />
              <Input
                placeholder="Descripción"
                value={courseForm.descripcion}
                onChange={(e) =>
                  setCourseForm({ ...courseForm, descripcion: e.target.value })
                }
              />
              <Input
                placeholder="Periodo"
                value={courseForm.periodo}
                onChange={(e) =>
                  setCourseForm({ ...courseForm, periodo: e.target.value })
                }
              />
              <Input
                placeholder="Paralelo"
                value={courseForm.paralelo}
                onChange={(e) =>
                  setCourseForm({ ...courseForm, paralelo: e.target.value })
                }
              />
              <Input
                placeholder="Docente"
                value={courseForm.docente}
                onChange={(e) =>
                  setCourseForm({ ...courseForm, docente: e.target.value })
                }
              />
            </div>

            <DialogFooter>
              <Button onClick={createCourse}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={openStudent} onOpenChange={setOpenStudent}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo estudiante</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <Select
                value={studentForm.course_id}
                onValueChange={(v) =>
                  setStudentForm({ ...studentForm, course_id: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Curso" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Cédula"
                value={studentForm.cedula}
                onChange={(e) =>
                  setStudentForm({ ...studentForm, cedula: e.target.value })
                }
              />
              <Input
                placeholder="Nombres"
                value={studentForm.nombres}
                onChange={(e) =>
                  setStudentForm({ ...studentForm, nombres: e.target.value })
                }
              />
              <Input
                placeholder="Apellidos"
                value={studentForm.apellidos}
                onChange={(e) =>
                  setStudentForm({ ...studentForm, apellidos: e.target.value })
                }
              />
              <Input
                placeholder="Email"
                value={studentForm.email}
                onChange={(e) =>
                  setStudentForm({ ...studentForm, email: e.target.value })
                }
              />
            </div>

            <DialogFooter>
              <Button onClick={createStudent}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={openCategory} onOpenChange={setOpenCategory}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva categoría</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <Select
                value={categoryForm.course_id}
                onValueChange={(v) =>
                  setCategoryForm({
                    ...categoryForm,
                    course_id: v,
                    parent_id: NONE,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Curso" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={categoryForm.parent_id}
                onValueChange={(v) =>
                  setCategoryForm({ ...categoryForm, parent_id: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Padre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Sin padre</SelectItem>
                  {courseCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Nombre"
                value={categoryForm.nombre}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, nombre: e.target.value })
                }
              />
            </div>

            <DialogFooter>
              <Button onClick={createCategory}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={openQuestion} onOpenChange={setOpenQuestion}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>
                {editingQuestionId ? "Editar pregunta" : "Nueva pregunta"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <Select
                value={questionForm.course_id}
                onValueChange={(v) =>
                  setQuestionForm({
                    ...questionForm,
                    course_id: v,
                    category_id: "",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Curso" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={questionForm.category_id}
                onValueChange={(v) =>
                  setQuestionForm({ ...questionForm, category_id: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  {questionCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={questionForm.tipo}
                onValueChange={(v: QuestionType) =>
                  setQuestionForm({ ...questionForm, tipo: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SINGLE_CHOICE">Opción única</SelectItem>
                  <SelectItem value="MULTIPLE_CHOICE">
                    Opción múltiple
                  </SelectItem>
                  <SelectItem value="TRUE_FALSE">Verdadero/Falso</SelectItem>
                  <SelectItem value="SHORT_TEXT">Texto corto</SelectItem>
                </SelectContent>
              </Select>

              <Textarea
                placeholder="Enunciado"
                value={questionForm.enunciado}
                onChange={(e) =>
                  setQuestionForm({
                    ...questionForm,
                    enunciado: e.target.value,
                  })
                }
              />

              {questionForm.tipo !== "SHORT_TEXT" && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Opción A"
                      value={questionForm.opcion_a}
                      onChange={(e) =>
                        setQuestionForm({
                          ...questionForm,
                          opcion_a: e.target.value,
                        })
                      }
                    />
                    <Input
                      placeholder="Opción B"
                      value={questionForm.opcion_b}
                      onChange={(e) =>
                        setQuestionForm({
                          ...questionForm,
                          opcion_b: e.target.value,
                        })
                      }
                    />
                    <Input
                      placeholder="Opción C"
                      value={questionForm.opcion_c}
                      onChange={(e) =>
                        setQuestionForm({
                          ...questionForm,
                          opcion_c: e.target.value,
                        })
                      }
                    />
                    <Input
                      placeholder="Opción D"
                      value={questionForm.opcion_d}
                      onChange={(e) =>
                        setQuestionForm({
                          ...questionForm,
                          opcion_d: e.target.value,
                        })
                      }
                    />
                    <Input
                      placeholder="Opción E"
                      value={questionForm.opcion_e}
                      onChange={(e) =>
                        setQuestionForm({
                          ...questionForm,
                          opcion_e: e.target.value,
                        })
                      }
                    />
                  </div>

                  <Select
                    value={questionForm.respuesta_correcta}
                    onValueChange={(v) =>
                      setQuestionForm({
                        ...questionForm,
                        respuesta_correcta: v,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Correcta" />
                    </SelectTrigger>
                    <SelectContent>
                      {["A", "B", "C", "D", "E"].map((x) => (
                        <SelectItem key={x} value={x}>
                          {x}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </>
              )}

              <Textarea
                placeholder="Explicación"
                value={questionForm.explicacion}
                onChange={(e) =>
                  setQuestionForm({
                    ...questionForm,
                    explicacion: e.target.value,
                  })
                }
              />
            </div>

            <DialogFooter>
              <Button onClick={saveQuestion}>
                {editingQuestionId ? "Actualizar pregunta" : "Guardar pregunta"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={openTest} onOpenChange={setOpenTest}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nuevo test</DialogTitle>
              <DialogDescription>
                Configuración general, temporalidad, navegación y opciones de
                revisión.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label>Curso</Label>
                  <Select
                    value={testForm.course_id}
                    onValueChange={(v) =>
                      setTestForm({ ...testForm, course_id: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Curso" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Estado</Label>
                  <Select
                    value={testForm.estado}
                    onValueChange={(v: "BORRADOR" | "PUBLICADO" | "CERRADO") =>
                      setTestForm({ ...testForm, estado: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BORRADOR">Borrador</SelectItem>
                      <SelectItem value="PUBLICADO">Publicado</SelectItem>
                      <SelectItem value="CERRADO">Cerrado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Nombre</Label>
                <Input
                  value={testForm.nombre}
                  onChange={(e) =>
                    setTestForm({ ...testForm, nombre: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Descripción</Label>
                <Textarea
                  value={testForm.descripcion}
                  onChange={(e) =>
                    setTestForm({ ...testForm, descripcion: e.target.value })
                  }
                />
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label>Fecha y hora de apertura</Label>
                  <Input
                    type="datetime-local"
                    value={testForm.fecha_inicio}
                    onChange={(e) =>
                      setTestForm({ ...testForm, fecha_inicio: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label>Fecha y hora de cierre</Label>
                  <Input
                    type="datetime-local"
                    value={testForm.fecha_fin}
                    onChange={(e) =>
                      setTestForm({ ...testForm, fecha_fin: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <Label>Duración en minutos</Label>
                  <Input
                    type="number"
                    value={testForm.duracion_minutos}
                    onChange={(e) =>
                      setTestForm({
                        ...testForm,
                        duracion_minutos: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Intentos permitidos</Label>
                  <Input
                    type="number"
                    value={testForm.intentos_permitidos}
                    onChange={(e) =>
                      setTestForm({
                        ...testForm,
                        intentos_permitidos: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label>Nota mínima</Label>
                  <Input
                    type="number"
                    value={testForm.nota_aprobacion}
                    onChange={(e) =>
                      setTestForm({
                        ...testForm,
                        nota_aprobacion: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <Label>Navegación</Label>
                  <Select
                    value={testForm.navigation_mode}
                    onValueChange={(v: NavigationMode) =>
                      setTestForm({ ...testForm, navigation_mode: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NAVIGABLE">
                        Libre entre preguntas
                      </SelectItem>
                      <SelectItem value="SECUENCIAL">
                        Secuencial
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Mezclar preguntas</Label>
                  <Select
                    value={testForm.mezclar_preguntas}
                    onValueChange={(v) =>
                      setTestForm({ ...testForm, mezclar_preguntas: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Sí</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Mezclar opciones</Label>
                  <Select
                    value={testForm.mezclar_opciones}
                    onValueChange={(v) =>
                      setTestForm({ ...testForm, mezclar_opciones: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Sí</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Card className="border-[#002E45]/10 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between rounded-t-xl border-b bg-white">
                  <CardTitle className="text-base">
                    Opciones de revisión al finalizar intento
                  </CardTitle>
                  <CardDescription>
                    Controla qué puede ver el estudiante inmediatamente después
                    de terminar.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-3">
                  <div>
                    <Label>Mostrar nota</Label>
                    <Select
                      value={testForm.review_immediate_score}
                      onValueChange={(v) =>
                        setTestForm({
                          ...testForm,
                          review_immediate_score: v,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Sí</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Mostrar respuestas correctas</Label>
                    <Select
                      value={testForm.review_immediate_answers}
                      onValueChange={(v) =>
                        setTestForm({
                          ...testForm,
                          review_immediate_answers: v,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Sí</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Mostrar retroalimentación</Label>
                    <Select
                      value={testForm.review_immediate_feedback}
                      onValueChange={(v) =>
                        setTestForm({
                          ...testForm,
                          review_immediate_feedback: v,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Sí</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#002E45]/10 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between rounded-t-xl border-b bg-white">
                  <CardTitle className="text-base">
                    Opciones de revisión después del cierre
                  </CardTitle>
                  <CardDescription>
                    Controla qué puede revisar el estudiante cuando el test ya
                    cerró.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-3">
                  <div>
                    <Label>Mostrar nota</Label>
                    <Select
                      value={testForm.review_after_close_score}
                      onValueChange={(v) =>
                        setTestForm({
                          ...testForm,
                          review_after_close_score: v,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Sí</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Mostrar respuestas correctas</Label>
                    <Select
                      value={testForm.review_after_close_answers}
                      onValueChange={(v) =>
                        setTestForm({
                          ...testForm,
                          review_after_close_answers: v,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Sí</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Mostrar retroalimentación</Label>
                    <Select
                      value={testForm.review_after_close_feedback}
                      onValueChange={(v) =>
                        setTestForm({
                          ...testForm,
                          review_after_close_feedback: v,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Sí</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            <DialogFooter>
              <Button onClick={createTest}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={openRule} onOpenChange={setOpenRule}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva regla</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <Select
                value={ruleForm.test_id}
                onValueChange={(v) =>
                  setRuleForm({ ...ruleForm, test_id: v, category_id: "" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Test" />
                </SelectTrigger>
                <SelectContent>
                  {tests.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={ruleForm.category_id}
                onValueChange={(v) =>
                  setRuleForm({ ...ruleForm, category_id: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  {ruleCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="number"
                placeholder="Cantidad"
                value={ruleForm.cantidad_preguntas}
                onChange={(e) =>
                  setRuleForm({
                    ...ruleForm,
                    cantidad_preguntas: e.target.value,
                  })
                }
              />

              <Select
                value={ruleForm.incluir_subcategorias}
                onValueChange={(v) =>
                  setRuleForm({ ...ruleForm, incluir_subcategorias: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Incluir subcategorías</SelectItem>
                  <SelectItem value="false">Solo esta categoría</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button onClick={createRule}>Guardar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={openBulk} onOpenChange={setOpenBulk}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Carga masiva</DialogTitle>
              <DialogDescription>
                Datos separados por tabulador, punto y coma o coma.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <Select
                value={bulkMode}
                onValueChange={(v: any) => setBulkMode(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="courses">Cursos</SelectItem>
                  <SelectItem value="students">Estudiantes</SelectItem>
                  <SelectItem value="categories">Categorías</SelectItem>
                  <SelectItem value="questions">Preguntas</SelectItem>
                </SelectContent>
              </Select>

              {bulkMode === "questions" && (
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <Label>Curso destino</Label>
                    <Select
                      value={bulkQuestionCourseId}
                      onValueChange={(value) => {
                        setBulkQuestionCourseId(value);
                        setBulkQuestionCategoryId("");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione curso" />
                      </SelectTrigger>

                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Categoría/Subcategoría destino</Label>
                    <Select
                      value={bulkQuestionCategoryId}
                      onValueChange={setBulkQuestionCategoryId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione categoría" />
                      </SelectTrigger>

                      <SelectContent>
                        {categories
                          .filter((cat) => cat.course_id === bulkQuestionCourseId)
                          .map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.nombre}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <Input
                type="file"
                accept=".csv,.txt"
                onChange={(e) =>
                  handleBulkFile(e.target.files?.[0] || null)
                }
              />

              <Textarea
                className="min-h-[260px] font-mono text-xs"
                value={bulkText}
                placeholder={bulkPlaceholder[bulkMode]}
                onChange={(e) => setBulkText(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button onClick={processBulk}>Procesar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={openPreview} onOpenChange={setOpenPreview}>
          <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] overflow-y-auto p-0">
            <MoodleQuizRenderer
              title={previewTitle}
              subtitle="Vista previa del test. No se guardará ningún intento."
              questions={previewQuestions}
              navigationMode={previewNavigationMode}
              simulateGrade
              onFinish={(result) => {
                if (!result) return;
                toast.success(`Calificación simulada: ${result.percent}%`);
              }}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={openQuestionPreview} onOpenChange={setOpenQuestionPreview}>
          <DialogContent className="max-w-[900px] w-[95vw] max-h-[90vh] overflow-y-auto p-0">
            {selectedQuestionId && buildMoodleQuestionFromBank(selectedQuestionId) && (
              <MoodleQuizRenderer
                title="Previsualización de pregunta"
                subtitle="Vista individual estilo Moodle. No se guardará ningún intento."
                questions={[buildMoodleQuestionFromBank(selectedQuestionId)!]}
                navigationMode="NAVIGABLE"
                simulateGrade
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={openAttemptReview} onOpenChange={setOpenAttemptReview}>
          <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[#002E45]">
                Respuestas del intento
              </DialogTitle>

              <DialogDescription>
                {selectedAttemptReview
                  ? `${getStudentName(selectedAttemptReview.student_id)} · ${getTestName(
                      selectedAttemptReview.test_id
                    )} · Intento ${selectedAttemptReview.numero_intento}`
                  : ""}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {selectedAttemptQuestions.length === 0 ? (
                <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  No existen preguntas guardadas para este intento.
                </div>
              ) : (
                selectedAttemptQuestions.map((attemptQuestion, index) => {
                  const answer = getAttemptAnswer(attemptQuestion.id);

                  const studentAnswer =
                    answer?.respuesta_texto ||
                    getAttemptOptionText(answer?.selected_option_id || null);

                  const correctAnswer = getCorrectAttemptOptionText(attemptQuestion.id);
                  const showCorrect = answer?.es_correcta === false;

                  return (
                    <div
                      key={attemptQuestion.id}
                      className="rounded-xl border bg-white p-4 shadow-sm"
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-bold text-[#FF6900]">
                            Pregunta {index + 1}
                          </div>

                          <div className="mt-1 font-semibold text-[#002E45]">
                            {attemptQuestion.enunciado_snapshot ||
                              getQuestionText(attemptQuestion.question_id)}
                          </div>
                        </div>

                        {answer?.es_correcta === true && (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                            Correcta
                          </span>
                        )}

                        {answer?.es_correcta === false && (
                          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
                            Incorrecta
                          </span>
                        )}

                        {!answer && (
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
                            Sin responder
                          </span>
                        )}
                      </div>

                      <div className={showCorrect ? "grid gap-3 md:grid-cols-2" : "grid gap-3"}>
                        <div className="rounded-lg bg-[#f6f8f9] p-3">
                          <div className="text-xs font-bold text-muted-foreground">
                            Respuesta del estudiante
                          </div>

                          <div className="mt-1 text-sm">
                            {studentAnswer || "-"}
                          </div>
                        </div>

                        {showCorrect && (
                          <div className="rounded-lg bg-green-50 p-3">
                            <div className="text-xs font-bold text-green-700">
                              Respuesta correcta
                            </div>

                            <div className="mt-1 text-sm">
                              {correctAnswer || "-"}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 text-xs text-muted-foreground">
                        Puntaje obtenido:{" "}
                        <strong>{Number(answer?.puntaje_obtenido || 0).toFixed(2)}</strong>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenAttemptReview(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}