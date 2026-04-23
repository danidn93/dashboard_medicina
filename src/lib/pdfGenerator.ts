import jsPDF from "jspdf";

export interface ComponenteData {
  nombre: string;
  promedio: number;
  totalRespuestas?: number;
  totalAciertos?: number;
}

export interface DistribucionData {
  rango: string;
  frecuencia: number;
  porcentaje: number;
}

export interface PreguntaResumenData {
  numero_pregunta: number;
  enunciado: string;
  tema?: string;
  componente?: string;
  porcentaje: number;
}

export type ReportSectionBlock =
  | {
      type: "paragraph";
      text: string;
    }
  | {
      type: "subtitle";
      text: string;
    }
  | {
      type: "bullet";
      text: string;
    }
  | {
      type: "article";
      text: string;
    };

export type ReportCustomSection = {
  title: string;
  blocks: ReportSectionBlock[];
};

export interface ReporteData {
  carrera: string;
  periodo: string;
  totalEstudiantes: number;
  totalPreguntas: number;
  promedioGeneral: number;
  porcentajeAprobacion: number;
  aciertoGlobal: number;
  distribucionCalificaciones: DistribucionData[];
  componentes: ComponenteData[];
  preguntasDificiles: PreguntaResumenData[];
  preguntasFaciles: PreguntaResumenData[];
  conclusionesGeneradas?: string[];
  recomendacionesGeneradas?: string[];

  introduccionPersonalizada?: ReportCustomSection;
  antecedentesPersonalizados?: ReportCustomSection;
  motivacionJuridicaPersonalizada?: ReportCustomSection;
  metodologiaPersonalizada?: ReportCustomSection;
}

export interface ReporteImages {
  portada: string;
  header: string;
  footer: string;
}

const COLORES = {
  azulUnemi: [28, 50, 71] as [number, number, number],
  azulClaro: [60, 122, 160] as [number, number, number],
  gris: [100, 100, 100] as [number, number, number],
  grisClaro: [245, 245, 245] as [number, number, number],
  naranja: [255, 105, 0] as [number, number, number],
  rojo: [180, 35, 24] as [number, number, number],
  verde: [6, 118, 71] as [number, number, number],
};

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;

const MARGIN_LEFT = 20;
const MARGIN_RIGHT = 20;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

const FOOTER_HEIGHT = 7.9;
const TOP_Y = 40;
const BOTTOM_Y = PAGE_HEIGHT - FOOTER_HEIGHT - 14;

type PageState = {
  page: number;
};

type NumberedSection = ReportCustomSection & {
  numberedTitle: string;
  plainTitle: string;
};

const safeAddImage = (
  pdf: jsPDF,
  img: string | undefined,
  x: number,
  y: number,
  w: number,
  h: number
) => {
  if (!img) return;
  try {
    pdf.addImage(img, "PNG", x, y, w, h);
  } catch (err) {
    console.error("Error al insertar imagen:", err);
  }
};

const addHeader = (pdf: jsPDF, images: ReporteImages) => {
  safeAddImage(pdf, images.portada, 0, 0, 210.1, 29);
};

const addFooter = (
  pdf: jsPDF,
  images: ReporteImages,
  pageNumber: number,
  totalPages: number
) => {
  if (pageNumber <= 2) return;

  safeAddImage(
    pdf,
    images.footer,
    0,
    PAGE_HEIGHT - FOOTER_HEIGHT,
    210.1,
    FOOTER_HEIGHT
  );

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(...COLORES.gris);
  pdf.text(
    `Página ${pageNumber} de ${totalPages}`,
    PAGE_WIDTH - 20,
    PAGE_HEIGHT - 12,
    { align: "right" }
  );
};

const startNewPage = (
  pdf: jsPDF,
  images: ReporteImages,
  pageState: PageState
) => {
  pdf.addPage();
  pageState.page += 1;
  addHeader(pdf, images);
  return TOP_Y;
};

const ensureLineSpace = (
  pdf: jsPDF,
  y: number,
  lineHeight: number,
  images: ReporteImages,
  pageState: PageState
) => {
  if (y + lineHeight <= BOTTOM_Y) return y;
  return startNewPage(pdf, images, pageState);
};

const ensureBlockSpace = (
  pdf: jsPDF,
  y: number,
  neededHeight: number,
  images: ReporteImages,
  pageState: PageState
) => {
  if (y + neededHeight <= BOTTOM_Y) return y;
  return startNewPage(pdf, images, pageState);
};

const drawJustifiedLine = (
  pdf: jsPDF,
  line: string,
  x: number,
  y: number,
  maxWidth: number,
  justify: boolean
) => {
  if (!justify) {
    pdf.text(line, x, y);
    return;
  }

  const words = line.split(" ");
  if (words.length <= 1) {
    pdf.text(line, x, y);
    return;
  }

  const lineWithoutSpaces = words.join("");
  const textWidth = pdf.getTextWidth(lineWithoutSpaces);
  const totalSpaces = words.length - 1;
  const extraSpace = (maxWidth - textWidth) / totalSpaces;

  let cursorX = x;
  words.forEach((word, idx) => {
    pdf.text(word, cursorX, y);
    cursorX += pdf.getTextWidth(word);
    if (idx < words.length - 1) cursorX += extraSpace;
  });
};

const isListLikeLine = (line: string) => {
  const trimmed = line.trim();
  return /^([•\-–—]\s+|\d+[\.\)]\s+|[a-zA-Z][\.\)]\s+)/.test(trimmed);
};

