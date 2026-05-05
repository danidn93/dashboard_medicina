import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  GripVertical,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ReportItemType =
  | "TITULO"
  | "SUBTITULO"
  | "PARRAFO"
  | "ARTICULO"
  | "VINETA"
  | "TABLA";

export type ReportTableData = {
  headers: string[];
  rows: string[][];
};

export type ReportItem = {
  id: string;
  tipo: ReportItemType;
  parent_id: string | null;
  orden: number;
  titulo: string;
  contenido: string;
  table_data?: ReportTableData;
  children?: ReportItem[];
};

const REPORT_ITEM_TYPE_LABELS: Record<ReportItemType, string> = {
  TITULO: "Título",
  SUBTITULO: "Subtítulo",
  PARRAFO: "Párrafo",
  ARTICULO: "Artículo",
  VINETA: "Viñeta",
  TABLA: "Tabla",
};

const DEFAULT_TABLE_DATA: ReportTableData = {
  headers: ["Columna 1", "Columna 2"],
  rows: [["", ""]],
};

const normalizeTableData = (
  tableData?: ReportTableData
): ReportTableData => {
  const headers =
    tableData?.headers?.length
      ? tableData.headers.map((h, i) => h ?? `Columna ${i + 1}`)
      : [...DEFAULT_TABLE_DATA.headers];

  const rows =
    tableData?.rows?.length
      ? tableData.rows.map((row) => {
          const normalizedRow = [...row];

          while (normalizedRow.length < headers.length) {
            normalizedRow.push("");
          }

          return normalizedRow.slice(0, headers.length);
        })
      : [headers.map(() => "")];

  return {
    headers,
    rows,
  };
};

interface Props {
  item: ReportItem;
  depth: number;
  readOnly?: boolean;

  conclusiones?: string;
  recomendaciones?: string;
  onUpdateConclusiones?: (value: string) => void;
  onUpdateRecomendaciones?: (value: string) => void;

  onAddChild: (
    parentId: string,
    tipo: ReportItemType,
    cantidad?: number
  ) => void;
  onUpdate: (itemId: string, data: Partial<ReportItem>) => void;
  onDelete: (itemId: string) => void;
  onMove: (
    draggedId: string,
    targetId: string,
    position: "before" | "after" | "inside"
  ) => void;
  onView?: (item: ReportItem) => void;
}

