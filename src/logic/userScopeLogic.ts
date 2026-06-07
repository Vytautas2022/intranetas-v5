import type { AuthUser } from "../auth/types";
import type { Club } from "../mock-db/clubs";
import type { User } from "../mock-db/users";

type ScopedUser = Partial<User> &
  Partial<AuthUser> & {
    assignedRegionIds?: string[];
    assignedClubIds?: string[];
    assigned_clubs?: string[];
    regionAccess?: string[];
  };

const unique = (values: Array<string | undefined>) =>
  Array.from(new Set(values.filter((value): value is string => Boolean(value))));

export const getAssignedRegionIds = (user: ScopedUser): string[] =>
  unique([
    ...(user.assignedRegionIds || []),
    ...(user.regionAccess || []),
    user.region,
  ]);

export const getAssignedClubIds = (user: ScopedUser): string[] =>
  unique([...(user.assignedClubIds || []), ...(user.assigned_clubs || [])]);

export const hasAllRegionScope = (user: ScopedUser): boolean =>
  getAssignedRegionIds(user).includes("ALL");

export const hasAllClubScope = (user: ScopedUser): boolean =>
  getAssignedClubIds(user).includes("ALL");

export const canUserAccessClub = (
  user: ScopedUser,
  club?: Pick<Club, "id" | "region">,
): boolean => {
  if (!club) return false;
  if (hasAllRegionScope(user) || hasAllClubScope(user)) return true;

  const assignedClubIds = getAssignedClubIds(user);
  if (assignedClubIds.includes(club.id)) return true;

  const assignedRegionIds = getAssignedRegionIds(user);
  return Boolean(club.region && assignedRegionIds.includes(club.region));
};

export const getAssignableUsersForClub = (
  users: User[],
  club?: Pick<Club, "id" | "region">,
): User[] =>
  users
    .filter((user) => user.is_active !== false && canUserAccessClub(user, club))
    .sort((first, second) => {
      const firstClubMatch = club && getAssignedClubIds(first).includes(club.id);
      const secondClubMatch = club && getAssignedClubIds(second).includes(club.id);
      if (firstClubMatch !== secondClubMatch) return firstClubMatch ? -1 : 1;

      const firstRegionMatch =
        club?.region && getAssignedRegionIds(first).includes(club.region);
      const secondRegionMatch =
        club?.region && getAssignedRegionIds(second).includes(club.region);
      if (firstRegionMatch !== secondRegionMatch) return firstRegionMatch ? -1 : 1;

      return first.name.localeCompare(second.name);
    });
