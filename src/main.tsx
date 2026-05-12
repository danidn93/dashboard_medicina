import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      await navigator.serviceWorker.register("/sw.js");
      console.log("SW registrado");
    } catch (error) {
      console.error("Error registrando SW", error);
    }
  });
}

window.addEventListener("beforeinstallprompt", (e: any) => {
  e.preventDefault();
  window.deferredPrompt = e;
});