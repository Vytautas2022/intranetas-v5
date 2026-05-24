import { Club } from "../mock-db/clubs";

export function filterFaults(
  faults: any[],
  selectedRegion: string,
  selectedClubs: string | string[],
  clubs: Club[],
) {
  const selectedClubIds = Array.isArray(selectedClubs)
    ? selectedClubs
    : selectedClubs && selectedClubs !== "all"
      ? [selectedClubs]
      : [];

  return faults.filter(fault => {
    const club = clubs.find(c => c.id === fault.clubId);
    if (!club) return false;

    if (selectedClubIds.length > 0) {
      return selectedClubIds.includes(fault.clubId);
    }

    if (selectedRegion && selectedRegion !== "all") {
      return club.region === selectedRegion;
    }

    return true;
  });
}
