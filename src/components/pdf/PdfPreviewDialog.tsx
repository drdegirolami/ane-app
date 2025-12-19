import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  file: Blob | null;
};

export function PdfPreviewDialog({ open, onOpenChange, title, file }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageWidth, setPageWidth] = useState<number>(900);

  useEffect(() => {
    if (!open) {
      setNumPages(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const w = Math.floor(el.getBoundingClientRect().width);
      // Small padding so the canvas never touches the edges
      setPageWidth(Math.max(320, Math.min(1000, w - 16)));
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div ref={containerRef} className="h-full overflow-auto rounded-lg bg-muted/30 p-2">
          {!file ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              No hay documento para mostrar.
            </div>
          ) : (
            <Document
              file={file}
              loading={
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              }
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              error={
                <div className="py-10 text-center text-sm text-muted-foreground">
                  No se pudo cargar el PDF.
                </div>
              }
            >
              {Array.from({ length: numPages }, (_, idx) => (
                <div key={`page_${idx + 1}`} className="flex justify-center py-2">
                  <Page
                    pageNumber={idx + 1}
                    width={pageWidth}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                </div>
              ))}
            </Document>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
