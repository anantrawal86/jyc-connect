import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Move, X } from "lucide-react";

type Props = {
  id: string;
  label: string;
  aspect: number;
  disabled?: boolean;
  onCrop: (file: File) => void;
};

/** Lets an editor frame an image before it is uploaded; the chosen crop is saved as the image itself. */
export function ImageCropPicker({ id, label, aspect, disabled, onCrop }: Props) {
  const [source, setSource] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [x, setX] = useState(50);
  const [y, setY] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const drag = useRef<{ pointerId: number; x: number; y: number; cropX: number; cropY: number } | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!source) {
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(source);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [source]);

  useEffect(() => {
    const preview = previewRef.current;
    if (!source || !preview) return;
    const handleWheel = (event: WheelEvent) => {
      // Trackpad pinch is delivered as a Ctrl+wheel event by most browsers.
      // A native non-passive listener is needed to prevent the browser zooming the page.
      if (!event.ctrlKey && !event.metaKey && event.deltaY === 0) return;
      event.preventDefault();
      event.stopPropagation();
      setZoom((current) => Math.max(1, Math.min(2.5, current * Math.exp(-event.deltaY * 0.002))));
    };
    preview.addEventListener("wheel", handleWheel, { passive: false });
    return () => preview.removeEventListener("wheel", handleWheel);
  }, [source, previewUrl]);

  function cancel() {
    setSource(null);
    setError("");
    setX(50);
    setY(50);
    setZoom(1);
    setImageSize({ width: 0, height: 0 });
  }

  async function saveCrop() {
    if (!source) return;
    setSaving(true);
    setError("");
    try {
      const bitmap = await createImageBitmap(source);
      const width = 1440;
      const height = Math.round(width / aspect);
      const scale = Math.max(width / bitmap.width, height / bitmap.height) * zoom;
      const drawWidth = bitmap.width * scale;
      const drawHeight = bitmap.height * scale;
      const overflowX = Math.max(0, drawWidth - width);
      const overflowY = Math.max(0, drawHeight - height);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Your browser could not prepare this image.");
      context.imageSmoothingQuality = "high";
      context.drawImage(bitmap, -(overflowX * x) / 100, -(overflowY * y) / 100, drawWidth, drawHeight);
      bitmap.close();
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Could not create the cropped image.")), "image/webp", 0.92);
      });
      const safeName = source.name.replace(/\.[^.]+$/, "") || "jyc-image";
      const cropped = new File([blob], `${safeName}-framed.webp`, { type: "image/webp", lastModified: Date.now() });
      if (cropped.size > 8 * 1024 * 1024) throw new Error("The adjusted image is larger than 8 MB.");
      onCrop(cropped);
      cancel();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not adjust this image.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <label htmlFor={id} className={`inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 ${disabled ? "pointer-events-none opacity-60" : ""}`}>
        <ImageIcon className="h-4 w-4" /> {label}
        <input
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          disabled={disabled}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            if (!file) return;
            if (file.size > 8 * 1024 * 1024) {
              setError("Choose an image smaller than 8 MB.");
              return;
            }
            setError("");
            setX(50);
            setY(50);
            setZoom(1);
            setImageSize({ width: 0, height: 0 });
            setSource(file);
          }}
        />
      </label>
      {error && !source && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {source && previewUrl && (
        <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-navy/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby={`${id}-crop-title`}>
          <div className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 id={`${id}-crop-title`} className="font-display text-lg font-bold text-navy">Adjust image framing</h2>
                <p className="mt-1 text-sm text-muted-foreground">Move the photo and zoom until the important part is in frame.</p>
              </div>
              <button type="button" onClick={cancel} aria-label="Cancel image adjustment" className="rounded-full p-2 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid gap-5 p-5 sm:grid-cols-[1.2fr_.8fr]">
              <div
                ref={previewRef}
                className="relative cursor-grab touch-none select-none overscroll-contain overflow-hidden rounded-xl bg-navy active:cursor-grabbing"
                style={{ aspectRatio: String(aspect) }}
                onPointerDown={(event) => {
                  if (event.button !== 0 && event.pointerType === "mouse") return;
                  event.currentTarget.setPointerCapture(event.pointerId);
                  drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, cropX: x, cropY: y };
                }}
                onPointerMove={(event) => {
                  const start = drag.current;
                  if (!start || start.pointerId !== event.pointerId || !imageSize.width || !imageSize.height) return;
                  const rect = event.currentTarget.getBoundingClientRect();
                  const imageAspect = imageSize.width / imageSize.height;
                  const overflowX = rect.width * Math.max(0, Math.max(100, imageAspect / aspect * 100) * zoom - 100) / 100;
                  const overflowY = rect.height * Math.max(0, Math.max(100, aspect / imageAspect * 100) * zoom - 100) / 100;
                  if (overflowX > 0) setX(Math.max(0, Math.min(100, start.cropX - (event.clientX - start.x) * 100 / overflowX)));
                  if (overflowY > 0) setY(Math.max(0, Math.min(100, start.cropY - (event.clientY - start.y) * 100 / overflowY)));
                }}
                onPointerUp={(event) => {
                  if (drag.current?.pointerId === event.pointerId) drag.current = null;
                }}
                onPointerCancel={() => { drag.current = null; }}
              >
                {(() => {
                  const imageAspect = imageSize.width && imageSize.height ? imageSize.width / imageSize.height : aspect;
                  const widthPercent = Math.max(100, imageAspect / aspect * 100) * zoom;
                  const heightPercent = Math.max(100, aspect / imageAspect * 100) * zoom;
                  return (
                <img
                  src={previewUrl}
                  alt="Image crop preview"
                  draggable={false}
                  onLoad={(event) => setImageSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
                  className="absolute max-w-none select-none"
                  style={{
                    width: `${widthPercent}%`,
                    height: `${heightPercent}%`,
                    left: `${-Math.max(0, widthPercent - 100) * x / 100}%`,
                    top: `${-Math.max(0, heightPercent - 100) * y / 100}%`,
                  }}
                />
                  );
                })()}
                <span className="pointer-events-none absolute inset-x-3 bottom-3 rounded-full bg-navy/70 px-3 py-1.5 text-center text-xs font-medium text-white">Drag to reposition · pinch or scroll to zoom</span>
              </div>
              <div className="grid content-start gap-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-navy"><Move className="h-4 w-4 text-brand" /> Adjust the image directly</div>
                <p className="text-sm leading-relaxed text-muted-foreground">Drag the photo with your mouse or finger to reposition it. Use your trackpad pinch gesture or scroll over the photo to zoom. Current zoom: {zoom.toFixed(1)}×</p>
                <button type="button" onClick={() => { setX(50); setY(50); setZoom(1); }} className="w-fit rounded-lg border bg-card px-3 py-2 text-sm font-semibold">Reset framing</button>
                <p className="text-xs leading-relaxed text-muted-foreground">The preview matches the shape used on the site. The adjusted photo will be saved in this frame.</p>
              </div>
              {error && <p role="alert" className="text-sm text-destructive sm:col-span-2">{error}</p>}
            </div>
            <div className="flex justify-end gap-2 border-t bg-muted/40 px-5 py-4">
              <button type="button" onClick={cancel} className="rounded-lg border bg-card px-4 py-2 text-sm font-semibold">Cancel</button>
              <button type="button" onClick={() => void saveCrop()} disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">{saving ? "Preparing…" : "Use this framing"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
