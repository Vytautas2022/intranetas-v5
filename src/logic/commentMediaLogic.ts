import { FaultMedia } from '../mock-db/faults';
import { compressAndResizeImage } from './imageProcessing';

export const COMMENT_MEDIA_LIMITS = {
  MAX_IMAGES: 10,
  MAX_VIDEOS: 1,
  MAX_VIDEO_SIZE_MB: 50
};

export async function addMediaToComment(tempMedia: FaultMedia[], file: File): Promise<void> {
  if (file.type.startsWith("image/")) {
    const imageCount = tempMedia.filter(m => m.type === "image").length;
    if (imageCount >= COMMENT_MEDIA_LIMITS.MAX_IMAGES) return;

    try {
      const processed = await compressAndResizeImage(file);
      tempMedia.push(processed);
    } catch (error) {
      console.error("Klaida apdorojant komentaro nuotrauką:", error);
    }
  } else if (file.type.startsWith("video/")) {
    const videoCount = tempMedia.filter(m => m.type === "video").length;
    if (videoCount >= COMMENT_MEDIA_LIMITS.MAX_VIDEOS) return;
    if (file.size > COMMENT_MEDIA_LIMITS.MAX_VIDEO_SIZE_MB * 1024 * 1024) return;
    
    const url = URL.createObjectURL(file);
    tempMedia.push({
      type: "video",
      url,
      name: file.name
    });
  }
}
