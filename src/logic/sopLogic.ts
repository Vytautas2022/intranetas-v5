import { sops, SOP } from '../mock-db/sops';
import { Fault } from '../types/faults';

export function getSOP(faultTypeId: string, clubId: string): SOP | undefined {
  return sops.find(s => 
    s.faultTypeId === faultTypeId && 
    s.clubId === clubId
  );
}

export function updateFaultSOP(fault: Fault, url: string, user: string): void {
  if (!fault.sop) {
    fault.sop = { url: '', updatedAt: null, updatedBy: null };
  }
  fault.sop.url = url;
  fault.sop.updatedAt = Date.now();
  fault.sop.updatedBy = user;
  fault.sopUrl = url || undefined;
  fault.sopStatus = url ? "EXISTS" : "MISSING";
  fault.updatedAt = Date.now();
}