const drawParagraph = (
  pdf: jsPDF,
  text: string,
  y: number,
  images: ReporteImages,
  pageState: PageState,
  options?: {
    x?: number;
    maxWidth?: number;
    fontSize?: number;
    lineHeight?: number;
    fontStyle?: "normal" | "bold" | "italic" | "bolditalic";
    color?: [number, number, number];
    spaceAfter?: number;
  }
) => {
  const x = options?.x ?? MARGIN_LEFT;
  const maxWidth = options?.maxWidth ?? CONTENT_WIDTH;
  const fontSize = options?.fontSize ?? 11;
  const lineHeight = options?.lineHeight ?? 5;
  const fontStyle = options?.fontStyle ?? "normal";
  const color = options?.color ?? ([0, 0, 0] as [number, number, number]);
  const spaceAfter = options?.spaceAfter ?? 4;

  pdf.setFont("helvetica", fontStyle);
  pdf.setFontSize(fontSize);
  pdf.setTextColor(...color);

  const rawLines = String(text ?? "").split(/\n/);
  const lines: string[] = [];

  rawLines.forEach((raw) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      lines.push("");
      return;
    }
    const wrapped = pdf.splitTextToSize(trimmed, maxWidth) as string[];
    wrapped.forEach((w) => lines.push(w));
  });

  lines.forEach((line, index) => {
    y = ensureLineSpace(pdf, y, lineHeight, images, pageState);

    if (!line.trim()) {
      y += lineHeight * 0.6;
      return;
    }

    const isLastLine = index === lines.length - 1;
    const justify = !isLastLine && !isListLikeLine(line);
    drawJustifiedLine(pdf, line, x, y, maxWidth, justify);
    y += lineHeight;
  });

  return y + spaceAfter;
};

const drawSectionTitle = (
  pdf: jsPDF,
  title: string,
  y: number,
  images: ReporteImages,
  pageState: PageState
) => {
  const safeTitle = String(title ?? "").trim();
  if (!safeTitle) return y;

  y += 4;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(...COLORES.azulUnemi);

  const lines = pdf.splitTextToSize(safeTitle, CONTENT_WIDTH) as string[];
  const lineHeight = 7;
  const blockHeight = lines.length * lineHeight;

  y = ensureBlockSpace(pdf, y, blockHeight + 2, images, pageState);

  lines.forEach((line, index) => {
    pdf.text(line, MARGIN_LEFT, y + index * lineHeight);
  });

  return y + blockHeight + 1;
};

const drawSubsectionTitle = (
  pdf: jsPDF,
  title: string,
  y: number,
  images: ReporteImages,
  pageState: PageState
) => {
  const safeTitle = String(title ?? "").trim();
  if (!safeTitle) return y;

  y += 3;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.setTextColor(...COLORES.azulUnemi);

  const lines = pdf.splitTextToSize(safeTitle, CONTENT_WIDTH) as string[];
  const lineHeight = 6;
  const blockHeight = lines.length * lineHeight;

  y = ensureBlockSpace(pdf, y, blockHeight + 2, images, pageState);

  lines.forEach((line, index) => {
    pdf.text(line, MARGIN_LEFT, y + index * lineHeight);
  });

  return y + blockHeight + 1;
};

const drawBulletList = (
  pdf: jsPDF,
  items: string[],
  y: number,
  images: ReporteImages,
  pageState: PageState,
  options?: {
    x?: number;
    bulletX?: number;
    maxWidth?: number;
    fontSize?: number;
    lineHeight?: number;
    spaceBetween?: number;
  }
) => {
  const x = options?.x ?? 25;
  const bulletX = options?.bulletX ?? 20;
  const maxWidth = options?.maxWidth ?? 160;
  const fontSize = options?.fontSize ?? 11;
  const lineHeight = options?.lineHeight ?? 5;
  const spaceBetween = options?.spaceBetween ?? 2;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(fontSize);
  pdf.setTextColor(0, 0, 0);

  for (const item of items) {
    const blocks = String(item ?? "").split(/\n/);
    let firstRendered = true;

    for (const block of blocks) {
      const trimmed = block.trim();
      if (!trimmed) {
        y += lineHeight * 0.6;
        continue;
      }

      const wrapped = pdf.splitTextToSize(trimmed, maxWidth) as string[];

      for (let i = 0; i < wrapped.length; i++) {
        y = ensureLineSpace(pdf, y, lineHeight, images, pageState);

        if (firstRendered && i === 0) {
          pdf.text("•", bulletX, y);
        }

        const isLastLine = i === wrapped.length - 1;
        const justify = !isLastLine && !isListLikeLine(wrapped[i]);
        drawJustifiedLine(pdf, wrapped[i], x, y, maxWidth, justify);
        y += lineHeight;
      }

      firstRendered = false;
    }

    y += spaceBetween;
  }

  return y;
};