export function ReportTreeItemExact({
  item,
  depth,
  readOnly = false,
  conclusiones,
  recomendaciones,
  onUpdateConclusiones,
  onUpdateRecomendaciones,
  onAddChild,
  onUpdate,
  onDelete,
  onMove,
  onView,
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const [addType, setAddType] = useState<ReportItemType>("SUBTITULO");
  const [addQuantity, setAddQuantity] = useState(1);
  const [dragOver, setDragOver] = useState<
    "before" | "after" | "inside" | null
  >(null);

  const hasChildren = !!item.children?.length;
  const isTableNode = item.tipo === "TABLA";

  const isTitleNode = item.tipo === "TITULO" || item.tipo === "SUBTITULO";

  const isTextNode =
    item.tipo === "PARRAFO" ||
    item.tipo === "ARTICULO" ||
    item.tipo === "VINETA";

  const tableData = isTableNode
    ? normalizeTableData(item.table_data)
    : undefined;

  const summary = isTitleNode
    ? item.titulo?.trim() || REPORT_ITEM_TYPE_LABELS[item.tipo]
    : isTableNode
    ? item.titulo?.trim() || "Tabla personalizada"
    : item.contenido?.trim() || REPORT_ITEM_TYPE_LABELS[item.tipo];

  const updateTableData = (nextTableData: ReportTableData) => {
    onUpdate(item.id, {
      table_data: normalizeTableData(nextTableData),
    });
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    position: "before" | "after" | "inside"
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const draggedId = e.dataTransfer.getData("text/plain");

    if (!draggedId || draggedId === item.id) {
      setDragOver(null);
      return;
    }

    onMove(draggedId, item.id, position);
    setDragOver(null);
  };

  const handleDragOverZone = (
    e: React.DragEvent<HTMLDivElement>,
    position: "before" | "after" | "inside"
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (dragOver !== position) {
      setDragOver(position);
    }
  };

  const clearDragState = () => {
    setDragOver(null);
  };

  return (
    <div className="space-y-1 min-w-0" style={{ marginLeft: depth * 20 }}>
      {!readOnly && (
        <div
          onDragOver={(e) => handleDragOverZone(e, "before")}
          onDragLeave={clearDragState}
          onDrop={(e) => handleDrop(e, "before")}
          className={[
            "h-2 rounded transition-all",
            dragOver === "before"
              ? "bg-primary/30 ring-1 ring-primary"
              : "bg-transparent",
          ].join(" ")}
        />
      )}

      <div
        draggable={!readOnly}
        onDragStart={(e) => {
          if (readOnly) return;

          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", item.id);
        }}
        onDragOver={(e) => handleDragOverZone(e, "inside")}
        onDragLeave={clearDragState}
        onDrop={(e) => handleDrop(e, "inside")}
        className={[
          "rounded-lg border bg-background transition-colors overflow-hidden min-w-0",
          dragOver === "inside"
            ? "border-primary ring-1 ring-primary/30"
            : "border-border",
        ].join(" ")}
      >
        <div className="flex items-start gap-2 px-3 py-2 min-w-0">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>

          {!readOnly && (
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5 cursor-grab" />
          )}

          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="text-xs text-muted-foreground">
              {REPORT_ITEM_TYPE_LABELS[item.tipo]}
            </div>

            <div className="text-sm font-medium whitespace-pre-wrap break-words overflow-hidden">
              {summary}
            </div>
          </div>

          {onView && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 px-2 shrink-0"
              onClick={() => onView(item)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}

          {!readOnly && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-destructive shrink-0"
              onClick={() => onDelete(item.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        {expanded && (
          <div className="border-t px-3 py-3 space-y-3 min-w-0">
            {isTitleNode && (
              <div className="min-w-0">
                <label className="text-sm text-muted-foreground">
                  {item.tipo === "TITULO" ? "Título" : "Subtítulo"}
                </label>

                <Input
                  value={item.titulo ?? ""}
                  disabled={readOnly}
                  onChange={(e) =>
                    onUpdate(item.id, {
                      titulo: e.target.value,
                    })
                  }
                  placeholder={
                    item.tipo === "TITULO"
                      ? "Escriba el título"
                      : "Escriba el subtítulo"
                  }
                  className="mt-1 w-full min-w-0"
                />
              </div>
            )}

            {isTextNode && (
              <div className="min-w-0">
                <label className="text-sm text-muted-foreground">
                  {item.tipo === "PARRAFO"
                    ? "Párrafo"
                    : item.tipo === "VINETA"
                    ? "Viñeta"
                    : "Artículo"}
                </label>

                <Textarea
                  value={item.contenido ?? ""}
                  disabled={readOnly}
                  onChange={(e) =>
                    onUpdate(item.id, {
                      contenido: e.target.value,
                    })
                  }
                  placeholder={
                    item.tipo === "PARRAFO"
                      ? "Escriba el párrafo"
                      : item.tipo === "VINETA"
                      ? "Escriba la viñeta"
                      : "Escriba el artículo"
                  }
                  className="mt-1 min-h-[110px] w-full min-w-0 resize-y whitespace-pre-wrap break-words"
                />
              </div>
            )}

            {isTableNode && tableData && (
              <div className="space-y-3 min-w-0">
                <div>
                  <label className="text-sm text-muted-foreground">
                    Título de la tabla
                  </label>

                  <Input
                    value={item.titulo ?? ""}
                    disabled={readOnly}
                    onChange={(e) =>
                      onUpdate(item.id, {
                        titulo: e.target.value,
                        table_data: tableData,
                      })
                    }
                    placeholder="Ejemplo: Tabla de resultados"
                    className="mt-1"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={readOnly}
                    onClick={() => {
                      const nextHeaders = [
                        ...tableData.headers,
                        `Columna ${tableData.headers.length + 1}`,
                      ];

                      const nextRows = tableData.rows.map((row) => [
                        ...row,
                        "",
                      ]);

                      updateTableData({
                        headers: nextHeaders,
                        rows: nextRows,
                      });
                    }}
                  >
                    Agregar columna
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={readOnly}
                    onClick={() => {
                      updateTableData({
                        headers: tableData.headers,
                        rows: [
                          ...tableData.rows,
                          tableData.headers.map(() => ""),
                        ],
                      });
                    }}
                  >
                    Agregar fila
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={readOnly || tableData.headers.length <= 1}
                    onClick={() => {
                      updateTableData({
                        headers: tableData.headers.slice(0, -1),
                        rows: tableData.rows.map((row) => row.slice(0, -1)),
                      });
                    }}
                  >
                    Eliminar columna
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={readOnly || tableData.rows.length <= 1}
                    onClick={() => {
                      updateTableData({
                        headers: tableData.headers,
                        rows: tableData.rows.slice(0, -1),
                      });
                    }}
                  >
                    Eliminar fila
                  </Button>
                </div>

                <div className="overflow-x-auto border rounded-md">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        {tableData.headers.map((header, colIndex) => (
                          <th
                            key={colIndex}
                            className="border px-2 py-1 min-w-[140px]"
                          >
                            <Input
                              value={header}
                              disabled={readOnly}
                              onChange={(e) => {
                                const headers = [...tableData.headers];
                                headers[colIndex] = e.target.value;

                                updateTableData({
                                  headers,
                                  rows: tableData.rows,
                                });
                              }}
                            />
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {tableData.rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {tableData.headers.map((_, colIndex) => (
                            <td
                              key={colIndex}
                              className="border px-2 py-1 min-w-[140px]"
                            >
                              <Input
                                value={row[colIndex] ?? ""}
                                disabled={readOnly}
                                onChange={(e) => {
                                  const rows = tableData.rows.map((r) => [
                                    ...r,
                                  ]);

                                  rows[rowIndex][colIndex] = e.target.value;

                                  updateTableData({
                                    headers: tableData.headers,
                                    rows,
                                  });
                                }}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {!readOnly && (
              <div className="flex flex-wrap items-end gap-2 pt-1">
                <div className="w-[180px]">
                  <label className="text-sm text-muted-foreground">
                    Agregar hijo
                  </label>

                  <Select
                    value={addType}
                    onValueChange={(v) => setAddType(v as ReportItemType)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="SUBTITULO">Subtítulo</SelectItem>
                      <SelectItem value="PARRAFO">Párrafo</SelectItem>
                      <SelectItem value="ARTICULO">Artículo</SelectItem>
                      <SelectItem value="VINETA">Viñeta</SelectItem>
                      <SelectItem value="TABLA">Tabla</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">
                    Cantidad
                  </label>

                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={addQuantity}
                    onChange={(e) =>
                      setAddQuantity(
                        Math.max(
                          1,
                          Math.min(50, parseInt(e.target.value) || 1)
                        )
                      )
                    }
                    className="mt-1 w-24 h-10"
                  />
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => onAddChild(item.id, addType, addQuantity)}
                >
                  <Plus className="h-3 w-3" />
                  Agregar
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {expanded && hasChildren && (
        <div className="space-y-1 min-w-0">
          {item.children!.map((child) => (
            <ReportTreeItemExact
              key={child.id}
              item={child}
              depth={depth + 1}
              readOnly={readOnly}
              conclusiones={conclusiones}
              recomendaciones={recomendaciones}
              onUpdateConclusiones={onUpdateConclusiones}
              onUpdateRecomendaciones={onUpdateRecomendaciones}
              onAddChild={onAddChild}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onMove={onMove}
              onView={onView}
            />
          ))}
        </div>
      )}

      {!readOnly && (
        <div
          onDragOver={(e) => handleDragOverZone(e, "after")}
          onDragLeave={clearDragState}
          onDrop={(e) => handleDrop(e, "after")}
          className={[
            "h-2 rounded transition-all",
            dragOver === "after"
              ? "bg-primary/30 ring-1 ring-primary"
              : "bg-transparent",
          ].join(" ")}
        />
      )}
    </div>
  );
}