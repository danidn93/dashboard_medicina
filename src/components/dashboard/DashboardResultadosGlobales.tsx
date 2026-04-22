"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
} from "recharts";

import eLogo from "/assets/e.png";
import bookIcon from "/assets/libro.png";
import usersIcon from "/assets/usuarios.png";

/* =========================
   Tipos
========================= */
interface Props {
  data: {
    numero_estudiantes: number;
    total_inscritos: number;

    inscritos_primera_vez: number;
    inscritos_n_veces: number;

    aprobados_primera_vez: number;
    aprobados_n_veces: number;

    ausentes_primera_vez: number;
    ausentes_n_veces: number;
  };
}

/* =========================
   Utils
========================= */
const clamp0 = (n: number) =>
  Number.isFinite(n) ? Math.max(0, n) : 0;

const pct = (n: number, d: number) =>
  d > 0 ? `${((n / d) * 100).toFixed(2)}%` : "0.00%";

/* =========================
   Colores
========================= */
const COLORS = {
  aprobado: "#002E45",
  reprobado: "#4EC3E0",
  ausente: "#CFCFCF",
};

/* =========================
   Label dentro del pie
========================= */
const renderLabelInside =
  (total: number) =>
  ({ cx, cy, midAngle, outerRadius, value }: any) => {
    if (!value || total <= 0) return null;

    const RAD = Math.PI / 180;
    const r = outerRadius * 0.62;
    const x = cx + r * Math.cos(-midAngle * RAD);
    const y = cy + r * Math.sin(-midAngle * RAD);

    return (
      <text
        x={x}
        y={y}
        fill="#fff"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={14}
        fontWeight={800}
      >
        {((value / total) * 100).toFixed(2)}%
      </text>
    );
  };

/* =========================
   Leyenda reutilizable
========================= */
function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex justify-center gap-6 mt-4 text-sm font-medium">
      {items.map((i) => (
        <div key={i.label} className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: i.color }}
          />
          <span className="text-[#002E45]">{i.label}</span>
        </div>
      ))}
    </div>
  );
}
const renderTotalLabel = (props: any) => {
  const { x, y, width, value, payload } = props;

  const total =
    (payload.aprobados || 0) + (payload.reprobados || 0);

  if (!total) return null;

  return (
    <text
      x={x + width / 2}
      y={y - 8}
      textAnchor="middle"
      fill="#002E45"
      fontSize={16}
      fontWeight={800}
    >
      {total}
    </text>
  );
};

