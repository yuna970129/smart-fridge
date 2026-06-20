"use client";

import { useRef, useState, type DragEvent } from "react";
import { cn } from "@/lib/cn";
import { UploadIcon } from "@/components/icons";

export function UploadCard({
  image,
  onImage,
  hint = "PNG or JPG",
}: {
  image: string | null;
  onImage: (dataUrl: string) => void;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function readFile(file?: File | null) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const MAX = 1280;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          const scale = MAX / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        onImage(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = () => onImage(dataUrl);
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    readFile(e.dataTransfer.files?.[0]);
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "glass flex min-h-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed p-6 text-center shadow-soft transition duration-300",
          dragging
            ? "border-gold bg-white/70"
            : "border-sage/60 hover:border-gold hover:bg-white/65",
        )}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt="Selected preview"
            className="max-h-64 w-auto rounded-2xl object-contain shadow-soft"
          />
        ) : (
          <>
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal text-ink-soft">
              <UploadIcon />
            </span>
            <div>
              <p className="text-base font-medium text-ink">Choose a file</p>
              <p className="mt-0.5 text-sm text-ink-soft">
                or drag and drop · {hint}
              </p>
            </div>
          </>
        )}
      </div>

      {image && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-3 w-full rounded-xl py-2 text-sm font-medium text-ink-soft transition duration-300 hover:bg-white/50 hover:text-ink"
        >
          Choose a different file
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => readFile(e.target.files?.[0])}
      />
    </div>
  );
}
