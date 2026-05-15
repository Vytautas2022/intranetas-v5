import { Club, clubs } from "../mock-db/clubs";

export function filterFaults(faults: any[], selectedRegion: string, selectedClub: string) {
  return faults.filter(fault => {
    const club = clubs.find(c => c.id === fault.clubId);
    if (!club) return false;

    if (selectedClub && selectedClub !== "all") {
      return fault.clubId === selectedClub;
    }

    if (selectedRegion && selectedRegion !== "all") {
      return club.region === selectedRegion;
    }

    return true;
  });
}
