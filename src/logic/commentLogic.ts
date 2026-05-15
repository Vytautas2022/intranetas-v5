import { Fault, FaultComment } from "../mock-db/faults";
import { createAuditLogEntry } from "./auditLogic";

export function addComment(fault: Fault, comment: { text: string; author: string; parentId?: string | null; media?: any[] }): FaultComment {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  while ((match = mentionRegex.exec(comment.text)) !== null) {
    mentions.push(match[1]);
  }

  const newComment: FaultComment = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    text: comment.text,
    author: comment.author,
    createdAt: Date.now(),
    mentions: mentions,
    parentId: comment.parentId || null,
    media: comment.media || [],
    edited: false,
    history: [],
    deleted: false
  };
  fault.comments.push(newComment);
  fault.updatedAt = Date.now();

  createAuditLogEntry({
    moduleId: "faults",
    moduleName: "Gedimai",
    entityType: "COMMENT",
    entityId: newComment.id,
    entityTitle: fault.title,
    actionType: "COMMENT_ADDED",
    changeDescription: `Pridėtas komentaras gedimui: ${fault.title}`,
    locationLabel: `Gedimai > ${fault.clubName} > ${fault.title}`,
    canRestore: false,
    newValue: newComment.text
  });

  return newComment;
}

export function editComment(fault: Fault, commentId: string, newText: string, author: string): FaultComment | undefined {
  const comment = fault.comments.find(c => c.id === commentId);
  if (!comment || comment.author !== author || comment.deleted) return undefined;

  const oldText = comment.text;
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  while ((match = mentionRegex.exec(newText)) !== null) {
    mentions.push(match[1]);
  }

  // Preserve current state in history
  comment.history.push({
    text: comment.text,
    timestamp: Date.now()
  });

  comment.text = newText;
  comment.mentions = mentions;
  comment.edited = true;
  fault.updatedAt = Date.now();

  createAuditLogEntry({
    moduleId: "faults",
    moduleName: "Gedimai",
    entityType: "COMMENT",
    entityId: comment.id,
    entityTitle: fault.title,
    actionType: "COMMENT_EDITED",
    changeDescription: `Redaguotas komentaras gedimui: ${fault.title}`,
    locationLabel: `Gedimai > ${fault.clubName} > ${fault.title}`,
    canRestore: true,
    oldValue: oldText,
    newValue: newText
  });

  return comment;
}

export function deleteComment(fault: Fault, commentId: string, currentUser: { name: string }): boolean {
  const comment = fault.comments.find(c => c.id === commentId);
  if (!comment || comment.deleted || comment.author !== currentUser.name) return false;

  const oldText = comment.text;
  comment.deleted = true;
  (comment as any).deletedAt = new Date();
  comment.text = "Komentaras ištrintas";
  comment.media = []; // Optional: clear media if deleted
  fault.updatedAt = Date.now();
  
  createAuditLogEntry({
    moduleId: "faults",
    moduleName: "Gedimai",
    entityType: "COMMENT",
    entityId: comment.id,
    entityTitle: fault.title,
    actionType: "COMMENT_DELETED",
    changeDescription: `Ištrintas komentaras gedimui: ${fault.title}`,
    locationLabel: `Gedimai > ${fault.clubName} > ${fault.title}`,
    canRestore: true,
    oldValue: oldText
  });

  return true;
}