const drawLegalSection = (
  pdf: jsPDF,
  title: string,
  articles: string[],
  y: number,
  images: ReporteImages,
  pageState: PageState
) => {
  const getLegalPrefixMatch = (value: string) => {
    return value.match(
      /^(Art\.\s*\d+\.-|Artículo\s+\d+\.-|Política\s+\d+\.-|Lineamiento\s+\d+\.-)\s*(.*)$/i
    );
  };

  if (title.trim()) {
    y = drawParagraph(pdf, title, y, images, pageState, {
      fontStyle: "bold",
      fontSize: 11,
      color: COLORES.azulUnemi,
      spaceAfter: 3,
    });
  }

  for (const article of articles) {
    const match = getLegalPrefixMatch(article);
    const articleLabel = match?.[1] ?? "";
    const articleText = match?.[2] ?? article;

    const textX = 32;
    const availableWidth = PAGE_WIDTH - MARGIN_RIGHT - textX;

    y = ensureLineSpace(pdf, y, 5, images, pageState);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    pdf.text("•", 20, y);

    if (articleLabel) {
      pdf.setFont("helvetica", "bold");
      pdf.text(articleLabel, 25, y);

      const labelWidth = pdf.getTextWidth(articleLabel + " ");
      const firstLineX = 25 + labelWidth;
      const firstLineWidth = PAGE_WIDTH - MARGIN_RIGHT - firstLineX;
      const firstLines = pdf.splitTextToSize(articleText, firstLineWidth) as string[];

      pdf.setFont("helvetica", "normal");

      if (firstLines.length > 0) {
        drawJustifiedLine(
          pdf,
          firstLines[0],
          firstLineX,
          y,
          firstLineWidth,
          firstLines.length > 1
        );
        y += 5;
      }

      const remainingText = firstLines.slice(1).join(" ").trim();

      if (remainingText) {
        const restLines = pdf.splitTextToSize(remainingText, availableWidth) as string[];
        for (let i = 0; i < restLines.length; i++) {
          y = ensureLineSpace(pdf, y, 5, images, pageState);
          const isLast = i === restLines.length - 1;
          drawJustifiedLine(pdf, restLines[i], textX, y, availableWidth, !isLast);
          y += 5;
        }
      }
    } else {
      const lines = pdf.splitTextToSize(
        articleText,
        PAGE_WIDTH - MARGIN_RIGHT - 25
      ) as string[];

      for (let i = 0; i < lines.length; i++) {
        y = ensureLineSpace(pdf, y, 5, images, pageState);
        const isLast = i === lines.length - 1;
        drawJustifiedLine(
          pdf,
          lines[i],
          25,
          y,
          PAGE_WIDTH - MARGIN_RIGHT - 25,
          !isLast
        );
        y += 5;
      }
    }

    y += 2;
  }

  return y + 2;
};

const normalizeDistribucion = (data: DistribucionData[]): DistribucionData[] => {
  const rangosBase = ["0-49", "50-69", "70-84", "85-100", "Sin nota"];

  return rangosBase.map((rango) => {
    const found = data.find(
      (item) => item.rango.trim().toLowerCase() === rango.toLowerCase()
    );

    return {
      rango,
      frecuencia: found?.frecuencia ?? 0,
      porcentaje: found?.porcentaje ?? 0,
    };
  });
};

const getPerformanceColorPdf = (value: number): [number, number, number] => {
  const v = Math.max(0, Math.min(100, value));

  if (v <= 30) {
    const t = v / 30;
    const r = Math.round(180 + (220 - 180) * t);
    const g = Math.round(35 + (65 - 35) * t);
    const b = Math.round(24 + (50 - 24) * t);
    return [r, g, b];
  }

  if (v <= 50) {
    const t = (v - 30) / 20;
    const r = Math.round(220 + (247 - 220) * t);
    const g = Math.round(65 + (144 - 65) * t);
    const b = Math.round(50 + (9 - 50) * t);
    return [r, g, b];
  }

  if (v <= 70) {
    const t = (v - 50) / 20;
    const r = Math.round(247 + (56 - 247) * t);
    const g = Math.round(144 + (142 - 144) * t);
    const b = Math.round(9 + (60 - 9) * t);
    return [r, g, b];
  }

  const t = (v - 70) / 30;
  const r = Math.round(56 + (6 - 56) * t);
  const g = Math.round(142 + (118 - 142) * t);
  const b = Math.round(60 + (71 - 60) * t);
  return [r, g, b];
};

const drawCellTextCentered = (
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
  w: number,
  h: number,
  fontSize = 10
) => {
  pdf.setFontSize(fontSize);
  const lines = pdf.splitTextToSize(text, w - 6) as string[];
  const lineHeight = 4;
  const textBlockHeight = lines.length * lineHeight;
  const startY = y + (h - textBlockHeight) / 2 + 3.2;

  lines.forEach((line, idx) => {
    pdf.text(line, x + w / 2, startY + idx * lineHeight, { align: "center" });
  });
};

const drawTableHeader = (
  pdf: jsPDF,
  headers: string[],
  colWidths: number[],
  startX: number,
  y: number,
  headerHeight = 12,
  fontSize = 10
) => {
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);

  pdf.setFillColor(...COLORES.azulUnemi);
  pdf.rect(startX, y, totalWidth, headerHeight, "F");

  pdf.setDrawColor(0, 0, 0);
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");

  let x = startX;
  headers.forEach((header, i) => {
    pdf.rect(x, y, colWidths[i], headerHeight);
    drawCellTextCentered(pdf, header, x, y, colWidths[i], headerHeight, fontSize);
    x += colWidths[i];
  });

  return y + headerHeight;
};

const drawSubsectionTitleWithTableGuard = (
  pdf: jsPDF,
  title: string,
  y: number,
  minTableHeight: number,
  images: ReporteImages,
  pageState: PageState
) => {
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);

  const lines = pdf.splitTextToSize(String(title ?? "").trim(), CONTENT_WIDTH) as string[];
  const titleHeight = lines.length * 6 + 2;
  const required = titleHeight + 12 + minTableHeight;

  if (y + required > BOTTOM_Y) {
    y = startNewPage(pdf, images, pageState);
  }

  return drawSubsectionTitle(pdf, title, y, images, pageState);
};

