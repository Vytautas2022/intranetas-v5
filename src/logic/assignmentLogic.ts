import { clubs } from "../mock-db/clubs";
import { users, User } from "../mock-db/users";
import { orderConfig, periodicTemplates, faultAssignment } from "../mock-db/admin";

export function resolveAssignee({ type, subtype, product_id, template_id, club_id }: any): string {
    if (type === "ORDER") {
        const cfg = orderConfig.find(o => (product_id && o.product_id === product_id) || (subtype && o.category === subtype));
        return cfg?.assigned_to || "OPS";
    }

    if (type === "PERIODIC") {
        const tpl = periodicTemplates.find(t => t.id === template_id);
        return tpl?.assigned_to || "OPS";
    }

    if (type === "FAULT") {
        const cfg = faultAssignment.find(f => f.type === subtype);
        return cfg?.assigned_to || "OPS";
    }

    return "OPS";
}

export function findCoordinatorForClub(clubId: string): User | null {
  const club = clubs.find(c => c.id === clubId);
  if (!club) return null;

  // 1. Try to find by coordinator_id in club
  if (club.coordinator_id) {
    const userById = users.find(u => u.id === club.coordinator_id);
    if (userById) return userById;
  }

  // 2. Fallback: Search by assigned_clubs in users
  const userByAssignedClubs = users.find(u => u.assigned_clubs?.includes(clubId));
  if (userByAssignedClubs) return userByAssignedClubs;

  // 3. Fallback: Search by region (if the user mentioned region in the prompt)
  if (club.region) {
    const userByRegion = users.find(u => u.region === club.region && u.role === 'COORDINATOR');
    if (userByRegion) return userByRegion;
  }

  return null;
}

export function assignManager(clubId: string): string | null {
  const coordinator = findCoordinatorForClub(clubId);
  return coordinator ? coordinator.name : null;
}