export default function DashboardResultadosGlobales({ data }: Props) {
  const {
    numero_estudiantes,
    total_inscritos,
    inscritos_primera_vez,
    inscritos_n_veces,
    aprobados_primera_vez,
    aprobados_n_veces,
    ausentes_primera_vez,
    ausentes_n_veces,
  } = data;

  /* =========================
     Cálculos (YA CORRECTOS)
  ========================= */
  const aprobados = clamp0(numero_estudiantes);
  const ausentes = clamp0(ausentes_primera_vez + ausentes_n_veces);
  const reprobados = clamp0(total_inscritos - aprobados - ausentes);
  const participantes = clamp0(aprobados + reprobados);

  const pieParticipacion = [
    { name: "Aprobados", value: aprobados },
    { name: "Reprobados", value: reprobados },
    { name: "Ausentes", value: ausentes },
  ];

  const pieAprobacion = [
    { name: "Aprobados", value: aprobados },
    { name: "Reprobados", value: reprobados },
  ];

  const barData = [
    {
      tipo: "Por primera vez",
      aprobados: aprobados_primera_vez,
      reprobados:
        inscritos_primera_vez -
        ausentes_primera_vez -
        aprobados_primera_vez,
    },
    {
      tipo: "Repetidores",
      aprobados: aprobados_n_veces,
      reprobados:
        inscritos_n_veces -
        ausentes_n_veces -
        aprobados_n_veces,
    },
  ];

  const renderBarLabel =
  (color: string, dataKey: "aprobados" | "reprobados") =>
  (props: any) => {
    const { x, y, width, height, payload } = props;

    const realValue = payload?.[dataKey];

    if (!realValue || height < 18) return null;

    return (
      <text
        x={x + width / 2}
        y={y + height / 2}
        fill={color}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={14}
        fontWeight={800}
      >
        {realValue}
      </text>
    );
  };

  return (
    
    <section className="relative space-y-24">
      

      {/* ================= PARTICIPACIÓN (TARJETAS) ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* INSCRITOS */}
        <div className="bg-[#002E45] text-white rounded-2xl p-8 flex flex-col justify-between">
          <p className="text-lg font-bold tracking-wide">INSCRITOS</p>

          <div className="flex items-center justify-between mt-6">
            <span className="text-6xl font-extrabold">
              {total_inscritos}
            </span>
            <img src={usersIcon} className="w-14 opacity-90" />
          </div>

          <p className="mt-4 text-sm opacity-80">
            Total de estudiantes registrados
          </p>
        </div>

        {/* PRESENTES */}
        <div className="bg-white border-2 border-[#002E45] text-[#002E45] rounded-2xl p-8 flex flex-col justify-between">
          <p className="text-lg font-bold tracking-wide">
            PRESENTARON EXAMEN
          </p>

          <div className="flex items-center justify-between mt-6">
            <span className="text-6xl font-extrabold text-[#FF6900]">
              {participantes}
            </span>
            <img src={bookIcon} className="w-14" />
          </div>

          <p className="mt-4 text-sm">
            Aprobados + Reprobados
          </p>
        </div>
        {/* LOGO FLOTANTE */}
        <img
          src={eLogo}
          alt="UNEMI"
          className="absolute -top-6 right-6 w-12 opacity-90"
        />
        {/* AUSENTES */}
        <div className="bg-[#F3F4F6] text-[#002E45] rounded-2xl p-8 flex flex-col justify-between">
          <p className="text-lg font-bold tracking-wide">AUSENTES</p>

          <div className="flex items-center justify-between mt-6">
            <span className="text-6xl font-extrabold">
              {ausentes}
            </span>
            <div
              className="w-14 h-14 rounded-full"
              style={{ backgroundColor: COLORS.ausente }}
            />
          </div>

          <p className="mt-4 text-sm">
            No se presentaron al examen
          </p>
        </div>

      </div>

      {/* ================= APROBACIÓN ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="flex flex-col items-center">
          <PieChart width={360} height={320}>
            <Pie
              data={pieAprobacion}
              cx="50%"
              cy="50%"
              outerRadius={140}
              dataKey="value"
              labelLine={false}
              label={renderLabelInside(participantes)}
            >
              <Cell fill={COLORS.aprobado} />
              <Cell fill={COLORS.reprobado} />
            </Pie>
          </PieChart>

          <Legend
            items={[
              { label: "Aprobados", color: COLORS.aprobado },
              { label: "Reprobados", color: COLORS.reprobado },
            ]}
          />
        </div>

        <div className="bg-[#002E45] text-white rounded-2xl p-10">
          <div className="flex items-center gap-6">
            <span className="text-7xl font-extrabold">
              {pct(aprobados, participantes)}
            </span>
            <img src={bookIcon} className="w-16" />
          </div>

          <p className="text-3xl font-extrabold text-[#FF6900] mt-2">
            APROBADOS
          </p>

          <div className="flex items-center gap-4 mt-8">
            <img src={usersIcon} className="w-12" />
            <span className="text-5xl font-extrabold">
              {participantes}
            </span>
            <span className="text-xl">Estudiantes participantes</span>
          </div>
        </div>
      </div>

      {/* ================= BARRAS + TABLA ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        <div className="lg:col-span-2 flex justify-center">
          <BarChart width={680} height={360} data={barData}>
            <XAxis dataKey="tipo" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="reprobados" stackId="a" fill={COLORS.reprobado}>
              <LabelList
                dataKey="reprobados"
                position="center"
                fill="#000"
                fontSize={14}
                fontWeight={800}
                formatter={(v: number) => (v > 0 ? v : "")}
              />
            </Bar>

            <Bar dataKey="aprobados" stackId="a" fill={COLORS.aprobado}>
              <LabelList
                dataKey="aprobados"
                position="center"
                fill="#fff"
                fontSize={14}
                fontWeight={800}
                formatter={(v: number) => (v > 0 ? v : "")}
              />
            </Bar>

          </BarChart>
        </div>

        {/* TABLA LATERAL */}
        <div className="space-y-6 text-[#002E45]">
        {/* INSCRITOS */}
        <div className="flex items-center gap-4">
            <span
            style={{
                fontFamily: "Arial",
                fontSize: "53.5px",
                fontWeight: 900,
                color: "#FF6900",
                lineHeight: 1,
            }}
            >
            {total_inscritos}
            </span>
            <span
            style={{
                fontFamily: "Arial",
                fontSize: "20.5px",
                fontWeight: 700,
                color: "#002E45",
                lineHeight: 1.2,
            }}
            >
            Estudiantes<br />inscritos
            </span>
        </div>

        {/* PARTICIPANTES */}
        <div className="flex items-center gap-4">
            <span
            style={{
                fontFamily: "Arial",
                fontSize: "53.5px",
                fontWeight: 900,
                color: "#FF6900",
                lineHeight: 1,
            }}
            >
            {participantes}
            </span>
            <span
            style={{
                fontFamily: "Arial",
                fontSize: "20.5px",
                fontWeight: 700,
                color: "#002E45",
                lineHeight: 1.2,
            }}
            >
            Estudiantes<br />participantes
            </span>
        </div>

        {/* DETALLE */}
        <div className="space-y-1">
            <p
            style={{
                fontFamily: "Lucida Sans, Arial, sans-serif",
                fontSize: "20px",
                fontWeight: 400,
                color: "#002E45",
            }}
            >
            Aprobados:{" "}
            <span style={{ fontFamily: "Arial", fontWeight: 700 }}>
                {aprobados}
            </span>
            </p>

            <p
            style={{
                fontFamily: "Lucida Sans, Arial, sans-serif",
                fontSize: "20px",
                fontWeight: 400,
                color: "#002E45",
            }}
            >
            Reprobados:{" "}
            <span style={{ fontFamily: "Arial", fontWeight: 700 }}>
                {reprobados}
            </span>
            </p>

            <p
            style={{
                fontFamily: "Lucida Sans, Arial, sans-serif",
                fontSize: "20px",
                fontWeight: 400,
                color: "#002E45",
            }}
            >
            Ausentes:{" "}
            <span style={{ fontFamily: "Arial", fontWeight: 700 }}>
                {ausentes}*
            </span>
            </p>
        </div>

        {/* NOTA */}
        <p
            style={{
            fontFamily: "Arial",
            fontSize: "12px",
            fontWeight: 700,
            color: "#002E45",
            maxWidth: "320px",
            lineHeight: 1.4,
            }}
        >
            *Los estudiantes ausentes no son considerados por el CACES al momento
            de calcular los porcentajes de resultados.
        </p>
        </div>
      </div>
    </section>
  );
}
