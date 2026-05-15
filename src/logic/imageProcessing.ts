import { FaultMedia } from "../mock-db/faults";

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
