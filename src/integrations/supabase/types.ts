export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      analisis_comentarios: {
        Row: {
          cambio_total: number | null
          carrera_nombre: string | null
          comentario_negativo: string | null
          comentario_positivo: string | null
          created_at: string | null
          facultad_nombre: string | null
          id: string
          modelo_ia: string | null
          nivel: string
          raw_respuesta: Json | null
          recomendaciones: string | null
          updated_at: string | null
          version_anterior_id: string | null
          version_id: string
        }
        Insert: {
          cambio_total?: number | null
          carrera_nombre?: string | null
          comentario_negativo?: string | null
          comentario_positivo?: string | null
          created_at?: string | null
          facultad_nombre?: string | null
          id?: string
          modelo_ia?: string | null
          nivel?: string
          raw_respuesta?: Json | null
          recomendaciones?: string | null
          updated_at?: string | null
          version_anterior_id?: string | null
          version_id: string
        }
        Update: {
          cambio_total?: number | null
          carrera_nombre?: string | null
          comentario_negativo?: string | null
          comentario_positivo?: string | null
          created_at?: string | null
          facultad_nombre?: string | null
          id?: string
          modelo_ia?: string | null
          nivel?: string
          raw_respuesta?: Json | null
          recomendaciones?: string | null
          updated_at?: string | null
          version_anterior_id?: string | null
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analisis_comentarios_version_anterior_id_fkey"
            columns: ["version_anterior_id"]
            isOneToOne: false
            referencedRelation: "dataset_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analisis_comentarios_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "dataset_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      carreras: {
        Row: {
          codigo: string | null
          created_at: string
          facultad_id: string
          id: string
          nombre: string
        }
        Insert: {
          codigo?: string | null
          created_at?: string
          facultad_id: string
          id?: string
          nombre: string
        }
        Update: {
          codigo?: string | null
          created_at?: string
          facultad_id?: string
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "carreras_facultad_id_fkey"
            columns: ["facultad_id"]
            isOneToOne: false
            referencedRelation: "facultades"
            referencedColumns: ["id"]
          },
        ]
      }
      dataset_analysis: {
        Row: {
          conteo: Json
          created_at: string | null
          global: number
          id: string
          porcentajes: Json
          version_id: string | null
        }
        Insert: {
          conteo: Json
          created_at?: string | null
          global: number
          id?: string
          porcentajes: Json
          version_id?: string | null
        }
        Update: {
          conteo?: Json
          created_at?: string | null
          global?: number
          id?: string
          porcentajes?: Json
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dataset_analysis_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "dataset_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      dataset_analysis_public: {
        Row: {
          carrera_id: string | null
          carreras: Json | null
          criterios: Json | null
          facultad_id: string | null
          global: number | null
          indicadores: Json | null
          link_id: string
          tipo: string
          updated_at: string | null
          version_id: string
        }
        Insert: {
          carrera_id?: string | null
          carreras?: Json | null
          criterios?: Json | null
          facultad_id?: string | null
          global?: number | null
          indicadores?: Json | null
          link_id: string
          tipo: string
          updated_at?: string | null
          version_id: string
        }
        Update: {
          carrera_id?: string | null
          carreras?: Json | null
          criterios?: Json | null
          facultad_id?: string | null
          global?: number | null
          indicadores?: Json | null
          link_id?: string
          tipo?: string
          updated_at?: string | null
          version_id?: string
        }
        Relationships: []
      }
      dataset_rows: {
        Row: {
          created_at: string | null
          data: Json | null
          id: number
          version_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: never
          version_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: never
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dataset_rows_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "dataset_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      dataset_version_links: {
        Row: {
          created_at: string | null
          id: string
          tipo: string
          token: string
          version_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          tipo: string
          token: string
          version_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          tipo?: string
          token?: string
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dataset_version_links_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "dataset_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      dataset_versions: {
        Row: {
          col_carrera: string | null
          col_criterios: string[] | null
          col_facultad: string | null
          comentarios_column: string | null
          created_at: string
          dataset_id: string
          file_path: string
          id: string
          periodo: string
          total_columns: number | null
          total_rows: number | null
          version_number: number
        }
        Insert: {
          col_carrera?: string | null
          col_criterios?: string[] | null
          col_facultad?: string | null
          comentarios_column?: string | null
          created_at?: string
          dataset_id: string
          file_path: string
          id?: string
          periodo: string
          total_columns?: number | null
          total_rows?: number | null
          version_number: number
        }
        Update: {
          col_carrera?: string | null
          col_criterios?: string[] | null
          col_facultad?: string | null
          comentarios_column?: string | null
          created_at?: string
          dataset_id?: string
          file_path?: string
          id?: string
          periodo?: string
          total_columns?: number | null
          total_rows?: number | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "dataset_versions_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      datasets: {
        Row: {
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          periodo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          periodo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          periodo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      eval_asignatura_profesor: {
        Row: {
          asignatura_id: string
          created_at: string
          id: string
          periodo_id: string
          profesor_id: string
          tipo_profesor: string
          version_id: string
        }
        Insert: {
          asignatura_id: string
          created_at?: string
          id?: string
          periodo_id: string
          profesor_id: string
          tipo_profesor: string
          version_id: string
        }
        Update: {
          asignatura_id?: string
          created_at?: string
          id?: string
          periodo_id?: string
          profesor_id?: string
          tipo_profesor?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eval_asignatura_profesor_asignatura_id_fkey"
            columns: ["asignatura_id"]
            isOneToOne: false
            referencedRelation: "eval_asignaturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eval_asignatura_profesor_asignatura_id_fkey"
            columns: ["asignatura_id"]
            isOneToOne: false
            referencedRelation: "eval_resultados_full"
            referencedColumns: ["asignatura_id"]
          },
          {
            foreignKeyName: "eval_asignatura_profesor_periodo_id_fkey"
            columns: ["periodo_id"]
            isOneToOne: false
            referencedRelation: "eval_periodos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eval_asignatura_profesor_periodo_id_fkey"
            columns: ["periodo_id"]
            isOneToOne: false
            referencedRelation: "eval_resultados_full"
            referencedColumns: ["periodo_id"]
          },
          {
            foreignKeyName: "eval_asignatura_profesor_profesor_id_fkey"
            columns: ["profesor_id"]
            isOneToOne: false
            referencedRelation: "eval_profesores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eval_asignatura_profesor_profesor_id_fkey"
            columns: ["profesor_id"]
            isOneToOne: false
            referencedRelation: "eval_resultados_full"
            referencedColumns: ["profesor_id"]
          },
          {
            foreignKeyName: "eval_asignatura_profesor_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "eval_dataset_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      eval_asignaturas: {
        Row: {
          created_at: string
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string
          id?: string
          nombre: string
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      eval_componentes: {
        Row: {
          created_at: string
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string
          id?: string
          nombre: string
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      eval_dataset_versions: {
        Row: {
          aprobados_n_veces: number | null
          aprobados_primera_vez: number | null
          ausentes_n_veces: number | null
          ausentes_primera_vez: number | null
          created_at: string
          dataset_id: string
          file_name: string | null
          id: string
          inscritos_n_veces: number | null
          inscritos_primera_vez: number | null
          numero_estudiantes: number | null
          periodo_detectado: string | null
          porcentaje_aprobados: number | null
          total_asignaturas: number | null
          total_componentes: number | null
          total_inscritos: number | null
          total_periodos: number | null
          total_profesores: number | null
          total_rows_hoja1: number | null
          total_rows_hoja2: number | null
          total_rows_hoja3: number | null
          total_subcomponentes: number | null
          total_temas: number | null
          version_number: number
        }
        Insert: {
          aprobados_n_veces?: number | null
          aprobados_primera_vez?: number | null
          ausentes_n_veces?: number | null
          ausentes_primera_vez?: number | null
          created_at?: string
          dataset_id: string
          file_name?: string | null
          id?: string
          inscritos_n_veces?: number | null
          inscritos_primera_vez?: number | null
          numero_estudiantes?: number | null
          periodo_detectado?: string | null
          porcentaje_aprobados?: number | null
          total_asignaturas?: number | null
          total_componentes?: number | null
          total_inscritos?: number | null
          total_periodos?: number | null
          total_profesores?: number | null
          total_rows_hoja1?: number | null
          total_rows_hoja2?: number | null
          total_rows_hoja3?: number | null
          total_subcomponentes?: number | null
          total_temas?: number | null
          version_number: number
        }
        Update: {
          aprobados_n_veces?: number | null
          aprobados_primera_vez?: number | null
          ausentes_n_veces?: number | null
          ausentes_primera_vez?: number | null
          created_at?: string
          dataset_id?: string
          file_name?: string | null
          id?: string
          inscritos_n_veces?: number | null
          inscritos_primera_vez?: number | null
          numero_estudiantes?: number | null
          periodo_detectado?: string | null
          porcentaje_aprobados?: number | null
          total_asignaturas?: number | null
          total_componentes?: number | null
          total_inscritos?: number | null
          total_periodos?: number | null
          total_profesores?: number | null
          total_rows_hoja1?: number | null
          total_rows_hoja2?: number | null
          total_rows_hoja3?: number | null
          total_subcomponentes?: number | null
          total_temas?: number | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "eval_dataset_versions_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "eval_datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      eval_datasets: {
        Row: {
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      eval_import_raw: {
        Row: {
          created_at: string
          data: Json
          id: string
          row_number: number
          sheet_name: string
          version_id: string
        }
        Insert: {
          created_at?: string
          data: Json
          id?: string
          row_number: number
          sheet_name: string
          version_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          row_number?: number
          sheet_name?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eval_import_raw_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "eval_dataset_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      eval_periodos: {
        Row: {
          created_at: string
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string
          id?: string
          nombre: string
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      eval_profesores: {
        Row: {
          created_at: string
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string
          id?: string
          nombre: string
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      eval_resultados: {
        Row: {
          aciertos_pct: number
          componente_id: string
          created_at: string
          id: string
          sheet_name: string | null
          subcomponente_id: string
          tema_id: string
          version_id: string
        }
        Insert: {
          aciertos_pct: number
          componente_id: string
          created_at?: string
          id?: string
          sheet_name?: string | null
          subcomponente_id: string
          tema_id: string
          version_id: string
        }
        Update: {
          aciertos_pct?: number
          componente_id?: string
          created_at?: string
          id?: string
          sheet_name?: string | null
          subcomponente_id?: string
          tema_id?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eval_resultados_componente_id_fkey"
            columns: ["componente_id"]
            isOneToOne: false
            referencedRelation: "eval_componentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eval_resultados_componente_id_fkey"
            columns: ["componente_id"]
            isOneToOne: false
            referencedRelation: "eval_resultados_full"
            referencedColumns: ["componente_id"]
          },
          {
            foreignKeyName: "eval_resultados_subcomponente_id_fkey"
            columns: ["subcomponente_id"]
            isOneToOne: false
            referencedRelation: "eval_resultados_full"
            referencedColumns: ["subcomponente_id"]
          },
          {
            foreignKeyName: "eval_resultados_subcomponente_id_fkey"
            columns: ["subcomponente_id"]
            isOneToOne: false
            referencedRelation: "eval_subcomponentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eval_resultados_tema_id_fkey"
            columns: ["tema_id"]
            isOneToOne: false
            referencedRelation: "eval_resultados_full"
            referencedColumns: ["tema_id"]
          },
          {
            foreignKeyName: "eval_resultados_tema_id_fkey"
            columns: ["tema_id"]
            isOneToOne: false
            referencedRelation: "eval_temas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eval_resultados_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "eval_dataset_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      eval_subcomponentes: {
        Row: {
          componente_id: string
          created_at: string
          id: string
          nombre: string
        }
        Insert: {
          componente_id: string
          created_at?: string
          id?: string
          nombre: string
        }
        Update: {
          componente_id?: string
          created_at?: string
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "eval_subcomponentes_componente_id_fkey"
            columns: ["componente_id"]
            isOneToOne: false
            referencedRelation: "eval_componentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eval_subcomponentes_componente_id_fkey"
            columns: ["componente_id"]
            isOneToOne: false
            referencedRelation: "eval_resultados_full"
            referencedColumns: ["componente_id"]
          },
        ]
      }
      eval_tema_asignatura: {
        Row: {
          asignatura_id: string
          created_at: string
          id: string
          tema_id: string
          version_id: string
        }
        Insert: {
          asignatura_id: string
          created_at?: string
          id?: string
          tema_id: string
          version_id: string
        }
        Update: {
          asignatura_id?: string
          created_at?: string
          id?: string
          tema_id?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eval_tema_asignatura_asignatura_id_fkey"
            columns: ["asignatura_id"]
            isOneToOne: false
            referencedRelation: "eval_asignaturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eval_tema_asignatura_asignatura_id_fkey"
            columns: ["asignatura_id"]
            isOneToOne: false
            referencedRelation: "eval_resultados_full"
            referencedColumns: ["asignatura_id"]
          },
          {
            foreignKeyName: "eval_tema_asignatura_tema_id_fkey"
            columns: ["tema_id"]
            isOneToOne: false
            referencedRelation: "eval_resultados_full"
            referencedColumns: ["tema_id"]
          },
          {
            foreignKeyName: "eval_tema_asignatura_tema_id_fkey"
            columns: ["tema_id"]
            isOneToOne: false
            referencedRelation: "eval_temas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eval_tema_asignatura_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "eval_dataset_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      eval_temas: {
        Row: {
          created_at: string
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string
          id?: string
          nombre: string
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      exam_attempt_items: {
        Row: {
          attempt_id: string
          created_at: string
          es_correcta: boolean | null
          id: string
          puntaje_obtenido: number
          question_id: string
        }
        Insert: {
          attempt_id: string
          created_at?: string
          es_correcta?: boolean | null
          id?: string
          puntaje_obtenido?: number
          question_id: string
        }
        Update: {
          attempt_id?: string
          created_at?: string
          es_correcta?: boolean | null
          id?: string
          puntaje_obtenido?: number
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_attempt_items_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "exam_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_attempt_items_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "exam_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_attempt_items_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "v_exam_question_stats"
            referencedColumns: ["question_id"]
          },
        ]
      }
      exam_attempts: {
        Row: {
          apellido_s: string
          calificacion_total: number | null
          comenzado_el: string | null
          created_at: string
          email: string | null
          estado: string | null
          finalizado: string | null
          id: string
          nombre: string
          tiempo_requerido_text: string | null
          version_id: string
        }
        Insert: {
          apellido_s: string
          calificacion_total?: number | null
          comenzado_el?: string | null
          created_at?: string
          email?: string | null
          estado?: string | null
          finalizado?: string | null
          id?: string
          nombre: string
          tiempo_requerido_text?: string | null
          version_id: string
        }
        Update: {
          apellido_s?: string
          calificacion_total?: number | null
          comenzado_el?: string | null
          created_at?: string
          email?: string | null
          estado?: string | null
          finalizado?: string | null
          id?: string
          nombre?: string
          tiempo_requerido_text?: string | null
          version_id?: string
        }
        Relationships: []
      }
      exam_dataset_versions: {
        Row: {
          created_at: string
          dataset_id: string
          file_name: string | null
          id: string
          total_intentos: number | null
          total_preguntas: number | null
          version_number: number
        }
        Insert: {
          created_at?: string
          dataset_id: string
          file_name?: string | null
          id?: string
          total_intentos?: number | null
          total_preguntas?: number | null
          version_number: number
        }
        Update: {
          created_at?: string
          dataset_id?: string
          file_name?: string | null
          id?: string
          total_intentos?: number | null
          total_preguntas?: number | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "exam_dataset_versions_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "exam_datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_datasets: {
        Row: {
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          periodo: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          periodo?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          periodo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      exam_import_raw: {
        Row: {
          created_at: string
          data: Json
          id: string
          row_number: number
          version_id: string
        }
        Insert: {
          created_at?: string
          data: Json
          id?: string
          row_number: number
          version_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          row_number?: number
          version_id?: string
        }
        Relationships: []
      }
      exam_questions: {
        Row: {
          activa: boolean
          correct_answer: string
          created_at: string
          dataset_id: string
          id: string
          ponderacion: number
          question_order: number
          question_text: string
          updated_at: string
        }
        Insert: {
          activa?: boolean
          correct_answer: string
          created_at?: string
          dataset_id: string
          id?: string
          ponderacion?: number
          question_order: number
          question_text: string
          updated_at?: string
        }
        Update: {
          activa?: boolean
          correct_answer?: string
          created_at?: string
          dataset_id?: string
          id?: string
          ponderacion?: number
          question_order?: number
          question_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      examenes: {
        Row: {
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          periodo: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          periodo?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          periodo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      facultades: {
        Row: {
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      intento_respuestas: {
        Row: {
          created_at: string
          es_correcta: boolean | null
          id: string
          intento_id: string
          opcion_id: string | null
          pregunta_id: string
          puntaje_obtenido: number
          respuesta_estudiante_normalizada: string | null
          respuesta_estudiante_raw: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          es_correcta?: boolean | null
          id?: string
          intento_id: string
          opcion_id?: string | null
          pregunta_id: string
          puntaje_obtenido?: number
          respuesta_estudiante_normalizada?: string | null
          respuesta_estudiante_raw?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          es_correcta?: boolean | null
          id?: string
          intento_id?: string
          opcion_id?: string | null
          pregunta_id?: string
          puntaje_obtenido?: number
          respuesta_estudiante_normalizada?: string | null
          respuesta_estudiante_raw?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "intento_respuestas_intento_id_fkey"
            columns: ["intento_id"]
            isOneToOne: false
            referencedRelation: "intentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intento_respuestas_opcion_id_fkey"
            columns: ["opcion_id"]
            isOneToOne: false
            referencedRelation: "pregunta_opciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intento_respuestas_pregunta_id_fkey"
            columns: ["pregunta_id"]
            isOneToOne: false
            referencedRelation: "preguntas"
            referencedColumns: ["id"]
          },
        ]
      }
      intentos: {
        Row: {
          apellidos: string
          calificacion_total: number | null
          comenzado_el: string | null
          correo: string | null
          created_at: string
          estado: string | null
          finalizado_el: string | null
          id: string
          nombres: string
          tiempo_requerido_segundos: number | null
          tiempo_requerido_texto: string | null
          updated_at: string
          version_id: string
        }
        Insert: {
          apellidos: string
          calificacion_total?: number | null
          comenzado_el?: string | null
          correo?: string | null
          created_at?: string
          estado?: string | null
          finalizado_el?: string | null
          id?: string
          nombres: string
          tiempo_requerido_segundos?: number | null
          tiempo_requerido_texto?: string | null
          updated_at?: string
          version_id: string
        }
        Update: {
          apellidos?: string
          calificacion_total?: number | null
          comenzado_el?: string | null
          correo?: string | null
          created_at?: string
          estado?: string | null
          finalizado_el?: string | null
          id?: string
          nombres?: string
          tiempo_requerido_segundos?: number | null
          tiempo_requerido_texto?: string | null
          updated_at?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intentos_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "exam_dataset_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      pregunta_opciones: {
        Row: {
          created_at: string
          es_correcta: boolean
          id: string
          orden: number
          pregunta_id: string
          texto: string
        }
        Insert: {
          created_at?: string
          es_correcta?: boolean
          id?: string
          orden: number
          pregunta_id: string
          texto: string
        }
        Update: {
          created_at?: string
          es_correcta?: boolean
          id?: string
          orden?: number
          pregunta_id?: string
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "pregunta_opciones_pregunta_id_fkey"
            columns: ["pregunta_id"]
            isOneToOne: false
            referencedRelation: "preguntas"
            referencedColumns: ["id"]
          },
        ]
      }
      preguntas: {
        Row: {
          componente: string | null
          created_at: string
          docente: string | null
          enunciado: string | null
          id: string
          justificacion: string | null
          nivel: string | null
          numero_pregunta: number
          pregunta_raw: string
          subcomponente: string | null
          tema: string | null
          tipo_pregunta: string
          updated_at: string
          version_id: string
        }
        Insert: {
          componente?: string | null
          created_at?: string
          docente?: string | null
          enunciado?: string | null
          id?: string
          justificacion?: string | null
          nivel?: string | null
          numero_pregunta: number
          pregunta_raw: string
          subcomponente?: string | null
          tema?: string | null
          tipo_pregunta?: string
          updated_at?: string
          version_id: string
        }
        Update: {
          componente?: string | null
          created_at?: string
          docente?: string | null
          enunciado?: string | null
          id?: string
          justificacion?: string | null
          nivel?: string | null
          numero_pregunta?: number
          pregunta_raw?: string
          subcomponente?: string | null
          tema?: string | null
          tipo_pregunta?: string
          updated_at?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "preguntas_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "exam_dataset_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      share_links: {
        Row: {
          carrera_id: string | null
          charts: Json | null
          created_at: string
          dataset_id: string | null
          expires_at: string | null
          facultad_id: string | null
          filters: Json | null
          id: string
          link_type: string
          token: string
          version_id: string | null
        }
        Insert: {
          carrera_id?: string | null
          charts?: Json | null
          created_at?: string
          dataset_id?: string | null
          expires_at?: string | null
          facultad_id?: string | null
          filters?: Json | null
          id?: string
          link_type: string
          token: string
          version_id?: string | null
        }
        Update: {
          carrera_id?: string | null
          charts?: Json | null
          created_at?: string
          dataset_id?: string | null
          expires_at?: string | null
          facultad_id?: string | null
          filters?: Json | null
          id?: string
          link_type?: string
          token?: string
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "share_links_carrera_id_fkey"
            columns: ["carrera_id"]
            isOneToOne: false
            referencedRelation: "carreras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_links_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "datasets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_links_facultad_id_fkey"
            columns: ["facultad_id"]
            isOneToOne: false
            referencedRelation: "facultades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_links_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "dataset_versions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      eval_resultados_base: {
        Row: {
          aciertos_pct: number | null
          asignatura: string[] | null
          asignatura_id: string[] | null
          componente: string | null
          componente_id: string | null
          periodo: string[] | null
          periodo_id: string[] | null
          profesor: string[] | null
          profesor_id: string[] | null
          resultado_id: string | null
          sheet_name: string | null
          subcomponente: string | null
          subcomponente_id: string | null
          tema: string | null
          tema_id: string | null
          version_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eval_resultados_componente_id_fkey"
            columns: ["componente_id"]
            isOneToOne: false
            referencedRelation: "eval_componentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eval_resultados_componente_id_fkey"
            columns: ["componente_id"]
            isOneToOne: false
            referencedRelation: "eval_resultados_full"
            referencedColumns: ["componente_id"]
          },
          {
            foreignKeyName: "eval_resultados_subcomponente_id_fkey"
            columns: ["subcomponente_id"]
            isOneToOne: false
            referencedRelation: "eval_resultados_full"
            referencedColumns: ["subcomponente_id"]
          },
          {
            foreignKeyName: "eval_resultados_subcomponente_id_fkey"
            columns: ["subcomponente_id"]
            isOneToOne: false
            referencedRelation: "eval_subcomponentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eval_resultados_tema_id_fkey"
            columns: ["tema_id"]
            isOneToOne: false
            referencedRelation: "eval_resultados_full"
            referencedColumns: ["tema_id"]
          },
          {
            foreignKeyName: "eval_resultados_tema_id_fkey"
            columns: ["tema_id"]
            isOneToOne: false
            referencedRelation: "eval_temas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eval_resultados_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "eval_dataset_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      eval_resultados_full: {
        Row: {
          aciertos_pct: number | null
          asignatura: string | null
          asignatura_id: string | null
          componente: string | null
          componente_id: string | null
          periodo: string | null
          periodo_id: string | null
          profesor: string | null
          profesor_id: string | null
          resultado_id: string | null
          sheet_name: string | null
          subcomponente: string | null
          subcomponente_id: string | null
          tema: string | null
          tema_id: string | null
          version_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eval_resultados_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "eval_dataset_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      v_exam_question_stats: {
        Row: {
          correct_answer: string | null
          dataset_id: string | null
          porcentaje_acierto: number | null
          question_id: string | null
          question_order: number | null
          question_text: string | null
          total_correctas: number | null
          total_incorrectas: number | null
          total_respondidas: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      eval_analisis: {
        Args: {
          p_asignatura?: string
          p_componente?: string
          p_periodo?: string
          p_profesor?: string
          p_subcomponente?: string
          p_tema?: string
          p_version_id: string
        }
        Returns: Json
      }
      eval_dashboard_analisis: {
        Args: {
          p_asignatura?: string
          p_componente?: string
          p_periodo?: string
          p_profesor?: string
          p_subcomponente?: string
          p_tema?: string
          p_version_id: string
        }
        Returns: Json
      }
      eval_top5_asignaturas: {
        Args: { p_tema_id: string; p_version_id: string }
        Returns: {
          id: string
          nombre: string
          promedio: number
        }[]
      }
      eval_top5_subcomponentes: {
        Args: { p_componente_id: string; p_version_id: string }
        Returns: {
          id: string
          nombre: string
          promedio: number
        }[]
      }
      eval_top5_temas: {
        Args: { p_subcomponente_id: string; p_version_id: string }
        Returns: {
          id: string
          nombre: string
          promedio: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