const drawDistribucionTable = (
  pdf: jsPDF,
  data: DistribucionData[],
  y: number,
  images: ReporteImages,
  pageState: PageState
) => {
  const normalizedData = normalizeDistribucion(data);

  const colWidths = [78, 56, 46];
  const headerHeight = 12;
  const rowHeight = 10;
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  const startX = (PAGE_WIDTH - totalWidth) / 2;
  const headers = [
    "Rango de calificación",
    "Frecuencia (f)",
    "Porcentaje (%)",
  ];

  const ensureTableHeaderSpace = () => {
    if (y + headerHeight + rowHeight > BOTTOM_Y) {
      y = startNewPage(pdf, images, pageState);
    }
  };

  const drawHeaderRow = () => {
    ensureTableHeaderSpace();
    y = drawTableHeader(pdf, headers, colWidths, startX, y, headerHeight, 10);
  };

  drawHeaderRow();

  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(0, 0, 0);

  normalizedData.forEach((row, idx) => {
    if (y + rowHeight > BOTTOM_Y) {
      y = startNewPage(pdf, images, pageState);
      drawHeaderRow();
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(0, 0, 0);
    }

    let xRow = startX;

    if (idx % 2 === 0) {
      pdf.setFillColor(...COLORES.grisClaro);
      pdf.rect(startX, y, totalWidth, rowHeight, "F");
    }

    const values = [
      row.rango,
      String(row.frecuencia),
      `${row.porcentaje.toFixed(1)}%`,
    ];

    values.forEach((value, i) => {
      pdf.rect(xRow, y, colWidths[i], rowHeight);
      drawCellTextCentered(pdf, value, xRow, y, colWidths[i], rowHeight, 10);
      xRow += colWidths[i];
    });

    y += rowHeight;
  });

  return y + 4;
};

const drawBarChart = (
  pdf: jsPDF,
  title: string,
  items: ComponenteData[],
  y: number,
  images: ReporteImages,
  pageState: PageState
) => {
  const sortedItems = [...items].sort((a, b) => b.promedio - a.promedio);

  const chartHeight = 70;
  const chartWidth = 170;
  const chartX = 20;

  const labelAreaHeight = 28;
  const totalBlockHeight = 10 + chartHeight + labelAreaHeight + 18;

  y = ensureBlockSpace(pdf, y, totalBlockHeight, images, pageState);
  y = drawSubsectionTitle(pdf, title, y, images, pageState);

  const baseY = y + chartHeight;
  const maxValue = 100;

  const leftAxisWidth = 14;
  const usableWidth = chartWidth - leftAxisWidth;
  const gap = 6;
  const barCount = sortedItems.length || 1;
  const barWidth = Math.max(16, (usableWidth - gap * (barCount - 1)) / barCount);

  pdf.setDrawColor(210, 215, 223);
  pdf.setLineWidth(0.3);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...COLORES.gris);

  [0, 25, 50, 75, 100].forEach((tick) => {
    const tickY = baseY - (tick / maxValue) * chartHeight;
    pdf.line(chartX + leftAxisWidth, tickY, chartX + chartWidth, tickY);
    pdf.text(String(tick), chartX + leftAxisWidth - 2, tickY + 1.5, {
      align: "right",
    });
  });

  pdf.setDrawColor(...COLORES.azulUnemi);
  pdf.setLineWidth(0.5);
  pdf.line(chartX + leftAxisWidth, y, chartX + leftAxisWidth, baseY);
  pdf.line(chartX + leftAxisWidth, baseY, chartX + chartWidth, baseY);

  sortedItems.forEach((item, index) => {
    const value = Math.max(0, Math.min(100, item.promedio));
    const barHeight = (value / maxValue) * chartHeight;

    const x = chartX + leftAxisWidth + index * (barWidth + gap);
    const barY = baseY - barHeight;

    const color = getPerformanceColorPdf(value);

    pdf.setFillColor(232, 236, 242);
    pdf.roundedRect(x, baseY - chartHeight, barWidth, chartHeight, 2, 2, "F");

    pdf.setFillColor(...color);
    pdf.roundedRect(x + 1.2, barY, barWidth - 2.4, barHeight, 2, 2, "F");

    pdf.setFillColor(...COLORES.azulUnemi);
    const pillText = `${value.toFixed(2)}%`;
    const pillWidth = Math.max(18, pdf.getTextWidth(pillText) + 8);
    const pillX = x + barWidth / 2 - pillWidth / 2;
    const pillY = y - 2;

    pdf.roundedRect(pillX, pillY, pillWidth, 8, 4, 4, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text(pillText, x + barWidth / 2, pillY + 5.4, { align: "center" });

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(...COLORES.azulUnemi);

    const nombreLineas = pdf.splitTextToSize(item.nombre, barWidth + 8) as string[];
    const nombreY = baseY + 6;
    nombreLineas.slice(0, 3).forEach((line, lineIdx) => {
      pdf.text(line, x + barWidth / 2, nombreY + lineIdx * 4, {
        align: "center",
      });
    });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...COLORES.gris);

    const infoStartY = baseY + 6 + Math.min(nombreLineas.length, 3) * 4 + 2;
    pdf.text(`Resp.: ${item.totalRespuestas ?? 0}`, x + barWidth / 2, infoStartY, {
      align: "center",
    });
    pdf.text(
      `Aciertos: ${item.totalAciertos ?? 0}`,
      x + barWidth / 2,
      infoStartY + 4,
      { align: "center" }
    );
  });

  return baseY + labelAreaHeight + 10;
};

