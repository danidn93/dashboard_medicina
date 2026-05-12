import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

declare global {
  interface Window {
    deferredPrompt?: any;
  }
}

export default function PWAInstallPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const checkPrompt = () => {
      if (window.deferredPrompt) {
        setVisible(true);
      }
    };

    checkPrompt();

    window.addEventListener("beforeinstallprompt", checkPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", checkPrompt);
    };
  }, []);

  const installApp = async () => {
    const prompt = window.deferredPrompt;

    if (!prompt) return;

    prompt.prompt();

    const result = await prompt.userChoice;

    if (result.outcome === "accepted") {
      setVisible(false);
    }

    window.deferredPrompt = null;
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[95%] max-w-md -translate-x-1/2 rounded-2xl border bg-white p-4 shadow-2xl">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#002E45]">
          <Download className="h-5 w-5 text-white" />
        </div>

        <div className="flex-1">
          <h3 className="font-black text-[#002E45]">
            Instalar aplicación
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Instale el aula virtual en su dispositivo para acceder más rápido.
          </p>

          <div className="mt-3 flex gap-2">
            <Button
              onClick={installApp}
              className="bg-[#002E45] hover:bg-[#003b59]"
            >
              Instalar
            </Button>

            <Button
              variant="outline"
              onClick={() => setVisible(false)}
            >
              Ahora no
            </Button>
          </div>
        </div>

        <button
          onClick={() => setVisible(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}