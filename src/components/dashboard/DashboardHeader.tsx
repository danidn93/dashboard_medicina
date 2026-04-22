import unemiBg from "@/assets/pdf/logo_unemi.png";

interface Props {
  periodoDetectado?: string;
  onSharePublic?: () => void;
}

export function DashboardHeader({ periodoDetectado, onSharePublic }: Props) {
  return (
    <header
      className="
        sticky top-0 z-40
        bg-white
        border-b border-[#1c3247]/30
      "
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Título */}
          <div>
            <h1 className="text-xl font-bold text-[#002E45]">
              Dashboard Gerencial
            </h1>
            <p className="text-sm text-[#264763]">Medicina</p>
          </div>

          {/* Logo + botón */}
          <div className="flex flex-col items-center gap-2">
            <img
              src={unemiBg}
              alt="Logo UNEMI"
              className="h-20 object-contain"
            />

            {onSharePublic && (
              <button
                onClick={onSharePublic}
                className="text-sm bg-[#FF6900] text-white px-3 py-1 rounded"
              >
                Generar enlace público
              </button>
            )}
          </div>

          {/* Meta */}
          <div className="text-right">
            
          </div>
        </div>
      </div>
    </header>
  );
}