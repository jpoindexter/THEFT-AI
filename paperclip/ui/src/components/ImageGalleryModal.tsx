import { useCallback, useEffect, useRef, useState } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import type { IssueAttachment } from "@paperclipai/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog";

interface ImageGalleryModalProps {
  images: IssueAttachment[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImageGalleryModal({
  images,
  initialIndex,
  open,
  onOpenChange,
}: ImageGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (open) setCurrentIndex(initialIndex);
  }, [open, initialIndex]);

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, goNext, goPrev, onOpenChange]);

  /** Close when clicking empty curtain space (not interactive elements or the image) */
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest("button") ||
        target.closest("a") ||
        target === imageRef.current
      )
        return;
      onOpenChange(false);
    },
    [onOpenChange],
  );

  if (images.length === 0) return null;

  const current = images[currentIndex];
  if (!current) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        {/* Full-screen curtain */}
        <DialogOverlay className="bg-black/90 duration-200" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex flex-col outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200"
          onClick={handleBackdropClick}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-3 text-white/80 text-sm shrink-0">
            <span className="min-w-0 flex-1 truncate font-medium" title={current.originalFilename ?? undefined}>
              {current.originalFilename ?? "Image"}
            </span>
            <div className="flex items-center gap-4">
              <span className="text-white/40 tabular-nums text-xs">
                {currentIndex + 1} / {images.length}
              </span>
              <Button
                asChild
                variant="ghost"
                size="icon-sm"
                className="text-white/50 hover:bg-white/10 hover:text-white"
                title="Download"
                aria-label="Download"
              >
                <a
                  href={current.contentPath}
                  download={current.originalFilename ?? "image"}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download className="size-4" />
                </a>
              </Button>
              <Button
                type="button"
                onClick={() => onOpenChange(false)}
                variant="ghost"
                size="icon-sm"
                className="text-white/50 hover:bg-white/10 hover:text-white"
                title="Close"
                aria-label="Close"
              >
                <X className="size-5" />
              </Button>
            </div>
          </div>

          {/* Main area: nav buttons outside image */}
          <div className="flex-1 flex items-center min-h-0">
            {/* Left nav zone */}
            <div className="w-16 md:w-24 shrink-0 flex items-center justify-center h-full">
              {images.length > 1 && (
                <Button
                  type="button"
                  onClick={goPrev}
                  variant="ghost"
                  size="icon-lg"
                  className="size-12 rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
                  title="Previous"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="size-7" />
                </Button>
              )}
            </div>

            {/* Image */}
            <div className="flex-1 flex items-center justify-center min-w-0 min-h-0 h-full px-2">
              <img
                ref={imageRef}
                src={current.contentPath}
                alt={current.originalFilename ?? "attachment"}
                className="max-w-full max-h-full object-contain select-none rounded-lg"
                draggable={false}
              />
            </div>

            {/* Right nav zone */}
            <div className="w-16 md:w-24 shrink-0 flex items-center justify-center h-full">
              {images.length > 1 && (
                <Button
                  type="button"
                  onClick={goNext}
                  variant="ghost"
                  size="icon-lg"
                  className="size-12 rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white"
                  title="Next"
                  aria-label="Next image"
                >
                  <ChevronRight className="size-7" />
                </Button>
              )}
            </div>
          </div>

          {/* Bottom padding for balance */}
          <div className="h-6 shrink-0" />
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
