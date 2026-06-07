import { Fault } from "../types/faults";
import { User } from "../mock-db/users";
import { Club, clubs } from "../mock-db/clubs";
import { canUserAccessClub, hasAllRegionScope } from "./userScopeLogic";

export function getScopedFaults(
  faults: Fault[],
  user: User,
  selectedRegion: string,
  clubsSource: Club[] = clubs,
): Fault[] {
  return faults.filter((fault) => {
    const club = clubsSource.find((candidate) => candidate.id === fault.clubId);
    if (!canUserAccessClub(user, club)) return false;

    if (!selectedRegion || selectedRegion === "ALL") return true;
    if (!hasAllRegionScope(user) && !canUserAccessClub(user, club)) return false;

    return club?.region === selectedRegion;
  });
}
