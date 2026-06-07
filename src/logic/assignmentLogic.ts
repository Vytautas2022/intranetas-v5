import { clubs } from "../mock-db/clubs";
import { users, User } from "../mock-db/users";
import { orderConfig, periodicTemplates, faultAssignment } from "../mock-db/admin";
import {
  canUserAccessClub,
  getAssignableUsersForClub,
  hasAllClubScope,
  hasAllRegionScope,
} from "./userScopeLogic";

const getFallbackAssignee = (clubId?: string): string => {
  const club = clubs.find((candidate) => candidate.id === clubId);
  if (!club) {
    return (
      users.find(
        (user) =>
          user.is_active !== false &&
          (hasAllRegionScope(user) || hasAllClubScope(user)),
      )?.id ||
      users.find((user) => user.is_active !== false)?.id ||
      ""
    );
  }

  return getAssignableUsersForClub(users, club)[0]?.id || "";
};

export function resolveAssignee({ type, subtype, product_id, template_id, club_id }: any): string {
    if (type === "ORDER") {
        const cfg = orderConfig.find(o => (product_id && o.product_id === product_id) || (subtype && o.category === subtype));
        return cfg?.assigned_to || getFallbackAssignee(club_id);
    }

    if (type === "PERIODIC") {
        const tpl = periodicTemplates.find(t => t.id === template_id);
        return tpl?.assigned_to || getFallbackAssignee(club_id);
    }

    if (type === "FAULT") {
        const cfg = faultAssignment.find(f => f.type === subtype);
        return cfg?.assigned_to || getFallbackAssignee(club_id);
    }

    return getFallbackAssignee(club_id);
}

export function findCoordinatorForClub(clubId: string): User | null {
  const club = clubs.find(c => c.id === clubId);
  if (!club) return null;

  // 1. Try to find by coordinator_id in club
  if (club.coordinator_id) {
    const userById = users.find(u => u.id === club.coordinator_id);
    if (userById && userById.is_active !== false && canUserAccessClub(userById, club)) return userById;
  }

  // 2. Fallback: Search by assigned_clubs in users
  const userByAssignedClubs = users.find(
    u => u.is_active !== false && canUserAccessClub(u, club) && u.assigned_clubs?.includes(clubId),
  );
  if (userByAssignedClubs) return userByAssignedClubs;

  // 3. Fallback: Search active users by assigned region/club scope.
  const scopedUser = getAssignableUsersForClub(users, club)[0];
  if (scopedUser) return scopedUser;

  return null;
}

export function assignManager(clubId: string): string | null {
  const coordinator = findCoordinatorForClub(clubId);
  return coordinator ? coordinator.name : null;
}