const drawPreguntasDificilesTable = (
  pdf: jsPDF,
  data: PreguntaResumenData[],
  y: number,
  images: ReporteImages,
  pageState: PageState
) => {
  const rows = data.slice(0, 10);

  const startX = 20;
  const colWidths = [82, 42, 36, 20];
  const headerHeight = 12;
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  const headers = ["Pregunta", "Tema", "Componente", "%"];

  const estimateRowHeight = (row: PreguntaResumenData) => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);

    const preguntaText = row.enunciado || "Sin enunciado";
    const temaText = row.tema || "Sin tema";
    const componenteText = row.componente || "Sin componente";
    const porcentajeText = `${row.porcentaje.toFixed(2)}%`;

    const lineCounts = [
      (pdf.splitTextToSize(preguntaText, colWidths[0] - 6) as string[]).length,
      (pdf.splitTextToSize(temaText, colWidths[1] - 6) as string[]).length,
      (pdf.splitTextToSize(componenteText, colWidths[2] - 6) as string[]).length,
      (pdf.splitTextToSize(porcentajeText, colWidths[3] - 6) as string[]).length,
    ];

    return Math.max(12, Math.max(...lineCounts) * 4 + 4);
  };

  const firstRowHeight = rows.length ? estimateRowHeight(rows[0]) : 12;

  const drawHeaderRow = () => {
    if (y + headerHeight + firstRowHeight > BOTTOM_Y) {
      y = startNewPage(pdf, images, pageState);
    }
    y = drawTableHeader(pdf, headers, colWidths, startX, y, headerHeight, 9);
  };

  drawHeaderRow();

  pdf.setTextColor(0, 0, 0);
  pdf.setFont("helvetica", "normal");

  rows.forEach((row, idx) => {
    const rowHeight = estimateRowHeight(row);

    if (y + rowHeight > BOTTOM_Y) {
      y = startNewPage(pdf, images, pageState);
      drawHeaderRow();
      pdf.setTextColor(0, 0, 0);
      pdf.setFont("helvetica", "normal");
    }

    if (idx % 2 === 0) {
      pdf.setFillColor(...COLORES.grisClaro);
      pdf.rect(startX, y, totalWidth, rowHeight, "F");
    }

    const values = [
      row.enunciado || "Sin enunciado",
      row.tema || "Sin tema",
      row.componente || "Sin componente",
      `${row.porcentaje.toFixed(2)}%`,
    ];

    let xRow = startX;
    values.forEach((value, i) => {
      pdf.rect(xRow, y, colWidths[i], rowHeight);
      drawCellTextCentered(pdf, value, xRow, y, colWidths[i], rowHeight, 9);
      xRow += colWidths[i];
    });

    y += rowHeight;
  });

  return y + 4;
};

const drawSignaturesNearEnd = (
  pdf: jsPDF,
  y: number,
  images: ReporteImages,
  pageState: PageState
) => {
  const minGapAfterContent = 35;
  const signaturesHeight = 22;

  y += minGapAfterContent;

  if (y + signaturesHeight > BOTTOM_Y) {
    y = startNewPage(pdf, images, pageState);
    y += 25;
  }

  const margin = 18;
  const contentWidth = PAGE_WIDTH - 2 * margin;
  const columnWidth = contentWidth / 3;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(3, 46, 69);

  const textY = y;

  const firma1Text = pdf.splitTextToSize(
    "Asistente de Evaluación y Acreditación Institucional",
    columnWidth - 8
  );
  pdf.text(firma1Text, margin + columnWidth / 2, textY, { align: "center" });

  const firma2Text = pdf.splitTextToSize(
    "Analista de Evaluación y Acreditación Institucional",
    columnWidth - 8
  );
  pdf.text(
    firma2Text,
    margin + columnWidth + columnWidth / 2,
    textY,
    { align: "center" }
  );

  const firma3Text = pdf.splitTextToSize(
    "Director de Aseguramiento de la Calidad (E)",
    columnWidth - 8
  );
  pdf.text(
    firma3Text,
    margin + 2 * columnWidth + columnWidth / 2,
    textY,
    { align: "center" }
  );

  return y + signaturesHeight;
};

const estimateParagraphHeight = (
  pdf: jsPDF,
  text: string,
  fontSize = 11,
  lineHeight = 5,
  maxWidth = CONTENT_WIDTH
) => {
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(fontSize);
  const lines = pdf.splitTextToSize(text, maxWidth) as string[];
  return lines.length * lineHeight + 4;
};

const stripSectionNumber = (title: string) =>
  String(title ?? "")
    .replace(/^\s*\d+(\.\d+)*\.?\s*/, "")
    .trim();

const estimateSectionHeight = (
  pdf: jsPDF,
  section: ReportCustomSection | NumberedSection
) => {
  let total = 16;

  pdf.setFont("helvetica", "bold");

  for (const block of section.blocks) {
    const text = String(block.text ?? "").trim();
    if (!text) continue;

    if (block.type === "subtitle") {
      pdf.setFontSize(13);
      const lines = pdf.splitTextToSize(text, CONTENT_WIDTH) as string[];
      total += lines.length * 6 + 2;
    } else {
      total += estimateParagraphHeight(pdf, text, 11, 5);
    }
  }

  return total;
};

