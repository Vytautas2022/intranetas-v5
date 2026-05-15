import { sops, SOP } from '../mock-db/sops';
import { Fault } from '../mock-db/faults';

export function getSOP(faultTypeId: string, clubId: string): SOP | undefined {
  return sops.find(s => 
    s.faultTypeId === faultTypeId && 
    s.clubId === clubId
  );
}

export function updateFaultSOP(fault: Fault, url: string, user: string): void {
  if (!fault.sop) {
    fault.sop = {
      url: '',
      updatedAt: null,
      updatedBy: null
    };
  }
  
  fault.sop.url = url;
  fault.sop.updatedAt = Date.now();
  fault.sop.updatedBy = user;
  fault.updatedAt = Date.now();
}
