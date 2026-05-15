import { Attachment } from '../types/common';
import { addHistoryItem, createHistoryItem } from './historyLogic';

/**
 * Creates an attachment object with metadata.
 */
export const createAttachment = (payload: Omit<Attachment, 'id' | 'uploadedAt' | 'uploadedBy'>, user: string): Attachment => {
  return {
    ...payload,
    id: Math.random().toString(36).substring(2, 9),
    uploadedAt: Date.now(),
    uploadedBy: user,
  };
};

/**
 * Adds an attachment to an entity, supporting 'attachments' or 'media' patterns.
 */
export const addAttachment = (entity: any, attachment: Attachment) => {
  if (Array.isArray(entity.attachments)) {
    entity.attachments.push(attachment);
  } else if (Array.isArray(entity.media)) {
    // Legacy support: map to FaultMedia-like structure if needed, or push directly
    entity.media.push(attachment);
  } else {
    entity.attachments = [attachment];
  }
};

/**
 * Removes an attachment by ID.
 */
export const removeAttachment = (entity: any, attachmentId: string) => {
  if (Array.isArray(entity.attachments)) {
    entity.attachments = entity.attachments.filter((a: Attachment) => a.id !== attachmentId);
  }
  if (Array.isArray(entity.media)) {
    entity.media = entity.media.filter((m: any) => m.id !== attachmentId);
  }
};

/**
 * Returns all attachments of type 'image'.
 */
export const getImageAttachments = (entity: any): Attachment[] => {
  const attachments = entity.attachments || entity.media || [];
  return attachments.filter((a: Attachment) => a.type === 'image');
};

/**
 * Determines the cover image for an entity.
 */
export const getCoverImage = (entity: any): string | null => {
  if (entity.coverImageUrl) return entity.coverImageUrl;
  
  const images = getImageAttachments(entity);
  if (images.length > 0) return images[0].url;
  
  if (entity.equipmentImageUrl) return entity.equipmentImageUrl;
  
  return null;
};

/**
 * Sets the cover image and logs the change.
 */
export const setCoverImage = (entity: any, imageUrl: string, user: string) => {
  entity.coverImageUrl = imageUrl;
  
  const historyItem = createHistoryItem({
    type: 'COVER_IMAGE_CHANGED',
    to: imageUrl,
    user,
  });
  
  addHistoryItem(entity, historyItem);
};
