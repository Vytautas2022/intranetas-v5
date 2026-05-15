let counter = 4; // Mock data has F-1, F-2, F-3
let uniqueCounter = 0;

export function generateId() {
  return "F-" + counter++;
}

export function generateUniqueId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  const serial = (uniqueCounter++).toString(36);
  return `${prefix}${timestamp}-${random}-${serial}`;
}
