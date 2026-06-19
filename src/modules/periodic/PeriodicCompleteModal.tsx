import React, { useRef, useState } from "react";
import { X } from "lucide-react";
import type { PeriodicInstance } from "../../mock-db/periodicInstances";

interface Props {
  instance: PeriodicInstance;
  onClose: () => void;
  onConfirm: (photoFiles: string[]) => void;
}

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const PeriodicCompleteModal: React.FC<Props> = ({
  instance,
  onClose,
  onConfirm,
}) => {
  const [photoFiles, setPhotoFiles] = useState<string[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const requiresProof =
    instance.templateSnapshot?.proofRequired === true ||
    instance.requiresPhotoProof === true;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFileError(null);
    const toAdd = files.slice(0, 3 - photoFiles.length);
    const results: string[] = [];
    for (const file of toAdd) {
      if (file.size > 5 * 1024 * 1024) {
        setFileError("Failas per didelis (maks. 5MB)");
        continue;
      }
      try {
        results.push(await toBase64(file));
      } catch {
        setFileError("Nepavyko įkelti failo");
      }
    }
    setPhotoFiles((prev) => [...prev, ...results].slice(0, 3));
    if (inputRef.current) inputRef.current.value = "";
  };

  const removePhoto = (idx: number) =>
    setPhotoFiles((prev) => prev.filter((_, i) => i !== idx));

  const canConfirm = !requiresProof || photoFiles.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900">
            Pažymėti kaip atliktą
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mb-5 text-sm font-bold text-slate-600">
          {instance.titleSnapshot}
        </p>

        {requiresProof && (
          <div className="mb-5">
            <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-500">
              FOTO ĮRODYMAS
            </p>

            {photoFiles.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {photoFiles.map((src, i) => (
                  <div key={i} className="relative h-20 w-20">
                    <img
                      src={src}
                      alt={`Nuotrauka ${i + 1}`}
                      className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
                    />
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white hover:bg-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {photoFiles.length < 3 && (
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
                Pridėti nuotraukas (maks. 3)
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            )}

            {fileError && (
              <p className="mt-1 text-xs font-bold text-red-600">{fileError}</p>
            )}

            {!canConfirm && (
              <p className="mt-2 text-xs font-bold text-amber-700">
                Įkelkite bent vieną nuotrauką prieš užbaigiant
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-900"
          >
            Atšaukti
          </button>
          <button
            onClick={() => canConfirm && onConfirm(photoFiles)}
            disabled={!canConfirm}
            className={`rounded-md px-4 py-2 text-sm font-bold text-white transition-all ${
              canConfirm
                ? "bg-emerald-600 hover:bg-emerald-700 active:scale-95"
                : "cursor-not-allowed bg-slate-300"
            }`}
          >
            Patvirtinti
          </button>
        </div>
      </div>
    </div>
  );
};
