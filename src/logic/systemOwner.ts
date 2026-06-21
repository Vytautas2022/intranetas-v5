import type { User } from "../mock-db/users";

export const SYSTEM_OWNER_EMAIL = "vytautas@sportgates.lt";
export const SYSTEM_OWNER_GOOGLE_FALLBACK_EMAIL = "vytautas.fitsport@gmail.com";
export const SYSTEM_OWNER_ID = "u7";
export const SYSTEM_OWNER_ROLE = "SYSTEM_OWNER";
export const SUPER_ADMIN_ROLE_ID = "role-super-admin";

const normalizeEmail = (email?: string) => email?.trim().toLowerCase() || "";

export const isSystemOwnerEmail = (email?: string): boolean => {
  const normalizedEmail = normalizeEmail(email);
  return (
    normalizedEmail === SYSTEM_OWNER_EMAIL ||
    normalizedEmail === SYSTEM_OWNER_GOOGLE_FALLBACK_EMAIL
  );
};

export const isSystemOwnerUser = (user?: Pick<User, "id" | "email" | "role"> | null): boolean =>
  Boolean(
    user &&
      (user.id === SYSTEM_OWNER_ID ||
        isSystemOwnerEmail(user.email) ||
        user.role === SYSTEM_OWNER_ROLE),
  );

export const createSystemOwnerUser = (): User => ({
  id: SYSTEM_OWNER_ID,
  name: "Vytautas",
  email: SYSTEM_OWNER_EMAIL,
  role: SYSTEM_OWNER_ROLE as User["role"],
  assignedRoleIds: [SUPER_ADMIN_ROLE_ID],
  assignedRegionIds: ["ALL"],
  assignedClubIds: ["ALL"],
  assigned_clubs: ["ALL"],
  region: "ALL",
  is_active: true,
});

export const enforceSystemOwnerUser = (user: User): User => {
  if (!isSystemOwnerUser(user)) return user;

  const hasRequiredOwnerShape =
    user.id === SYSTEM_OWNER_ID &&
    user.email === SYSTEM_OWNER_EMAIL &&
    user.role === SYSTEM_OWNER_ROLE &&
    user.is_active !== false &&
    Boolean(user.assignedRoleIds?.includes(SUPER_ADMIN_ROLE_ID));

  if (hasRequiredOwnerShape) return user;

  return {
    ...createSystemOwnerUser(),
    ...user,
    id: SYSTEM_OWNER_ID,
    email: SYSTEM_OWNER_EMAIL,
    role: SYSTEM_OWNER_ROLE as User["role"],
    assignedRoleIds: Array.from(
      new Set([...(user.assignedRoleIds || []), SUPER_ADMIN_ROLE_ID]),
    ),
    assignedRegionIds: user.assignedRegionIds?.length ? user.assignedRegionIds : ["ALL"],
    assignedClubIds: user.assignedClubIds?.length ? user.assignedClubIds : ["ALL"],
    assigned_clubs: user.assigned_clubs?.length ? user.assigned_clubs : ["ALL"],
    region: user.region || "ALL",
    is_active: true,
  };
};

export const userHasSuperAdmin = (user: Pick<User, "role" | "assignedRoleIds" | "is_active">): boolean =>
  user.is_active !== false &&
  (user.role === "SUPER_ADMIN" ||
    user.role === SYSTEM_OWNER_ROLE ||
    Boolean(user.assignedRoleIds?.includes(SUPER_ADMIN_ROLE_ID)));

export const ensureSystemOwner = (users: User[]): User[] => {
  let changed = false;
  const enforcedUsers = users.map((user) => {
    const nextUser = enforceSystemOwnerUser(user);
    if (nextUser !== user) changed = true;
    return nextUser;
  });
  const ownerExists = enforcedUsers.some((user) => isSystemOwnerUser(user));
  if (!ownerExists) {
    return [...enforcedUsers, createSystemOwnerUser()];
  }

  const hasSuperAdmin = enforcedUsers.some(userHasSuperAdmin);

  if (hasSuperAdmin) {
    return changed ? enforcedUsers : users;
  }

  const ownerIndex = enforcedUsers.findIndex((user) => isSystemOwnerUser(user));
  if (ownerIndex >= 0) {
    return enforcedUsers.map((user, index) =>
      index === ownerIndex ? enforceSystemOwnerUser(user) : user,
    );
  }

  return [...enforcedUsers, createSystemOwnerUser()];
};
