import { FaultMedia } from "../mock-db/faults";

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Paveikslėlio skaitymo klaida"));
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Paveikslėlio skaitymo klaida"));
    };
    reader.readAsDataURL(file);
  });

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = () => reject(new Error("Paveikslėlio užkrovimo klaida"));
    img.onload = () => resolve(img);
    img.src = src;
  });

export async function createAssetImageThumbnail(file: File): Promise<string> {
  const source = await readFileAsDataUrl(file);
  const img = await loadImage(source);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas context not available");
  }

  const size = 200;
  const scale = Math.max(size / img.width, size / img.height);
  const sourceWidth = size / scale;
  const sourceHeight = size / scale;
  const sourceX = (img.width - sourceWidth) / 2;
  const sourceY = (img.height - sourceHeight) / 2;

  canvas.width = size;
  canvas.height = size;
  ctx.drawImage(
    img,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    size,
    size,
  );

  return canvas.toDataURL("image/jpeg", 0.6);
}

export async function compressAndResizeImage(file: File): Promise<FaultMedia> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onerror = () => reject(new Error("Paveikslėlio skaitymo klaida"));
    reader.onload = (e) => {
      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };

    img.onerror = () => reject(new Error("Paveikslėlio užkrovimo klaida"));
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }

      const MAX_WIDTH = 1280;
      const scale = Math.min(1, MAX_WIDTH / img.width);

      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Klaida suspaudžiant paveikslėlį"));
          return;
        }
        const url = URL.createObjectURL(blob);
        resolve({
          type: "image",
          url,
          name: file.name
        });
      }, "image/jpeg", 0.7); // compression 70%
    };

    reader.readAsDataURL(file);
  });
}
