import { FaultTypeDefinition } from '../mock-db/faultTypes';

export function filterFaultTypes<T extends { name: string }>(faultTypes: T[], query: string): T[] {
  if (!query) return faultTypes;
  const lowerQuery = query.toLowerCase();
  return faultTypes.filter(f =>
    f.name.toLowerCase().includes(lowerQuery)
  );
}