const getDefaultIntroduccionSection = (data: ReporteData): ReportCustomSection => ({
  title: "Introducción",
  blocks: [
    {
      type: "paragraph",
      text: `La formación de profesionales de la salud en la Universidad Estatal de Milagro (UNEMI) demanda un proceso de evaluación riguroso, sistemático y alineado con los estándares de calidad establecidos a nivel nacional. En este contexto, el presente informe detalla los resultados de la Evaluación de Resultados de Aprendizaje aplicada a los estudiantes de séptimo nivel de la carrera de ${data.carrera}, quienes se encuentran en una etapa avanzada de su formación académica.`,
    },
    {
      type: "paragraph",
      text: "Este proceso evaluativo adquiere un carácter estratégico, dado que se fundamenta en la estructura del Examen de Habilitación para el Ejercicio Profesional (EHEP). Al integrar los componentes de Medicina Interna, Salud Mental, Salud Pública y Bioética definidos por el Consejo de Aseguramiento de la Calidad de la Educación Superior (CACES), la evaluación no solo permite medir la adquisición de conocimientos teóricos, sino que se constituye en un indicador institucional de la capacidad de respuesta de los estudiantes frente a las exigencias del ente regulador.",
    },
    {
      type: "paragraph",
      text: "Asimismo, este ejercicio evaluativo se enmarca en la creciente demanda de profesionales médicos competentes, capaces de responder a las necesidades del sistema de salud ecuatoriano, caracterizado por desafíos epidemiológicos, sociales y demográficos que requieren una atención integral, oportuna y de calidad.",
    },
    {
      type: "paragraph",
      text: "El análisis presentado tiene como propósito identificar tanto las fortalezas académicas como, principalmente, las brechas de aprendizaje que requieren una intervención pedagógica oportuna. El objetivo final es asegurar que el futuro médico formado en la UNEMI cumpla con el perfil de egreso institucional, logre la habilitación profesional y esté plenamente capacitado para brindar una atención en salud segura, ética y basada en evidencia, en beneficio de la sociedad ecuatoriana.",
    },
  ],
});

const getDefaultAntecedentesSection = (): ReportCustomSection => ({
  title: "Antecedentes",
  blocks: [
    {
      type: "paragraph",
      text: "La presente evaluación se enmarca en las políticas institucionales de aseguramiento de la calidad de la Universidad Estatal de Milagro (UNEMI), cuyo propósito es garantizar la mejora continua de los procesos académicos y el cumplimiento de los estándares establecidos en el sistema de educación superior.",
    },
    {
      type: "paragraph",
      text: "Un elemento fundamental en el diseño del instrumento es su orientación hacia la preparación para el Examen de Habilitación para el Ejercicio Profesional (EHEP). En este sentido, la evaluación fue estructurada conforme a los estándares técnicos y de contenido establecidos por el CACES.",
    },
    {
      type: "paragraph",
      text: "El 5 de febrero de 2026 se desarrolló una sesión de trabajo con el Vicerrectorado Académico de Formación de Grado, en la cual se presentó formalmente el Proyecto de Evaluación de Resultados de Aprendizaje. De manera previa a la aplicación de la evaluación, la Dirección de Aseguramiento de la Calidad llevó a cabo una revisión exhaustiva de los sílabos correspondientes desde el primer hasta el sexto nivel de formación.",
    },
  ],
});

const getDefaultMotivacionJuridicaSection = (): ReportCustomSection => ({
  title: "Motivación Jurídica",
  blocks: [
    {
      type: "subtitle",
      text: "CONSTITUCIÓN DE LA REPÚBLICA DEL ECUADOR",
    },
    {
      type: "article",
      text: "Art. 345.- La educación como servicio público se prestará a través de instituciones públicas, fiscomisionales y particulares.",
    },
    {
      type: "article",
      text: "Art. 350.- El sistema de educación superior tiene como finalidad la formación académica y profesional con visión científica y humanista.",
    },
    {
      type: "article",
      text: "Art. 351.- El Sistema de Educación Superior se regirá por los principios de calidad, pertinencia, integralidad y producción del conocimiento.",
    },
    {
      type: "subtitle",
      text: "LEY ORGÁNICA DE EDUCACIÓN SUPERIOR (LOES)",
    },
    {
      type: "article",
      text: "Art. 94.- El Sistema Interinstitucional de Aseguramiento de la Calidad tiene por objeto garantizar el cumplimiento del principio de calidad.",
    },
    {
      type: "article",
      text: "Art. 103.- Se establecerán exámenes u otros mecanismos de evaluación dirigidos a estudiantes de los últimos períodos académicos.",
    },
  ],
});

