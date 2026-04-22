import React from "react";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  url: string;
  onClose: () => void;
}

export default function SharePublicLinkModal({ open, url, onClose }: Props) {
  if (!open) return null;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[#002E45]">
          Enlace público generado
        </h2>

        <p className="text-sm text-[#222223]/70">
          Este enlace permite acceso al dashboard sin iniciar sesión.
        </p>

        <div className="bg-gray-100 p-2 rounded text-xs break-all">
          {url}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button onClick={handleCopy}>
            Copiar enlace
          </Button>
        </div>
      </div>
    </div>
  );
}
