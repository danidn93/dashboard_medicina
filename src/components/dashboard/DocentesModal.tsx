import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User, X } from "lucide-react";

interface DocentesModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  docentes: string[];
}

export function DocentesModal({ open, onClose, title, docentes }: DocentesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Docentes asociados
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">{title}</p>
        </DialogHeader>
        
        <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
          {docentes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No hay docentes asociados
            </p>
          ) : (
            docentes.map((docente, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="p-2 rounded-full bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{docente}</span>
              </div>
            ))
          )}
        </div>
        
        <div className="mt-4">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
