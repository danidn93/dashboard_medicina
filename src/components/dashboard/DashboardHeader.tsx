import unemiBg from "@/assets/pdf/logo_unemi.png";

interface Props {
  periodoDetectado?: string;
  onSharePublic?: () => void;
}

export function DashboardHeader({ periodoDetectado, onSharePublic }: Props) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#1c3247]/30">
      <div className="container mx-auto px-4 py-5">
        <div className="grid grid-cols-3 items-center">
          
          {/* IZQUIERDA */}
          <div>
            <h1 className="text-2xl font-bold text-[#002E45] leading-tight">
              Evaluación de Resultados de Aprendizaje
            </h1>
            <p className="text-2xl font-bold text-[#FF6900] mt-1">Carrera de Medicina</p>
          </div>

          {/* CENTRO (LOGO + BOTÓN PERFECTAMENTE CENTRADO) */}
          <div className="flex flex-col items-center justify-center gap-2">
            <img
              src={unemiBg}
              alt="Logo UNEMI"
              className="h-24 object-contain"
            />

            {onSharePublic && (
              <button
                onClick={onSharePublic}
                className="text-sm bg-[#FF6900] text-white px-4 py-1.5 rounded-md hover:opacity-90 transition"
              >
                Generar enlace público
              </button>
            )}
          </div>

          {/* DERECHA (META / ESPACIADOR) */}
          <div className="text-right">
            
          </div>

        </div>
      </div>
    </header>
  );
}