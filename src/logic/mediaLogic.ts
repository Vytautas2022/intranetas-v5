import { Fault, FaultMedia } from "../mock-db/faults";
import { compressAndResizeImage } from "./imageProcessing";

export const MEDIA_LIMITS = {
  MAX_IMAGES: 10,
  MAX_VIDEOS: 1,
  VIDEO_MAX_SIZE_MB: 50
};

export async function addMedia(fault: Fault, files: File[]): Promise<void> {
  let existingImages = fault.media.filter(m => m.type === 'image').length;

  for (const file of files) {
    if (file.type.startsWith("image/")) {
      if (existingImages >= MEDIA_LIMITS.MAX_IMAGES) continue;

      try {
        const processed = await compressAndResizeImage(file);
        fault.media.push(processed);
        
        // Auto cover image
        if (!fault.coverImage) {
          fault.coverImage = processed.url;
        }
        
        existingImages++;
      } catch (error) {
        console.error("Klaida apdorojant nuotrauką:", error);
      }
    } else if (file.type.startsWith("video/")) {
      const hasVideo = fault.media.some(m => m.type === "video");
      if (hasVideo) continue;

      if (file.size > MEDIA_LIMITS.VIDEO_MAX_SIZE_MB * 1024 * 1024) continue;

      fault.media.push({
        type: "video",
        url: URL.createObjectURL(file),
        name: file.name
      });
    }
  }

  fault.updatedAt = Date.now();
}

export function setCoverImage(fault: Fault, imageUrl: string | undefined): void {
  fault.coverImage = imageUrl;
  fault.updatedAt = Date.now();
}
