import { Fault } from "../types/faults";
import { User } from "../mock-db/users";
import { clubs } from "../mock-db/clubs";

export function getScopedFaults(faults: Fault[], user: User, selectedRegion: string): Fault[] {
  // Coordinator → always restricted
  if (user.role === "COORDINATOR") {
    return faults.filter(f => {
      const club = clubs.find(c => c.id === f.clubId);
      return club?.region === user.region;
    });
  }

  // OPS → full access with optional region filter
  if (user.role === "OPS") {
    if (!selectedRegion || selectedRegion === "ALL") {
      return faults;
    }

    return faults.filter(f => {
      const club = clubs.find(c => c.id === f.clubId);
      return club?.region === selectedRegion;
    });
  }

  return faults;
}