const getDefaultMetodologiaSection = (data: ReporteData): ReportCustomSection => ({
  title: "Metodología",
  blocks: [
    {
      type: "paragraph",
      text: "El proceso de evaluación de los Resultados de Aprendizaje (RA) se fundamenta en un enfoque cuantitativo de alcance descriptivo. La metodología aplicada asegura que el instrumento no solo mida conocimientos, sino que actúe como un indicador de desempeño predictivo frente a las exigencias de la habilitación profesional nacional.",
    },
    {
      type: "subtitle",
      text: "4.1. Diseño y Estructura del Instrumento",
    },
    {
      type: "bullet",
      text: "Nivel de Complejidad: reactivos de opción múltiple con formato de caso clínico.",
    },
    {
      type: "bullet",
      text: "Componentes evaluados: Medicina Interna, Salud Mental, Salud Pública y Bioética.",
    },
    {
      type: "subtitle",
      text: "4.2. Aplicación del Instrumento y Población",
    },
    {
      type: "paragraph",
      text: `La prueba fue administrada a ${data.totalEstudiantes} estudiantes de séptimo nivel de la carrera de ${data.carrera}, bajo condiciones controladas, garantizando la estandarización del proceso evaluativo. La evaluación constó de ${data.totalPreguntas} preguntas y fue calificada sobre 100 puntos.`,
    },
    {
      type: "subtitle",
      text: "4.3. Criterios de Calificación y Análisis Estadístico",
    },
    {
      type: "paragraph",
      text: `Los resultados evidencian un promedio general de ${data.promedioGeneral.toFixed(
        1
      )} puntos, un porcentaje de aprobación de ${data.porcentajeAprobacion.toFixed(
        1
      )}% y un acierto global de ${data.aciertoGlobal.toFixed(
        1
      )}%. En términos generales, se observa una predominancia de niveles de desempeño intermedio, con baja representación en los niveles más altos, lo que sugiere la necesidad de fortalecer las competencias evaluadas.`,
    },
  ],
});

const buildOrderedSections = (data: ReporteData): NumberedSection[] => {
  const introduccionSection =
    data.introduccionPersonalizada ?? getDefaultIntroduccionSection(data);
  const antecedentesSection =
    data.antecedentesPersonalizados ?? getDefaultAntecedentesSection();
  const motivacionSection =
    data.motivacionJuridicaPersonalizada ?? getDefaultMotivacionJuridicaSection();
  const metodologiaSection =
    data.metodologiaPersonalizada ?? getDefaultMetodologiaSection(data);

  const baseSections = [
    introduccionSection,
    antecedentesSection,
    motivacionSection,
    metodologiaSection,
  ].filter(
    (section): section is ReportCustomSection =>
      !!section &&
      !!String(section.title ?? "").trim() &&
      Array.isArray(section.blocks) &&
      section.blocks.some((b) => String(b.text ?? "").trim())
  );

  return baseSections.map((section, index) => {
    const plainTitle = stripSectionNumber(section.title);
    return {
      ...section,
      plainTitle,
      numberedTitle: `${index + 1}. ${plainTitle}`,
    };
  });
};

const drawDynamicSection = (
  pdf: jsPDF,
  section: NumberedSection | ReportCustomSection | undefined,
  y: number,
  images: ReporteImages,
  pageState: PageState,
  options?: {
    drawTitle?: boolean;
  }
) => {
  if (!section) return y;

  const drawTitle = options?.drawTitle ?? true;
  const titleToDraw =
    "numberedTitle" in section
      ? section.numberedTitle
      : stripSectionNumber(section.title);

  if (drawTitle && titleToDraw.trim()) {
    y = drawSectionTitle(pdf, titleToDraw, y, images, pageState);
  }

  const bulletBuffer: string[] = [];

  const flushBullets = () => {
    if (bulletBuffer.length) {
      y = drawBulletList(pdf, bulletBuffer, y, images, pageState);
      bulletBuffer.length = 0;
    }
  };

  for (const block of section.blocks) {
    const text = String(block.text ?? "").trim();
    if (!text) continue;

    if (block.type !== "bullet") {
      flushBullets();
    }

    if (block.type === "paragraph") {
      y = drawParagraph(pdf, text, y, images, pageState);
      continue;
    }

    if (block.type === "subtitle") {
      y = drawSubsectionTitle(pdf, text, y, images, pageState);
      continue;
    }

    if (block.type === "bullet") {
      bulletBuffer.push(text);
      continue;
    }

    if (block.type === "article") {
      y = drawLegalSection(pdf, "", [text], y, images, pageState);
      continue;
    }
  }

  flushBullets();
  return y;
};

const drawCoverPage = (
  pdf: jsPDF,
  data: ReporteData,
  images: ReporteImages
) => {
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, "F");

  let imageX = 0;
  let imageY = 0;
  let imageW = PAGE_WIDTH;
  let imageH = 0;

  if (images.header) {
    try {
      const imgProps = pdf.getImageProperties(images.header);
      const aspectRatio = imgProps.width / imgProps.height;

      imageW = PAGE_WIDTH;
      imageH = imageW / aspectRatio;

      safeAddImage(pdf, images.header, imageX, imageY, imageW, imageH);
    } catch (error) {
      console.error("No se pudieron obtener las propiedades de la imagen de portada:", error);
    }
  }

  const textMaxWidth = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
  let currentY = imageY + imageH + 20;

  pdf.setTextColor(...COLORES.azulUnemi);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);

  const titulo = "INFORME DE EVALUACIÓN DE RESULTADOS DE APRENDIZAJE";
  const tituloLines = pdf.splitTextToSize(titulo, textMaxWidth) as string[];
  pdf.text(tituloLines, PAGE_WIDTH / 2, currentY, { align: "center" });

  currentY += tituloLines.length * 8 + 8;

  pdf.setFontSize(18);
  const subtitulo = `"CARRERA DE ${String(data.carrera ?? "").toUpperCase()}"`;
  const subtitleLines = pdf.splitTextToSize(subtitulo, textMaxWidth) as string[];
  pdf.text(subtitleLines, PAGE_WIDTH / 2, currentY, { align: "center" });

  const footerBandHeight = 24;
  pdf.setFillColor(...COLORES.azulUnemi);
  pdf.rect(0, PAGE_HEIGHT - footerBandHeight, PAGE_WIDTH, footerBandHeight, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(12.5);
  pdf.text(
    "Dirección de Aseguramiento de la Calidad",
    PAGE_WIDTH / 2,
    PAGE_HEIGHT - 10,
    { align: "center" }
  );
};

