import { Fault } from "../types/faults";
import { User } from "../mock-db/users";
import { Club, clubs } from "../mock-db/clubs";

export function getScopedFaults(
  faults: Fault[],
  user: User,
  selectedRegion: string,
  clubsSource: Club[] = clubs,
): Fault[] {
  // Coordinator → always restricted
  if (user.role === "COORDINATOR") {
    return faults.filter(f => {
      const club = clubsSource.find(c => c.id === f.clubId);
      return club?.region === user.region;
    });
  }

  // OPS → full access with optional region filter
  if (user.role === "OPS") {
    if (!selectedRegion || selectedRegion === "ALL") {
      return faults;
    }

    return faults.filter(f => {
      const club = clubsSource.find(c => c.id === f.clubId);
      return club?.region === selectedRegion;
    });
  }

  return faults;
}