export const generarReportePDF = async (
  data: ReporteData,
  images: ReporteImages
) => {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageState: PageState = { page: 1 };

  const orderedSections = buildOrderedSections(data);
  const introSection = orderedSections[0];
  const remainingSections = orderedSections.slice(1);

  drawCoverPage(pdf, data, images);

  pdf.addPage();
  pageState.page = 2;
  addHeader(pdf, images);

  let y = 50;

  pdf.setTextColor(...COLORES.azulUnemi);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(24);
  pdf.text("Índice", 20, y);

  const indiceX = PAGE_WIDTH / 2;
  let indiceY = y;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);

  const indexItems = [
    ...orderedSections.map((section) => section.numberedTitle),
    `${orderedSections.length + 1}. Resultados`,
    `${orderedSections.length + 2}. Conclusiones`,
    `${orderedSections.length + 3}. Recomendaciones`,
  ];

  indexItems.forEach((item) => {
    pdf.text(item, indiceX, indiceY);
    indiceY += 10;
  });

  if (introSection) {
    pdf.addPage();
    pageState.page = 3;
    addHeader(pdf, images);

    const introHeight =
      8 + estimateSectionHeight(pdf, introSection);

    y = Math.max(TOP_Y, (BOTTOM_Y + TOP_Y - introHeight) / 2);
    y = drawDynamicSection(pdf, introSection, y, images, pageState, {
      drawTitle: true,
    });
  }

  if (remainingSections.length) {
    pdf.addPage();
    pageState.page += 1;
    addHeader(pdf, images);
    y = TOP_Y;

    remainingSections.forEach((section) => {
      y = drawDynamicSection(pdf, section, y, images, pageState, {
        drawTitle: true,
      });
    });
  } else if (!introSection) {
    pdf.addPage();
    pageState.page += 1;
    addHeader(pdf, images);
    y = TOP_Y;
  } else {
    y = startNewPage(pdf, images, pageState);
  }

  y = drawSectionTitle(
    pdf,
    `${orderedSections.length + 1}. Resultados`,
    y,
    images,
    pageState
  );

  y = drawParagraph(
    pdf,
    "A continuación, se presentan los resultados consolidados de la evaluación, tanto en términos de distribución de calificaciones como del rendimiento por componentes evaluados.",
    y,
    images,
    pageState
  );

  y = drawSubsectionTitleWithTableGuard(
    pdf,
    "Tabla 1. Distribución de estudiantes según rangos de calificación",
    y,
    10,
    images,
    pageState
  );

  y = drawDistribucionTable(
    pdf,
    data.distribucionCalificaciones,
    y,
    images,
    pageState
  );

  y = drawBarChart(
    pdf,
    "Rendimiento por componente",
    data.componentes,
    y,
    images,
    pageState
  );

  y = drawSubsectionTitleWithTableGuard(
    pdf,
    "Preguntas con mayor dificultad",
    y,
    12,
    images,
    pageState
  );

  y = drawPreguntasDificilesTable(
    pdf,
    data.preguntasDificiles,
    y,
    images,
    pageState
  );

  y = drawSectionTitle(
    pdf,
    `${orderedSections.length + 2}. Conclusiones`,
    y,
    images,
    pageState
  );

  y = drawBulletList(
    pdf,
    data.conclusionesGeneradas?.length
      ? data.conclusionesGeneradas
      : [
          `La carrera de ${data.carrera} obtuvo un promedio general de ${data.promedioGeneral.toFixed(
            2
          )} puntos sobre 100.`,
          `El porcentaje de aprobación alcanzado fue de ${data.porcentajeAprobacion.toFixed(
            2
          )}%, lo cual evidencia la necesidad de fortalecer el rendimiento académico antes de enfrentar el EHEP.`,
          "Las preguntas con menor porcentaje de acierto reflejan brechas concretas en el dominio de los resultados de aprendizaje evaluados.",
          "El comportamiento general sugiere un nivel intermedio de desempeño, con escasa representación en los rangos superiores.",
        ],
    y,
    images,
    pageState
  );

  y = drawSectionTitle(
    pdf,
    `${orderedSections.length + 3}. Recomendaciones`,
    y,
    images,
    pageState
  );

  y = drawBulletList(
    pdf,
    data.recomendacionesGeneradas?.length
      ? data.recomendacionesGeneradas
      : [
          "Diseñar e implementar planes de reforzamiento focalizados en los componentes con menor desempeño.",
          "Desarrollar estrategias pedagógicas centradas en análisis de casos clínicos y razonamiento aplicado.",
          "Establecer simulacros periódicos alineados con la estructura técnica del EHEP.",
          "Realizar seguimiento académico diferenciado a estudiantes con puntajes en los rangos inferiores.",
          "Fortalecer la articulación entre sílabos, competencias del perfil de egreso y componentes evaluados por el CACES.",
        ],
    y,
    images,
    pageState
  );

  y = drawSignaturesNearEnd(pdf, y, images, pageState);

  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    addFooter(pdf, images, i, totalPages);
  }

  pdf.save(
    `Informe_RA_${data.carrera.replace(/\s+/g, "_")}_${data.periodo}.pdf`
  );
};